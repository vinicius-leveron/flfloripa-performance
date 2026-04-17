/**
 * Trello API Client
 *
 * Handles communication with Trello API for SIPE board integration.
 * Cards are synced when leads move to stages 3+ (Visitou Sede and beyond).
 */

const TRELLO_API_BASE = 'https://api.trello.com/1';

interface TrelloConfig {
  apiKey: string;
  token: string;
  boardId: string;
}

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  labels: { id: string; name: string; color: string }[];
  url: string;
}

interface TrelloList {
  id: string;
  name: string;
  pos: number;
}

interface CreateCardParams {
  name: string;
  desc: string;
  idList: string;
  idLabels?: string[];
}

function getConfig(): TrelloConfig {
  const apiKey = process.env.TRELLO_API_KEY;
  const token = process.env.TRELLO_TOKEN;
  const boardId = process.env.TRELLO_BOARD_ID;

  if (!apiKey || !token || !boardId) {
    throw new Error('Missing Trello configuration. Set TRELLO_API_KEY, TRELLO_TOKEN, and TRELLO_BOARD_ID.');
  }

  return { apiKey, token, boardId };
}

function buildUrl(path: string, params: Record<string, string> = {}): string {
  const config = getConfig();
  const url = new URL(`${TRELLO_API_BASE}${path}`);
  url.searchParams.set('key', config.apiKey);
  url.searchParams.set('token', config.token);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

/**
 * Check if Trello is configured
 */
export function isTrelloConfigured(): boolean {
  try {
    getConfig();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all lists from the SIPE board
 */
export async function getLists(): Promise<TrelloList[]> {
  const config = getConfig();
  const url = buildUrl(`/boards/${config.boardId}/lists`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get Trello lists: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get a card by ID
 */
export async function getCard(cardId: string): Promise<TrelloCard | null> {
  const url = buildUrl(`/cards/${cardId}`, { fields: 'id,name,desc,idList,labels,url' });

  const response = await fetch(url);
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Failed to get Trello card: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a new card on a list
 */
export async function createCard(params: CreateCardParams): Promise<TrelloCard> {
  const url = buildUrl('/cards');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`Failed to create Trello card: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Move a card to a different list
 */
export async function moveCard(cardId: string, idList: string): Promise<TrelloCard> {
  const url = buildUrl(`/cards/${cardId}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idList }),
  });

  if (!response.ok) {
    throw new Error(`Failed to move Trello card: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Update card description
 */
export async function updateCard(cardId: string, updates: { name?: string; desc?: string }): Promise<TrelloCard> {
  const url = buildUrl(`/cards/${cardId}`);

  const response = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update Trello card: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Delete a card
 */
export async function deleteCard(cardId: string): Promise<void> {
  const url = buildUrl(`/cards/${cardId}`);

  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Trello card: ${response.statusText}`);
  }
}

/**
 * Get or create labels on the board for UTM sources
 */
export async function getLabels(): Promise<{ id: string; name: string; color: string }[]> {
  const config = getConfig();
  const url = buildUrl(`/boards/${config.boardId}/labels`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to get Trello labels: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Create a webhook for the board
 */
export async function createWebhook(callbackUrl: string): Promise<{ id: string }> {
  const config = getConfig();
  const url = buildUrl('/webhooks');

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idModel: config.boardId,
      callbackURL: callbackUrl,
      description: 'FLFloripa Performance - SIPE Sync',
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Trello webhook: ${response.statusText} - ${error}`);
  }

  return response.json();
}

/**
 * Delete a webhook
 */
export async function deleteWebhook(webhookId: string): Promise<void> {
  const url = buildUrl(`/webhooks/${webhookId}`);

  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Trello webhook: ${response.statusText}`);
  }
}

/**
 * List all webhooks for the token
 */
export async function listWebhooks(): Promise<{ id: string; idModel: string; callbackURL: string; active: boolean }[]> {
  const config = getConfig();
  const url = buildUrl(`/tokens/${config.token}/webhooks`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to list Trello webhooks: ${response.statusText}`);
  }

  return response.json();
}
