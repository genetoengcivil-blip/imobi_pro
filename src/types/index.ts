export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'novo' | 'contato' | 'visita' | 'proposta' | 'fechado';
  value: number;
  commission: number;
  source: string;
  notes: string;
  createdAt: string;
  lastContact?: string;
  nextFollowUp?: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  address?: {
    cep: string;
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    complemento?: string;
  };
  type: 'venda' | 'locação';
  status: 'disponível' | 'reservado' | 'vendido';
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: string[];
  features?: string[];
  marketComparables?: { price: number; area: number; description: string }[];
}

export interface Appointment {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'visita' | 'reunião' | 'follow-up' | 'assinatura';
  leadId?: string;
  propertyId?: string;
  notes: string;
}

export interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  category: string;
  amount: number;
  date: string;
  description: string;
  status: 'pago' | 'pendente';
}

export interface Contract {
  id: string;
  clientName: string;
  propertyId: string;
  propertyName: string;
  value: number;
  commission: number;
  status: 'rascunho' | 'ativo' | 'concluido' | 'cancelado';
  startDate: string;
  endDate: string;
  type: 'venda' | 'locação';
  notes: string;
}

export interface Message {
  id: string;
  leadId: string;
  content: string;
  timestamp: string;
  sender: 'user' | 'lead';
  status: 'sent' | 'delivered' | 'read';
}

export type LeadStatus = 'novo' | 'contato' | 'visita' | 'proposta' | 'fechado';

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'novo', label: 'Novo Lead', color: 'bg-blue-500' },
  { value: 'contato', label: 'Contato Feito', color: 'bg-orange-500' },
  { value: 'visita', label: 'Visita Agendada', color: 'bg-purple-500' },
  { value: 'proposta', label: 'Proposta Enviada', color: 'bg-indigo-500' },
  { value: 'fechado', label: 'Fechado', color: 'bg-green-500' },
];

export const STATUS_COLORS: Record<LeadStatus, string> = {
  novo: 'bg-blue-500',
  contato: 'bg-orange-500',
  visita: 'bg-purple-500',
  proposta: 'bg-indigo-500',
  fechado: 'bg-green-500',
};

export interface User {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  creci: string;
  avatar?: string;
  logo?: string;
  bio?: string;
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    linkedin?: string;
    tiktok?: string;
  };
  plan?: 'mensal' | 'semestral' | 'anual';
}
