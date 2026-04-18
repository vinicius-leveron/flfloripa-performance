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

    // Check if form slug already exists
    const formSlug = `webinar-${data.slug}`;
    const existingForm = await prisma.formTemplate.findUnique({
      where: { slug: formSlug },
    });

    if (existingForm) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Já existe um formulário com este slug' } },
        { status: 409 }
      );
    }

    // Create webinar with associated FormTemplate in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create FormTemplate for webinar registration
      const formTemplate = await tx.formTemplate.create({
        data: {
          name: `Registro - ${data.title}`,
          slug: formSlug,
          title: `Inscrição: ${data.title}`,
          description: data.description || null,
          status: 'PUBLISHED',
          sendNotification: true,
          submitButtonText: 'Inscrever-se',
          successMessage: 'Sua inscrição foi confirmada! Você receberá um email com mais informações.',
          createdById: session.user.id,
          fields: {
            create: [
              {
                fieldType: 'TEXT',
                name: 'name',
                label: 'Nome completo',
                placeholder: 'Digite seu nome',
                required: true,
                position: 0,
                leadFieldMapping: 'name',
              },
              {
                fieldType: 'EMAIL',
                name: 'email',
                label: 'Email',
                placeholder: 'seu@email.com',
                required: true,
                position: 1,
                leadFieldMapping: 'email',
              },
              {
                fieldType: 'PHONE',
                name: 'phone',
                label: 'Telefone (WhatsApp)',
                placeholder: '(48) 99999-9999',
                required: false,
                position: 2,
                leadFieldMapping: 'phone',
              },
            ],
          },
        },
      });

      // Create Webinar with link to FormTemplate
      const webinar = await tx.webinar.create({
        data: {
          title: data.title,
          slug: data.slug,
          description: data.description || null,
          scheduledAt: new Date(data.scheduledAt),
          replayUrl: data.replayUrl || null,
          status: data.status || 'SCHEDULED',
          formTemplateId: formTemplate.id,
        },
        include: {
          formTemplate: {
            select: { id: true, slug: true, status: true },
          },
        },
      });

      return webinar;
    });

    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
