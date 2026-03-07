import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Megaphone } from 'lucide-react';

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Campanhas</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            A gestão de campanhas Meta Ads será implementada no Epic 5. Aqui você
            poderá acompanhar performance e ROI das campanhas pagas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
