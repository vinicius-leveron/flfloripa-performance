import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_REPORTS } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

const createReportSchema = z.object({
  type: z.enum(['WEEKLY', 'MONTHLY', 'CUSTOM']),
  periodStart: z.string().transform((s) => new Date(s)),
  periodEnd: z.string().transform((s) => new Date(s)),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: DEMO_REPORTS });
    }

    const { prisma } = await import('@/lib/prisma');
    const reports = await prisma.report.findMany({
      include: { generatedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const body = await request.json();
    const data = createReportSchema.parse(body);

    if (IS_DEMO) {
      return NextResponse.json({
        data: {
          report: { id: 'report-new', type: data.type, periodStart: data.periodStart, periodEnd: data.periodEnd, fileUrl: null, generatedBy: { id: session.user.id, name: session.user.name }, createdAt: new Date().toISOString() },
          summary: { totalImpressions: 68420, totalEngagement: 3850, totalReach: 45000, newLeads: 11, channelCount: 3 },
        },
      }, { status: 201 });
    }

    const { prisma } = await import('@/lib/prisma');

    const metrics = await prisma.metric.findMany({
      where: { date: { gte: data.periodStart, lte: data.periodEnd }, channel: { userId: session.user.id } },
      include: { channel: { select: { platform: true, accountName: true } } },
    });

    const leads = await prisma.lead.count({
      where: { isDeleted: false, createdAt: { gte: data.periodStart, lte: data.periodEnd } },
    });

    const report = await prisma.report.create({
      data: { type: data.type, periodStart: data.periodStart, periodEnd: data.periodEnd, generatedById: session.user.id, fileUrl: null },
      include: { generatedBy: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      data: {
        report,
        summary: {
          totalImpressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
          totalEngagement: metrics.reduce((sum, m) => sum + m.engagement, 0),
          totalReach: metrics.reduce((sum, m) => sum + m.reach, 0),
          newLeads: leads,
          channelCount: new Set(metrics.map(m => m.channelId)).size,
        },
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
