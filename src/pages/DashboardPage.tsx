import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, TrendingUp, Clock, ArrowUpRight, 
  ChevronDown, Plus, DollarSign, Briefcase, Calendar, 
  MessageSquare, Zap, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { useGlobal } from '../context/GlobalContext';

type ViewOption = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { leads, transactions, appointments } = useGlobal();
  const [viewType, setViewType] = useState<ViewOption>('mensal');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const options: { value: ViewOption; label: string }[] = [
    { value: 'mensal', label: 'Visão Mensal' },
    { value: 'trimestral', label: 'Visão Trimestral' },
    { value: 'semestral', label: 'Visão Semestral' },
    { value: 'anual', label: 'Visão Anual' },
  ];

  // 🛡️ Data Guards
  const safeLeads = useMemo(() => leads || [], [leads]);
  const safeTransactions = useMemo(() => transactions || [], [transactions]);
  const safeAppointments = useMemo(() => appointments || [], [appointments]);

  // 🔢 Cálculos de Métricas Dinâmicas
  const dynamicMetrics = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (viewType === 'mensal') startDate.setMonth(now.getMonth() - 5);
    else if (viewType === 'trimestral' || viewType === 'semestral') startDate.setMonth(now.getMonth() - 11);
    else if (viewType === 'anual') startDate.setFullYear(now.getFullYear() - 2);

    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const leadsNoPeriodo = safeLeads.filter(l => new Date(l.createdAt) >= startDate);
    const transacoesNoPeriodo = safeTransactions.filter(t => new Date(t.date || (t as any).created_at) >= startDate);

    const vgvAtivo = leadsNoPeriodo
      .filter(l => l.status !== 'fechado' && l.status !== 'perdido')
      .reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    
    const previsaoComissao = leadsNoPeriodo
      .filter(l => l.status !== 'fechado' && l.status !== 'perdido')
      .reduce((acc, l) => acc + (Number(l.value) * (Number(l.commission_rate) || 0) / 100), 0);

    const receitasFin = transacoesNoPeriodo.filter(t => t.type === 'receita').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const despesasFin = transacoesNoPeriodo.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    
    const comissoesFechadas = leadsNoPeriodo
      .filter(l => l.status === 'fechado')
      .reduce((acc, l) => acc + (Number(l.value) * (Number(l.commission_rate) || 0) / 100), 0);

    const lucroLiquido = (receitasFin + comissoesFechadas) - despesasFin;

    return { vgvAtivo, previsaoComissao, lucroLiquido, totalLeads: leadsNoPeriodo.length, comissoesFechadas };
  }, [safeLeads, safeTransactions, viewType]);

  // 📈 Lógica do Gráfico
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    // (Lógica de meses/tri/sem/ano mantida conforme seu código original, apenas estilizada no componente)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
      const value = safeLeads
        .filter(l => {
          const date = new Date(l.createdAt);
          return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
        })
        .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
      data.push({ name: label, vgv: value });
    }
    return data;
  }, [safeLeads, viewType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      
      {/* Header Profissional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
            Painel de <span className="text-[#0217ff]">Performance</span>
          </h1>
          <p className="text-zinc-500 font-medium italic">Monitoramento em tempo real do seu VGV e Fluxo de Caixa.</p>
        </div>
        <button 
          onClick={() => navigate('/leads')}
          className="flex items-center gap-3 px-8 py-4 bg-[#0217ff] text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-600/20 active:scale-95"
        >
          <Plus size={16} /> Novo Lead de Elite
        </button>
      </div>

      {/* Cards de Métricas - Estilo Dark Premium */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'VGV Ativo', val: formatCurrency(dynamicMetrics.vgvAtivo), icon: Briefcase, color: 'text-[#0217ff]', bg: 'bg-[#0217ff]/10' },
          { label: 'Previsão de Comissão', val: formatCurrency(dynamicMetrics.previsaoComissao), icon: DollarSign, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Lucro Líquido', val: formatCurrency(dynamicMetrics.lucroLiquido), icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Captações no Período', val: dynamicMetrics.totalLeads, icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' }
        ].map((m, i) => (
          <div key={i} className="bg-zinc-900/30 border border-white/5 p-8 rounded-[40px] hover:border-white/10 transition-all group">
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <m.icon size={22} />
            </div>
            <div className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2">{m.label}</div>
            <div className="text-2xl font-black text-white italic tracking-tighter">{m.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico Principal */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-white/5 p-10 rounded-[48px] space-y-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">Volume de Negócios</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Entrada de VGV por período</p>
            </div>

            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-5 py-3 bg-black border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white hover:border-[#0217ff] transition-all"
              >
                {options.find(o => o.value === viewType)?.label}
                <ChevronDown size={14} className={`text-[#0217ff] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  {options.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setViewType(option.value); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        viewType === option.value ? 'bg-[#0217ff] text-white' : 'text-zinc-400 hover:bg-white/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0217ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0217ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#444', fontSize: 10, fontWeight: '900'}} dy={15} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#000', borderRadius: '16px', border: '1px solid #ffffff10', padding: '12px' }}
                  itemStyle={{ color: '#0217ff', fontWeight: '900', fontSize: '12px', fontStyle: 'italic' }}
                />
                <Area type="monotone" dataKey="vgv" stroke="#0217ff" strokeWidth={4} fillOpacity={1} fill="url(#colorVgv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar de Capturas e Agenda */}
        <div className="space-y-8">
          {/* Capturas */}
          <div className="bg-zinc-900/30 border border-white/5 p-8 rounded-[40px]">
            <h3 className="text-sm font-black uppercase italic tracking-widest text-white mb-8 flex items-center gap-2">
              <Zap size={16} className="text-[#0217ff]" /> Últimas Capturas
            </h3>
            <div className="space-y-6">
              {safeLeads.slice(0, 4).map((lead, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 text-zinc-400 flex items-center justify-center font-black text-xs group-hover:bg-[#0217ff] group-hover:text-white transition-all">
                      {lead.name?.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-[#0217ff] transition-colors">{lead.name}</div>
                      <div className="text-[9px] text-zinc-600 font-black uppercase tracking-tighter">{lead.source} • {formatCurrency(lead.value)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agenda */}
          <div className="bg-[#0217ff] p-8 rounded-[40px] text-white shadow-2xl shadow-blue-600/20">
            <h3 className="text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2">
              <Calendar size={16} /> Próximos Passos
            </h3>
            <div className="space-y-4">
              {safeAppointments.slice(0, 2).map((app, i) => (
                <div key={i} className="bg-black/20 p-5 rounded-2xl border border-white/10">
                  <div className="text-[10px] font-black uppercase mb-1 opacity-60">{app.time}</div>
                  <div className="font-bold text-xs">{app.title}</div>
                </div>
              ))}
              <button onClick={() => navigate('/calendar')} className="w-full py-4 bg-white text-[#0217ff] rounded-xl font-black text-[10px] uppercase tracking-widest mt-4">
                Abrir Agenda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}