'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { CheckCircle, AlertCircle, FileText } from 'lucide-react';

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
  slug: string;
  title: string;
  description: string | null;
  submitButtonText: string;
  fields: FormField[];
}

export default function PublicFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [fieldValues, setFieldValues] = useState<Record<string, string | boolean>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Captura UTM params
  const utmSource = searchParams.get('utm_source') || undefined;
  const utmMedium = searchParams.get('utm_medium') || undefined;
  const utmCampaign = searchParams.get('utm_campaign') || undefined;

  useEffect(() => {
    async function loadForm() {
      try {
        const res = await fetch(`/api/public/forms/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Formulário não encontrado');
          } else {
            setError('Erro ao carregar formulário');
          }
          return;
        }
        const data = await res.json();
        setForm(data.data);

        // Inicializa valores dos campos
        const initialValues: Record<string, string | boolean> = {};
        data.data.fields.forEach((field: FormField) => {
          initialValues[field.name] = field.fieldType === 'CHECKBOX' ? false : '';
        });
        setFieldValues(initialValues);
      } catch {
        setError('Erro ao carregar formulário');
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [slug]);

  const handleFieldChange = (name: string, value: string | boolean) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
    // Limpa erro do campo quando usuario comeca a digitar
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    // Validacao client-side
    const errors: Record<string, string> = {};
    form.fields.forEach((field) => {
      const value = fieldValues[field.name];
      if (field.required) {
        if (value === '' || value === false || value === undefined) {
          errors[field.name] = `${field.label} é obrigatório`;
        }
      }
      if (field.fieldType === 'EMAIL' && value && typeof value === 'string' && value.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors[field.name] = 'Email inválido';
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});

    try {
      const res = await fetch(`/api/public/forms/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fieldValues,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.details) {
          setFieldErrors(data.error.details);
        } else {
          setError(data.error?.message || 'Erro ao enviar formulário');
        }
        return;
      }

      setSuccessMessage(data.data.message);
      setSubmitted(true);

      // Redirect se configurado
      if (data.data.redirectUrl) {
        setTimeout(() => {
          window.location.href = data.data.redirectUrl;
        }, 2000);
      }
    } catch {
      setError('Erro ao enviar formulário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ops!</h2>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Enviado com sucesso!</h2>
            <p className="text-gray-600">{successMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto rounded-full bg-[#FDF2E9] p-3 w-fit mb-4">
              <FileText className="h-6 w-6 text-[#E8792A]" />
            </div>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">{form.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
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
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : field.fieldType === 'CHECKBOX' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={field.id}
                        checked={Boolean(fieldValues[field.name])}
                        onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                        className={`h-4 w-4 rounded border-gray-300 text-[#E8792A] focus:ring-[#E8792A] ${
                          fieldErrors[field.name] ? 'border-red-500' : ''
                        }`}
                      />
                      <span className="text-sm text-gray-600">
                        {field.placeholder || 'Concordo'}
                      </span>
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
                      type={
                        field.fieldType === 'EMAIL'
                          ? 'email'
                          : field.fieldType === 'PHONE'
                          ? 'tel'
                          : 'text'
                      }
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

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Enviando...' : form.submitButtonText || 'Enviar'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-gray-400">
          Fundação Logosófica de Florianópolis
        </p>
      </div>
    </div>
  );
}
