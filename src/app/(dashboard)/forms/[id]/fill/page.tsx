'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Badge } from '@/shared/components/ui/badge';
import { toast } from 'sonner';
import { ArrowLeft, Users, CheckCircle, RotateCcw, FileText } from 'lucide-react';

interface FormField {
  id: string;
  fieldType: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'DATE';
  name: string;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  options: { label: string; value: string }[] | null;
}

interface FormData {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  submitButtonText: string;
  fields: FormField[];
}

export default function StaffFillPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const formId = params.id as string;

  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submissionCount, setSubmissionCount] = useState(0);

  const { data, isLoading } = useQuery<{ data: FormData }>({
    queryKey: ['form', formId],
    queryFn: () => fetch(`/api/forms/${formId}`).then((r) => r.json()),
  });

  const form = data?.data;

  // Inicializa valores quando form carrega
  useEffect(() => {
    if (form) {
      const initialValues: Record<string, string | boolean> = {};
      form.fields.forEach((field) => {
        initialValues[field.name] = field.fieldType === 'CHECKBOX' ? false : '';
      });
      setFieldValues(initialValues);
    }
  }, [form]);

  const submitMutation = useMutation({
    mutationFn: async (fields: Record<string, string | boolean>) => {
      const res = await fetch(`/api/forms/${formId}/submit-staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      });
      if (!res.ok) {
        const error = await res.json();
        if (error.error?.details) {
          throw { type: 'validation', details: error.error.details };
        }
        throw new Error(error.error?.message || 'Erro ao registrar');
      }
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      setSubmissionCount((prev) => prev + 1);
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
      toast.success('Lead registrado com sucesso!');
    },
    onError: (error: unknown) => {
      if (typeof error === 'object' && error !== null && 'type' in error) {
        const validationError = error as { type: string; details: Record<string, string> };
        if (validationError.type === 'validation') {
          setFieldErrors(validationError.details);
          return;
        }
      }
      toast.error(error instanceof Error ? error.message : 'Erro ao registrar');
    },
  });

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    const errors: Record<string, string> = {};
    form.fields.forEach((field) => {
      const value = fieldValues[field.name];
      if (field.required && (value === '' || value === false || value === undefined)) {
        errors[field.name] = `${field.label} é obrigatório`;
      }
      if (field.fieldType === 'EMAIL' && value && typeof value === 'string' && value.length > 0) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors[field.name] = 'Email inválido';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    submitMutation.mutate(fieldValues);
  };

  const handleReset = () => {
    setSubmitted(false);
    if (form) {
      const initialValues: Record<string, string | boolean> = {};
      form.fields.forEach((field) => {
        initialValues[field.name] = field.fieldType === 'CHECKBOX' ? false : '';
      });
      setFieldValues(initialValues);
    }
    setFieldErrors({});
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!form) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-500">Formulário não encontrado</p>
        <Link href="/forms">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/forms/${formId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">Modo Presencial</h1>
            <Badge variant="secondary">
              <Users size={12} className="mr-1" />
              Staff
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{form.title}</p>
        </div>
        {submissionCount > 0 && (
          <Badge variant="outline" className="text-green-600">
            {submissionCount} registrado{submissionCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {submitted ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lead Registrado!</h2>
            <p className="text-gray-600 mb-6">Os dados foram salvos com sucesso.</p>
            <div className="flex gap-3">
              <Button onClick={handleReset}>
                <RotateCcw size={16} className="mr-2" />
                Registrar Outro
              </Button>
              <Link href="/leads">
                <Button variant="outline">Ver Leads</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[#FDF2E9] p-2.5 text-[#E8792A]">
                <FileText size={20} />
              </div>
              <div>
                <CardTitle>Preencher Formulário</CardTitle>
                <CardDescription>Registre o visitante presencial</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {form.description && (
              <p className="text-sm text-gray-600 mb-4">{form.description}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {form.fields.map((field) => (
                <div key={field.id} className="space-y-1.5">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-red-500 ml-0.5">*</span>}
                  </Label>

                  {field.fieldType === 'TEXTAREA' ? (
                    <Textarea
                      id={field.id}
                      placeholder={field.placeholder || ''}
                      value={String(fieldValues[field.name] || '')}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      rows={3}
                      className={fieldErrors[field.name] ? 'border-red-500' : ''}
                    />
                  ) : field.fieldType === 'SELECT' ? (
                    <select
                      id={field.id}
                      value={String(fieldValues[field.name] || '')}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className={`w-full rounded-md border px-3 py-2 text-sm ${
                        fieldErrors[field.name] ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">{field.placeholder || 'Selecione...'}</option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : field.fieldType === 'CHECKBOX' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={field.id}
                        checked={Boolean(fieldValues[field.name])}
                        onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#E8792A] focus:ring-[#E8792A]"
                      />
                      <span className="text-sm text-gray-600">{field.placeholder || 'Sim'}</span>
                    </div>
                  ) : field.fieldType === 'DATE' ? (
                    <Input
                      type="date"
                      id={field.id}
                      value={String(fieldValues[field.name] || '')}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className={fieldErrors[field.name] ? 'border-red-500' : ''}
                    />
                  ) : (
                    <Input
                      type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
                      id={field.id}
                      placeholder={field.placeholder || ''}
                      value={String(fieldValues[field.name] || '')}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      className={fieldErrors[field.name] ? 'border-red-500' : ''}
                    />
                  )}

                  {field.helpText && !fieldErrors[field.name] && (
                    <p className="text-xs text-gray-500">{field.helpText}</p>
                  )}
                  {fieldErrors[field.name] && (
                    <p className="text-xs text-red-500">{fieldErrors[field.name]}</p>
                  )}
                </div>
              ))}

              <Button type="submit" className="w-full" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? 'Registrando...' : 'Registrar Lead'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
