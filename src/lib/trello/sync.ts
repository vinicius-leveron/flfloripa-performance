/**
 * Trello Sync Logic
 *
 * Handles bidirectional sync between FLFloripa app and Trello SIPE board.
 *
 * App -> Trello: When lead moves to stage 3+ (Visitou Sede and beyond)
 * Trello -> App: When card moves between lists in SIPE board
 */

import * as trelloClient from './client';
import {
  shouldSyncWithTrello,
  getListNameForStage,
  getStageForListName,
  buildCardDescription,
  parseLeadIdFromDescription,
  MIN_TRELLO_SYNC_STAGE,
} from './mapping';

// Cache for list ID lookups (list name -> list ID)
let listIdCache: Map<string, string> | null = null;

/**
 * Get list ID by name (with caching)
 */
async function getListIdByName(listName: string): Promise<string | null> {
  if (!listIdCache) {
    const lists = await trelloClient.getLists();
    listIdCache = new Map(lists.map((list) => [list.name.toLowerCase(), list.id]));
  }

  return listIdCache.get(listName.toLowerCase()) || null;
}

/**
 * Clear the list ID cache (call when lists might have changed)
 */
export function clearListCache(): void {
  listIdCache = null;
}

/**
 * Get list name by ID
 */
async function getListNameById(listId: string): Promise<string | null> {
  const lists = await trelloClient.getLists();
  const list = lists.find((l) => l.id === listId);
  return list?.name || null;
}

interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  utmSource?: string | null;
  channelOrigin?: string | null;
  trelloCardId?: string | null;
}

interface SyncResult {
  success: boolean;
  action: 'created' | 'moved' | 'deleted' | 'none';
  cardId?: string;
  error?: string;
}

/**
 * Sync a lead to Trello when their stage changes
 *
 * @param lead - The lead data
 * @param newStagePosition - The new stage position (1-7)
 * @param previousStagePosition - The previous stage position
 * @returns SyncResult indicating what action was taken
 */
