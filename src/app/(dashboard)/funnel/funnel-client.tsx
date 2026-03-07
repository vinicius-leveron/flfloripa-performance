'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { TooltipProvider } from '@/shared/components/ui/tooltip';
import { Progress } from '@/shared/components/ui/progress';
import { Users, Target, DollarSign, TrendingUp, ArrowDown } from 'lucide-react';

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

const stageFills = [
  '#1B2A4A',
  '#2A3F6A',
  '#3A5585',
  '#E8792A',
  '#D16A22',
  '#F5A623',
  '#4CAF50',
];

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

function FunnelTrapezoid({ stages, maxLeads }: { stages: FunnelStageData[]; maxLeads: number }) {
  const stageHeight = 48;
  const gap = 6;
  const totalHeight = stages.length * stageHeight + (stages.length - 1) * gap;
  const svgWidth = 600;
  const padding = 20;

  return (
    <svg viewBox={`0 0 ${svgWidth} ${totalHeight}`} className="w-full max-w-[600px] mx-auto" role="img" aria-label="Funil de conversão">
      {stages.map((stage, i) => {
        const widthPercent = maxLeads > 0
          ? Math.max(0.25, stage.leadCount / maxLeads)
          : 1 - i * 0.1;
        const nextWidthPercent = i < stages.length - 1
          ? Math.max(0.25, stages[i + 1].leadCount / maxLeads)
          : widthPercent * 0.8;

        const y = i * (stageHeight + gap);
        const topHalf = (svgWidth - padding * 2) * widthPercent;
        const bottomHalf = (svgWidth - padding * 2) * nextWidthPercent;
        const topLeft = (svgWidth - topHalf) / 2;
        const topRight = topLeft + topHalf;
        const bottomLeft = (svgWidth - bottomHalf) / 2;
        const bottomRight = bottomLeft + bottomHalf;

        const points = `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + stageHeight} ${bottomLeft},${y + stageHeight}`;
        const fill = stageFills[i % stageFills.length];
        const centerX = svgWidth / 2;
        const centerY = y + stageHeight / 2;

        return (
          <g key={stage.id}>
            <polygon
              points={points}
              fill={fill}
              className="transition-opacity hover:opacity-90"
              rx="4"
            />
            <text
              x={centerX - 60}
              y={centerY + 1}
              fill="white"
              fontSize="12"
              fontWeight="500"
              dominantBaseline="middle"
              textAnchor="start"
            >
              {stage.position}. {stage.name}
            </text>
            <text
              x={centerX + 60}
              y={centerY + 1}
              fill="white"
              fontSize="13"
              fontWeight="700"
              dominantBaseline="middle"
              textAnchor="end"
            >
              {formatNumber(stage.leadCount)}
            </text>
            {stage.source === 'AUTO' && (
              <text
                x={centerX + 80}
                y={centerY + 1}
                fill="rgba(255,255,255,0.6)"
                fontSize="9"
                dominantBaseline="middle"
              >
                auto
              </text>
            )}
          </g>
        );
      })}
      {/* Conversion arrows between stages */}
      {stages.slice(0, -1).map((_, i) => {
        const y = (i + 1) * (stageHeight + gap) - gap / 2;
        return (
          <text
            key={`conv-${i}`}
            x={svgWidth / 2}
            y={y}
            fill="#9CA3AF"
            fontSize="10"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ↓ {stages[i + 1].conversionRate}%
          </text>
        );
      })}
    </svg>
  );
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
                  <CardHeader>
                    <CardTitle className="text-lg">Funil de Ingresso Logosófico</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FunnelTrapezoid stages={stages} maxLeads={maxLeads} />
                  </CardContent>
                </Card>

                {/* Stage Details */}
                <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
                  {stages.map((stage, i) => {
                    const percent = maxLeads > 0 ? Math.round((stage.leadCount / maxLeads) * 100) : 0;
                    return (
                      <Card key={stage.id} className="transition-shadow hover:shadow-md">
                        <CardHeader className="pb-2">
                          <CardTitle className="flex items-center gap-2 text-xs">
                            <div className={`h-3 w-3 rounded-full ${stageColors[i % stageColors.length]}`} />
                            {stage.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-xl font-bold">{stage.leadCount}</div>
                          <Progress value={percent} className="mt-2 h-1.5" />
                          <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                            {stage.description || `Estágio ${stage.position}`}
                          </p>
                          {i > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                              <ArrowDown size={10} className="text-gray-400" />
                              <span className="text-xs text-gray-400">{stage.conversionRate}%</span>
                            </div>
                          )}
                          {stage.source === 'AUTO' && (
                            <Badge variant="secondary" className="mt-1 text-[9px] px-1.5 py-0">auto</Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
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
