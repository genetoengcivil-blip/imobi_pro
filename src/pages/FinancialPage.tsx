import React, { useState, useMemo } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Trash2, 
  Wallet, 
  TrendingUp,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Printer,
  X,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  PiggyBank,
  CreditCard,
  Receipt,
  Landmark,
  ShoppingBag,
  Car,
  Home,
  Coffee,
  FileText,
  Edit3,
  Search,
  ChevronDown
} from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'receita' | 'despesa';
  category: string;
  date: string;
  status: 'pendente' | 'pago';
  notes?: string;
}

type ChartViewOption = 'mensal' | 'trimestral' | 'semestral' | 'anual';

const FinancialPage: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, darkMode } = useGlobal();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [chartView, setChartView] = useState<ChartViewOption>('mensal');
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);
  
  const [form, setForm] = useState({
    description: '',
    amount: '',
    type: 'receita' as 'receita' | 'despesa',
    category: 'Comissão',
    date: new Date().toISOString().split('T')[0],
    status: 'pago' as 'pendente' | 'pago',
    notes: ''
  });

  // Categorias disponíveis
  const categories = {
    receita: ['Comissão', 'Honorários', 'Consultoria', 'Aluguel', 'Outros'],
    despesa: ['Marketing', 'Transporte', 'Material', 'Escritório', 'Assinaturas', 'Alimentação', 'Combustível', 'Impostos', 'Outros']
  };

  // Opções do gráfico
  const chartOptions: { value: ChartViewOption; label: string }[] = [
    { value: 'mensal', label: 'Visão Mensal' },
    { value: 'trimestral', label: 'Visão Trimestral' },
    { value: 'semestral', label: 'Visão Semestral' },
    { value: 'anual', label: 'Visão Anual' },
  ];

  // Filtra transações (apenas para a lista)
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    if (selectedFilter !== 'todos') {
      filtered = filtered.filter(t => t.type === selectedFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedFilter, searchTerm]);

  // Estatísticas (usando todas as transações, sem filtro de período)
  const allReceitas = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const allDespesas = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const allSaldo = allReceitas - allDespesas;
  const allPendentes = transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0);
  const allMargem = allReceitas > 0 ? Math.round(((allReceitas - allDespesas) / allReceitas) * 100) : 0;

  // Estatísticas filtradas para os cards principais
  const inc = filteredTransactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const exp = filteredTransactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const bal = inc - exp;
  const pend = transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0);
  const margin = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;

  // Dados para gráfico dinâmico baseado na visualização selecionada
  const chartData = useMemo(() => {
    console.log('🔍 Gerando dados do gráfico - viewType:', chartView);
    console.log('📊 Total de transações:', transactions.length);
    console.log('📋 Transações:', transactions.map(t => ({ desc: t.description, valor: t.amount, tipo: t.type, data: t.date })));
    
    const data = [];
    const now = new Date();

    if (chartView === 'mensal') {
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = d.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
        const m = d.getMonth();
        const y = d.getFullYear();
        
        console.log(`📅 Processando mês: ${label} (${m}/${y})`);
        
        const income = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === m && td.getFullYear() === y && t.type === 'receita';
        }).reduce((s, t) => s + t.amount, 0);
        
        const expense = transactions.filter(t => {
          const td = new Date(t.date);
          return td.getMonth() === m && td.getFullYear() === y && t.type === 'despesa';
        }).reduce((s, t) => s + t.amount, 0);
        
        console.log(`  Resultado: Receita R$ ${income}, Despesa R$ ${expense}`);
        data.push({ label, income, expense });
      }
    } 
    else if (chartView === 'trimestral') {
      // Últimos 4 trimestres
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
        const quarter = Math.floor(d.getMonth() / 3) + 1;
        const label = `${quarter}º TRI ${d.getFullYear()}`;
        const startMonth = d.getMonth();
        const endMonth = startMonth + 2;
        
        console.log(`📅 Processando trimestre: ${label} (meses ${startMonth} a ${endMonth})`);
        
        let income = 0;
        let expense = 0;
        
        for (let month = startMonth; month <= endMonth; month++) {
          const monthIncome = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === month && td.getFullYear() === d.getFullYear() && t.type === 'receita';
          }).reduce((s, t) => s + t.amount, 0);
          
          const monthExpense = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === month && td.getFullYear() === d.getFullYear() && t.type === 'despesa';
          }).reduce((s, t) => s + t.amount, 0);
          
          income += monthIncome;
          expense += monthExpense;
        }
        
        console.log(`  Resultado: Receita R$ ${income}, Despesa R$ ${expense}`);
        data.push({ label, income, expense });
      }
    }
    else if (chartView === 'semestral') {
      // Últimos 2 semestres
      for (let i = 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - (i * 6), 1);
        const semester = d.getMonth() < 6 ? 1 : 2;
        const label = `${semester}º SEM ${d.getFullYear()}`;
        const startMonth = semester === 1 ? 0 : 6;
        const endMonth = semester === 1 ? 5 : 11;
        
        console.log(`📅 Processando semestre: ${label} (meses ${startMonth} a ${endMonth})`);
        
        let income = 0;
        let expense = 0;
        
        for (let month = startMonth; month <= endMonth; month++) {
          const monthIncome = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === month && td.getFullYear() === d.getFullYear() && t.type === 'receita';
          }).reduce((s, t) => s + t.amount, 0);
          
          const monthExpense = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === month && td.getFullYear() === d.getFullYear() && t.type === 'despesa';
          }).reduce((s, t) => s + t.amount, 0);
          
          income += monthIncome;
          expense += monthExpense;
        }
        
        console.log(`  Resultado: Receita R$ ${income}, Despesa R$ ${expense}`);
        data.push({ label, income, expense });
      }
    }
    else if (chartView === 'anual') {
      // Últimos 3 anos
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const label = year.toString();
        
        console.log(`📅 Processando ano: ${year}`);
        
        let income = 0;
        let expense = 0;
        
        for (let month = 0; month <= 11; month++) {
          const monthIncome = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === month && td.getFullYear() === year && t.type === 'receita';
          }).reduce((s, t) => s + t.amount, 0);
          
          const monthExpense = transactions.filter(t => {
            const td = new Date(t.date);
            return td.getMonth() === month && td.getFullYear() === year && t.type === 'despesa';
          }).reduce((s, t) => s + t.amount, 0);
          
          income += monthIncome;
          expense += monthExpense;
        }
        
        console.log(`  Resultado: Receita R$ ${income}, Despesa R$ ${expense}`);
        data.push({ label, income, expense });
      }
    }
    
    console.log('📈 Dados finais do gráfico:', data);
    return data;
  }, [transactions, chartView]);

  const maxValue = Math.max(...chartData.map(d => Math.max(d.income, d.expense)), 1);
  console.log('📊 Valor máximo para escala:', maxValue);

  // Dados para gráfico de categorias
  const categoryData = useMemo(() => {
    const data: { [key: string]: number } = {};
    transactions.forEach(t => {
      if (t.type === 'despesa') {
        if (data[t.category]) {
          data[t.category] += t.amount;
        } else {
          data[t.category] = t.amount;
        }
      }
    });
    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [transactions]);

  const totalExpenses = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!form.description.trim()) {
      setErrorMessage('Descrição é obrigatória');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    const amount = Number(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMessage('Informe um valor válido maior que zero');
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }
    
    setIsSubmitting(true);
    
    const newTransaction = {
      description: form.description.trim(),
      amount: amount,
      type: form.type,
      category: form.category,
      date: form.date,
      status: form.status,
      notes: form.notes || ''
    };
    
    try {
      if (editingTransaction) {
        await deleteTransaction(editingTransaction.id);
        await addTransaction(newTransaction);
        setSuccessMessage('Transação atualizada com sucesso!');
      } else {
        await addTransaction(newTransaction);
        setSuccessMessage('Transação registrada com sucesso!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
      
      setShowForm(false);
      setEditingTransaction(null);
      setForm({
        description: '',
        amount: '',
        type: 'receita',
        category: 'Comissão',
        date: new Date().toISOString().split('T')[0],
        status: 'pago',
        notes: ''
      });
      setErrorMessage('');
      
    } catch (error) {
      console.error('Erro ao adicionar transação:', error);
      setErrorMessage('Erro ao registrar transação. Tente novamente.');
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tx: Transaction) => {
    setEditingTransaction(tx);
    setForm({
      description: tx.description,
      amount: tx.amount.toString(),
      type: tx.type,
      category: tx.category,
      date: tx.date,
      status: tx.status,
      notes: tx.notes || ''
    });
    setShowForm(true);
    setShowDetailsModal(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) {
      await deleteTransaction(id);
      setShowDetailsModal(false);
    }
  };

  const handleViewDetails = (tx: Transaction) => {
    setSelectedTransaction(tx);
    setShowDetailsModal(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: any } = {
      'Comissão': DollarSign,
      'Marketing': TrendingUp,
      'Transporte': Car,
      'Material': ShoppingBag,
      'Escritório': Home,
      'Assinaturas': CreditCard,
      'Alimentação': Coffee,
      'Combustível': Car,
      'Impostos': Landmark,
      'Honorários': FileText,
      'Consultoria': PiggyBank,
      'Aluguel': Home,
      'Outros': Receipt
    };
    return icons[category] || Receipt;
  };

  const getStatusColor = (status: string) => {
    return status === 'pago' ? 'text-green-500 bg-green-500/10' : 'text-yellow-500 bg-yellow-500/10';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Financeiro</h1>
          <p className="text-zinc-500 font-medium mt-1">Gerencie suas receitas e despesas</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar transações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-11 pr-4 py-3 rounded-xl text-sm ${
                darkMode ? 'bg-zinc-800 border-white/10 text-white placeholder-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400'
              } w-64`}
            />
          </div>
          <button 
            onClick={() => {
              setEditingTransaction(null);
              setForm({
                description: '',
                amount: '',
                type: 'receita',
                category: 'Comissão',
                date: new Date().toISOString().split('T')[0],
                status: 'pago',
                notes: ''
              });
              setShowForm(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-2xl font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* FILTROS - REMOVIDO O SELETOR DE PERÍODO */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedFilter('todos')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all
            ${selectedFilter === 'todos' 
              ? 'bg-[#0217ff] text-white' 
              : darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          Todos
        </button>
        <button
          onClick={() => setSelectedFilter('receita')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
            ${selectedFilter === 'receita' 
              ? 'bg-green-500 text-white' 
              : darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          <ArrowUpRight size={12} /> Receitas
        </button>
        <button
          onClick={() => setSelectedFilter('despesa')}
          className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase whitespace-nowrap transition-all flex items-center gap-2
            ${selectedFilter === 'despesa' 
              ? 'bg-red-500 text-white' 
              : darkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-white text-zinc-900 hover:bg-zinc-50 border border-zinc-200'}`}
        >
          <ArrowDownRight size={12} /> Despesas
        </button>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-[32px] p-6 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Saldo Total</p>
              <h3 className={`text-3xl font-black mt-2 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                {formatCurrency(allSaldo)}
              </h3>
              {allPendentes !== 0 && (
                <p className="text-[10px] text-zinc-500 mt-2">
                  Pendente: {formatCurrency(allPendentes)}
                </p>
              )}
            </div>
            <div className="p-3 rounded-xl bg-zinc-100 dark:bg-white/5">
              <Wallet size={24} className="text-zinc-400" />
            </div>
          </div>
        </div>

        <div className={`rounded-[32px] p-6 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Receitas</p>
              <h3 className="text-3xl font-black text-green-500 mt-2">
                {formatCurrency(allReceitas)}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-green-500/10">
              <ArrowUpRight size={24} className="text-green-500" />
            </div>
          </div>
        </div>

        <div className={`rounded-[32px] p-6 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Despesas</p>
              <h3 className="text-3xl font-black text-red-500 mt-2">
                {formatCurrency(allDespesas)}
              </h3>
            </div>
            <div className="p-3 rounded-xl bg-red-500/10">
              <ArrowDownRight size={24} className="text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* MARGEM DE LUCRO */}
      <div className={`rounded-[32px] p-6 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-500/10">
            <TrendingUp size={24} className="text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Margem de Lucro</p>
            <p className={`text-2xl font-black mt-1 ${darkMode ? 'text-white' : 'text-zinc-900'}`}>{allMargem}%</p>
          </div>
          <div className="w-32 h-2 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
              style={{ width: `${Math.min(Math.max(allMargem, 0), 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução Mensal com Filtros */}
        <div className={`rounded-[32px] p-6 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#0217ff]/10">
                <BarChart3 size={18} className="text-[#0217ff]" />
              </div>
              <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Evolução Financeira</h3>
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                  darkMode 
                    ? 'bg-zinc-800 border-white/10 text-white hover:border-[#0217ff]' 
                    : 'bg-white border-zinc-200 text-zinc-900 hover:border-[#0217ff] shadow-sm'
                }`}
              >
                {chartOptions.find(o => o.value === chartView)?.label}
                <ChevronDown className={`w-3 h-3 transition-transform ${isChartDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isChartDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsChartDropdownOpen(false)} />
                  <div className={`absolute right-0 mt-2 w-40 rounded-xl shadow-xl z-50 overflow-hidden border ${darkMode ? 'bg-zinc-800 border-white/10' : 'bg-white border-zinc-100'}`}>
                    {chartOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setChartView(option.value);
                          setIsChartDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-colors ${
                          chartView === option.value
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
          
          <div className="flex items-end gap-3 h-[200px]">
            {chartData.length > 0 && chartData.some(d => d.income > 0 || d.expense > 0) ? (
              chartData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="flex gap-1 items-end w-full justify-center">
                    <div 
                      className="w-3 bg-green-500/30 rounded-t-lg transition-all hover:bg-green-500/50"
                      style={{ height: `${Math.max((item.income / maxValue) * 100, 4)}%` }}
                      title={`Receitas: ${formatCurrency(item.income)}`}
                    />
                    <div 
                      className="w-3 bg-red-500/30 rounded-t-lg transition-all hover:bg-red-500/50"
                      style={{ height: `${Math.max((item.expense / maxValue) * 100, 4)}%` }}
                      title={`Despesas: ${formatCurrency(item.expense)}`}
                    />
                  </div>
                  <span className="text-[9px] font-bold text-zinc-500 text-center">{item.label}</span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-zinc-500 text-sm">Nenhum dado disponível. Adicione transações para visualizar o gráfico.</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-zinc-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500/30" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-red-500/30" />
              <span className="text-[9px] font-bold text-zinc-500 uppercase">Despesas</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Categorias */}
        <div className={`rounded-[32px] p-6 border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-[#0217ff]/10">
              <PieChart size={18} className="text-[#0217ff]" />
            </div>
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Top Categorias de Despesas</h3>
          </div>
          
          <div className="space-y-4">
            {categoryData.length > 0 ? (
              categoryData.map(([cat, value]) => {
                const percentage = totalExpenses > 0 ? Math.round((value / totalExpenses) * 100) : 0;
                const Icon = getCategoryIcon(cat);
                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon size={14} className="text-zinc-400" />
                        <span className={`text-xs font-medium ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{cat}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-500">{formatCurrency(value)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-zinc-500 py-8">Nenhuma despesa registrada</p>
            )}
          </div>
        </div>
      </div>

      {/* LISTA DE TRANSAÇÕES */}
      <div className={`rounded-[32px] overflow-hidden border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-white border-zinc-200'} shadow-sm`}>
        <div className="p-6 border-b border-zinc-100 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-zinc-900'}`}>Transações</h3>
              <p className="text-xs text-zinc-500 mt-1">{filteredTransactions.length} lançamentos</p>
            </div>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                <Download size={16} className="text-zinc-500" />
              </button>
              <button className="p-2 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-xl transition-colors">
                <Printer size={16} className="text-zinc-500" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-zinc-100 dark:divide-white/10">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map((tx) => {
              const Icon = tx.type === 'receita' ? ArrowUpRight : ArrowDownRight;
              const IconCategory = getCategoryIcon(tx.category);
              const statusColor = getStatusColor(tx.status);
              
              return (
                <div 
                  key={tx.id} 
                  className="p-4 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all cursor-pointer group"
                  onClick={() => handleViewDetails(tx)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${tx.type === 'receita' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      <Icon size={20} className={tx.type === 'receita' ? 'text-green-500' : 'text-red-500'} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-bold text-sm truncate ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
                          {tx.description}
                        </h4>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${statusColor}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1">
                          <IconCategory size={10} className="text-zinc-400" />
                          <span className="text-[10px] text-zinc-500">{tx.category}</span>
                        </div>
                        <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                        <div className="flex items-center gap-1">
                          <Calendar size={10} className="text-zinc-400" />
                          <span className="text-[10px] text-zinc-500">{formatDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <p className={`text-base font-black ${tx.type === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                        {tx.type === 'receita' ? '+' : '-'} {formatCurrency(tx.amount)}
                      </p>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                        className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={14} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-zinc-100 dark:bg-white/10 flex items-center justify-center">
                <Receipt size={24} className="text-zinc-400" />
              </div>
              <p className="text-sm text-zinc-500">Nenhuma transação encontrada</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-[#0217ff] text-white rounded-xl text-xs font-bold uppercase"
              >
                Adicionar transação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO (mesmo código) */}
      {showForm && (
        // ... modal code (mesmo do anterior)
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[40px] border border-zinc-200 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <button 
              onClick={() => {
                setShowForm(false);
                setEditingTransaction(null);
                setErrorMessage('');
              }} 
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="p-8">
              <h2 className="text-2xl font-bold mb-2 text-zinc-900">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h2>
              <p className="text-sm text-zinc-500 mb-6">Registre suas movimentações financeiras</p>

              {errorMessage && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle size={16} />
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-2 text-green-500 text-sm">
                  <CheckCircle2 size={16} />
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleAdd} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Descrição *</label>
                  <input 
                    required
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    placeholder="Ex: Comissão Venda AP Moema"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Valor (R$) *</label>
                    <input 
                      required
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo *</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as 'receita' | 'despesa' })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    >
                      <option value="receita">Receita (+)</option>
                      <option value="despesa">Despesa (-)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Categoria *</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    >
                      {(form.type === 'receita' ? categories.receita : categories.despesa).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status *</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as 'pendente' | 'pago' })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    >
                      <option value="pago">Pago</option>
                      <option value="pendente">Pendente</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Data *</label>
                    <input 
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações</label>
                  <textarea 
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0217ff] transition-all resize-none"
                    placeholder="Detalhes adicionais..."
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-5 bg-gradient-to-r from-[#0217ff] to-[#00c6ff] text-white rounded-2xl font-black uppercase tracking-wider text-sm hover:scale-[1.02] transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  ) : (
                    editingTransaction ? <CheckCircle2 size={20} /> : <Plus size={20} />
                  )}
                  {isSubmitting ? 'Registrando...' : (editingTransaction ? 'Atualizar Transação' : 'Registrar Transação')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DETALHES */}
      {showDetailsModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[40px] border border-zinc-200 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0217ff] to-[#00c6ff]" />
            <button 
              onClick={() => setShowDetailsModal(false)} 
              className="absolute top-6 right-6 p-2 hover:bg-zinc-100 rounded-xl transition-colors z-10"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className={`p-4 rounded-2xl ${selectedTransaction.type === 'receita' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {selectedTransaction.type === 'receita' ? (
                    <ArrowUpRight size={28} className="text-green-500" />
                  ) : (
                    <ArrowDownRight size={28} className="text-red-500" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedTransaction.description}</h2>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getStatusColor(selectedTransaction.status)}`}>
                    {selectedTransaction.status}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50">
                  <span className="text-xs text-zinc-500">Valor</span>
                  <span className={`text-xl font-black ${selectedTransaction.type === 'receita' ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedTransaction.type === 'receita' ? '+' : '-'} {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50">
                  <span className="text-xs text-zinc-500">Categoria</span>
                  <div className="flex items-center gap-2">
                    {React.createElement(getCategoryIcon(selectedTransaction.category), { size: 14, className: "text-zinc-400" })}
                    <span className="font-medium">{selectedTransaction.category}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-50">
                  <span className="text-xs text-zinc-500">Data</span>
                  <span className="font-medium">{formatDate(selectedTransaction.date)}</span>
                </div>
                
                {selectedTransaction.notes && (
                  <div className="p-3 rounded-xl bg-zinc-50">
                    <p className="text-xs text-zinc-500 mb-1">Observações</p>
                    <p className="text-sm text-zinc-700">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(selectedTransaction)}
                  className="flex-1 py-4 bg-zinc-100 rounded-2xl font-bold text-sm text-zinc-700 flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                >
                  <Edit3 size={18} />
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(selectedTransaction.id)}
                  className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={18} />
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default FinancialPage;