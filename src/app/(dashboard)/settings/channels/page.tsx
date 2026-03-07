import { auth } from '@/lib/auth';
import { ChannelsClient } from './channels-client';

export default async function ChannelsSettingsPage() {
  await auth();

  return <ChannelsClient />;
}
