/**
 * Trello <-> Funnel Stage Mapping
 *
 * Maps funnel stages to Trello list names and vice versa.
 * Only stages 3+ are synced with Trello (Visitou Sede and beyond).
 */

// Stage position -> Trello list name mapping
// These should match the list names in the SIPE Trello board
export const STAGE_TO_LIST_NAME: Record<number, string> = {
  3: 'Visitou Sede',
  4: 'Curso Info',
  5: 'Curso Prep',
  6: 'Ingressou',
  7: 'Desistiu',
};

// Trello list name -> Stage position mapping (reverse)
export const LIST_NAME_TO_STAGE: Record<string, number> = Object.fromEntries(
  Object.entries(STAGE_TO_LIST_NAME).map(([stage, listName]) => [listName.toLowerCase(), parseInt(stage)])
);

// Minimum stage position that syncs with Trello
export const MIN_TRELLO_SYNC_STAGE = 3;

/**
 * Check if a stage should sync with Trello
 */
export function shouldSyncWithTrello(stagePosition: number): boolean {
  return stagePosition >= MIN_TRELLO_SYNC_STAGE;
}

/**
 * Get the Trello list name for a stage position
 */
export function getListNameForStage(stagePosition: number): string | null {
  return STAGE_TO_LIST_NAME[stagePosition] || null;
}

/**
 * Get the stage position for a Trello list name
 */
export function getStageForListName(listName: string): number | null {
  return LIST_NAME_TO_STAGE[listName.toLowerCase()] || null;
}

/**
 * Build card description from lead data
 */
export function buildCardDescription(lead: {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  utmSource?: string | null;
  channelOrigin?: string | null;
}, appBaseUrl: string): string {
  const lines = [
    `**Nome:** ${lead.name}`,
  ];

  if (lead.email) {
    lines.push(`**Email:** ${lead.email}`);
  }

  if (lead.phone) {
    lines.push(`**Telefone:** ${lead.phone}`);
  }

  if (lead.channelOrigin) {
    lines.push(`**Canal:** ${lead.channelOrigin}`);
  }

  if (lead.utmSource) {
    lines.push(`**Fonte:** ${lead.utmSource}`);
  }

  lines.push('');
  lines.push(`[Ver perfil completo](${appBaseUrl}/leads/${lead.id})`);

  return lines.join('\n');
}

/**
 * Parse lead ID from card description
 */
export function parseLeadIdFromDescription(desc: string): string | null {
  const match = desc.match(/\/leads\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}
