import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';
import { FieldType, Prisma } from '@/generated/prisma/client';

// Helper para converter null em Prisma.DbNull para campos JSON
function jsonValue<T>(val: T | null | undefined): T | typeof Prisma.DbNull | undefined {
  if (val === undefined) return undefined;
  if (val === null) return Prisma.DbNull;
  return val;
}

const fieldTypeEnum = z.enum(['TEXT', 'EMAIL', 'PHONE', 'TEXTAREA', 'SELECT', 'CHECKBOX', 'DATE'] as const);

const updateFieldSchema = z.object({
  fieldType: fieldTypeEnum.optional(),
  name: z.string().min(1).regex(/^[a-z0-9_]+$/i).optional(),
  label: z.string().min(1).optional(),
  placeholder: z.string().optional().nullable(),
  helpText: z.string().optional().nullable(),
  required: z.boolean().optional(),
  position: z.number().int().optional(),
  validation: z.object({
    minLength: z.number().int().optional(),
    maxLength: z.number().int().optional(),
    pattern: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }).optional().nullable(),
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
  }).optional().nullable(),
  leadFieldMapping: z.enum(['name', 'email', 'phone', 'lifeMoment', 'inquiry', 'source']).optional().nullable(),
  defaultValue: z.string().optional().nullable(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id: formId, fieldId } = await params;
    const { prisma } = await import('@/lib/prisma');

    const field = await prisma.formField.findFirst({
      where: { id: fieldId, formId },
    });

    if (!field) {
      throw new AppError('NOT_FOUND', 'Campo não encontrado', 404);
    }

    return NextResponse.json({ data: field });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id: formId, fieldId } = await params;
    const body = await request.json();
    const data = updateFieldSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    const existing = await prisma.formField.findFirst({
      where: { id: fieldId, formId },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Campo não encontrado', 404);
    }

    // Se estiver mudando o nome, verifica duplicidade
    if (data.name && data.name !== existing.name) {
      const nameExists = await prisma.formField.findFirst({
        where: { formId, name: data.name, id: { not: fieldId } },
      });
      if (nameExists) {
        return NextResponse.json(
          { error: { code: 'DUPLICATE_FIELD', message: 'Já existe um campo com este nome no formulário' } },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.formField.update({
      where: { id: fieldId },
      data: {
        ...(data.fieldType !== undefined && { fieldType: data.fieldType as FieldType }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.placeholder !== undefined && { placeholder: data.placeholder }),
        ...(data.helpText !== undefined && { helpText: data.helpText }),
        ...(data.required !== undefined && { required: data.required }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.validation !== undefined && { validation: jsonValue(data.validation) }),
        ...(data.options !== undefined && { options: jsonValue(data.options) }),
        ...(data.conditionalLogic !== undefined && { conditionalLogic: jsonValue(data.conditionalLogic) }),
        ...(data.leadFieldMapping !== undefined && { leadFieldMapping: data.leadFieldMapping }),
        ...(data.defaultValue !== undefined && { defaultValue: data.defaultValue }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; fieldId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id: formId, fieldId } = await params;
    const { prisma } = await import('@/lib/prisma');

    const existing = await prisma.formField.findFirst({
      where: { id: fieldId, formId },
    });

    if (!existing) {
      throw new AppError('NOT_FOUND', 'Campo não encontrado', 404);
    }

    await prisma.formField.delete({ where: { id: fieldId } });

    // Reordena os campos restantes
    await prisma.$executeRaw`
      UPDATE form_fields
      SET position = position - 1
      WHERE form_id = ${formId} AND position > ${existing.position}
    `;

    return NextResponse.json({ data: { message: 'Campo removido' } });
  } catch (error) {
    return handleApiError(error);
  }
}
