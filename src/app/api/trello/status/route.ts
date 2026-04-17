import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { getSyncStatus } from '@/lib/trello/sync';
import { STAGE_TO_LIST_NAME } from '@/lib/trello/mapping';

/**
 * Get Trello connection status and configuration
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const status = await getSyncStatus();

    // Check if required lists exist
    const requiredLists = Object.values(STAGE_TO_LIST_NAME);
    const missingLists = requiredLists.filter(
      (listName) => !status.listsFound.some((found) => found.toLowerCase() === listName.toLowerCase())
    );

    return NextResponse.json({
      data: {
        ...status,
        requiredLists,
        missingLists,
        stageMapping: STAGE_TO_LIST_NAME,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
