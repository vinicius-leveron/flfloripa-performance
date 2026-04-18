import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: { code: 'UNAUTHORIZED', message: 'Não autenticado' } }, { status: 401 });
    }

    const { id } = await params;
    const { prisma } = await import('@/lib/prisma');

    const webinar = await prisma.webinar.findUnique({
      where: { id },
      include: {
        registrations: {
          select: {
            id: true,
            attendedLive: true,
            watchedReplay: true,
            utmSource: true,
            utmMedium: true,
            utmCampaign: true,
            registeredAt: true,
          },
        },
      },
    });

    if (!webinar) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Webinar não encontrado' } },
        { status: 404 }
      );
    }

    const registrations = webinar.registrations;
    const totalRegistrations = registrations.length;
    const liveAttendees = registrations.filter((r) => r.attendedLive).length;
    const replayViewers = registrations.filter((r) => r.watchedReplay).length;
    const uniqueViewers = registrations.filter((r) => r.attendedLive || r.watchedReplay).length;

    // Metrics
    const metrics = {
      totalRegistrations,
      liveAttendees,
      attendanceRate: totalRegistrations > 0 ? Math.round((liveAttendees / totalRegistrations) * 100) : 0,
      replayViewers,
      replayRate: totalRegistrations > 0 ? Math.round((replayViewers / totalRegistrations) * 100) : 0,
      totalViewers: uniqueViewers,
      totalViewRate: totalRegistrations > 0 ? Math.round((uniqueViewers / totalRegistrations) * 100) : 0,
    };

    // Traffic breakdown by UTM source
    const trafficMap = new Map<string, { registrations: number; attendees: number; replayViewers: number }>();

    for (const reg of registrations) {
      const source = reg.utmSource || 'Direto';
      const current = trafficMap.get(source) || { registrations: 0, attendees: 0, replayViewers: 0 };
      current.registrations++;
      if (reg.attendedLive) current.attendees++;
      if (reg.watchedReplay) current.replayViewers++;
      trafficMap.set(source, current);
    }

    const trafficBreakdown = Array.from(trafficMap.entries())
      .map(([source, data]) => ({
        source,
        ...data,
      }))
      .sort((a, b) => b.registrations - a.registrations);

    // Registrations by day (for chart)
    const registrationsByDay = new Map<string, number>();
    for (const reg of registrations) {
      const day = reg.registeredAt.toISOString().split('T')[0];
      registrationsByDay.set(day, (registrationsByDay.get(day) || 0) + 1);
    }

    const dailyRegistrations = Array.from(registrationsByDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: {
        webinar: {
          id: webinar.id,
          title: webinar.title,
          slug: webinar.slug,
          status: webinar.status,
          scheduledAt: webinar.scheduledAt,
          replayUrl: webinar.replayUrl,
          formTemplateId: webinar.formTemplateId,
        },
        metrics,
        trafficBreakdown,
        dailyRegistrations,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
