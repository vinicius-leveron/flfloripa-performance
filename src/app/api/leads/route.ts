import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

const createLeadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  channelOrigin: z.string().optional(),
  currentStageId: z.string(),
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

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const url = new URL(request.url);
    const stageId = url.searchParams.get('stageId');
    const search = url.searchParams.get('search');
    const channelOrigin = url.searchParams.get('channelOrigin');
    const lifeMoment = url.searchParams.get('lifeMoment');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    const where: Record<string, unknown> = { isDeleted: false };
    if (stageId) where.currentStageId = stageId;
    if (channelOrigin) where.channelOrigin = channelOrigin;
    if (lifeMoment) where.lifeMoment = lifeMoment;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          currentStage: { select: { id: true, name: true, position: true } },
          registeredBy: { select: { id: true, name: true } },
          events: {
            orderBy: { createdAt: 'desc' }, take: 5,
            include: { fromStage: { select: { name: true } }, toStage: { select: { name: true } }, createdBy: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit, take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ data: leads, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const body = await request.json();
    const data = createLeadSchema.parse(body);

    const { prisma } = await import('@/lib/prisma');

    const lead = await prisma.lead.create({
      data: {
        name: data.name, email: data.email || null, phone: data.phone || null,
        channelOrigin: data.channelOrigin || null, currentStageId: data.currentStageId,
        registeredById: session.user.id, notes: data.notes || null,
        lifeMoment: data.lifeMoment || null, inquiry: data.inquiry || null, source: data.source || null,
        campaignId: data.campaignId || null, adSpend: data.adSpend ?? null,
        utmSource: data.utmSource || null, utmMedium: data.utmMedium || null, utmCampaign: data.utmCampaign || null,
        vslWatched: data.vslWatched ?? false, vslWatchTime: data.vslWatchTime ?? null,
      },
      include: {
        currentStage: { select: { id: true, name: true, position: true } },
        registeredBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ data: lead }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
