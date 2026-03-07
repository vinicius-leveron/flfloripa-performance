'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChannelComparisonProps {
  data: { platform: string; name: string; impressions: number; engagement: number; followers: number }[];
}

const platformLabels: Record<string, string> = {
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  LINKEDIN: 'LinkedIn',
};

export function ChannelComparison({ data }: ChannelComparisonProps) {
  const formatted = data.map((d) => ({
    ...d,
    label: platformLabels[d.platform] || d.platform,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Comparativo por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formatted}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="impressions" name="Impressões" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="engagement" name="Engajamento" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
