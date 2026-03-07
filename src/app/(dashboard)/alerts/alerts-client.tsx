'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
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
          <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
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
            <p className="text-gray-500">Nenhum alerta ainda</p>
            <p className="mt-1 text-xs text-gray-400">
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
              <Card key={alert.id} className={`p-4 ${alert.isRead ? 'opacity-60' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`rounded-md p-2 ${colorClass}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className={`text-sm ${alert.isRead ? 'text-gray-500' : 'font-medium text-gray-900'}`}>
                        {alert.message}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(alert.createdAt).toLocaleString('pt-BR')}</span>
                        {alert.channel && <span>{alert.channel.accountName}</span>}
                        {alert.campaign && <span>{alert.campaign.name}</span>}
                      </div>
                    </div>
                  </div>
                  {!alert.isRead && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markReadMutation.mutate(alert.id)}
                    >
                      <Check size={14} />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
