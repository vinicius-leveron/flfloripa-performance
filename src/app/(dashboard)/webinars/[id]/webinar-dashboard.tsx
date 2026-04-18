'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/shared/components/ui/dialog';
import { toast } from 'sonner';
import {
  Users,
  Calendar,
  Play,
  ArrowLeft,
  UserCheck,
  Repeat,
  TrendingUp,
  Copy,
  ExternalLink,
  CheckCircle2,
  Settings2,
} from 'lucide-react';

interface DashboardData {
  webinar: {
    id: string;
    title: string;
    slug: string;
    status: string;
    scheduledAt: string;
    replayUrl: string | null;
    formTemplateId: string | null;
  };
  metrics: {
    totalRegistrations: number;
    liveAttendees: number;
    attendanceRate: number;
    replayViewers: number;
    replayRate: number;
    totalViewers: number;
    totalViewRate: number;
  };
  trafficBreakdown: Array<{
    source: string;
    registrations: number;
    attendees: number;
    replayViewers: number;
  }>;
  dailyRegistrations: Array<{
    date: string;
    count: number;
  }>;
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
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

interface WebinarDashboardProps {
  webinarId: string;
}

export function WebinarDashboard({ webinarId }: WebinarDashboardProps) {
  const queryClient = useQueryClient();
  const [emailsText, setEmailsText] = useState('');
  const [attendanceType, setAttendanceType] = useState<'live' | 'replay'>('live');

  const { data, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: ['webinar-dashboard', webinarId],
    queryFn: () => fetch(`/api/webinars/${webinarId}/dashboard`).then(r => r.json()),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (payload: { emails: string[]; type: 'live' | 'replay' }) => {
      const res = await fetch(`/api/webinars/${webinarId}/mark-attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao marcar presença');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`${data.data.updated} presenças marcadas`);
      setEmailsText('');
      queryClient.invalidateQueries({ queryKey: ['webinar-dashboard', webinarId] });
    },
    onError: () => {
      toast.error('Erro ao marcar presença');
    },
  });

  const handleMarkAttendance = () => {
    const emails = emailsText
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@'));

    if (emails.length === 0) {
      toast.error('Nenhum email válido encontrado');
      return;
    }

    markAttendanceMutation.mutate({ emails, type: attendanceType });
  };

  const copyRegistrationLink = () => {
    const link = `${window.location.origin}/webinar/${dashboard?.webinar.slug}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Erro ao carregar webinar</h3>
          <Link href="/webinars">
            <Button variant="outline" className="mt-4">
              <ArrowLeft size={16} className="mr-2" />
              Voltar para lista
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const dashboard = data.data;
  const { webinar, metrics, trafficBreakdown } = dashboard;
  const config = statusConfig[webinar.status];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/webinars">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{webinar.title}</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(webinar.scheduledAt)}
              </span>
              <span className="flex items-center gap-1 font-mono">
                /{webinar.slug}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {webinar.formTemplateId && (
            <Link href={`/forms/${webinar.formTemplateId}`}>
              <Button variant="outline" size="sm">
                <Settings2 size={14} className="mr-1.5" />
                Personalizar Formulário
              </Button>
            </Link>
          )}
          <Button variant="outline" size="sm" onClick={copyRegistrationLink}>
            <Copy size={14} className="mr-1.5" />
            Copiar Link
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <CheckCircle2 size={14} className="mr-1.5" />
                Marcar Presença
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Marcar Presença em Lote</DialogTitle>
                <DialogDescription>
                  Cole os emails dos participantes (um por linha, ou separados por vírgula)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Tipo de presença</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={attendanceType === 'live' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAttendanceType('live')}
                    >
                      <Play size={14} className="mr-1.5" />
                      Ao Vivo
                    </Button>
                    <Button
                      variant={attendanceType === 'replay' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAttendanceType('replay')}
                    >
                      <Repeat size={14} className="mr-1.5" />
                      Replay
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Emails</Label>
                  <Textarea
                    placeholder="email1@exemplo.com&#10;email2@exemplo.com&#10;email3@exemplo.com"
                    value={emailsText}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailsText(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleMarkAttendance} disabled={markAttendanceMutation.isPending}>
                  {markAttendanceMutation.isPending ? 'Salvando...' : 'Marcar Presença'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Inscritos</p>
                <p className="text-2xl font-bold">{metrics.totalRegistrations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-green-600">
                <UserCheck size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Ao Vivo</p>
                <p className="text-2xl font-bold">{metrics.liveAttendees}</p>
                <p className="text-xs text-gray-400">{metrics.attendanceRate}% compareceu</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
                <Repeat size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Replay</p>
                <p className="text-2xl font-bold">{metrics.replayViewers}</p>
                <p className="text-xs text-gray-400">{metrics.replayRate}% assistiu</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#FDF2E9] p-3 text-[#E8792A]">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Engajados</p>
                <p className="text-2xl font-bold">{metrics.totalViewers}</p>
                <p className="text-xs text-gray-400">{metrics.totalViewRate}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Origem do Tráfego</CardTitle>
          <CardDescription>Breakdown por UTM source</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Nenhum dado de tráfego ainda</p>
          ) : (
            <div className="space-y-4">
              {trafficBreakdown.map((source) => {
                const maxRegistrations = Math.max(...trafficBreakdown.map(s => s.registrations));
                const percentage = maxRegistrations > 0 ? (source.registrations / maxRegistrations) * 100 : 0;

                return (
                  <div key={source.source} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{source.source}</span>
                      <div className="flex items-center gap-4 text-gray-500">
                        <span>{source.registrations} inscritos</span>
                        <span>{source.attendees} ao vivo</span>
                        <span>{source.replayViewers} replay</span>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Links Úteis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={copyRegistrationLink}>
              <ExternalLink size={14} className="mr-1.5" />
              Página de Inscrição
            </Button>
            {webinar.replayUrl && (
              <a href={webinar.replayUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Play size={14} className="mr-1.5" />
                  Ver Replay
                </Button>
              </a>
            )}
            {webinar.formTemplateId && (
              <Link href={`/forms/${webinar.formTemplateId}`}>
                <Button variant="outline" size="sm">
                  <Settings2 size={14} className="mr-1.5" />
                  Editar Formulário
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
