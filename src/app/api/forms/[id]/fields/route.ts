import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';
import { FieldType, Prisma } from '@/generated/prisma/client';

const fieldTypeEnum = z.enum(['TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'DATE'] as const);

const createFieldSchema = z.object({
  fieldType: fieldTypeEnum,
  name: z.string().min(1, 'Nome do campo é obrigatório').regex(/^[a-z0-9_]+$/i, 'Nome deve conter apenas letras, números e underscore'),
  label: z.string().min(1, 'Label é obrigatório'),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().optional(),
  position: z.number().int().optional(),
  validation: z.object({
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional(),
  options: z.array(z.object({
    label: z.string(),
    value: z.string(),
  })).optional().nullable(),
  conditionalLogic: z.object({
    showWhen: z.object({
      fieldName: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_empty', 'in']),
      value: z.union([z.string(), z.array(z.string())]),
    }),
  }).optional(),
  leadFieldMapping: z.enum(['name', 'email', 'phone', 'lifeMoment', 'inquiry', 'source']).optional(),
  defaultValue: z.string().optional(),
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
    console.log('[POST /api/forms/fields] Body received:', JSON.stringify(body, null, 2));
    const data = createFieldSchema.parse(body);
    console.log('[POST /api/forms/fields] Parsed OK');

    const { prisma } = await import('@/lib/prisma');

    // Verifica se o form existe
    const form = await prisma.formTemplate.findUnique({ where: { id: formId } });
    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    // Verifica se ja existe campo com mesmo nome neste form
    const existingField = await prisma.formField.findFirst({
      where: { formId, name: data.name },
    });
    if (existingField) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_FIELD', message: 'Já existe um campo com este nome no formulário' } },
        { status: 409 }
      );
    }

    // Se position nao foi especificado, coloca no final
    let position = data.position;
    if (position === undefined) {
      const lastField = await prisma.formField.findFirst({
        where: { formId },
        orderBy: { position: 'desc' },
      });
      position = (lastField?.position ?? -1) + 1;
    }

    const field = await prisma.formField.create({
      data: {
        formId,
        fieldType: data.fieldType as FieldType,
        name: data.name,
        label: data.label,
        placeholder: data.placeholder || null,
        helpText: data.helpText || null,
        required: data.required ?? false,
        position,
        validation: data.validation ?? Prisma.DbNull,
        options: data.options ?? Prisma.DbNull,
        conditionalLogic: data.conditionalLogic ?? Prisma.DbNull,
        leadFieldMapping: data.leadFieldMapping || null,
        defaultValue: data.defaultValue || null,
      },
    });

    return NextResponse.json({ data: field }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/forms/fields] Error:', error);
    return handleApiError(error);
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id: formId } = await params;
    const { prisma } = await import('@/lib/prisma');

    const form = await prisma.formTemplate.findUnique({ where: { id: formId } });
    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    const fields = await prisma.formField.findMany({
      where: { formId },
      orderBy: { position: 'asc' },
    });

    return NextResponse.json({ data: fields });
  } catch (error) {
    return handleApiError(error);
  }
}
