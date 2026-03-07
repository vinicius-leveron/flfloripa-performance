'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Separator } from '@/shared/components/ui/separator';
import { Select } from '@/shared/components/ui/select';
import { ArrowLeft, ArrowRight, Trash2, Clock, Mail, Phone, MapPin, Video, DollarSign, ExternalLink } from 'lucide-react';

interface LeadEvent {
  id: string;
  createdAt: string;
  notes: string | null;
  fromStage: { name: string };
  toStage: { name: string };
  createdBy: { name: string };
}

interface LeadDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  channelOrigin: string | null;
  notes: string | null;
  lifeMoment: string | null;
  inquiry: string | null;
  source: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  adSpend: number | null;
  vslWatched: boolean;
  vslWatchTime: number | null;
  createdAt: string;
  currentStage: { id: string; name: string; position: number };
  registeredBy: { id: string; name: string };
  events: LeadEvent[];
}

interface FunnelStage {
  id: string;
  name: string;
  position: number;
}

const lifeMomentLabels: Record<string, string> = {
  transicao_carreira: 'Transicao de carreira',
  paternidade: 'Paternidade/Maternidade',
  busca_espiritual: 'Busca espiritual',
  crise_pessoal: 'Crise pessoal',
  autoconhecimento: 'Autoconhecimento',
  relacionamento: 'Relacionamento',
  outro: 'Outro',
};

function LeadAvatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-lg font-bold text-white">
      {initials}
    </div>
  );
}

export function LeadDetailClient({ leadId }: { leadId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: LeadDetail }>({
    queryKey: ['lead', leadId],
    queryFn: () => fetch(`/api/leads/${leadId}`).then(r => r.json()),
  });

  const { data: stagesData } = useQuery<{ data: FunnelStage[] }>({
    queryKey: ['funnel-stages'],
    queryFn: () => fetch('/api/funnel/stages').then(r => r.json()),
  });

  const stages = stagesData?.data || [];
  const lead = data?.data;

  const moveMutation = useMutation({
    mutationFn: async (toStageId: string) => {
      await fetch(`/api/leads/${leadId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStageId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      router.push('/leads');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <Link href="/leads" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Voltar aos Leads
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Lead nao encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentIdx = stages.findIndex(s => s.id === lead.currentStage.id);
  const nextStage = currentIdx >= 0 && currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> Leads
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex items-center gap-3">
            <LeadAvatar name={lead.name} />
            <div>
              <h1 className="text-xl font-bold text-[#1B2A4A]">{lead.name}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className="bg-[#FDF2E9] text-[#E8792A] border-transparent">
                  {lead.currentStage.name}
                </Badge>
                <span className="text-xs text-gray-400">
                  Registrado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {nextStage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => moveMutation.mutate(nextStage.id)}
              disabled={moveMutation.isPending}
            >
              <ArrowRight size={14} className="mr-1" />
              {nextStage.name}
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este lead?')) {
                deleteMutation.mutate();
              }
            }}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Profile */}
        <div className="space-y-4">
          {/* Contact Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span>{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.channelOrigin && (
                <div className="flex items-center gap-2 text-sm">
                  <ExternalLink size={14} className="text-gray-400" />
                  <span>Origem: {lead.channelOrigin}</span>
                </div>
              )}
              {!lead.email && !lead.phone && !lead.channelOrigin && (
                <p className="text-xs text-gray-400">Nenhum contato registrado</p>
              )}
            </CardContent>
          </Card>

          {/* Profile / Avatar */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.lifeMoment && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Momento de vida</span>
                  <Badge variant="info">{lifeMomentLabels[lead.lifeMoment] || lead.lifeMoment}</Badge>
                </div>
              )}
              {lead.inquiry && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Inquietude</span>
                  <span className="text-right max-w-[200px]">{lead.inquiry}</span>
                </div>
              )}
              {lead.source && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Fonte/Criativo</span>
                  <span>{lead.source}</span>
                </div>
              )}
              {lead.notes && (
                <div className="pt-2 border-t">
                  <p className="text-xs text-gray-400 mb-1">Notas</p>
                  <p className="text-sm text-gray-700">{lead.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tracking */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {lead.utmSource && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">UTM</span>
                  <span className="font-mono text-xs">{lead.utmSource}/{lead.utmMedium}/{lead.utmCampaign}</span>
                </div>
              )}
              {lead.adSpend !== null && lead.adSpend > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><DollarSign size={12} /> Ad Spend</span>
                  <span className="font-medium">R$ {lead.adSpend.toFixed(2)}</span>
                </div>
              )}
              {lead.vslWatched && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><Video size={12} /> VSL</span>
                  <span>
                    {lead.vslWatchTime !== null
                      ? `${Math.floor(lead.vslWatchTime / 60)}min ${lead.vslWatchTime % 60}s`
                      : 'Assistiu'}
                  </span>
                </div>
              )}
              {!lead.utmSource && !lead.adSpend && !lead.vslWatched && (
                <p className="text-xs text-gray-400">Sem dados de tracking</p>
              )}
            </CardContent>
          </Card>

          {/* Stage Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">Mover Estagio</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                options={stages.filter(s => s.id !== lead.currentStage.id).map(s => ({ label: s.name, value: s.id }))}
                value=""
                onChange={(e) => {
                  if (e.target.value) moveMutation.mutate(e.target.value);
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-500">
              <Clock size={14} /> Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lead.events.length === 0 ? (
              <div className="py-8 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">Nenhuma movimentacao registrada</p>
              </div>
            ) : (
              <div className="relative space-y-4">
                {/* Timeline line */}
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-gray-200" />

                {lead.events.map((event) => (
                  <div key={event.id} className="relative flex gap-3 pl-6">
                    <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-[#E8792A] bg-white" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {event.fromStage.name} → {event.toStage.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                        {' '}por {event.createdBy.name}
                      </p>
                      {event.notes && (
                        <p className="mt-1 text-xs italic text-gray-400">{event.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Registration event */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="h-2 w-2 rounded-full bg-[#1B2A4A]" />
                <span>
                  Registrado por {lead.registeredBy.name} em{' '}
                  {new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
