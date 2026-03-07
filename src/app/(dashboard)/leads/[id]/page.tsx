import { auth } from '@/lib/auth';
import { LeadDetailClient } from './lead-detail-client';

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;

  return <LeadDetailClient leadId={id} />;
}
