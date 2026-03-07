'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Skeleton } from '@/shared/components/ui/skeleton';

interface FunnelStageData {
  id: string;
  name: string;
  position: number;
  description: string | null;
  leadCount: number;
  conversionRate: number;
}

const stageColors = [
  'bg-[#1B2A4A]',
  'bg-[#2A3F6A]',
  'bg-[#E8792A]',
  'bg-[#D16A22]',
  'bg-[#F5A623]',
  'bg-[#F7C177]',
];

export function FunnelClient() {
  const { data, isLoading } = useQuery<{ data: FunnelStageData[] }>({
    queryKey: ['funnel-stages'],
    queryFn: () => fetch('/api/funnel/stages').then(r => r.json()),
  });

  const stages = data?.data || [];
  const maxLeads = Math.max(...stages.map(s => s.leadCount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Funil de Conversão</h1>
        <p className="text-sm text-gray-500">
          Visualize os estágios do funil e as taxas de conversão
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">Nenhum estágio configurado. Execute o seed do banco de dados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visualização do Funil</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-2">
                {stages.map((stage, i) => {
                  const widthPercent = maxLeads > 0
                    ? Math.max(20, (stage.leadCount / maxLeads) * 100)
                    : 100 - i * 12;

                  return (
                    <div key={stage.id} className="w-full">
                      <div
                        className={`mx-auto flex items-center justify-between rounded-lg px-4 py-3 text-white ${stageColors[i % stageColors.length]}`}
                        style={{ width: `${widthPercent}%` }}
                      >
                        <span className="text-sm font-medium">{stage.name}</span>
                        <span className="text-sm font-bold">{stage.leadCount}</span>
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
          <div className="grid gap-4 md:grid-cols-3">
            {stages.map((stage, i) => (
              <Card key={stage.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <div className={`h-3 w-3 rounded-full ${stageColors[i % stageColors.length]}`} />
                    {stage.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stage.leadCount}</div>
                  <p className="text-xs text-gray-500">
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
        </>
      )}
    </div>
  );
}
