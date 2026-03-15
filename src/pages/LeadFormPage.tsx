import React, { useState } from 'react';
import { X, Save, Phone, Mail, User, DollarSign, Loader2, Percent, AlertCircle } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

export default function LeadFormPage({ lead, onClose }: { lead?: any, onClose: () => void }) {
  const { addLead, updateLead, darkMode } = useGlobal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Substitui o "alert()" nativo por mensagens bonitas dentro do formulário
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

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
    status: (lead?.status || 'novo').toLowerCase(), 
    value: lead?.value || '',
    commission: lead?.commission_rate || lead?.comissao || lead?.commission || 6,
    source: lead?.source || 'Orgânico',
    notes: lead?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setToastMessage(null);
    
    try {
      // 🛡️ Blindagem de Comissão: Enviamos a variável com os 2 nomes para garantir que o banco de dados aceita
      const dataToSave = {
        ...formData,
        value: Number(formData.value) || 0,
        commission_rate: Number(formData.commission) || 0,
        comissao: Number(formData.commission) || 0
      };
      
      // Remove o campo raw para não causar erro de schema no Supabase
      delete (dataToSave as any).commission; 

      if (lead && lead.id) {
        await updateLead(lead.id, dataToSave);
      } else {
        await addLead(dataToSave);
      }
      onClose();
    } catch (error) {
      console.error(error);
      setToastMessage({ type: 'error', text: 'Ocorreu um erro ao comunicar com o servidor. Tente novamente.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${theme.overlay} z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200`}>
      <div className={`w-full max-w-3xl rounded-[32px] border ${theme.border} ${theme.bgApp} shadow-2xl overflow-hidden flex flex-col max-h-[90vh]`}>
        
        <div className={`p-6 border-b ${theme.border} flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-black italic uppercase tracking-tighter ${theme.textMain}`}>
              {lead ? 'Editar Lead' : 'Novo Lead'}
            </h2>
            <p className={`text-xs ${theme.textMuted} font-medium mt-1 italic`}>
              {lead ? 'Atualize as informações e avance o lead no funil' : 'Cadastre um novo cliente e defina os valores'}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSubmitting} className={`p-2 rounded-xl ${theme.hoverBg} ${theme.textMuted} transition-colors`}>
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* SAAS STANDARD: MENSAGEM DE ERRO/SUCESSO INLINE */}
          {toastMessage && (
            <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-xs font-bold uppercase tracking-widest ${toastMessage.type === 'error' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              <AlertCircle size={16} /> {toastMessage.text}
            </div>
          )}

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
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>WhatsApp / E-mail</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Phone className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
                    <input type="text" placeholder="(00) 00000" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain}`} />
                  </div>
                  <div className="relative flex-1">
                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={16} />
                    <input type="email" placeholder="@email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-[#0217ff] transition-all font-bold ${theme.textMain}`} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Negociação (Valor e Comissão)</label>
                <div className="flex gap-2">
                  <div className="relative w-2/3">
                    <DollarSign className={`absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500`} size={16} />
                    <input type="number" placeholder="Valor Imóvel" value={formData.value} onChange={(e) => setFormData({ ...formData, value: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-emerald-500 transition-all font-black text-emerald-500`} />
                  </div>
                  <div className="relative w-1/3">
                    <Percent className={`absolute right-4 top-1/2 -translate-y-1/2 text-purple-500`} size={16} />
                    <input type="number" step="0.1" placeholder="6" value={formData.commission} onChange={(e) => setFormData({ ...formData, commission: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 pl-4 pr-10 focus:outline-none focus:border-purple-500 transition-all font-black text-purple-500`} />
                  </div>
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
                  <option value="fechado" className="font-black text-emerald-500">✅ Fechado (Ganho)</option>
                  <option value="perdido" className="font-black text-red-500">❌ Perdido</option>
                </select>
              </div>

            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black ${theme.textMuted} uppercase tracking-widest ml-1`}>Notas / Observações</label>
              <textarea rows={3} placeholder="Escreva informações importantes..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className={`w-full ${theme.inputBg} border ${theme.border} rounded-xl py-3 px-4 focus:outline-none focus:border-[#0217ff] transition-all font-medium ${theme.textMain} resize-none`} />
            </div>
          </form>
        </div>

        <div className={`p-6 border-t ${theme.border} bg-black/5 flex items-center justify-between`}>
          <div className={`text-xs ${theme.textMuted} italic`}>
             {lead ? `Cadastrado em: ${new Date(lead.createdAt).toLocaleDateString('pt-BR')}` : 'Será cadastrado hoje'}
          </div>
          
          <div className="flex gap-4">
            <button type="button" onClick={onClose} disabled={isSubmitting} className={`px-6 py-3 border ${theme.border} rounded-xl font-black text-[10px] uppercase tracking-widest ${theme.textMain} ${theme.hoverBg} transition-all`}>
              Cancelar
            </button>
            <button type="submit" form="lead-form" disabled={isSubmitting} className="flex items-center gap-3 px-8 py-3 bg-[#0217ff] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
              {isSubmitting ? 'Salvando...' : 'Salvar Lead'}
            </button>
          </div>