import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_CHANNELS } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: DEMO_CHANNELS });
    }

    const { prisma } = await import('@/lib/prisma');
    const channels = await prisma.channel.findMany({
      where: { userId: session.user.id },
      select: { id: true, platform: true, accountName: true, accountId: true, status: true, lastSyncAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: channels });
  } catch (error) {
    return handleApiError(error);
  }
}
