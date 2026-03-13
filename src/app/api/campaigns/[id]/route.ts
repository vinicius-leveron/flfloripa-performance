import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
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
