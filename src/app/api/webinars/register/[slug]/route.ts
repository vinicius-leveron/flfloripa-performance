import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/api-error';
import { sendWebinarConfirmation } from '@/lib/email';

const registerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
});

/**
 * Public endpoint - no authentication required
 * Creates or finds a lead and registers them for the webinar
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const data = registerSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Find webinar by slug
    const webinar = await prisma.webinar.findUnique({
      where: { slug },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webinar não encontrado' } },
        { status: 404 }
      );
    }

    // Check if webinar is still accepting registrations
    if (webinar.status === 'ENDED' || webinar.status === 'REPLAY_ONLY') {
      return NextResponse.json(
        { error: { code: 'CLOSED', message: 'Inscrições encerradas para este webinar' } },
        { status: 400 }
      );
    }

    // Find or create lead
    let lead = await prisma.lead.findFirst({
      where: {
        email: data.email,
        isDeleted: false,
      },
    });

    // Get webinar funnel and its first stage (Inscrito)
    const webinarFunnel = await prisma.funnel.findUnique({
      where: { slug: 'webinar' },
      include: {
        stages: {
          where: { position: 1 },
          take: 1,
        },
      },
    });

    if (!webinarFunnel || webinarFunnel.stages.length === 0) {
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'Configuração de funil inválida' } },
        { status: 500 }
      );
    }

    const leadStage = webinarFunnel.stages[0];

    // Get a system user for auto-registrations (first admin)
    const systemUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!systemUser) {
      return NextResponse.json(
        { error: { code: 'SERVER_ERROR', message: 'Sistema não configurado' } },
        { status: 500 }
      );
    }

    if (!lead) {
      // Create new lead in webinar funnel
      lead = await prisma.lead.create({
        data: {
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          channelOrigin: data.utmSource || 'webinar',
          funnelId: webinarFunnel.id,
          currentStageId: leadStage.id,
          registeredById: systemUser.id,
          utmSource: data.utmSource || null,
          utmMedium: data.utmMedium || null,
          utmCampaign: data.utmCampaign || null,
          source: 'webinar',
        },
      });
    } else {
      // Update existing lead with UTM if provided
      if (data.phone || data.utmSource) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            ...(data.phone && !lead.phone && { phone: data.phone }),
            ...(data.utmSource && !lead.utmSource && { utmSource: data.utmSource }),
            ...(data.utmMedium && !lead.utmMedium && { utmMedium: data.utmMedium }),
            ...(data.utmCampaign && !lead.utmCampaign && { utmCampaign: data.utmCampaign }),
          },
        });
      }
    }

    // Check if already registered for this webinar
    const existingRegistration = await prisma.webinarRegistration.findUnique({
      where: {
        leadId_webinarId: {
          leadId: lead.id,
          webinarId: webinar.id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        {
          data: {
            registrationId: existingRegistration.id,
            leadId: lead.id,
            webinar: {
              id: webinar.id,
              title: webinar.title,
              scheduledAt: webinar.scheduledAt,
            },
            alreadyRegistered: true,
          },
        },
        { status: 200 }
      );
    }

    // Create webinar registration
    const registration = await prisma.webinarRegistration.create({
      data: {
        leadId: lead.id,
        webinarId: webinar.id,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
      },
    });

    // Send confirmation email
    await sendWebinarConfirmation({
      leadName: lead.name,
      leadEmail: data.email,
      webinarTitle: webinar.title,
      webinarDate: webinar.scheduledAt,
      webinarDescription: webinar.description || undefined,
    });

    return NextResponse.json(
      {
        data: {
          registrationId: registration.id,
          leadId: lead.id,
          webinar: {
            id: webinar.id,
            title: webinar.title,
            scheduledAt: webinar.scheduledAt,
          },
          alreadyRegistered: false,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
