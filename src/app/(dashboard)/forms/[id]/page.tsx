import { auth } from '@/lib/auth';
import { FormBuilderClient } from './form-builder-client';

export default async function FormBuilderPage({ params }: { params: Promise<{ id: string }> }) {
  await auth();
  const { id } = await params;

  return <FormBuilderClient formId={id} />;
}
