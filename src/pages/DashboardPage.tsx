import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, TrendingUp, Clock, ArrowUpRight, 
  ArrowDownRight, ChevronDown, Plus, DollarSign, 
  Briefcase, Calendar, MessageSquare, Zap, 
  Wallet, PieChart, BarChart3, Activity, 
  CheckCircle2, AlertCircle, Percent, 
  Building2, HandshakeIcon, Sparkles, RefreshCw,
  TrendingDown, ArrowRight, Eye, ChevronRight,
  Star, Award, Shield, Crown, Gem, Medal
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart as RePieChart, Pie, Cell, Legend
} from 'recharts';
import { useGlobal } from '../context/GlobalContext';

type ViewOption = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { leads, transactions, appointments, darkMode } = useGlobal();
  const [viewType, setViewType] = useState<ViewOption>('mensal');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  useEffect(() => { 
    const timer = setTimeout(() => setIsMounted(true), 150);
    return () => clearTimeout(timer);
  }, []);

  // Atualizar timestamp quando dados mudam
  useEffect(() => {
    setLastUpdated(new Date());
  }, [leads, transactions, appointments]);

  const options: { value: ViewOption; label: string }[] = [
    { value: 'mensal', label: 'Visão Mensal' },
    { value: 'trimestral', label: 'Visão Trimestral' },
    { value: 'semestral', label: 'Visão Semestral' },
    { value: 'anual', label: 'Visão Anual' },
  ];

  const safeLeads = useMemo(() => leads || [], [leads]);
  const safeTransactions = useMemo(() => transactions || [], [transactions]);
  const safeAppointments = useMemo(() => appointments || [], [appointments]);

  // Métricas de Automação
  const automationStats = useMemo(() => {
    const leadsDoSite = safeLeads.filter(l => l.source === 'site_publico');
    const totalAutomacoes = leadsDoSite.length;
    const leadsAtivos = leadsDoSite.filter(l => l.status !== 'novo').length;
    const taxaEngajamento = totalAutomacoes > 0 ? Math.round((leadsAtivos / totalAutomacoes) * 100) : 0;
    const taxaConversao = safeLeads.length > 0 ? Math.round((safeLeads.filter(l => l.status === 'fechado').length / safeLeads.length) * 100) : 0;
    
    return { totalAutomacoes, taxaEngajamento, taxaConversao };
  }, [safeLeads]);

  // Métricas Financeiras Dinâmicas
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

    // Métricas de Leads
    const vgvAtivo = leadsNoPeriodo.filter(l => l.status !== 'fechado' && l.status !== 'perdido').reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    const previsaoComissao = leadsNoPeriodo.filter(l => l.status !== 'fechado' && l.status !== 'perdido').reduce((acc, l) => acc + (Number(l.value) * (Number(l.commission_rate) || 0) / 100), 0);
    const leadsNovos = leadsNoPeriodo.filter(l => l.status === 'novo').length;
    const leadsEmAndamento = leadsNoPeriodo.filter(l => l.status === 'em_andamento' || l.status === 'negociacao').length;
    const leadsFechados = leadsNoPeriodo.filter(l => l.status === 'fechado').length;
    const leadsPerdidos = leadsNoPeriodo.filter(l => l.status === 'perdido').length;
    
    // Métricas Financeiras
    const receitasFin = transacoesNoPeriodo.filter(t => t.type === 'receita').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const despesasFin = transacoesNoPeriodo.filter(t => t.type === 'despesa').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const comissoesFechadas = leadsNoPeriodo.filter(l => l.status === 'fechado').reduce((acc, l) => acc + (Number(l.value) * (Number(l.commission_rate) || 0) / 100), 0);
    const lucroLiquido = (receitasFin + comissoesFechadas) - despesasFin;
    const margemLucro = receitasFin + comissoesFechadas > 0 ? Math.round((lucroLiquido / (receitasFin + comissoesFechadas)) * 100) : 0;

    return { 
      vgvAtivo, 
      previsaoComissao, 
      lucroLiquido, 
      margemLucro,
      totalLeads: leadsNoPeriodo.length,
      leadsNovos,
      leadsEmAndamento,
      leadsFechados,
      leadsPerdidos,
      comissoesFechadas,
      receitasFin,
      despesasFin
    };
  }, [safeLeads, safeTransactions, viewType]);

  // Dados do Gráfico de VGV
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

  // Dados para gráfico de funil de leads
  const funnelData = useMemo(() => [
    { name: 'Novos', value: dynamicMetrics.leadsNovos, color: '#3b82f6' },
    { name: 'Em Andamento', value: dynamicMetrics.leadsEmAndamento, color: '#f59e0b' },
    { name: 'Fechados', value: dynamicMetrics.leadsFechados, color: '#10b981' },
    { name: 'Perdidos', value: dynamicMetrics.leadsPerdidos, color: '#ef4444' }
  ], [dynamicMetrics]);

  // Dados para gráfico de categorias de despesa
  const expenseCategories = useMemo(() => {
    const categories: { [key: string]: number } = {};
    safeTransactions
      .filter(t => t.type === 'despesa')
      .forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [safeTransactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
    return formatCurrency(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const cardClass = `p-6 rounded-[32px] border transition-all duration-300 ${
    darkMode ? 'bg-zinc-900 border-white/5 text-white' : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'
  }`;

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight size={14} className="text-green-500" />;
    if (value < 0) return <ArrowDownRight size={14} className="text-red-500" />;
    return <Activity size={14} className="text-zinc-400" />;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans p-4 md:p-6 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-[#0217ff] to-[#00c6ff] rounded-xl flex items-center justify-center">
              <Activity size={16} className="text-white" />
            </div>
            <h1 className={`text-3xl font-black italic uppercase tracking-tighter ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Dashboard</h1>
          </div>
          <p className="text-zinc-500 text-sm">Análise financeira e performance de negócios em tempo real</p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-zinc-400">
            <Clock size={10} />
            <span>Última atualização: {lastUpdated.toLocaleTimeString('pt-BR')}</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => {
              setLastUpdated(new Date());
              window.location.reload();
            }}
            className="p-3 rounded-xl border border-zinc-200 dark:border-white/10 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all"
            title="Atualizar dados"
          >
            <RefreshCw size={18} className="text-zinc-500" />
          </button>
          <button 
            onClick={() => navigate('/leads')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-2xl font-black hover:scale-105 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" /> Novo Lead
          </button>
        </div>
      </div>

      {/* KPI CARDS - 4 Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">VGV Ativo</p>
              <p className="text-2xl font-black mt-2">{formatCompactCurrency(dynamicMetrics.vgvAtivo)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Building2 size={12} className="text-[#0217ff]" />
                <span className="text-[9px] text-zinc-500">Em carteira</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#0217ff]/10">
              <Briefcase size={24} className="text-[#0217ff]" />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Previsão de Comissão</p>
              <p className="text-2xl font-black mt-2">{formatCompactCurrency(dynamicMetrics.previsaoComissao)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Target size={12} className="text-green-500" />
                <span className="text-[9px] text-green-500">Potencial de ganho</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <DollarSign size={24} className="text-green-500" />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Lucro Líquido</p>
              <p className={`text-2xl font-black mt-2 ${dynamicMetrics.lucroLiquido >= 0 ? 'text-[#0217ff]' : 'text-red-500'}`}>
                {formatCompactCurrency(dynamicMetrics.lucroLiquido)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <Percent size={12} className="text-purple-500" />
                <span className="text-[9px] text-purple-500">Margem: {dynamicMetrics.margemLucro}%</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10">
              <TrendingUp size={24} className="text-purple-500" />
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest">Total de Leads</p>
              <p className="text-2xl font-black mt-2">{formatNumber(dynamicMetrics.totalLeads)}</p>
              <div className="flex items-center gap-1 mt-2">
                <Users size={12} className="text-orange-500" />
                <span className="text-[9px] text-orange-500">{dynamicMetrics.leadsNovos} novos</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-orange-500/10">
              <Users size={24} className="text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* MÉTRICAS DE PERFORMANCE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${cardClass} border-l-4 border-l-[#0217ff]`}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#0217ff]/10">
              <Zap size={24} className="text-[#0217ff]" />
            </div>
            <div>
              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">Leads Automatizados</p>
              <p className="text-2xl font-black">{automationStats.totalAutomacoes}</p>
              <p className="text-[10px] text-zinc-500 mt-1">Atendidos pelo site</p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} border-l-4 border-l-green-500`}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10">
              <TrendingUp size={24} className="text-green-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">Taxa de Engajamento</p>
              <p className="text-2xl font-black">{automationStats.taxaEngajamento}%</p>
              <p className="text-[10px] text-zinc-500 mt-1">Resposta dos leads</p>
            </div>
          </div>
        </div>

        <div className={`${cardClass} border-l-4 border-l-amber-500`}>
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Target size={24} className="text-amber-500" />
            </div>
            <div>
              <p className="text-zinc-400 text-[9px] font-black uppercase tracking-widest">Taxa de Conversão</p>
              <p className="text-2xl font-black">{automationStats.taxaConversao}%</p>
              <p className="text-[10px] text-zinc-500 mt-1">Leads → Fechados</p>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICOS PRINCIPAIS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de VGV - Ocupa 2 colunas */}
        <div className="lg:col-span-2">
          <div className={cardClass}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <h2 className="text-lg font-bold italic uppercase tracking-tighter">Volume de Negócios</h2>
                <p className="text-[10px] text-zinc-500">Entrada de VGV (R$) por período</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                    darkMode 
                    ? 'bg-zinc-800 border-white/10 text-white hover:border-[#0217ff]' 
                    : 'bg-white border-zinc-200 text-zinc-900 hover:border-[#0217ff] shadow-sm'
                  }`}
                >
                  {options.find(o => o.value === viewType)?.label}
                  <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-xl z-50 overflow-hidden border ${darkMode ? 'bg-zinc-800 border-white/10' : 'bg-white border-zinc-100'}`}>
                      {options.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setViewType(option.value);
                            setIsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
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

            <div className="w-full relative" style={{ height: '280px' }}>
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
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
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: darkMode ? '#1f1f1f' : '#fff' }}
                      formatter={(value: number) => [formatCurrency(value), 'VGV']}
                    />
                    <Area type="monotone" dataKey="vgv" stroke="#0217ff" strokeWidth={3} fillOpacity={1} fill="url(#colorVgv)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Gráfico de Funil */}
        <div className={cardClass}>
          <h3 className="font-black text-xs mb-4 flex items-center gap-2 uppercase tracking-widest">
            <PieChart size={14} className="text-[#0217ff]" /> Funil de Leads
          </h3>
          <div className="space-y-3">
            {funnelData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-black">{item.value}</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all"
                    style={{ 
                      width: `${dynamicMetrics.totalLeads > 0 ? (item.value / dynamicMetrics.totalLeads) * 100 : 0}%`,
                      backgroundColor: item.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/10">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-zinc-500">Taxa de Conversão</span>
              <span className="font-black text-green-500">{automationStats.taxaConversao}%</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/10 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${automationStats.taxaConversao}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEGUNDA LINHA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categorias de Despesa */}
        <div className={cardClass}>
          <h3 className="font-black text-xs mb-4 flex items-center gap-2 uppercase tracking-widest">
            <BarChart3 size={14} className="text-[#0217ff]" /> Top Categorias de Despesa
          </h3>
          {expenseCategories.length > 0 ? (
            <div className="space-y-3">
              {expenseCategories.map((cat, idx) => (
                <div key={cat.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{cat.name}</span>
                    <span className="font-black">{formatCurrency(cat.value)}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all"
                      style={{ width: `${dynamicMetrics.despesasFin > 0 ? (cat.value / dynamicMetrics.despesasFin) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-zinc-500 text-sm">
              Nenhuma despesa registrada
            </div>
          )}
          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-white/10">
            <div className="flex justify-between text-[10px]">
              <span className="text-zinc-500">Total de Despesas</span>
              <span className="font-black text-red-500">{formatCurrency(dynamicMetrics.despesasFin)}</span>
            </div>
          </div>
        </div>

        {/* Fluxo Financeiro */}
        <div className={cardClass}>
          <h3 className="font-black text-xs mb-4 flex items-center gap-2 uppercase tracking-widest">
            <DollarSign size={14} className="text-[#0217ff]" /> Fluxo do Período
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-green-500/5 border border-green-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ArrowUpRight size={14} className="text-green-500" />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase">Receitas Financeiro</p>
                  <p className="font-black text-sm">{formatCurrency(dynamicMetrics.receitasFin)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-zinc-500 uppercase">Comissões Ganhas</p>
                <p className="font-black text-sm text-green-600">{formatCurrency(dynamicMetrics.comissoesFechadas)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center p-3 rounded-xl bg-red-500/5 border border-red-500/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ArrowDownRight size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase">Despesas Totais</p>
                  <p className="font-black text-sm text-red-500">{formatCurrency(dynamicMetrics.despesasFin)}</p>
                </div>
              </div>
              <div className="w-16 h-16 rounded-full flex items-center justify-center bg-purple-500/10">
                <HandshakeIcon size={20} className="text-purple-500" />
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-white/5 flex justify-between items-center">
              <span className="text-[10px] font-black uppercase">Lucro Líquido</span>
              <span className={`font-black text-lg ${dynamicMetrics.lucroLiquido >= 0 ? 'text-[#0217ff]' : 'text-red-500'}`}>
                {formatCurrency(dynamicMetrics.lucroLiquido)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ÚLTIMOS LEADS E AGENDA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Últimos Leads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0217ff]" /> Últimos Leads
            </h2>
            <button onClick={() => navigate('/leads')} className="text-[10px] font-black text-[#0217ff] flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </button>
          </div>
          <div className={cardClass}>
            {safeLeads.length > 0 ? (
              <div className="divide-y divide-zinc-100 dark:divide-white/5">
                {safeLeads.slice(0, 5).map((lead, i) => (
                  <div key={i} className="py-3 flex items-center justify-between group hover:bg-zinc-50 dark:hover:bg-white/5 -mx-2 px-2 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-400 flex items-center justify-center font-black text-sm">
                        {lead.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-sm group-hover:text-[#0217ff] transition-colors line-clamp-1">{lead.name}</div>
                        <div className="flex items-center gap-2 text-[9px] text-zinc-500">
                          <span className="uppercase">{lead.source || 'Manual'}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-300" />
                          <span className="font-black">{formatCurrency(lead.value)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] font-medium text-zinc-400">
                      {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-500 text-sm">Nenhum lead cadastrado</div>
            )}
          </div>
        </div>

        {/* Próximos Compromissos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0217ff]" /> Próximos Compromissos
            </h2>
            <button onClick={() => navigate('/calendar')} className="text-[10px] font-black text-[#0217ff] flex items-center gap-1">
              Ver agenda <ArrowRight size={12} />
            </button>
          </div>
          <div className={cardClass}>
            {safeAppointments.length > 0 ? (
              <div className="space-y-3">
                {safeAppointments.slice(0, 5).map((app, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-all">
                    <div className="text-center min-w-[50px]">
                      <div className="text-[9px] font-black text-[#0217ff] uppercase">
                        {new Date(app.date).toLocaleString('pt-BR', { month: 'short' }).toUpperCase()}
                      </div>
                      <div className="text-lg font-black leading-none">
                        {new Date(app.date).getDate()}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm line-clamp-1">{app.title}</div>
                      <div className="text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <Clock size={10} />
                        <span>{app.time}</span>
                        {app.clientName && (
                          <>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span>{app.clientName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-400" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-zinc-400 text-sm mb-3">Nenhum compromisso agendado</p>
                <button onClick={() => navigate('/calendar')} className="px-4 py-2 bg-[#0217ff] text-white rounded-xl text-[10px] font-black uppercase">
                  + Agendar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}