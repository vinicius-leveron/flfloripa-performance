'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { LeadModal } from '@/shared/components/lead-modal';
import { Plus, Search, Trash2, ArrowRight, ChevronDown, ChevronUp, Clock, User, Mail, Phone, Video, LayoutGrid, List } from 'lucide-react';

interface LeadEvent {
  id: string;
  createdAt: string;
  notes: string | null;
  fromStage: { name: string };
  toStage: { name: string };
  createdBy: { name: string };
}

interface Lead {
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
  funnelId: string;
  funnel?: { id: string; name: string; slug: string; color: string | null };
}

interface Funnel {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  isDefault: boolean;
  _count: { leads: number; stages: number };
  stages: { id: string; name: string; position: number }[];
}

const lifeMomentOptions = [
  { label: 'Selecionar momento...', value: '' },
  { label: 'Transição de carreira', value: 'transicao_carreira' },
  { label: 'Paternidade/Maternidade', value: 'paternidade' },
  { label: 'Busca espiritual', value: 'busca_espiritual' },
  { label: 'Crise pessoal', value: 'crise_pessoal' },
  { label: 'Autoconhecimento', value: 'autoconhecimento' },
  { label: 'Relacionamento', value: 'relacionamento' },
  { label: 'Outro', value: 'outro' },
];

const lifeMomentLabels: Record<string, string> = {
  transicao_carreira: 'Transição de carreira',
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
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-bold text-white">
      {initials}
    </div>
  );
}

