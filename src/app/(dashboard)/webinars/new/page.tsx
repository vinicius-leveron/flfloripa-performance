'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select } from '@/shared/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, Video } from 'lucide-react';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

const statusOptions = [
  { label: 'Agendado', value: 'SCHEDULED' },
  { label: 'Ao Vivo', value: 'LIVE' },
  { label: 'Encerrado', value: 'ENDED' },
  { label: 'Replay Disponível', value: 'REPLAY_ONLY' },
];

export default function NewWebinarPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    scheduledAt: '',
    replayUrl: '',
    status: 'SCHEDULED' as 'SCHEDULED' | 'LIVE' | 'ENDED' | 'REPLAY_ONLY',
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/webinars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Erro ao criar webinar');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Webinar criado com sucesso');
      router.push(`/webinars/${data.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Slug é obrigatório');
      return;
    }

    if (!formData.scheduledAt) {
      toast.error('Data é obrigatória');
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/webinars">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Webinar</h1>
          <p className="text-sm text-gray-500">Crie um webinar para captar leads</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FDF2E9] p-2.5 text-[#E8792A]">
              <Video size={20} />
            </div>
            <div>
              <CardTitle>Informações do Webinar</CardTitle>
              <CardDescription>Preencha os dados básicos do webinar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Introdução à Logosofia"
                value={formData.title}
                onChange={handleTitleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug (URL) *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">/webinar/</span>
                <Input
                  id="slug"
                  placeholder="introducao-logosofia"
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <p className="text-xs text-gray-500">
                URL amigável para a página de inscrição
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o conteúdo do webinar..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheduledAt">Data e Hora *</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={formData.scheduledAt}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, status: e.target.value as typeof prev.status }))}
                  options={statusOptions}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="replayUrl">URL do Replay (opcional)</Label>
              <Input
                id="replayUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={formData.replayUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, replayUrl: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Adicione depois que o webinar terminar
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <Link href="/webinars">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save size={16} className="mr-2" />
                {createMutation.isPending ? 'Criando...' : 'Criar Webinar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
