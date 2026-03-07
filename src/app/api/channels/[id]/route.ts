import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO } from '@/lib/demo-data';
import { handleApiError, AppError } from '@/lib/api-error';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: { message: 'Canal desconectado' } });
    }

    const { prisma } = await import('@/lib/prisma');
    const { id } = await params;
    const channel = await prisma.channel.findFirst({ where: { id, userId: session.user.id } });
    if (!channel) throw new AppError('NOT_FOUND', 'Canal não encontrado', 404);
    await prisma.channel.update({ where: { id }, data: { status: 'DISCONNECTED', accessToken: '', refreshToken: null } });

    return NextResponse.json({ data: { message: 'Canal desconectado' } });
  } catch (error) {
    return handleApiError(error);
  }
}
