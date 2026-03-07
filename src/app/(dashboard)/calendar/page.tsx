import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Calendar } from 'lucide-react';

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Calendário de Conteúdo</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            O calendário de conteúdo será implementado no Epic 3. Aqui você poderá planejar
            e organizar suas publicações por canal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
