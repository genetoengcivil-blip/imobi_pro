import { useState, useMemo } from 'react';
import { Plus, Search, FileText, DollarSign, Calendar, Trash2, X } from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';
import { Contract } from '../types';

export default function ContractsPage() {
  const { contracts, addContract, deleteContract, properties, darkMode } = useGlobal();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContract, setNewApp] = useState<Omit<Contract, 'id'>>({
    clientName: '', propertyId: '', propertyName: '', value: 0, commission: 0,
    status: 'rascunho', startDate: new Date().toISOString().split('T')[0], endDate: '', type: 'venda', notes: ''
  });

  const safeContracts = contracts || [];
  const safeProperties = properties || [];

  const filteredContracts = useMemo(() => {
    return safeContracts.filter(c => 
      (c?.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c?.propertyName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [safeContracts, searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const property = safeProperties.find(p => p.id === newContract.propertyId);
    addContract({
      ...newContract,
      propertyName: property?.title || 'Imóvel não selecionado'
    });
    setIsModalOpen(false);
  };

  const cardStyles = darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 text-zinc-900';
  
  // Classe de Inputs Consistente para Visibilidade Clara/Escura
  const inputClass = "w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-blue-500 text-zinc-900 dark:text-white placeholder-zinc-400";

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Contratos</h1>
          <p className="text-zinc-500 font-medium">Gestão de documentos e fechamentos.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20">
          <Plus className="w-5 h-5" /> Novo Contrato
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Contratos', value: safeContracts.length, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Valor Total', value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(safeContracts.reduce((acc, c) => acc + (c?.value || 0), 0)), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((stat, i) => (
          <div key={i} className={`p-6 rounded-[32px] border ${cardStyles} shadow-sm`}>
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}><stat.icon className="w-6 h-6" /></div>
            <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{stat.label}</div>
            <div className="text-xl font-bold truncate">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="relative group max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
        <input type="text" placeholder="Buscar contrato..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`${inputClass} pl-12`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredContracts.map((c) => (
          <div key={c?.id || Math.random()} className={`p-6 rounded-[32px] border ${cardStyles} hover:shadow-xl transition-all group`}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400"><FileText className="w-6 h-6" /></div>
                <div>
                  <h3 className="font-bold text-lg">{c?.clientName || 'Cliente Indefinido'}</h3>
                  <p className="text-sm text-zinc-500 font-medium">{c?.propertyName || 'Imóvel não associado'}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                c?.status === 'concluido' ? 'bg-green-500/10 text-green-500' :
                c?.status === 'ativo' ? 'bg-blue-500/10 text-blue-500' :
                'bg-zinc-500/10 text-zinc-500'
              }`}>
                {c?.status || 'rascunho'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Valor</div>
                <div className="text-lg font-bold text-blue-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c?.value || 0)}</div>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-zinc-100 dark:border-white/5">
                <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Comissão</div>
                <div className="text-lg font-bold text-green-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c?.commission || 0)}</div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{c?.startDate ? new Date(c.startDate).toLocaleDateString('pt-BR') : 'Data não definida'}</span>
                </div>
              </div>
              <button onClick={() => c?.id && deleteContract(c.id)} className="p-2 hover:bg-red-500/10 rounded-xl text-zinc-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}

        {filteredContracts.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-500">
            Nenhum contrato encontrado.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[32px] border border-zinc-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 rounded-t-[32px]">
              <h2 className="text-2xl font-bold dark:text-white">Novo Contrato</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-200 dark:hover:bg-white/10 rounded-xl"><X className="w-5 h-5 text-zinc-400" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Nome do Cliente</label>
                <input required type="text" onChange={(e) => setNewApp({...newContract, clientName: e.target.value})} className={inputClass} placeholder="Nome Completo" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Imóvel Relacionado</label>
                <select required onChange={(e) => setNewApp({...newContract, propertyId: e.target.value})} className={inputClass}>
                  <option value="">Selecione um imóvel</option>
                  {safeProperties.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Valor do Contrato</label>
                  <input required type="number" onChange={(e) => setNewApp({...newContract, value: parseFloat(e.target.value)})} className={inputClass} placeholder="R$ 0,00" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Comissão (%)</label>
                  <input required type="number" onChange={(e) => setNewApp({...newContract, commission: parseFloat(e.target.value)})} className={inputClass} placeholder="Ex: 5000" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Status</label>
                  <select onChange={(e) => setNewApp({...newContract, status: e.target.value as any})} className={inputClass}>
                    <option value="rascunho">Rascunho</option>
                    <option value="ativo">Ativo</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data de Início</label>
                  <input type="date" value={newContract.startDate} onChange={(e) => setNewApp({...newContract, startDate: e.target.value})} className={inputClass} />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg transition-all">Gerar Contrato</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 