import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Bird, Egg, Wallet, Hash, Thermometer, TrendingUp, TrendingDown, Activity, Loader2, CheckCircle2, Baby } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList } from 'recharts';
import { dbService } from '../lib/dbService';
import { calculateEggStock } from '../lib/stockHelper';
import { useTheme } from '../contexts/ThemeContext';

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [loading, setLoading] = useState(true);
  const [birdCount, setBirdCount] = useState(0);
  const [eggCount, setEggCount] = useState(0);
  const [incubatorEggs, setIncubatorEggs] = useState(0);
  const [nextHatch, setNextHatch] = useState<{ days: number, hours: number, finished: boolean } | null>(null);
  const [financeSummary, setFinanceSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [chickCount, setChickCount] = useState(0);
  const [eggsByBaia, setEggsByBaia] = useState<{ name: string; count: number }[]>([]);
  const [eggsByRaca, setEggsByRaca] = useState<{ name: string; count: number }[]>([]);
  const [baiaEstimates, setBaiaEstimates] = useState<{ name: string; estimativa: number }[]>([]);
  const [racaEstimates, setRacaEstimates] = useState<{ name: string; estimativa: number }[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      // Load all data in parallel
      const [birds, eggLogs, maternityRecords, incubators, transactions, orders, products] = await Promise.all([
        dbService.getBirds(),
        dbService.getEggLogs(),
        dbService.getMaternityRecords(),
        dbService.getIncubators(),
        dbService.getTransactions(),
        dbService.getOrders(),
        dbService.getProducts()
      ]);

      const activeBirds = (birds || []).filter(b => b.status !== 'Vendida' && b.status !== 'Óbito' && b.status !== 'Reservada');
      setBirdCount(activeBirds.length);

      const delivered = (orders || []).filter((o: any) => o.status === 'Entregue');
      setDeliveredOrders(delivered);

      const computedStock = calculateEggStock({
        eggLogs,
        incubators,
        orders,
        products,
        birds
      });

      // Set eggs by Baia and by Raça (using collected count)
      setEggsByBaia(Object.entries(computedStock.baias).map(([name, item]) => ({ name, count: item.collected })).sort((a, b) => b.count - a.count));
      setEggsByRaca(Object.entries(computedStock.racas).map(([name, item]) => ({ name, count: item.collected })).sort((a, b) => b.count - a.count));

      // Calculate total available egg stock
      const totalCollected = (eggLogs || []).reduce((acc, curr) => acc + curr.count, 0);
      let totalIncubated = 0;
      (incubators || []).forEach(inc => {
        (inc.incubator_batches || []).forEach(batch => {
          totalIncubated += batch.count || 0;
        });
      });
      let totalSold = 0;
      (orders || []).forEach(ord => {
        if (ord.status !== 'Cancelado') {
          const orderItems = ord.items && Array.isArray(ord.items) && ord.items.length > 0
            ? ord.items
            : [{ origem_type: ord.origem_type || 'raca', raca: ord.raca || '', baia: ord.baia || '', quantity: ord.quantity || 0 }];

          orderItems.forEach((item: any) => {
            if (item.origem_type === 'embalagem') return;
            const qty = Number(item.quantity) || 0;
            if (qty > 0) {
              if (item.origem_type === 'produto' && item.product_id) {
                const prod = (products || []).find((p: any) => p.id === item.product_id);
                if (prod) {
                  const eggsPerUnit = Number(prod.eggs_per_unit) || 0;
                  totalSold += qty * eggsPerUnit;
                }
              } else {
                totalSold += (qty * 12) + (Number(item.gift_eggs) || 0);
              }
            }
          });
        }
      });
      const totalAvailable = Math.max(0, totalCollected - totalIncubated - totalSold);
      setEggCount(totalAvailable);

      // Projections (based purely on collection logs)
      const baiaTotalMap: { [key: string]: number } = {};
      const baiaDaysMap: { [key: string]: Set<string> } = {};
      const racaTotalMap: { [key: string]: number } = {};
      const racaDaysMap: { [key: string]: Set<string> } = {};

      (eggLogs || []).forEach(log => {
        const dateKey = `${log.year}-${log.month}-${log.day}`;
        if (log.baia) {
          log.baia.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((name: string) => {
            baiaTotalMap[name] = (baiaTotalMap[name] || 0) + log.count;
            if (!baiaDaysMap[name]) baiaDaysMap[name] = new Set();
            baiaDaysMap[name].add(dateKey);
          });
        }
        if (log.raca) {
          log.raca.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((name: string) => {
            racaTotalMap[name] = (racaTotalMap[name] || 0) + log.count;
            if (!racaDaysMap[name]) racaDaysMap[name] = new Set();
            racaDaysMap[name].add(dateKey);
          });
        }
      });

      const bEstimates = Object.entries(baiaTotalMap).map(([name, total]) => {
        const days = baiaDaysMap[name].size || 1;
        const dailyAvg = total / days;
        const monthlyEst = Math.round(dailyAvg * 30);
        return { name, estimativa: monthlyEst };
      }).sort((a, b) => b.estimativa - a.estimativa);

      const rEstimates = Object.entries(racaTotalMap).map(([name, total]) => {
        const days = racaDaysMap[name].size || 1;
        const dailyAvg = total / days;
        const monthlyEst = Math.round(dailyAvg * 30);
        return { name, estimativa: monthlyEst };
      }).sort((a, b) => b.estimativa - a.estimativa);

      setBaiaEstimates(bEstimates);
      setRacaEstimates(rEstimates);

      // Maternity count
      const activeChicks = (maternityRecords || []).filter(r => r.status !== 'Óbito' && r.status !== 'Transferido');
      setChickCount(activeChicks.length);

      // Incubator details
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

      // Finance summary
      const income = (transactions || []).filter(t => t.type === 'Entrada').reduce((acc, t) => acc + t.amount, 0);
      const expense = (transactions || []).filter(t => t.type === 'Saída').reduce((acc, t) => acc + t.amount, 0);
      setFinanceSummary({ income, expense, balance: income - expense });

      // Transactions chart
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
        <p className="text-slate-200 font-bold uppercase tracking-widest text-sm">Carregando Painel...</p>
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
          <h2 className="text-4xl font-bold text-[#1F2937] dark:text-slate-100 font-headline tracking-tighter italic uppercase font-black">PAINEL DE CONTROLE</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Resumo operacional do sistema de gerenciamento.</p>
        </div>
      </section>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        
        {/* Estoque de Ovos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#FFF7ED] dark:bg-amber-955/20 p-3 rounded-full">
              <Egg size={24} className="text-[#F59E0B] dark:text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Estoque de Ovos</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-2xl font-black text-[#1F2937] dark:text-slate-100">{eggCount}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Disponível</span>
              </div>
            </div>
          </div>
        </div>

        {/* Em Incubação */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#FEF2F2] dark:bg-red-955/20 p-3 rounded-full">
              <Activity size={24} className="text-[#EF4444] dark:text-red-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Em Incubação</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-2xl font-black text-[#1F2937] dark:text-slate-100">{incubatorEggs}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Unidades</span>
              </div>
            </div>
          </div>
        </div>

        {/* Saldo Atual */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#DCFCE7] dark:bg-green-955/20 p-3 rounded-full">
              <Wallet size={24} className="text-[#16A34A] dark:text-green-500" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Saldo Atual</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">R$</span>
                <p className="text-2xl font-black text-[#1F2937] dark:text-slate-100">{financeSummary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Maternidade (Pintinhos) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#EFF6FF] dark:bg-blue-955/20 p-3 rounded-full">
              <Baby size={24} className="text-[#2563EB] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Maternidade</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-2xl font-black text-[#1F2937] dark:text-slate-100">{chickCount}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Filhotes</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plantel Total */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-all hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-[#DBEAFE] dark:bg-blue-900/30 p-3 rounded-full">
              <Bird size={24} className="text-[#2563EB] dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Plantel Total</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <p className="text-2xl font-black text-[#1F2937] dark:text-slate-100">{birdCount}</p>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Aves</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-slate-100">Performance Financeira</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">Evolução do Fluxo de Caixa</p>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#F1F5F9"} vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }} 
                  dy={10}
                />
                <YAxis 
                  hide
                />
                <Tooltip 
                  cursor={{ fill: isDark ? '#1E293B' : '#F8FAFC' }}
                  contentStyle={{ 
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
                    borderColor: isDark ? '#334155' : '#E2E8F0', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: isDark ? '#F1F5F9' : '#1F2937'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#2563EB' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Real-time Alerts */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-slate-100 mb-8">Próximos Eventos</h3>
          <div className="space-y-6">
             {nextHatch ? (
                <div className={`p-6 rounded-2xl border ${nextHatch.finished ? 'bg-[#DCFCE7] border-[#bbf7d0] dark:bg-green-950/20 dark:border-green-900/40' : 'bg-[#FFF7ED] border-[#ffedd5] dark:bg-amber-955/20 dark:border-amber-900/40'}`}>
                   <div className="flex items-center gap-4 mb-4">
                      {nextHatch.finished ? (
                        <CheckCircle2 size={24} className="text-[#16A34A] dark:text-green-400" />
                      ) : (
                        <Activity size={24} className="text-[#F59E0B] dark:text-amber-500 animate-pulse" />
                      )}
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Eclosão</p>
                        <h4 className={`font-bold ${nextHatch.finished ? 'text-[#16A34A] dark:text-green-400' : 'text-[#F59E0B] dark:text-amber-500'}`}>
                           {nextHatch.finished ? 'Lote Pronto!' : 'Em Incubação'}
                        </h4>
                      </div>
                   </div>
                   <div className="flex items-baseline gap-1">
                      <span className={`text-3xl sm:text-4xl font-black ${nextHatch.finished ? 'text-[#16A34A] dark:text-green-400' : 'text-[#F59E0B] dark:text-amber-500'}`}>
                        {nextHatch.finished ? 'ECLOSÃO' : `${nextHatch.days}d ${nextHatch.hours}h`}
                      </span>
                      {!nextHatch.finished && <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase ml-1">Restantes</span>}
                   </div>
                </div>
             ) : (
                <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                   <Activity size={40} className="text-slate-300 dark:text-slate-650" />
                   <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Sem eventos próximos</p>
                </div>
             )}

              <div className="space-y-4">
                 <div className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                    <div className="h-2 w-2 rounded-full bg-[#16A34A]" />
                    <div className="flex-1">
                       <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status Geral</p>
                       <p className="text-sm font-bold text-[#1F2937] dark:text-slate-100">Operacional: 100%</p>
                     </div>
                 </div>
              </div>

              {/* Delivery Alerts */}
              {deliveredOrders.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest">Entregas Concluídas</p>
                  <div className="space-y-3">
                    {deliveredOrders.slice(0, 3).map((order) => (
                      <div key={order.id} className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-955/10 border border-emerald-100/30 dark:border-emerald-900/20 shadow-sm transition-colors">
                        <CheckCircle2 className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" size={16} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-850 dark:text-slate-200">
                            Pedido de {order.clients?.name || 'Cliente'} entregue
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                            {order.quantity} {order.quantity === 1 ? 'ovo' : 'ovos'} • {order.raca}
                          </p>
                          {order.tracking_code && (
                            <span className="inline-block text-[9px] font-mono font-bold text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-900/30 mt-1.5 shadow-sm">
                              {order.tracking_code}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Eggs by Baia and Raça Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ovos por Baia */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-slate-100 mb-6 flex items-center gap-3">
            <div className="bg-[#EFF6FF] dark:bg-blue-955/20 p-2 rounded-2xl">
              <Egg size={24} className="text-[#2563EB] dark:text-blue-400" />
            </div>
            Ovos por Baia
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {eggsByBaia.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-50 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EFF6FF] dark:bg-blue-955/40 text-[#2563EB] dark:text-blue-400 font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-slate-100">{item.name}</span>
                </div>
                <span className="bg-[#2563EB] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.count} {item.count === 1 ? 'Ovo' : 'Ovos'}
                </span>
              </div>
            ))}
            {eggsByBaia.length === 0 && (
              <div className="text-center py-10 opacity-50 text-slate-400 dark:text-slate-550 font-medium">
                Nenhum registro de ovos por baia
              </div>
            )}
          </div>
        </div>

        {/* Ovos por Raça */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-slate-100 mb-6 flex items-center gap-3">
            <div className="bg-[#FAF5FF] dark:bg-purple-955/20 p-2 rounded-2xl">
              <Egg size={24} className="text-[#8B5CF6] dark:text-purple-400" />
            </div>
            Ovos por Raça
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {eggsByRaca.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] dark:bg-slate-800 border border-slate-50 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF5FF] dark:bg-purple-955/40 text-[#8B5CF6] dark:text-purple-400 font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-bold text-[#1F2937] dark:text-slate-100">{item.name}</span>
                </div>
                <span className="bg-[#8B5CF6] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.count} {item.count === 1 ? 'Ovo' : 'Ovos'}
                </span>
              </div>
            ))}
            {eggsByRaca.length === 0 && (
              <div className="text-center py-10 opacity-50 text-slate-400 dark:text-slate-550 font-medium">
                Nenhum registro de ovos por raça
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estimativa Mensal de Ovos Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] dark:text-slate-100">Estimativa Mensal de Produção</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Projeção de produção de ovos para os próximos 30 dias com base na média das coletas diárias registradas.
            </p>
          </div>
          <div className="bg-[#EFF6FF] dark:bg-blue-955/40 text-[#2563EB] dark:text-blue-400 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Estimativa: Média Diária × 30 dias
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico Baias */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Projeção por Baia (Ovos / Mês)</h4>
            <div className="h-[250px] w-full">
              {baiaEstimates.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baiaEstimates} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#F1F5F9"} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <Tooltip 
                      cursor={{ fill: isDark ? '#1E293B' : '#F8FAFC' }}
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
                        borderColor: isDark ? '#334155' : '#E2E8F0', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        color: isDark ? '#F1F5F9' : '#1F2937'
                      }}
                      formatter={(value: any) => [`${value} Ovos / Mês`, 'Estimativa']}
                    />
                    <Bar dataKey="estimativa" fill="#2563EB" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="estimativa" position="top" fill={isDark ? '#94A3B8' : '#64748B'} fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-550 text-sm font-medium">Nenhuma projeção por baia disponível</div>
              )}
            </div>
          </div>

          {/* Gráfico Raças */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Projeção por Raça (Ovos / Mês)</h4>
            <div className="h-[250px] w-full">
              {racaEstimates.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={racaEstimates} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#334155" : "#F1F5F9"} vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <Tooltip 
                      cursor={{ fill: isDark ? '#1E293B' : '#F8FAFC' }}
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
                        borderColor: isDark ? '#334155' : '#E2E8F0', 
                        borderRadius: '12px', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        color: isDark ? '#F1F5F9' : '#1F2937'
                      }}
                      formatter={(value: any) => [`${value} Ovos / Mês`, 'Estimativa']}
                    />
                    <Bar dataKey="estimativa" fill="#8B5CF6" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="estimativa" position="top" fill={isDark ? '#94A3B8' : '#64748B'} fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-550 text-sm font-medium">Nenhuma projeção por raça disponível</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2.5 text-slate-400 dark:text-slate-400 text-xs font-medium leading-relaxed">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 font-bold shrink-0">!</span>
          <p>
            <strong>Observação Importante:</strong> Este gráfico apresenta uma estimativa projetada para 30 dias com base no histórico das coletas diárias inseridas no sistema. Os valores reais podem variar de acordo com fatores climáticos, alimentação, ciclo reprodutivo e manejo das aves.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
