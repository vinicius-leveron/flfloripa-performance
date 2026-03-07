import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, AppError } from '@/lib/api-error';

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
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
    const data = updateLeadSchema.parse(body);

    const existing = await prisma.lead.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new AppError('NOT_FOUND', 'Lead não encontrado', 404);

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        ...data,
        email: data.email || null,
      },
      include: {
        currentStage: { select: { id: true, name: true, position: true } },
        registeredBy: { select: { id: true, name: true } },
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
    await prisma.lead.update({ where: { id }, data: { isDeleted: true } });
    return NextResponse.json({ data: { message: 'Lead removido' } });
  } catch (error) {
    return handleApiError(error);
  }
}
