import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, TrendingUp, Clock, ArrowUpRight, 
  ArrowDownRight, ChevronDown, Plus, DollarSign, 
  Briefcase, Calendar, MessageSquare, Zap, Activity
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
    { value: 'mensal', label: 'Mensal' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' },
  ];

  // Cálculos de métricas (Mantendo suas funcionalidades originais)
  const dynamicMetrics = useMemo(() => {
    const totalLeads = leads?.length || 0;
    const leadsAtivos = leads?.filter(l => l.status !== 'fechado' && l.status !== 'perdido').length || 0;
    const leadsFechados = leads?.filter(l => l.status === 'fechado').length || 0;
    const taxaConversao = totalLeads > 0 ? (leadsFechados / totalLeads) * 100 : 0;
    
    const vgvTotal = leads
      ?.filter(l => l.status === 'fechado')
      .reduce((acc, l) => acc + (Number(l.property_value) || 0), 0);

    const comissoesFechadas = leads
      ?.filter(l => l.status === 'fechado')
      .reduce((acc, l) => acc + (Number(l.commission_value) || 0), 0);

    const totalReceitas = (transactions || [])
      .filter(t => t.type === 'receita')
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const totalDespesas = (transactions || [])
      .filter(t => t.type === 'despesa')
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    return {
      leadsAtivos,
      taxaConversao,
      vgvTotal,
      comissoesFechadas,
      lucroLiquido: totalReceitas - totalDespesas
    };
  }, [leads, transactions]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24 lg:pb-0">
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .glass-card {
          background: ${darkMode ? 'rgba(10, 10, 10, 0.4)' : 'rgba(255, 255, 255, 0.8)'};
          backdrop-filter: blur(20px);
          border: 1px border-white/5;
        }
      `}</style>

      {/* HEADER DINÂMICO */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-6xl font-[900] italic uppercase tracking-tighter leading-none">
            CENTRAL DE <br /><span className="text-[#0217ff]">PERFORMANCE</span>
          </h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mt-4 flex items-center gap-2">
            <Activity size={14} className="text-[#0217ff]" /> Dados atualizados em tempo real
          </p>
        </div>

        {/* Filtro Estilizado */}
        <div className="relative">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-6 py-4 bg-zinc-950 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-[#0217ff] transition-all w-full md:w-auto"
          >
            {options.find(o => o.value === viewType)?.label}
            <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full md:w-56 bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl">
              {options.map((opt) => (
                <button
                  key={opt.value}
                  className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#0217ff] transition-colors"
                  onClick={() => { setViewType(opt.value); setIsDropdownOpen(false); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GRID DE MÉTRICAS - TOTALMENTE RESPONSIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: 'Leads Ativos', value: dynamicMetrics.leadsAtivos, icon: Users, color: 'text-blue-500' },
          { label: 'VGV Fechado', value: formatCurrency(dynamicMetrics.vgvTotal), icon: TrendingUp, color: 'text-emerald-500' },
          { label: 'Conversão', value: `${dynamicMetrics.taxaConversao.toFixed(1)}%`, icon: Zap, color: 'text-purple-500' },
          { label: 'Lucro Líquido', value: formatCurrency(dynamicMetrics.lucroLiquido), icon: DollarSign, color: 'text-[#0217ff]' },
        ].map((m, i) => (
          <div key={i} className="glass-card p-8 rounded-[32px] border border-white/5 relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:bg-[#0217ff] transition-all`}>
              <m.icon size={20} className="group-hover:text-white transition-colors" />
            </div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">{m.label}</div>
            <div className="text-3xl font-[900] italic tracking-tighter uppercase">{m.value}</div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <m.icon size={100} />
            </div>
          </div>
        ))}
      </div>

      {/* GRÁFICO E LISTA DE ATIVIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-8 rounded-[40px] border border-white/5">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-[11px] font-[900] uppercase tracking-[0.3em] italic">Projeção de Performance</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500">
               <ArrowUpRight size={14} /> +12% este mês
            </div>
          </div>
          <div className="h-[350px] w-full">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{n: 'S1', v: 400}, {n: 'S2', v: 700}, {n: 'S3', v: 600}, {n: 'S4', v: 900}]}>
                  <defs>
                    <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0217ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0217ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? '#222' : '#eee'} />
                  <XAxis dataKey="n" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '900' }}
                  />
                  <Area type="monotone" dataKey="v" stroke="#0217ff" strokeWidth={4} fillOpacity={1} fill="url(#colorPv)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Agendamentos Rápidos (Mobile Friendly) */}
        <div className="glass-card p-8 rounded-[40px] border border-white/5">
           <div className="flex items-center justify-between mb-8">
              <h3 className="text-[11px] font-[900] uppercase tracking-[0.3em] italic">Próximas Visitas</h3>
              <Calendar size={18} className="text-zinc-600" />
           </div>
           <div className="space-y-4">
              {appointments?.slice(0, 4).map((app: any, i: number) => (
                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-zinc-900 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[8px] font-black text-[#0217ff]">DEZ</span>
                      <span className="text-xs font-black">12</span>
                   </div>
                   <div className="min-w-0">
                      <div className="text-[10px] font-black uppercase truncate">{app.title}</div>
                      <div className="text-[9px] text-zinc-500 font-bold uppercase">{app.time}</div>
                   </div>
                </div>
              ))}
              <button onClick={() => navigate('/calendar')} className="w-full py-4 mt-4 border border-dashed border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white hover:border-[#0217ff] transition-all">Ver Agenda Completa</button>
           </div>
        </div>
      </div>

      {/* BOTÃO FLUTUANTE DE AÇÃO (Apenas Mobile) */}
      <button 
        onClick={() => navigate('/leads')}
        className="lg:hidden fixed bottom-24 right-6 w-16 h-16 bg-[#0217ff] text-white rounded-full shadow-[0_10px_30px_rgba(2,23,255,0.4)] flex items-center justify-center z-50 animate-bounce"
      >
        <Plus size={32} />
      </button>

    </div>
  );
}