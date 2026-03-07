import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Filter } from 'lucide-react';

export default function FunnelPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Funil de Conversão</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            O funil de conversão será implementado no Epic 4. Aqui você poderá
            visualizar os 6 estágios do funil e as taxas de conversão.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
