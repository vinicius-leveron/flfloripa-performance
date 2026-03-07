'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Progress } from '@/shared/components/ui/progress';
import { DollarSign, MousePointerClick, Eye, Target, Calendar } from 'lucide-react';

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

const statusVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'secondary',
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
    <TooltipProvider>
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
              <Link href="/settings/channels">
                <Button className="mt-4" variant="default" size="sm">
                  Conectar Meta Ads
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const spendPercent = campaign.budget > 0
                ? Math.min(100, Math.round((campaign.summary.totalSpend / campaign.budget) * 100))
                : 0;

              return (
                <Card key={campaign.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <Badge variant={statusVariant[campaign.status] || 'secondary'}>
                          {statusLabels[campaign.status] || campaign.status}
                        </Badge>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {campaign.channel.platform} — {campaign.channel.accountName}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {campaign.objective && <span>Objetivo: {campaign.objective}</span>}
                      {campaign.startDate && (
                        <span className="flex items-center gap-0.5">
                          <Calendar size={10} />
                          {new Date(campaign.startDate).toLocaleDateString('pt-BR')}
                          {campaign.endDate && ` — ${new Date(campaign.endDate).toLocaleDateString('pt-BR')}`}
                        </span>
                      )}
                    </div>
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
                        <div className="rounded-md bg-[#FDF2E9] p-2 text-[#E8792A]">
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

                    {/* Budget progress bar */}
                    <div className="mt-3 border-t border-gray-100 pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Orçamento utilizado</span>
                        <span className="text-xs font-medium text-gray-700">{spendPercent}%</span>
                      </div>
                      <Progress value={spendPercent} className="h-1.5" />
                    </div>

                    <div className="mt-3 flex gap-4 text-xs text-gray-500">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">CPM: {formatCurrency(campaign.summary.cpm)}</span>
                        </TooltipTrigger>
                        <TooltipContent>Custo por mil impressões</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">CPC: {formatCurrency(campaign.summary.cpc)}</span>
                        </TooltipTrigger>
                        <TooltipContent>Custo por clique</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help">CTR: {campaign.summary.ctr}%</span>
                        </TooltipTrigger>
                        <TooltipContent>Taxa de cliques sobre impressões</TooltipContent>
                      </Tooltip>
                      <span>Orçamento: {formatCurrency(campaign.budget)}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
