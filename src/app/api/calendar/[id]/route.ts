import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, AppError } from '@/lib/api-error';

const updateEntrySchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  channelId: z.string().nullable().optional(),
  category: z.enum(['EDUCATIONAL', 'INSTITUTIONAL', 'INVITE', 'TESTIMONY']).optional(),
  assigneeId: z.string().nullable().optional(),
  status: z.enum(['PLANNED', 'CREATED', 'PUBLISHED']).optional(),
  scheduledDate: z.string().transform((s) => new Date(s)).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateEntrySchema.parse(body);

    const existing = await prisma.contentCalendarEntry.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Entrada não encontrada', 404);
    }

    const updated = await prisma.contentCalendarEntry.update({
      where: { id },
      data,
      include: {
        channel: { select: { platform: true, accountName: true } },
        assignee: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    await prisma.contentCalendarEntry.delete({ where: { id } });
    return NextResponse.json({ data: { message: 'Entrada removida' } });
  } catch (error) {
    return handleApiError(error);
  }
}
