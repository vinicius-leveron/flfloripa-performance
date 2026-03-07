import { auth } from '@/lib/auth';
import { AlertsClient } from './alerts-client';

export default async function AlertsPage() {
  await auth();

  return <AlertsClient />;
}
