import { auth } from '@/lib/auth';
import { CalendarClient } from './calendar-client';

export default async function CalendarPage() {
  await auth();

  return <CalendarClient />;
}
