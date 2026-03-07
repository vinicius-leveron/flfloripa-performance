import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { IS_DEMO, DEMO_LEADS } from '@/lib/demo-data';
import { handleApiError, AppError } from '@/lib/api-error';

const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
  lifeMoment: z.string().optional(),
  inquiry: z.string().optional(),
  source: z.string().optional(),
  campaignId: z.string().optional(),
  adSpend: z.number().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  vslWatched: z.boolean().optional(),
  vslWatchTime: z.number().int().optional(),
});

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
    const data = updateLeadSchema.parse(body);

    if (IS_DEMO) {
      const lead = DEMO_LEADS.find(l => l.id === id);
      return NextResponse.json({ data: { ...(lead || {}), ...data } });
    }

    const { prisma } = await import('@/lib/prisma');

    const existing = await prisma.lead.findFirst({ where: { id, isDeleted: false } });
    if (!existing) throw new AppError('NOT_FOUND', 'Lead não encontrado', 404);

    const updated = await prisma.lead.update({
      where: { id },
      data: { ...data, email: data.email !== undefined ? (data.email || null) : undefined },
      include: {
        currentStage: { select: { id: true, name: true, position: true } },
        registeredBy: { select: { id: true, name: true } },
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

    if (IS_DEMO) {
      return NextResponse.json({ data: { message: 'Lead removido' } });
    }

    const { prisma } = await import('@/lib/prisma');
    await prisma.lead.update({ where: { id }, data: { isDeleted: true } });
    return NextResponse.json({ data: { message: 'Lead removido' } });
  } catch (error) {
    return handleApiError(error);
  }
}
