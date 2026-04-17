import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';
import { syncLeadToTrello } from '@/lib/trello/sync';
import { markCardAsUpdatedByApp } from '@/lib/trello/webhook-handler';

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

    const { prisma } = await import('@/lib/prisma');

    // Get lead with current stage info
    const lead = await prisma.lead.findFirst({
      where: { id, isDeleted: false },
      include: { currentStage: { select: { id: true, position: true } } },
    });
    if (!lead) throw new AppError('NOT_FOUND', 'Lead não encontrado', 404);

    // Get target stage info
    const toStage = await prisma.funnelStage.findUnique({
      where: { id: data.toStageId },
      select: { id: true, position: true },
    });
    if (!toStage) throw new AppError('NOT_FOUND', 'Estágio não encontrado', 404);

    // Update lead in transaction
    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({
        where: { id }, data: { currentStageId: data.toStageId },
        include: { currentStage: { select: { id: true, name: true, position: true } } },
      }),
      prisma.leadEvent.create({
        data: { leadId: id, fromStageId: lead.currentStageId, toStageId: data.toStageId, notes: data.notes || null, createdById: session.user.id },
      }),
    ]);

    // Sync with Trello (async, non-blocking)
    const previousPosition = lead.currentStage.position;
    const newPosition = toStage.position;

    syncLeadToTrello(
      {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        utmSource: lead.utmSource,
        channelOrigin: lead.channelOrigin,
        trelloCardId: lead.trelloCardId,
      },
      newPosition,
      previousPosition
    ).then(async (result) => {
      // If a new card was created, update the lead with the card ID
      if (result.success && result.action === 'created' && result.cardId) {
        await prisma.lead.update({
          where: { id },
          data: { trelloCardId: result.cardId },
        });
        markCardAsUpdatedByApp(result.cardId);
      } else if (result.success && result.action === 'moved' && result.cardId) {
        markCardAsUpdatedByApp(result.cardId);
      }
    }).catch((error) => {
      console.error('[Lead Move] Trello sync error:', error);
    });

    return NextResponse.json({ data: updatedLead });
  } catch (error) {
    return handleApiError(error);
  }
}
