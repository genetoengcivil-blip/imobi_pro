import { useState, useMemo } from 'react';
import { 
  Users, Search, Filter, MoreHorizontal, Calendar, 
  ChevronDown, UserPlus, Target, Zap, TrendingUp, X, CheckCircle2, AlertCircle, Edit, Trash2, AlertTriangle, Percent, DollarSign
} from 'lucide-react';
import { useGlobal } from '../context/GlobalContext';

export default function LeadsPage() {
  const { leads, darkMode, addLead, updateLead, deleteLead } = useGlobal(); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState<string | null>(null);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState<{show: boolean, msg: string, type: 'success' | 'error'}>({ show: false, msg: '', type: 'success' });

  const [formLead, setFormLead] = useState({
    name: '', email: '', phone: '', source: 'Manual', status: 'novo' as const, value: 0, 
    commission_rate: 6, 
    createdAt: new Date().toISOString().split('T')[0] 
  });

  const notify = (msg: string, type: 'success' | 'error') => {
    setNotification({ show: true, msg, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 4000);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);
    if (v.length > 2) v = `(${v.substring(0, 2)}) ${v.substring(2)}`;
    if (v.length > 9) v = `${v.substring(0, 10)}-${v.substring(10)}`;
    setFormLead({ ...formLead, phone: v });
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (leadToEdit) {
        await updateLead(leadToEdit, formLead);
        notify("Lead atualizado!", "success");
      } else {
        await addLead(formLead);
        notify("Lead cadastrado!", "success");
      }
      closeModal();
    } catch (error) {
      notify("Erro na operação.", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!leadToDelete) return;
    setLoading(true);
    try {
      await deleteLead(leadToDelete);
      notify("Removido.", "success");
      setIsDeleteModalOpen(false);
    } catch (error) {
      notify("Erro ao excluir.", "error");
    } finally {
      setLoading(false);
      setLeadToDelete(null);
    }
  };

  const openEditModal = (lead: any) => {
    setLeadToEdit(lead.id);
    setFormLead({
      name: lead.name, email: lead.email, phone: lead.phone, source: lead.source, 
      status: lead.status, value: lead.value, 
      commission_rate: lead.commission_rate || 6,
      createdAt: lead.createdAt ? new Date(lead.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setLeadToEdit(null);
    setFormLead({ name: '', email: '', phone: '', source: 'Manual', status: 'novo', value: 0, commission_rate: 6, createdAt: new Date().toISOString().split('T')[0] });
  };

  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0);

  const filteredLeads = useMemo(() => {
    const safeLeads = leads || [];
    return safeLeads.filter(l => {
      const name = l.name?.toLowerCase() || '';
      return name.includes(searchTerm.toLowerCase()) && (statusFilter === 'todos' || l.status === statusFilter);
    });
  }, [leads, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const l = leads || [];
    
    // Previsão: Todos que não estão perdidos nem fechados
    const previsao = l.filter(i => i.status !== 'fechado' && i.status !== 'perdido')
                     .reduce((acc, curr) => acc + (Number(curr.value) * (Number(curr.commission_rate) || 0) / 100), 0);
    
    // Ganhos: Somente o que já foi FECHADO
    const ganhosReais = l.filter(i => i.status === 'fechado')
                         .reduce((acc, curr) => acc + (Number(curr.value) * (Number(curr.commission_rate) || 0) / 100), 0);

    return {
      total: l.length,
      novos: l.filter(i => i.status === 'novo').length,
      previsao: previsao,
      ganhosReais: ganhosReais
    };
  }, [leads]);

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {notification.show && (
        <div className={`fixed top-10 right-10 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-right-10 duration-500 ${notification.type === 'success' ? 'bg-[#0217ff] text-white' : 'bg-red-600 text-white'}`}>
          <CheckCircle2 size={20}/> <span className="font-black uppercase text-[10px] tracking-widest">{notification.msg}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Gestão de Leads</h1>
          <p className="text-zinc-500 font-medium font-sans">Sua base estratégica de clientes.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-6 py-4 bg-[#0217ff] text-white rounded-2xl font-black hover:bg-[#0211bf] transition-all shadow-xl shadow-[#0217ff]/30">
          <UserPlus size={20} /> Adicionar Lead
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads', val: stats.total, icon: Users, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
          { label: 'Novos', val: stats.novos, icon: Zap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Prev. Comissão', val: formatBRL(stats.previsao), icon: Target, color: 'text-[#0217ff]', bg: 'bg-[#0217ff]/10' },
          { label: 'Comissão Ganha', val: formatBRL(stats.ganhosReais), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-500/10' },
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-3xl border ${darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-100 shadow-sm text-zinc-900'}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}><s.icon className="w-4 h-4" /></div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{s.label}</span>
            </div>
            <div className="text-xl font-black truncate">{s.val}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`w-full pl-12 pr-4 py-4 rounded-2xl border transition-all outline-none font-bold text-sm ${darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200'}`} />
        </div>
      </div>

      <div className={`rounded-[32px] border overflow-hidden ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-white/5' : 'border-zinc-100'}`}>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-zinc-400">Cliente / Data</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-zinc-400">VGV</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-zinc-400">Comissão</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase text-zinc-400 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#0217ff]/10 text-[#0217ff] flex items-center justify-center font-black uppercase">{lead.name?.charAt(0)}</div>
                      <div>
                        <div className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{lead.name}</div>
                        <div className="text-[10px] font-black text-zinc-400 flex items-center gap-1 uppercase tracking-tighter">
                          <Calendar size={10}/> {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-5 font-black text-sm ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{formatBRL(lead.value)}</td>
                  <td className="px-6 py-5">
                    <div className="text-xs font-black text-[#0217ff]">{formatBRL((lead.value * (lead.commission_rate || 0)) / 100)}</div>
                    <div className="text-[9px] font-black text-zinc-400 uppercase">{lead.commission_rate}%</div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEditModal(lead)} className="p-2 text-zinc-400 hover:text-[#0217ff] transition-all"><Edit size={16}/></button>
                      <button onClick={() => { setLeadToDelete(lead.id); setIsDeleteModalOpen(true); }} className="p-2 text-zinc-400 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal} />
          <div className={`relative w-full max-w-lg rounded-[40px] shadow-2xl p-10 ${darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-900'}`}>
            <h2 className="text-2xl font-black italic text-[#0217ff] mb-8">{leadToEdit ? 'Editar Lead' : 'Novo Lead'}</h2>
            <form onSubmit={handleSaveLead} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Data Cadastro</label>
                  <input type="date" className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold ${darkMode ? 'bg-zinc-800 border-white/5 text-white' : 'bg-zinc-50 border-zinc-200'}`} value={formLead.createdAt} onChange={e => setFormLead({...formLead, createdAt: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Nome</label>
                  <input required className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold ${darkMode ? 'bg-zinc-800 border-white/5' : 'bg-zinc-50'}`} value={formLead.name} onChange={e => setFormLead({...formLead, name: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="E-mail" className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold ${darkMode ? 'bg-zinc-800 border-white/5' : 'bg-zinc-50'}`} value={formLead.email} onChange={e => setFormLead({...formLead, email: e.target.value})} />
                <input required placeholder="WhatsApp" className={`w-full px-5 py-4 rounded-2xl border outline-none font-bold ${darkMode ? 'bg-zinc-800 border-white/5' : 'bg-zinc-50'}`} value={formLead.phone} onChange={handlePhoneChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">VGV (R$)</label>
                  <input type="number" className={`w-full px-5 py-4 rounded-2xl border outline-none font-black ${darkMode ? 'bg-zinc-800 border-white/5' : 'bg-zinc-50'}`} value={formLead.value} onChange={e => setFormLead({...formLead, value: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Comissão (%)</label>
                  <input type="number" className={`w-full px-5 py-4 rounded-2xl border outline-none font-black ${darkMode ? 'bg-zinc-800 border-white/5' : 'bg-zinc-50'}`} value={formLead.commission_rate} onChange={e => setFormLead({...formLead, commission_rate: Number(e.target.value)})} />
                </div>
              </div>

              <div className="bg-[#0217ff]/5 p-4 rounded-2xl border border-[#0217ff]/10">
                <div className="text-[9px] font-black uppercase text-zinc-400">Cálculo da Comissão</div>
                <div className="text-xl font-black text-[#0217ff]">{formatBRL((formLead.value * formLead.commission_rate) / 100)}</div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-[#0217ff] text-white rounded-2xl font-black uppercase tracking-widest">{loading ? 'Salvando...' : 'Confirmar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}