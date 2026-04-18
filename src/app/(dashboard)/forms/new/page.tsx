'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select } from '@/shared/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Save, FileText } from 'lucide-react';

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

interface FunnelStage {
  id: string;
  name: string;
  position: number;
}

export default function NewFormPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    title: '',
    description: '',
    targetStageId: '',
    sendNotification: true,
    notificationEmail: '',
    submitButtonText: 'Enviar',
    successMessage: 'Obrigado! Sua inscrição foi recebida.',
  });

  const { data: stagesData } = useQuery<{ data: FunnelStage[] }>({
    queryKey: ['funnel-stages'],
    queryFn: () => fetch('/api/funnel/stages').then((r) => r.json()),
  });

  const stages = stagesData?.data || [];

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          targetStageId: data.targetStageId || undefined,
          notificationEmail: data.notificationEmail || undefined,
        }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Erro ao criar formulário');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Formulário criado com sucesso');
      router.push(`/forms/${data.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData((prev) => ({
      ...prev,
      title,
      name: prev.name || title,
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

    if (!formData.name.trim()) {
      toast.error('Nome interno é obrigatório');
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/forms">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Formulário</h1>
          <p className="text-sm text-gray-500">Crie um formulário para captar leads</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#FDF2E9] p-2.5 text-[#E8792A]">
              <FileText size={20} />
            </div>
            <div>
              <CardTitle>Informações do Formulário</CardTitle>
              <CardDescription>Preencha os dados básicos do formulário</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Título (exibido no formulário) *</Label>
              <Input
                id="title"
                placeholder="Ex: Inscrição para Palestra"
                value={formData.title}
                onChange={handleTitleChange}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Interno *</Label>
                <Input
                  id="name"
                  placeholder="Ex: palestra-janeiro"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <p className="text-xs text-gray-500">Para identificação no sistema</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL) *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/f/</span>
                  <Input
                    id="slug"
                    placeholder="palestra-janeiro"
                    value={formData.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descrição exibida acima do formulário..."
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetStageId">Estágio do Funil</Label>
              <Select
                id="targetStageId"
                value={formData.targetStageId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFormData((prev) => ({ ...prev, targetStageId: e.target.value }))
                }
                options={[
                  { label: 'Selecione um estágio', value: '' },
                  ...stages.map((s) => ({ label: s.name, value: s.id })),
                ]}
              />
              <p className="text-xs text-gray-500">Leads serão criados neste estágio do funil</p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
              <h4 className="font-medium text-gray-900">Configurações de Notificação</h4>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="sendNotification"
                  checked={formData.sendNotification}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sendNotification: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#E8792A] focus:ring-[#E8792A]"
                />
                <Label htmlFor="sendNotification" className="font-normal">
                  Enviar notificação por email ao receber submissão
                </Label>
              </div>

              {formData.sendNotification && (
                <div className="space-y-2">
                  <Label htmlFor="notificationEmail">Email para Notificação</Label>
                  <Input
                    id="notificationEmail"
                    type="email"
                    placeholder="equipe@cip.org.br"
                    value={formData.notificationEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev) => ({ ...prev, notificationEmail: e.target.value }))
                    }
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="submitButtonText">Texto do Botão</Label>
                <Input
                  id="submitButtonText"
                  placeholder="Enviar"
                  value={formData.submitButtonText}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({ ...prev, submitButtonText: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successMessage">Mensagem de Sucesso</Label>
              <Textarea
                id="successMessage"
                placeholder="Obrigado! Sua inscrição foi recebida."
                value={formData.successMessage}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData((prev) => ({ ...prev, successMessage: e.target.value }))
                }
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t pt-4">
              <Link href="/forms">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" disabled={createMutation.isPending}>
                <Save size={16} className="mr-2" />
                {createMutation.isPending ? 'Criando...' : 'Criar Formulário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
