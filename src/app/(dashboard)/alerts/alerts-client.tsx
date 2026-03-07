'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Bell, TrendingDown, AlertTriangle, Calendar, Check } from 'lucide-react';

interface AlertData {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  channel: { platform: string; accountName: string } | null;
  campaign: { name: string } | null;
}

const alertIcons: Record<string, typeof TrendingDown> = {
  ENGAGEMENT_DROP: TrendingDown,
  CAMPAIGN_UNDERPERFORM: AlertTriangle,
  CADENCE_MISS: Calendar,
};

const alertColors: Record<string, string> = {
  ENGAGEMENT_DROP: 'bg-red-50 text-red-600',
  CAMPAIGN_UNDERPERFORM: 'bg-yellow-50 text-yellow-600',
  CADENCE_MISS: 'bg-orange-50 text-orange-600',
};

const alertSeverityLabel: Record<string, string> = {
  ENGAGEMENT_DROP: 'Crítico',
  CAMPAIGN_UNDERPERFORM: 'Atenção',
  CADENCE_MISS: 'Aviso',
};

const alertSeverityVariant: Record<string, 'destructive' | 'warning' | 'info'> = {
  ENGAGEMENT_DROP: 'destructive',
  CAMPAIGN_UNDERPERFORM: 'warning',
  CADENCE_MISS: 'info',
};

export function AlertsClient() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: AlertData[] }>({
    queryKey: ['alerts'],
    queryFn: () => fetch('/api/alerts').then(r => r.json()),
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/alerts/${id}`, { method: 'PATCH' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const alerts = data?.data || [];
  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {unreadCount}
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} alerta(s) não lido(s)` : 'Nenhum alerta pendente'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="mb-4 h-12 w-12 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900">Nenhum alerta</h3>
            <p className="mt-1 text-sm text-gray-500">
              Alertas são gerados automaticamente quando métricas caem ou campanhas performam abaixo do esperado
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const Icon = alertIcons[alert.type] || Bell;
            const colorClass = alertColors[alert.type] || 'bg-gray-50 text-gray-600';

            return (
              <Card
                key={alert.id}
                className={`transition-all hover:shadow-md ${alert.isRead ? 'opacity-60' : 'border-l-4'}`}
                style={!alert.isRead ? {
                  borderLeftColor: alert.type === 'ENGAGEMENT_DROP' ? '#dc2626' :
                    alert.type === 'CAMPAIGN_UNDERPERFORM' ? '#f59e0b' : '#f97316'
                } : undefined}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`rounded-md p-2 ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant={alertSeverityVariant[alert.type] || 'info'} className="text-[9px] px-1.5 py-0">
                            {alertSeverityLabel[alert.type] || alert.type}
                          </Badge>
                          {!alert.isRead && (
                            <span className="h-2 w-2 rounded-full bg-red-500" />
                          )}
                        </div>
                        <p className={`text-sm ${alert.isRead ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                          {alert.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                          <span>{new Date(alert.createdAt).toLocaleString('pt-BR')}</span>
                          {alert.channel && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{alert.channel.accountName}</Badge>
                          )}
                          {alert.campaign && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0">{alert.campaign.name}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {!alert.isRead && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markReadMutation.mutate(alert.id)}
                        className="shrink-0"
                      >
                        <Check size={14} className="mr-1" /> Lido
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
