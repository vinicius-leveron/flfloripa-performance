'use client';

import { MessageCircle, Mail, Phone } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

interface LeadQuickActionsProps {
  phone?: string | null;
  email?: string | null;
  name?: string;
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-numeric characters
  const numbers = phone.replace(/\D/g, '');
  // Add Brazil country code if not present
  if (numbers.length === 11 || numbers.length === 10) {
    return `55${numbers}`;
  }
  return numbers;
}

export function LeadQuickActions({ phone, email, name }: LeadQuickActionsProps) {
  const handleWhatsApp = () => {
    if (!phone) {
      toast.error('Lead não possui telefone cadastrado');
      return;
    }
    const formattedPhone = formatPhoneForWhatsApp(phone);
    const message = name ? `Olá ${name.split(' ')[0]}!` : 'Olá!';
    window.open(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleEmail = () => {
    if (!email) {
      toast.error('Lead não possui email cadastrado');
      return;
    }
    window.open(`mailto:${email}`, '_blank');
  };

  const handleCall = () => {
    if (!phone) {
      toast.error('Lead não possui telefone cadastrado');
      return;
    }
    window.open(`tel:${phone}`, '_blank');
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleWhatsApp}
        className="bg-white/20 hover:bg-white/30 text-white h-9 w-9 p-0"
        title="Enviar WhatsApp"
      >
        <MessageCircle size={18} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleEmail}
        className="bg-white/20 hover:bg-white/30 text-white h-9 w-9 p-0"
        title="Enviar Email"
      >
        <Mail size={18} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCall}
        className="bg-white/20 hover:bg-white/30 text-white h-9 w-9 p-0"
        title="Ligar"
      >
        <Phone size={18} />
      </Button>
    </div>
  );
}
