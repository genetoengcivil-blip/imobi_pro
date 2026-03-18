import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, User, ChevronRight, CheckSquare, 
  Calendar, Trash2, X, CheckCircle2, FileSignature, 
  Download, Loader2, Paperclip, Briefcase, Info, DollarSign
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Estado Inicial do Contrato
  const initialContractState = {
    client_name: '',
    property_id: '',
    value: '',
    start_date: new Date().toISOString().split('T')[0]
  };

  const [newContract, setNewContract] = useState(initialContractState);

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, pRes] = await Promise.all([
        supabase.from('contracts').select('*, properties(title)').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('properties').select('id, title').eq('user_id', user?.id)
      ]);
      setContracts(cRes.data || []);
      setProperties(pRes.data || []);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }

  const clientsGrouped = useMemo(() => {
    const groups: any = {};
    contracts.forEach(c => {
      if (!groups[c.client_name]) groups[c.client_name] = { name: c.client_name, contracts: [] };
      groups[c.client_name].contracts.push(c);
    });
    return Object.values(groups).filter((g: any) => g.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [contracts, searchTerm]);

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContract.client_name || !newContract.property_id) return alert("Preencha todos os campos.");
    
    setLoading(true);
    const { error } = await supabase.from('contracts').insert([{
      client_name: newContract.client_name,
      property_id: newContract.property_id,
      value: parseFloat(String(newContract.value).replace(/\D/g, '')) || 0,
      start_date: newContract.start_date,
      user_id: user?.id,
      status: 'rascunho',
      checklist: [
        {"task": "RG/CPF das Partes", "done": false},
        {"task": "Matrícula do Imóvel", "done": false},
        {"task": "Certidões Negativas", "done": false},
        {"task": "Contrato assinado", "done": false}
      ]
    }]);

    if (!error) {
      setShowModal(false);
      setNewContract(initialContractState);
      loadData();
    } else { 
      alert("Erro ao salvar: " + error.message); 
    }
    setLoading(false);
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Dossiê de Clientes</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Contratos e Documentação</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setNewContract(initialContractState); }} 
          className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Novo Contrato
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input placeholder="Buscar cliente..." className={`w-full ${theme.input} pl-12 py-3.5 rounded-2xl outline-none text-sm`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
        {clientsGrouped.length === 0 && !loading && (
          <div className="text-center py-20 opacity-20"><Briefcase size={48} className="mx-auto mb-4" /><p className="font-bold uppercase text-xs">Nenhum contrato encontrado</p></div>
        )}
        
        {clientsGrouped.map((client: any) => (
          <div key={client.name} className={`${theme.card} rounded-[32px] border overflow-hidden`}>
            <div onClick={() => setSelectedClient(selectedClient === client.name ? null : client.name)} className="p-6 flex items-center justify-between cursor-pointer hover:bg-[#0217ff]/5 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0217ff]/10 text-[#0217ff] rounded-2xl flex items-center justify-center"><User size={24} /></div>
                <div>
                  <h3 className={`font-bold ${theme.text}`}>{client.name}</h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{client.contracts.length} Negociações</p>
                </div>
              </div>
              <ChevronRight className={`text-zinc-300 transition-transform ${selectedClient === client.name ? 'rotate-90' : ''}`} />
            </div>

            {selectedClient === client.name && (
              <div className="px-6 pb-6 space-y-4 border-t border-zinc-100 dark:border-white/5 pt-6 bg-zinc-50/30 dark:bg-white/5">
                {client.contracts.map((c: any) => (
                  <div key={c.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 relative group">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#0217ff] font-bold text-sm"><Briefcase size={16}/> {c.properties?.title || 'Imóvel s/ nome'}</div>
                        <button onClick={async () => { if(confirm('Apagar contrato?')) { await supabase.from('contracts').delete().eq('id', c.id); loadData(); } }} className="p-2 text-red-500/30 hover:text-red-500"><Trash2 size={16} /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-zinc-50 dark:bg-black/20 rounded-xl"><p className="text-[8px] font-bold text-zinc-400 uppercase">Valor</p><p className={`text-xs font-black ${theme.text}`}>R$ {Number(c.value).toLocaleString('pt-BR')}</p></div>
                        <div className="p-3 bg-zinc-50 dark:bg-black/20 rounded-xl"><p className="text-[8px] font-bold text-zinc-400 uppercase">Data</p><p className={`text-xs font-black ${theme.text}`}>{new Date(c.start_date).toLocaleDateString()}</p></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase text-[#0217ff]">Checklist de Documentos</p>
                      {c.checklist?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 p-2 bg-zinc-50 dark:bg-black/20 rounded-lg border border-zinc-100 dark:border-white/5">
                          {item.done ? <CheckCircle2 size={14} className="text-green-500" /> : <div className="w-3.5 h-3.5 rounded-full border border-zinc-300" />}
                          <span className={`text-[10px] font-bold ${item.done ? 'line-through text-zinc-400' : theme.text}`}>{item.task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL DE NOVO CONTRATO - CORRIGIDO E TESTADO */}
      {showModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-2xl rounded-[40px] border shadow-2xl flex flex-col animate-in zoom-in-95`}>
            
            <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center bg-inherit">
              <div className="flex items-center gap-3">
                <FileSignature className="text-[#0217ff]" size={20} />
                <h2 className={`text-lg font-bold ${theme.text}`}>Novo Fechamento</h2>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>

            <form onSubmit={handleCreateContract} className="p-8 space-y-8 overflow-y-auto no-scrollbar">
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Nome do Cliente</label>
                <input 
                  required 
                  className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-bold`} 
                  placeholder="Ex: João Silva" 
                  value={newContract.client_name} 
                  onChange={e => setNewContract({...newContract, client_name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Vincular Imóvel</label>
                  <select 
                    required 
                    className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-bold text-sm`} 
                    value={newContract.property_id} 
                    onChange={e => setNewContract({...newContract, property_id: e.target.value})}
                  >
                    <option value="">Selecione um Ativo...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Valor de Fechamento</label>
                  <div className="relative">
                    <input 
                      required 
                      className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-black text-[#0217ff]`} 
                      placeholder="R$ 0,00" 
                      value={newContract.value} 
                      onChange={e => setNewContract({...newContract, value: e.target.value})} 
                    />
                    <DollarSign className="absolute right-6 top-4 text-[#0217ff] opacity-30" size={20} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Data do Acordo</label>
                <input 
                  type="date" 
                  required
                  className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none`} 
                  value={newContract.start_date} 
                  onChange={e => setNewContract({...newContract, start_date: e.target.value})} 
                />
              </div>

              <div className="p-6 bg-[#0217ff]/5 border border-[#0217ff]/20 rounded-3xl flex items-center gap-4">
                 <div className="w-10 h-10 bg-[#0217ff] text-white rounded-xl flex items-center justify-center"><CheckSquare size={20}/></div>
                 <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">
                   Ao criar, um <span className="text-[#0217ff]">Checklist de Documentos</span> será gerado automaticamente para este cliente.
                 </p>
              </div>

              <button 
                disabled={loading} 
                className="w-full py-6 bg-[#0217ff] text-white rounded-[24px] font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-[#0217ff]/30 hover:scale-[1.01] active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Gerar Dossiê do Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}