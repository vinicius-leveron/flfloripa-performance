import { auth } from '@/lib/auth';
import { FunnelClient } from './funnel-client';

export default async function FunnelPage() {
  await auth();

  return <FunnelClient />;
}
