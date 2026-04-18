'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import {
  FileText,
  Plus,
  Edit,
  Eye,
  Copy,
  Archive,
  ExternalLink,
  Users,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface FormData {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
  };
  targetStage: {
    id: string;
    name: string;
  } | null;
  _count: {
    submissions: number;
    fields: number;
  };
}

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive' }
> = {
  DRAFT: { label: 'Rascunho', variant: 'secondary' },
  PUBLISHED: { label: 'Publicado', variant: 'success' },
  ARCHIVED: { label: 'Arquivado', variant: 'default' },
};

function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

export function FormsClient() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: FormData[]; meta: { total: number } }>({
    queryKey: ['forms'],
    queryFn: () => fetch('/api/forms').then((r) => r.json()),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/forms/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao arquivar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      toast.success('Formulário arquivado');
    },
    onError: () => {
      toast.error('Erro ao arquivar formulário');
    },
  });

  const forms = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Formulários</h1>
          <p className="text-sm text-gray-500">Crie e gerencie formulários para captura de leads</p>
        </div>
        <Link href="/forms/new">
          <Button>
            <Plus size={16} className="mr-2" />
            Novo Formulário
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum formulário criado</h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie seu primeiro formulário para começar a captar leads
            </p>
            <Link href="/forms/new">
              <Button className="mt-4" variant="default" size="sm">
                <Plus size={16} className="mr-2" />
                Criar Formulário
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => {
            const config = statusConfig[form.status];

            return (
              <Card key={form.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-[#FDF2E9] p-2.5 text-[#E8792A]">
                        <FileText size={20} />
                      </div>
                      <div>
                        <Link href={`/forms/${form.id}`}>
                          <CardTitle className="cursor-pointer text-lg transition-colors hover:text-[#E8792A]">
                            {form.title}
                          </CardTitle>
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={config.variant}>{config.label}</Badge>
                          {form._count.fields === 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              Sem campos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/forms/${form.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit size={14} className="mr-1.5" />
                          Editar
                        </Button>
                      </Link>
                      {form.status === 'PUBLISHED' && (
                        <Link href={`/f/${form.slug}`} target="_blank">
                          <Button variant="ghost" size="sm">
                            <Eye size={14} className="mr-1.5" />
                            Visualizar
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                        <FileText size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Campos</p>
                        <p className="text-sm font-bold">{form._count.fields}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-green-50 p-2 text-green-600">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Submissões</p>
                        <p className="text-sm font-bold">{form._count.submissions}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="rounded-md bg-purple-50 p-2 text-purple-600">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Criado em</p>
                        <p className="text-sm font-medium">{formatDate(form.createdAt)}</p>
                      </div>
                    </div>
                    {form.targetStage && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                          <Users size={16} />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Estágio</p>
                          <p className="text-sm font-medium">{form.targetStage.name}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {form.description && (
                    <p className="mt-3 line-clamp-2 text-sm text-gray-500">{form.description}</p>
                  )}

                  <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <ExternalLink size={12} />
                      {form.status === 'PUBLISHED' ? (
                        <span>
                          Link: <code className="font-mono">/f/{form.slug}</code>
                        </span>
                      ) : (
                        <span>Slug: {form.slug}</span>
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
                          toast.success('Link copiado!');
                        }}
                        disabled={form.status !== 'PUBLISHED'}
                      >
                        <Copy size={12} className="mr-1" />
                        Copiar Link
                      </Button>
                      {form.status !== 'ARCHIVED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700"
                          onClick={() => archiveMutation.mutate(form.id)}
                          disabled={archiveMutation.isPending}
                        >
                          <Archive size={12} className="mr-1" />
                          Arquivar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
