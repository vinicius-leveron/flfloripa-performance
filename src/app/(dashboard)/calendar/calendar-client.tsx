'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Plus, ChevronLeft, ChevronRight, X, Calendar, List } from 'lucide-react';

interface CalendarEntry {
  id: string;
  title: string;
  description: string | null;
  category: string;
  contentTheme: string | null;
  contentFormat: string | null;
  status: string;
  scheduledDate: string;
  channel: { platform: string; accountName: string } | null;
  assignee: { id: string; name: string } | null;
}

interface UserOption {
  id: string;
  name: string;
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

const themeColors: Record<string, string> = {
  ENSINAMENTO: 'bg-blue-100 text-blue-700',
  CONVITE: 'bg-green-100 text-green-700',
  EXPERIENCIA: 'bg-purple-100 text-purple-700',
  REFORCO_CONVITE: 'bg-emerald-100 text-emerald-700',
  DICA_LEITURA: 'bg-amber-100 text-amber-700',
  PODCAST: 'bg-pink-100 text-pink-700',
  DIVULGACAO: 'bg-indigo-100 text-indigo-700',
  OUTRO: 'bg-gray-100 text-gray-700',
};

const themeLabels: Record<string, string> = {
  ENSINAMENTO: 'Ensinamento',
  CONVITE: 'Convite',
  EXPERIENCIA: 'Experiência',
  REFORCO_CONVITE: 'Reforço Convite',
  DICA_LEITURA: 'Dica de Leitura',
  PODCAST: 'Podcast',
  DIVULGACAO: 'Divulgação',
  OUTRO: 'Outro',
};

const formatLabels: Record<string, string> = {
  FEED_POST: 'Feed Post',
  REEL: 'Reels',
  STORY: 'Story',
  VIDEO_LONGO: 'Vídeo Longo',
  IMAGEM_ESTATICA: 'Imagem',
  EVENTO: 'Evento',
  REPOST: 'Repost',
  OUTRO: 'Outro',
};

const formatIcons: Record<string, string> = {
  FEED_POST: '📝',
  REEL: '🎬',
  STORY: '📸',
  VIDEO_LONGO: '🎥',
  IMAGEM_ESTATICA: '🖼️',
  EVENTO: '📅',
  REPOST: '🔄',
  OUTRO: '📎',
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

const themeOptions = [
  { label: 'Nenhum', value: '' },
  { label: 'Ensinamento', value: 'ENSINAMENTO' },
  { label: 'Convite', value: 'CONVITE' },
  { label: 'Experiência', value: 'EXPERIENCIA' },
  { label: 'Reforço Convite', value: 'REFORCO_CONVITE' },
  { label: 'Dica de Leitura', value: 'DICA_LEITURA' },
  { label: 'Podcast', value: 'PODCAST' },
  { label: 'Divulgação', value: 'DIVULGACAO' },
  { label: 'Outro', value: 'OUTRO' },
];

const formatOptions = [
  { label: 'Nenhum', value: '' },
  { label: 'Feed Post', value: 'FEED_POST' },
  { label: 'Reels', value: 'REEL' },
  { label: 'Story', value: 'STORY' },
  { label: 'Vídeo Longo', value: 'VIDEO_LONGO' },
  { label: 'Imagem', value: 'IMAGEM_ESTATICA' },
  { label: 'Evento', value: 'EVENTO' },
  { label: 'Repost', value: 'REPOST' },
  { label: 'Outro', value: 'OUTRO' },
];

const platformFilterOptions = [
  { label: 'Todos os Canais', value: '' },
  { label: 'Instagram', value: 'INSTAGRAM' },
  { label: 'TikTok', value: 'TIKTOK' },
  { label: 'LinkedIn', value: 'LINKEDIN' },
  { label: 'YouTube', value: 'YOUTUBE' },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type ViewMode = 'monthly' | 'weekly';

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const start = new Date(date);
  start.setDate(start.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function CalendarClient() {
  const queryClient = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [weekDate, setWeekDate] = useState(now);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [filterChannel, setFilterChannel] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterTheme, setFilterTheme] = useState('');
  const [filterFormat, setFilterFormat] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'EDUCATIONAL',
    contentTheme: '',
    contentFormat: '',
    assigneeId: '',
    scheduledDate: '',
  });

  // Fetch users for filter and form
  const { data: usersData } = useQuery<{ data: UserOption[] }>({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(r => r.json()),
  });
  const users = usersData?.data || [];

  // Build query params
  const buildParams = () => {
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (filterChannel) params.set('channelId', filterChannel);
    if (filterAssignee) params.set('assigneeId', filterAssignee);
    if (filterTheme) params.set('contentTheme', filterTheme);
    if (filterFormat) params.set('contentFormat', filterFormat);
    return params.toString();
  };

  const { data, isLoading } = useQuery<{ data: CalendarEntry[] }>({
    queryKey: ['calendar', month, year, filterChannel, filterAssignee, filterTheme, filterFormat],
    queryFn: () => fetch(`/api/calendar?${buildParams()}`).then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (entry: typeof formData) => {
      const payload: Record<string, unknown> = {
        title: entry.title,
        description: entry.description || undefined,
        category: entry.category,
        scheduledDate: entry.scheduledDate,
      };
      if (entry.contentTheme) payload.contentTheme = entry.contentTheme;
      if (entry.contentFormat) payload.contentFormat = entry.contentFormat;
      if (entry.assigneeId) payload.assigneeId = entry.assigneeId;

      const res = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      setShowForm(false);
      setFormData({ title: '', description: '', category: 'EDUCATIONAL', contentTheme: '', contentFormat: '', assigneeId: '', scheduledDate: '' });
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

  const prevWeek = () => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() - 7);
    setWeekDate(d);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  };

  const nextWeek = () => {
    const d = new Date(weekDate);
    d.setDate(d.getDate() + 7);
    setWeekDate(d);
    setMonth(d.getMonth() + 1);
    setYear(d.getFullYear());
  };

  // Group entries by date
  const grouped = entries.reduce((acc, entry) => {
    const date = entry.scheduledDate.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, CalendarEntry[]>);

  const weekDates = getWeekDates(weekDate);

  const assigneeOptions = [
    { label: 'Todos', value: '' },
    ...users.map(u => ({ label: u.name, value: u.id })),
  ];

  const assigneeFormOptions = [
    { label: 'Nenhum', value: '' },
    ...users.map(u => ({ label: u.name, value: u.id })),
  ];

  const renderEntryCard = (entry: CalendarEntry, compact = false) => (
    <Card key={entry.id} className={compact ? 'overflow-hidden' : 'flex items-center justify-between overflow-hidden'}>
      <div className={compact ? 'p-2' : 'flex items-center gap-3 p-4'}>
        <div className={compact ? 'space-y-1' : 'flex items-center gap-2'}>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[entry.category]}`}>
            {categoryLabels[entry.category]}
          </span>
          {entry.contentTheme && (
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${themeColors[entry.contentTheme]}`}>
              {themeLabels[entry.contentTheme]}
            </span>
          )}
          {entry.contentFormat && (
            <span className="text-xs text-gray-500">
              {formatIcons[entry.contentFormat]} {formatLabels[entry.contentFormat]}
            </span>
          )}
        </div>
        <div className={compact ? 'mt-1' : ''}>
          <p className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>{entry.title}</p>
          {!compact && entry.description && (
            <p className="text-xs text-gray-500">{entry.description}</p>
          )}
        </div>
      </div>
      <div className={compact ? 'mt-1 flex items-center gap-1 px-2 pb-2' : 'flex items-center gap-2 p-4'}>
        <span className="text-xs text-gray-400">{statusLabels[entry.status]}</span>
        {entry.assignee && (
          <span className="text-xs text-gray-500">{entry.assignee.name}</span>
        )}
        {entry.channel && (
          <span className="text-xs text-gray-400">{entry.channel.platform}</span>
        )}
        <button
          onClick={() => deleteMutation.mutate(entry.id)}
          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-500"
        >
          <X size={compact ? 12 : 14} />
        </button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendário de Conteúdo</h1>
          <p className="text-sm text-gray-500">Planeje e organize suas publicações</p>
        </div>
        <div className="flex gap-2">
          <div className="flex overflow-hidden rounded-md border border-gray-200">
            <button
              className={`px-3 py-1.5 text-sm transition-colors ${viewMode === 'monthly' ? 'bg-[#1B2A4A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('monthly')}
            >
              <Calendar size={14} className="inline mr-1" />
              Mensal
            </button>
            <button
              className={`px-3 py-1.5 text-sm border-l border-gray-200 transition-colors ${viewMode === 'weekly' ? 'bg-[#1B2A4A] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setViewMode('weekly')}
            >
              <List size={14} className="inline mr-1" />
              Semanal
            </button>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus size={16} className="mr-1" /> Nova Entrada
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          options={platformFilterOptions}
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
        />
        <Select
          options={assigneeOptions}
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
        />
        <Select
          options={[{ label: 'Todos os Temas', value: '' }, ...themeOptions.filter(o => o.value)]}
          value={filterTheme}
          onChange={(e) => setFilterTheme(e.target.value)}
        />
        <Select
          options={[{ label: 'Todos os Formatos', value: '' }, ...formatOptions.filter(o => o.value)]}
          value={filterFormat}
          onChange={(e) => setFilterFormat(e.target.value)}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4">
        <Button variant="outline" size="sm" onClick={viewMode === 'monthly' ? prevMonth : prevWeek}>
          <ChevronLeft size={16} />
        </Button>
        <span className="text-lg font-semibold">
          {viewMode === 'monthly'
            ? `${months[month - 1]} ${year}`
            : `${weekDates[0].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${weekDates[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
          }
        </span>
        <Button variant="outline" size="sm" onClick={viewMode === 'monthly' ? nextMonth : nextWeek}>
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
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
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
              <Select
                options={themeOptions}
                value={formData.contentTheme}
                onChange={(e) => setFormData(d => ({ ...d, contentTheme: e.target.value }))}
              />
              <Select
                options={formatOptions}
                value={formData.contentFormat}
                onChange={(e) => setFormData(d => ({ ...d, contentFormat: e.target.value }))}
              />
              <Select
                options={assigneeFormOptions}
                value={formData.assigneeId}
                onChange={(e) => setFormData(d => ({ ...d, assigneeId: e.target.value }))}
              />
              <Input
                placeholder="Descrição (opcional)"
                value={formData.description}
                onChange={(e) => setFormData(d => ({ ...d, description: e.target.value }))}
              />
              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
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
      ) : viewMode === 'weekly' ? (
        /* Weekly View */
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayEntries = grouped[dateStr] || [];
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div key={i} className={`min-h-[200px] rounded-lg border p-2 ${isToday ? 'border-[#E8792A] bg-[#FDF2E9]/50' : 'border-gray-200'}`}>
                <div className={`mb-2 text-center text-sm font-semibold ${isToday ? 'text-[#E8792A]' : 'text-gray-600'}`}>
                  <div>{weekDays[i]}</div>
                  <div className="text-lg">{date.getDate()}</div>
                </div>
                <div className="space-y-1">
                  {dayEntries.map((entry) => renderEntryCard(entry, true))}
                </div>
              </div>
            );
          })}
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
        /* Monthly View */
        <div className="space-y-3">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, items]) => (
              <div key={date}>
                <p className="mb-2 text-sm font-semibold text-gray-600">
                  {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="space-y-2">
                  {items.map((entry) => renderEntryCard(entry))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
