import { useState, useEffect, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useGlobal } from '../context/GlobalContext';
import { LEAD_STATUSES, LeadStatus } from '../types';
import { DollarSign, Briefcase, Phone, MessageSquare, MoreVertical } from 'lucide-react';

export default function PipelinePage() {
  const { leads, updateLead, darkMode } = useGlobal();
  
  // Estado local para garantir performance e evitar que o card "pule" de volta
  const [localColumns, setLocalColumns] = useState<any[]>([]);

  // Sincroniza e prepara as colunas
  useEffect(() => {
    if (!leads) return;

    const columns = LEAD_STATUSES.map(status => {
      const leadsInStatus = leads.filter(l => l?.status === status.value);
      
      // Cálculo de faturamento da coluna
      const vgvTotal = leadsInStatus.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
      const comissaoTotal = leadsInStatus.reduce((acc, l) => {
        const v = Number(l.value) || 0;
        const r = Number(l.commission_rate) || 0;
        return acc + (v * (r / 100));
      }, 0);

      return {
        ...status,
        leads: leadsInStatus,
        vgvTotal,
        comissaoTotal
      };
    });

    setLocalColumns(columns);
  }, [leads]);

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStatus = destination.droppableId as LeadStatus;

    // 1. Atualização Otimista (Interface atualiza antes do Banco)
    const newCols = [...localColumns];
    const sourceCol = newCols.find(c => c.value === source.droppableId);
    const destCol = newCols.find(c => c.value === destination.droppableId);
    
    if (sourceCol && destCol) {
      const leadToMove = sourceCol.leads.find((l: any) => l.id === draggableId);
      if (leadToMove) {
        // Remove da origem
        sourceCol.leads = sourceCol.leads.filter((l: any) => l.id !== draggableId);
        // Altera status
        const updatedLead = { ...leadToMove, status: newStatus };
        // Adiciona no destino
        destCol.leads.splice(destination.index, 0, updatedLead);
        
        setLocalColumns(newCols);

        // 2. Persiste no Supabase via Contexto
        try {
          await updateLead(draggableId, { status: newStatus });
        } catch (error) {
          console.error("Erro ao salvar nova etapa:", error);
        }
      }
    }
  };

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val || 0);
  };

  if (localColumns.length === 0) return null; // Evita tela branca enquanto carrega

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in font-sans">
      <div className="mb-6">
        <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Pipeline de Vendas</h1>
        <p className="text-zinc-500 font-medium">Gestão visual de leads e previsões de comissão.</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-300">
          <div className="flex gap-6 h-full min-w-max">
            {localColumns.map(col => (
              <div key={col.value} className="w-80 flex flex-col">
                
                {/* Header da Coluna (Estilo SaaS) */}
                <div className="mb-4 px-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                      <h2 className={`font-black uppercase text-[11px] tracking-wider ${darkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {col.label}
                      </h2>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/5 text-zinc-500">
                      {col.leads.length}
                    </span>
                  </div>
                  
                  {/* Card de Faturamento da Coluna */}
                  <div className={`p-3 rounded-2xl border ${darkMode ? 'bg-zinc-900/50 border-white/5' : 'bg-white border-zinc-100 shadow-sm'}`}>
                    <div className="text-[9px] font-black text-zinc-400 uppercase">Previsão de Comissão</div>
                    <div className="text-sm font-black text-[#0217ff]">{formatBRL(col.comissaoTotal)}</div>
                  </div>
                </div>

                {/* Área de Drop */}
                <Droppable droppableId={col.value}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 overflow-y-auto rounded-[32px] p-2 transition-colors ${
                        snapshot.isDraggingOver 
                          ? (darkMode ? 'bg-white/5' : 'bg-zinc-100/50') 
                          : 'bg-transparent'
                      }`}
                    >
                      {col.leads.map((lead: any, index: number) => (
                        <Draggable draggableId={lead.id} index={index} key={lead.id}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style }}
                              className={`p-5 mb-4 rounded-[24px] border transition-all ${
                                snapshot.isDragging ? 'shadow-2xl scale-105 z-50' : 'shadow-sm'
                              } ${
                                darkMode 
                                  ? 'bg-zinc-900 border-white/5 text-white' 
                                  : 'bg-white border-zinc-200 text-zinc-900'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <h3 className="font-bold text-sm leading-tight">{lead?.name || 'Sem Nome'}</h3>
                                <MoreVertical size={14} className="text-zinc-400" />
                              </div>

                              <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-tighter">
                                  <Briefcase size={12} className="text-[#0217ff]" /> VGV: {formatBRL(lead.value)}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black text-[#0217ff] uppercase tracking-tighter">
                                  <DollarSign size={12} /> Comissão ({lead.commission_rate}%): {formatBRL((lead.value * (lead.commission_rate || 0)) / 100)}
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-white/5">
                                <div className="text-[9px] font-black text-zinc-400 uppercase">{lead.source}</div>
                                <div className="flex gap-2">
                                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-400">
                                    <Phone size={10} />
                                  </div>
                                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 text-zinc-400">
                                    <MessageSquare size={10} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}