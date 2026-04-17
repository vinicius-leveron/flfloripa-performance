import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { syncLeadToTrello, clearListCache } from '@/lib/trello/sync';
import { markCardAsUpdatedByApp } from '@/lib/trello/webhook-handler';
import { shouldSyncWithTrello } from '@/lib/trello/mapping';

/**
 * Force sync all leads in Trello-synced stages to Trello
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');

    // Clear list cache to get fresh data
    clearListCache();

    // Get all stages that sync with Trello
    const stages = await prisma.funnelStage.findMany({
      where: { position: { gte: 3 } },
      orderBy: { position: 'asc' },
    });

    // Get all leads in Trello-synced stages
    const leads = await prisma.lead.findMany({
      where: {
        isDeleted: false,
        currentStageId: { in: stages.map((s) => s.id) },
      },
      include: {
        currentStage: true,
      },
    });

    const results = {
      total: leads.length,
      created: 0,
      moved: 0,
      failed: 0,
      skipped: 0,
    };

    for (const lead of leads) {
      const stagePosition = lead.currentStage.position;

      if (!shouldSyncWithTrello(stagePosition)) {
        results.skipped++;
        continue;
      }

      // Determine previous stage (for sync logic)
      // If lead already has a card, it's a move; otherwise it's a create
      const previousStage = lead.trelloCardId ? stagePosition : 1;

      const result = await syncLeadToTrello(
        {
          id: lead.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          utmSource: lead.utmSource,
          channelOrigin: lead.channelOrigin,
          trelloCardId: lead.trelloCardId,
        },
        stagePosition,
        previousStage
      );

      if (result.success) {
        if (result.action === 'created') {
          results.created++;

          // Update lead with new card ID
          if (result.cardId) {
            await prisma.lead.update({
              where: { id: lead.id },
              data: { trelloCardId: result.cardId },
            });
            markCardAsUpdatedByApp(result.cardId);
          }
        } else if (result.action === 'moved') {
          results.moved++;
          if (result.cardId) {
            markCardAsUpdatedByApp(result.cardId);
          }
        } else {
          results.skipped++;
        }
      } else {
        results.failed++;
        console.error(`[Trello Sync] Failed to sync lead ${lead.id}: ${result.error}`);
      }
    }

    return NextResponse.json({
      data: {
        message: 'Sync completo',
        results,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
