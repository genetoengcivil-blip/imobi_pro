import React, { useState } from 'react';
import { X, Save, Building, Phone, Mail, User, DollarSign, Loader2 } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Lead } from '../types';

interface LeadFormProps {
  lead?: Lead;
  onClose: () => void;
}

export default function LeadFormPage({ lead, onClose }: LeadFormProps) {
  const { addLead, updateLead, darkMode } = useGlobal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const theme = {
    overlay: 'bg-black/60 backdrop-blur-md',
    bgApp: darkMode ? 'bg-zinc-950' : 'bg-white',
    border: darkMode ? 'border-white/10' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-zinc-500',
    inputBg: darkMode ? 'bg-white/5' : 'bg-zinc-50',
    hoverBg: darkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-100',
  };

  const [formData, setFormData] = useState({
    name: lead?.name || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    status: lead?.status || 'novo',
    value: lead?.value || 0,
    commission: lead?.commission || lead?.commission_rate || 6,
    source: lead?.source || 'Orgânico',
    notes: lead?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Espelhamos a comissão para 2 nomes de coluna diferentes,
      // assim evitamos que o Supabase rejeite por causa do nome da coluna!
      const dataToSave = {
        ...formData,
        commission_rate: formData.commission 
      };

      if (lead && lead.id) {
        await updateLead(lead.id, dataToSave);
      } else {
        await addLead(dataToSave);
      }
      onClose(); // Só fecha o modal SE salvar com sucesso
    } catch (error) {
      console.error("Erro ao salvar o Lead:", error);
      alert("Falha ao salvar. Verifique se a sua sessão expirou.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${theme.overlay} z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200`}>
      <div className={`w-full max-w-2xl rounded-[32px] border ${theme.border} ${theme.bgApp} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        
        <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${theme.textMain}`}>
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            <p className={`text-xs ${theme.textMuted} font-medium mt-1 italic`}>
              {lead ? 'Atualize as informações do cliente' : 'Cadastre um novo cliente no seu funil'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`p-2 rounded-xl ${theme.hoverBg} ${theme.textMuted} transition-colors`}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Nome Completo *</label>
                <div className="relative">
                  <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
                  <input required type="text" placeholder="Ex: João Silva" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>WhatsApp</label>
                <div className="relative">
                  <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
                  <input type="text" placeholder="(00) 00000-0000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>E-mail</label>
                <div className="relative">
                  <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
                  <input type="email" placeholder="joao@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain}`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Valor do Imóvel (R$)</label>
                <div className="relative">
                  <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500`} size={16} />
                  <input type="number" placeholder="Ex: 500000" value={formData.value || ''} onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-black text-emerald-500`} />
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Etapa no Funil</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 px-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain} appearance-none`}>
                  <option value="novo">Novo Lead</option>
                  <option value="contatado">Contatado</option>
                  <option value="qualificado">Qualificado</option>
                  <option value="visita">Visita Agendada</option>
                  <option value="proposta">Proposta</option>
                  <option value="fechado">Fechado (Ganho)</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Origem do Lead</label>
                <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 px-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain} appearance-none`}>
                  <option value="Instagram">Instagram</option>
                  <option value="Site Público">Site Público</option>
                  <option value="WhatsApp">WhatsApp Direto</option>
                  <option value="Indicação">Indicação</option>
                  <option value="Portal Imobiliário">Portal Imobiliário</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Notas / Observações</label>
              <textarea rows={3} placeholder="Escreva informações importantes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 px-4 focus:outline-none focus:border-[#0217ff] transition-all font-medium ${theme.textMain} resize-none`} />
            </div>
          </form>
        </div>

        <div className={`p-6 border-t ${theme.border} bg-black/5 flex items-center justify-end gap-4`}>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`px-6 py-3 border ${theme.border} rounded-xl font-black text-[10px] uppercase tracking-widest ${theme.textMain} ${theme.hoverBg} transition-all`}>
            Cancelar
          </button>
          
          <button type="submit" form="lead-form" disabled={isSubmitting} className="flex items-center gap-3 px-8 py-3 bg-[#0217ff] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 disabled:hover:scale-100">
            {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
            {isSubmitting ? 'Salvando...' : 'Salvar Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}