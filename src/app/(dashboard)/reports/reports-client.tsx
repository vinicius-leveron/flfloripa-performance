'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { FileText, Plus, Download, Calendar, User } from 'lucide-react';

interface ReportData {
  id: string;
  type: string;
  periodStart: string;
  periodEnd: string;
  fileUrl: string | null;
  createdAt: string;
  generatedBy: { id: string; name: string };
}

const typeLabels: Record<string, string> = {
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  CUSTOM: 'Personalizado',
};

const typeVariant: Record<string, 'default' | 'secondary' | 'info'> = {
  WEEKLY: 'info',
  MONTHLY: 'default',
  CUSTOM: 'secondary',
};

const typeOptions = [
  { label: 'Semanal', value: 'WEEKLY' },
  { label: 'Mensal', value: 'MONTHLY' },
  { label: 'Personalizado', value: 'CUSTOM' },
];

export function ReportsClient() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: 'WEEKLY',
    periodStart: '',
    periodEnd: '',
  });

  const { data, isLoading } = useQuery<{ data: ReportData[] }>({
    queryKey: ['reports'],
    queryFn: () => fetch('/api/reports').then(r => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async (report: typeof formData) => {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setShowForm(false);
    },
  });

  const reports = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-sm text-gray-500">Gere relatórios de performance para a comissão</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1" /> Gerar Relatório
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Novo Relatório</CardTitle></CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Tipo</label>
                  <Select
                    options={typeOptions}
                    value={formData.type}
                    onChange={(e) => setFormData(d => ({ ...d, type: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Início do período</label>
                  <Input
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData(d => ({ ...d, periodStart: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Fim do período</label>
                  <Input
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData(d => ({ ...d, periodEnd: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Gerando...' : 'Gerar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum relatório gerado</h3>
            <p className="mt-1 text-sm text-gray-500">Crie seu primeiro relatório para compartilhar com a comissão</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Gerar primeiro relatório
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="transition-shadow hover:shadow-md">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-[#FDF2E9] p-2.5 text-[#E8792A]">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          Relatório {typeLabels[report.type]}
                        </p>
                        <Badge variant={typeVariant[report.type] || 'secondary'} className="text-[10px]">
                          {typeLabels[report.type]}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} />
                          {new Date(report.periodStart).toLocaleDateString('pt-BR')} — {new Date(report.periodEnd).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <User size={10} />
                          {report.generatedBy.name}
                        </span>
                        <span className="text-gray-400">
                          {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {report.fileUrl ? (
                    <a href={report.fileUrl} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <Download size={14} className="mr-1" /> PDF
                      </Button>
                    </a>
                  ) : (
                    <Badge variant="warning" className="text-[10px]">Processando</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
