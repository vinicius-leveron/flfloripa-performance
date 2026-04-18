'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/shared/components/ui/sheet';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs';
import { FunnelStepper } from '@/shared/components/funnel-stepper';
import { InfoRow } from '@/shared/components/info-row';
import { LeadQuickActions } from '@/shared/components/lead-quick-actions';
import { toast } from 'sonner';
import {
  Mail, Phone, Calendar, ArrowRight, Clock, Edit2, Save, X, Trash2,
  MoreVertical, Globe, Target, MessageSquare, Link2, Eye, Timer,
  DollarSign, User, Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';

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
  funnelId: string;
  funnel: { id: string; name: string; slug: string; color: string | null };
  currentStage: { id: string; name: string; position: number; funnelId: string };
  registeredBy: { id: string; name: string };
  events: LeadEvent[];
}

interface FunnelStage {
  id: string;
  name: string;
  position: number;
}

interface LeadModalProps {
  leadId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: FunnelStage[];
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

function darkenColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max((num >> 16) - amt, 0);
  const G = Math.max(((num >> 8) & 0x00ff) - amt, 0);
  const B = Math.max((num & 0x0000ff) - amt, 0);
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

function getTimeAgo(date: string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem atrás`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
  return `${Math.floor(diffDays / 365)} anos atrás`;
}

export function LeadModal({ leadId, open, onOpenChange, stages }: LeadModalProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  const { data, isLoading } = useQuery<{ data: Lead }>({
    queryKey: ['lead', leadId],
    queryFn: () => fetch(`/api/leads/${leadId}`).then(r => r.json()),
    enabled: !!leadId && open,
  });

  const lead = data?.data;
  const funnelColor = lead?.funnel.color || '#E8792A';

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Lead>) => {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Erro ao atualizar lead');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['funnel-stages'] });
      toast.success('Lead atualizado com sucesso');
      setIsEditing(false);
    },
    onError: () => {
      toast.error('Erro ao atualizar lead');
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ['funnel-stages'] });
      toast.success('Lead movido com sucesso');
    },
    onError: () => {
      toast.error('Erro ao mover lead');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/leads/${leadId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['funnel-stages'] });
      toast.success('Lead excluído');
      onOpenChange(false);
    },
    onError: () => {
      toast.error('Erro ao excluir lead');
    },
  });

  const handleEdit = () => {
    if (lead) {
      setFormData({
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        channelOrigin: lead.channelOrigin,
        notes: lead.notes,
        lifeMoment: lead.lifeMoment,
        inquiry: lead.inquiry,
        source: lead.source,
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({});
  };

  const handleStageClick = (stageId: string) => {
    if (stageId !== lead?.currentStage.id) {
      moveMutation.mutate(stageId);
    }
  };

  const currentStageIndex = stages.findIndex(s => s.id === lead?.currentStage.id);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1
    ? stages[currentStageIndex + 1]
    : null;

  const otherStages = stages.filter(s => s.id !== lead?.currentStage.id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[520px] p-0 flex flex-col"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !lead ? (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Lead não encontrado
          </div>
        ) : isEditing ? (
          // Edit Mode
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Editar Lead</h2>
                <Button variant="ghost" size="icon" onClick={handleCancel}>
                  <X size={18} />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="channelOrigin">Origem</Label>
                    <Input
                      id="channelOrigin"
                      value={formData.channelOrigin || ''}
                      onChange={(e) => setFormData(d => ({ ...d, channelOrigin: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lifeMoment">Momento de vida</Label>
                    <Select
                      id="lifeMoment"
                      options={lifeMomentOptions}
                      value={formData.lifeMoment || ''}
                      onChange={(e) => setFormData(d => ({ ...d, lifeMoment: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">Fonte/Criativo</Label>
                    <Input
                      id="source"
                      value={formData.source || ''}
                      onChange={(e) => setFormData(d => ({ ...d, source: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inquiry">Inquietude</Label>
                  <Input
                    id="inquiry"
                    value={formData.inquiry || ''}
                    onChange={(e) => setFormData(d => ({ ...d, inquiry: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(d => ({ ...d, notes: e.target.value }))}
                    rows={4}
                  />
                </div>
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-white flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save size={14} className="mr-1.5" /> Salvar
              </Button>
            </div>
          </div>
        ) : (
          // View Mode
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Gradient Header */}
            <div
              className="p-6 pt-12"
              style={{
                background: `linear-gradient(135deg, ${funnelColor} 0%, ${darkenColor(funnelColor, 20)} 100%)`,
              }}
            >
              {/* Avatar and Info */}
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center text-2xl font-bold shadow-lg"
                    style={{ color: funnelColor }}
                  >
                    {getInitials(lead.name)}
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-white">
                  <h2 className="text-xl font-bold truncate">{lead.name}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge className="bg-white/20 text-white border-transparent text-xs">
                      {lead.funnel.name}
                    </Badge>
                    <Badge className="bg-white/30 text-white border-transparent text-xs font-semibold">
                      {lead.currentStage.name}
                    </Badge>
                  </div>

                  {/* Quick Actions */}
                  <div className="mt-3">
                    <LeadQuickActions
                      phone={lead.phone}
                      email={lead.email}
                      name={lead.name}
                    />
                  </div>
                </div>
              </div>

              {/* Funnel Stepper */}
              <div className="mt-6">
                <FunnelStepper
                  stages={stages}
                  currentStageId={lead.currentStage.id}
                  funnelColor={funnelColor}
                  onStageClick={handleStageClick}
                  disabled={moveMutation.isPending}
                />
              </div>
            </div>

            {/* Tabs Content */}
            <Tabs defaultValue="overview" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="mx-6 mt-4 mb-0 bg-gray-100">
                <TabsTrigger value="overview" className="flex-1">Visão Geral</TabsTrigger>
                <TabsTrigger value="profile" className="flex-1">Perfil</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">Histórico</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                {/* Overview Tab */}
                <TabsContent value="overview" className="p-6 space-y-5 m-0">
                  {/* Status Card */}
                  <div className="rounded-xl border p-4 bg-gradient-to-br from-gray-50 to-white">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${funnelColor}20` }}
                      >
                        <Target size={24} style={{ color: funnelColor }} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Estágio atual</p>
                        <p className="text-lg font-semibold" style={{ color: funnelColor }}>
                          {lead.currentStage.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                      <Timer size={12} />
                      Cadastrado {getTimeAgo(lead.createdAt)}
                    </div>
                  </div>

                  {/* Metrics */}
                  {(lead.vslWatched || (lead.adSpend && lead.adSpend > 0)) && (
                    <div className="grid grid-cols-2 gap-3">
                      {lead.vslWatched && (
                        <div className="rounded-lg border p-3 bg-blue-50">
                          <div className="flex items-center gap-2 text-blue-600">
                            <Eye size={16} />
                            <span className="text-xs font-medium">VSL</span>
                          </div>
                          <p className="mt-1 text-lg font-semibold text-blue-700">
                            {lead.vslWatchTime ? `${Math.round(lead.vslWatchTime / 60)}min` : 'Assistiu'}
                          </p>
                        </div>
                      )}
                      {lead.adSpend && lead.adSpend > 0 && (
                        <div className="rounded-lg border p-3 bg-green-50">
                          <div className="flex items-center gap-2 text-green-600">
                            <DollarSign size={16} />
                            <span className="text-xs font-medium">Ad Spend</span>
                          </div>
                          <p className="mt-1 text-lg font-semibold text-green-700">
                            R$ {lead.adSpend.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Activity */}
                  {lead.events && lead.events.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-3">
                        Atividade Recente
                      </h4>
                      <div className="space-y-2">
                        {lead.events.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 text-sm"
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: funnelColor }}
                            />
                            <span className="text-gray-600">
                              {event.fromStage.name} → {event.toStage.name}
                            </span>
                            <span className="text-gray-400 text-xs ml-auto">
                              {getTimeAgo(event.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes Preview */}
                  {lead.notes && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Notas
                      </h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg line-clamp-3">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Profile Tab */}
                <TabsContent value="profile" className="p-6 space-y-1 m-0">
                  <InfoRow
                    icon={<Mail size={16} />}
                    label="Email"
                    value={lead.email}
                    copyable
                    href={lead.email ? `mailto:${lead.email}` : undefined}
                  />
                  <InfoRow
                    icon={<Phone size={16} />}
                    label="Telefone"
                    value={lead.phone}
                    copyable
                    href={lead.phone ? `tel:${lead.phone}` : undefined}
                  />
                  <InfoRow
                    icon={<Globe size={16} />}
                    label="Origem"
                    value={lead.channelOrigin}
                  />
                  <InfoRow
                    icon={<Sparkles size={16} />}
                    label="Momento de Vida"
                    value={lead.lifeMoment ? lifeMomentLabels[lead.lifeMoment] || lead.lifeMoment : null}
                  />
                  <InfoRow
                    icon={<MessageSquare size={16} />}
                    label="Inquietude"
                    value={lead.inquiry}
                  />
                  <InfoRow
                    icon={<Link2 size={16} />}
                    label="Fonte/Criativo"
                    value={lead.source}
                  />
                  <InfoRow
                    icon={<User size={16} />}
                    label="Registrado por"
                    value={lead.registeredBy?.name}
                  />
                  <InfoRow
                    icon={<Calendar size={16} />}
                    label="Data de cadastro"
                    value={new Date(lead.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric',
                    })}
                  />

                  {/* UTM Info */}
                  {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
                    <div className="mt-4 p-3 rounded-lg bg-gray-50 border">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Tracking UTM
                      </p>
                      <div className="font-mono text-xs text-gray-600 space-y-1">
                        {lead.utmSource && <div>source: {lead.utmSource}</div>}
                        {lead.utmMedium && <div>medium: {lead.utmMedium}</div>}
                        {lead.utmCampaign && <div>campaign: {lead.utmCampaign}</div>}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {lead.notes && (
                    <div className="mt-4">
                      <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                        Notas
                      </h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                        {lead.notes}
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="history" className="p-6 m-0">
                  {lead.events && lead.events.length > 0 ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div
                        className="absolute left-[11px] top-3 bottom-3 w-0.5"
                        style={{
                          background: `linear-gradient(to bottom, ${funnelColor}, ${funnelColor}40)`,
                        }}
                      />

                      <div className="space-y-4">
                        {lead.events.map((event, index) => (
                          <div key={event.id} className="relative flex gap-4">
                            {/* Timeline dot */}
                            <div
                              className="relative z-10 h-6 w-6 rounded-full border-2 bg-white flex items-center justify-center flex-shrink-0"
                              style={{ borderColor: funnelColor }}
                            >
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: index === 0 ? funnelColor : '#9CA3AF' }}
                              />
                            </div>

                            {/* Event content */}
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">
                                  {event.fromStage.name}
                                </Badge>
                                <ArrowRight size={12} className="text-gray-400" />
                                <Badge
                                  className="text-xs text-white"
                                  style={{ backgroundColor: funnelColor }}
                                >
                                  {event.toStage.name}
                                </Badge>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                {new Date(event.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                                {' '} por {event.createdBy.name}
                              </div>
                              {event.notes && (
                                <p className="mt-2 text-sm text-gray-600 italic bg-gray-50 p-2 rounded">
                                  {event.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock size={32} className="mx-auto mb-2 opacity-40" />
                      <p>Nenhuma movimentação registrada</p>
                    </div>
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>

            {/* Sticky Footer */}
            <div className="border-t p-4 bg-white flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2">
                <Select
                  options={[
                    { label: 'Mover para...', value: '' },
                    ...otherStages.map(s => ({ label: s.name, value: s.id })),
                  ]}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      moveMutation.mutate(e.target.value);
                    }
                  }}
                  className="w-40 text-sm"
                />
                {nextStage && (
                  <Button
                    size="sm"
                    onClick={() => moveMutation.mutate(nextStage.id)}
                    disabled={moveMutation.isPending}
                    style={{ backgroundColor: funnelColor }}
                    className="text-white hover:opacity-90"
                  >
                    <ArrowRight size={14} className="mr-1.5" />
                    {nextStage.name}
                  </Button>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit2 size={14} className="mr-1.5" /> Editar
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => {
                      if (confirm('Tem certeza que deseja excluir este lead?')) {
                        deleteMutation.mutate();
                      }
                    }}
                  >
                    <Trash2 size={14} className="mr-2" />
                    Excluir lead
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
