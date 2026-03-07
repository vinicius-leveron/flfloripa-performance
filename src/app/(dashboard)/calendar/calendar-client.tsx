'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarEntry {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  scheduledDate: string;
  channel: { platform: string; accountName: string } | null;
  assignee: { id: string; name: string } | null;
}

const categoryColors: Record<string, string> = {
  EDUCATIONAL: 'bg-blue-100 text-blue-700',
  INSTITUTIONAL: 'bg-purple-100 text-purple-700',
  INVITE: 'bg-green-100 text-green-700',
  TESTIMONY: 'bg-orange-100 text-orange-700',
};

const categoryLabels: Record<string, string> = {
  EDUCATIONAL: 'Educacional',
  INSTITUTIONAL: 'Institucional',
  INVITE: 'Convite',
  TESTIMONY: 'Testemunho',
};

const statusLabels: Record<string, string> = {
  PLANNED: 'Planejado',
  CREATED: 'Criado',
  PUBLISHED: 'Publicado',
};

const categoryOptions = [
  { label: 'Educacional', value: 'EDUCATIONAL' },
  { label: 'Institucional', value: 'INSTITUTIONAL' },
  { label: 'Convite', value: 'INVITE' },
  { label: 'Testemunho', value: 'TESTIMONY' },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function CalendarClient() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'EDUCATIONAL',
    scheduledDate: '',
  });

  const { data, isLoading } = useQuery<{ data: CalendarEntry[] }>({
    queryKey: ['calendar', month, year],
    queryFn: () => fetch(`/api/calendar?month=${month}&year=${year}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (entry: typeof formData) => {
      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setShowForm(false);
      setFormData({ title: '', description: '', category: 'EDUCATIONAL', scheduledDate: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calendar'] }),
  });

  const entries = data?.data || [];

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = entry.scheduledDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, CalendarEntry[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário de Conteúdo</h1>
          <p className="text-sm text-gray-500">Planeje e organize suas publicações</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1" /> Nova Entrada
        </Button>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={prevMonth}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-lg font-semibold">{months[month - 1]} {year}</span>
        <Button variant="outline" size="sm" onClick={nextMonth}>
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nova Entrada</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 md:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
            >
              <Input
                placeholder="Título"
                value={formData.title}
                onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                required
              />
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(d => ({ ...d, scheduledDate: e.target.value }))}
                required
              />
              <Select
                options={categoryOptions}
                value={formData.category}
                onChange={(e) => setFormData(d => ({ ...d, category: e.target.value }))}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
              />
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Calendar Entries */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-gray-500">Nenhuma publicação planejada para este mês</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Criar primeira entrada
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, items]) => (
              <div key={date}>
                <p className="mb-2 text-sm font-semibold text-gray-600">
                  {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="space-y-2">
                  {items.map((entry) => (
                    <Card key={entry.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[entry.category]}`}>
                          {categoryLabels[entry.category]}
                        </span>
                        <div>
                          <p className="text-sm font-medium">{entry.title}</p>
                          {entry.description && (
                            <p className="text-xs text-gray-500">{entry.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{statusLabels[entry.status]}</span>
                        {entry.assignee && (
                          <span className="text-xs text-gray-500">{entry.assignee.name}</span>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(entry.id)}
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
