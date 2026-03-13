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
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    const where: Record<string, unknown> = {};
    if (unreadOnly) where.isRead = false;

    const alerts = await prisma.alert.findMany({
      where,
      include: { channel: { select: { platform: true, accountName: true } }, campaign: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }, take: 50,
    });

    return NextResponse.json({ data: alerts });
  } catch (error) {
    return handleApiError(error);
  }
}
