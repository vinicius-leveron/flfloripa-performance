'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Users, Calendar, Video, Play, Plus, Eye, Clock, ExternalLink } from 'lucide-react';

interface WebinarData {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  scheduledAt: string;
  replayUrl: string | null;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED' | 'REPLAY_ONLY';
  stats: {
    totalRegistrations: number;
  };
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }> = {
  SCHEDULED: { label: 'Agendado', variant: 'secondary' },
  LIVE: { label: 'Ao Vivo', variant: 'destructive' },
  ENDED: { label: 'Encerrado', variant: 'default' },
  REPLAY_ONLY: { label: 'Replay', variant: 'warning' },
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

function isUpcoming(dateString: string): boolean {
  return new Date(dateString) > new Date();
}

export function WebinarsClient() {
  const { data, isLoading } = useQuery<{ data: WebinarData[]; meta: { total: number } }>({
    queryKey: ['webinars'],
    queryFn: () => fetch('/api/webinars').then(r => r.json()),
  });

  const webinars = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webinars</h1>
          <p className="text-sm text-gray-500">Gerencie webinars e acompanhe inscrições</p>
        </div>
        <Link href="/webinars/new">
          <Button>
            <Plus size={16} className="mr-2" />
            Novo Webinar
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : webinars.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Video className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum webinar criado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie seu primeiro webinar para começar a captar leads
            </p>
            <Link href="/webinars/new">
              <Button className="mt-4" variant="default" size="sm">
                <Plus size={16} className="mr-2" />
                Criar Webinar
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {webinars.map((webinar) => {
            const config = statusConfig[webinar.status];
            const upcoming = isUpcoming(webinar.scheduledAt);

            return (
              <Card key={webinar.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#FDF2E9] p-2.5 text-[#E8792A]">
                        {webinar.status === 'LIVE' ? <Play size={20} /> : <Video size={20} />}
                      </div>
                      <div>
                        <Link href={`/webinars/${webinar.id}`}>
                          <CardTitle className="text-lg hover:text-[#E8792A] transition-colors cursor-pointer">
                            {webinar.title}
                          </CardTitle>
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={config.variant}>{config.label}</Badge>
                          {upcoming && <Badge variant="outline" className="text-[10px]">Em breve</Badge>}
                        </div>
                      </div>
                    </div>
                    <Link href={`/webinars/${webinar.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye size={14} className="mr-1.5" />
                        Ver Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Data</p>
                        <p className="text-sm font-medium">{formatDate(webinar.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-green-50 p-2 text-green-600">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Inscritos</p>
                        <p className="text-sm font-bold">{webinar.stats.totalRegistrations}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-purple-50 p-2 text-purple-600">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Slug</p>
                        <p className="text-sm font-mono text-gray-600">{webinar.slug}</p>
                      </div>
                    </div>
                  </div>

                  {webinar.description && (
                    <p className="mt-3 text-sm text-gray-500 line-clamp-2">{webinar.description}</p>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1">
                      <ExternalLink size={12} />
                      Link de inscrição: /webinar/{webinar.slug}
                    </span>
                    {webinar.replayUrl && (
                      <span className="flex items-center gap-1 text-[#E8792A]">
                        <Play size={12} />
                        Replay disponível
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
