import { useState } from 'react';
import { 
  Download, Plus, Search, Filter, MoreHorizontal, 
  Mail, Phone, Calendar, Tag, Trash2, FileSpreadsheet 
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import * as XLSX from 'xlsx';

export default function LeadsListPage() {
  const { leads, darkMode } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');

  // 🛡️ Safe Guard para os dados
  const safeLeads = leads || [];

  // 📊 Lógica de Exportação para Excel
  const exportToExcel = () => {
    // 1. Prepara os dados para o formato de planilha
    const dataToExport = safeLeads.map(lead => ({
      'Nome do Lead': lead.name,
      'E-mail': lead.email || 'Não informado',
      'Telefone': lead.phone || 'Não informado',
      'Valor do Negócio': new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value || 0),
      'Status': lead.status?.toUpperCase() || 'NOVO',
      'Origem': lead.source || 'Site Público',
      'Data de Captação': new Date(lead.createdAt).toLocaleDateString('pt-BR')
    }));

    // 2. Cria a planilha e o livro (Workbook)
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leads ImobiPro");

    // 3. Gera o download do arquivo
    XLSX.writeFile(workbook, `leads_imobipro_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`);
  };

  const filteredLeads = safeLeads.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header com Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            Gestão de <span className="text-[#0217ff]">Leads</span>
          </h1>
          <p className="text-zinc-500 font-medium italic">Sua base de dados possui {safeLeads.length} contatos qualificados.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* BOTÃO EXPORTAR */}
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-3 px-6 py-4 bg-zinc-900 border border-white/5 text-zinc-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white hover:border-white/20 transition-all"
          >
            <FileSpreadsheet size={16} className="text-emerald-500" /> Exportar Planilha
          </button>
          
          <button className="flex items-center gap-3 px-8 py-4 bg-[#0217ff] text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-600/20">
            <Plus size={16} /> Novo Lead
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-600" size={18} />
          <input 
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="w-full bg-zinc-900/30 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-[#0217ff] transition-all font-bold placeholder-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-3 bg-zinc-900/50 border border-white/5 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest">
          <Filter size={16} /> Filtros Avançados
        </button>
      </div>

      {/* Lista de Leads */}
      <div className="bg-zinc-900/30 border border-white/5 rounded-[48px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                <th className="px-8 py-6">Lead / Contato</th>
                <th className="px-8 py-6 text-center">Valor Estimado</th>
                <th className="px-8 py-6 text-center">Status</th>
                <th className="px-8 py-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLeads.map((lead, i) => (
                <tr key={i} className="group hover:bg-white/[0.02] transition-all">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center font-black text-[#0217ff] border border-white/5 group-hover:border-[#0217ff]/50 transition-all">
                        {lead.name?.charAt(0)}
                      </div>
                      <div>
                        <div className="text-white font-bold group-hover:text-[#0217ff] transition-colors">{lead.name}</div>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-tighter flex items-center gap-2">
                          <Mail size={10} /> {lead.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center font-black text-white italic">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value || 0)}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-4 py-1.5 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase rounded-lg border border-white/5 group-hover:bg-[#0217ff]/10 group-hover:text-[#0217ff] transition-all">
                      {lead.status || 'NOVO'}
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