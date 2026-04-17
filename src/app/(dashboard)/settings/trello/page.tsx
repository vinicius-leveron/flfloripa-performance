'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/shared/components/ui/alert';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  List,
  ArrowRight,
} from 'lucide-react';

interface TrelloStatusData {
  connected: boolean;
  boardName: string | null;
  listsFound: string[];
  requiredLists: string[];
  missingLists: string[];
  stageMapping: Record<number, string>;
}

export default function TrelloSettingsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ data: TrelloStatusData }>({
    queryKey: ['trello-status'],
    queryFn: () => fetch('/api/trello/status').then(r => r.json()),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/trello/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'full' }),
      });
      if (!res.ok) throw new Error('Erro ao sincronizar');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Sincronização concluída');
      queryClient.invalidateQueries({ queryKey: ['trello-status'] });
    },
    onError: () => {
      toast.error('Erro ao sincronizar com Trello');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const status = data?.data;
  const isConfigured = status?.connected && status.boardName;
  const hasAllLists = status?.missingLists?.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integração Trello</h1>
          <p className="text-sm text-gray-500">Sincronize leads com o board SIPE no Trello</p>
        </div>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status da Conexão</CardTitle>
              <CardDescription>Verificação da conexão com a API do Trello</CardDescription>
            </div>
            <Badge variant={isConfigured ? 'success' : 'destructive'}>
              {isConfigured ? 'Conectado' : 'Não Configurado'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConfigured ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuração necessária</AlertTitle>
              <AlertDescription>
                Configure as variáveis de ambiente no arquivo <code className="bg-gray-100 px-1 rounded">.env</code>:
                <ul className="mt-2 list-disc list-inside text-sm">
                  <li><code>TRELLO_API_KEY</code> - Chave da API</li>
                  <li><code>TRELLO_TOKEN</code> - Token de acesso</li>
                  <li><code>TRELLO_BOARD_ID</code> - ID do board SIPE</li>
                </ul>
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={20} />
                <div>
                  <p className="font-medium">Board conectado</p>
                  <p className="text-sm text-gray-500">{status.boardName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {hasAllLists ? (
                  <CheckCircle2 className="text-green-500" size={20} />
                ) : (
                  <AlertTriangle className="text-yellow-500" size={20} />
                )}
                <div>
                  <p className="font-medium">
                    {status.listsFound.length} listas encontradas
                  </p>
                  <p className="text-sm text-gray-500">
                    {hasAllLists
                      ? 'Todas as listas necessárias estão configuradas'
                      : `Faltam ${status.missingLists?.length} listas`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || !isConfigured}
            >
              <RefreshCw size={14} className={`mr-1.5 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
              {syncMutation.isPending ? 'Sincronizando...' : 'Sincronizar Agora'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Mapeamento de Listas</CardTitle>
          <CardDescription>
            Como os estágios do funil são mapeados para listas no Trello
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status?.stageMapping && Object.entries(status.stageMapping).map(([stagePosition, listName]) => {
              const exists = status.listsFound.some(
                (found) => found.toLowerCase() === listName.toLowerCase()
              );

              return (
                <div
                  key={stagePosition}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-md bg-gray-100 p-2">
                      <List size={16} className="text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">Estágio {stagePosition}</p>
                      <p className="text-sm text-gray-500">Posição no funil</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <ArrowRight size={16} className="text-gray-400" />
                    <div className="text-right">
                      <p className="font-medium font-mono text-sm">{listName}</p>
                      <div className="flex items-center gap-1 justify-end">
                        {exists ? (
                          <>
                            <CheckCircle2 size={12} className="text-green-500" />
                            <span className="text-xs text-green-600">Configurada</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="text-red-500" />
                            <span className="text-xs text-red-600">Não encontrada</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {status?.missingLists && status.missingLists.length > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Listas faltando no Trello</AlertTitle>
              <AlertDescription>
                Crie as seguintes listas no board do Trello:
                <ul className="mt-2 list-disc list-inside">
                  {status.missingLists.map((list) => (
                    <li key={list} className="font-mono text-sm">{list}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Como Funciona</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div className="flex gap-3">
            <div className="rounded-full bg-blue-100 p-1.5 h-6 w-6 flex items-center justify-center text-blue-600 font-bold text-xs">
              1
            </div>
            <div>
              <p className="font-medium text-gray-900">App → Trello</p>
              <p>
                Quando um lead avança para &quot;Visitou Sede&quot; ou estágios posteriores,
                um card é criado ou movido automaticamente no Trello.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="rounded-full bg-blue-100 p-1.5 h-6 w-6 flex items-center justify-center text-blue-600 font-bold text-xs">
              2
            </div>
            <div>
              <p className="font-medium text-gray-900">Trello → App</p>
              <p>
                Quando a equipe SIPE move um card no Trello, o estágio do lead
                é atualizado automaticamente na plataforma via webhook.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="rounded-full bg-blue-100 p-1.5 h-6 w-6 flex items-center justify-center text-blue-600 font-bold text-xs">
              3
            </div>
            <div>
              <p className="font-medium text-gray-900">Dados Sincronizados</p>
              <p>
                Nome, email, telefone e origem (UTM) são exibidos no card do Trello,
                junto com link para o perfil completo do lead.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* External Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recursos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://trello.com/power-ups/admin"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink size={14} className="mr-1.5" />
                Obter API Key
              </Button>
            </a>
            {status?.boardName && (
              <a
                href={`https://trello.com/b/${process.env.NEXT_PUBLIC_TRELLO_BOARD_ID || ''}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm">
                  <ExternalLink size={14} className="mr-1.5" />
                  Abrir Board no Trello
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