export async function syncLeadToTrello(
  lead: Lead,
  newStagePosition: number,
  previousStagePosition: number
): Promise<SyncResult> {
  // Skip if Trello is not configured
  if (!trelloClient.isTrelloConfigured()) {
    return { success: true, action: 'none' };
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const wasInTrello = previousStagePosition >= MIN_TRELLO_SYNC_STAGE;
  const shouldBeInTrello = shouldSyncWithTrello(newStagePosition);

  try {
    // Case 1: Moving OUT of Trello sync range (shouldn't happen normally)
    if (wasInTrello && !shouldBeInTrello) {
      // This is unusual - a lead moving backwards from stage 3+ to 1-2
      // We could delete the card, but for now just leave it
      return { success: true, action: 'none' };
    }

    // Case 2: Moving INTO Trello sync range (new card needed)
    if (!wasInTrello && shouldBeInTrello) {
      const listName = getListNameForStage(newStagePosition);
      if (!listName) {
        return { success: false, action: 'none', error: `No list mapping for stage ${newStagePosition}` };
      }

      const listId = await getListIdByName(listName);
      if (!listId) {
        return { success: false, action: 'none', error: `Trello list "${listName}" not found` };
      }

      const card = await trelloClient.createCard({
        name: lead.name,
        desc: buildCardDescription(lead, appBaseUrl),
        idList: listId,
      });

      return { success: true, action: 'created', cardId: card.id };
    }

    // Case 3: Already in Trello, moving between synced stages
    if (wasInTrello && shouldBeInTrello && lead.trelloCardId) {
      const listName = getListNameForStage(newStagePosition);
      if (!listName) {
        return { success: false, action: 'none', error: `No list mapping for stage ${newStagePosition}` };
      }

      const listId = await getListIdByName(listName);
      if (!listId) {
        return { success: false, action: 'none', error: `Trello list "${listName}" not found` };
      }

      // Check if card still exists
      const existingCard = await trelloClient.getCard(lead.trelloCardId);
      if (!existingCard) {
        // Card was deleted in Trello, recreate it
        const card = await trelloClient.createCard({
          name: lead.name,
          desc: buildCardDescription(lead, appBaseUrl),
          idList: listId,
        });
        return { success: true, action: 'created', cardId: card.id };
      }

      // Move card to new list
      await trelloClient.moveCard(lead.trelloCardId, listId);
      return { success: true, action: 'moved', cardId: lead.trelloCardId };
    }

    return { success: true, action: 'none' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Trello Sync] Error syncing lead to Trello:', message);
    return { success: false, action: 'none', error: message };
  }
}

/**
 * Handle a Trello webhook event (card moved)
 *
 * @param action - The Trello action object from the webhook
 * @returns The lead ID and new stage position if sync is needed
 */
export async function handleTrelloWebhook(
  action: {
    type: string;
    data: {
      card?: { id: string; name: string; desc?: string };
      listBefore?: { id: string; name: string };
      listAfter?: { id: string; name: string };
    };
  }
): Promise<{ leadId: string; newStagePosition: number } | null> {
  // Only handle updateCard actions where the card moved between lists
  if (action.type !== 'updateCard') {
    return null;
  }

  const { card, listBefore, listAfter } = action.data;
  if (!card || !listBefore || !listAfter) {
    return null;
  }

  // Check if this is a relevant list change
  const newStagePosition = getStageForListName(listAfter.name);
  if (!newStagePosition) {
    // Card moved to a list we don't track
    return null;
  }

  // Extract lead ID from card description
  const leadId = card.desc ? parseLeadIdFromDescription(card.desc) : null;
  if (!leadId) {
    console.warn('[Trello Webhook] Could not extract lead ID from card:', card.id);
    return null;
  }

  return { leadId, newStagePosition };
}

/**
 * Update card info when lead data changes
 */
export async function updateCardInfo(lead: Lead): Promise<boolean> {
  if (!trelloClient.isTrelloConfigured() || !lead.trelloCardId) {
    return false;
  }

  try {
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    await trelloClient.updateCard(lead.trelloCardId, {
      name: lead.name,
      desc: buildCardDescription(lead, appBaseUrl),
    });
    return true;
  } catch (error) {
    console.error('[Trello Sync] Error updating card:', error);
    return false;
  }
}

/**
 * Delete card when lead is deleted
 */
export async function deleteCardForLead(trelloCardId: string): Promise<boolean> {
  if (!trelloClient.isTrelloConfigured()) {
    return false;
  }

  try {
    await trelloClient.deleteCard(trelloCardId);
    return true;
  } catch (error) {
    console.error('[Trello Sync] Error deleting card:', error);
    return false;
  }
}

/**
 * Get current sync status (for settings page)
 */
export async function getSyncStatus(): Promise<{
  configured: boolean;
  boardConnected: boolean;
  listsFound: string[];
  webhookActive: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  if (!trelloClient.isTrelloConfigured()) {
    return {
      configured: false,
      boardConnected: false,
      listsFound: [],
      webhookActive: false,
      errors: ['Trello não configurado. Defina TRELLO_API_KEY, TRELLO_TOKEN e TRELLO_BOARD_ID.'],
    };
  }

  let lists: { name: string }[] = [];
  let boardConnected = false;
  let webhookActive = false;

  try {
    lists = await trelloClient.getLists();
    boardConnected = true;
  } catch (error) {
    errors.push(`Erro ao conectar com board: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  try {
    const webhooks = await trelloClient.listWebhooks();
    webhookActive = webhooks.some((w) => w.active);
  } catch (error) {
    errors.push(`Erro ao verificar webhooks: ${error instanceof Error ? error.message : 'Unknown'}`);
  }

  return {
    configured: true,
    boardConnected,
    listsFound: lists.map((l) => l.name),
    webhookActive,
    errors,
  };
}
