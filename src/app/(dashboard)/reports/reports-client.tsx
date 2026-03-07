'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { FileText, Plus, Download } from 'lucide-react';

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
              className="grid gap-4 md:grid-cols-3"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(formData);
              }}
            >
              <Select
                options={typeOptions}
                value={formData.type}
                onChange={(e) => setFormData(d => ({ ...d, type: e.target.value }))}
              />
              <Input
                type="date"
                value={formData.periodStart}
                onChange={(e) => setFormData(d => ({ ...d, periodStart: e.target.value }))}
                required
              />
              <Input
                type="date"
                value={formData.periodEnd}
                onChange={(e) => setFormData(d => ({ ...d, periodEnd: e.target.value }))}
                required
              />
              <div className="md:col-span-3 flex gap-2">
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
            <p className="text-gray-500">Nenhum relatório gerado ainda</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>
              <Plus size={16} className="mr-1" /> Gerar primeiro relatório
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-[#FDF2E9] p-2 text-[#E8792A]">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="font-medium">
                      Relatório {typeLabels[report.type]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(report.periodStart).toLocaleDateString('pt-BR')} — {new Date(report.periodEnd).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Gerado por {report.generatedBy.name} em {new Date(report.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                {report.fileUrl && (
                  <a href={report.fileUrl} target="_blank" rel="noreferrer"
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 h-9 text-sm font-medium hover:bg-gray-50"
                  >
                    <Download size={14} className="mr-1" /> PDF
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
