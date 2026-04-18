'use client';

import { cn } from '@/shared/utils/cn';
import { Copy, Check } from 'lucide-react';
import { useState, type ReactNode } from 'react';

interface InfoRowProps {
  icon: ReactNode;
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
  href?: string;
  className?: string;
}

export function InfoRow({ icon, label, value, copyable, href, className }: InfoRowProps) {
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const content = (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      <div className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-sm text-gray-900 break-words">{value}</p>
      </div>
      {copyable && (
        <button
          type="button"
          onClick={handleCopy}
          className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
          title="Copiar"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      )}
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block hover:bg-gray-50 rounded -mx-2 px-2 transition-colors">
        {content}
      </a>
    );
  }

  return content;
}
