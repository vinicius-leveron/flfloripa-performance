import { auth } from '@/lib/auth';
import { CampaignsClient } from './campaigns-client';

export default async function CampaignsPage() {
  await auth();

  return <CampaignsClient />;
}
