import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_CALENDAR } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

const contentThemeValues = ['ENSINAMENTO', 'CONVITE', 'EXPERIENCIA', 'REFORCO_CONVITE', 'DICA_LEITURA', 'PODCAST', 'DIVULGACAO', 'OUTRO'] as const;
const contentFormatValues = ['FEED_POST', 'REEL', 'STORY', 'VIDEO_LONGO', 'IMAGEM_ESTATICA', 'EVENTO', 'REPOST', 'OUTRO'] as const;

const createEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  channelId: z.string().optional(),
  category: z.enum(['EDUCATIONAL', 'INSTITUTIONAL', 'INVITE', 'TESTIMONY']),
  contentTheme: z.enum(contentThemeValues).optional(),
  contentFormat: z.enum(contentFormatValues).optional(),
  assigneeId: z.string().optional(),
  scheduledDate: z.string().transform((s) => new Date(s)),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: DEMO_CALENDAR });
    }

    const { prisma } = await import('@/lib/prisma');
    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);
    const channelId = url.searchParams.get('channelId');
    const assigneeId = url.searchParams.get('assigneeId');
    const contentTheme = url.searchParams.get('contentTheme');
    const contentFormat = url.searchParams.get('contentFormat');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const where: Record<string, unknown> = { scheduledDate: { gte: startDate, lte: endDate } };
    if (channelId) where.channelId = channelId;
    if (assigneeId) where.assigneeId = assigneeId;
    if (contentTheme) where.contentTheme = contentTheme;
    if (contentFormat) where.contentFormat = contentFormat;

    const entries = await prisma.contentCalendarEntry.findMany({
      where,
      include: { channel: { select: { platform: true, accountName: true } }, assignee: { select: { id: true, name: true } } },
      orderBy: { scheduledDate: 'asc' },
    });

    return NextResponse.json({ data: entries });
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
    const data = createEntrySchema.parse(body);

    if (IS_DEMO) {
      return NextResponse.json({
        data: { id: 'cal-new', ...data, channel: null, assignee: null, status: 'PLANNED', createdAt: new Date().toISOString() },
      }, { status: 201 });
    }

    const { prisma } = await import('@/lib/prisma');
    const entry = await prisma.contentCalendarEntry.create({
      data: {
        title: data.title, description: data.description, channelId: data.channelId || null,
        category: data.category, contentTheme: data.contentTheme || null, contentFormat: data.contentFormat || null,
        assigneeId: data.assigneeId || null, scheduledDate: data.scheduledDate,
      },
      include: { channel: { select: { platform: true, accountName: true } }, assignee: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
