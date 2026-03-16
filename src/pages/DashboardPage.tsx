import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Target, TrendingUp, ChevronDown, Plus, DollarSign, 
  Briefcase, Calendar 
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
  
  // 🛡️ ESTADO PARA EVITAR RENDERIZAÇÃO PRECOCE
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const options: { value: ViewOption; label: string }[] = [
    { value: 'mensal', label: 'Visão Mensal' },
    { value: 'trimestral', label: 'Visão Trimestral' },
    { value: 'semestral', label: 'Visão Semestral' },
    { value: 'anual', label: 'Visão Anual' },
  ];

  const safeLeads = useMemo(() => leads || [], [leads]);
  const safeTransactions = useMemo(() => transactions || [], [transactions]);
  
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0);

  const dynamicMetrics = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    if (viewType === 'mensal') startDate.setMonth(now.getMonth() - 5);
    else if (viewType === 'trimestral' || viewType === 'semestral') startDate.setMonth(now.getMonth() - 11);
    else if (viewType === 'anual') startDate.setFullYear(now.getFullYear() - 2);
    
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const leadsNoPeriodo = safeLeads.filter(l => new Date(l.createdAt) >= startDate);
    const vgvAtivo = leadsNoPeriodo.filter(l => l.status !== 'fechado').reduce((acc, l) => acc + (Number(l.value) || 0), 0);
    const lucroLiquido = safeTransactions.filter(t => t.type === 'receita').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    return { vgvAtivo, lucroLiquido, totalLeads: leadsNoPeriodo.length };
  }, [safeLeads, safeTransactions, viewType]);

  const chartData = useMemo(() => {
    return [
      { name: 'Jan', vgv: 4000 },
      { name: 'Fev', vgv: 3000 },
      { name: 'Mar', vgv: 5000 },
      { name: 'Abr', vgv: 2780 },
    ];
  }, []);

  const cardClass = `p-6 rounded-[32px] border transition-all ${darkMode ? 'bg-zinc-950 border-white/5 text-white' : 'bg-white border-zinc-200'}`;

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-black italic uppercase">Dashboard</h1>
        <button onClick={() => navigate('/leads')} className="px-6 py-3 bg-[#0217ff] text-white rounded-2xl font-black">+ NOVO LEAD</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cardClass}>
          <div className="text-zinc-500 text-[10px] font-black uppercase mb-1">VGV Ativo</div>
          <div className="text-2xl font-black">{formatCurrency(dynamicMetrics.vgvAtivo)}</div>
        </div>
        <div className={cardClass}>
          <div className="text-zinc-500 text-[10px] font-black uppercase mb-1">Lucro Líquido</div>
          <div className="text-2xl font-black text-emerald-500">{formatCurrency(dynamicMetrics.lucroLiquido)}</div>
        </div>
        <div className={cardClass}>
          <div className="text-zinc-500 text-[10px] font-black uppercase mb-1">Total Leads</div>
          <div className="text-2xl font-black">{dynamicMetrics.totalLeads}</div>
        </div>
      </div>

      <div className={cardClass}>
        <h2 className="text-xl font-bold mb-8">Volume de Negócios</h2>
        
        {/* 🛡️ BLINDAGEM MÁXIMA AQUI */}
        <div style={{ width: '100%', height: 350, minHeight: 350, position: 'relative' }}>
          {isMounted && (
            <ResponsiveContainer width="99%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVgv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0217ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0217ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="vgv" stroke="#0217ff" fill="url(#colorVgv)" strokeWidth={4} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}