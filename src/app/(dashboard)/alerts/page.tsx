import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Bell } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Alertas</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Os alertas de performance serão implementados no Epic 5. Aqui você poderá
            ver notificações de quedas em métricas e campanhas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
