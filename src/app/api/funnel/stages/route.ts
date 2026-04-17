import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');

    const stages = await prisma.funnelStage.findMany({
      orderBy: { position: 'asc' },
      include: { _count: { select: { leads: { where: { isDeleted: false } } } } },
    });

    const adSpendResult = await prisma.lead.aggregate({ where: { isDeleted: false }, _sum: { adSpend: true } });
    const totalAdSpend = adSpendResult._sum.adSpend || 0;

    type StageWithCount = typeof stages[number];
    const stagesWithRates = stages.map((stage: StageWithCount, index: number) => ({
      id: stage.id, name: stage.name, position: stage.position, description: stage.description, source: stage.source,
      leadCount: stage._count.leads,
      conversionRate: index > 0 && stages[index - 1]._count.leads > 0
        ? Math.round((stage._count.leads / stages[index - 1]._count.leads) * 10000) / 100
        : index === 0 ? 100 : 0,
    }));

    const totalLeads = stages.reduce((sum: number, s: StageWithCount) => sum + s._count.leads, 0);
    const ingressoStage = stages.find((s: StageWithCount) => s.position === 6);
    const totalIngressos = ingressoStage?._count.leads || 0;
    const leadStage = stages.find((s: StageWithCount) => s.position === 1);
    const overallConversionRate = leadStage && leadStage._count.leads > 0
      ? Math.round((totalIngressos / leadStage._count.leads) * 10000) / 100 : 0;

    return NextResponse.json({
      data: stagesWithRates,
      metrics: { totalLeads, totalIngressos, overallConversionRate, totalAdSpend: Math.round(totalAdSpend * 100) / 100, costPerIngresso: totalIngressos > 0 ? Math.round((totalAdSpend / totalIngressos) * 100) / 100 : 0 },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
