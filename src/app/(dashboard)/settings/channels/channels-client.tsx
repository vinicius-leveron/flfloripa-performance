'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { RefreshCw, Unplug, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface ChannelData {
  id: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'LINKEDIN';
  accountName: string;
  accountId: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  lastSyncAt: string | null;
  createdAt: string;
}

const platformConfig = {
  INSTAGRAM: { label: 'Instagram', color: 'bg-pink-100 text-pink-700', icon: '📸' },
  TIKTOK: { label: 'TikTok', color: 'bg-gray-100 text-gray-700', icon: '🎵' },
  LINKEDIN: { label: 'LinkedIn', color: 'bg-blue-100 text-blue-700', icon: '💼' },
} as const;

const statusConfig = {
  CONNECTED: { label: 'Conectado', icon: CheckCircle2, color: 'text-green-600' },
  DISCONNECTED: { label: 'Desconectado', icon: XCircle, color: 'text-gray-400' },
  ERROR: { label: 'Erro', icon: AlertTriangle, color: 'text-red-500' },
} as const;

const allPlatforms: ('INSTAGRAM' | 'TIKTOK' | 'LINKEDIN')[] = ['INSTAGRAM', 'TIKTOK', 'LINKEDIN'];

export function ChannelsClient() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: ChannelData[] }>({
    queryKey: ['channels'],
    queryFn: () => fetch('/api/channels').then(r => r.json()),
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const res = await fetch('/api/channels/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      const data = await res.json();
      if (data.data?.authUrl) {
        window.location.href = data.data.authUrl;
      }
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  });

  const syncMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/channels/${id}/sync`, { method: 'POST' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  });

  const channels = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Canais</h1>
        <p className="text-sm text-gray-500">Conecte e gerencie seus canais de mídia social</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {allPlatforms.map((platform) => {
            const config = platformConfig[platform];
            const channel = channels.find(c => c.platform === platform);
            const status = channel ? statusConfig[channel.status] : null;

            return (
              <Card key={platform}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <span className={`rounded-md px-2 py-1 text-sm ${config.color}`}>
                      {config.icon} {config.label}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {channel && status ? (
                    <>
                      <div className="flex items-center gap-2">
                        <status.icon size={16} className={status.color} />
                        <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-sm text-gray-600">@{channel.accountName}</p>
                      {channel.lastSyncAt && (
                        <p className="text-xs text-gray-400">
                          Última sincronização: {new Date(channel.lastSyncAt).toLocaleString('pt-BR')}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => syncMutation.mutate(channel.id)}
                          disabled={syncMutation.isPending || channel.status !== 'CONNECTED'}
                        >
                          <RefreshCw size={14} className={syncMutation.isPending ? 'animate-spin' : ''} />
                          Sincronizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => disconnectMutation.mutate(channel.id)}
                          disabled={disconnectMutation.isPending}
                        >
                          <Unplug size={14} />
                          Desconectar
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-500">Canal não conectado</p>
                      <Button
                        onClick={() => connectMutation.mutate(platform)}
                        disabled={connectMutation.isPending}
                        className="w-full"
                      >
                        Conectar {config.label}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
