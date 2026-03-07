import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_USERS } from '@/lib/demo-data';
import { handleApiError } from '@/lib/api-error';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    if (IS_DEMO) {
      return NextResponse.json({ data: DEMO_USERS });
    }

    const { prisma } = await import('@/lib/prisma');
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, image: true, role: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    return handleApiError(error);
  }
}
