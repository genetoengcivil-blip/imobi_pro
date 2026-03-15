import { useState } from 'react';
import { 
  Plus, Search, Filter, Edit, Trash2, 
  Mail, Phone, Users, FileSpreadsheet, Calendar, Percent, AlertTriangle 
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import * as XLSX from 'xlsx';

import LeadFormPage from './LeadFormPage';

export default function LeadsListPage() {
  const { leads, deleteLead, darkMode } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Controle de Modais (Formulário e Exclusão)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<any>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);

  const theme = {
    bgCard: darkMode ? 'bg-black' : 'bg-white',
    bgHeader: darkMode ? 'bg-zinc-950/50' : 'bg-zinc-100',
    bgRowHover: darkMode ? 'hover:bg-zinc-900/30' : 'hover:bg-zinc-50',
    border: darkMode ? 'border-white/5' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-500' : 'text-zinc-500',
    inputBg: darkMode ? 'bg-black' : 'bg-white',
    btnBg: darkMode ? 'bg-zinc-900' : 'bg-white',
    badgeBg: darkMode ? 'bg-zinc-800' : 'bg-zinc-100',
  };

  const safeLeads = (leads || []).map(lead => ({
    ...lead,
    id: lead.id,
    name: lead?.name || lead?.nome || lead?.client_name || 'Lead sem nome',
    email: lead?.email || '',
    phone: lead?.phone || lead?.telefone || '',
    status: (lead?.status || 'novo').toLowerCase(),
    value: Number(lead?.value) || 0,
    commission_rate: Number(lead?.commission_rate) || Number(lead?.comissao) || Number(lead?.commission) || 6,
    createdAt: lead?.createdAt || lead?.created_at || new Date().toISOString(),
    source: lead?.source || 'Orgânico'
  }));

  const filteredLeads = safeLeads.filter(lead => {
    const term = (searchTerm || '').toLowerCase();
    const name = (lead.name || '').toLowerCase();
    const email = (lead.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const handleNewLead = () => {
    setLeadToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setLeadToEdit(lead);
    setIsModalOpen(true);
  };

  // SaaS Standard: Modal Elegante em vez de alert()
  const confirmDelete = async () => {
    if (leadToDelete) {
      await deleteLead(leadToDelete);
      setLeadToDelete(null);
    }
  };

  const exportToExcel = () => {
    try {
      const dataToExport = filteredLeads.map(lead => ({
        'Nome do Lead': lead.name,
        'E-mail': lead.email || 'Não informado',
        'Telefone': lead.phone || 'Não informado',
        'Valor (R$)': lead.value,
        'Comissão (%)': lead.commission_rate,
        'Status': lead.status.toUpperCase(),
        'Data de Cadastro': new Date(lead.createdAt).toLocaleDateString('pt-BR')
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      XLSX.writeFile(workbook, `Leads_ImobiPro_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`p-8 pb-32 animate-fade-in max-w-7xl mx-auto font-sans ${theme.textMain}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Gestão de <span className="text-[#0217ff]">Leads</span></h1>
          <p className={`${theme.textMuted} font-medium italic text-sm`}>Acompanhe e converta seus contatos em clientes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button type="button" onClick={exportToExcel} className={`flex items-center gap-3 px-6 py-3 ${theme.btnBg} ${theme.textMain} rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all border ${theme.border}`}>
            <FileSpreadsheet size={16} className="text-emerald-500" /> Exportar
          </button>
          <button type="button" onClick={handleNewLead} className="flex items-center gap-3 px-6 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className={`absolute left-6 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={18} />
          <input 
            type="text" placeholder="Buscar por nome ou e-mail..." 
            className={`w-full ${theme.inputBg} border-2 ${theme.border} rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-[#0217ff] transition-colors ${theme.textMain}`}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="button" className={`flex items-center gap-3 px-8 py-4 ${theme.btnBg} border-2 ${theme.border} ${theme.textMain} rounded-2xl text-[10px] font-black uppercase tracking-widest`}>
          <Filter size={16} /> Filtros
        </button>
      </div>

      <div className={`${theme.bgCard} border ${theme.border} rounded-[48px] overflow-hidden shadow-2xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b ${theme.border} ${theme.bgHeader}`}>
                  <th className={`px-8 py-6 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest`}>Contato</th>
                  <th className={`px-8 py-6 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest text-center`}>Valor e Comissão</th>
                  <th className={`px-8 py-6 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest text-center`}>Status e Data</th>
                  <th className={`px-8 py-6 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest text-right`}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr key={lead.id || idx} className={`border-b ${theme.border} ${theme.bgRowHover} transition-colors group`}>
                    
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#0217ff]/10 border border-[#0217ff]/20 flex items-center justify-center font-black text-[#0217ff] uppercase">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className={`font-bold ${theme.textMain} mb-1`}>{lead.name}</div>
                          <div className={`flex items-center gap-3 text-xs ${theme.textMuted} italic`}>
                            <span className="flex items-center gap-1"><Mail size={12}/> {lead.email || 'S/ E-mail'}</span>
                            <span className="flex items-center gap-1"><Phone size={12}/> {lead.phone || 'S/ Tel'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <div className={`font-black ${theme.textMain} italic`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                      </div>
                      <div className={`text-xs ${theme.textMuted} mt-1 flex items-center justify-center gap-1`}>
                        <Percent size={12} className="text-emerald-500" /> 
                        Comissão: {lead.commission_rate}%
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <span className={`inline-block px-4 py-1.5 ${theme.badgeBg} ${theme.textMuted} text-[9px] font-black uppercase rounded-lg border ${theme.border} group-hover:bg-[#0217ff]/10 group-hover:text-[#0217ff] transition-all`}>
                        {lead.status}
                      </span>
                      <div className={`text-xs ${theme.textMuted} mt-2 flex items-center justify-center gap-1 italic`}>
                        <Calendar size={12}/> {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => handleEditLead(lead)} className={`p-3 ${theme.btnBg} border ${theme.border} rounded-xl ${theme.textMuted} hover:text-[#0217ff] transition-all`}>
                          <Edit size={16} />
                        </button>
                        <button type="button" onClick={() => setLeadToDelete(lead.id)} className={`p-3 ${theme.btnBg} border ${theme.border} rounded-xl ${theme.textMuted} hover:text-red-500 transition-all`}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
          </table>

          {filteredLeads.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className={`w-16 h-16 ${theme.badgeBg} rounded-full flex items-center justify-center mx-auto ${theme.textMuted}`}>
                <Users size={32} />
              </div>
              <p className={`font-black uppercase text-xs italic ${theme.textMuted}`}>Nenhum lead encontrado.</p>
            </div>
          )}
        </div>
      </div>

      {/* RENDERIZAÇÃO DO FORMULÁRIO */}
      {isModalOpen && (
        <LeadFormPage lead={leadToEdit} onClose={() => setIsModalOpen(false)} />
      )}

      {/* MODAL PADRÃO SAAS PARA EXCLUSÃO */}
      {leadToDelete && (
        <div className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200`}>
          <div className={`w-full max-w-md ${theme.bgCard} border ${theme.border} rounded-[32px] p-8 shadow-2xl text-center`}>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${theme.textMain} mb-2`}>Excluir Lead?</h3>
            <p className={`${theme.textMuted} text-sm mb-8`}>Esta ação não pode ser desfeita. O histórico e as métricas atreladas a este cliente serão apagados permanentemente.</p>
            <div className="flex gap-4">
              <button onClick={() => setLeadToDelete(null)} className={`flex-1 py-4 border ${theme.border} rounded-xl font-black text-[10px] uppercase tracking-widest ${theme.textMain} hover:bg-zinc-500/10 transition-all`}>
                Cancelar
              </button>
              <button onClick={confirmDelete} className="flex-1 py-4 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 shadow-xl shadow-red-500/20 transition-all">
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}