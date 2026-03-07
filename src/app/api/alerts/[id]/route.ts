import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;

    if (IS_DEMO) {
      return NextResponse.json({ data: { id, isRead: true } });
    }

    const { prisma } = await import('@/lib/prisma');
    const alert = await prisma.alert.update({ where: { id }, data: { isRead: true } });
    return NextResponse.json({ data: alert });
  } catch (error) {
    return handleApiError(error);
  }
}
