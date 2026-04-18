import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';
import { FormStatus } from '@/generated/prisma/client';

const updateFormSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).optional(),
  targetStageId: z.string().nullable().optional(),
  sendNotification: z.boolean().optional(),
  notificationEmail: z.string().email().optional().or(z.literal('')).nullable(),
  createTrelloCard: z.boolean().optional(),
  submitButtonText: z.string().optional(),
  successMessage: z.string().optional().nullable(),
  redirectUrl: z.string().url().optional().or(z.literal('')).nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const form = await prisma.formTemplate.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        targetStage: { select: { id: true, name: true, position: true } },
        fields: {
          orderBy: { position: 'asc' },
        },
        _count: { select: { submissions: true } },
      },
    });

    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    return NextResponse.json({ data: form });
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
    const data = updateFormSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    const existing = await prisma.formTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    // Se estiver mudando o slug, verifica se ja existe
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.formTemplate.findUnique({ where: { slug: data.slug } });
      if (slugExists) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_SLUG', message: 'Já existe um formulário com este slug' } },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.formTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.status !== undefined && { status: data.status as FormStatus }),
        ...(data.targetStageId !== undefined && { targetStageId: data.targetStageId }),
        ...(data.sendNotification !== undefined && { sendNotification: data.sendNotification }),
        ...(data.notificationEmail !== undefined && { notificationEmail: data.notificationEmail || null }),
        ...(data.createTrelloCard !== undefined && { createTrelloCard: data.createTrelloCard }),
        ...(data.submitButtonText !== undefined && { submitButtonText: data.submitButtonText }),
        ...(data.successMessage !== undefined && { successMessage: data.successMessage }),
        ...(data.redirectUrl !== undefined && { redirectUrl: data.redirectUrl || null }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        targetStage: { select: { id: true, name: true } },
        fields: { orderBy: { position: 'asc' } },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const existing = await prisma.formTemplate.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    // Soft delete - marca como arquivado
    await prisma.formTemplate.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return NextResponse.json({ data: { message: 'Formulário arquivado' } });
  } catch (error) {
    return handleApiError(error);
  }
}
