'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Users, Target, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface FunnelStageData {
  id: string;
  name: string;
  position: number;
  description: string | null;
  source: string;
  leadCount: number;
  conversionRate: number;
}

interface FunnelMetrics {
  totalLeads: number;
  totalIngressos: number;
  overallConversionRate: number;
  totalAdSpend: number;
  costPerLead: number;
  costPerIngresso: number;
}

interface ChannelBreakdown {
  channel: string;
  leads: number;
  ingressos: number;
  conversionRate: number;
  adSpend: number;
  costPerIngresso: number;
}

interface FunnelResponse {
  data: {
    stages: FunnelStageData[];
    metrics: FunnelMetrics;
    channelBreakdown: ChannelBreakdown[];
  };
}

const stageColors = [
  'bg-[#1B2A4A]',
  'bg-[#2A3F6A]',
  'bg-[#3A5585]',
  'bg-[#E8792A]',
  'bg-[#D16A22]',
  'bg-[#F5A623]',
  'bg-[#4CAF50]',
];

const periodOptions = [
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Últimos 90 dias', value: '90d' },
  { label: 'Todo período', value: 'all' },
];

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export function FunnelClient() {
  const [period, setPeriod] = useState('30d');

  const { data, isLoading } = useQuery<FunnelResponse>({
    queryKey: ['funnel-metrics', period],
    queryFn: () => fetch(`/api/funnel/metrics?period=${period}`).then(r => r.json()),
  });

  const stages = data?.data?.stages || [];
  const metrics = data?.data?.metrics;
  const channelBreakdown = data?.data?.channelBreakdown || [];
  const maxLeads = Math.max(...stages.map(s => s.leadCount), 1);

  const kpiCards = [
    { title: 'Total de Leads', icon: Users, color: 'text-[#1B2A4A] bg-[#1B2A4A]/10', value: metrics?.totalLeads, format: formatNumber },
    { title: 'Ingressos', icon: Target, color: 'text-[#4CAF50] bg-green-50', value: metrics?.totalIngressos, format: formatNumber },
    { title: 'Conversão Total', icon: TrendingUp, color: 'text-[#E8792A] bg-[#FDF2E9]', value: metrics?.overallConversionRate, suffix: '%', format: (v: number) => v.toString() },
    { title: 'Custo por Ingresso', icon: DollarSign, color: 'text-purple-600 bg-purple-50', value: metrics?.costPerIngresso, format: formatCurrency },
    { title: 'Investimento Total', icon: DollarSign, color: 'text-orange-600 bg-orange-50', value: metrics?.totalAdSpend, format: formatCurrency },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funil de Ingresso</h1>
          <p className="text-sm text-gray-500">
            Acompanhe a jornada do primeiro contato ao ingresso na Fundação
          </p>
        </div>
        <Select
          options={periodOptions}
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-48"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {kpiCards.map((card) => (
              <Card key={card.title}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 ${card.color}`}>
                      <card.icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{card.title}</p>
                      <p className="text-lg font-bold">
                        {card.value !== undefined
                          ? `${card.format(card.value)}${card.suffix || ''}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Funnel Visualization */}
          {stages.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">Nenhum estágio configurado. Execute o seed do banco de dados.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Funil de Ingresso Logosófico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-2">
                    {stages.map((stage, i) => {
                      const widthPercent = maxLeads > 0
                        ? Math.max(20, (stage.leadCount / maxLeads) * 100)
                        : 100 - i * 10;

                      return (
                        <div key={stage.id} className="w-full">
                          <div
                            className={`mx-auto flex items-center justify-between rounded-lg px-4 py-3 text-white ${stageColors[i % stageColors.length]}`}
                            style={{ width: `${widthPercent}%` }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium opacity-70">{stage.position}.</span>
                              <span className="text-sm font-medium">{stage.name}</span>
                              {stage.source === 'AUTO' && (
                                <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px]">auto</span>
                              )}
                            </div>
                            <span className="text-sm font-bold">{formatNumber(stage.leadCount)}</span>
                          </div>
                          {i < stages.length - 1 && (
                            <div className="flex justify-center py-1">
                              <span className="text-xs text-gray-400">
                                {stages[i + 1].conversionRate}% conversão
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Stage Details */}
              <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
                {stages.map((stage, i) => (
                  <Card key={stage.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-xs">
                        <div className={`h-3 w-3 rounded-full ${stageColors[i % stageColors.length]}`} />
                        {stage.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">{stage.leadCount}</div>
                      <p className="text-[10px] text-gray-500 leading-tight">
                        {stage.description || `Estágio ${stage.position}`}
                      </p>
                      {i > 0 && (
                        <p className="mt-1 text-xs text-gray-400">
                          Taxa: {stage.conversionRate}%
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Channel Breakdown */}
              {channelBreakdown.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Breakdown por Canal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs text-gray-500">
                            <th className="pb-2 font-medium">Canal</th>
                            <th className="pb-2 font-medium text-right">Leads</th>
                            <th className="pb-2 font-medium text-right">Ingressos</th>
                            <th className="pb-2 font-medium text-right">Conversão</th>
                            <th className="pb-2 font-medium text-right">Investimento</th>
                            <th className="pb-2 font-medium text-right">Custo/Ingresso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {channelBreakdown.map((ch) => (
                            <tr key={ch.channel} className="border-b last:border-0">
                              <td className="py-2 font-medium">{ch.channel}</td>
                              <td className="py-2 text-right">{ch.leads}</td>
                              <td className="py-2 text-right">{ch.ingressos}</td>
                              <td className="py-2 text-right">{ch.conversionRate}%</td>
                              <td className="py-2 text-right">{formatCurrency(ch.adSpend)}</td>
                              <td className="py-2 text-right">
                                {ch.costPerIngresso > 0 ? formatCurrency(ch.costPerIngresso) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
