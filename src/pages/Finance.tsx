import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Download, Filter, Plus, X, Trash2, Edit3, ArrowUpCircle, ArrowDownCircle, BarChart3, Calendar, Loader2, Lock, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { dbService } from '../lib/dbService';
import { useSubscription } from '../hooks/useSubscription';
import { exportToCSV } from '../lib/csvHelper';
import { useTheme } from '../contexts/ThemeContext';

interface Transaction {
  id: string;
  type: 'Entrada' | 'Saída';
  category: string;
  reason: string;
  amount: number;
  date: string;
}

export default function Finance() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Entrada' | 'Saída'>('All');
  const { isFreePlan } = useSubscription();
  const [transactionType, setTransactionType] = useState<'Entrada' | 'Saída'>('Entrada');
  const [categories, setCategories] = useState<any[]>([]);
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<any>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (editingTransaction) {
      setTransactionType(editingTransaction.type);
    } else if (isAdding) {
      setTransactionType('Entrada');
    }
  }, [isAdding, editingTransaction]);

  useEffect(() => {
    if (isAdding) {
      setTransactionType('Entrada');
    }
  }, [isAdding]);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      setLoading(true);
      const [transData, catData] = await Promise.all([
        dbService.getTransactions(),
        dbService.getTransactionCategories().catch(err => {
          console.warn('transaction_categories table might not exist yet');
          return null;
        })
      ]);
      setTransactions(transData || []);

      let finalCats = catData || [];
      if (finalCats.length === 0) {
        const defaults = [
          { name: 'Venda de Ovos', type: 'Entrada' },
          { name: 'Venda de Aves', type: 'Entrada' },
          { name: 'Outros', type: 'Entrada' },
          { name: 'Aquisição de Aves', type: 'Saída' },
          { name: 'Ração/Alimentação', type: 'Saída' },
          { name: 'Medicamentos', type: 'Saída' },
          { name: 'Infraestrutura', type: 'Saída' },
          { name: 'Envio / Frete', type: 'Saída' },
          { name: 'Outros', type: 'Saída' }
        ];

        if (catData !== null) {
          try {
            const savedCats = [];
            for (const item of defaults) {
              const saved = await dbService.saveTransactionCategory(item);
              if (saved) savedCats.push(saved);
            }
            if (savedCats.length > 0) {
              finalCats = savedCats;
            }
          } catch (e) {
            console.error('Erro ao seedar categorias padrão:', e);
            finalCats = defaults.map((d, i) => ({ id: `default-${i}`, ...d }));
          }
        } else {
          finalCats = defaults.map((d, i) => ({ id: `default-${i}`, ...d }));
        }
      }
      setCategories(finalCats);
    } catch (error) {
      console.error('Erro ao carregar transações/categorias:', error);
    } finally {
      setLoading(false);
    }
  }

  const currentDate = new Date();
  const currentMonthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
  const currentYearStr = String(currentDate.getFullYear());
  const currentMonthPrefix = `${currentYearStr}-${currentMonthStr}`;

  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonthPrefix));

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = currentMonthTransactions
    .filter(t => t.type === 'Saída')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const isProfit = balance >= 0;

  const chartData = useMemo(() => {
    const months: { [key: string]: { month: string, entrada: number, saida: number } } = {};
    
    // Get last 6 months to ensure a good spread even with little data
    const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sorted.forEach(t => {
      const date = new Date(t.date);
      const monthYear = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      
      if (!months[monthYear]) {
        months[monthYear] = { month: monthYear, entrada: 0, saida: 0 };
      }
      
      if (t.type === 'Entrada') {
        months[monthYear].entrada += t.amount;
      } else {
        months[monthYear].saida += t.amount;
      }
    });
    
    return Object.values(months);
  }, [transactions]);

  const handleAddTransaction = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newTransactionPlan = {
      id: editingTransaction?.id,
      type: formData.get('type') as 'Entrada' | 'Saída',
      category: formData.get('category') as string,
      reason: formData.get('reason') as string,
      amount: parseFloat(formData.get('amount') as string) || 0,
      date: formData.get('date') as string || new Date().toISOString().split('T')[0],
    };

    try {
      await dbService.saveTransaction(newTransactionPlan);
      await loadTransactions();
      setIsAdding(false);
      setEditingTransaction(null);
    } catch (error) {
      alert('Erro ao salvar transação: ' + error);
    }
  };

  const removeTransaction = async (id: string) => {
    if (!confirm('Tem certeza que quer excluir/deletar esta movimentação? Pois será irreversível.')) return;
    try {
      await dbService.deleteTransaction(id);
      await loadTransactions();
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#3b82f6]" size={48} />
        <p className="text-slate-200 font-bold uppercase tracking-widest text-sm">Carregando Financeiro...</p>
      </div>
    );
  }

  const filteredTransactions = transactions.filter(t => 
    filterType === 'All' || t.type === filterType
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-8 pb-20 relative"
    >
      <section className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-[#1F2937] dark:text-slate-100 tracking-tight">Financeiro</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-3">
          {!isFreePlan && (
            <>
              <button 
                onClick={() => exportToCSV(transactions, `lancamentos_${new Date().toISOString().split('T')[0]}`)}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full text-[#6B7280] dark:text-slate-400 text-sm font-semibold hover:border-[#2563EB] dark:hover:border-blue-500 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors shadow-sm cursor-pointer"
              >
                <Download size={16} /> Exportar CSV
              </button>
              <button 
                onClick={() => setIsEditingCategories(true)}
                className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-full text-[#6B7280] dark:text-slate-400 text-sm font-semibold hover:border-[#2563EB] dark:hover:border-blue-500 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors shadow-sm cursor-pointer"
              >
                <Plus size={16} className="text-[#8B5CF6] dark:text-purple-400" /> Categorias
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all hover:bg-[#1D4ED8] active:scale-95 cursor-pointer"
              >
                <Plus size={16} />
                Nova Transação
              </button>
            </>
          )}
        </div>
      </section>

      {isFreePlan ? (
        <div className="bg-white dark:bg-slate-900 border border-[#FDE68A] dark:border-amber-900/40 p-10 rounded-3xl text-center flex flex-col items-center gap-6 mt-8 shadow-sm">
          <div className="bg-[#FEF3C7] dark:bg-amber-955/20 p-6 rounded-full">
            <Lock size={48} className="text-[#D97706] dark:text-amber-500" />
          </div>
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-[#1F2937] dark:text-slate-100 font-headline mb-4">Funcionalidade Premium</h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-8">
              O controle financeiro completo, com gráficos de fluxo de caixa, relatórios e gestão de resultados, está disponível apenas nos planos pagos (Mensal, Trimestral e Anual). Assine agora para ter visão total sobre o lucro do seu plantel!
            </p>
            <a href="/subscription" className="inline-flex items-center gap-2 bg-[#F59E0B] text-white px-8 py-4 rounded-full font-bold text-sm uppercase tracking-wider shadow-md hover:scale-105 active:scale-95 transition-all">
              <Star size={16} /> Fazer Upgrade
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Entradas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} className="text-[#16A34A] dark:text-green-500" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#16A34A] dark:bg-green-500 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#16A34A] dark:text-green-550">Entradas</p>
          </div>
          <p className="text-4xl font-black text-[#1F2937] dark:text-slate-100 mt-4 tracking-tight">
            <span className="text-slate-400 dark:text-slate-500 mr-2 text-xl">R$</span>{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} className="text-[#EF4444] dark:text-red-500" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#EF4444] dark:bg-red-500 rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444] dark:text-red-400">Saídas</p>
          </div>
          <p className="text-4xl font-black text-[#1F2937] dark:text-slate-100 mt-4 tracking-tight">
            <span className="text-slate-400 dark:text-slate-500 mr-2 text-xl">R$</span>{totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saldo / Lucro ou Prejuízo */}
        <div className={`p-8 rounded-3xl relative overflow-hidden group border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all ${isProfit ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800' : 'bg-[#FEF2F2] dark:bg-red-950/20 border-[#FECACA] dark:border-red-900/40'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={80} className={isProfit ? 'text-[#16A34A] dark:text-green-500' : 'text-[#EF4444] dark:text-red-500'} />
          </div>
          <div className="flex justify-between items-start mb-6">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isProfit ? 'bg-[#DCFCE7] dark:bg-green-950/50 text-[#16A34A] dark:text-green-400' : 'bg-[#FEE2E2] dark:bg-red-950/50 text-[#EF4444] dark:text-red-400'}`}>
              {isProfit ? 'LUCRO' : 'PREJUÍZO'}
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-500 dark:text-slate-400">Saldo Atual</p>
          <p className={`text-5xl font-black tracking-tight ${isProfit ? 'text-[#1F2937] dark:text-slate-100' : 'text-[#EF4444] dark:text-red-400'}`}>
            <span className={`mr-2 text-xl ${isProfit ? 'text-slate-400 dark:text-slate-500' : 'text-[#EF4444]/60'}`}>R$</span>
            {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gráfico de Movimentações */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 rounded-3xl relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#EFF6FF] dark:bg-blue-950/40 p-3 rounded-xl">
              <BarChart3 size={24} className="text-[#2563EB] dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#1F2937] dark:text-slate-100">Evolução Mensal</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Acompanhamento de fluxo de caixa</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center bg-[#F8FAFC] dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 px-3">
              <div className="w-3 h-3 rounded-full bg-[#16A34A] dark:bg-green-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Entradas</span>
            </div>
            <div className="flex items-center gap-2 px-3">
              <div className="w-3 h-3 rounded-full bg-[#EF4444] dark:bg-red-500" />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">Saídas</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={8} barCategoryGap={24}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#F1F5F9"} vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '500' }} 
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12, fontWeight: '500' }}
                tickFormatter={(value) => value > 0 ? `${value}` : '0'}
              />
              <Tooltip 
                cursor={{ fill: isDark ? '#1E293B' : '#F8FAFC' }}
                contentStyle={{ 
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
                  borderColor: isDark ? '#334155' : '#E2E8F0', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  color: isDark ? '#F1F5F9' : '#1F2937',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                itemStyle={{ padding: '4px 0' }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Bar dataKey="entrada" name="Entradas" fill="#16A34A" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saida" name="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-105 dark:border-slate-800 rounded-3xl overflow-hidden relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-xl text-[#1F2937] dark:text-slate-100">Histórico de Transações</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Registro completo de atividades</p>
          </div>
          <div className="flex gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Entrada', 'Saída'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-full transition-colors whitespace-nowrap cursor-pointer ${filterType === type ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
              >
                {type === 'All' ? 'Todas' : type}
              </button>
            ))}
          </div>
        </div>
        
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="uppercase text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest bg-[#F8FAFC] dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-4">Data</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4">Descrição / Categoria</th>
                <th className="px-8 py-4 text-right">Valor</th>
                <th className="px-8 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-[#F8FAFC] dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-4 text-slate-500 dark:text-slate-400 font-medium">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${t.type === 'Entrada' ? 'bg-[#DCFCE7] dark:bg-green-950/40 text-[#16A34A] dark:text-green-400' : 'bg-[#FEE2E2] dark:bg-red-950/40 text-[#EF4444] dark:text-red-450'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1F2937] dark:text-slate-100">{t.reason}</span>
                      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-505 uppercase tracking-widest mt-0.5">{t.category}</span>
                    </div>
                  </td>
                  <td className={`px-8 py-4 text-right font-bold ${t.type === 'Entrada' ? 'text-[#16A34A] dark:text-green-400' : 'text-[#EF4444] dark:text-red-400'}`}>
                    {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => setEditingTransaction(t)} 
                        className="p-2 text-slate-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] dark:hover:bg-blue-950/40 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => removeTransaction(t.id)} 
                        className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-[#FEF2F2] dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                  </tr>
               ))}
            </tbody>
          </table>
        </div>
 
        {/* Mobile View: Transaction Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${t.type === 'Entrada' ? 'bg-[#DCFCE7] dark:bg-green-950/40 text-[#16A34A] dark:text-green-400' : 'bg-[#FEE2E2] dark:bg-red-950/40 text-[#EF4444] dark:text-red-400'}`}>
                    {t.type === 'Entrada' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-widest block">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    <h4 className="font-bold text-[#1F2937] dark:text-slate-100 text-base leading-tight mt-0.5">{t.reason}</h4>
                    <span className="text-xs font-semibold text-[#2563EB] dark:text-blue-400 uppercase mt-1 block">{t.category}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setEditingTransaction(t)} 
                    className="p-2 text-slate-400 hover:text-[#2563EB] bg-[#F8FAFC] dark:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button 
                    onClick={() => removeTransaction(t.id)} 
                    className="p-2 text-slate-400 hover:text-[#EF4444] bg-[#F8FAFC] dark:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center bg-[#F8FAFC] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Valor Total</span>
                <span className={`text-lg font-black ${t.type === 'Entrada' ? 'text-[#16A34A] dark:text-green-400' : 'text-[#EF4444] dark:text-red-400'}`}>
                  {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="bg-[#F8FAFC] dark:bg-slate-800 p-4 rounded-full mb-4">
                <BarChart3 size={32} className="text-slate-300 dark:text-slate-650" />
              </div>
              <p className="text-sm font-semibold text-slate-450 dark:text-slate-500">Nenhuma transação registrada.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isEditingCategories && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { setIsEditingCategories(false); setCategoryToEdit(null); }} 
              className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl flex flex-col max-h-[85vh] z-10"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h3 className="text-xl font-bold text-[#1F2937]">Gerenciar Categorias</h3>
                <button 
                  onClick={() => { setIsEditingCategories(false); setCategoryToEdit(null); }} 
                  className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Add/Edit Form */}
              <form 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const formData = new FormData(form);
                  const name = formData.get('cat_name') as string;
                  const type = formData.get('cat_type') as 'Entrada' | 'Saída';
                  if (!name) return;

                  try {
                    const catData: any = { name, type };
                    if (categoryToEdit?.id && !categoryToEdit.id.startsWith('default-')) {
                      catData.id = categoryToEdit.id;
                    }
                    await dbService.saveTransactionCategory(catData);
                    await loadTransactions();
                    setCategoryToEdit(null);
                    form.reset();
                  } catch (err: any) {
                    alert('Erro ao salvar categoria: ' + err.message);
                  }
                }}
                className="space-y-4 mb-6 shrink-0"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                    {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
                  </label>
                  <input 
                    key={categoryToEdit?.id || 'new'}
                    required 
                    name="cat_name" 
                    defaultValue={categoryToEdit?.name || ''} 
                    placeholder="Ex: Venda de Ovos" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Categoria</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Entrada', 'Saída'].map(t => (
                      <label key={t} className="flex items-center justify-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-2xl py-3.5 cursor-pointer transition-all hover:border-[#2563EB] has-[:checked]:bg-[#EFF6FF] has-[:checked]:border-[#2563EB] has-[:checked]:text-[#2563EB] text-slate-500">
                        <input 
                          type="radio" 
                          name="cat_type" 
                          value={t} 
                          defaultChecked={categoryToEdit ? categoryToEdit.type === t : t === 'Entrada'}
                          className="hidden"
                        />
                        <span className="text-xs font-bold uppercase tracking-widest">{t}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    type="submit" 
                    className="flex-1 py-3.5 bg-[#2563EB] text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-[#1D4ED8] transition-colors shadow-sm shrink-0"
                  >
                    {categoryToEdit ? 'Salvar Categoria' : 'Adicionar Categoria'}
                  </button>
                  {categoryToEdit && (
                    <button 
                      type="button" 
                      onClick={() => setCategoryToEdit(null)} 
                      className="px-4 py-3.5 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>

              {/* Scrollable Categories List */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  Categorias Cadastradas ({categories.length})
                </h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div 
                      key={cat.id} 
                      className="flex items-center justify-between p-3.5 bg-[#F8FAFC] border border-slate-100 rounded-2xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-md ${cat.type === 'Entrada' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                          {cat.type}
                        </span>
                        <span className="text-sm font-bold text-[#1F2937]">{cat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setCategoryToEdit(cat)} 
                          className="p-2 text-slate-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-lg transition-colors"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          onClick={async () => {
                            if (confirm(`Excluir a categoria "${cat.name}"? Isso não alterará as transações já registradas.`)) {
                              try {
                                if (cat.id.startsWith('default-')) {
                                  setCategories(prev => prev.filter(c => c.id !== cat.id));
                                } else {
                                  await dbService.deleteTransactionCategory(cat.id);
                                  await loadTransactions();
                                }
                                if (categoryToEdit?.id === cat.id) setCategoryToEdit(null);
                              } catch (err: any) {
                                alert('Erro ao excluir: ' + err.message);
                              }
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <div className="text-center py-10 opacity-50 text-slate-400 font-medium">
                      Nenhuma categoria registrada.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {(isAdding || editingTransaction !== null) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAdding(false); setEditingTransaction(null); }} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-[#1F2937]">
                    {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">
                    {editingTransaction ? 'Atualize os detalhes do lançamento' : 'Registre entradas ou saídas'}
                  </p>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingTransaction(null); }} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative cursor-pointer group">
                    <input 
                      type="radio" 
                      name="type" 
                      value="Entrada" 
                      checked={transactionType === 'Entrada'}
                      onChange={() => setTransactionType('Entrada')}
                      className="hidden peer" 
                    />
                    <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-100 peer-checked:bg-[#DCFCE7] peer-checked:border-[#16A34A] peer-checked:text-[#16A34A] text-slate-400 font-bold transition-all">
                      <ArrowUpCircle size={20} />
                      <span className="text-sm uppercase tracking-widest">Entrada</span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer group">
                    <input 
                      type="radio" 
                      name="type" 
                      value="Saída" 
                      checked={transactionType === 'Saída'}
                      onChange={() => setTransactionType('Saída')}
                      className="hidden peer" 
                    />
                    <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-100 peer-checked:bg-[#FEE2E2] peer-checked:border-[#EF4444] peer-checked:text-[#EF4444] text-slate-400 font-bold transition-all">
                      <ArrowDownCircle size={20} />
                      <span className="text-sm uppercase tracking-widest">Saída</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                    <input required name="amount" type="number" step="0.01" placeholder="0.00" defaultValue={editingTransaction?.amount || ''} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                    <input name="date" type="date" defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                  <input required name="reason" type="text" placeholder="Ex: Venda Lote 04" defaultValue={editingTransaction?.reason || ''} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingCategories(true)} 
                      className="text-xs text-[#2563EB] hover:underline font-bold"
                    >
                      + Gerenciar
                    </button>
                  </div>
                  <select name="category" defaultValue={editingTransaction?.category || ''} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none">
                    {categories
                      .filter(c => c.type === transactionType)
                      .map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))
                    }
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2">
                    {editingTransaction ? <Edit3 size={20} /> : <Plus size={20} />}
                    {editingTransaction ? 'Salvar Alterações' : 'Adicionar Transação'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

      </AnimatePresence>
        </>
      )}
    </motion.div>
  );
}
