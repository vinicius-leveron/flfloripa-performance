'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Skeleton } from '@/shared/components/ui/skeleton';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  GripVertical,
  Trash2,
  Edit2,
  Eye,
  Send,
  Settings,
  Type,
  Mail,
  Phone,
  AlignLeft,
  ChevronDown,
  CheckSquare,
  Calendar,
  X,
  Save,
  ExternalLink,
  Copy,
  Users,
  Code,
} from 'lucide-react';

// Types
interface FormField {
  id: string;
  formId: string;
  fieldType: 'TEXT' | 'EMAIL' | 'PHONE' | 'TEXTAREA' | 'SELECT' | 'CHECKBOX' | 'DATE';
  name: string;
  label: string;
  placeholder: string | null;
  helpText: string | null;
  required: boolean;
  position: number;
  validation: Record<string, unknown> | null;
  options: { label: string; value: string }[] | null;
  leadFieldMapping: string | null;
}

interface FormData {
  id: string;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  submitButtonText: string;
  successMessage: string | null;
  fields: FormField[];
  _count: { submissions: number };
}

// Field type config
const fieldTypes = [
  { type: 'TEXT', label: 'Texto', icon: Type, color: 'bg-blue-100 text-blue-700' },
  { type: 'EMAIL', label: 'Email', icon: Mail, color: 'bg-green-100 text-green-700' },
  { type: 'PHONE', label: 'Telefone', icon: Phone, color: 'bg-purple-100 text-purple-700' },
  { type: 'TEXTAREA', label: 'Texto Longo', icon: AlignLeft, color: 'bg-yellow-100 text-yellow-700' },
  { type: 'SELECT', label: 'Seleção', icon: ChevronDown, color: 'bg-pink-100 text-pink-700' },
  { type: 'CHECKBOX', label: 'Checkbox', icon: CheckSquare, color: 'bg-indigo-100 text-indigo-700' },
  { type: 'DATE', label: 'Data', icon: Calendar, color: 'bg-orange-100 text-orange-700' },
] as const;

const leadFieldMappings = [
  { value: '', label: 'Nenhum' },
  { value: 'name', label: 'Nome do Lead' },
  { value: 'email', label: 'Email do Lead' },
  { value: 'phone', label: 'Telefone do Lead' },
  { value: 'lifeMoment', label: 'Momento de Vida' },
  { value: 'inquiry', label: 'Dúvida/Interesse' },
  { value: 'source', label: 'Origem' },
];

