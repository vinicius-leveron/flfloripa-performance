import { NextResponse } from 'next/server';
import { processWebhook, formatWebhookForLog } from '@/lib/trello/webhook-handler';
import { handleApiError } from '@/lib/api-error';

/**
 * HEAD request - Trello sends this to verify the webhook URL
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

/**
 * POST request - Receives webhook events from Trello
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Log the webhook event
    console.log(formatWebhookForLog(payload));

    // Process the webhook
    const result = await processWebhook(payload);

    // If a stage update is needed, update the lead
    if (result.processed && result.action === 'stage_update' && result.leadId && result.newStagePosition) {
      const { prisma } = await import('@/lib/prisma');

      // Find the target stage
      const targetStage = await prisma.funnelStage.findFirst({
        where: { position: result.newStagePosition },
      });

      if (targetStage) {
        // Get the lead and their current stage
        const lead = await prisma.lead.findUnique({
          where: { id: result.leadId },
          include: { currentStage: true },
        });

        if (lead && lead.currentStage.position !== result.newStagePosition) {
          // Find a system user for the event
          const systemUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
          });

          if (systemUser) {
            // Update lead stage
            await prisma.lead.update({
              where: { id: result.leadId },
              data: { currentStageId: targetStage.id },
            });

            // Create lead event
            await prisma.leadEvent.create({
              data: {
                leadId: result.leadId,
                fromStageId: lead.currentStageId,
                toStageId: targetStage.id,
                createdById: systemUser.id,
                notes: 'Atualizado via Trello SIPE',
              },
            });

            console.log(`[Trello Webhook] Updated lead ${result.leadId} to stage ${targetStage.name}`);
          }
        }
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Trello Webhook] Error processing webhook:', error);
    return handleApiError(error);
  }
}
