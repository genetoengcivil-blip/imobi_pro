import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, TrendingUp, Plus, DollarSign, Briefcase, Calendar, ChevronDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useGlobal } from '../context/GlobalContext';

type ViewOption = 'mensal' | 'trimestral' | 'semestral' | 'anual';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { leads, transactions, darkMode } = useGlobal();
  const [isMounted, setIsMounted] = useState(false);
  const [viewType, setViewType] = useState<ViewOption>('mensal');

  // 🛡️ Impedir erro de medida do gráfico
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeLeads = useMemo(() => leads || [], [leads]);
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

  const metrics = useMemo(() => {
    const vgv = safeLeads.reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    return { vgv, total: safeLeads.length };
  }, [safeLeads]);

  const chartData = [
    { name: 'JAN', vgv: 400000 },
    { name: 'FEV', vgv: 300000 },
    { name: 'MAR', vgv: 500000 },
    { name: 'ABR', vgv: 450000 },
    { name: 'MAI', vgv: 600000 },
    { name: 'JUN', vgv: 550000 },
  ];

  const cardClass = `p-6 rounded-[32px] border transition-all duration-300 ${
    darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200 shadow-sm'
  }`;

  return (
    <div className="space-y-8 p-6 animate-fade-in pb-20 font-sans">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter">Dashboard</h1>
          <p className="text-zinc-500 font-medium">Sua performance imobiliária hoje.</p>
        </div>
        <button onClick={() => navigate('/leads')} className="px-6 py-3 bg-[#0217ff] text-white rounded-2xl font-black hover:scale-105 transition-all shadow-lg shadow-[#0217ff]/20">
          <Plus className="w-5 h-5 mr-1 inline" /> NOVO LEAD
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardClass}>
          <div className="w-10 h-10 rounded-xl bg-[#0217ff]/10 text-[#0217ff] flex items-center justify-center mb-4">
            <Briefcase size={20} />
          </div>
          <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">VGV Ativo</div>
          <div className="text-2xl font-black">{formatCurrency(metrics.vgv)}</div>
        </div>
        <div className={cardClass}>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
            <Users size={20} />
          </div>
          <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Total Leads</div>
          <div className="text-2xl font-black">{metrics.total}</div>
        </div>
        <div className={cardClass}>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4">
            <TrendingUp size={20} />
          </div>
          <div className="text-[10px] uppercase font-black text-zinc-500 tracking-widest">Conversão</div>
          <div className="text-2xl font-black">12.5%</div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold italic uppercase tracking-tighter">Volume de Negócios</h2>
          <div className="px-4 py-2 bg-zinc-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest">
            {viewType} <ChevronDown size={12} className="inline ml-1" />
          </div>
        </div>
        
        {/* 🛡️ CONTAINER BLINDADO PARA O GRÁFICO */}
        <div className="w-full" style={{ height: 350, minHeight: 350 }}>
          {isMounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0217ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0217ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(v: any) => [formatCurrency(v), 'VGV']}
                />
                <Area type="monotone" dataKey="vgv" stroke="#0217ff" fill="url(#colorVgv)" strokeWidth={4} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500 font-bold uppercase text-[10px]">Iniciando Gráficos...</div>
          )}
        </div>
      </div>
    </div>
  );
}