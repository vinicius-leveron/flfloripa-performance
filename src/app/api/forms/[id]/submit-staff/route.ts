import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError, AppError } from '@/lib/api-error';

const submitStaffSchema = z.object({
  fields: z.record(z.string(), z.union([z.string(), z.boolean(), z.array(z.string())])),
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
    const { fields: fieldValues } = submitStaffSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Busca o formulario
    const form = await prisma.formTemplate.findUnique({
      where: { id: formId },
      include: {
        fields: { orderBy: { position: 'asc' } },
        targetStage: true,
      },
    });

    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    // Valida campos obrigatorios
    const validationErrors: Record<string, string> = {};
    for (const field of form.fields) {
      const value = fieldValues[field.name];
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          validationErrors[field.name] = `${field.label} é obrigatório`;
        }
      }

      if (field.fieldType === 'EMAIL' && value && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          validationErrors[field.name] = 'Email inválido';
        }
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Erros de validação', details: validationErrors } },
        { status: 400 }
      );
    }

    // Extrai dados do lead
    const leadData: Record<string, string | null> = {
      name: null,
      email: null,
      phone: null,
      lifeMoment: null,
      inquiry: null,
      source: null,
    };

    for (const field of form.fields) {
      if (field.leadFieldMapping && fieldValues[field.name]) {
        const value = fieldValues[field.name];
        if (typeof value === 'string') {
          leadData[field.leadFieldMapping] = value;
        }
      }
    }

    if (!leadData.name) {
      const firstTextField = form.fields.find((f) => f.fieldType === 'TEXT');
      if (firstTextField && fieldValues[firstTextField.name]) {
        leadData.name = String(fieldValues[firstTextField.name]);
      }
    }

    if (!leadData.name) {
      throw new AppError('MISSING_NAME', 'Campo de nome é obrigatório', 400);
    }

    // Busca funil e estagio padrao
    const defaultFunnel = await prisma.funnel.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { position: 'asc' }, take: 1 } },
    });

    if (!defaultFunnel || defaultFunnel.stages.length === 0) {
      throw new AppError('NO_FUNNEL', 'Funil não configurado', 500);
    }

    const targetStageId = form.targetStageId || defaultFunnel.stages[0].id;

    // Cria ou atualiza lead
    let lead;
    if (leadData.email) {
      lead = await prisma.lead.findFirst({
        where: { email: leadData.email, isDeleted: false },
      });
    }

    if (lead) {
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          name: leadData.name,
          phone: leadData.phone || lead.phone,
          lifeMoment: leadData.lifeMoment || lead.lifeMoment,
          inquiry: leadData.inquiry || lead.inquiry,
        },
      });
    } else {
      lead = await prisma.lead.create({
        data: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          lifeMoment: leadData.lifeMoment,
          inquiry: leadData.inquiry,
          source: leadData.source || `staff:${form.slug}`,
          channelOrigin: 'Presencial',
          funnelId: defaultFunnel.id,
          currentStageId: targetStageId,
          registeredById: session.user.id,
        },
      });
    }

    // Cria submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        leadId: lead.id,
        accessMode: 'STAFF',
        submittedById: session.user.id,
      },
    });

    // Cria respostas dos campos
    const fieldResponses = form.fields.map((field) => ({
      submissionId: submission.id,
      fieldId: field.id,
      value: String(fieldValues[field.name] ?? ''),
    }));

    await prisma.formFieldResponse.createMany({
      data: fieldResponses,
    });

    return NextResponse.json({
      data: {
        success: true,
        submissionId: submission.id,
        leadId: lead.id,
        message: 'Lead registrado com sucesso!',
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
