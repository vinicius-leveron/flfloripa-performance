'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select } from '@/shared/components/ui/select';
import { Textarea } from '@/shared/components/ui/textarea';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { ScrollArea } from '@/shared/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  User, Mail, Phone, Calendar, ArrowRight, Clock, Edit2, Save, X, Trash2
} from 'lucide-react';

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

  const currentStageIndex = stages.findIndex(s => s.id === lead?.currentStage.id);
  const nextStage = currentStageIndex >= 0 && currentStageIndex < stages.length - 1
    ? stages[currentStageIndex + 1]
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes do Lead</span>
            {lead && !isEditing && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleEdit}>
                  <Edit2 size={14} className="mr-1" /> Editar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-500 hover:text-red-600"
                  onClick={() => {
                    if (confirm('Excluir este lead?')) {
                      deleteMutation.mutate();
                    }
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !lead ? (
            <div className="py-12 text-center text-gray-500">
              Lead não encontrado
            </div>
          ) : isEditing ? (
            // Edit Form
            <div className="space-y-4 py-4">
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
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={handleCancel}>
                  <X size={14} className="mr-1" /> Cancelar
                </Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending}>
                  <Save size={14} className="mr-1" /> Salvar
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-6 py-4">
              {/* Lead Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-lg font-bold text-white">
                  {lead.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold text-gray-900">{lead.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge style={{ backgroundColor: lead.funnel.color || '#E8792A' }} className="text-white border-transparent">
                      {lead.funnel.name}
                    </Badge>
                    <Badge className="bg-[#FDF2E9] text-[#E8792A] border-transparent">
                      {lead.currentStage.name}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                {lead.email && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={16} className="text-gray-400" />
                    <a href={`mailto:${lead.email}`} className="hover:text-[#E8792A]">{lead.email}</a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} className="text-gray-400" />
                    <a href={`tel:${lead.phone}`} className="hover:text-[#E8792A]">{lead.phone}</a>
                  </div>
                )}
                {lead.channelOrigin && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={16} className="text-gray-400" />
                    <span>via {lead.channelOrigin}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={16} className="text-gray-400" />
                  <span>Cadastrado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Profile Info */}
              {(lead.lifeMoment || lead.inquiry || lead.source) && (
                <div className="space-y-2 p-3 rounded-lg bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase">Perfil</p>
                  <div className="grid gap-2 text-sm">
                    {lead.lifeMoment && (
                      <div>
                        <span className="text-gray-400">Momento:</span>{' '}
                        <span className="text-gray-700">{lifeMomentLabels[lead.lifeMoment] || lead.lifeMoment}</span>
                      </div>
                    )}
                    {lead.inquiry && (
                      <div>
                        <span className="text-gray-400">Inquietude:</span>{' '}
                        <span className="text-gray-700">{lead.inquiry}</span>
                      </div>
                    )}
                    {lead.source && (
                      <div>
                        <span className="text-gray-400">Fonte:</span>{' '}
                        <span className="text-gray-700">{lead.source}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* UTM Info */}
              {(lead.utmSource || lead.utmMedium || lead.utmCampaign) && (
                <div className="space-y-2 p-3 rounded-lg bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase">Tracking</p>
                  <div className="font-mono text-xs text-gray-600">
                    {lead.utmSource && <span className="mr-2">source={lead.utmSource}</span>}
                    {lead.utmMedium && <span className="mr-2">medium={lead.utmMedium}</span>}
                    {lead.utmCampaign && <span>campaign={lead.utmCampaign}</span>}
                  </div>
                </div>
              )}

              {/* Notes */}
              {lead.notes && (
                <div className="space-y-2 p-3 rounded-lg bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 uppercase">Notas</p>
                  <p className="text-sm text-gray-700">{lead.notes}</p>
                </div>
              )}

              {/* Move Stage */}
              <div className="space-y-2 p-3 rounded-lg border border-dashed">
                <p className="text-xs font-medium text-gray-500 uppercase">Mover para estágio</p>
                <div className="flex flex-wrap gap-2">
                  {nextStage && (
                    <Button
                      size="sm"
                      onClick={() => moveMutation.mutate(nextStage.id)}
                      disabled={moveMutation.isPending}
                    >
                      <ArrowRight size={14} className="mr-1" /> {nextStage.name}
                    </Button>
                  )}
                  <Select
                    options={stages.filter(s => s.id !== lead.currentStage.id).map(s => ({ label: `→ ${s.name}`, value: s.id }))}
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        moveMutation.mutate(e.target.value);
                      }
                    }}
                    className="w-44 text-sm"
                  />
                </div>
              </div>

              {/* Timeline */}
              {lead.events && lead.events.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                    <Clock size={12} /> Histórico
                  </p>
                  <div className="space-y-2">
                    {lead.events.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 text-sm">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-[#E8792A]" />
                        <div>
                          <div className="text-gray-700">
                            {event.fromStage.name} → {event.toStage.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(event.createdAt).toLocaleDateString('pt-BR')} por {event.createdBy.name}
                          </div>
                          {event.notes && (
                            <div className="text-xs text-gray-500 italic mt-0.5">{event.notes}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
