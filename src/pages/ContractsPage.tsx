import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, User, ChevronRight, CheckSquare, 
  Calendar, Trash2, X, CheckCircle2, FileSignature, 
  Download, Loader2, Briefcase, DollarSign, FileText, ArrowRight
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

// MODELOS JURÍDICOS (Exemplos rápidos que o corretor vai escolher)
const CONTRACT_MODELS = [
  { id: 'venda', name: 'Compra e Venda Residencial', icon: FileText },
  { id: 'aluguel', name: 'Locação Residencial (30 meses)', icon: FileSignature },
  { id: 'exclusividade', name: 'Autorização de Venda c/ Exclusividade', icon: CheckCircle2 },
];

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1); // 1: Selecionar Modelo, 2: Preencher Dados

  const initialContractState = {
    client_name: '',
    property_id: '',
    value: '',
    commission: '', // Adicionado para evitar o erro de NULL
    start_date: new Date().toISOString().split('T')[0],
    model_id: ''
  };

  const [newContract, setNewContract] = useState(initialContractState);

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

  const handleCreateContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('contracts').insert([{
      client_name: newContract.client_name,
      property_id: newContract.property_id,
      value: parseFloat(String(newContract.value).replace(/\D/g, '')) || 0,
      commission: parseFloat(String(newContract.commission).replace(/\D/g, '')) || 0, // Fix do erro
      start_date: newContract.start_date,
      user_id: user?.id,
      status: 'rascunho',
      checklist: [
        {"task": "Documentos de Identificação", "done": false},
        {"task": "Certidões do Imóvel", "done": false},
        {"task": "Contrato Assinado", "done": false}
      ]
    }]);

    if (!error) {
      setShowModal(false);
      setStep(1);
      setNewContract(initialContractState);
      loadData();
    } else {
      alert("Erro técnico: " + error.message);
    }
    setLoading(false);
  };

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    modal: darkMode ? 'bg-zinc-950 border-white/10' : 'bg-white border-zinc-200 shadow-2xl',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white placeholder-zinc-600' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-4 md:p-8 space-y-8 animate-fade-in pb-24">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>Contratos</h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Dossiês e Gestão Jurídica</p>
        </div>
        <button 
          onClick={() => { setShowModal(true); setStep(1); }} 
          className="px-6 py-2.5 bg-[#0217ff] text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg active:scale-95 transition-all"
        >
          Novo Contrato
        </button>
      </div>

      {/* BUSCA E LISTA POR CLIENTE (Conforme pedido anteriormente) */}
      <div className="space-y-4">
        {contracts.length === 0 && !loading && (
          <div className="text-center py-20 opacity-20"><Briefcase size={48} className="mx-auto mb-2"/><p className="text-xs font-bold uppercase">Nenhum contrato ativo</p></div>
        )}
        {/* Lógica de agrupamento por cliente simplificada para exibição */}
        {Array.from(new Set(contracts.map(c => c.client_name))).map(clientName => (
           <div key={clientName} className={`${theme.card} rounded-[32px] border overflow-hidden`}>
              <div onClick={() => setSelectedClient(selectedClient === clientName ? null : clientName)} className="p-6 flex justify-between items-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#0217ff]/10 text-[#0217ff] rounded-xl flex items-center justify-center"><User size={20}/></div>
                  <h3 className={`font-bold ${theme.text}`}>{clientName}</h3>
                </div>
                <ChevronRight className={`text-zinc-300 transition-transform ${selectedClient === clientName ? 'rotate-90' : ''}`} />
              </div>
           </div>
        ))}
      </div>

      {/* MODAL DE FLUXO (PASSO A PASSO) */}
      {showModal && (
        <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-3xl rounded-[40px] border flex flex-col animate-in zoom-in-95`}>
            
            <div className="p-8 border-b border-zinc-100 dark:border-white/5 flex justify-between items-center">
              <h2 className={`text-xl font-bold ${theme.text}`}>
                {step === 1 ? '1. Escolha o Modelo' : '2. Detalhes do Fechamento'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>

            <div className="p-8 flex-1 overflow-y-auto no-scrollbar pb-12">
              {step === 1 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CONTRACT_MODELS.map((model) => (
                    <button 
                      key={model.id}
                      onClick={() => { setNewContract({...newContract, model_id: model.id}); setStep(2); }}
                      className={`${theme.card} p-6 rounded-3xl border text-left hover:border-[#0217ff] transition-all group flex items-center gap-4`}
                    >
                      <div className="w-12 h-12 bg-[#0217ff]/5 text-[#0217ff] rounded-2xl flex items-center justify-center group-hover:bg-[#0217ff] group-hover:text-white transition-all">
                        <model.icon size={24} />
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${theme.text}`}>{model.name}</p>
                        <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest mt-1">Selecionar Modelo</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleCreateContract} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Nome do Cliente</label>
                      <input required className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none`} placeholder="Nome Completo" value={newContract.client_name} onChange={e => setNewContract({...newContract, client_name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Vincular Ativo</label>
                      <select required className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none text-sm`} value={newContract.property_id} onChange={e => setNewContract({...newContract, property_id: e.target.value})}>
                        <option value="">Selecione o Imóvel...</option>
                        {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Valor da Transação (R$)</label>
                      <input required className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-black text-[#0217ff]`} placeholder="R$ 0,00" value={newContract.value} onChange={e => setNewContract({...newContract, value: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-2">Sua Comissão (R$)</label>
                      <input required className={`${theme.input} w-full px-6 py-4 rounded-2xl outline-none font-bold text-green-600`} placeholder="R$ 0,00" value={newContract.commission} onChange={e => setNewContract({...newContract, commission: e.target.value})} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-zinc-100 dark:bg-white/5 rounded-2xl font-bold uppercase text-[10px] text-zinc-500">Voltar</button>
                    <button type="submit" disabled={loading} className="flex-[2] py-4 bg-[#0217ff] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#0217ff]/20">
                      {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Finalizar Dossiê'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}