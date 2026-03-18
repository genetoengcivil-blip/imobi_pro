import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, FileText, User, ChevronRight, CheckSquare, 
  Calendar, Trash2, X, Clock, AlertCircle, CheckCircle2,
  FileSignature, Download, MoreVertical, Paperclip
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => { if (user) loadContracts(); }, [user]);

  async function loadContracts() {
    setLoading(true);
    const { data } = await supabase.from('contracts').select('*').eq('user_id', user?.id).order('created_at', { ascending: false });
    setContracts(data || []);
    setLoading(false);
  }

  // Agrupar contratos por cliente para a visão principal
  const clientsGrouped = useMemo(() => {
    const groups: any = {};
    contracts.forEach(c => {
      if (!groups[c.client_name]) {
        groups[c.client_name] = { name: c.client_name, total_value: 0, contracts: [] };
      }
      groups[c.client_name].contracts.push(c);
      groups[c.client_name].total_value += c.value || 0;
    });
    return Object.values(groups);
  }, [contracts]);

  const toggleChecklistItem = async (contractId: string, taskIdx: number) => {
    const contract = contracts.find(c => c.id === contractId);
    const newChecklist = [...contract.checklist];
    newChecklist[taskIdx].done = !newChecklist[taskIdx].done;

    const { error } = await supabase.from('contracts').update({ checklist: newChecklist }).eq('id', contractId);
    if (!error) loadContracts();
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Dossiê de Contratos</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Organização por Cliente e Documentos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-5 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest">
          Novo Contrato
        </button>
      </div>

      {/* BUSCA */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          placeholder="Buscar cliente..." 
          className={`w-full ${theme.input} pl-12 py-3.5 rounded-2xl outline-none text-sm`}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA DE CLIENTES (CRM STYLE) */}
      <div className="space-y-4">
        {clientsGrouped.map((client: any) => (
          <div key={client.name} className={`${theme.card} rounded-[32px] border overflow-hidden`}>
            <div 
              onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)}
              className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-[#0217ff]">
                  <User size={24} />
                </div>
                <div>
                  <h3 className={`font-bold ${theme.text}`}>{client.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{client.contracts.length} Contratos Gerados</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase">Volume Total</p>
                  <p className="text-sm font-black text-[#0217ff]">R$ {client.total_value.toLocaleString('pt-BR')}</p>
                </div>
                <ChevronRight className={`text-zinc-300 transition-transform ${selectedClient === client.name ? 'rotate-90' : ''}`} />
              </div>
            </div>

            {/* ÁREA EXPANSÍVEL DO CLIENTE */}
            {selectedClient === client.name && (
              <div className="px-6 pb-6 space-y-6 border-t border-zinc-100 dark:border-white/5 pt-6 animate-in slide-in-from-top-2">
                {client.contracts.map((contract: any) => (
                  <div key={contract.id} className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 rounded-[24px] bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                    
                    {/* INFO DO CONTRATO */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <FileSignature size={18} className="text-[#0217ff]" />
                          <span className={`font-bold text-sm ${theme.text}`}>{contract.property_name || 'Imóvel s/ nome'}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-[#0217ff]/10 text-[#0217ff] rounded-md">{contract.status}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-zinc-100 dark:border-white/5">
                          <p className="text-[8px] font-bold text-zinc-400 uppercase">Valor Fechado</p>
                          <p className={`text-xs font-black ${theme.text}`}>R$ {contract.value?.toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="bg-white dark:bg-black/20 p-3 rounded-xl border border-zinc-100 dark:border-white/5">
                          <p className="text-[8px] font-bold text-zinc-400 uppercase">Data Início</p>
                          <p className={`text-xs font-black ${theme.text}`}>{new Date(contract.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                         <button className="flex-1 py-3 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl text-[10px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-zinc-50">
                           <Download size={14} /> PDF
                         </button>
                         <button className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                           <Trash2 size={14} />
                         </button>
                      </div>
                    </div>

                    {/* CHECKLIST DE DOCUMENTOS */}
                    <div className="space-y-3">
                       <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black uppercase text-[#0217ff] tracking-widest">Checklist de Documentos</p>
                          <span className="text-[9px] font-bold text-zinc-400">{contract.checklist.filter((i:any) => i.done).length}/{contract.checklist.length}</span>
                       </div>
                       <div className="grid grid-cols-1 gap-2">
                          {contract.checklist.map((item: any, idx: number) => (
                            <div 
                              key={idx} 
                              onClick={() => toggleChecklistItem(contract.id, idx)}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                item.done ? 'bg-green-500/5 border-green-500/20' : 'bg-white dark:bg-black/10 border-zinc-100 dark:border-white/5'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {item.done ? <CheckCircle2 size={16} className="text-green-500" /> : <div className="w-4 h-4 rounded-full border-2 border-zinc-300" />}
                                <span className={`text-[11px] font-bold ${item.done ? 'text-green-700 dark:text-green-400 line-through' : theme.text}`}>{item.task}</span>
                              </div>
                              <Paperclip size={12} className="text-zinc-300" />
                            </div>
                          ))}
                       </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE NOVO CONTRATO (MANTIDO SIMPLES POR ENQUANTO) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
           {/* ... Lógica de Cadastro do Contrato que fizemos antes ... */}
        </div>
      )}
    </div>
  );
}