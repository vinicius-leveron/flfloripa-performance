import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { FileText } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            A geração de relatórios será implementada no Epic 6. Aqui você poderá
            gerar relatórios semanais e mensais em PDF.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
