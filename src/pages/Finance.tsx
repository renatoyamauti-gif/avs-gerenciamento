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
      className="space-y-8 pb-20 relative bg-[#050505] min-h-screen p-6 sm:p-10 border-l-4 border-l-[#3b82f6]"
    >
      {/* Background grid pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <section className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-2 border-slate-800 pb-6">
        <div>
          <h2 className="text-4xl font-black text-white font-mono uppercase tracking-tighter">FINANCEIRO_SYS</h2>
          <p className="text-slate-400 font-mono text-xs uppercase tracking-[0.2em] mt-2">&gt; FLUXO DE CAIXA E PERFORMANCE</p>
        </div>
        <div className="flex gap-3">
          {!isFreePlan && (
            <>
              <button 
                className="flex items-center gap-2 bg-[#050505] border-2 border-slate-700 px-4 py-2 rounded-none text-slate-300 font-mono text-xs uppercase tracking-widest transition-all hover:bg-slate-800 hover:text-white"
              >
                <Download size={14} /> EXPORT_CSV
              </button>
              <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-[#00ff9d] text-black px-6 py-2 rounded-none font-mono text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(0,255,157,0.4)] transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.6)] active:scale-95"
              >
                <Plus size={14} />
                NOVA_TRANSAÇÃO
              </button>
            </>
          )}
        </div>
      </section>

      {isFreePlan ? (
        <div className="bg-[#1e293b] border border-[#f59e0b]/30 p-10 rounded-[32px] text-center flex flex-col items-center gap-6 mt-8">
          <div className="bg-[#f59e0b]/10 p-6 rounded-full">
            <Lock size={48} className="text-[#f59e0b]" />
          </div>
          <div className="max-w-lg">
            <h3 className="text-2xl font-black text-white font-headline tracking-tighter italic mb-4">Funcionalidade Premium</h3>
            <p className="text-slate-200 font-medium leading-relaxed mb-8">
              O controle financeiro completo, com gráficos de fluxo de caixa, relatórios e gestão de resultados, está disponível apenas nos planos Profissional e Anual. Assine agora para ter visão total sobre o lucro do seu plantel!
            </p>
            <a href="/subscription" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#eab308] to-[#f59e0b] text-[#1e293b] px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition-all">
              <Star size={16} /> Fazer Upgrade
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {/* Entradas */}
        <div className="bg-[#050505] border-2 border-[#10b981]/30 p-8 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <TrendingUp size={64} className="text-[#00ff9d]" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#00ff9d] animate-pulse" />
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#00ff9d]">ENTRADAS_T</p>
          </div>
          <p className="text-4xl font-mono text-white mt-4 tracking-tighter">
            <span className="text-slate-500 mr-2">R$</span>{totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saídas */}
        <div className="bg-[#050505] border-2 border-[#f43f5e]/30 p-8 rounded-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <TrendingDown size={64} className="text-[#ff3366]" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-[#ff3366] animate-pulse" />
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#ff3366]">SAÍDAS_T</p>
          </div>
          <p className="text-4xl font-mono text-white mt-4 tracking-tighter">
            <span className="text-slate-500 mr-2">R$</span>{totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* Saldo / Lucro ou Prejuízo */}
        <div className={`p-8 rounded-none relative overflow-hidden group border-2 transition-all ${isProfit ? 'bg-[#050505] border-[#00ff9d]' : 'bg-[#050505] border-[#ff3366]'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
            <Wallet size={64} className={isProfit ? 'text-[#00ff9d]' : 'text-[#ff3366]'} />
          </div>
          <div className="flex justify-between items-start mb-6">
            <span className={`text-[10px] font-mono font-bold uppercase tracking-[0.2em] px-2 py-1 rounded-none border ${isProfit ? 'bg-[#00ff9d]/20 border-[#00ff9d] text-[#00ff9d]' : 'bg-[#ff3366]/20 border-[#ff3366] text-[#ff3366]'}`}>
              {isProfit ? 'STATUS:LUCRO' : 'STATUS:PREJUÍZO'}
            </span>
          </div>
          <p className={`text-xs font-mono uppercase tracking-[0.2em] mb-1 ${isProfit ? 'text-[#00ff9d]/70' : 'text-[#ff3366]/70'}`}>NET_BALANCE</p>
          <p className={`text-5xl font-mono tracking-tighter ${isProfit ? 'text-[#00ff9d]' : 'text-[#ff3366]'}`}>
            {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Gráfico de Movimentações */}
      <div className="bg-[#050505] border-2 border-slate-800 p-8 rounded-none relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4 border-b-2 border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <BarChart3 size={24} className="text-white" />
            <div>
              <h3 className="font-mono text-xl text-white tracking-widest uppercase">SYS.GRAFICO_MENSAL</h3>
            </div>
          </div>
          
          <div className="flex gap-4 items-center bg-[#050505] p-2 rounded-none border-2 border-slate-800">
            <div className="flex items-center gap-2 px-3">
              <div className="w-3 h-3 rounded-none bg-[#00ff9d]" />
              <span className="text-xs font-mono text-white uppercase tracking-widest">IN</span>
            </div>
            <div className="flex items-center gap-2 px-3">
              <div className="w-3 h-3 rounded-none bg-[#ff3366]" />
              <span className="text-xs font-mono text-white uppercase tracking-widest">OUT</span>
            </div>
          </div>
        </div>
        
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={0}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" vertical={true} />
              <XAxis 
                dataKey="month" 
                axisLine={{ stroke: '#334155', strokeWidth: 2 }} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }} 
                dy={12}
              />
              <YAxis 
                axisLine={{ stroke: '#334155', strokeWidth: 2 }} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(value) => value > 0 ? `${value}` : '0'}
              />
              <Tooltip 
                cursor={{ fill: '#1e293b', opacity: 0.5 }}
                contentStyle={{ 
                  backgroundColor: '#050505', 
                  borderColor: '#334155', 
                  borderWidth: '2px',
                  borderRadius: '0px', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  color: '#00ff9d'
                }}
                itemStyle={{ padding: '4px 0' }}
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Bar dataKey="entrada" name="IN" fill="#00ff9d" radius={[0, 0, 0, 0]} barSize={24} />
              <Bar dataKey="saida" name="OUT" fill="#ff3366" radius={[0, 0, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-[#050505] border-2 border-slate-800 rounded-none overflow-hidden relative z-10">
        <div className="p-6 border-b-2 border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="font-mono text-xl text-white tracking-widest uppercase">DATA_TABLE.LOGS</h3>
          <div className="flex gap-4 text-xs font-mono text-slate-500 uppercase tracking-widest overflow-x-auto">
            {['All', 'Entrada', 'Saída'].map(type => (
              <span 
                key={type}
                onClick={() => setFilterType(type as any)}
                className={`cursor-pointer px-3 py-1 border-2 transition-colors ${filterType === type ? 'text-white border-white bg-slate-900' : 'border-transparent hover:text-slate-300 hover:border-slate-800'}`}
              >
                [{type === 'All' ? '*' : type}]
              </span>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="uppercase text-slate-500 tracking-[0.2em] bg-slate-900/50 border-b-2 border-slate-800">
                <th className="px-6 py-4 font-normal">DATA</th>
                <th className="px-6 py-4 font-normal">TIPO</th>
                <th className="px-6 py-4 font-normal">LOG / CAT</th>
                <th className="px-6 py-4 text-right font-normal">VALOR</th>
                <th className="px-6 py-4 text-right font-normal">CMD</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-800">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="group hover:bg-slate-900/50 transition-colors">
                  <td className="px-6 py-4 text-slate-400">{t.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] tracking-widest uppercase border ${t.type === 'Entrada' ? 'text-[#00ff9d] border-[#00ff9d]' : 'text-[#ff3366] border-[#ff3366]'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-white">{t.reason}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{t.category}</span>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right ${t.type === 'Entrada' ? 'text-[#00ff9d]' : 'text-[#ff3366]'}`}>
                    {t.type === 'Entrada' ? '+' : '-'} {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => removeTransaction(t.id)} className="p-2 border border-transparent hover:border-[#ff3366] hover:text-[#ff3366] transition-colors text-slate-500">
                      <X size={16} />
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
                    <span className="text-sm font-bold text-[#3b82f6] uppercase">{t.category}</span>
                  </div>
                </div>
                <button onClick={() => removeTransaction(t.id)} className="p-2 text-slate-200 hover:text-[#f43f5e]"><Trash2 size={16} /></button>
              </div>
              <div className="flex justify-between items-center bg-[#0f172a] p-3 rounded-xl border border-[#334155]">
                <span className="text-sm font-black text-[#475569] uppercase">Valor Total</span>
                <span className={`text-lg font-black ${t.type === 'Entrada' ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>
                  {t.type === 'Entrada' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center text-slate-200 font-medium opacity-40 italic">
              Nenhuma transação registrada.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdding(false)} className="absolute inset-0 bg-[#050505]/90 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#050505] border-2 border-slate-700 p-8 rounded-none shadow-2xl font-mono"
            >
              <div className="flex justify-between items-center mb-8 border-b-2 border-slate-700 pb-4">
                <h3 className="text-xl text-white uppercase tracking-widest">INPUT_DATA</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white transition-colors border border-transparent hover:border-white p-1">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddTransaction} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <label className="relative cursor-pointer group">
                    <input type="radio" name="type" value="Entrada" defaultChecked className="hidden peer" />
                    <div className="flex items-center justify-center gap-2 py-3 border-2 border-slate-700 peer-checked:bg-[#00ff9d] peer-checked:border-[#00ff9d] peer-checked:text-black text-slate-400 transition-all">
                      <span className="text-xs uppercase tracking-widest font-bold">IN</span>
                    </div>
                  </label>
                  <label className="relative cursor-pointer group">
                    <input type="radio" name="type" value="Saída" className="hidden peer" />
                    <div className="flex items-center justify-center gap-2 py-3 border-2 border-slate-700 peer-checked:bg-[#ff3366] peer-checked:border-[#ff3366] peer-checked:text-white text-slate-400 transition-all">
                      <span className="text-xs uppercase tracking-widest font-bold">OUT</span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">VALOR (R$)</label>
                    <input required name="amount" type="number" step="0.01" placeholder="0.00" className="w-full bg-[#0a0a0a] border-2 border-slate-700 rounded-none px-4 py-3 text-white focus:border-[#00ff9d] outline-none text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest">DATA</label>
                    <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-[#0a0a0a] border-2 border-slate-700 rounded-none px-4 py-3 text-white focus:border-[#00ff9d] outline-none text-sm" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">MOTIVO</label>
                  <input required name="reason" type="text" placeholder="LOG_DESC..." className="w-full bg-[#0a0a0a] border-2 border-slate-700 rounded-none px-4 py-3 text-white focus:border-[#00ff9d] outline-none text-sm" />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest">CATEGORIA</label>
                  <select name="category" className="w-full bg-[#0a0a0a] border-2 border-slate-700 rounded-none px-4 py-3 text-white focus:border-[#00ff9d] outline-none text-sm appearance-none">
                    <option value="Venda de Aves">Venda de Aves</option>
                    <option value="Aquisição de Aves">Aquisição de Aves</option>
                    <option value="Ração/Alimentação">Ração/Alimentação</option>
                    <option value="Medicamentos">Medicamentos</option>
                    <option value="Infraestrutura">Infraestrutura</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-4 bg-white text-black border-2 border-white font-bold text-sm uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                    [ EXECUTAR ]
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
