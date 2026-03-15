import { useState } from 'react';
import { Download, Plus, Search, Filter, MoreHorizontal, Mail, Phone, Users, FileSpreadsheet } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import * as XLSX from 'xlsx';

export default function LeadsListPage() {
  const { leads, darkMode } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');

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
    name: lead?.name || lead?.nome || lead?.client_name || 'Lead sem nome',
    email: lead?.email || '',
    phone: lead?.phone || lead?.telefone || '',
    status: lead?.status || 'NOVO',
    value: Number(lead?.value) || 0,
    createdAt: lead?.createdAt || new Date().toISOString(),
    source: lead?.source || 'Orgânico'
  }));

  const filteredLeads = safeLeads.filter(lead => {
    const term = (searchTerm || '').toLowerCase();
    const name = (lead.name || '').toLowerCase();
    const email = (lead.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  const exportToExcel = () => { /* ... lógica xlsx ... */ };

  return (
    <div className={`p-8 pb-32 animate-fade-in max-w-7xl mx-auto font-sans ${theme.textMain}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2">Gestão de <span className="text-[#0217ff]">Leads</span></h1>
          <p className={`${theme.textMuted} font-medium italic text-sm`}>Acompanhe e converta seus contactos em clientes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button type="button" onClick={exportToExcel} className={`flex items-center gap-3 px-6 py-3 ${theme.btnBg} ${theme.textMain} rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-all border ${theme.border}`}>
            <FileSpreadsheet size={16} className="text-emerald-500" /> Exportar
          </button>
          
          {/* BOTÃO "NOVO LEAD" AGORA COM TYPE="BUTTON" */}
          <button type="button" onClick={() => alert('Modal de Novo Lead abrirá aqui!')} className="flex items-center gap-3 px-6 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className={`absolute left-6 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={18} />
          <input 
            type="text" placeholder="Buscar leads..." 
            className={`w-full ${theme.inputBg} border-2 ${theme.border} rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-[#0217ff] ${theme.textMain}`}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="button" className={`flex items-center gap-3 px-8 py-4 ${theme.btnBg} border-2 ${theme.border} ${theme.textMain} rounded-2xl text-[10px] font-black uppercase tracking-widest`}>
          <Filter size={16} /> Filtros
        </button>
      </div>

      <div className={`${theme.bgCard} border ${theme.border} rounded-[48px] overflow-hidden shadow-2xl`}>
        <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${theme.border} ${theme.bgHeader}`}>
                <th className={`px-8 py-6 text-[10px] font-black ${theme.textMuted} uppercase`}>Contato</th>
                <th className={`px-8 py-6 text-[10px] font-black ${theme.textMuted} uppercase text-center`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => (
                <tr key={idx} className={`border-b ${theme.border} ${theme.bgRowHover}`}>
                  <td className="px-8 py-6 font-bold">{lead.name}</td>
                  <td className="px-8 py-6 text-center">{lead.status}</td>
                </tr>
              ))}
            </tbody>
        </table>
      </div>
    </div>
  );
}