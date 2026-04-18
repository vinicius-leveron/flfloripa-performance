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

    const funnels = await prisma.funnel.findMany({
      orderBy: { isDefault: 'desc' },
      include: {
        _count: { select: { leads: { where: { isDeleted: false } }, stages: true } },
        stages: {
          orderBy: { position: 'asc' },
          select: { id: true, name: true, position: true, syncTrello: true },
        },
      },
    });

    return NextResponse.json({ data: funnels });
  } catch (error) {
    return handleApiError(error);
  }
}
