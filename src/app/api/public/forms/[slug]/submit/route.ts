import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError, AppError } from '@/lib/api-error';
import { headers } from 'next/headers';

const submitFormSchema = z.object({
  fields: z.record(z.string(), z.union([z.string(), z.boolean(), z.array(z.string())])),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { fields: fieldValues, utmSource, utmMedium, utmCampaign } = submitFormSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Busca o formulario
    const form = await prisma.formTemplate.findUnique({
      where: { slug },
      include: {
        fields: { orderBy: { position: 'asc' } },
        targetStage: true,
      },
    });

    if (!form) {
      throw new AppError('NOT_FOUND', 'Formulário não encontrado', 404);
    }

    if (form.status !== 'PUBLISHED') {
      throw new AppError('NOT_PUBLISHED', 'Este formulário não está disponível', 400);
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

      // Validacao de email
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

    // Extrai dados do lead dos campos mapeados
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

    // Nome é obrigatorio para criar lead
    if (!leadData.name) {
      // Tenta usar o primeiro campo de texto como nome
      const firstTextField = form.fields.find((f) => f.fieldType === 'TEXT');
      if (firstTextField && fieldValues[firstTextField.name]) {
        leadData.name = String(fieldValues[firstTextField.name]);
      }
    }

    if (!leadData.name) {
      throw new AppError('MISSING_NAME', 'Campo de nome é obrigatório', 400);
    }

    // Captura contexto da requisicao
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for')?.split(',')[0] ||
                      headersList.get('x-real-ip') ||
                      'unknown';
    const userAgent = headersList.get('user-agent') || null;
    const referrerUrl = headersList.get('referer') || null;

    // Busca funil e estagio padrao
    const defaultFunnel = await prisma.funnel.findFirst({
      where: { isDefault: true },
      include: { stages: { orderBy: { position: 'asc' }, take: 1 } },
    });

    if (!defaultFunnel || defaultFunnel.stages.length === 0) {
      throw new AppError('NO_FUNNEL', 'Funil não configurado', 500);
    }

    const targetStageId = form.targetStageId || defaultFunnel.stages[0].id;

    // Busca usuario sistema para registeredById
    let systemUser = await prisma.user.findFirst({
      where: { email: 'system@cip.org.br' },
    });

    if (!systemUser) {
      systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });
    }

    if (!systemUser) {
      throw new AppError('NO_SYSTEM_USER', 'Usuário sistema não encontrado', 500);
    }

    // Cria ou atualiza lead (baseado no email se existir)
    let lead;
    if (leadData.email) {
      lead = await prisma.lead.findFirst({
        where: { email: leadData.email, isDeleted: false },
      });
    }

    if (lead) {
      // Atualiza dados se necessario
      lead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
          name: leadData.name,
          phone: leadData.phone || lead.phone,
          lifeMoment: leadData.lifeMoment || lead.lifeMoment,
          inquiry: leadData.inquiry || lead.inquiry,
          utmSource: utmSource || lead.utmSource,
          utmMedium: utmMedium || lead.utmMedium,
          utmCampaign: utmCampaign || lead.utmCampaign,
        },
      });
    } else {
      // Cria novo lead
      lead = await prisma.lead.create({
        data: {
          name: leadData.name,
          email: leadData.email,
          phone: leadData.phone,
          lifeMoment: leadData.lifeMoment,
          inquiry: leadData.inquiry,
          source: leadData.source || `form:${form.slug}`,
          channelOrigin: 'Form',
          funnelId: defaultFunnel.id,
          currentStageId: targetStageId,
          registeredById: systemUser.id,
          utmSource: utmSource,
          utmMedium: utmMedium,
          utmCampaign: utmCampaign,
        },
      });
    }

    // Cria submission
    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        leadId: lead.id,
        ipAddress,
        userAgent,
        referrerUrl,
        utmSource,
        utmMedium,
        utmCampaign,
        accessMode: 'PUBLIC',
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

    // Envia notificacao (se configurado)
    if (form.sendNotification && form.notificationEmail) {
      try {
        const { sendFormSubmissionNotification } = await import('@/lib/email');
        await sendFormSubmissionNotification({
          to: form.notificationEmail,
          formTitle: form.title,
          leadName: leadData.name,
          leadEmail: leadData.email,
          submissionId: submission.id,
        });
      } catch (emailError) {
        console.error('Erro ao enviar email de notificacao:', emailError);
        // Nao falha a submissao por erro de email
      }
    }

    return NextResponse.json({
      data: {
        success: true,
        submissionId: submission.id,
        message: form.successMessage || 'Obrigado! Sua inscrição foi recebida.',
        redirectUrl: form.redirectUrl,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
