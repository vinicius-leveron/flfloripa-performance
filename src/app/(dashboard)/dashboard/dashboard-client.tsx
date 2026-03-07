'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Select } from '@/shared/components/ui/select';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/components/ui/tooltip';
import { Eye, TrendingUp, Users, BarChart3, ArrowUp, ArrowDown, Minus, Plus, FileText, HelpCircle } from 'lucide-react';
import { TrendChart } from './trend-chart';
import { ChannelComparison } from './channel-comparison';

interface DashboardData {
  kpis: {
    totalImpressions: number;
    totalEngagement: number;
    totalFollowers: number;
    engagementRate: number;
  };
  trends: Record<string, {
    current: number;
    previous: number;
    change: number;
    direction: 'up' | 'down' | 'stable';
  }>;
  chartData: {
    byDay: { date: string; impressions: number; engagement: number; reach: number }[];
    byChannel: { platform: string; name: string; impressions: number; engagement: number; followers: number }[];
  };
}

const periodOptions = [
  { label: 'Últimos 7 dias', value: '7d' },
  { label: 'Últimos 30 dias', value: '30d' },
  { label: 'Últimos 90 dias', value: '90d' },
];

const kpiTooltips: Record<string, string> = {
  impressions: 'Número total de vezes que seu conteúdo foi exibido em todos os canais',
  engagement: 'Soma de curtidas, comentários, compartilhamentos e salvamentos',
  followers: 'Total de seguidores em todos os canais conectados',
  engagementRate: 'Percentual de interações em relação às impressões totais',
};

function TrendBadge({ direction, change }: { direction: 'up' | 'down' | 'stable'; change: number }) {
  if (direction === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600">
        <ArrowUp size={12} /> {Math.abs(change)}%
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-600">
        <ArrowDown size={12} /> {Math.abs(change)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-50 px-1.5 py-0.5 text-xs font-medium text-yellow-600">
      <Minus size={12} /> Estável
    </span>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function KpiSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16 mb-1" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

export function DashboardClient() {
  const [period, setPeriod] = useState('7d');

  const { data, isLoading } = useQuery<{ data: DashboardData }>({
    queryKey: ['dashboard', period],
    queryFn: () => fetch(`/api/metrics/dashboard?period=${period}`).then(r => r.json()),
  });

  const dashboard = data?.data;
  const hasData = dashboard && dashboard.chartData.byDay.length > 0;

  const kpiCards = [
    { title: 'Impressões', key: 'impressions', icon: Eye, color: 'text-[#E8792A] bg-[#FDF2E9]', value: dashboard?.kpis.totalImpressions },
    { title: 'Engajamento', key: 'engagement', icon: TrendingUp, color: 'text-green-600 bg-green-50', value: dashboard?.kpis.totalEngagement },
    { title: 'Seguidores', key: 'followers', icon: Users, color: 'text-purple-600 bg-purple-50', value: dashboard?.kpis.totalFollowers },
    { title: 'Taxa de Engajamento', key: 'engagementRate', icon: BarChart3, color: 'text-orange-600 bg-orange-50', value: dashboard?.kpis.engagementRate, suffix: '%' },
  ];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-[#1B2A4A]/5 via-transparent to-[#E8792A]/5 px-4 py-3">
          <div>
            <h1 className="text-2xl font-bold text-[#1B2A4A]">Dashboard</h1>
            <p className="text-sm text-gray-500">Visão geral das métricas de todos os canais</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/leads">
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" /> Novo Lead
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" size="sm">
                <FileText size={14} className="mr-1" /> Relatório
              </Button>
            </Link>
            <Select
              options={periodOptions}
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-48"
            />
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            : kpiCards.map((card) => (
                <Card key={card.key} className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-1">
                      <CardTitle className="text-sm font-medium text-gray-500">{card.title}</CardTitle>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle size={13} className="text-gray-300 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-[200px]">{kpiTooltips[card.key]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className={`rounded-md p-2 ${card.color}`}>
                      <card.icon size={16} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {card.value !== undefined ? `${formatNumber(card.value)}${card.suffix || ''}` : '—'}
                    </div>
                    {dashboard?.trends[card.key] && (
                      <div className="mt-1">
                        <TrendBadge
                          direction={dashboard.trends[card.key].direction}
                          change={dashboard.trends[card.key].change}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Charts */}
        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
            <Card><CardContent className="pt-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          </div>
        ) : hasData ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <TrendChart data={dashboard.chartData.byDay} />
            <ChannelComparison data={dashboard.chartData.byChannel} />
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="mb-4 h-12 w-12 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900">Nenhuma métrica disponível</h3>
              <p className="mt-1 text-sm text-gray-500">
                Conecte seus canais em Configurações → Canais para começar a ver métricas
              </p>
              <Link href="/settings/channels">
                <Button className="mt-4" variant="default" size="sm">
                  Conectar Canais
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
