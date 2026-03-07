import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

export async function POST(request: Request) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } }, { status: 401 });
    }

    const channels = await prisma.channel.findMany({
      where: { status: 'CONNECTED' },
    });

    const results: { channelId: string; platform: string; status: string; error?: string }[] = [];

    for (const channel of channels) {
      try {
        // TODO: Implement actual API calls per platform
        // For now, we just update lastSyncAt
        await prisma.channel.update({
          where: { id: channel.id },
          data: { lastSyncAt: new Date() },
        });

        results.push({
          channelId: channel.id,
          platform: channel.platform,
          status: 'success',
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({
          channelId: channel.id,
          platform: channel.platform,
          status: 'error',
          error: message,
        });

        await prisma.channel.update({
          where: { id: channel.id },
          data: { status: 'ERROR' },
        });
      }
    }

    return NextResponse.json({
      data: {
        synced: results.filter(r => r.status === 'success').length,
        errors: results.filter(r => r.status === 'error').length,
        results,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
