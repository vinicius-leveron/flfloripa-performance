import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

const updateWebinarSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  replayUrl: z.string().url().optional().or(z.literal('')).or(z.null()),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'REPLAY_ONLY']).optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const webinar = await prisma.webinar.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            lead: {
              select: { id: true, name: true, email: true, phone: true, channelOrigin: true },
            },
          },
          orderBy: { registeredAt: 'desc' },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webinar não encontrado' } },
        { status: 404 }
      );
    }

    // Calculate stats
    const stats = {
      totalRegistrations: webinar.registrations.length,
      attendedLive: webinar.registrations.filter((r) => r.attendedLive).length,
      watchedReplay: webinar.registrations.filter((r) => r.watchedReplay).length,
      attendanceRate: webinar.registrations.length > 0
        ? (webinar.registrations.filter((r) => r.attendedLive).length / webinar.registrations.length) * 100
        : 0,
      replayRate: webinar.registrations.length > 0
        ? (webinar.registrations.filter((r) => r.watchedReplay).length / webinar.registrations.length) * 100
        : 0,
    };

    return NextResponse.json({ data: { ...webinar, stats } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
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
    const data = updateWebinarSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    const webinar = await prisma.webinar.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.replayUrl !== undefined && { replayUrl: data.replayUrl || null }),
        ...(data.status && { status: data.status }),
      },
    });

    return NextResponse.json({ data: webinar });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    await prisma.webinar.delete({ where: { id } });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
