import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';

export async function POST(
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

    const channel = await prisma.channel.findFirst({ where: { id, userId: session.user.id, status: 'CONNECTED' } });
    if (!channel) throw new AppError('NOT_FOUND', 'Canal não encontrado ou desconectado', 404);

    if (!channel.accessToken) {
      throw new AppError('VALIDATION_ERROR', 'Canal sem token de acesso. Reconecte via OAuth.', 400);
    }

    // TODO: Implementar fetch real das APIs de cada plataforma
    // - Instagram: Graph API /me/insights
    // - TikTok: /v2/research/user/info
    // - YouTube: YouTube Analytics API
    // Por enquanto apenas atualiza o timestamp de sync
    await prisma.channel.update({ where: { id }, data: { lastSyncAt: new Date() } });

    return NextResponse.json({ data: { message: 'Sincronização iniciada (stub — integração pendente)', channelId: id } });
  } catch (error) {
    return handleApiError(error);
  }
}
