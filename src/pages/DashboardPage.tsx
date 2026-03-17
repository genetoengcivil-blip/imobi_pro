import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, TrendingUp, Clock, ArrowUpRight, 
  ArrowDownRight, ChevronDown, Plus, DollarSign, 
  Briefcase, Calendar, MessageSquare, Zap // Adicionado Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { useGlobal } from '../context/GlobalContext';

type ViewOption = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { leads, transactions, appointments, darkMode } = useGlobal();
  const [viewType, setViewType] = useState<ViewOption>('mensal');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { 
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const options: { value: ViewOption; label: string }[] = [
    { value: 'mensal', label: 'Visão Mensal' },
    { value: 'trimestral', label: 'Visão Trimestral' },
    { value: 'semestral', label: 'Visão Semestral' },
    { value: 'anual', label: 'Visão Anual' },
  ];

  const safeLeads = useMemo(() => leads || [], [leads]);
  const safeTransactions = useMemo(() => transactions || [], [transactions]);
  const safeAppointments = useMemo(() => appointments || [], [appointments]);

  // --- MÉTRICAS DE AUTOMAÇÃO (Calculadas do Contexto) ---
  const automationMetrics = useMemo(() => {
    const leadsSite = safeLeads.filter(l => l.source === 'site_publico');
    const totalAuto = leadsSite.length;
    const engajados = leadsSite.filter(l => l.status !== 'novo').length;
    const taxa = totalAuto > 0 ? Math.round((engajados / totalAuto) * 100) : 0;
    return { totalAuto, taxa };
  }, [safeLeads]);

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

    const vgvAtivo = leadsNoPeriodo.filter(l => l.status !== 'fechado' && l.status !== 'perdido').reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    const previsaoComissao = leadsNoPeriodo.filter(l => l.status !== 'fechado' && l.status !== 'perdido').reduce((acc, l) => acc + (Number(l.value) * (Number(l.commission_rate) || 0) / 100), 0);
    const receitasFin = transacoesNoPeriodo.filter(t => t.type === 'receita').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const despesasFin = transacoesNoPeriodo.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const comissoesFechadas = leadsNoPeriodo.filter(l => l.status === 'fechado').reduce((acc, l) => acc + (Number(l.value) * (Number(l.commission_rate) || 0) / 100), 0);
    const lucroLiquido = (receitasFin + comissoesFechadas) - despesasFin;

    return { vgvAtivo, previsaoComissao, lucroLiquido, totalLeads: leadsNoPeriodo.length, comissoesFechadas };
  }, [safeLeads, safeTransactions, viewType]);

  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();

    if (viewType === 'mensal') {
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
    } 
    else if (viewType === 'trimestral') {
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        const label = `${quarter}º TRI`;
        const value = safeLeads
          .filter(l => {
            const date = new Date(l.createdAt);
            const lQuarter = Math.floor(date.getMonth() / 3) + 1;
            return lQuarter === quarter && date.getFullYear() === d.getFullYear();
          })
          .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
        data.push({ name: label, vgv: value });
      }
    }
    else if (viewType === 'semestral') {
      for (let i = 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - (i * 6), 1);
        const semester = d.getMonth() < 6 ? 1 : 2;
        const label = `${semester}º SEM`;
        const value = safeLeads
          .filter(l => {
            const date = new Date(l.createdAt);
            const lSemester = date.getMonth() < 6 ? 1 : 2;
            return lSemester === semester && date.getFullYear() === d.getFullYear();
          })
          .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
        data.push({ name: label, vgv: value });
      }
    }
    else if (viewType === 'anual') {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const value = safeLeads
          .filter(l => new Date(l.createdAt).getFullYear() === year)
          .reduce((sum, l) => sum + (Number(l.value) || 0), 0);
        data.push({ name: year.toString(), vgv: value });
      }
    }
    return data;
  }, [safeLeads, viewType]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
  };

  const cardClass = `p-6 rounded-[32px] border transition-all duration-300 ${
    darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
  }`;

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans p-6">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Dashboard</h1>
          <p className="text-zinc-500 font-medium">Análise financeira integrada em tempo real.</p>
        </div>
        <button 
          onClick={() => navigate('/leads')}
          className="flex items-center gap-2 px-6 py-3 bg-[#0217ff] text-white rounded-2xl font-black hover:bg-[#0211bf] transition-all shadow-lg shadow-[#0217ff]/20"
        >
          <Plus className="w-5 h-5" /> Novo Lead
        </button>
      </div>

      {/* BLOCO DE MÉTRICAS PRINCIPAIS (ORIGINAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'VGV Ativo', val: formatCurrency(dynamicMetrics.vgvAtivo), icon: Briefcase, color: 'text-[#0217ff]', bg: 'bg-[#0217ff]/10' },
          { label: 'Previsão de Comissão', val: formatCurrency(dynamicMetrics.previsaoComissao), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-500/10' },
          { label: 'Lucro Líquido', val: formatCurrency(dynamicMetrics.lucroLiquido), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-500/10' },
          { label: 'Total de Leads', val: dynamicMetrics.totalLeads, icon: Users, color: 'text-orange-600', bg: 'bg-orange-500/10' }
        ].map((m, i) => (
          <div key={i} className={cardClass}>
            <div className={`w-12 h-12 rounded-2xl ${m.bg} ${m.color} flex items-center justify-center mb-4`}>
              <m.icon className="w-6 h-6" />
            </div>
            <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">{m.label}</div>
            <div className="text-2xl font-black truncate">{m.val}</div>
          </div>
        ))}
      </div>

      {/* NOVO BLOCO: IMPACTO DA AUTOMAÇÃO (DIFERENCIAL) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${cardClass} flex items-center gap-6 border-l-4 border-l-[#0217ff]`}>
          <div className="p-4 bg-[#0217ff]/10 rounded-3xl text-[#0217ff]">
            <Zap className="w-8 h-8" />
          </div>
          <div>
            <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Impacto IA</div>
            <div className="text-3xl font-black italic tracking-tighter">{automationMetrics.totalAuto}</div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Leads respondidos automaticamente</p>
          </div>
        </div>
        <div className={`${cardClass} flex items-center gap-6 border-l-4 border-l-green-500`}>
          <div className="p-4 bg-green-500/10 rounded-3xl text-green-500">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <div className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Engajamento</div>
            <div className="text-3xl font-black italic tracking-tighter">{automationMetrics.taxa}%</div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Taxa de resposta dos novos leads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-xl font-bold italic uppercase tracking-tighter">Volume de Negócios</h2>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Entrada de VGV (R$)</p>
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-3 px-4 py-2 text-[11px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                    darkMode 
                    ? 'bg-zinc-900 border-white/10 text-white hover:border-[#0217ff]' 
                    : 'bg-white border-zinc-200 text-zinc-900 hover:border-[#0217ff] shadow-sm'
                  }`}
                >
                  {options.find(o => o.value === viewType)?.label}
                  <ChevronDown className={`w-4 h-4 text-[#0217ff] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className={`absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl z-50 overflow-hidden border ${darkMode ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-100'}`}>
                      {options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setViewType(option.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                            viewType === option.value
                            ? 'bg-[#0217ff] text-white'
                            : darkMode ? 'text-zinc-400 hover:bg-white/5' : 'text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="w-full relative" style={{ height: '350px' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height={350} minWidth={0} minHeight={0}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0217ff" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0217ff" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#333" : "#eee"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', backgroundColor: darkMode ? '#111' : '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'VGV']}
                    />
                    <Area type="monotone" dataKey="vgv" stroke="#0217ff" strokeWidth={4} fillOpacity={1} fill="url(#colorVgv)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-3 italic px-2">
              <Users className="w-6 h-6 text-[#0217ff]" /> Últimas Capturas
            </h2>
            <div className={cardClass}>
              {safeLeads.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-white/5">
                  {safeLeads.slice(0, 4).map((lead, i) => (
                    <div key={i} className="py-4 flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-400 flex items-center justify-center font-black">
                          {lead.name?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-sm group-hover:text-[#0217ff] transition-colors">{lead.name}</div>
                          <div className="text-[10px] text-zinc-500 font-black uppercase">{lead.source} • {formatCurrency(lead.value)}</div>
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase text-zinc-400 italic">
                        {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-zinc-500 text-sm font-bold uppercase">Sem novos leads</div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-3 italic px-2">
              <Calendar className="w-6 h-6 text-[#0217ff]" /> Agenda
            </h2>
            <div className={cardClass}>
              {safeAppointments.length > 0 ? (
                <div className="space-y-4">
                  {safeAppointments.slice(0, 3).map((app, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-white/5 border border-transparent hover:border-[#0217ff]/30 transition-all">
                        <div className="font-black text-[#0217ff] text-center pr-3 border-r border-zinc-200 dark:border-white/10">
                          <div className="text-[9px] uppercase">{new Date(app.date).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}</div>
                          <div className="text-lg leading-none">{new Date(app.date).getDate()}</div>
                        </div>
                        <div>
                          <div className="font-bold text-xs truncate">{app.title}</div>
                          <div className="text-[10px] font-black text-zinc-400 mt-1 uppercase">{app.time}</div>
                        </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-zinc-400 text-[10px] font-black uppercase mb-4 tracking-widest">Nenhum compromisso</p>
                  <button onClick={() => navigate('/calendar')} className="text-[#0217ff] text-xs font-black hover:underline">+ AGENDAR</button>
                </div>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <h3 className="font-black text-xs mb-6 flex items-center gap-2 uppercase tracking-widest">
              <DollarSign className="w-4 h-4 text-green-600" /> Fluxo do Período
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase">Receitas (Financeiro)</span>
                <span className="font-black text-sm">
                  {formatCurrency(
                    safeTransactions
                      .filter(t => t.type === 'receita' && new Date(t.date || (t as any).created_at) >= new Date(new Date().setMonth(new Date().getMonth() - (viewType === 'mensal' ? 5 : 11))))
                      .reduce((acc, t) => acc + (t.amount || 0), 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-500 font-black uppercase text-green-600">Comissão Ganhos (Leads)</span>
                <span className="font-black text-green-600 text-sm">{formatCurrency(dynamicMetrics.comissoesFechadas)}</span>
              </div>
              <div className="pt-4 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-black uppercase">Lucro Líquido</span>
                <span className={`font-black text-lg ${dynamicMetrics.lucroLiquido >= 0 ? 'text-[#0217ff]' : 'text-red-500'}`}>
                  {formatCurrency(dynamicMetrics.lucroLiquido)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}