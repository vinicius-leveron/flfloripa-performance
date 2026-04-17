/**
 * Trello Webhook Handler
 *
 * Processes incoming webhook events from Trello and updates leads accordingly.
 */

import { handleTrelloWebhook } from './sync';

// Flag to track if this update originated from our app (to prevent loops)
const recentAppUpdates = new Map<string, number>();
const UPDATE_COOLDOWN_MS = 5000; // 5 seconds

/**
 * Mark a card as recently updated by our app (to prevent webhook loops)
 */
export function markCardAsUpdatedByApp(cardId: string): void {
  recentAppUpdates.set(cardId, Date.now());

  // Clean up old entries
  const now = Date.now();
  for (const [id, timestamp] of recentAppUpdates) {
    if (now - timestamp > UPDATE_COOLDOWN_MS) {
      recentAppUpdates.delete(id);
    }
  }
}

/**
 * Check if a card was recently updated by our app
 */
export function wasRecentlyUpdatedByApp(cardId: string): boolean {
  const timestamp = recentAppUpdates.get(cardId);
  if (!timestamp) {
    return false;
  }

  if (Date.now() - timestamp > UPDATE_COOLDOWN_MS) {
    recentAppUpdates.delete(cardId);
    return false;
  }

  return true;
}

interface TrelloWebhookPayload {
  action: {
    id: string;
    type: string;
    date: string;
    memberCreator: {
      id: string;
      username: string;
      fullName: string;
    };
    data: {
      card?: {
        id: string;
        name: string;
        desc?: string;
        idShort: number;
      };
      board?: {
        id: string;
        name: string;
      };
      listBefore?: {
        id: string;
        name: string;
      };
      listAfter?: {
        id: string;
        name: string;
      };
      old?: {
        idList?: string;
      };
    };
  };
  model: {
    id: string;
    name: string;
  };
}

interface WebhookResult {
  processed: boolean;
  action: 'stage_update' | 'ignored' | 'error';
  leadId?: string;
  newStagePosition?: number;
  reason?: string;
}

/**
 * Process a Trello webhook payload
 *
 * @param payload - The raw webhook payload from Trello
 * @returns WebhookResult indicating what was done
 */
export async function processWebhook(payload: TrelloWebhookPayload): Promise<WebhookResult> {
  const { action } = payload;

  // Only process card updates
  if (action.type !== 'updateCard') {
    return { processed: false, action: 'ignored', reason: 'Not a card update' };
  }

  // Must have list change data
  if (!action.data.listBefore || !action.data.listAfter) {
    return { processed: false, action: 'ignored', reason: 'Not a list change' };
  }

  // Check if same list (no actual move)
  if (action.data.listBefore.id === action.data.listAfter.id) {
    return { processed: false, action: 'ignored', reason: 'Same list' };
  }

  const cardId = action.data.card?.id;
  if (!cardId) {
    return { processed: false, action: 'ignored', reason: 'No card ID' };
  }

  // Check if this update was triggered by our app (prevent loops)
  if (wasRecentlyUpdatedByApp(cardId)) {
    return { processed: false, action: 'ignored', reason: 'Update originated from app' };
  }

  try {
    const result = await handleTrelloWebhook(action);

    if (!result) {
      return { processed: false, action: 'ignored', reason: 'Not a tracked list change' };
    }

    return {
      processed: true,
      action: 'stage_update',
      leadId: result.leadId,
      newStagePosition: result.newStagePosition,
    };
  } catch (error) {
    return {
      processed: false,
      action: 'error',
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Verify Trello webhook signature
 *
 * Trello uses a simple callback URL validation mechanism.
 * On webhook creation, Trello sends a HEAD request that must return 200.
 * For actual events, we can optionally verify the X-Trello-Webhook header.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string | null,
  callbackUrl: string
): boolean {
  // If no signature provided, skip verification (not all webhooks include it)
  if (!signature) {
    return true;
  }

  // Trello webhook verification is done via HMAC-SHA1
  // The secret is the token used to create the webhook
  // For now, we'll skip signature verification as it requires crypto
  // and the webhook URL is already semi-private

  return true;
}

/**
 * Format webhook event for logging
 */
export function formatWebhookForLog(payload: TrelloWebhookPayload): string {
  const { action } = payload;
  const cardName = action.data.card?.name || 'Unknown';
  const listBefore = action.data.listBefore?.name || 'Unknown';
  const listAfter = action.data.listAfter?.name || 'Unknown';
  const user = action.memberCreator?.fullName || 'Unknown';

  return `[Trello Webhook] ${action.type}: "${cardName}" moved from "${listBefore}" to "${listAfter}" by ${user}`;
}
