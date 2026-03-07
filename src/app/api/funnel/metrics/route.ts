import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_FUNNEL_METRICS } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: DEMO_FUNNEL_METRICS });
    }

    const { prisma } = await import('@/lib/prisma');
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    const channelOrigin = url.searchParams.get('channelOrigin');

    // Calculate date filter
    const now = new Date();
    const daysMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90 };
    const days = daysMap[period];
    const dateFilter = days
      ? { gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000) }
      : undefined;

    const leadWhere: Record<string, unknown> = { isDeleted: false };
    if (dateFilter) leadWhere.createdAt = dateFilter;
    if (channelOrigin) leadWhere.channelOrigin = channelOrigin;

    // Get all stages
    const stages = await prisma.funnelStage.findMany({
      orderBy: { position: 'asc' },
    });

    // Count leads per stage
    const stageCounts = await Promise.all(
      stages.map(async (stage) => {
        const count = await prisma.lead.count({
          where: { ...leadWhere, currentStageId: stage.id },
        });
        return { stageId: stage.id, count };
      })
    );

    const stageCountMap = Object.fromEntries(stageCounts.map(sc => [sc.stageId, sc.count]));

    // Total leads and ingressos
    const totalLeads = await prisma.lead.count({ where: leadWhere });
    const ingressoStage = stages.find(s => s.position === 7);
    const totalIngressos = ingressoStage ? (stageCountMap[ingressoStage.id] || 0) : 0;

    // Ad spend totals
    const adSpendResult = await prisma.lead.aggregate({
      where: leadWhere,
      _sum: { adSpend: true },
    });
    const totalAdSpend = adSpendResult._sum.adSpend || 0;

    // Inscrito atividade count (position 3+)
    const inscritoStage = stages.find(s => s.position === 3);
    const inscritosCount = inscritoStage ? (stageCountMap[inscritoStage.id] || 0) : 0;

    // Cost per lead = total ad spend / inscritos atividade
    const costPerLead = inscritosCount > 0 ? totalAdSpend / inscritosCount : 0;
    const costPerIngresso = totalIngressos > 0 ? totalAdSpend / totalIngressos : 0;

    // Overall conversion rate (impactado → ingressou)
    const impactadoStage = stages.find(s => s.position === 1);
    const impactadoCount = impactadoStage ? (stageCountMap[impactadoStage.id] || 0) : 0;
    const overallConversionRate = impactadoCount > 0
      ? Math.round((totalIngressos / impactadoCount) * 10000) / 100
      : 0;

    // Stages with conversion rates
    const stagesWithMetrics = stages.map((stage, index) => {
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
      channelBreakdownRaw.map(async (ch) => {
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

    return NextResponse.json({
      data: {
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
