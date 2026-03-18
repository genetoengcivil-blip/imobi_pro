import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, User, ChevronRight, CheckSquare, 
  Calendar, Trash2, X, CheckCircle2, FileSignature, 
  Download, Loader2, Paperclip, Briefcase
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

  // Estado do Novo Contrato
  const [newContract, setNewContract] = useState({
    client_name: '', property_id: '', value: '', start_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => { if (user) loadData(); }, [user]);

  async function loadData() {
    setLoading(true);
    const [cRes, pRes] = await Promise.all([
      supabase.from('contracts').select('*, properties(title)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('properties').select('id, title').eq('user_id', user?.id)
    ]);
    setContracts(cRes.data || []);
    setProperties(pRes.data || []);
    setLoading(false);
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
    setLoading(true);
    const { error } = await supabase.from('contracts').insert([{
      ...newContract,
      user_id: user?.id,
      value: parseFloat(newContract.value.replace(/\D/g, '')) || 0,
      checklist: [
        {"task": "RG/CPF das Partes", "done": false},
        {"task": "Matrícula do Imóvel", "done": false},
        {"task": "Certidões Negativas", "done": false},
        {"task": "Contrato assinado", "done": false}
      ]
    }]);
    if (!error) {
      setShowModal(false);
      loadData();
    } else { alert(error.message); }
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
        <button onClick={() => setShowModal(true)} className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg">
          Novo Contrato
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input placeholder="Buscar cliente..." className={`w-full ${theme.input} pl-12 py-3.5 rounded-2xl outline-none text-sm`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      <div className="space-y-4">
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
                  <div key={c.id} className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 rounded-[24px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-[#0217ff] font-bold text-sm"><Briefcase size={16}/> {c.properties?.title || 'Imóvel s/ nome'}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-zinc-50 dark:bg-black/20 rounded-xl"><p className="text-[8px] font-bold text-zinc-400 uppercase">Valor</p><p className={`text-xs font-black ${theme.text}`}>R$ {c.value?.toLocaleString('pt-BR')}</p></div>
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

      {showModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-2xl rounded-[40px] border shadow-2xl flex flex-col`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className={`text-lg font-bold ${theme.text}`}>Novo Contrato</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>
            <form onSubmit={handleCreateContract} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Cliente</label>
                <input required className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} placeholder="Nome do Cliente" value={newContract.client_name} onChange={e => setNewContract({...newContract, client_name: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Imóvel</label>
                  <select required className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} value={newContract.property_id} onChange={e => setNewContract({...newContract, property_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Valor R$</label>
                  <input required className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} placeholder="0,00" value={newContract.value} onChange={e => setNewContract({...newContract, value: e.target.value})} />
                </div>
              </div>
              <button disabled={loading} className="w-full py-5 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-[#0217ff]/20">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Gerar Contrato'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}