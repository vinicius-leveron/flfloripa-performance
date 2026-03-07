import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Bell } from 'lucide-react';

export default async function AlertsSettingsPage() {
  await auth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configuração de Alertas</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell size={20} />
            Thresholds de Alerta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Configure os limites para receber alertas automáticos de performance.
            Alertas são verificados a cada 6 horas durante a sincronização de métricas.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium">Queda de Engajamento</p>
                <p className="text-xs text-gray-500">Alerta quando engajamento cai mais que o limite</p>
              </div>
              <span className="text-sm font-bold text-gray-700">-20%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium">Campanha Abaixo do Esperado</p>
                <p className="text-xs text-gray-500">Alerta quando CTR de campanha fica abaixo do limite</p>
              </div>
              <span className="text-sm font-bold text-gray-700">&lt; 1%</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
              <div>
                <p className="text-sm font-medium">Meta de Cadência Não Atingida</p>
                <p className="text-xs text-gray-500">Alerta quando a meta semanal de postagens não é atingida</p>
              </div>
              <span className="text-sm font-bold text-gray-700">3 posts/semana</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
