import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

const createWebinarSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  scheduledAt: z.string().datetime(),
  replayUrl: z.string().url().optional().or(z.literal('')),
  status: z.enum(['SCHEDULED', 'LIVE', 'ENDED', 'REPLAY_ONLY']).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [webinars, total] = await Promise.all([
      prisma.webinar.findMany({
        where,
        include: {
          _count: {
            select: { registrations: true },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.webinar.count({ where }),
    ]);

    // Add registration stats
    const webinarsWithStats = webinars.map((webinar) => ({
      ...webinar,
      stats: {
        totalRegistrations: webinar._count.registrations,
      },
    }));

    return NextResponse.json({
      data: webinarsWithStats,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const body = await request.json();
    const data = createWebinarSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Check if slug already exists
    const existingWebinar = await prisma.webinar.findUnique({
      where: { slug: data.slug },
    });

    if (existingWebinar) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Já existe um webinar com este slug' } },
        { status: 409 }
      );
    }

    const webinar = await prisma.webinar.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        scheduledAt: new Date(data.scheduledAt),
        replayUrl: data.replayUrl || null,
        status: data.status || 'SCHEDULED',
      },
    });

    return NextResponse.json({ data: webinar }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
