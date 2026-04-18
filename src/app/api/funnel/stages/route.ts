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
    const funnelId = url.searchParams.get('funnelId');
    const funnelSlug = url.searchParams.get('funnelSlug');

    // Build filter for stages
    const stageWhere: Record<string, unknown> = {};
    if (funnelId) {
      stageWhere.funnelId = funnelId;
    } else if (funnelSlug) {
      const funnel = await prisma.funnel.findUnique({ where: { slug: funnelSlug } });
      if (funnel) stageWhere.funnelId = funnel.id;
    }

    // If no filter provided, get stages from the default funnel
    if (!funnelId && !funnelSlug) {
      const defaultFunnel = await prisma.funnel.findFirst({ where: { isDefault: true } });
      if (defaultFunnel) stageWhere.funnelId = defaultFunnel.id;
    }

    const stages = await prisma.funnelStage.findMany({
      where: stageWhere,
      orderBy: { position: 'asc' },
      include: {
        funnel: { select: { id: true, name: true, slug: true, color: true } },
        _count: { select: { leads: { where: { isDeleted: false } } } },
      },
    });

    // Build filter for leads based on funnel
    const leadWhere: Record<string, unknown> = { isDeleted: false };
    if (stageWhere.funnelId) {
      leadWhere.funnelId = stageWhere.funnelId;
    }

    const adSpendResult = await prisma.lead.aggregate({ where: leadWhere, _sum: { adSpend: true } });
    const totalAdSpend = adSpendResult._sum.adSpend || 0;

    type StageWithCount = typeof stages[number];
    const stagesWithRates = stages.map((stage: StageWithCount, index: number) => ({
      id: stage.id,
      name: stage.name,
      position: stage.position,
      description: stage.description,
      source: stage.source,
      syncTrello: stage.syncTrello,
      funnelId: stage.funnelId,
      funnel: stage.funnel,
      leadCount: stage._count.leads,
      conversionRate: index > 0 && stages[index - 1]._count.leads > 0
        ? Math.round((stage._count.leads / stages[index - 1]._count.leads) * 10000) / 100
        : index === 0 ? 100 : 0,
    }));

    const totalLeads = stages.reduce((sum: number, s: StageWithCount) => sum + s._count.leads, 0);
    // Find "Ingressou" stage by name (final stage in each funnel)
    const ingressoStage = stages.find((s: StageWithCount) => s.name === 'Ingressou');
    const totalIngressos = ingressoStage?._count.leads || 0;
    // First stage is always position 1
    const firstStage = stages.find((s: StageWithCount) => s.position === 1);
    const overallConversionRate = firstStage && firstStage._count.leads > 0
      ? Math.round((totalIngressos / firstStage._count.leads) * 10000) / 100 : 0;

    return NextResponse.json({
      data: stagesWithRates,
      metrics: {
        totalLeads,
        totalIngressos,
        overallConversionRate,
        totalAdSpend: Math.round(totalAdSpend * 100) / 100,
        costPerIngresso: totalIngressos > 0 ? Math.round((totalAdSpend / totalIngressos) * 100) / 100 : 0,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
