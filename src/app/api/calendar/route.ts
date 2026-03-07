import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api-error';

const createEntrySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  channelId: z.string().optional(),
  category: z.enum(['EDUCATIONAL', 'INSTITUTIONAL', 'INVITE', 'TESTIMONY']),
  assigneeId: z.string().optional(),
  scheduledDate: z.string().transform((s) => new Date(s)),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1), 10);
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()), 10);

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const entries = await prisma.contentCalendarEntry.findMany({
      where: {
        scheduledDate: { gte: startDate, lte: endDate },
      },
      include: {
        channel: { select: { platform: true, accountName: true } },
        assignee: { select: { id: true, name: true } },
      },
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

    const entry = await prisma.contentCalendarEntry.create({
      data: {
        title: data.title,
        description: data.description,
        channelId: data.channelId || null,
        category: data.category,
        assigneeId: data.assigneeId || null,
        scheduledDate: data.scheduledDate,
      },
      include: {
        channel: { select: { platform: true, accountName: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: entry }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
