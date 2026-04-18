import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { FormStatus } from '@/generated/prisma/client';

const createFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  targetStageId: z.string().optional(),
  sendNotification: z.boolean().optional(),
  notificationEmail: z.string().email().optional().or(z.literal('')),
  createTrelloCard: z.boolean().optional(),
  submitButtonText: z.string().optional(),
  successMessage: z.string().optional(),
  redirectUrl: z.string().url().optional().or(z.literal('')),
});

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as FormStatus | null;
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    } else {
      // Por padrao, nao mostra arquivados
      where.status = { not: 'ARCHIVED' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [forms, total] = await Promise.all([
      prisma.formTemplate.findMany({
        where,
        include: {
          createdBy: { select: { id: true, name: true } },
          targetStage: { select: { id: true, name: true } },
          _count: { select: { submissions: true, fields: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.formTemplate.count({ where }),
    ]);

    return NextResponse.json({
      data: forms,
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
    const data = createFormSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Verifica se slug ja existe
    const existing = await prisma.formTemplate.findUnique({ where: { slug: data.slug } });
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_SLUG', message: 'Já existe um formulário com este slug' } },
        { status: 409 }
      );
    }

    const form = await prisma.formTemplate.create({
      data: {
        name: data.name,
        slug: data.slug,
        title: data.title,
        description: data.description || null,
        targetStageId: data.targetStageId || null,
        sendNotification: data.sendNotification ?? true,
        notificationEmail: data.notificationEmail || null,
        createTrelloCard: data.createTrelloCard ?? false,
        submitButtonText: data.submitButtonText || 'Enviar',
        successMessage: data.successMessage || null,
        redirectUrl: data.redirectUrl || null,
        createdById: session.user.id,
        status: 'DRAFT',
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        targetStage: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: form }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
