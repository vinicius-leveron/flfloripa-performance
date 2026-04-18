'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

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

export default function EmbedFormPage() {
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
          setError(res.status === 404 ? 'Formulário não encontrado' : 'Erro ao carregar');
          return;
        }
        const data = await res.json();
        setForm(data.data);

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
          setError(data.error?.message || 'Erro ao enviar');
        }
        return;
      }

      setSuccessMessage(data.data.message);
      setSubmitted(true);

      // Notifica pagina pai sobre sucesso (para integrações)
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'form-submitted', formSlug: slug }, '*');
      }

      if (data.data.redirectUrl) {
        setTimeout(() => {
          window.top?.location.assign(data.data.redirectUrl);
        }, 2000);
      }
    } catch {
      setError('Erro ao enviar');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-gray-600">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-green-100 p-3 mb-3">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <p className="text-sm text-gray-700">{successMessage}</p>
      </div>
    );
  }

  if (!form) return null;

  return (
    <div className="p-4">
      {form.description && (
        <p className="text-sm text-gray-600 mb-4">{form.description}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {form.fields.map((field) => (
          <div key={field.id} className="space-y-1">
            <Label htmlFor={field.id} className="text-sm">
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
                className={`text-sm ${fieldErrors[field.name] ? 'border-red-500' : ''}`}
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
                  className="h-4 w-4 rounded border-gray-300 text-[#E8792A]"
                />
                <span className="text-sm text-gray-600">{field.placeholder || 'Concordo'}</span>
              </div>
            ) : field.fieldType === 'DATE' ? (
              <Input
                type="date"
                id={field.id}
                value={String(fieldValues[field.name] || '')}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className={`text-sm ${fieldErrors[field.name] ? 'border-red-500' : ''}`}
              />
            ) : (
              <Input
                type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
                id={field.id}
                placeholder={field.placeholder || ''}
                value={String(fieldValues[field.name] || '')}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className={`text-sm ${fieldErrors[field.name] ? 'border-red-500' : ''}`}
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
    </div>
  );
}
