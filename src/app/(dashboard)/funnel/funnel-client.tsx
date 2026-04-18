'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Users, Target, DollarSign, TrendingUp, ArrowRight, Info } from 'lucide-react';

interface Funnel {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  isDefault: boolean;
  _count: { leads: number; stages: number };
}

interface FunnelStageData {
  id: string;
  name: string;
  position: number;
  description: string | null;
  source: string;
  syncTrello: boolean;
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
    funnel: Funnel | null;
    stages: FunnelStageData[];
    metrics: FunnelMetrics;
    channelBreakdown: ChannelBreakdown[];
  };
}

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

function FunnelBars({ stages, maxLeads, funnelColor }: { stages: FunnelStageData[]; maxLeads: number; funnelColor: string }) {
  return (
    <div className="space-y-3">
      {stages.map((stage, i) => {
        const percent = maxLeads > 0 ? (stage.leadCount / maxLeads) * 100 : 0;
        const prevStage = i > 0 ? stages[i - 1] : null;
        const dropPercent = prevStage && prevStage.leadCount > 0
          ? Math.round(((prevStage.leadCount - stage.leadCount) / prevStage.leadCount) * 100)
          : 0;

        return (
          <div key={stage.id} className="relative">
            {/* Conversion indicator between stages */}
            {i > 0 && (
              <div className="flex items-center justify-center -mt-1 mb-1">
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <ArrowRight size={12} className="rotate-90" />
                  <span>{stage.conversionRate}%</span>
                  {dropPercent > 0 && (
                    <span className="text-red-400">(-{dropPercent}%)</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Stage info */}
              <div className="w-40 shrink-0">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: funnelColor }}
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-sm font-medium truncate cursor-help">
                        {stage.position}. {stage.name}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{stage.description || `Estágio ${stage.position}`}</p>
                      {stage.syncTrello && <p className="text-xs text-gray-400 mt-1">Sincroniza com Trello</p>}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  {stage.source === 'AUTO' && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0">auto</Badge>
                  )}
                  {stage.syncTrello && (
                    <Badge variant="outline" className="text-[9px] px-1 py-0">trello</Badge>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="flex-1 relative">
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                    style={{
                      width: `${Math.max(percent, 5)}%`,
                      backgroundColor: funnelColor,
                      opacity: 0.15 + (0.85 * (1 - i / stages.length)),
                    }}
                  >
                    <span className="text-sm font-bold" style={{ color: funnelColor }}>
                      {stage.leadCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Percentage */}
              <div className="w-14 text-right shrink-0">
                <span className="text-sm text-gray-500">{Math.round(percent)}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function FunnelClient() {
  const [period, setPeriod] = useState('30d');
  const [selectedFunnelId, setSelectedFunnelId] = useState('');

  // Fetch all funnels
  const { data: funnelsData } = useQuery<{ data: Funnel[] }>({
    queryKey: ['funnels'],
    queryFn: () => fetch('/api/funnels').then(r => r.json()),
  });

  const funnels = funnelsData?.data || [];
  const defaultFunnel = funnels.find(f => f.isDefault) || funnels[0];
  const activeFunnelId = selectedFunnelId || defaultFunnel?.id || '';
  const activeFunnel = funnels.find(f => f.id === activeFunnelId);

  // Fetch metrics for selected funnel
  const { data, isLoading } = useQuery<FunnelResponse>({
    queryKey: ['funnel-metrics', period, activeFunnelId],
    queryFn: () => fetch(`/api/funnel/metrics?period=${period}&funnelId=${activeFunnelId}`).then(r => r.json()),
    enabled: !!activeFunnelId,
  });

  const stages = data?.data?.stages || [];
  const metrics = data?.data?.metrics;
  const channelBreakdown = data?.data?.channelBreakdown || [];
  const maxLeads = Math.max(...stages.map(s => s.leadCount), 1);
  const funnelColor = activeFunnel?.color || '#E8792A';

  const kpiCards = [
    { title: 'Total de Leads', icon: Users, color: 'text-[#1B2A4A] bg-[#1B2A4A]/10', value: metrics?.totalLeads, format: formatNumber },
    { title: 'Ingressos', icon: Target, color: 'text-[#4CAF50] bg-green-50', value: metrics?.totalIngressos, format: formatNumber },
    { title: 'Conversão Total', icon: TrendingUp, color: 'text-[#E8792A] bg-[#FDF2E9]', value: metrics?.overallConversionRate, suffix: '%', format: (v: number) => v.toString() },
    { title: 'Custo por Ingresso', icon: DollarSign, color: 'text-purple-600 bg-purple-50', value: metrics?.costPerIngresso, format: formatCurrency },
    { title: 'Investimento Total', icon: DollarSign, color: 'text-orange-600 bg-orange-50', value: metrics?.totalAdSpend, format: formatCurrency },
  ];

  return (
    <TooltipProvider>
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

        {/* Funnel Tabs */}
        {funnels.length > 0 && (
          <div className="flex gap-2 border-b pb-2">
            {funnels.map(funnel => (
              <button
                key={funnel.id}
                onClick={() => setSelectedFunnelId(funnel.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeFunnelId === funnel.id
                    ? 'bg-white border border-b-white -mb-[3px] text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                style={activeFunnelId === funnel.id && funnel.color ? { borderTopColor: funnel.color, borderTopWidth: '3px' } : {}}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: funnel.color || '#E8792A' }}
                  />
                  {funnel.name}
                </span>
                <span className="ml-2 text-xs text-gray-400">({funnel._count.leads})</span>
              </button>
            ))}
          </div>
        )}

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
                <Card key={card.title} className="transition-shadow hover:shadow-md">
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
                  <Users className="mx-auto mb-4 h-12 w-12 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum estágio configurado</h3>
                  <p className="mt-1 text-sm text-gray-500">Execute o seed do banco de dados para criar os estágios do funil.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: funnelColor }}
                      />
                      Funil: {activeFunnel?.name || 'Carregando...'}
                    </CardTitle>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600">
                          <Info size={16} />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Visualização do funil de conversão.</p>
                        <p className="text-xs text-gray-400 mt-1">
                          As barras mostram a proporção de leads em cada estágio.
                          Percentuais indicam a taxa de conversão entre estágios.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardHeader>
                  <CardContent>
                    <FunnelBars stages={stages} maxLeads={maxLeads} funnelColor={funnelColor} />
                  </CardContent>
                </Card>

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
                              <tr key={ch.channel} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                <td className="py-2.5 font-medium">{ch.channel}</td>
                                <td className="py-2.5 text-right">{ch.leads}</td>
                                <td className="py-2.5 text-right">
                                  <Badge variant="success" className="text-[10px]">{ch.ingressos}</Badge>
                                </td>
                                <td className="py-2.5 text-right">{ch.conversionRate}%</td>
                                <td className="py-2.5 text-right">{formatCurrency(ch.adSpend)}</td>
                                <td className="py-2.5 text-right">
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
    </TooltipProvider>
  );
}
