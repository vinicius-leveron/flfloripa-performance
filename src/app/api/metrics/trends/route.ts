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
    const channelId = url.searchParams.get('channelId');
    const days = parseInt(url.searchParams.get('days') || '30', 10);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const channelFilter = channelId ? { channelId } : { channel: { userId: session.user.id } };

    const metrics = await prisma.metric.findMany({
      where: { ...channelFilter, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });

    const dailyData = new Map<string, { date: string; impressions: number; engagement: number; reach: number; followers: number }>();
    for (const m of metrics) {
      const key = m.date.toISOString().split('T')[0];
      const existing = dailyData.get(key) || { date: key, impressions: 0, engagement: 0, reach: 0, followers: 0 };
      existing.impressions += m.impressions;
      existing.engagement += m.engagement;
      existing.reach += m.reach;
      existing.followers = Math.max(existing.followers, m.followersCount);
      dailyData.set(key, existing);
    }

    return NextResponse.json({ data: Array.from(dailyData.values()) });
  } catch (error) {
    return handleApiError(error);
  }
}
