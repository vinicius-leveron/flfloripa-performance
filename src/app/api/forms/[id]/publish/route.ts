import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';

export async function POST(
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
      include: { fields: true },
    });

    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    if (form.status === 'ARCHIVED') {
      throw new AppError('INVALID_STATUS', 'Não é possível publicar um formulário arquivado', 400);
    }

    // Verifica se tem pelo menos um campo
    if (form.fields.length === 0) {
      throw new AppError('NO_FIELDS', 'O formulário precisa ter pelo menos um campo para ser publicado', 400);
    }

    // Verifica se tem campo de nome (obrigatorio para criar lead)
    const hasNameField = form.fields.some(
      (f) => f.leadFieldMapping === 'name' || f.name === 'name'
    );

    if (!hasNameField) {
      throw new AppError('MISSING_NAME_FIELD', 'O formulário precisa ter um campo mapeado para "name" (nome do lead)', 400);
    }

    const updated = await prisma.formTemplate.update({
      where: { id },
      data: { status: 'PUBLISHED' },
      include: {
        createdBy: { select: { id: true, name: true } },
        targetStage: { select: { id: true, name: true } },
        fields: { orderBy: { position: 'asc' } },
      },
    });

    return NextResponse.json({
      data: updated,
      meta: {
        publicUrl: `/f/${updated.slug}`,
        embedUrl: `/embed/${updated.slug}`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
