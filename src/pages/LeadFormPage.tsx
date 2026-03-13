import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Lead, LEAD_STATUSES } from '../types';

interface LeadFormProps {
  lead?: Lead;
  onClose: () => void;
}

export default function LeadFormPage({ lead, onClose }: LeadFormProps) {
  const { addLead, updateLead, darkMode } = useGlobal();
  const [formData, setFormData] = useState<Omit<Lead, 'id' | 'createdAt'>>({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    status: lead?.status || 'novo',
    value: lead?.value || 0,
    commission: lead?.commission || 0,
    source: lead?.source || '',
    notes: lead?.notes || '',
    nextFollowUp: lead?.nextFollowUp || '',
    lastContact: lead?.lastContact || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (lead) {
      updateLead(lead.id, formData);
    } else {
      addLead(formData as any);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className={`w-full max-w-xl rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${darkMode ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-900'}`}>
        <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold">{lead ? 'Editar Lead' : 'Novo Lead'}</h2>
            <p className="text-xs text-zinc-500 font-medium">Informações do contato e negociação.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Nome Completo</label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Telefone</label>
              <input
                required
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">E-mail</label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
              >
                {LEAD_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Origem</label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
                placeholder="Ex: Instagram, Site, Indicação"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Valor do Imóvel</label>
              <input
                type="number"
                value={formData.value || ''}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
                placeholder="R$ 0,00"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Comissão Estimada</label>
              <input
                type="number"
                value={formData.commission || ''}
                onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
                placeholder="R$ 0,00"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Próximo Follow-up</label>
              <input
                type="date"
                value={formData.nextFollowUp}
                onChange={(e) => setFormData({ ...formData, nextFollowUp: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Observações</label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/5 rounded-xl py-4 px-6 focus:outline-none focus:border-blue-500 resize-none"
                placeholder="Notas sobre o atendimento..."
              />
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-100 dark:border-white/5 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              Salvar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
