import { useState, useMemo } from 'react';
import { 
  Plus, Search, Filter, Edit, Trash2, 
  Mail, Phone, Users, FileSpreadsheet, Calendar, Percent, AlertTriangle,
  ChevronDown, ChevronUp, Star, Award, TrendingUp, Clock,
  CheckCircle2, XCircle, MessageCircle, ExternalLink,
  Download, Printer, Eye, MoreVertical, UserCheck,
  BarChart3, PieChart, DollarSign, Building2,
  Copy, Share2, Link, Settings, Zap, Shield
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import * as XLSX from 'xlsx';
import LeadFormPage from './LeadFormPage';

type SortField = 'name' | 'value' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';
type StatusFilter = 'todos' | 'novo' | 'em_andamento' | 'negociacao' | 'fechado' | 'perdido';

export default function LeadsListPage() {
  const { leads, deleteLead, darkMode } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todos');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Controle de Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<any>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  const theme = {
    bgCard: darkMode ? 'bg-zinc-900' : 'bg-white',
    bgHeader: darkMode ? 'bg-zinc-800/50' : 'bg-zinc-50',
    bgRowHover: darkMode ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50',
    border: darkMode ? 'border-white/10' : 'border-zinc-200',
    textMain: darkMode ? 'text-white' : 'text-zinc-900',
    textMuted: darkMode ? 'text-zinc-400' : 'text-zinc-500',
    inputBg: darkMode ? 'bg-zinc-800' : 'bg-white',
    btnBg: darkMode ? 'bg-zinc-800' : 'bg-white',
    badgeBg: darkMode ? 'bg-zinc-800' : 'bg-zinc-100',
  };

  const safeLeads = useMemo(() => {
    return (leads || []).map(lead => ({
      ...lead,
      id: lead.id,
      name: lead?.name || lead?.nome || lead?.client_name || 'Lead sem nome',
      email: lead?.email || '',
      phone: lead?.phone || lead?.telefone || '',
      status: (lead?.status || 'novo').toLowerCase(),
      value: Number(lead?.value) || 0,
      commission_rate: Number(lead?.commission_rate) || Number(lead?.comissao) || Number(lead?.commission) || 6,
      createdAt: lead?.createdAt || lead?.created_at || new Date().toISOString(),
      source: lead?.source || 'Orgânico',
      lastContact: lead?.lastContact || lead?.updated_at || lead?.created_at
    }));
  }, [leads]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = safeLeads.length;
    const totalValue = safeLeads.reduce((sum, l) => sum + l.value, 0);
    const avgValue = total > 0 ? totalValue / total : 0;
    const totalCommission = safeLeads.reduce((sum, l) => sum + (l.value * l.commission_rate / 100), 0);
    const byStatus = {
      novo: safeLeads.filter(l => l.status === 'novo').length,
      em_andamento: safeLeads.filter(l => l.status === 'em_andamento').length,
      negociacao: safeLeads.filter(l => l.status === 'negociacao').length,
      fechado: safeLeads.filter(l => l.status === 'fechado').length,
      perdido: safeLeads.filter(l => l.status === 'perdido').length
    };
    const conversionRate = total > 0 ? (byStatus.fechado / total) * 100 : 0;
    
    return { total, totalValue, avgValue, totalCommission, byStatus, conversionRate };
  }, [safeLeads]);

  // Filtragem e ordenação
  const filteredLeads = useMemo(() => {
    let filtered = [...safeLeads];
    
    // Filtro por status
    if (statusFilter !== 'todos') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }
    
    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l => 
        l.name.toLowerCase().includes(term) || 
        l.email.toLowerCase().includes(term) ||
        l.phone?.toLowerCase().includes(term)
      );
    }
    
    // Ordenação
    filtered.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'value') {
        aVal = a.value;
        bVal = b.value;
      } else if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortField === 'status') {
        aVal = a.status;
        bVal = b.status;
      } else {
        aVal = a.name;
        bVal = b.name;
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [safeLeads, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(l => l.id));
    }
  };

  const handleSelectLead = (id: string) => {
    setSelectedLeads(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (confirm(`Excluir ${selectedLeads.length} leads selecionados?`)) {
      for (const id of selectedLeads) {
        await deleteLead(id);
      }
      setSelectedLeads([]);
      setShowBulkActions(false);
    }
  };

  const handleNewLead = () => {
    setLeadToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setLeadToEdit(lead);
    setIsModalOpen(true);
  };

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
        'Comissão (R$)': (lead.value * lead.commission_rate / 100).toFixed(2),
        'Status': lead.status.toUpperCase(),
        'Origem': lead.source,
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

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string, icon: any, color: string, bg: string }> = {
      novo: { label: 'Novo', icon: Star, color: 'text-blue-500', bg: 'bg-blue-500/10' },
      em_andamento: { label: 'Em Andamento', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
      negociacao: { label: 'Negociação', icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
      fechado: { label: 'Fechado', icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
      perdido: { label: 'Perdido', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' }
    };
    return configs[status] || configs.novo;
  };

  // 🔥 FUNÇÃO CORRIGIDA - sem maximumFractionDigits problemático
  const formatCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      }).format(value);
    } catch (e) {
      console.error('Erro ao formatar moeda:', e);
      return `R$ ${value.toFixed(2).replace('.', ',')}`;
    }
  };

  // 🔥 FUNÇÃO CORRIGIDA - sem maximumFractionDigits problemático
  const formatCompactCurrency = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0';
    }
    try {
      if (value >= 1000000) {
        return `R$ ${(value / 1000000).toFixed(1)}M`;
      }
      if (value >= 1000) {
        return `R$ ${(value / 1000).toFixed(0)}K`;
      }
      return formatCurrency(value);
    } catch (e) {
      console.error('Erro ao formatar moeda compacta:', e);
      return `R$ ${Math.round(value).toLocaleString('pt-BR')}`;
    }
  };

  const formatNumber = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0';
    }
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const formatPercent = (value: number) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0%';
    }
    return `${Math.round(value)}%`;
  };

  return (
    <div className={`p-4 md:p-8 pb-32 animate-fade-in max-w-7xl mx-auto font-sans ${theme.textMain}`}>
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0217ff] to-[#00c6ff] rounded-xl flex items-center justify-center">
              <Users size={16} className="text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
              Gestão de <span className="text-[#0217ff]">Leads</span>
            </h1>
          </div>
          <p className={`${theme.textMuted} text-sm`}>
            Acompanhe e converta seus contatos em clientes • {stats.total} leads no total
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowStatsModal(true)}
            className={`flex items-center gap-2 px-4 py-2.5 ${theme.btnBg} border ${theme.border} rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#0217ff] hover:text-white transition-all`}
          >
            <BarChart3 size={14} /> Estatísticas
          </button>
          <button 
            onClick={exportToExcel} 
            className={`flex items-center gap-2 px-4 py-2.5 ${theme.btnBg} border ${theme.border} rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all`}
          >
            <FileSpreadsheet size={14} /> Exportar
          </button>
          <button 
            onClick={handleNewLead} 
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            <Plus size={14} /> Novo Lead
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <p className={`text-[9px] font-black uppercase ${theme.textMuted}`}>Total</p>
          <p className="text-2xl font-black">{formatNumber(stats.total)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <p className={`text-[9px] font-black uppercase ${theme.textMuted}`}>VGV Total</p>
          <p className="text-lg font-black truncate">{formatCompactCurrency(stats.totalValue)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <p className={`text-[9px] font-black uppercase ${theme.textMuted}`}>Ticket Médio</p>
          <p className="text-lg font-black truncate">{formatCompactCurrency(stats.avgValue)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <p className={`text-[9px] font-black uppercase ${theme.textMuted}`}>Comissão Potencial</p>
          <p className="text-lg font-black truncate text-green-500">{formatCompactCurrency(stats.totalCommission)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <p className={`text-[9px] font-black uppercase ${theme.textMuted}`}>Conversão</p>
          <p className="text-2xl font-black">{formatPercent(stats.conversionRate)}</p>
        </div>
        <div className={`p-4 rounded-2xl border ${theme.border} ${theme.bgCard}`}>
          <p className={`text-[9px] font-black uppercase ${theme.textMuted}`}>Fechados</p>
          <p className="text-2xl font-black text-green-500">{formatNumber(stats.byStatus.fechado)}</p>
        </div>
      </div>

      {/* FILTROS E BUSCA */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, e-mail ou telefone..." 
            className={`w-full ${theme.inputBg} border ${theme.border} rounded-2xl py-4 pl-12 pr-5 text-sm outline-none focus:border-[#0217ff] transition-colors ${theme.textMain}`}
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-4 ${theme.btnBg} border ${theme.border} rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all`}
        >
          <Filter size={14} /> 
          Filtros
          {statusFilter !== 'todos' && <span className="w-2 h-2 rounded-full bg-[#0217ff]" />}
        </button>
      </div>

      {/* FILTROS EXPANDIDOS */}
      {showFilters && (
        <div className={`mb-6 p-5 rounded-2xl border ${theme.border} ${theme.bgCard} animate-fade-in`}>
          <div className="flex flex-wrap gap-3">
            <span className={`text-[9px] font-black uppercase ${theme.textMuted} self-center`}>Status:</span>
            {(['todos', 'novo', 'em_andamento', 'negociacao', 'fechado', 'perdido'] as StatusFilter[]).map(status => {
              const config = getStatusConfig(status);
              const isActive = statusFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-1.5
                    ${isActive 
                      ? `bg-[#0217ff] text-white` 
                      : `${theme.badgeBg} ${theme.textMuted} hover:bg-[#0217ff]/10`}
                  `}
                >
                  {status !== 'todos' && <config.icon size={10} />}
                  {status === 'todos' ? 'Todos' : config.label}
                  {status !== 'todos' && (
                    <span className={`text-[8px] ${isActive ? 'text-white/80' : theme.textMuted}`}>
                      ({formatNumber(stats.byStatus[status as keyof typeof stats.byStatus] || 0)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BULK ACTIONS BAR */}
      {selectedLeads.length > 0 && (
        <div className={`mb-4 p-4 rounded-2xl bg-[#0217ff]/10 border border-[#0217ff]/20 flex items-center justify-between animate-slide-down`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0217ff] flex items-center justify-center">
              <Users size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold">{selectedLeads.length} leads selecionados</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
            >
              <Trash2 size={12} /> Excluir
            </button>
            <button 
              onClick={() => setSelectedLeads([])}
              className="px-4 py-2 border border-zinc-300 rounded-xl text-[10px] font-black uppercase"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* TABELA DE LEADS */}
      <div className={`${theme.bgCard} border ${theme.border} rounded-[32px] overflow-hidden shadow-xl`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b ${theme.border} ${theme.bgHeader}`}>
                <th className="px-6 py-5 w-10">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-zinc-300 accent-[#0217ff]"
                  />
                </th>
                <th 
                  className={`px-6 py-5 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest cursor-pointer hover:text-[#0217ff] transition-colors`}
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    Contato
                    {sortField === 'name' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th 
                  className={`px-6 py-5 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest text-center cursor-pointer hover:text-[#0217ff] transition-colors`}
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Valor / Comissão
                    {sortField === 'value' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th 
                  className={`px-6 py-5 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest text-center cursor-pointer hover:text-[#0217ff] transition-colors`}
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-1">
                    Status / Data
                    {sortField === 'status' && (sortOrder === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </div>
                </th>
                <th className="px-6 py-5 text-[10px] font-black ${theme.textMuted} uppercase tracking-widest text-right">Ações</th>
               </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead, idx) => {
                const statusConfig = getStatusConfig(lead.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr key={lead.id || idx} className={`border-b ${theme.border} ${theme.bgRowHover} transition-colors group`}>
                    <td className="px-6 py-5">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={() => handleSelectLead(lead.id)}
                        className="w-4 h-4 rounded border-zinc-300 accent-[#0217ff]"
                      />
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0217ff]/10 to-[#00c6ff]/10 border border-[#0217ff]/20 flex items-center justify-center font-black text-[#0217ff] text-lg uppercase">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <div className={`font-bold ${theme.textMain} mb-1 group-hover:text-[#0217ff] transition-colors`}>
                            {lead.name}
                          </div>
                          <div className={`flex flex-wrap items-center gap-3 text-xs ${theme.textMuted}`}>
                            <span className="flex items-center gap-1"><Mail size={12}/> {lead.email || 'S/ E-mail'}</span>
                            <span className="flex items-center gap-1"><Phone size={12}/> {lead.phone || 'S/ Tel'}</span>
                          </div>
                          <div className={`text-[9px] ${theme.textMuted} mt-1 flex items-center gap-1`}>
                            <Building2 size={10} />
                            {lead.source}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <div className={`font-black ${theme.textMain}`}>
                        {formatCurrency(lead.value)}
                      </div>
                      <div className={`text-xs ${theme.textMuted} mt-1 flex items-center justify-center gap-1`}>
                        <Percent size={12} className="text-emerald-500" /> 
                        Comissão: {lead.commission_rate}% 
                        <span className="text-emerald-500">({formatCurrency(lead.value * lead.commission_rate / 100)})</span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${statusConfig.bg} ${statusConfig.color} text-[9px] font-black uppercase rounded-full border ${theme.border}`}>
                        <StatusIcon size={10} />
                        {statusConfig.label}
                      </span>
                      <div className={`text-xs ${theme.textMuted} mt-2 flex items-center justify-center gap-1`}>
                        <Calendar size={10}/> {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEditLead(lead)} 
                          className={`p-2.5 ${theme.btnBg} border ${theme.border} rounded-xl ${theme.textMuted} hover:text-[#0217ff] transition-all`}
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => setLeadToDelete(lead.id)} 
                          className={`p-2.5 ${theme.btnBg} border ${theme.border} rounded-xl ${theme.textMuted} hover:text-red-500 transition-all`}
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                        {lead.phone && (
                          <a 
                            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-2.5 ${theme.btnBg} border ${theme.border} rounded-xl text-green-500 hover:bg-green-500 hover:text-white transition-all`}
                            title="WhatsApp"
                          >
                            <MessageCircle size={14} />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredLeads.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className={`w-20 h-20 ${theme.badgeBg} rounded-full flex items-center justify-center mx-auto`}>
                <Users size={40} className={theme.textMuted} />
              </div>
              <p className={`font-black uppercase text-sm ${theme.textMuted}`}>
                {searchTerm ? 'Nenhum lead encontrado para esta busca' : 'Nenhum lead cadastrado'}
              </p>
              <button 
                onClick={handleNewLead}
                className="px-6 py-3 bg-[#0217ff] text-white rounded-xl text-[10px] font-black uppercase inline-flex items-center gap-2"
              >
                <Plus size={14} /> Adicionar primeiro lead
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ESTATÍSTICAS */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-2xl ${theme.bgCard} border ${theme.border} rounded-[40px] p-8 shadow-2xl`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0217ff]/10 flex items-center justify-center">
                  <BarChart3 size={20} className="text-[#0217ff]" />
                </div>
                <h2 className="text-2xl font-black">Estatísticas de Leads</h2>
              </div>
              <button onClick={() => setShowStatsModal(false)} className="p-2 hover:bg-zinc-100 rounded-xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-2xl border ${theme.border} bg-gradient-to-br from-[#0217ff]/5 to-transparent`}>
                <p className="text-[10px] font-black uppercase text-zinc-400">VGV Total</p>
                <p className="text-3xl font-black">{formatCompactCurrency(stats.totalValue)}</p>
                <p className="text-sm text-zinc-500 mt-2">em {formatNumber(stats.total)} leads</p>
              </div>
              <div className={`p-6 rounded-2xl border ${theme.border} bg-gradient-to-br from-emerald-500/5 to-transparent`}>
                <p className="text-[10px] font-black uppercase text-zinc-400">Comissão Potencial</p>
                <p className="text-3xl font-black text-green-500">{formatCompactCurrency(stats.totalCommission)}</p>
                <p className="text-sm text-zinc-500 mt-2">média de {formatCompactCurrency(stats.total > 0 ? stats.totalCommission / stats.total : 0)} por lead</p>
              </div>
            </div>

            <h3 className="font-bold mb-4">Distribuição por Status</h3>
            <div className="space-y-3">
              {Object.entries(stats.byStatus).map(([status, count]) => {
                const config = getStatusConfig(status);
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <config.icon size={12} className={config.color} />
                        <span>{config.label}</span>
                      </div>
                      <span className="font-bold">{formatNumber(count)} ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: config.color.replace('text-', '').replace('500', '500') }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-white/10">
              <div className="flex justify-between">
                <span className="text-sm text-zinc-500">Taxa de Conversão</span>
                <span className="font-bold text-lg text-green-500">{formatPercent(stats.conversionRate)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {leadToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[130] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-md ${theme.bgCard} border ${theme.border} rounded-[32px] p-8 shadow-2xl text-center`}>
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="text-red-500" size={32} />
            </div>
            <h3 className={`text-2xl font-black italic uppercase tracking-tighter ${theme.textMain} mb-2`}>Excluir Lead?</h3>
            <p className={`${theme.textMuted} text-sm mb-8`}>
              Esta ação não pode ser desfeita. O histórico e as métricas atreladas a este cliente serão apagados permanentemente.
            </p>
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

      {/* FORMULÁRIO */}
      {isModalOpen && (
        <LeadFormPage lead={leadToEdit} onClose={() => setIsModalOpen(false)} />
      )}

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}