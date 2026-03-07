'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Plus, Search, Trash2, ArrowRight } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  channelOrigin: string | null;
  notes: string | null;
  createdAt: string;
  currentStage: { id: string; name: string; position: number };
  registeredBy: { id: string; name: string };
}

interface FunnelStage {
  id: string;
  name: string;
  position: number;
}

export function LeadsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    channelOrigin: '',
    currentStageId: '',
    notes: '',
  });

  const { data: stagesData } = useQuery<{ data: FunnelStage[] }>({
    queryKey: ['funnel-stages'],
    queryFn: () => fetch('/api/funnel/stages').then(r => r.json()),
  });

  const stages = stagesData?.data || [];

  const { data, isLoading } = useQuery<{ data: Lead[]; meta: { total: number; page: number; totalPages: number } }>({
    queryKey: ['leads', search, stageFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (stageFilter) params.set('stageId', stageFilter);
      return fetch(`/api/leads?${params}`).then(r => r.json());
    },
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
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', channelOrigin: '', currentStageId: '', notes: '' });
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-500">Gerencie contatos no funil de conversão</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1" /> Novo Lead
        </Button>
      </div>

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
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                const data = { ...formData };
                if (!data.currentStageId && stages.length > 0) {
                  data.currentStageId = stages[stages.length > 3 ? 3 : stages.length - 1].id;
                }
                createMutation.mutate(data);
              }}
            >
              <Input placeholder="Nome *" value={formData.name} onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))} required />
              <Input placeholder="Email" type="email" value={formData.email} onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))} />
              <Input placeholder="Telefone" value={formData.phone} onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))} />
              <Input placeholder="Origem (ex: Instagram)" value={formData.channelOrigin} onChange={(e) => setFormData(d => ({ ...d, channelOrigin: e.target.value }))} />
              <Select
                options={stages.map(s => ({ label: s.name, value: s.id }))}
                value={formData.currentStageId}
                onChange={(e) => setFormData(d => ({ ...d, currentStageId: e.target.value }))}
              />
              <Input placeholder="Notas" value={formData.notes} onChange={(e) => setFormData(d => ({ ...d, notes: e.target.value }))} />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>Salvar</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Leads List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Nenhum lead encontrado</p>
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

            return (
              <Card key={lead.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{lead.name}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {lead.email && <span>{lead.email}</span>}
                      {lead.phone && <span>{lead.phone}</span>}
                      {lead.channelOrigin && <span>via {lead.channelOrigin}</span>}
                    </div>
                    <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {lead.currentStage.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => deleteMutation.mutate(lead.id)}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
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
    </div>
  );
}
