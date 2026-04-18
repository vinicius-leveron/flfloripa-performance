import { NextResponse } from 'next/server';
import { handleApiError, AppError } from '@/lib/api-error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { prisma } = await import('@/lib/prisma');

    const form = await prisma.formTemplate.findUnique({
      where: { slug },
      include: {
        fields: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            fieldType: true,
            name: true,
            label: true,
            placeholder: true,
            helpText: true,
            required: true,
            position: true,
            options: true,
            conditionalLogic: true,
          },
        },
      },
    });

    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    if (form.status !== 'PUBLISHED') {
      throw new AppError('NOT_PUBLISHED', 'Este formulário não está disponível', 404);
    }

    // Retorna apenas dados necessarios para renderizar (sem dados sensiveis)
    return NextResponse.json({
      data: {
        id: form.id,
        slug: form.slug,
        title: form.title,
        description: form.description,
        submitButtonText: form.submitButtonText,
        fields: form.fields,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
