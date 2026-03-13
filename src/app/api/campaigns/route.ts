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

    const campaigns = await prisma.campaign.findMany({
      include: { channel: { select: { platform: true, accountName: true } }, metrics: { orderBy: { date: 'desc' }, take: 30 }, _count: { select: { metrics: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const campaignsWithSummary = campaigns.map((c) => {
      const totalSpend = c.metrics.reduce((sum, m) => sum + m.spend, 0);
      const totalImpressions = c.metrics.reduce((sum, m) => sum + m.impressions, 0);
      const totalClicks = c.metrics.reduce((sum, m) => sum + m.clicks, 0);
      const totalConversions = c.metrics.reduce((sum, m) => sum + m.conversions, 0);
      return {
        id: c.id, name: c.name, status: c.status, objective: c.objective, budget: c.budget, startDate: c.startDate, endDate: c.endDate, channel: c.channel,
        summary: {
          totalSpend: Math.round(totalSpend * 100) / 100, totalImpressions, totalClicks, totalConversions,
          cpm: totalImpressions > 0 ? Math.round((totalSpend / totalImpressions) * 1000 * 100) / 100 : 0,
          cpc: totalClicks > 0 ? Math.round((totalSpend / totalClicks) * 100) / 100 : 0,
          ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
        },
      };
    });

    return NextResponse.json({ data: campaignsWithSummary });
  } catch (error) {
    return handleApiError(error);
  }
}
