import React, { useState } from 'react';
import { useGlobal } from '../context/GlobalContext';
import { ArrowUpRight, ArrowDownRight, Plus, Trash2, Wallet, TrendingUp } from 'lucide-react';
import { getThemeColors } from '../utils/theme';

const FinancialPage: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction, darkMode } = useGlobal();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', type: 'receita' as 'receita' | 'despesa', category: 'Comissão', date: new Date().toISOString().split('T')[0], status: 'pago' as 'pendente' | 'pago' });
  const tc = getThemeColors(darkMode);

  const inc = transactions.filter(t => t.type === 'receita').reduce((s, t) => s + t.amount, 0);
  const exp = transactions.filter(t => t.type === 'despesa').reduce((s, t) => s + t.amount, 0);
  const bal = inc - exp;
  const pend = transactions.filter(t => t.status === 'pendente').reduce((s, t) => s + (t.type === 'receita' ? t.amount : -t.amount), 0);
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const margin = inc > 0 ? Math.round(((inc - exp) / inc) * 100) : 0;

  const months: { label: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const mIncome = transactions.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y && t.type === 'receita'; }).reduce((s, t) => s + t.amount, 0);
    const mExpense = transactions.filter(t => { const td = new Date(t.date); return td.getMonth() === m && td.getFullYear() === y && t.type === 'despesa'; }).reduce((s, t) => s + t.amount, 0);
    months.push({ label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''), income: mIncome, expense: mExpense });
  }
  const maxMonth = Math.max(...months.map(m => Math.max(m.income, m.expense)), 1);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addTransaction({ description: form.description, amount: Number(form.amount) || 0, type: form.type, category: form.category, date: form.date, status: form.status });
    setShowForm(false);
    setForm({ description: '', amount: '', type: 'receita', category: 'Comissão', date: new Date().toISOString().split('T')[0], status: 'pago' });
  };

  return (
    <div className="page space-y-6 lg:max-w-3xl">
      <div className="flex justify-between items-start animate-fade">
        <div>
          <h2 className="text-[30px] font-bold tracking-tight" style={{ color: tc.text }}>Financeiro</h2>
          <p className="text-[13px] mt-0.5" style={{ color: tc.textSec }}>{transactions.length} lançamentos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn btn-primary !p-3 !rounded-[14px]">
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Card — adapts to dark mode */}
      <div 
        className="relative overflow-hidden rounded-[24px] p-7 animate-slide-up delay-1 border border-black/[0.04] dark:border-white/[0.08]"
        style={{
          background: darkMode 
            ? 'linear-gradient(135deg, #1C1C1E 0%, #2C2C2E 100%)' 
            : '#FFFFFF',
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0,0,0,0.4)' 
            : '0 4px 24px rgba(0,0,0,0.06)',
        }}
      >
        <div className="absolute top-[-80px] right-[-40px] w-[250px] h-[250px] rounded-full blur-[90px]" 
          style={{ background: darkMode ? 'rgba(52, 199, 89, 0.1)' : 'rgba(52, 199, 89, 0.05)' }} />
        <div className="absolute bottom-[-60px] left-[-30px] w-[180px] h-[180px] rounded-full blur-[70px]" 
          style={{ background: darkMode ? 'rgba(10, 132, 255, 0.08)' : 'rgba(10, 132, 255, 0.04)' }} />
        
        <div className="relative">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>
                Saldo Total
              </p>
              <h3 className="text-[42px] font-bold tracking-tight mt-1 tabular leading-none"
                style={{ color: darkMode ? 'white' : tc.text }}>
                R$ {bal.toLocaleString('pt-BR')}
              </h3>
              {pend !== 0 && (
                <p className="text-[12px] mt-2 tabular"
                  style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)' }}>
                  Pendente: R$ {pend.toLocaleString('pt-BR')}
                </p>
              )}
            </div>
            <div className="p-3.5 rounded-[14px]"
              style={{ background: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)' }}>
              <Wallet className="w-6 h-6" style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.25)' }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="rounded-[16px] p-4"
              style={{ 
                background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
              }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-apple-green/15 flex items-center justify-center">
                  <ArrowUpRight className="w-3.5 h-3.5 text-apple-green" />
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-[0.06em]"
                  style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>
                  Receitas
                </span>
              </div>
              <p className="text-[20px] font-bold tabular" style={{ color: darkMode ? 'white' : tc.text }}>
                R$ {inc.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="rounded-[16px] p-4"
              style={{ 
                background: darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                border: darkMode ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.04)'
              }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-full bg-apple-red/15 flex items-center justify-center">
                  <ArrowDownRight className="w-3.5 h-3.5 text-apple-red" />
                </div>
                <span className="text-[10px] uppercase font-semibold tracking-[0.06em]"
                  style={{ color: darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)' }}>
                  Despesas
                </span>
              </div>
              <p className="text-[20px] font-bold tabular" style={{ color: darkMode ? 'white' : tc.text }}>
                R$ {exp.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="rounded-[20px] p-5 flex items-center gap-4 animate-slide-up delay-2" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        <div className="w-12 h-12 rounded-[14px] bg-apple-green/[0.06] flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-apple-green" />
        </div>
        <div className="flex-1">
          <p className="text-[12px] font-medium" style={{ color: tc.textSec }}>Margem de Lucro</p>
          <p className="text-[22px] font-bold tabular leading-none mt-1" style={{ color: tc.text }}>{margin}%</p>
        </div>
        <div className="w-24 h-3 rounded-full overflow-hidden" style={{ background: tc.surfaceBg }}>
          <div className="h-full bg-apple-green rounded-full" style={{ width: `${Math.min(Math.max(margin, 0), 100)}%`, animation: 'bar-grow 1s ease-out both' }} />
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="rounded-[20px] p-6 animate-slide-up delay-3" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        <h3 className="text-[17px] font-bold tracking-tight mb-6" style={{ color: tc.text }}>Últimos 6 Meses</h3>
        <div className="flex items-end gap-3 h-[140px]">
          {months.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="flex gap-1 items-end flex-1 w-full justify-center">
                <div className="w-3 bg-apple-green/20 rounded-t-[4px] transition-all" style={{ height: `${Math.max((m.income / maxMonth) * 100, 3)}%`, animation: 'bar-grow-h 0.8s ease-out both', animationDelay: `${i * 80}ms` }} />
                <div className="w-3 bg-apple-red/20 rounded-t-[4px] transition-all" style={{ height: `${Math.max((m.expense / maxMonth) * 100, 3)}%`, animation: 'bar-grow-h 0.8s ease-out both', animationDelay: `${i * 80 + 50}ms` }} />
              </div>
              <span className="text-[10px] font-medium capitalize" style={{ color: tc.textSec }}>{m.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-5 mt-4 pt-4" style={{ borderTop: `1px solid ${tc.border}` }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-[3px] bg-apple-green/20" />
            <span className="text-[11px] font-medium" style={{ color: tc.textSec }}>Receitas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-[3px] bg-apple-red/20" />
            <span className="text-[11px] font-medium" style={{ color: tc.textSec }}>Despesas</span>
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="rounded-[20px] overflow-hidden animate-slide-up delay-4" style={{ background: tc.cardBg, boxShadow: tc.cardShadow }}>
        <div className="p-6 pb-3"><h3 className="text-[17px] font-bold tracking-tight" style={{ color: tc.text }}>Transações</h3></div>
        <div>
          {sorted.map((tx, i) => (
            <div key={tx.id} className="px-6 py-4 flex items-center gap-4 transition-colors group" style={{ borderTop: i > 0 ? `1px solid ${tc.border}` : 'none' }}>
              <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 ${tx.type === 'receita' ? 'bg-apple-green/[0.06]' : 'bg-apple-red/[0.06]'}`}>
                {tx.type === 'receita' ? <ArrowUpRight className="w-5 h-5 text-apple-green" /> : <ArrowDownRight className="w-5 h-5 text-apple-red" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color: tc.text }}>{tx.description}</p>
                <p className="text-[11px] mt-0.5" style={{ color: tc.textSec }}>
                  {new Date(tx.date).toLocaleDateString('pt-BR')} · {tx.category}
                  {tx.status === 'pendente' && <span className="ml-1.5 text-apple-orange font-semibold">· Pendente</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className={`text-[15px] font-bold tabular ${tx.type === 'receita' ? 'text-apple-green' : 'text-apple-red'}`}>
                  {tx.type === 'receita' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR')}
                </p>
                <button onClick={() => deleteTransaction(tx.id)} className="p-2 rounded-[10px] transition-all opacity-0 group-hover:opacity-100 hover:bg-apple-red/[0.06] text-apple-red"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <div className="empty-state py-16"><p className="text-[14px]" style={{ color: tc.textSec }}>Nenhuma transação</p></div>}
        </div>
      </div>

      {/* Form Sheet */}
      {showForm && (
        <>
          <div className="overlay" onClick={() => setShowForm(false)} />
          <div className="sheet px-6 pt-2 pb-8">
            <div className="sheet-handle" />
            <form onSubmit={handleAdd} className="space-y-4 mt-6">
              <p className="text-[20px] font-bold tracking-tight" style={{ color: tc.text }}>Novo Lançamento</p>
              <input required placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input" />
              <div className="grid grid-cols-2 gap-3">
                <input required type="number" step="0.01" placeholder="Valor (R$)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="input" />
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'receita' | 'despesa' })} className="input appearance-none">{['receita', 'despesa'].map(t => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input appearance-none">{['Comissão', 'Marketing', 'Transporte', 'Material', 'Escritório', 'Outro'].map(c => <option key={c} value={c}>{c}</option>)}</select>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'pendente' | 'pago' })} className="input appearance-none"><option value="pago">Pago</option><option value="pendente">Pendente</option></select>
              </div>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="input" />
              <button type="submit" className="btn btn-primary w-full !py-4 !rounded-[14px]">Registrar</button>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default FinancialPage;
