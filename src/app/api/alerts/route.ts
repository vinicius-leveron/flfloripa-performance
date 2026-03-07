import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_ALERTS } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      const url = new URL(request.url);
      const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
      const filtered = unreadOnly ? DEMO_ALERTS.filter(a => !a.isRead) : DEMO_ALERTS;
      return NextResponse.json({ data: filtered });
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
