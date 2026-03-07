'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { DollarSign, MousePointerClick, Eye, Target } from 'lucide-react';

interface CampaignData {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  channel: { platform: string; accountName: string };
  summary: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    cpm: number;
    cpc: number;
    ctr: number;
  };
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  PAUSED: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-gray-100 text-gray-600',
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  COMPLETED: 'Finalizada',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function CampaignsClient() {
  const { data, isLoading } = useQuery<{ data: CampaignData[] }>({
    queryKey: ['campaigns'],
    queryFn: () => fetch('/api/campaigns').then(r => r.json()),
  });

  const campaigns = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
        <p className="text-sm text-gray-500">Acompanhe performance e ROI das campanhas Meta Ads</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Nenhuma campanha encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              Conecte sua conta Meta Ads em Configurações → Canais para sincronizar campanhas
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[campaign.status]}`}>
                    {statusLabels[campaign.status]}
                  </span>
                </div>
                {campaign.objective && (
                  <p className="text-sm text-gray-500">Objetivo: {campaign.objective}</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-green-50 p-2 text-green-600">
                      <DollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Gasto Total</p>
                      <p className="text-sm font-bold">{formatCurrency(campaign.summary.totalSpend)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-blue-50 p-2 text-blue-600">
                      <Eye size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Impressões</p>
                      <p className="text-sm font-bold">{campaign.summary.totalImpressions.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-purple-50 p-2 text-purple-600">
                      <MousePointerClick size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Cliques</p>
                      <p className="text-sm font-bold">{campaign.summary.totalClicks.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-md bg-orange-50 p-2 text-orange-600">
                      <Target size={16} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Conversões</p>
                      <p className="text-sm font-bold">{campaign.summary.totalConversions}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 border-t border-gray-100 pt-3 text-xs text-gray-500">
                  <span>CPM: {formatCurrency(campaign.summary.cpm)}</span>
                  <span>CPC: {formatCurrency(campaign.summary.cpc)}</span>
                  <span>CTR: {campaign.summary.ctr}%</span>
                  <span>Orçamento: {formatCurrency(campaign.budget)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
