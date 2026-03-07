import { auth } from '@/lib/auth';
import { LeadsClient } from './leads-client';

export default async function LeadsPage() {
  await auth();

  return <LeadsClient />;
}
