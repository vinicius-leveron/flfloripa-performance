import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const stages = await prisma.funnelStage.findMany({
      orderBy: { position: 'asc' },
      include: {
        _count: {
          select: { leads: { where: { isDeleted: false } } },
        },
      },
    });

    // Calculate conversion rates between adjacent stages
    const stagesWithRates = stages.map((stage, index) => ({
      id: stage.id,
      name: stage.name,
      position: stage.position,
      description: stage.description,
      leadCount: stage._count.leads,
      conversionRate: index > 0 && stages[index - 1]._count.leads > 0
        ? Math.round((stage._count.leads / stages[index - 1]._count.leads) * 10000) / 100
        : index === 0 ? 100 : 0,
    }));

    return NextResponse.json({ data: stagesWithRates });
  } catch (error) {
    return handleApiError(error);
  }
}