export function LeadsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [selectedFunnelId, setSelectedFunnelId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    channelOrigin: '',
    funnelId: '',
    currentStageId: '',
    notes: '',
    lifeMoment: '',
    inquiry: '',
    source: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  });

  // Fetch all funnels
  const { data: funnelsData } = useQuery<{ data: Funnel[] }>({
    queryKey: ['funnels'],
    queryFn: () => fetch('/api/funnels').then(r => r.json()),
  });

  const funnels = funnelsData?.data || [];

  // Set default funnel on first load
  const defaultFunnel = funnels.find(f => f.isDefault) || funnels[0];
  const activeFunnelId = selectedFunnelId || defaultFunnel?.id || '';

  // Fetch stages for selected funnel
  const { data: stagesData } = useQuery<{ data: FunnelStage[] }>({
    queryKey: ['funnel-stages', activeFunnelId],
    queryFn: () => fetch(`/api/funnel/stages?funnelId=${activeFunnelId}`).then(r => r.json()),
    enabled: !!activeFunnelId,
  });

  const stages = stagesData?.data || [];

  // Fetch leads for selected funnel
  const { data, isLoading } = useQuery<{ data: Lead[]; meta: { total: number; page: number; totalPages: number } }>({
    queryKey: ['leads', search, stageFilter, activeFunnelId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (stageFilter) params.set('stageId', stageFilter);
      if (activeFunnelId) params.set('funnelId', activeFunnelId);
      return fetch(`/api/leads?${params}`).then(r => r.json());
    },
    enabled: !!activeFunnelId,
  });

  const createMutation = useMutation({
    mutationFn: async (lead: typeof formData) => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['funnel-stages'] });
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', channelOrigin: '', funnelId: '', currentStageId: '', notes: '', lifeMoment: '', inquiry: '', source: '', utmSource: '', utmMedium: '', utmCampaign: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['funnel-stages'] });
    },
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, toStageId }: { id: string; toStageId: string }) => {
      await fetch(`/api/leads/${id}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStageId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['funnel-stages'] });
    },
  });

  const leads = data?.data || [];
  const stageOptions = [
    { label: 'Todos os estágios', value: '' },
    ...stages.map(s => ({ label: s.name, value: s.id })),
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
            <p className="text-sm text-gray-500">Gerencie contatos no funil de ingresso</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1" /> Novo Lead
          </Button>
        </div>

        {/* Funnel Tabs */}
        {funnels.length > 0 && (
          <div className="flex gap-2 border-b pb-2">
            {funnels.map(funnel => (
              <button
                key={funnel.id}
                onClick={() => {
                  setSelectedFunnelId(funnel.id);
                  setStageFilter('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeFunnelId === funnel.id
                    ? 'bg-white border border-b-white -mb-[3px] text-gray-900'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeFunnelId === funnel.id && funnel.color ? { borderTopColor: funnel.color, borderTopWidth: '3px' } : {}}
              >
                {funnel.name}
                <span className="ml-2 text-xs text-gray-400">({funnel._count.leads})</span>
              </button>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            options={stageOptions}
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-48"
          />
        </div>

        {/* Create Form */}
        {showForm && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Novo Lead</CardTitle></CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const submitData = { ...formData };
                  // Use selected funnel or current funnel
                  if (!submitData.funnelId) {
                    submitData.funnelId = activeFunnelId;
                  }
                  // Use first stage of selected funnel if not set
                  if (!submitData.currentStageId && stages.length > 0) {
                    submitData.currentStageId = stages[0].id;
                  }
                  createMutation.mutate(submitData);
                }}
              >
                {/* Dados básicos */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Dados do contato</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input placeholder="Nome *" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} required />
                    <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))} />
                    <Input placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))} />
                    <Input placeholder="Origem (ex: Instagram)" value={formData.channelOrigin} onChange={(e) => setFormData(d => ({ ...d, channelOrigin: e.target.value }))} />
                  </div>
                </div>

                {/* Funil e Estágio */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Funil</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select
                      options={funnels.map(f => ({ label: f.name, value: f.id }))}
                      value={formData.funnelId || activeFunnelId}
                      onChange={(e) => {
                        setFormData(d => ({ ...d, funnelId: e.target.value, currentStageId: '' }));
                      }}
                    />
                    <Select
                      options={(formData.funnelId ? funnels.find(f => f.id === formData.funnelId)?.stages || stages : stages).map(s => ({ label: s.name, value: s.id }))}
                      value={formData.currentStageId}
                      onChange={(e) => setFormData(d => ({ ...d, currentStageId: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Perfil / Avatar */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Perfil / Avatar</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select
                      options={lifeMomentOptions}
                      value={formData.lifeMoment}
                      onChange={(e) => setFormData(d => ({ ...d, lifeMoment: e.target.value }))}
                    />
                    <Input placeholder="Inquietude principal" value={formData.inquiry} onChange={(e) => setFormData(d => ({ ...d, inquiry: e.target.value }))} />
                    <Input placeholder="Fonte/Criativo" value={formData.source} onChange={(e) => setFormData(d => ({ ...d, source: e.target.value }))} />
                  </div>
                </div>

                {/* UTMs */}
                <div>
                  <p className="mb-2 text-xs font-medium text-gray-500 uppercase">Tracking (UTMs)</p>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Input placeholder="utm_source" value={formData.utmSource} onChange={(e) => setFormData(d => ({ ...d, utmSource: e.target.value }))} />
                    <Input placeholder="utm_medium" value={formData.utmMedium} onChange={(e) => setFormData(d => ({ ...d, utmMedium: e.target.value }))} />
                    <Input placeholder="utm_campaign" value={formData.utmCampaign} onChange={(e) => setFormData(d => ({ ...d, utmCampaign: e.target.value }))} />
                  </div>
                </div>

                {/* Notes */}
                <Input placeholder="Notas" value={formData.notes} onChange={(e) => setFormData(d => ({ ...d, notes: e.target.value }))} />

                <div className="flex gap-2">
                  <Button type="submit" disabled={createMutation.isPending}>Salvar</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Leads Views */}
        <Tabs defaultValue="pipeline">
          <TabsList>
            <TabsTrigger value="pipeline"><LayoutGrid size={14} className="mr-1" /> Pipeline</TabsTrigger>
            <TabsTrigger value="list"><List size={14} className="mr-1" /> Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline">
            {isLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : leads.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Nenhum lead para exibir no pipeline</p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-4">
                {stages.map((stage) => {
                  const stageLeads = leads.filter(l => l.currentStage.id === stage.id);
                  const nextStageObj = stages.find(s => s.position === stage.position + 1);
                  return (
                    <div key={stage.id} className="flex-shrink-0 w-64">
                      <div className="mb-2 flex items-center justify-between rounded-lg bg-[#1B2A4A] px-3 py-2">
                        <span className="text-sm font-medium text-white">{stage.name}</span>
                        <Badge className="bg-white/20 text-white border-transparent text-[10px]">{stageLeads.length}</Badge>
                      </div>
                      <ScrollArea className="h-[500px]">
                        <div className="space-y-2 pr-2">
                          {stageLeads.map((lead) => (
                            <Card key={lead.id} className="transition-shadow hover:shadow-md cursor-pointer" onClick={() => { setSelectedLeadId(lead.id); setModalOpen(true); }}>
                              <CardContent className="p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <LeadAvatar name={lead.name} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium truncate hover:text-[#E8792A] transition-colors">{lead.name}</p>
                                    {lead.channelOrigin && (
                                      <p className="text-[10px] text-gray-400">via {lead.channelOrigin}</p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {lead.lifeMoment && (
                                    <Badge variant="info" className="text-[8px] px-1 py-0">{lifeMomentLabels[lead.lifeMoment] || lead.lifeMoment}</Badge>
                                  )}
                                  {lead.vslWatched && (
                                    <Badge variant="warning" className="text-[8px] px-1 py-0">VSL</Badge>
                                  )}
                                </div>
                                {nextStageObj && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="mt-2 w-full text-xs h-7"
                                    onClick={() => moveMutation.mutate({ id: lead.id, toStageId: nextStageObj.id })}
                                    disabled={moveMutation.isPending}
                                  >
                                    <ArrowRight size={12} className="mr-1" /> {nextStageObj.name}
                                  </Button>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                          {stageLeads.length === 0 && (
                            <p className="py-8 text-center text-xs text-gray-400">Vazio</p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">Nenhum lead encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Registre seu primeiro lead para começar o acompanhamento</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus size={16} className="mr-1" /> Registrar primeiro lead
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const currentIdx = stages.findIndex(s => s.id === lead.currentStage.id);
              const nextStage = currentIdx >= 0 && currentIdx < stages.length - 1 ? stages[currentIdx + 1] : null;
              const isExpanded = expandedLead === lead.id;

              return (
                <Card key={lead.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <LeadAvatar name={lead.name} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedLeadId(lead.id); setModalOpen(true); }}
                            className="font-medium truncate hover:text-[#E8792A] transition-colors text-left"
                          >
                            {lead.name}
                          </button>
                          <button
                            onClick={() => setExpandedLead(isExpanded ? null : lead.id)}
                            className="rounded p-0.5 text-gray-400 hover:bg-gray-100"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {lead.email && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                  <Mail size={10} /> {lead.email}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Email</TooltipContent>
                            </Tooltip>
                          )}
                          {lead.phone && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                  <Phone size={10} /> {lead.phone}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Telefone</TooltipContent>
                            </Tooltip>
                          )}
                          {lead.channelOrigin && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {lead.channelOrigin}
                            </Badge>
                          )}
                          {lead.lifeMoment && (
                            <Badge variant="info" className="text-[10px] px-1.5 py-0">
                              {lifeMomentLabels[lead.lifeMoment] || lead.lifeMoment}
                            </Badge>
                          )}
                          {lead.vslWatched && (
                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                              <Video size={8} className="mr-0.5" /> VSL
                            </Badge>
                          )}
                        </div>
                        <Badge className="mt-1 text-[10px] px-1.5 py-0 bg-[#FDF2E9] text-[#E8792A] border-transparent">
                          {lead.currentStage.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {nextStage && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => moveMutation.mutate({ id: lead.id, toStageId: nextStage.id })}
                            disabled={moveMutation.isPending}
                          >
                            <ArrowRight size={14} className="mr-1" />
                            {nextStage.name}
                          </Button>
                        )}
                        <Select
                          options={stages.filter(s => s.id !== lead.currentStage.id).map(s => ({ label: `→ ${s.name}`, value: s.id }))}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              moveMutation.mutate({ id: lead.id, toStageId: e.target.value });
                            }
                          }}
                          className="w-36 text-xs"
                        />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => deleteMutation.mutate(lead.id)}
                              className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Excluir lead</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 px-4 py-3 space-y-3">
                      {/* Profile info */}
                      <div className="grid gap-2 md:grid-cols-3 text-xs">
                        {lead.inquiry && (
                          <div>
                            <span className="text-gray-400">Inquietude:</span>{' '}
                            <span className="text-gray-700">{lead.inquiry}</span>
                          </div>
                        )}
                        {lead.source && (
                          <div>
                            <span className="text-gray-400">Fonte/Criativo:</span>{' '}
                            <span className="text-gray-700">{lead.source}</span>
                          </div>
                        )}
                        {lead.adSpend !== null && lead.adSpend > 0 && (
                          <div>
                            <span className="text-gray-400">Ad Spend:</span>{' '}
                            <span className="text-gray-700">R$ {lead.adSpend.toFixed(2)}</span>
                          </div>
                        )}
                        {lead.utmSource && (
                          <div>
                            <span className="text-gray-400">UTM:</span>{' '}
                            <span className="font-mono text-gray-700">{lead.utmSource}/{lead.utmMedium}/{lead.utmCampaign}</span>
                          </div>
                        )}
                        {lead.vslWatchTime !== null && (
                          <div>
                            <span className="text-gray-400">Tempo VSL:</span>{' '}
                            <span className="text-gray-700">{Math.floor(lead.vslWatchTime / 60)}min {lead.vslWatchTime % 60}s</span>
                          </div>
                        )}
                        {lead.notes && (
                          <div className="md:col-span-3">
                            <span className="text-gray-400">Notas:</span>{' '}
                            <span className="text-gray-700">{lead.notes}</span>
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      {lead.events && lead.events.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-medium text-gray-500 flex items-center gap-1">
                            <Clock size={12} /> Histórico de movimentações
                          </p>
                          <div className="space-y-1">
                            {lead.events.map((event) => (
                              <div key={event.id} className="flex items-center gap-2 text-xs text-gray-600">
                                <div className="h-1.5 w-1.5 rounded-full bg-[#E8792A]" />
                                <span className="text-gray-400">
                                  {new Date(event.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                                <span>
                                  {event.fromStage.name} → {event.toStage.name}
                                </span>
                                <span className="text-gray-400">por {event.createdBy.name}</span>
                                {event.notes && <span className="italic text-gray-400">({event.notes})</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
            {data?.meta && (
              <p className="text-center text-xs text-gray-400">
                {data.meta.total} leads encontrados
              </p>
            )}
          </div>
        )}
          </TabsContent>
        </Tabs>

        {/* Lead Modal */}
        <LeadModal
          leadId={selectedLeadId}
          open={modalOpen}
          onOpenChange={(open) => {
            setModalOpen(open);
            if (!open) setSelectedLeadId(null);
          }}
          stages={stages}
        />
      </div>
    </TooltipProvider>
  );
}
