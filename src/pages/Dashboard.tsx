import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Bird, Egg, Wallet, Hash, Thermometer, TrendingUp, TrendingDown, Activity, Loader2, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dbService } from '../lib/dbService';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [birdCount, setBirdCount] = useState(0);
  const [eggCount, setEggCount] = useState(0);
  const [incubatorEggs, setIncubatorEggs] = useState(0);
  const [nextHatch, setNextHatch] = useState<{ days: number, hours: number, finished: boolean } | null>(null);
  const [financeSummary, setFinanceSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      // Load Birds
      const birds = await dbService.getBirds();
      setBirdCount(birds?.length || 0);

      // Load Eggs
      const eggLogs = await dbService.getEggLogs();
      const totalEggs = (eggLogs || []).reduce((acc, curr) => acc + curr.count, 0);
      setEggCount(totalEggs);

      // Load Incubators
      const incubators = await dbService.getIncubators();
      let totalIncEggs = 0;
      let minDiff = Infinity;
      let nearestStatus = null;

      (incubators || []).forEach(inc => {
        (inc.incubator_batches || []).forEach(batch => {
          totalIncEggs += batch.count;
          
          const start = new Date(batch.start_date).getTime();
          const end = start + 21 * 24 * 60 * 60 * 1000;
          const now = new Date().getTime();
          const diff = end - now;

          if (diff < minDiff) {
            minDiff = diff;
            if (diff <= 0) {
              nearestStatus = { days: 0, hours: 0, finished: true };
            } else {
              nearestStatus = {
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                finished: false
              };
            }
          }
        });
      });
      setIncubatorEggs(totalIncEggs);
      setNextHatch(nearestStatus);

      // Load Finance
      const transactions = await dbService.getTransactions();
      const income = (transactions || []).filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.amount, 0);
      const expense = (transactions || []).filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.amount, 0);
      setFinanceSummary({ income, expense, balance: income - expense });

      // Build simple chart data from transactions
      const months: { [key: string]: number } = {};
      (transactions || []).forEach(t => {
        const date = new Date(t.date);
        const month = date.toLocaleDateString('pt-BR', { month: 'short' });
        months[month] = (months[month] || 0) + (t.type === 'Entrada' ? t.amount : -t.amount);
      });
      setChartData(Object.entries(months).map(([name, balance]) => ({ name, balance })));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#3b82f6]" size={48} />
        <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">Carregando Painel...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="space-y-10 pb-20"
    >
      {/* Welcome Section */}
      <section className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic uppercase">PAINEL DE CONTROLE</h2>
          <p className="text-[#94a3b8] font-medium text-sm">Resumo operacional do sistema de gerenciamento.</p>
        </div>
      </section>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Quantidade de Aves */}
        <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] relative overflow-hidden group shadow-lg hover:border-[#3b82f6]/50 transition-all">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <Bird size={120} className="text-[#3b82f6]" />
          </div>
          <div className="flex items-start justify-between mb-8">
            <div className="bg-[#3b82f6]/10 p-3 rounded-2xl border border-[#3b82f6]/20 shadow-sm">
              <Bird size={28} className="text-[#3b82f6]" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#475569]">Plantel Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black font-headline tracking-tighter text-white">{birdCount}</p>
            <span className="text-xs font-bold text-[#475569]">AVES</span>
          </div>
        </div>

        {/* Coleta de Ovos (Mês) */}
        <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] relative overflow-hidden group shadow-lg hover:border-[#f43f5e]/50 transition-all">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <Egg size={120} className="text-[#f43f5e]" />
          </div>
          <div className="flex items-start justify-between mb-8">
            <div className="bg-[#f43f5e]/10 p-3 rounded-2xl border border-[#f43f5e]/20 shadow-sm">
              <Egg size={28} className="text-[#f43f5e]" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#475569]">Ovos Coletados</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black font-headline tracking-tighter text-white">{eggCount}</p>
            <span className="text-xs font-bold text-[#475569]">TOTAL</span>
          </div>
        </div>

        {/* Ovos em Incubação */}
        <div className="bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] relative overflow-hidden group shadow-lg hover:border-[#f59e0b]/50 transition-all">
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <Thermometer size={120} className="text-[#f59e0b]" />
          </div>
          <div className="flex items-start justify-between mb-8">
            <div className="bg-[#f59e0b]/10 p-3 rounded-2xl border border-[#f59e0b]/20 shadow-sm">
              <Activity size={28} className="text-[#f59e0b]" />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#475569]">Em Incubação</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-black font-headline tracking-tighter text-white">{incubatorEggs}</p>
            <span className="text-xs font-bold text-[#475569]">UNIDADES</span>
          </div>
        </div>

        {/* Saldo Financeiro */}
        <div className={`border p-8 rounded-[32px] relative overflow-hidden group shadow-lg transition-all ${financeSummary.balance >= 0 ? 'bg-[#10b981]/5 border-[#10b981]/30 hover:border-[#10b981]/50' : 'bg-[#f43f5e]/5 border-[#f43f5e]/30 hover:border-[#f43f5e]/50'}`}>
          <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-700">
            <Wallet size={120} className={financeSummary.balance >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'} />
          </div>
          <div className="flex items-start justify-between mb-8">
            <div className={`p-3 rounded-2xl border shadow-sm ${financeSummary.balance >= 0 ? 'bg-[#10b981]/10 border-[#10b981]/20' : 'bg-[#f43f5e]/10 border-[#f43f5e]/20'}`}>
              <Wallet size={28} className={financeSummary.balance >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'} />
            </div>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1 text-[#475569]">Saldo Atual</p>
          <div className="flex items-baseline gap-1">
            <span className={`text-[10px] font-bold ${financeSummary.balance >= 0 ? 'text-[#10b981]' : 'text-[#f43f5e]'}`}>R$</span>
            <p className={`text-4xl font-black font-headline tracking-tighter ${financeSummary.balance >= 0 ? 'text-white' : 'text-[#f43f5e]'}`}>{financeSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-[#334155] p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-headline tracking-tight italic">Performance Financeira</h3>
              <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Evolução do Fluxo de Caixa</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} 
                  dy={10}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-[#1e293b] border border-[#334155] p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-sm">
          <h3 className="text-xl sm:text-2xl font-bold text-white font-headline tracking-tight mb-8 italic">Próximos Eventos</h3>
          <div className="space-y-6">
             {nextHatch ? (
                <div className={`p-6 rounded-[24px] border ${nextHatch.finished ? 'bg-[#10b981]/10 border-[#10b981]/30' : 'bg-[#f59e0b]/10 border-[#f59e0b]/30'}`}>
                   <div className="flex items-center gap-4 mb-4">
                      {nextHatch.finished ? (
                        <CheckCircle2 size={24} className="text-[#10b981]" />
                      ) : (
                        <Activity size={24} className="text-[#f59e0b] animate-pulse" />
                      )}
                      <div>
                        <p className="text-[10px] font-black text-[#475569] uppercase tracking-widest">Eclosão</p>
                        <h4 className={`font-bold tracking-tight ${nextHatch.finished ? 'text-[#10b981]' : 'text-white'}`}>
                          {nextHatch.finished ? 'Lote Pronto!' : 'Em Incubação'}
                        </h4>
                      </div>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-black font-headline tracking-tighter ${nextHatch.finished ? 'text-[#10b981]' : 'text-white'}`}>
                        {nextHatch.finished ? 'ECLOSÃO' : nextHatch.days}
                      </span>
                      {!nextHatch.finished && <span className="text-xs font-bold text-[#475569] uppercase">Dias</span>}
                   </div>
                </div>
             ) : (
                <div className="text-center py-10 opacity-20 flex flex-col items-center gap-2">
                   <Activity size={40} className="text-[#94a3b8]" />
                   <p className="text-xs font-medium">Sem eventos próximos</p>
                </div>
             )}

             <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0f172a] border border-[#334155]/30">
                   <div className="h-2 w-2 rounded-full bg-[#10b981]" />
                   <div className="flex-1">
                      <p className="text-[10px] font-bold text-[#475569] uppercase tracking-tighter">Status Geral</p>
                      <p className="text-xs font-bold text-white tracking-tight italic">Operacional: 100%</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
