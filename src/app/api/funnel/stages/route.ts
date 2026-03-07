import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_STAGES, DEMO_FUNNEL_METRICS } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: DEMO_STAGES, metrics: DEMO_FUNNEL_METRICS.metrics });
    }

    const { prisma } = await import('@/lib/prisma');

    const stages = await prisma.funnelStage.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { leads: { where: { isDeleted: false } } } } },
    });

    const adSpendResult = await prisma.lead.aggregate({ where: { isDeleted: false }, _sum: { adSpend: true } });
    const totalAdSpend = adSpendResult._sum.adSpend || 0;

    const stagesWithRates = stages.map((stage, index) => ({
      id: stage.id, name: stage.name, position: stage.position, description: stage.description, source: stage.source,
      leadCount: stage._count.leads,
      conversionRate: index > 0 && stages[index - 1]._count.leads > 0
        ? Math.round((stage._count.leads / stages[index - 1]._count.leads) * 10000) / 100
        : index === 0 ? 100 : 0,
    }));

    const totalLeads = stages.reduce((sum, s) => sum + s._count.leads, 0);
    const ingressoStage = stages.find(s => s.position === 7);
    const totalIngressos = ingressoStage?._count.leads || 0;
    const impactadoStage = stages.find(s => s.position === 1);
    const overallConversionRate = impactadoStage && impactadoStage._count.leads > 0
      ? Math.round((totalIngressos / impactadoStage._count.leads) * 10000) / 100 : 0;

    return NextResponse.json({
      data: stagesWithRates,
      metrics: { totalLeads, totalIngressos, overallConversionRate, totalAdSpend: Math.round(totalAdSpend * 100) / 100, costPerIngresso: totalIngressos > 0 ? Math.round((totalAdSpend / totalIngressos) * 100) / 100 : 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
