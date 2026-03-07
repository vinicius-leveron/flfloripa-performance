import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_CAMPAIGNS } from '@/lib/demo-data';
import { handleApiError, AppError } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;

    if (IS_DEMO) {
      const campaign = DEMO_CAMPAIGNS.find(c => c.id === id);
      if (!campaign) throw new AppError('NOT_FOUND', 'Campanha não encontrada', 404);
      return NextResponse.json({ data: { ...campaign, metrics: [] } });
    }

    const { prisma } = await import('@/lib/prisma');
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { channel: { select: { platform: true, accountName: true } }, metrics: { orderBy: { date: 'asc' } } },
    });
    if (!campaign) throw new AppError('NOT_FOUND', 'Campanha não encontrada', 404);

    return NextResponse.json({ data: campaign });
  } catch (error) {
    return handleApiError(error);
  }
}
