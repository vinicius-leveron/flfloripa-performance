import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Link2 } from 'lucide-react';

export default function ChannelsSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Canais</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 size={20} />
            Em breve
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            A conexão de canais via OAuth será implementada no Epic 2. Aqui você poderá
            conectar Instagram, TikTok e LinkedIn.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
