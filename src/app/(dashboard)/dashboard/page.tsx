import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { LayoutDashboard, Users, TrendingUp, Eye } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  const placeholderCards = [
    { title: 'Impressões', value: '—', icon: Eye, color: 'text-blue-600 bg-blue-50' },
    { title: 'Engajamento', value: '—', icon: TrendingUp, color: 'text-green-600 bg-green-50' },
    { title: 'Seguidores', value: '—', icon: Users, color: 'text-purple-600 bg-purple-50' },
    { title: 'Leads', value: '—', icon: LayoutDashboard, color: 'text-orange-600 bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {session?.user?.name}!
        </h1>
        <p className="text-sm text-gray-500">
          Bem-vindo à plataforma de performance da Fundação Logosófica de Florianópolis
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {placeholderCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">
                {card.title}
              </CardTitle>
              <div className={`rounded-md p-2 ${card.color}`}>
                <card.icon size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-gray-400 mt-1">
                Conecte seus canais para ver métricas
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Primeiros Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Conecte seus canais</p>
              <p className="text-xs text-gray-500">
                Vá em Configurações → Canais para conectar Instagram, TikTok e LinkedIn
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Planeje seu conteúdo</p>
              <p className="text-xs text-gray-500">
                Use o Calendário para organizar suas publicações
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Registre seus leads</p>
              <p className="text-xs text-gray-500">
                Acompanhe pessoas interessadas no funil de conversão
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
