import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';

const reorderSchema = z.object({
  fieldIds: z.array(z.string()).min(1, 'É necessário pelo menos um campo'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id: formId } = await params;
    const body = await request.json();
    const { fieldIds } = reorderSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Verifica se o form existe
    const form = await prisma.formTemplate.findUnique({ where: { id: formId } });
    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    // Verifica se todos os fieldIds pertencem a este form
    const existingFields = await prisma.formField.findMany({
      where: { formId },
      select: { id: true },
    });

    const existingFieldIds = new Set(existingFields.map((f) => f.id));
    const invalidIds = fieldIds.filter((id) => !existingFieldIds.has(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_FIELD_IDS', message: `Campos não encontrados: ${invalidIds.join(', ')}` } },
        { status: 400 }
      );
    }

    // Atualiza as posicoes em uma transacao
    await prisma.$transaction(
      fieldIds.map((fieldId, index) =>
        prisma.formField.update({
          where: { id: fieldId },
          data: { position: index },
        })
      )
    );

    // Retorna os campos atualizados
    const updatedFields = await prisma.formField.findMany({
      where: { formId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ data: updatedFields });
  } catch (error) {
    return handleApiError(error);
  }
}