// Sortable Field Item
function SortableFieldItem({
  field,
  onEdit,
  onDelete,
}: {
  field: FormField;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const fieldConfig = fieldTypes.find((t) => t.type === field.fieldType);
  const Icon = fieldConfig?.icon || Type;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border bg-white p-3 ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={18} />
      </button>

      <div className={`rounded-md p-2 ${fieldConfig?.color || 'bg-gray-100 text-gray-700'}`}>
        <Icon size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 truncate">{field.label}</span>
          {field.required && <span className="text-red-500 text-xs">*</span>}
          {field.leadFieldMapping && (
            <Badge variant="outline" className="text-[10px]">
              {leadFieldMappings.find((m) => m.value === field.leadFieldMapping)?.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate">
          {fieldConfig?.label} · {field.name}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Edit2 size={14} />
        </Button>
        <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}>
          <Trash2 size={14} />
        </Button>
      </div>
    </div>
  );
}

// Field Editor Dialog
function FieldEditor({
  field,
  onSave,
  onClose,
  isNew,
}: {
  field: Partial<FormField>;
  onSave: (data: Partial<FormField>) => void;
  onClose: () => void;
  isNew?: boolean;
}) {
  const [data, setData] = useState({
    fieldType: field.fieldType || 'TEXT',
    name: field.name || '',
    label: field.label || '',
    placeholder: field.placeholder || '',
    helpText: field.helpText || '',
    required: field.required ?? false,
    leadFieldMapping: field.leadFieldMapping || '',
    options: field.options || [{ label: '', value: '' }],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.label.trim()) {
      toast.error('Label é obrigatório');
      return;
    }
    if (!data.name.trim()) {
      toast.error('Nome do campo é obrigatório');
      return;
    }
    onSave({
      ...data,
      options: data.fieldType === 'SELECT' ? data.options.filter((o) => o.label && o.value) : null,
      leadFieldMapping: data.leadFieldMapping || null,
    });
  };

  const addOption = () => {
    setData((prev) => ({
      ...prev,
      options: [...prev.options, { label: '', value: '' }],
    }));
  };

  const updateOption = (index: number, key: 'label' | 'value', value: string) => {
    setData((prev) => ({
      ...prev,
      options: prev.options.map((o, i) =>
        i === index ? { ...o, [key]: value, ...(key === 'label' ? { value: value.toLowerCase().replace(/\s+/g, '_') } : {}) } : o
      ),
    }));
  };

  const removeOption = (index: number) => {
    setData((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {isNew ? 'Adicionar Campo' : 'Editar Campo'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Campo</Label>
            <div className="grid grid-cols-4 gap-2">
              {fieldTypes.map((ft) => {
                const Icon = ft.icon;
                return (
                  <button
                    key={ft.type}
                    type="button"
                    onClick={() => setData((prev) => ({ ...prev, fieldType: ft.type }))}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors ${
                      data.fieldType === ft.type
                        ? 'border-[#E8792A] bg-[#FDF2E9] text-[#E8792A]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon size={18} />
                    {ft.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="field-label">Label *</Label>
              <Input
                id="field-label"
                placeholder="Ex: Nome completo"
                value={data.label}
                onChange={(e) => {
                  const label = e.target.value;
                  setData((prev) => ({
                    ...prev,
                    label,
                    name: prev.name || label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
                  }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-name">Nome Interno *</Label>
              <Input
                id="field-name"
                placeholder="nome_completo"
                value={data.name}
                onChange={(e) => setData((prev) => ({ ...prev, name: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              placeholder="Texto de exemplo..."
              value={data.placeholder}
              onChange={(e) => setData((prev) => ({ ...prev, placeholder: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-help">Texto de Ajuda</Label>
            <Input
              id="field-help"
              placeholder="Instruções adicionais..."
              value={data.helpText}
              onChange={(e) => setData((prev) => ({ ...prev, helpText: e.target.value }))}
            />
          </div>

          {data.fieldType === 'SELECT' && (
            <div className="space-y-2">
              <Label>Opções</Label>
              <div className="space-y-2">
                {data.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="Label"
                      value={option.label}
                      onChange={(e) => updateOption(index, 'label', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Valor"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                      className="text-red-600"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addOption}>
                  <Plus size={14} className="mr-1" />
                  Adicionar Opção
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Mapeamento para Lead</Label>
              <select
                value={data.leadFieldMapping}
                onChange={(e) => setData((prev) => ({ ...prev, leadFieldMapping: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {leadFieldMappings.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="field-required"
                checked={data.required}
                onChange={(e) => setData((prev) => ({ ...prev, required: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-[#E8792A] focus:ring-[#E8792A]"
              />
              <Label htmlFor="field-required" className="font-normal">
                Campo obrigatório
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              <Save size={16} className="mr-2" />
              {isNew ? 'Adicionar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Embed Code Modal
function EmbedCodeModal({
  formId,
  formSlug,
  formTitle,
  onClose,
}: {
  formId: string;
  formSlug: string;
  formTitle: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'iframe' | 'script'>('iframe');
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<{
    data: {
      embedUrl: string;
      publicUrl: string;
      iframeCode: string;
      scriptCode: string;
    };
  }>({
    queryKey: ['embed-code', formId],
    queryFn: () => fetch(`/api/forms/${formId}/embed-code`).then((r) => r.json()),
  });

  const embedData = data?.data;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Código copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Código de Embed</h3>
            <p className="text-sm text-gray-500">
              Copie o código abaixo para embedar o formulário em seu site
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={18} />
          </Button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <Skeleton className="h-40 w-full" />
          </div>
        ) : embedData ? (
          <>
            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                onClick={() => setActiveTab('iframe')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'iframe'
                    ? 'border-[#E8792A] text-[#E8792A]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Iframe (Simples)
              </button>
              <button
                onClick={() => setActiveTab('script')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'script'
                    ? 'border-[#E8792A] text-[#E8792A]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Script (Avançado)
              </button>
            </div>

            {/* Code Display */}
            <div className="space-y-4">
              <div className="relative">
                <pre className="rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto max-h-48">
                  <code>{activeTab === 'iframe' ? embedData.iframeCode : embedData.scriptCode}</code>
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() =>
                    handleCopy(activeTab === 'iframe' ? embedData.iframeCode : embedData.scriptCode)
                  }
                >
                  {copied ? (
                    <>
                      <CheckSquare size={14} className="mr-1" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="mr-1" />
                      Copiar
                    </>
                  )}
                </Button>
              </div>

              {/* Info */}
              <div className="rounded-lg bg-blue-50 p-3 text-sm">
                {activeTab === 'iframe' ? (
                  <p className="text-blue-700">
                    <strong>Iframe:</strong> Método mais simples. Cole este código diretamente no HTML
                    da sua página. O formulário será exibido dentro de um iframe.
                  </p>
                ) : (
                  <p className="text-blue-700">
                    <strong>Script:</strong> Método avançado. Permite receber eventos quando o
                    formulário é submetido (útil para tracking de conversões).
                  </p>
                )}
              </div>

              {/* URLs */}
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">URL do Embed:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">{embedData.embedUrl}</code>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">URL Pública:</span>
                  <code className="rounded bg-gray-100 px-2 py-0.5 text-xs">{embedData.publicUrl}</code>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="py-8 text-center text-gray-500">Erro ao carregar código de embed</div>
        )}

        <div className="flex justify-end mt-6 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Main Component
export function FormBuilderClient({ formId }: { formId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isAddingField, setIsAddingField] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data, isLoading } = useQuery<{ data: FormData }>({
    queryKey: ['form', formId],
    queryFn: () => fetch(`/api/forms/${formId}`).then((r) => r.json()),
  });

  const form = data?.data;

  const reorderMutation = useMutation({
    mutationFn: async (fieldIds: string[]) => {
      const res = await fetch(`/api/forms/${formId}/fields/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldIds }),
      });
      if (!res.ok) throw new Error('Erro ao reordenar');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
    },
    onError: () => {
      toast.error('Erro ao reordenar campos');
    },
  });

  const addFieldMutation = useMutation({
    mutationFn: async (fieldData: Partial<FormField>) => {
      const res = await fetch(`/api/forms/${formId}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Erro ao adicionar campo');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
      setIsAddingField(false);
      toast.success('Campo adicionado');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: async ({ fieldId, data: fieldData }: { fieldId: string; data: Partial<FormField> }) => {
      const res = await fetch(`/api/forms/${formId}/fields/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fieldData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Erro ao atualizar campo');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
      setEditingField(null);
      toast.success('Campo atualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (fieldId: string) => {
      const res = await fetch(`/api/forms/${formId}/fields/${fieldId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Erro ao remover campo');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
      toast.success('Campo removido');
    },
    onError: () => {
      toast.error('Erro ao remover campo');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/forms/${formId}/publish`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error?.message || 'Erro ao publicar');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form', formId] });
      toast.success('Formulário publicado!');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && form) {
      const oldIndex = form.fields.findIndex((f) => f.id === active.id);
      const newIndex = form.fields.findIndex((f) => f.id === over.id);
      const newFields = arrayMove(form.fields, oldIndex, newIndex);
      reorderMutation.mutate(newFields.map((f) => f.id));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
          <Button variant="outline" className="mt-4">
            Voltar
          </Button>
        </Link>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; variant: 'secondary' | 'success' | 'default' }> = {
    DRAFT: { label: 'Rascunho', variant: 'secondary' },
    PUBLISHED: { label: 'Publicado', variant: 'success' },
    ARCHIVED: { label: 'Arquivado', variant: 'default' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/forms">
            <Button variant="ghost" size="icon">
              <ArrowLeft size={20} />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
              <Badge variant={statusConfig[form.status].variant}>
                {statusConfig[form.status].label}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              {form._count.submissions} submissões · Slug: {form.slug}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Modo Staff sempre disponivel */}
          <Link href={`/forms/${form.id}/fill`}>
            <Button variant="outline" size="sm">
              <Users size={14} className="mr-1.5" />
              Modo Presencial
            </Button>
          </Link>

          {form.status === 'PUBLISHED' && (
            <>
              <Link href={`/f/${form.slug}`} target="_blank">
                <Button variant="outline" size="sm">
                  <ExternalLink size={14} className="mr-1.5" />
                  Visualizar
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/f/${form.slug}`);
                  toast.success('Link copiado!');
                }}
              >
                <Copy size={14} className="mr-1.5" />
                Copiar Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEmbedModal(true)}
              >
                <Code size={14} className="mr-1.5" />
                Código de Embed
              </Button>
            </>
          )}
          {form.status === 'DRAFT' && (
            <Button onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
              <Send size={14} className="mr-1.5" />
              {publishMutation.isPending ? 'Publicando...' : 'Publicar'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Field List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Campos do Formulário</CardTitle>
                <Button size="sm" onClick={() => setIsAddingField(true)}>
                  <Plus size={14} className="mr-1.5" />
                  Adicionar Campo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {form.fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Type className="mb-2 h-10 w-10 text-gray-300" />
                  <p className="text-sm text-gray-500">Nenhum campo adicionado</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Clique em &quot;Adicionar Campo&quot; para começar
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={form.fields.map((f) => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {form.fields.map((field) => (
                        <SortableFieldItem
                          key={field.id}
                          field={field}
                          onEdit={() => setEditingField(field)}
                          onDelete={() => {
                            if (confirm('Tem certeza que deseja remover este campo?')) {
                              deleteFieldMutation.mutate(field.id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div>
          <Card className="sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-gray-500" />
                <CardTitle className="text-lg">Preview</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
                {form.description && (
                  <p className="mb-4 text-sm text-gray-600">{form.description}</p>
                )}

                <div className="space-y-4">
                  {form.fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      </label>
                      {field.fieldType === 'TEXTAREA' ? (
                        <textarea
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          placeholder={field.placeholder || ''}
                          rows={3}
                          disabled
                        />
                      ) : field.fieldType === 'SELECT' ? (
                        <select
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          disabled
                        >
                          <option>{field.placeholder || 'Selecione...'}</option>
                          {field.options?.map((opt) => (
                            <option key={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : field.fieldType === 'CHECKBOX' ? (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled className="h-4 w-4" />
                          <span className="text-sm text-gray-600">
                            {field.placeholder || 'Concordo'}
                          </span>
                        </div>
                      ) : field.fieldType === 'DATE' ? (
                        <input
                          type="date"
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          disabled
                        />
                      ) : (
                        <input
                          type={field.fieldType === 'EMAIL' ? 'email' : field.fieldType === 'PHONE' ? 'tel' : 'text'}
                          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                          placeholder={field.placeholder || ''}
                          disabled
                        />
                      )}
                      {field.helpText && (
                        <p className="text-xs text-gray-500">{field.helpText}</p>
                      )}
                    </div>
                  ))}

                  <Button className="w-full" disabled>
                    {form.submitButtonText || 'Enviar'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Field Editor Dialog */}
      {isAddingField && (
        <FieldEditor
          field={{}}
          isNew
          onSave={(fieldData) => addFieldMutation.mutate(fieldData)}
          onClose={() => setIsAddingField(false)}
        />
      )}

      {editingField && (
        <FieldEditor
          field={editingField}
          onSave={(fieldData) =>
            updateFieldMutation.mutate({ fieldId: editingField.id, data: fieldData })
          }
          onClose={() => setEditingField(null)}
        />
      )}

      {showEmbedModal && (
        <EmbedCodeModal
          formId={form.id}
          formSlug={form.slug}
          formTitle={form.title}
          onClose={() => setShowEmbedModal(false)}
        />
      )}
    </div>
  );
}
