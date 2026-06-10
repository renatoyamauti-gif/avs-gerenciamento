import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Egg, Trash2, X, Loader2, Edit2 } from 'lucide-react';
import { dbService } from '../lib/dbService';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface CollectionEntry {
  id: string;
  day: number;
  month: number;
  year: number;
  count: number;
  pairs: string[];
  baia?: string;
  raca?: string;
  condition?: string;
}

export default function EggCollection() {
  const [logs, setLogs] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [uniqueBaias, setUniqueBaias] = useState<string[]>([]);
  const [uniqueRacas, setUniqueRacas] = useState<string[]>([]);
  const [originType, setOriginType] = useState<'baia' | 'raca'>('baia');
  const [incubators, setIncubators] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const currentDate = new Date();
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  const { eggsByBaia, eggsByRaca, baiaEstimates, racaEstimates } = useMemo(() => {
    const baiaMap: { [key: string]: number } = {};
    const racaMap: { [key: string]: number } = {};

    const baiaTotalMap: { [key: string]: number } = {};
    const baiaDaysMap: { [key: string]: Set<string> } = {};
    const racaTotalMap: { [key: string]: number } = {};
    const racaDaysMap: { [key: string]: Set<string> } = {};

    (logs || []).forEach(log => {
      const dateKey = `${log.year}-${log.month}-${log.day}`;
      if (log.baia && log.count) {
        log.baia.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((name: string) => {
          baiaMap[name] = (baiaMap[name] || 0) + log.count;
          baiaTotalMap[name] = (baiaTotalMap[name] || 0) + log.count;
          if (!baiaDaysMap[name]) baiaDaysMap[name] = new Set();
          baiaDaysMap[name].add(dateKey);
        });
      }
      if (log.raca && log.count) {
        log.raca.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((name: string) => {
          racaMap[name] = (racaMap[name] || 0) + log.count;
          racaTotalMap[name] = (racaTotalMap[name] || 0) + log.count;
          if (!racaDaysMap[name]) racaDaysMap[name] = new Set();
          racaDaysMap[name].add(dateKey);
        });
      }
    });

    // Subtract incubated eggs from breed/baia maps
    (incubators || []).forEach(inc => {
      (inc.incubator_batches || []).forEach((batch: any) => {
        if (batch.baia_details) {
          Object.entries(batch.baia_details).forEach(([bName, qty]) => {
            const q = Number(qty) || 0;
            if (baiaMap[bName] !== undefined) {
              baiaMap[bName] -= q;
            } else {
              baiaMap[bName] = -q;
            }
          });
        }
        if (batch.raca_details) {
          Object.entries(batch.raca_details).forEach(([breed, qty]) => {
            const q = Number(qty) || 0;
            if (racaMap[breed] !== undefined) {
              racaMap[breed] -= q;
            } else {
              racaMap[breed] = -q;
            }
          });
        }
      });
    });

    // Subtract sold eggs from orders (status !== 'Cancelado')
    (orders || []).forEach(ord => {
      if (ord.status !== 'Cancelado') {
        const orderItems = ord.items && Array.isArray(ord.items) && ord.items.length > 0
          ? ord.items
          : [{ origem_type: ord.origem_type || 'raca', raca: ord.raca || '', baia: ord.baia || '', quantity: ord.quantity || 0 }];

        orderItems.forEach((item: any) => {
          const qty = Number(item.quantity) || 0;
          if (qty > 0) {
            const isRaca = (item.origem_type || 'raca') === 'raca';
            if (isRaca && item.raca) {
              const breed = item.raca;
              if (racaMap[breed] !== undefined) {
                racaMap[breed] -= qty;
              } else {
                racaMap[breed] = -qty;
              }
            } else if (!isRaca && item.baia) {
              const bName = item.baia;
              if (baiaMap[bName] !== undefined) {
                baiaMap[bName] -= qty;
              } else {
                baiaMap[bName] = -qty;
              }
            }
          }
        });
      }
    });

    const ebBaia = Object.entries(baiaMap).map(([name, count]) => ({ name, count: Math.max(0, count) })).sort((a, b) => b.count - a.count);
    const ebRaca = Object.entries(racaMap).map(([name, count]) => ({ name, count: Math.max(0, count) })).sort((a, b) => b.count - a.count);

    const bEst = Object.entries(baiaTotalMap).map(([name, total]) => {
      const days = baiaDaysMap[name].size || 1;
      const dailyAvg = total / days;
      const monthlyEst = Math.round(dailyAvg * 30);
      return { name, estimativa: monthlyEst };
    }).sort((a, b) => b.estimativa - a.estimativa);

    const rEst = Object.entries(racaTotalMap).map(([name, total]) => {
      const days = racaDaysMap[name].size || 1;
      const dailyAvg = total / days;
      const monthlyEst = Math.round(dailyAvg * 30);
      return { name, estimativa: monthlyEst };
    }).sort((a, b) => b.estimativa - a.estimativa);

    return {
      eggsByBaia: ebBaia,
      eggsByRaca: ebRaca,
      baiaEstimates: bEst,
      racaEstimates: rEst
    };
  }, [logs, incubators, orders]);

  useEffect(() => {
    loadLogs();
    loadBaias();
    loadRacas();
  }, []);

  async function loadBaias() {
    try {
      const birds = await dbService.getBirds();
      const baias = Array.from(new Set(birds.map(b => b.baia).filter(Boolean))) as string[];
      setUniqueBaias(baias);
    } catch (error) {
      console.error('Erro ao carregar baias:', error);
    }
  }

  async function loadRacas() {
    try {
      const racasData = await dbService.getRacas();
      const racasNames = (racasData || []).map((r: any) => r.name).filter(Boolean);
      setUniqueRacas(racasNames);
    } catch (error) {
      console.error('Erro ao carregar raças:', error);
    }
  }

  async function loadLogs() {
    try {
      const [logsData, incubatorsData, ordersData] = await Promise.all([
        dbService.getEggLogs(),
        dbService.getIncubators(),
        dbService.getOrders()
      ]);
      setLogs(logsData || []);
      setIncubators(incubatorsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error('Erro ao carregar logs e estoque de ovos:', error);
    } finally {
      setViewDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));
      setLoading(false);
    }
  }

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const totalMonthly = logs
    .filter(l => l.month === viewDate.getMonth() + 1 && l.year === viewDate.getFullYear())
    .reduce((acc, curr) => acc + curr.count, 0);

  const handleUpdateDay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (editingDay === null) return;

    const submitEvent = e.nativeEvent as SubmitEvent;
    const submitter = submitEvent.submitter as HTMLButtonElement | null;
    const shouldClose = submitter?.getAttribute('data-close') === 'true';

    const form = e.currentTarget;
    const formData = new FormData(form);
    const count = parseInt(formData.get('count') as string) || 0;
    if (count <= 0) return; // Prevent empty/zero submits

    const pairsString = formData.get('pairs') as string;
    const pairs = pairsString ? pairsString.split(',').map(p => p.trim()).filter(p => p !== '') : [];
    const baia = formData.get('baia') as string;
    const raca = formData.get('raca') as string;
    const condition = formData.get('condition') as string || 'Normal';

    const logData: any = {
      day: editingDay,
      month: viewDate.getMonth() + 1,
      year: viewDate.getFullYear(),
      count,
      pairs,
      baia: originType === 'baia' ? baia : null,
      raca: originType === 'raca' ? raca : null,
      condition
    };
    
    if (editingLogId) {
      logData.id = editingLogId;
    } else {
      const existingLogs = logs.filter(l => 
        l.day === editingDay && 
        l.month === viewDate.getMonth() + 1 && 
        l.year === viewDate.getFullYear()
      );
      
      if (existingLogs.length > 0) {
        const existing = existingLogs[0];
        logData.id = existing.id;
        logData.count = existing.count + count;
        
        if (existing.pairs && existing.pairs.length > 0) {
          logData.pairs = Array.from(new Set([...existing.pairs, ...pairs]));
        }
        
        if (originType === 'baia') {
          if (existing.baia && baia && !existing.baia.includes(baia)) {
             logData.baia = `${existing.baia}, ${baia}`;
          } else {
             logData.baia = baia || existing.baia;
          }
          logData.raca = existing.raca;
        } else {
          if (existing.raca && raca && !existing.raca.includes(raca)) {
             logData.raca = `${existing.raca}, ${raca}`;
          } else {
             logData.raca = raca || existing.raca;
          }
          logData.baia = existing.baia;
        }

        // Aggregate condition
        if (existing.condition && condition && !existing.condition.includes(condition)) {
           logData.condition = `${existing.condition}, ${condition}`;
        } else {
           logData.condition = condition || existing.condition;
        }
      }
    }

    try {
      await dbService.saveEggLog(logData);
      await loadLogs();
      setEditingLogId(null);
      form.reset(); // Keeps modal open but clears form for the next baia
      
      if (shouldClose) {
        setEditingDay(null);
      }
    } catch (error) {
      alert('Erro ao salvar coleta: ' + error);
    }
  };

  const removeEntry = async (id: string) => {
    if (!confirm('Tem certeza que quer excluir/deletar esta coleta? Pois será irreversível.')) return;
    try {
      await dbService.deleteEggLog(id);
      await loadLogs();
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  const currentDayLogs = logs.filter(l => 
    l.day === editingDay && 
    l.month === viewDate.getMonth() + 1 && 
    l.year === viewDate.getFullYear()
  );

  const logToEdit = logs.find(l => l.id === editingLogId);

  useEffect(() => {
    if (logToEdit) {
      if (logToEdit.raca) {
        setOriginType('raca');
      } else {
        setOriginType('baia');
      }
    } else {
      setOriginType('baia');
    }
  }, [editingLogId, logToEdit]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#2563EB]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Coletas...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-8"
    >
      <section className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight">Coleta de Ovos</h2>
          <p className="mt-1 text-slate-500 font-medium text-sm">Registro diário e monitoramento de incubação.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-slate-100 px-6 py-4 rounded-3xl flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <Egg className="text-[#2563EB] size-8" />
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total este mês</p>
              <p className="text-2xl font-black text-[#1F2937] font-headline">{totalMonthly} Ovos</p>
            </div>
          </div>
          <button 
            onClick={() => setEditingDay(new Date().getDate())}
            className="bg-[#2563EB] text-white p-5 rounded-3xl shadow-md hover:bg-[#1D4ED8] hover:scale-105 active:scale-95 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center"
          >
            Adicionar Coleta
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <CalendarIcon className="text-[#2563EB] size-6" />
              <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight uppercase">
                {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-4">{d}</div>
            ))}
            {/* Pad calendar for first day of month if needed - simplification here, just showing days */}
            {daysArray.map(day => {
              const dayLogs = logs.filter(l => 
                l.day === day && 
                l.month === viewDate.getMonth() + 1 && 
                l.year === viewDate.getFullYear()
              );
              const totalOvos = dayLogs.reduce((acc, curr) => acc + curr.count, 0);

              const isToday = day === currentDate.getDate() && 
                             viewDate.getMonth() === currentDate.getMonth() && 
                             viewDate.getFullYear() === currentDate.getFullYear();
                             
              return (
                <div 
                  key={day} 
                  onClick={() => setEditingDay(day)}
                  className={`
                    aspect-square rounded-2xl p-2 relative flex flex-col justify-between transition-all cursor-pointer group
                    ${dayLogs.length > 0 ? 'bg-[#EFF6FF] border border-[#DBEAFE]' : 'bg-[#F8FAFC] border border-transparent hover:border-slate-200'}
                    ${isToday ? 'ring-2 ring-[#2563EB] ring-offset-2' : ''}
                  `}
                >
                  <span className={`text-sm ${isToday ? 'font-black text-[#2563EB]' : 'font-bold'} ${dayLogs.length > 0 && !isToday ? 'text-[#2563EB]' : (!isToday ? 'text-slate-500' : '')}`}>
                    {day}
                  </span>
                  {dayLogs.length > 0 && (
                    <div className="flex flex-col items-center">
                      <div className="bg-[#2563EB] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm z-10">{totalOvos}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Recordings */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col shadow-[0_2px_10px_rgba(0,0,0,0.02)] max-h-[600px] overflow-hidden">
          <h3 className="text-xl font-bold text-[#1F2937] mb-8 tracking-tight">Últimos Registros</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {logs.slice(0, 10).map((log, i) => (
              <motion.div 
                key={log.id} 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => {
                  setViewDate(new Date(log.year, log.month - 1, 1));
                  setEditingDay(log.day);
                }}
                className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100 group hover:border-[#2563EB]/50 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{log.day}/{log.month}/{log.year}</div>
                  <div className="flex items-center gap-2">
                    {log.baia && (
                      <div className="bg-[#F3F4F6] text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-slate-200">
                        Baia: {log.baia}
                      </div>
                    )}
                    {log.raca && (
                      <div className="bg-[#FAF5FF] text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-purple-200">
                        Raça: {log.raca}
                      </div>
                    )}
                    {log.condition && log.condition !== 'Normal' && (
                      <div className="bg-[#FEF2F2] text-[#EF4444] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border border-[#FECACA]">
                        {log.condition}
                      </div>
                    )}
                    <div className="bg-[#DBEAFE] text-[#2563EB] text-xs font-bold px-2 py-0.5 rounded-full uppercase whitespace-nowrap">{log.count} Ovos</div>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(log.pairs || []).map(p => (
                    <span key={p} className="text-[10px] font-bold text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">{p}</span>
                  ))}
                </div>
              </motion.div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-10 opacity-50 text-slate-400 font-medium">
                Nenhuma coleta registrada
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Eggs by Baia and Raça Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ovos por Baia */}
        <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] mb-6 flex items-center gap-3">
            <div className="bg-[#EFF6FF] p-2 rounded-2xl">
              <Egg size={24} className="text-[#2563EB]" />
            </div>
            Ovos por Baia
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {eggsByBaia.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#EFF6FF] text-[#2563EB] font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-bold text-[#1F2937]">{item.name}</span>
                </div>
                <span className="bg-[#2563EB] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.count} {item.count === 1 ? 'Ovo' : 'Ovos'}
                </span>
              </div>
            ))}
            {eggsByBaia.length === 0 && (
              <div className="text-center py-10 opacity-50 text-slate-400 font-medium">
                Nenhum registro de ovos por baia
              </div>
            )}
          </div>
        </div>

        {/* Ovos por Raça */}
        <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937] mb-6 flex items-center gap-3">
            <div className="bg-[#FAF5FF] p-2 rounded-2xl">
              <Egg size={24} className="text-[#8B5CF6]" />
            </div>
            Ovos por Raça
          </h3>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {eggsByRaca.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl bg-[#F8FAFC] border border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#FAF5FF] text-[#8B5CF6] font-bold text-sm">
                    {index + 1}
                  </span>
                  <span className="font-bold text-[#1F2937]">{item.name}</span>
                </div>
                <span className="bg-[#8B5CF6] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  {item.count} {item.count === 1 ? 'Ovo' : 'Ovos'}
                </span>
              </div>
            ))}
            {eggsByRaca.length === 0 && (
              <div className="text-center py-10 opacity-50 text-slate-400 font-medium">
                Nenhum registro de ovos por raça
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estimativa Mensal de Ovos Section */}
      <div className="bg-white border border-slate-100 p-6 sm:p-10 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1F2937]">Estimativa Mensal de Produção</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Projeção de produção de ovos para os próximos 30 dias com base na média das coletas diárias registradas.
            </p>
          </div>
          <div className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Estimativa: Média Diária × 30 dias
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfico Baias */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Projeção por Baia (Ovos / Mês)</h4>
            <div className="h-[250px] w-full">
              {baiaEstimates.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={baiaEstimates} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} Ovos / Mês`, 'Estimativa']}
                    />
                    <Bar dataKey="estimativa" fill="#2563EB" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="estimativa" position="top" fill="#64748B" fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">Nenhuma projeção por baia disponível</div>
              )}
            </div>
          </div>

          {/* Gráfico Raças */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Projeção por Raça (Ovos / Mês)</h4>
            <div className="h-[250px] w-full">
              {racaEstimates.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={racaEstimates} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: '500' }} />
                    <Tooltip 
                      cursor={{ fill: '#F8FAFC' }}
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${value} Ovos / Mês`, 'Estimativa']}
                    />
                    <Bar dataKey="estimativa" fill="#8B5CF6" radius={[6, 6, 0, 0]}>
                      <LabelList dataKey="estimativa" position="top" fill="#64748B" fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm font-medium">Nenhuma projeção por raça disponível</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-2.5 text-slate-400 text-xs font-medium leading-relaxed">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold shrink-0">!</span>
          <p>
            <strong>Observação Importante:</strong> Este gráfico apresenta uma estimativa projetada para 30 dias com base no histórico das coletas diárias inseridas no sistema. Os valores reais podem variar de acordo com fatores climáticos, alimentação, ciclo reprodutivo e manejo das aves.
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDay !== null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setEditingDay(null)}
              className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#1F2937]">Coleta: Dia {editingDay}</h3>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingDay(null);
                    setEditingLogId(null);
                  }}
                  className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {currentDayLogs.length > 0 && (
                <div className="mb-6 space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {currentDayLogs.map(log => (
                    <div key={log.id} className="flex justify-between items-center bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {log.baia && (
                            <span className="text-[10px] font-bold bg-[#E0E7FF] text-[#2563EB] px-2 py-0.5 rounded-md uppercase border border-[#DBEAFE]">Baia: {log.baia}</span>
                          )}
                          {log.raca && (
                            <span className="text-[10px] font-bold bg-[#F3E8FF] text-[#8B5CF6] px-2 py-0.5 rounded-md uppercase border border-[#E9D5FF]">Raça: {log.raca}</span>
                          )}
                          <span className="text-sm font-black text-[#1F2937]">{log.count} Ovos</span>
                          {log.condition && log.condition !== 'Normal' && (
                            <span className="text-[10px] font-bold bg-[#FEF2F2] text-[#EF4444] px-2 py-0.5 rounded-md border border-[#FECACA] uppercase">{log.condition}</span>
                          )}
                        </div>
                        {log.pairs && log.pairs.length > 0 && (
                          <div className="text-[10px] font-bold text-slate-500 uppercase">Casais: {log.pairs.join(', ')}</div>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setEditingLogId(log.id)}
                          className="p-2 text-slate-400 hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => removeEntry(log.id)}
                          className="p-2 text-slate-400 hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form key={editingLogId || 'new'} onSubmit={handleUpdateDay} className="space-y-6 pt-6 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-[#2563EB] uppercase tracking-widest">
                    {editingLogId ? 'Editar Coleta' : 'Adicionar Nova Coleta'}
                  </h4>
                  {editingLogId && (
                    <button type="button" onClick={() => setEditingLogId(null)} className="text-xs text-slate-500 underline hover:text-slate-700">Cancelar Edição</button>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quantidade de Ovos</label>
                  <div className="flex items-center gap-4">
                    <input 
                      required 
                      name="count" 
                      type="number" 
                      min="1"
                      defaultValue={logToEdit?.count || ""} 
                      className="flex-1 bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 outline-none text-center text-xl font-bold transition-all" 
                    />
                    <Egg className="text-[#2563EB]" size={32} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Condição dos Ovos</label>
                  <select 
                    name="condition" 
                    defaultValue={logToEdit?.condition || "Normal"} 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Sujo">Sujo</option>
                    <option value="Quebrado">Quebrado</option>
                    <option value="Casca Mole">Casca Mole</option>
                    <option value="Pequeno">Pequeno</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Origem da Coleta</label>
                  <div className="flex gap-4">
                    {['baia', 'raca'].map(option => (
                      <label key={option} className="flex-1 flex items-center justify-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-2xl py-3 cursor-pointer transition-all hover:border-[#2563EB] has-[:checked]:bg-[#EFF6FF] has-[:checked]:border-[#2563EB] has-[:checked]:text-[#2563EB] text-slate-500">
                        <input 
                          type="radio" 
                          name="origin_type" 
                          value={option} 
                          checked={originType === option}
                          onChange={() => setOriginType(option as 'baia' | 'raca')}
                          className="hidden" 
                        />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {option === 'baia' ? 'Por Baia' : 'Por Raça'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {originType === 'baia' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Baia / Grupo de Origem</label>
                    <input 
                      name="baia" 
                      list="egg-baias-list"
                      defaultValue={logToEdit?.baia || ""} 
                      type="text" 
                      placeholder="Ex: Baia 01" 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                    />
                    <datalist id="egg-baias-list">
                      {uniqueBaias.map(baia => (
                        <option key={baia} value={baia} />
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Raça de Origem</label>
                    <input 
                      name="raca" 
                      list="egg-racas-list"
                      defaultValue={logToEdit?.raca || ""} 
                      type="text" 
                      placeholder="Ex: GSB, Galo Índio" 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                    />
                    <datalist id="egg-racas-list">
                      {uniqueRacas.map(raca => (
                        <option key={raca} value={raca} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Casais (Separe por vírgula)</label>
                  <textarea 
                    name="pairs" 
                    defaultValue={logToEdit?.pairs?.join(', ') || ""}
                    placeholder="Ex: MC-04, AR-12, CN-14"
                    className="w-full h-24 bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-sm text-[#1F2937] focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 outline-none resize-none transition-all"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    {editingLogId ? 'Salvar Alterações' : 'Adicionar Coleta'}
                  </button>
                  <button 
                    type="submit" 
                    data-close="true"
                    className="flex-1 px-6 py-4 bg-[#10B981] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#059669] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Atualizar
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
