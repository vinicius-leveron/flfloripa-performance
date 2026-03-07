import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

function getDateRange(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  let days = 7;
  if (period === '30d') days = 30;
  else if (period === '90d') days = 90;

  const start = new Date(end);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  prevEnd.setHours(23, 59, 59, 999);

  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - days);
  prevStart.setHours(0, 0, 0, 0);

  return { start, end, prevStart, prevEnd };
}

function getTrendDirection(current: number, previous: number): 'up' | 'down' | 'stable' {
  if (previous === 0) return current > 0 ? 'up' : 'stable';
  const change = ((current - previous) / previous) * 100;
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';
    const channelId = url.searchParams.get('channelId');

    const { start, end, prevStart, prevEnd } = getDateRange(period);

    const channelFilter = channelId
      ? { channelId }
      : { channel: { userId: session.user.id } };

    const [currentMetrics, previousMetrics] = await Promise.all([
      prisma.metric.findMany({
        where: {
          ...channelFilter,
          date: { gte: start, lte: end },
        },
        include: { channel: { select: { platform: true, accountName: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.metric.findMany({
        where: {
          ...channelFilter,
          date: { gte: prevStart, lte: prevEnd },
        },
      }),
    ]);

    const sumMetrics = (metrics: { impressions: number; reach: number; engagement: number; followersCount: number }[]) => ({
      impressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
      reach: metrics.reduce((sum, m) => sum + m.reach, 0),
      engagement: metrics.reduce((sum, m) => sum + m.engagement, 0),
      followers: metrics.length > 0
        ? Math.max(...metrics.map(m => m.followersCount))
        : 0,
    });

    const current = sumMetrics(currentMetrics);
    const previous = sumMetrics(previousMetrics);

    const engagementRate = current.impressions > 0
      ? (current.engagement / current.impressions) * 100
      : 0;
    const prevEngagementRate = previous.impressions > 0
      ? (previous.engagement / previous.impressions) * 100
      : 0;

    // Group by day for chart
    const byDay = new Map<string, { date: string; impressions: number; engagement: number; reach: number }>();
    for (const m of currentMetrics) {
      const dateKey = m.date.toISOString().split('T')[0];
      const existing = byDay.get(dateKey) || { date: dateKey, impressions: 0, engagement: 0, reach: 0 };
      existing.impressions += m.impressions;
      existing.engagement += m.engagement;
      existing.reach += m.reach;
      byDay.set(dateKey, existing);
    }

    // Group by channel for comparison
    const byChannel = new Map<string, { platform: string; name: string; impressions: number; engagement: number; followers: number }>();
    for (const m of currentMetrics) {
      const key = m.channelId;
      const existing = byChannel.get(key) || {
        platform: m.channel.platform,
        name: m.channel.accountName,
        impressions: 0,
        engagement: 0,
        followers: 0,
      };
      existing.impressions += m.impressions;
      existing.engagement += m.engagement;
      existing.followers = Math.max(existing.followers, m.followersCount);
      byChannel.set(key, existing);
    }

    return NextResponse.json({
      data: {
        kpis: {
          totalImpressions: current.impressions,
          totalEngagement: current.engagement,
          totalFollowers: current.followers,
          engagementRate: Math.round(engagementRate * 100) / 100,
        },
        trends: {
          impressions: {
            current: current.impressions,
            previous: previous.impressions,
            change: previous.impressions > 0
              ? Math.round(((current.impressions - previous.impressions) / previous.impressions) * 10000) / 100
              : 0,
            direction: getTrendDirection(current.impressions, previous.impressions),
          },
          engagement: {
            current: current.engagement,
            previous: previous.engagement,
            change: previous.engagement > 0
              ? Math.round(((current.engagement - previous.engagement) / previous.engagement) * 10000) / 100
              : 0,
            direction: getTrendDirection(current.engagement, previous.engagement),
          },
          followers: {
            current: current.followers,
            previous: previous.followers,
            change: previous.followers > 0
              ? Math.round(((current.followers - previous.followers) / previous.followers) * 10000) / 100
              : 0,
            direction: getTrendDirection(current.followers, previous.followers),
          },
          engagementRate: {
            current: engagementRate,
            previous: prevEngagementRate,
            change: prevEngagementRate > 0
              ? Math.round(((engagementRate - prevEngagementRate) / prevEngagementRate) * 10000) / 100
              : 0,
            direction: getTrendDirection(engagementRate, prevEngagementRate),
          },
        },
        chartData: {
          byDay: Array.from(byDay.values()),
          byChannel: Array.from(byChannel.values()),
        },
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
