import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Users } from 'lucide-react';

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            A gestão de leads será implementada no Epic 4. Aqui você poderá registrar
            e acompanhar contatos no funil de conversão.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
