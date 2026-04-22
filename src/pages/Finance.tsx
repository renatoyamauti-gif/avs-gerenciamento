import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Download, Filter, Plus, X, Trash2, ArrowUpCircle, ArrowDownCircle, BarChart3, Calendar, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell } from 'recharts';
import { dbService } from '../lib/dbService';

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

  const totalIncome = transactions
    .filter(t => t.type === 'Entrada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
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
        <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">Carregando Financeiro...</p>
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
      className="space-y-8 pb-20"
    >
      <section className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic">Financeiro</h2>
          <p className="text-[#94a3b8] font-medium text-sm">Controle de fluxo de caixa e gestão de resultados.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#1e293b] border border-[#334155] px-4 py-2 rounded-xl text-[#94a3b8] font-bold text-xs uppercase tracking-widest transition-all hover:bg-[#334155] hover:text-white">
            <Download size={16} /> Exportar
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#3b82f6] text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={16} />
            NOVA TRANSAÇÃO
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Entradas */}
        <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} className="text-[#10b981]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#475569]">Total de Entradas</p>
          <p className="text-4xl font-black font-headline tracking-tighter text-[#10b981]">R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Saídas */}
        <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingDown size={80} className="text-[#f43f5e]" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#475569]">Total de Saídas</p>
          <p className="text-4xl font-black font-headline tracking-tighter text-[#f43f5e]">R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        {/* Saldo / Lucro ou Prejuízo */}
        <div className={`p-8 rounded-[32px] relative overflow-hidden group border transition-all ${isProfit ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-[#f43f5e]/10 border-[#f43f5e]/30'}`}>
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={80} className={isProfit ? 'text-[#10b981]' : 'text-[#f43f5e]'} />
          </div>
          <div className="flex justify-between items-start mb-6">
            <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border ${isProfit ? 'bg-[#10b981]/20 border-[#10b981]/40 text-[#10b981]' : 'bg-[#f43f5e]/20 border-[#f43f5e]/40 text-[#f43f5e]'}`}>
              {isProfit ? 'LUCRO' : 'PREJUÍZO'}
            </span>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-1 ${isProfit ? 'text-[#10b981]/70' : 'text-[#f43f5e]/70'}`}>Saldo Atual</p>
          <p className={`text-4xl font-black font-headline tracking-tighter ${isProfit ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gráfico de Movimentações - Estilo BarChart para maior clareza */}
      <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-[32px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-[#3b82f6]/20 p-3 rounded-2xl border border-[#3b82f6]/30">
              <BarChart3 size={24} className="text-[#3b82f6]" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-2xl text-white italic tracking-tight">Fluxo Mensal</h3>
              <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Comparativo de entradas e saídas</p>
            </div>
          </div>
          
          <div className="flex gap-4 items-center bg-[#0f172a] p-2 rounded-2xl border border-[#334155]">
            <div className="flex items-center gap-2 px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
              <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Entradas</span>
            </div>
            <div className="flex items-center gap-2 px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" />
              <span className="text-[9px] font-bold text-white uppercase tracking-tighter">Saídas</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: '800' }} 
                dy={12}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#475569', fontSize: 10, fontWeight: '700' }}
                tickFormatter={(value) => `R$ ${value}`}
              />
              <Tooltip 
                cursor={{ fill: '#334155', opacity: 0.3 }}
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#334155', 
                  borderRadius: '16px', 
                  fontSize: '11px',
                  fontWeight: 'bold',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)'
                }}
                itemStyle={{ padding: '2px 0' }}
                labelStyle={{ color: '#94a3b8', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Bar 
                dataKey="entrada" 
                name="Entradas" 
                fill="#10b981" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
              <Bar 
                dataKey="saida" 
                name="Saídas" 
                fill="#f43f5e" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-[24px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#334155] flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-headline font-bold text-xl text-white italic tracking-tight">Histórico de Transações</h3>
          <div className="flex gap-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest overflow-x-auto">
            {['All', 'Entrada', 'Saída'].map(type => (
              <span 
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`cursor-pointer whitespace-nowrap transition-colors ${filterType === type ? 'text-[#3b82f6] border-b-2 border-[#3b82f6] pb-1' : 'hover:text-white'}`}
              >
                {type === 'All' ? 'Todas' : type}
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase font-black text-[#94a3b8]/60 tracking-[0.2em] bg-[#0f172a]/30">
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Motivo / Categoria</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                  <td className="px-6 py-4 text-xs text-[#94a3b8] font-mono">{t.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {t.type === 'Entrada' ? (
                        <ArrowUpCircle size={16} className="text-[#10b981]" />
                      ) : (
                        <ArrowDownCircle size={16} className="text-[#f43f5e]" />
                      )}
                      <span className={`text-[10px] font-black uppercase tracking-widest ${t.type === 'Entrada' ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                        {t.type}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white tracking-tight">{t.reason}</span>
                      <span className="text-[10px] font-bold text-[#475569] uppercase tracking-tighter">{t.category}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${t.type === 'Entrada' ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                    {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => removeTransaction(t.id)} className="p-2 hover:bg-[#334155] rounded-xl transition-colors text-[#94a3b8] hover:text-[#f43f5e]">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Transaction Cards */}
        <div className="md:hidden divide-y divide-[#334155]">
          {filteredTransactions.map((t) => (
            <div key={t.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${t.type === 'Entrada' ? 'bg-[#10b981]/10 text-[#10b981]' : 'bg-[#f43f5e]/10 text-[#f43f5e]'}`}>
                    {t.type === 'Entrada' ? <ArrowUpCircle size={20} /> : <ArrowDownCircle size={20} />}
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-[#475569] tracking-widest mb-1 block">{t.date}</span>
                    <h4 className="font-bold text-white text-sm leading-tight">{t.reason}</h4>
                    <span className="text-[10px] font-bold text-[#3b82f6] uppercase">{t.category}</span>
                  </div>
                </div>
                <button onClick={() => removeTransaction(t.id)} className="p-2 text-[#94a3b8] hover:text-[#f43f5e]"><Trash2 size={16} /></button>
              </div>
              <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-xl border border-[#334155]">
                <span className="text-[10px] font-black text-[#475569] uppercase">Valor Total</span>
                <span className={`text-lg font-black ${t.type === 'Entrada' ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                  {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center text-[#94a3b8] font-medium opacity-40 italic">
              Nenhuma transação registrada.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#1e293b] border border-[#334155] p-10 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white font-headline tracking-tighter italic">Nova Transação</h3>
                <button onClick={() => setIsAdding(false)} className="text-[#94a3b8] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4 p-2 bg-[#0f172a] rounded-2xl border border-[#334155]">
                  <label className="relative cursor-pointer group">
                    <input type="radio" name="type" value="Entrada" defaultChecked className="hidden peer" />
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-transparent peer-checked:bg-[#10b981]/10 peer-checked:border-[#10b981] peer-checked:text-[#10b981] text-[#94a3b8] transition-all">
                      <TrendingUp size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Entrada</span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer group">
                    <input type="radio" name="type" value="Saída" className="hidden peer" />
                    <div className="flex items-center justify-center gap-2 py-3 rounded-xl border border-transparent peer-checked:bg-[#f43f5e]/10 peer-checked:border-[#f43f5e] peer-checked:text-[#f43f5e] text-[#94a3b8] transition-all">
                      <TrendingDown size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Saída</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Valor (R$)</label>
                    <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Data</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Motivo / Descrição</label>
                  <input required name="reason" type="text" placeholder="Ex: Venda de Filhote" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Categoria</label>
                  <select name="category" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium appearance-none">
                    <option value="Venda de Aves">Venda de Aves</option>
                    <option value="Aquisição de Aves">Aquisição de Aves</option>
                    <option value="Ração/Alimentação">Ração/Alimentação</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-[#3b82f6] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-[#2563eb] transition-all hover:scale-[1.02] active:scale-95">
                    Registrar Transação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
