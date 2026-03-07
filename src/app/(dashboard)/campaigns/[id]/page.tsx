import { auth } from '@/lib/auth';
import { CampaignDetailClient } from './campaign-detail-client';

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;

  return <CampaignDetailClient campaignId={id} />;
}
