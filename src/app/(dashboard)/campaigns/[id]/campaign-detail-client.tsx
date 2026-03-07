'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Separator } from '@/shared/components/ui/separator';
import { Progress } from '@/shared/components/ui/progress';
import { ArrowLeft, DollarSign, Eye, MousePointerClick, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CampaignMetric {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  cpm: number;
  cpc: number;
  ctr: number;
  conversions: number;
}

interface CampaignDetail {
  id: string;
  name: string;
  status: string;
  objective: string | null;
  budget: number;
  startDate: string | null;
  endDate: string | null;
  channel: { platform: string; accountName: string };
  metrics: CampaignMetric[];
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

const metricOptions = [
  { label: 'Gasto (R$)', value: 'spend' },
  { label: 'Impressoes', value: 'impressions' },
  { label: 'Cliques', value: 'clicks' },
  { label: 'Conversoes', value: 'conversions' },
];

const metricColors: Record<string, string> = {
  spend: '#10b981',
  impressions: '#3b82f6',
  clicks: '#8b5cf6',
  conversions: '#E8792A',
};

const metricLabels: Record<string, string> = {
  spend: 'Gasto (R$)',
  impressions: 'Impressoes',
  clicks: 'Cliques',
  conversions: 'Conversoes',
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function CampaignDetailClient({ campaignId }: { campaignId: string }) {
  const [selectedMetric, setSelectedMetric] = useState('spend');

  const { data, isLoading } = useQuery<{ data: CampaignDetail }>({
    queryKey: ['campaign', campaignId],
    queryFn: () => fetch(`/api/campaigns/${campaignId}`).then(r => r.json()),
  });

  const campaign = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="space-y-4">
        <Link href="/campaigns" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Voltar
        </Link>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Campanha nao encontrada</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const metrics = campaign.metrics || [];
  const totals = metrics.reduce(
    (acc, m) => ({
      spend: acc.spend + m.spend,
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      conversions: acc.conversions + m.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const spendPercent = campaign.budget > 0
    ? Math.min(100, Math.round((totals.spend / campaign.budget) * 100))
    : 0;

  const chartData = metrics.map((m) => ({
    ...m,
    date: new Date(m.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
  }));

  const kpis = [
    { title: 'Gasto Total', value: formatCurrency(totals.spend), icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { title: 'Impressoes', value: totals.impressions.toLocaleString('pt-BR'), icon: Eye, color: 'text-[#E8792A] bg-[#FDF2E9]' },
    { title: 'Cliques', value: totals.clicks.toLocaleString('pt-BR'), icon: MousePointerClick, color: 'text-purple-600 bg-purple-50' },
    { title: 'Conversoes', value: totals.conversions.toString(), icon: Target, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={16} /> Campanhas
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-[#1B2A4A]">{campaign.name}</h1>
              <Badge variant={statusVariant[campaign.status] || 'secondary'}>
                {statusLabels[campaign.status] || campaign.status}
              </Badge>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
              <span>{campaign.channel.platform} — {campaign.channel.accountName}</span>
              {campaign.startDate && (
                <span className="flex items-center gap-0.5">
                  <Calendar size={10} />
                  {new Date(campaign.startDate).toLocaleDateString('pt-BR')}
                  {campaign.endDate && ` — ${new Date(campaign.endDate).toLocaleDateString('pt-BR')}`}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-md p-2 ${kpi.color}`}>
                  <kpi.icon size={16} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{kpi.title}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Progress */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-gray-500">Orcamento utilizado</span>
            <span className="text-sm font-medium">{formatCurrency(totals.spend)} / {formatCurrency(campaign.budget)} ({spendPercent}%)</span>
          </div>
          <Progress value={spendPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Daily Metrics Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Metricas Diarias</CardTitle>
            <Select
              options={metricOptions}
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-gray-500">Nenhuma metrica diaria disponivel</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => {
                      const num = Number(value);
                      return selectedMetric === 'spend' ? formatCurrency(num) : num.toLocaleString('pt-BR');
                    }}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey={selectedMetric}
                    name={metricLabels[selectedMetric]}
                    stroke={metricColors[selectedMetric]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 text-sm">
            {campaign.objective && (
              <div>
                <span className="text-gray-500">Objetivo</span>
                <p className="font-medium">{campaign.objective}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500">Orcamento</span>
              <p className="font-medium">{formatCurrency(campaign.budget)}</p>
            </div>
            <div>
              <span className="text-gray-500">Canal</span>
              <p className="font-medium">{campaign.channel.platform} — {campaign.channel.accountName}</p>
            </div>
            {metrics.length > 0 && (
              <>
                <div>
                  <span className="text-gray-500">CPM Medio</span>
                  <p className="font-medium">{formatCurrency(metrics.reduce((s, m) => s + m.cpm, 0) / metrics.length)}</p>
                </div>
                <div>
                  <span className="text-gray-500">CPC Medio</span>
                  <p className="font-medium">{formatCurrency(metrics.reduce((s, m) => s + m.cpc, 0) / metrics.length)}</p>
                </div>
                <div>
                  <span className="text-gray-500">CTR Medio</span>
                  <p className="font-medium">{(metrics.reduce((s, m) => s + m.ctr, 0) / metrics.length).toFixed(2)}%</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
