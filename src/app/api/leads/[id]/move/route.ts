import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { handleApiError, AppError } from '@/lib/api-error';

const moveSchema = z.object({
  toStageId: z.string(),
  notes: z.string().optional(),
});

export async function POST(
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
    const data = moveSchema.parse(body);

    const lead = await prisma.lead.findFirst({ where: { id, isDeleted: false } });
    if (!lead) throw new AppError('NOT_FOUND', 'Lead não encontrado', 404);

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: { currentStageId: data.toStageId },
        include: {
          currentStage: { select: { id: true, name: true, position: true } },
        },
      }),
      prisma.leadEvent.create({
        data: {
          leadId: id,
          fromStageId: lead.currentStageId,
          toStageId: data.toStageId,
          notes: data.notes || null,
          createdById: session.user.id,
        },
      }),
    ]);

    return NextResponse.json({ data: updatedLead });
  } catch (error) {
    return handleApiError(error);
  }
}
