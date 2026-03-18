import { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, FileText, DollarSign, Calendar, Trash2, X, 
  Upload, CheckCircle2, Clock, AlertCircle, ExternalLink, 
  FileCheck, Download, Filter, Loader2
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { supabase } from '../lib/supabase';

export default function ContractsPage() {
  const { user, darkMode } = useGlobal();
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    client_name: '', property_id: '', value: '', commission_percent: '6',
    status: 'rascunho', start_date: new Date().toISOString().split('T')[0],
    type: 'venda', contract_url: '', notes: ''
  });

  useEffect(() => { if (user) { loadData(); } }, [user]);

  async function loadData() {
    setLoading(true);
    const [contractsRes, propertiesRes] = await Promise.all([
      supabase.from('contracts').select('*, properties(title)').eq('user_id', user?.id).order('created_at', { ascending: false }),
      supabase.from('properties').select('id, title').eq('user_id', user?.id)
    ]);
    setContracts(contractsRes.data || []);
    setProperties(propertiesRes.data || []);
    setLoading(false);
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileName = `${user?.id}/${Date.now()}-${file.name}`;
    
    const { error } = await supabase.storage.from('contracts').upload(fileName, file);
    if (!error) {
      const { data } = supabase.storage.from('contracts').getPublicUrl(fileName);
      setFormData({ ...formData, contract_url: data.publicUrl });
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const price = parseFloat(formData.value.replace(/\D/g, '')) || 0;
    const comm = (price * (parseFloat(formData.commission_percent) / 100));

    const payload = {
      ...formData,
      user_id: user?.id,
      value: price,
      commission_value: comm,
      commission_percent: parseFloat(formData.commission_percent)
    };

    const { error } = await supabase.from('contracts').insert([payload]);
    if (!error) {
      setIsModalOpen(false);
      loadData();
    }
    setLoading(false);
  };

  const filteredContracts = useMemo(() => {
    return contracts.filter(c => 
      c.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.properties?.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contracts, searchTerm]);

  const theme = {
    card: darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200 shadow-sm',
    input: darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900',
    text: darkMode ? 'text-white' : 'text-zinc-900',
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${theme.text}`}>Gestão de <span className="text-[#0217ff]">Contratos</span></h1>
          <p className="text-sm text-zinc-500 font-medium">Controle de fechamentos e comissões pendentes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-[#0217ff] text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#0217ff]/20 flex items-center gap-2">
          <Plus size={16} /> Novo Contrato
        </button>
      </div>

      {/* STATS RÁPIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Volume em Contratos', val: contracts.reduce((acc, c) => acc + c.value, 0), icon: DollarSign, color: 'text-blue-500' },
          { label: 'Comissões Totais', val: contracts.reduce((acc, c) => acc + c.commission_value, 0), icon: FileCheck, color: 'text-green-500' },
          { label: 'Contratos Ativos', val: contracts.filter(c => c.status === 'ativo').length, icon: Clock, color: 'text-orange-500' },
        ].map((s, i) => (
          <div key={i} className={`${theme.card} p-6 rounded-3xl border flex items-center gap-4`}>
            <div className={`p-3 rounded-2xl bg-zinc-100 dark:bg-white/5 ${s.color}`}><s.icon size={24} /></div>
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{s.label}</p>
              <p className={`text-xl font-bold ${theme.text}`}>{typeof s.val === 'number' && i < 2 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.val) : s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* BUSCA */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
        <input 
          placeholder="Buscar por cliente ou imóvel..." 
          className={`${theme.input} w-full pl-12 py-3.5 rounded-2xl outline-none border transition-all focus:border-[#0217ff]/50`}
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* LISTA DE CONTRATOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredContracts.map((c) => (
          <div key={c.id} className={`${theme.card} p-6 rounded-[32px] border group transition-all hover:border-[#0217ff]/30`}>
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#0217ff]/10 text-[#0217ff] rounded-2xl flex items-center justify-center"><FileText size={24} /></div>
                <div>
                  <h3 className={`font-bold ${theme.text}`}>{c.client_name}</h3>
                  <p className="text-xs text-zinc-500 font-bold uppercase">{c.properties?.title || 'Imóvel não definido'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${
                c.status === 'ativo' ? 'bg-green-500/10 text-green-500' : 'bg-zinc-500/10 text-zinc-500'
              }`}>{c.status}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Valor Venda</p>
                <p className={`font-bold ${theme.text}`}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.value)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5">
                <p className="text-[9px] font-bold text-zinc-400 uppercase mb-1">Comissão ({c.commission_percent}%)</p>
                <p className="font-bold text-green-500">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.commission_value)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-white/5">
              <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold">
                <Calendar size={14} /> {new Date(c.start_date).toLocaleDateString('pt-BR')}
              </div>
              <div className="flex gap-2">
                {c.contract_url && <a href={c.contract_url} target="_blank" className="p-2 bg-zinc-100 dark:bg-white/5 text-zinc-500 rounded-lg hover:text-[#0217ff]"><ExternalLink size={16} /></a>}
                <button onClick={() => supabase.from('contracts').delete().eq('id', c.id).then(() => loadData())} className="p-2 text-red-500/30 hover:text-red-500"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE CADASTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`${theme.modal} w-full max-w-2xl rounded-[40px] border shadow-2xl flex flex-col max-h-[90vh]`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className={`text-lg font-bold ${theme.text}`}>Gerar Novo Contrato</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-red-500"><X size={28} /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Nome do Cliente</label>
                  <input required className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} placeholder="Nome Completo" onChange={e => setFormData({...formData, client_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Imóvel</label>
                  <select required className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} onChange={e => setFormData({...formData, property_id: e.target.value})}>
                    <option value="">Selecione...</option>
                    {properties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor do Contrato</label>
                  <input required className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none font-bold text-[#0217ff]`} placeholder="R$ 0,00" onChange={e => setFormData({...formData, value: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Comissão (%)</label>
                  <input className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} value={formData.commission_percent} onChange={e => setFormData({...formData, commission_percent: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Data Início</label>
                  <input type="date" className={`${theme.input} w-full px-5 py-3 rounded-xl outline-none`} value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Anexar Documento (PDF)</label>
                <label className={`w-full h-24 border-2 border-dashed ${theme.input} rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#0217ff] transition-all`}>
                  {uploading ? <Loader2 className="animate-spin" /> : formData.contract_url ? <CheckCircle2 className="text-green-500" /> : <Upload size={24} className="text-zinc-500" />}
                  <span className="text-[10px] font-bold uppercase mt-2 text-zinc-500">{formData.contract_url ? 'PDF Anexado' : 'Carregar Contrato Assinado'}</span>
                  <input type="file" hidden accept=".pdf" onChange={handleFileUpload} />
                </label>
              </div>

              <button disabled={loading || uploading} className="w-full py-5 bg-[#0217ff] text-white rounded-2xl font-bold uppercase text-[10px] tracking-widest shadow-xl">
                {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Confirmar Fechamento'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}