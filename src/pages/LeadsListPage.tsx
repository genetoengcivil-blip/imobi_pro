import { useState } from 'react';
import { 
  Download, Plus, Search, Filter, MoreHorizontal, 
  Mail, Phone, Calendar, Tag, Trash2, FileSpreadsheet, Users
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import * as XLSX from 'xlsx';

export default function LeadsListPage() {
  const { leads, darkMode } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');

  // 🛡️ SANITIZAÇÃO DE DADOS: Impede a tela branca se o banco enviar null
  const safeLeads = (leads || []).map(lead => ({
    ...lead,
    name: lead?.name || lead?.nome || lead?.client_name || 'Lead sem nome',
    email: lead?.email || '',
    phone: lead?.phone || lead?.telefone || '',
    status: lead?.status || 'NOVO',
    value: Number(lead?.value) || Number(lead?.valor) || 0,
    createdAt: lead?.createdAt || lead?.created_at || new Date().toISOString(),
    source: lead?.source || 'Orgânico'
  }));

  // 🛡️ FILTRO SEGURO: Evita o erro de .toLowerCase() em dados null
  const filteredLeads = safeLeads.filter(lead => {
    const term = (searchTerm || '').toLowerCase();
    const name = (lead.name || '').toLowerCase();
    const email = (lead.email || '').toLowerCase();
    const phone = (lead.phone || '').toLowerCase();
    return name.includes(term) || email.includes(term) || phone.includes(term);
  });

  // 📊 Lógica de Exportação para Excel Segura
  const exportToExcel = () => {
    try {
      const dataToExport = filteredLeads.map(lead => ({
        'Nome do Lead': lead.name,
        'E-mail': lead.email || 'Não informado',
        'Telefone': lead.phone || 'Não informado',
        'Valor do Negócio': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value),
        'Status': lead.status.toUpperCase(),
        'Origem': lead.source,
        'Data de Captação': new Date(lead.createdAt).toLocaleDateString('pt-BR')
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Leads");
      XLSX.writeFile(workbook, `Leads_ImobiPro_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error("Erro ao exportar excel:", error);
      alert("Houve um erro ao gerar o Excel. Verifique os dados dos leads.");
    }
  };

  return (
    <div className="p-8 pb-32 animate-fade-in max-w-7xl mx-auto font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-white">Gestão de <span className="text-[#0217ff]">Leads</span></h1>
          <p className="text-zinc-500 font-medium italic text-sm">Acompanhe e converta seus contactos em clientes.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button onClick={exportToExcel} className="flex items-center gap-3 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all border border-white/5">
            <FileSpreadsheet size={16} className="text-emerald-500" /> Exportar
          </button>
          <button className="flex items-center gap-3 px-6 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-all">
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      {/* SEARCH E FILTROS */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#0217ff] transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou telefone..." 
            className="w-full bg-black border-2 border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm outline-none focus:border-[#0217ff] transition-all text-white placeholder:text-zinc-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-3 px-8 py-4 bg-black border-2 border-white/5 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all">
          <Filter size={16} /> Filtros
        </button>
      </div>

      {/* TABELA DE LEADS */}
      <div className="bg-black border border-white/5 rounded-[48px] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-zinc-950/50">
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contato</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Valor Potencial</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => (
                <tr key={lead.id || idx} className="border-b border-white/5 hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#0217ff]/10 border border-[#0217ff]/20 flex items-center justify-center font-black text-[#0217ff] uppercase">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-white mb-1">{lead.name}</div>
                        <div className="flex items-center gap-3 text-xs text-zinc-500 italic">
                          <span className="flex items-center gap-1"><Mail size={12}/> {lead.email || 'S/ E-mail'}</span>
                          <span className="flex items-center gap-1"><Phone size={12}/> {lead.phone || 'S/ Tel'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-black text-white italic">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value)}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-4 py-1.5 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase rounded-lg border border-white/5 group-hover:bg-[#0217ff]/10 group-hover:text-[#0217ff] transition-all">
                      {lead.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-3 bg-zinc-900 rounded-xl text-zinc-600 hover:text-white transition-all">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredLeads.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-700">
                <Users size={32} />
              </div>
              <p className="text-zinc-500 font-black uppercase text-xs italic">Nenhum lead encontrado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}