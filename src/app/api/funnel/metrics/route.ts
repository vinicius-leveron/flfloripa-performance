import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    const channelOrigin = url.searchParams.get('channelOrigin');
    const funnelId = url.searchParams.get('funnelId');
    const funnelSlug = url.searchParams.get('funnelSlug');

    // Calculate date filter
    const now = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];
    const dateFilter = days
      ? { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) }
      : undefined;

    // Determine funnel filter
    let targetFunnelId: string | undefined;
    if (funnelId) {
      targetFunnelId = funnelId;
    } else if (funnelSlug) {
      const funnel = await prisma.funnel.findUnique({ where: { slug: funnelSlug } });
      if (funnel) targetFunnelId = funnel.id;
    } else {
      const defaultFunnel = await prisma.funnel.findFirst({ where: { isDefault: true } });
      if (defaultFunnel) targetFunnelId = defaultFunnel.id;
    }

    const leadWhere: Record<string, unknown> = { isDeleted: false };
    if (dateFilter) leadWhere.createdAt = dateFilter;
    if (channelOrigin) leadWhere.channelOrigin = channelOrigin;
    if (targetFunnelId) leadWhere.funnelId = targetFunnelId;

    // Get stages for the selected funnel
    const stageWhere: Record<string, unknown> = {};
    if (targetFunnelId) stageWhere.funnelId = targetFunnelId;

    const stages = await prisma.funnelStage.findMany({
      where: stageWhere,
      orderBy: { position: 'asc' },
      include: { funnel: { select: { id: true, name: true, slug: true, color: true } } },
    });

    // Count leads per stage
    const stageCounts = await Promise.all(
      stages.map(async (stage: typeof stages[number]) => {
        const count = await prisma.lead.count({
          where: { ...leadWhere, currentStageId: stage.id },
        });
        return { stageId: stage.id, count };
      })
    );

    const stageCountMap = Object.fromEntries(stageCounts.map((sc: { stageId: string; count: number }) => [sc.stageId, sc.count]));

    // Total leads and ingressos
    const totalLeads = await prisma.lead.count({ where: leadWhere });
    // Find "Ingressou" stage by name (last stage before dropout)
    const ingressoStage = stages.find((s: typeof stages[number]) => s.name === 'Ingressou');
    const totalIngressos = ingressoStage ? (stageCountMap[ingressoStage.id] || 0) : 0;

    // Ad spend totals
    const adSpendResult = await prisma.lead.aggregate({
      where: leadWhere,
      _sum: { adSpend: true },
    });
    const totalAdSpend = adSpendResult._sum.adSpend || 0;

    // Find "Visitou Sede" stage for cost per lead calculation
    const visitouStage = stages.find((s: typeof stages[number]) => s.name === 'Visitou Sede');
    const visitouCount = visitouStage ? (stageCountMap[visitouStage.id] || 0) : 0;

    // Cost per lead = total ad spend / visitou sede
    const costPerLead = visitouCount > 0 ? totalAdSpend / visitouCount : 0;
    const costPerIngresso = totalIngressos > 0 ? totalAdSpend / totalIngressos : 0;

    // Overall conversion rate (first stage → ingressou)
    const firstStage = stages.find((s: typeof stages[number]) => s.position === 1);
    const firstStageCount = firstStage ? (stageCountMap[firstStage.id] || 0) : 0;
    const overallConversionRate = firstStageCount > 0
      ? Math.round((totalIngressos / firstStageCount) * 10000) / 100
      : 0;

    // Stages with conversion rates
    const stagesWithMetrics = stages.map((stage: typeof stages[number], index: number) => {
      const count = stageCountMap[stage.id] || 0;
      const prevCount = index > 0 ? (stageCountMap[stages[index - 1].id] || 0) : 0;
      const conversionRate = index > 0 && prevCount > 0
        ? Math.round((count / prevCount) * 10000) / 100
        : index === 0 ? 100 : 0;

      return {
        id: stage.id,
        name: stage.name,
        position: stage.position,
        description: stage.description,
        source: stage.source,
        syncTrello: stage.syncTrello,
        funnelId: stage.funnelId,
        funnel: stage.funnel,
        leadCount: count,
        conversionRate,
      };
    });

    // Breakdown by channel origin
    const channelBreakdownRaw = await prisma.lead.groupBy({
      by: ['channelOrigin'],
      where: { ...leadWhere, channelOrigin: { not: null } },
      _count: true,
      _sum: { adSpend: true },
    });

    const channelBreakdown = await Promise.all(
      channelBreakdownRaw.map(async (ch: typeof channelBreakdownRaw[number]) => {
        const ingressosForChannel = ingressoStage
          ? await prisma.lead.count({
              where: { ...leadWhere, channelOrigin: ch.channelOrigin, currentStageId: ingressoStage.id },
            })
          : 0;

        const channelAdSpend = ch._sum.adSpend || 0;
        return {
          channel: ch.channelOrigin,
          leads: ch._count,
          ingressos: ingressosForChannel,
          conversionRate: ch._count > 0
            ? Math.round((ingressosForChannel / ch._count) * 10000) / 100
            : 0,
          adSpend: channelAdSpend,
          costPerIngresso: ingressosForChannel > 0 ? channelAdSpend / ingressosForChannel : 0,
        };
      })
    );

    // Get funnel info for response
    const currentFunnel = targetFunnelId
      ? await prisma.funnel.findUnique({ where: { id: targetFunnelId } })
      : null;

    return NextResponse.json({
      data: {
        funnel: currentFunnel,
        stages: stagesWithMetrics,
        metrics: {
          totalLeads,
          totalIngressos,
          overallConversionRate,
          totalAdSpend: Math.round(totalAdSpend * 100) / 100,
          costPerLead: Math.round(costPerLead * 100) / 100,
          costPerIngresso: Math.round(costPerIngresso * 100) / 100,
        },
        channelBreakdown,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
