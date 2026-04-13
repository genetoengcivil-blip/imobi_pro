import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useGlobal } from '../context/GlobalContext';
import { LEAD_STATUSES, LeadStatus } from '../types';
import { 
  DollarSign, Briefcase, Phone, MessageSquare, MoreVertical, 
  TrendingUp, Calendar, User, Mail, Star, Award,
  Clock, CheckCircle2, XCircle, AlertCircle, Eye,
  Plus, Filter, Search, ChevronDown, ChevronUp,
  BarChart3, PieChart, Percent, Target, Zap, Shield
} from 'lucide-react';

export default function PipelinePage() {
  const { leads, updateLead, darkMode } = useGlobal();
  const [localColumns, setLocalColumns] = useState<any[]>([]);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState<string[]>([]);

  // Sincroniza e prepara as colunas (Estrutura original)
  useEffect(() => {
    if (!leads) return;

    const columns = LEAD_STATUSES.map(status => {
      let leadsInStatus = leads.filter(l => l?.status === status.value);
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        leadsInStatus = leadsInStatus.filter(l => 
          l.name?.toLowerCase().includes(term) ||
          l.email?.toLowerCase().includes(term) ||
          l.phone?.toLowerCase().includes(term)
        );
      }
      
      const vgvTotal = leadsInStatus.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
      const comissaoTotal = leadsInStatus.reduce((acc, l) => {
        const v = Number(l.value) || 0;
        const r = Number(l.commission_rate) || 0;
        return acc + (v * (r / 100));
      }, 0);
      
      const tempoMedio = leadsInStatus.length > 0 
        ? leadsInStatus.reduce((acc, l) => {
            const createdAt = new Date(l.createdAt || (l as any).created_at || new Date());
            const now = new Date();
            const days = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
            return acc + (days > 0 ? days : 0);
          }, 0) / leadsInStatus.length
        : 0;

      return {
        ...status,
        leads: leadsInStatus,
        vgvTotal,
        comissaoTotal,
        tempoMedio
      };
    });

    setLocalColumns(columns);
  }, [leads, searchTerm]);

  // FUNÇÃO DE ARRASTE CORRIGIDA (Mantendo lógica otimista)
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const newStatus = destination.droppableId as LeadStatus;

    // Atualização Otimista das colunas locais
    const newCols = [...localColumns];
    const sourceCol = newCols.find(c => c.value === source.droppableId);
    const destCol = newCols.find(c => c.value === destination.droppableId);
    
    if (sourceCol && destCol) {
      const movedLead = sourceCol.leads[source.index];
      if (movedLead) {
        sourceCol.leads.splice(source.index, 1);
        destCol.leads.splice(destination.index, 0, { ...movedLead, status: newStatus });
        
        // Recalcular métricas básicas para evitar pulo visual
        sourceCol.vgvTotal = sourceCol.leads.reduce((acc: number, l: any) => acc + (Number(l.value) || 0), 0);
        destCol.vgvTotal = destCol.leads.reduce((acc: number, l: any) => acc + (Number(l.value) || 0), 0);
        
        setLocalColumns(newCols);

        // Persiste no Supabase através do Contexto
        try {
          await updateLead(draggableId, { status: newStatus });
        } catch (error) {
          console.error("Erro ao salvar:", error);
        }
      }
    }
  };

  const toggleColumnExpand = (columnValue: string) => {
    setExpandedColumns(prev => prev.includes(columnValue) ? prev.filter(v => v !== columnValue) : [...prev, columnValue]);
  };

  const formatBRL = (val: number) => {
    if (!val || isNaN(val)) return 'R$ 0';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  const formatCompactBRL = (val: number) => {
    if (!val || isNaN(val)) return 'R$ 0';
    if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}K`;
    return formatBRL(val);
  };

  const totalMetrics = useMemo(() => {
    const totalVGV = localColumns.reduce((acc, col) => acc + col.vgvTotal, 0);
    const totalComissao = localColumns.reduce((acc, col) => acc + col.comissaoTotal, 0);
    const totalLeads = localColumns.reduce((acc, col) => acc + col.leads.length, 0);
    const leadsFechados = localColumns.find(c => c.value === 'fechado')?.leads.length || 0;
    const taxaConversao = totalLeads > 0 ? (leadsFechados / totalLeads) * 100 : 0;
    return { totalVGV, totalComissao, totalLeads, leadsFechados, taxaConversao };
  }, [localColumns]);

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setShowLeadModal(true);
  };

  if (localColumns.length === 0) return null;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in font-sans p-4 md:p-6">
      {/* HEADER ORIGINAL */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0217ff] to-[#00c6ff] rounded-xl flex items-center justify-center">
              <Target size={16} className="text-white" />
            </div>
            <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Pipeline de Vendas</h1>
          </div>
          <p className="text-zinc-500 font-medium text-sm">Gestão visual de leads e previsões de comissão • {totalMetrics.totalLeads} leads ativos</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input type="text" placeholder="Buscar leads..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-10 pr-4 py-2.5 rounded-xl text-sm ${darkMode ? 'bg-zinc-800 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border w-64`} />
          </div>
          <button onClick={() => setShowStats(!showStats)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${showStats ? 'bg-[#0217ff] text-white border-[#0217ff]' : (darkMode ? 'bg-zinc-800 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900')}`}><BarChart3 size={14} /> Estatísticas</button>
        </div>
      </div>

      {showStats && (
        <div className={`mb-6 p-5 rounded-2xl border ${darkMode ? 'bg-zinc-800/50 border-white/10' : 'bg-white border-zinc-200 shadow-sm'} animate-fade-in`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-[9px] font-black uppercase text-zinc-400">VGV Total</p><p className="text-xl font-black">{formatCompactBRL(totalMetrics.totalVGV)}</p></div>
            <div><p className="text-[9px] font-black uppercase text-zinc-400">Comissão Potencial</p><p className="text-xl font-black text-green-500">{formatCompactBRL(totalMetrics.totalComissao)}</p></div>
            <div><p className="text-[9px] font-black uppercase text-zinc-400">Leads Ativos</p><p className="text-xl font-black">{totalMetrics.totalLeads}</p></div>
            <div><p className="text-[9px] font-black uppercase text-zinc-400">Taxa de Conversão</p><p className="text-xl font-black text-blue-500">{Math.round(totalMetrics.taxaConversao)}%</p></div>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin">
          <div className="flex gap-6 h-full min-w-max">
            {localColumns.map(col => {
              const isExpanded = expandedColumns.includes(col.value);
              const displayedLeads = isExpanded ? col.leads : col.leads.slice(0, 5);
              const hasMore = col.leads.length > 5;
              
              return (
                <div key={col.value} className="w-80 flex flex-col">
                  {/* HEADER DA COLUNA ORIGINAL */}
                  <div className="mb-4 px-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${col.color}`} />
                        <h2 className={`font-black uppercase text-[11px] tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>{col.label}</h2>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/10 text-zinc-500">{col.leads.length}</span>
                        {col.tempoMedio > 0 && <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 flex items-center gap-1"><Clock size={8} /> {Math.round(col.tempoMedio)}d</span>}
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-xl border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-1"><span className="text-[8px] font-black text-zinc-400 uppercase">VGV</span><span className="text-[8px] font-black text-zinc-400 uppercase">Comissão</span></div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-black text-[#0217ff]">{formatCompactBRL(col.vgvTotal)}</div>
                        <div className="text-sm font-black text-green-500">{formatCompactBRL(col.comissaoTotal)}</div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-white/5">
                        <div className="flex justify-between text-[8px] text-zinc-400"><span>Ticket médio</span><span>{formatCompactBRL(col.vgvTotal / (col.leads.length || 1))}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* ÁREA DE DROP ORIGINAL */}
                  <Droppable droppableId={col.value}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-1 overflow-y-auto rounded-[24px] p-2 transition-all ${snapshot.isDraggingOver ? (darkMode ? 'bg-white/5' : 'bg-zinc-100/50') : 'bg-transparent'}`}>
                        {displayedLeads.map((lead: any, index: number) => (
                          <Draggable draggableId={lead.id} index={index} key={lead.id}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`group mb-4 rounded-2xl border transition-all cursor-pointer ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] z-50 ring-2 ring-[#0217ff]' : 'shadow-sm hover:shadow-md'} ${darkMode ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'}`} onClick={() => handleViewLead(lead)}>
                                <div className="p-4">
                                  <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0217ff]/10 to-[#00c6ff]/10 flex items-center justify-center text-[#0217ff] font-black text-sm">{lead.name?.charAt(0)?.toUpperCase()}</div>
                                      <div><h3 className="font-bold text-sm leading-tight line-clamp-1">{lead.name}</h3>{lead.email && <p className="text-[9px] text-zinc-400 flex items-center gap-1 mt-0.5"><Mail size={8} /> {lead.email}</p>}</div>
                                    </div>
                                    <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-100 dark:hover:bg-white/10"><Eye size={12} className="text-zinc-400" /></button>
                                  </div>
                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><Briefcase size={10} className="text-[#0217ff]" /><span className="text-[9px] font-black text-zinc-400 uppercase">VGV</span></div><span className="text-xs font-black">{formatBRL(lead.value)}</span></div>
                                    <div className="flex items-center justify-between"><div className="flex items-center gap-1.5"><DollarSign size={10} className="text-green-500" /><span className="text-[9px] font-black text-zinc-400 uppercase">Comissão</span></div><span className="text-xs font-black text-green-500">{formatBRL((lead.value * (lead.commission_rate || 6)) / 100)}</span></div>
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
                                    <div className="flex items-center gap-1"><Calendar size={8} className="text-zinc-400" /><span className="text-[8px] font-black text-zinc-400 uppercase">{new Date(lead.createdAt || lead.created_at).toLocaleDateString('pt-BR')}</span></div>
                                    <div className="flex gap-1">
                                      {lead.phone && <div className="p-1 rounded-lg bg-zinc-100 dark:bg-white/5 text-green-500"><MessageSquare size={10} /></div>}
                                      <div className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5"><span className="text-[7px] font-black uppercase text-zinc-500">{lead.source || 'Lead'}</span></div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        {hasMore && !isExpanded && <button onClick={() => toggleColumnExpand(col.value)} className="w-full mt-2 py-2 text-center text-[9px] font-black uppercase text-[#0217ff] hover:bg-[#0217ff]/10 rounded-xl transition-all">+ ver mais {col.leads.length - 5} leads</button>}
                        {isExpanded && hasMore && <button onClick={() => toggleColumnExpand(col.value)} className="w-full mt-2 py-2 text-center text-[9px] font-black uppercase text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-xl transition-all">mostrar menos</button>}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>

      {/* MODAL ORIGINAL RESTAURADO */}
      {showLeadModal && selectedLead && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className={`w-full max-w-lg ${darkMode ? 'bg-zinc-900' : 'bg-white'} border border-white/10 rounded-[32px] shadow-2xl relative overflow-hidden`}>
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#0217ff]/10 flex items-center justify-center text-[#0217ff] font-black text-2xl">{selectedLead.name?.charAt(0)?.toUpperCase()}</div>
                  <div><h2 className="text-2xl font-black">{selectedLead.name}</h2><p className="text-zinc-500">{selectedLead.email}</p></div>
                </div>
                <button onClick={() => setShowLeadModal(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl"><XCircle size={24} className="text-zinc-400"/></button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/5"><span className="text-[9px] font-black uppercase text-zinc-400">VGV</span><p className="text-2xl font-black text-[#0217ff]">{formatBRL(selectedLead.value)}</p></div>
                <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-white/5"><span className="text-[9px] font-black uppercase text-zinc-400">Comissão</span><p className="text-2xl font-black text-green-500">{formatBRL((selectedLead.value * (selectedLead.commission_rate || 6)) / 100)}</p></div>
              </div>
              <div className="flex gap-4">
                <a href={`https://wa.me/${selectedLead.phone?.replace(/\D/g, '')}`} target="_blank" className="flex-1 py-4 bg-green-500 text-white rounded-2xl font-black text-center uppercase">WhatsApp</a>
                <button onClick={() => setShowLeadModal(false)} className="flex-1 py-4 bg-zinc-100 dark:bg-white/10 rounded-2xl font-black uppercase">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 10px; }
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}