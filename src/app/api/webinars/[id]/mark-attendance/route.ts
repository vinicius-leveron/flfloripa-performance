import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

const markAttendanceSchema = z.object({
  registrationIds: z.array(z.string()).min(1, 'Selecione ao menos uma inscrição'),
  type: z.enum(['live', 'replay']),
  value: z.boolean(),
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

    const { id } = await params;
    const body = await request.json();
    const data = markAttendanceSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    // Verify webinar exists
    const webinar = await prisma.webinar.findUnique({ where: { id } });
    if (!webinar) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webinar não encontrado' } },
        { status: 404 }
      );
    }

    // Update registrations
    const updateData = data.type === 'live'
      ? { attendedLive: data.value }
      : { watchedReplay: data.value };

    const result = await prisma.webinarRegistration.updateMany({
      where: {
        id: { in: data.registrationIds },
        webinarId: id,
      },
      data: updateData,
    });

    // If marking as attended live, also update lead stage to "Participou" (stage 2)
    if (data.type === 'live' && data.value) {
      const registrations = await prisma.webinarRegistration.findMany({
        where: {
          id: { in: data.registrationIds },
          webinarId: id,
        },
        include: {
          lead: {
            select: { id: true, currentStageId: true },
          },
        },
      });

      // Get stage 2 (Participou)
      const participouStage = await prisma.funnelStage.findFirst({
        where: { position: 2 },
      });

      if (participouStage) {
        for (const reg of registrations) {
          // Only update if lead is in stage 1 (Lead)
          const leadStage = await prisma.funnelStage.findUnique({
            where: { id: reg.lead.currentStageId },
          });

          if (leadStage && leadStage.position === 1) {
            await prisma.lead.update({
              where: { id: reg.lead.id },
              data: { currentStageId: participouStage.id },
            });

            // Create lead event
            await prisma.leadEvent.create({
              data: {
                leadId: reg.lead.id,
                fromStageId: reg.lead.currentStageId,
                toStageId: participouStage.id,
                createdById: session.user.id,
                notes: `Participou do webinar: ${webinar.title}`,
              },
            });
          }
        }
      }
    }

    return NextResponse.json({
      data: {
        updated: result.count,
        type: data.type,
        value: data.value,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
