import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Egg, Trash2, X, Loader2 } from 'lucide-react';
import { dbService } from '../lib/dbService';

interface CollectionEntry {
  id: string;
  day: number;
  month: number;
  year: number;
  count: number;
  pairs: string[];
}

export default function EggCollection() {
  const [logs, setLogs] = useState<CollectionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  
  const currentDate = new Date();
  const [viewDate, setViewDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1));

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    try {
      const data = await dbService.getEggLogs();
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao carregar logs de ovos:', error);
    } finally {
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

    const formData = new FormData(e.currentTarget);
    const count = parseInt(formData.get('count') as string) || 0;
    const pairsString = formData.get('pairs') as string;
    const pairs = pairsString ? pairsString.split(',').map(p => p.trim()).filter(p => p !== '') : [];

    const existingLog = logs.find(l => 
      l.day === editingDay && 
      l.month === viewDate.getMonth() + 1 && 
      l.year === viewDate.getFullYear()
    );

    const logData = {
      id: existingLog?.id,
      day: editingDay,
      month: viewDate.getMonth() + 1,
      year: viewDate.getFullYear(),
      count,
      pairs
    };

    try {
      if (count === 0 && pairs.length === 0 && existingLog) {
        await dbService.deleteEggLog(existingLog.id);
      } else {
        await dbService.saveEggLog(logData);
      }
      await loadLogs();
      setEditingDay(null);
    } catch (error) {
      alert('Erro ao salvar coleta: ' + error);
    }
  };

  const removeEntry = async (id: string) => {
    try {
      await dbService.deleteEggLog(id);
      await loadLogs();
      setEditingDay(null);
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  const currentEditLog = logs.find(l => 
    l.day === editingDay && 
    l.month === viewDate.getMonth() + 1 && 
    l.year === viewDate.getFullYear()
  ) || { day: editingDay, count: 0, pairs: [] };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#f43f5e]" size={48} />
        <p className="text-slate-200 font-bold uppercase tracking-widest text-sm">Carregando Coletas...</p>
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
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic">Coleta de Ovos</h2>
          <p className="mt-2 text-slate-200 font-medium text-sm">Registro diário e monitoramento de incubação.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-[#1e293b] border border-[#334155] px-6 py-4 rounded-[24px] flex items-center gap-4 shadow-sm">
            <Egg className="text-[#f43f5e] size-8" />
            <div>
              <p className="text-sm font-bold text-slate-200 uppercase tracking-[0.1em]">Total este mês</p>
              <p className="text-2xl font-black text-[#f8fafc] font-headline">{totalMonthly} Ovos</p>
            </div>
          </div>
          <button 
            onClick={() => setEditingDay(new Date().getDate())}
            className="bg-[#3b82f6] text-white p-5 rounded-[24px] shadow-xl hover:scale-105 active:scale-95 transition-all text-sm font-bold uppercase"
          >
            Adicionar Coleta
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-[#1e293b] border border-[#334155] rounded-[24px] p-8 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-3">
              <CalendarIcon className="text-[#3b82f6] size-6" />
              <h3 className="text-2xl font-bold text-white font-headline tracking-tight uppercase">
                {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-2 hover:bg-[#334155] rounded-full text-slate-200 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="p-2 hover:bg-[#334155] rounded-full text-slate-200 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(d => (
              <div key={d} className="text-center text-sm font-black text-[#475569] uppercase tracking-widest pb-4">{d}</div>
            ))}
            {/* Pad calendar for first day of month if needed - simplification here, just showing days */}
            {daysArray.map(day => {
              const log = logs.find(l => 
                l.day === day && 
                l.month === viewDate.getMonth() + 1 && 
                l.year === viewDate.getFullYear()
              );
              const isToday = day === currentDate.getDate() && 
                             viewDate.getMonth() === currentDate.getMonth() && 
                             viewDate.getFullYear() === currentDate.getFullYear();
                             
              return (
                <div 
                  key={day} 
                  onClick={() => setEditingDay(day)}
                  className={`
                    aspect-square rounded-2xl p-2 relative flex flex-col justify-between transition-all cursor-pointer group
                    ${log ? 'bg-[#3b82f6]/20 ring-2 ring-[#3b82f6]/40' : 'bg-[#0f172a] hover:bg-[#334155]'}
                    ${isToday ? 'border-2 border-[#f59e0b] shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'border border-transparent'}
                  `}
                >
                  <span className={`text-sm ${isToday ? 'font-black text-[#f59e0b]' : 'font-bold'} ${log && !isToday ? 'text-[#3b82f6]' : (!isToday ? 'text-[#475569]' : '')}`}>
                    {day}
                  </span>
                  {log && (
                    <div className="flex flex-col items-center">
                      <div className="bg-[#3b82f6] text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold shadow-md z-10">{log.count}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Recordings */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-[24px] p-8 flex flex-col shadow-sm max-h-[600px] overflow-hidden">
          <h3 className="text-xl font-bold text-white mb-8 tracking-tight italic">Últimos Registros</h3>
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
                className="bg-[#0f172a] p-4 rounded-xl border border-[#334155] group hover:border-[#3b82f6]/50 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-black text-slate-200 uppercase tracking-widest">{log.day}/{log.month}/{log.year}</div>
                  <div className="bg-[#334155] text-[#3b82f6] text-sm font-black px-2 py-0.5 rounded-full uppercase italic">{log.count} Ovos</div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(log.pairs || []).map(p => (
                    <span key={p} className="text-sm font-bold text-slate-200/60 bg-[#1e293b] px-2 py-1 rounded border border-[#334155]">{p}</span>
                  ))}
                </div>
              </motion.div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-10 opacity-20 text-slate-200">
                Nenhuma coleta registrada
              </div>
            )}
          </div>
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
              className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white font-headline tracking-tighter">Coleta: Dia {editingDay}</h3>
                  <p className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                    {viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => setEditingDay(null)}
                  className="text-slate-200 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateDay} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Quantidade de Ovos</label>
                  <div className="flex items-center gap-4">
                    <input 
                      required 
                      name="count" 
                      type="number" 
                      min="0"
                      defaultValue={currentEditLog.count} 
                      className="flex-1 bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-center text-xl font-bold" 
                    />
                    <Egg className="text-[#3b82f6]" size={32} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Casais (Separe por vírgula)</label>
                  <textarea 
                    name="pairs" 
                    defaultValue={(currentEditLog.pairs || []).join(', ')}
                    placeholder="Ex: MC-04, AR-12, CN-14"
                    className="w-full h-24 bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={() => {
                      const log = logs.find(l => 
                        l.day === editingDay && 
                        l.month === viewDate.getMonth() + 1 && 
                        l.year === viewDate.getFullYear()
                      );
                      if (log) removeEntry(log.id);
                      else setEditingDay(null);
                    }}
                    className="flex items-center justify-center p-3 rounded-xl bg-[#f43f5e]/10 text-[#f43f5e] hover:bg-[#f43f5e]/20 transition-colors"
                    title="Remover Registro"
                  >
                    <Trash2 size={20} />
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 px-6 py-4 bg-[#3b82f6] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg hover:bg-[#2563eb] transition-colors"
                  >
                    Salvar Registro
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
