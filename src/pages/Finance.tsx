import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Download, Filter, Plus, X, Trash2, ArrowUpCircle, ArrowDownCircle, BarChart3, Calendar, Loader2, Lock, Star } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { dbService } from '../lib/dbService';
import { useSubscription } from '../hooks/useSubscription';

interface Transaction {
  id: string;
  type: 'Entrada' | 'Saída';
  category: string;
  reason: string;
  amount: number;
  date: string;
}

export default function Finance() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<'All' | 'Entrada' | 'Saída'>('All');
  const { isFreePlan } = useSubscription();

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {
    try {
      const data = await dbService.getTransactions();
      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
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
    } catch (error) {
      alert('Erro ao salvar transação: ' + error);
    }
  };

  const removeTransaction = async (id: string) => {
    if (!confirm('Deseja excluir esta movimentação?')) return;
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
      <section className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-[#1F2937] tracking-tight">Financeiro</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">Controle de receitas e despesas</p>
        </div>
        <div className="flex gap-3">
          {!isFreePlan && (
            <>
              <button 
                className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-full text-[#6B7280] text-sm font-semibold hover:border-[#2563EB] hover:text-[#2563EB] transition-colors shadow-sm"
              >
                <Download size={16} /> Exportar CSV
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md transition-all hover:bg-[#1D4ED8] active:scale-95"
              >
                <Plus size={16} />
                Nova Transação
              </button>
            </>
          )}
        </div>
      </section>

      {isFreePlan ? (
        <div className="bg-white border border-[#FDE68A] p-10 rounded-3xl text-center flex flex-col items-center gap-6 mt-8 shadow-sm">
          <div className="bg-[#FEF3C7] p-6 rounded-full">
            <Lock size={48} className="text-[#D97706]" />
          </div>
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-[#1F2937] font-headline mb-4">Funcionalidade Premium</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              O controle financeiro completo, com gráficos de fluxo de caixa, relatórios e gestão de resultados, está disponível apenas nos planos Profissional e Anual. Assine agora para ter visão total sobre o lucro do seu plantel!
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
        <div className="bg-white border border-slate-100 p-8 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={80} className="text-[#16A34A]" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#16A34A] rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#16A34A]">Entradas</p>
          </div>
          <p className="text-4xl font-black text-[#1F2937] mt-4 tracking-tight">
            <span className="text-slate-400 mr-2 text-xl">R$</span>{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-white border border-slate-100 p-8 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingDown size={80} className="text-[#EF4444]" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#EF4444] rounded-full" />
            <p className="text-xs font-bold uppercase tracking-widest text-[#EF4444]">Saídas</p>
          </div>
          <p className="text-4xl font-black text-[#1F2937] mt-4 tracking-tight">
            <span className="text-slate-400 mr-2 text-xl">R$</span>{totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saldo / Lucro ou Prejuízo */}
        <div className={`p-8 rounded-3xl relative overflow-hidden group border shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all ${isProfit ? 'bg-white border-slate-100' : 'bg-[#FEF2F2] border-[#FECACA]'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Wallet size={80} className={isProfit ? 'text-[#16A34A]' : 'text-[#EF4444]'} />
          </div>
          <div className="flex justify-between items-start mb-6">
            <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${isProfit ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
              {isProfit ? 'LUCRO' : 'PREJUÍZO'}
            </span>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1 text-slate-500">Saldo Atual</p>
          <p className={`text-5xl font-black tracking-tight ${isProfit ? 'text-[#1F2937]' : 'text-[#EF4444]'}`}>
            <span className={`mr-2 text-xl ${isProfit ? 'text-slate-400' : 'text-[#EF4444]/60'}`}>R$</span>
            {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gráfico de Movimentações */}
      <div className="bg-white border border-slate-100 p-8 rounded-3xl relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#EFF6FF] p-3 rounded-xl">
              <BarChart3 size={24} className="text-[#2563EB]" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-[#1F2937]">Evolução Mensal</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Acompanhamento de fluxo de caixa</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center bg-[#F8FAFC] p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 px-3">
              <div className="w-3 h-3 rounded-full bg-[#16A34A]" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Entradas</span>
            </div>
            <div className="flex items-center gap-2 px-3">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Saídas</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={8} barCategoryGap={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: '500' }} 
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748B', fontSize: 12, fontWeight: '500' }}
                tickFormatter={(value) => value > 0 ? `${value}` : '0'}
              />
              <Tooltip 
                cursor={{ fill: '#F8FAFC' }}
                contentStyle={{ 
                  backgroundColor: '#FFFFFF', 
                  borderColor: '#E2E8F0', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  color: '#1F2937',
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

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden relative z-10 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="p-6 sm:p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="font-bold text-xl text-[#1F2937]">Histórico de Transações</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Registro completo de atividades</p>
          </div>
          <div className="flex gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['All', 'Entrada', 'Saída'].map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`px-4 py-2 rounded-full transition-colors whitespace-nowrap ${filterType === type ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] border border-slate-200 hover:bg-slate-100'}`}
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
              <tr className="uppercase text-xs font-bold text-slate-400 tracking-widest bg-[#F8FAFC] border-b border-slate-100">
                <th className="px-8 py-4">Data</th>
                <th className="px-8 py-4">Tipo</th>
                <th className="px-8 py-4">Descrição / Categoria</th>
                <th className="px-8 py-4 text-right">Valor</th>
                <th className="px-8 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-8 py-4 text-slate-500 font-medium">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-4">
                    <span className={`px-3 py-1 text-[10px] font-bold tracking-widest uppercase rounded-full ${t.type === 'Entrada' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-8 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#1F2937]">{t.reason}</span>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mt-0.5">{t.category}</span>
                    </div>
                  </td>
                  <td className={`px-8 py-4 text-right font-bold ${t.type === 'Entrada' ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                    {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-8 py-4 text-right">
                    <button onClick={() => removeTransaction(t.id)} className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Transaction Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${t.type === 'Entrada' ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#EF4444]'}`}>
                    {t.type === 'Entrada' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                    <h4 className="font-bold text-[#1F2937] text-base leading-tight mt-0.5">{t.reason}</h4>
                    <span className="text-xs font-semibold text-[#2563EB] uppercase mt-1 block">{t.category}</span>
                  </div>
                </div>
                <button onClick={() => removeTransaction(t.id)} className="p-2 text-slate-400 hover:text-[#EF4444] bg-[#F8FAFC] rounded-xl"><Trash2 size={16} /></button>
              </div>
              <div className="flex justify-between items-center bg-[#F8FAFC] border border-slate-100 p-4 rounded-2xl">
                <span className="text-xs font-bold text-slate-500 uppercase">Valor Total</span>
                <span className={`text-lg font-black ${t.type === 'Entrada' ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                  {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center">
              <div className="bg-[#F8FAFC] p-4 rounded-full mb-4">
                <BarChart3 size={32} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Nenhuma transação registrada.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-100">
                <div>
                  <h3 className="text-2xl font-bold text-[#1F2937]">Nova Transação</h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Registre entradas ou saídas</p>
                </div>
                <button onClick={() => setIsAdding(false)} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative cursor-pointer group">
                    <input type="radio" name="type" value="Entrada" defaultChecked className="hidden peer" />
                    <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-100 peer-checked:bg-[#DCFCE7] peer-checked:border-[#16A34A] peer-checked:text-[#16A34A] text-slate-400 font-bold transition-all">
                      <ArrowUpCircle size={20} />
                      <span className="text-sm uppercase tracking-widest">Entrada</span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer group">
                    <input type="radio" name="type" value="Saída" className="hidden peer" />
                    <div className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-100 peer-checked:bg-[#FEE2E2] peer-checked:border-[#EF4444] peer-checked:text-[#EF4444] text-slate-400 font-bold transition-all">
                      <ArrowDownCircle size={20} />
                      <span className="text-sm uppercase tracking-widest">Saída</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                    <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição</label>
                  <input required name="reason" type="text" placeholder="Ex: Venda Lote 04" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                  <select name="category" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3.5 text-[#1F2937] font-semibold focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none appearance-none">
                    <option value="Venda de Aves">Venda de Aves</option>
                    <option value="Aquisição de Aves">Aquisição de Aves</option>
                    <option value="Ração/Alimentação">Ração/Alimentação</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl font-bold uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2">
                    <Plus size={20} /> Adicionar Transação
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
