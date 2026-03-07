import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import Link from 'next/link';
import { Link2, Bell } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Nome</span>
            <span className="text-sm font-medium">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium">{session?.user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Role</span>
            <span className="text-sm font-medium">{session?.user?.role}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Link href="/settings/channels">
          <Card className="cursor-pointer transition-colors hover:border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Link2 size={20} />
                Canais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Conecte e gerencie seus canais de mídia social
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/settings/alerts">
          <Card className="cursor-pointer transition-colors hover:border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell size={20} />
                Alertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                Configure thresholds para alertas de performance
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
