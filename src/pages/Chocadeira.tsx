import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Egg, Plus, Trash2, Clock, AlertCircle, CheckCircle2, Thermometer, Droplets, Loader2, X, Lock } from 'lucide-react';
import { dbService } from '../lib/dbService';
import { useSubscription } from '../hooks/useSubscription';

interface Batch {
  id: string;
  name: string;
  count: number;
  start_date: string;
  fertile: number;
  infertile: number;
  hatched: number;
  dead_in_shell: number;
}

interface Incubator {
  id: string;
  name: string;
  capacity: number;
  incubator_batches?: Batch[];
}

const INCUBATION_DAYS = 21;

export default function Chocadeira() {
  const [incubators, setIncubators] = useState<Incubator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingIncubator, setIsAddingIncubator] = useState(false);
  const [isAddingBatch, setIsAddingBatch] = useState<string | null>(null);
  const [isEditingBatch, setIsEditingBatch] = useState<{ incubatorId: string, batch: Batch } | null>(null);
  const { isFreePlan, limits } = useSubscription();

  useEffect(() => {
    loadIncubators();
  }, []);

  async function loadIncubators() {
    try {
      const data = await dbService.getIncubators();
      setIncubators(data || []);
    } catch (error) {
      console.error('Erro ao carregar chocadeiras:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddIncubator = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const incubatorData = {
      name: formData.get('name') as string,
      capacity: parseInt(formData.get('capacity') as string),
    };

    try {
      await dbService.saveIncubator(incubatorData);
      await loadIncubators();
      setIsAddingIncubator(false);
    } catch (error) {
      alert('Erro ao salvar chocadeira: ' + error);
    }
  };

  const handleAddBatch = async (e: React.FormEvent<HTMLFormElement>, incubatorId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const batchData = {
      incubator_id: incubatorId,
      name: formData.get('name') as string,
      count: parseInt(formData.get('count') as string),
      start_date: new Date().toISOString(),
      fertile: 0,
      infertile: 0,
      hatched: 0,
      dead_in_shell: 0
    };
    
    try {
      await dbService.saveBatch(batchData);
      await loadIncubators();
      setIsAddingBatch(null);
    } catch (error) {
      alert('Erro ao salvar lote: ' + error);
    }
  };

  const handleUpdateBatch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEditingBatch) return;

    const formData = new FormData(e.currentTarget);
    
    const batchData = {
      id: isEditingBatch.batch.id,
      incubator_id: isEditingBatch.incubatorId,
      name: formData.get('name') as string,
      count: parseInt(formData.get('count') as string),
      fertile: parseInt(formData.get('fertile') as string) || 0,
      infertile: parseInt(formData.get('infertile') as string) || 0,
      hatched: parseInt(formData.get('hatched') as string) || 0,
      dead_in_shell: parseInt(formData.get('dead_in_shell') as string) || 0,
      start_date: isEditingBatch.batch.start_date
    };

    try {
      await dbService.saveBatch(batchData);
      await loadIncubators();
      setIsEditingBatch(null);
    } catch (error) {
      alert('Erro ao atualizar lote: ' + error);
    }
  };

  const removeIncubator = async (id: string) => {
    if (!confirm('Deseja excluir esta chocadeira? Todos os lotes serão removidos.')) return;
    try {
      await dbService.deleteIncubator(id);
      await loadIncubators();
    } catch (error) {
      alert('Erro ao excluir chocadeira: ' + error);
    }
  };

  const removeBatch = async (id: string) => {
    if (!confirm('Deseja excluir este lote?')) return;
    try {
      await dbService.deleteBatch(id);
      await loadIncubators();
    } catch (error) {
      alert('Erro ao excluir lote: ' + error);
    }
  };

  const getCountdown = (startDate: string) => {
    const start = new Date(startDate).getTime();
    const end = start + INCUBATION_DAYS * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();
    const diff = end - now;

    if (diff <= 0) return { days: 0, hours: 0, progress: 100, finished: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const totalDuration = INCUBATION_DAYS * 24 * 60 * 60 * 1000;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    return { days, hours, progress, finished: false };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#f59e0b]" size={48} />
        <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">Carregando Chocadeiras...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic uppercase">SISTEMA DE INCUBAÇÃO</h2>
          <p className="text-[#94a3b8] font-medium text-sm italic">Monitoramento e controle de eclosão (21 dias).</p>
        </div>
        <button 
          onClick={() => {
            if (isFreePlan && incubators.length >= limits.incubators) {
              alert(`Você atingiu o limite de ${limits.incubators} chocadeira do plano Iniciante. Acesse o menu Assinatura para fazer o upgrade!`);
              return;
            }
            setIsAddingIncubator(true);
          }}
          className={`flex items-center gap-2 px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl transition-all ${
            isFreePlan && incubators.length >= limits.incubators
              ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed opacity-70'
              : 'bg-[#3b82f6] text-white hover:scale-105 active:scale-95'
          }`}
        >
          {isFreePlan && incubators.length >= limits.incubators ? <Lock size={20} /> : <Plus size={20} />} ADICIONAR CHOCADEIRA
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {incubators.map((inc) => {
          const currentTotal = (inc.incubator_batches || []).reduce((acc, b) => acc + b.count, 0);
          return (
            <motion.div 
              key={inc.id}
              layout
              className="bg-[#1e293b] border border-[#334155] rounded-[32px] p-8 space-y-8 shadow-sm flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="bg-[#3b82f6]/10 p-4 rounded-2xl text-[#3b82f6]">
                    <Thermometer size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white font-headline tracking-tight italic">{inc.name}</h3>
                    <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest">Capacidade: {currentTotal} / {inc.capacity} Ovos</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeIncubator(inc.id)}
                  className="text-[#94a3b8] hover:text-[#f43f5e] transition-colors p-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0f172a] p-4 rounded-2xl flex items-center gap-3">
                  <Thermometer className="text-[#f59e0b]" size={20} />
                  <div>
                    <p className="text-[9px] font-bold text-[#94a3b8] uppercase">Temp.</p>
                    <p className="text-sm font-bold text-white">37.5°C</p>
                  </div>
                </div>
                <div className="bg-[#0f172a] p-4 rounded-2xl flex items-center gap-3">
                  <Droplets className="text-[#3b82f6]" size={20} />
                  <div>
                    <p className="text-[9px] font-bold text-[#94a3b8] uppercase">Umidade</p>
                    <p className="text-sm font-bold text-white">55%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-[10px] font-black text-[#475569] uppercase tracking-widest">Lotes em Incubação</h4>
                  <button 
                    disabled={currentTotal >= inc.capacity}
                    onClick={() => setIsAddingBatch(inc.id)}
                    className="text-[#3b82f6] text-[10px] font-black uppercase hover:underline disabled:opacity-30 tracking-tight"
                  >
                    + Novo Lote
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(!inc.incubator_batches || inc.incubator_batches.length === 0) && (
                    <div className="text-center py-10 opacity-20 flex flex-col items-center gap-2">
                      <Egg size={40} className="text-[#94a3b8]" />
                      <p className="text-xs font-medium">Chocadeira Vazia</p>
                    </div>
                  )}
                  {(inc.incubator_batches || []).map(batch => {
                    const status = getCountdown(batch.start_date);
                    return (
                      <div key={batch.id} className="bg-[#0f172a] p-5 rounded-2xl border border-[#334155]/30 group hover:border-[#3b82f6]/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${status.finished ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                              <Egg size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white tracking-tight italic">{batch.name}</p>
                              <p className="text-[10px] text-[#94a3b8] font-bold">{batch.count} UNIDADES</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setIsEditingBatch({ incubatorId: inc.id, batch })}
                              className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#3b82f6] text-[10px] font-bold uppercase tracking-widest"
                            >
                              Editar
                            </button>
                            <button onClick={() => removeBatch(batch.id)} className="opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity text-[#94a3b8] hover:text-[#f43f5e] p-2"><Trash2 size={16} /></button>
                          </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-[#1e293b]/50 p-2 rounded-lg text-center">
                            <p className="text-[8px] font-black text-[#475569] uppercase tracking-tighter">Fértil</p>
                            <p className="text-xs font-black text-[#10b981]">{batch.fertile || 0}</p>
                          </div>
                          <div className="bg-[#1e293b]/50 p-2 rounded-lg text-center">
                            <p className="text-[8px] font-black text-[#475569] uppercase tracking-tighter">Claro</p>
                            <p className="text-xs font-black text-[#94a3b8]">{batch.infertile || 0}</p>
                          </div>
                          <div className="bg-[#1e293b]/50 p-2 rounded-lg text-center">
                            <p className="text-[8px] font-black text-[#475569] uppercase tracking-tighter">Nasceu</p>
                            <p className="text-xs font-black text-[#3b82f6]">{batch.hatched || 0}</p>
                          </div>
                          <div className="bg-[#1e293b]/50 p-2 rounded-lg text-center">
                            <p className="text-[8px] font-black text-[#475569] uppercase tracking-tighter">M. Casca</p>
                            <p className="text-xs font-black text-[#f43f5e]">{batch.dead_in_shell || 0}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                              {status.finished ? <AlertCircle size={14} className="text-[#10b981] animate-bounce" /> : <Clock size={14} className="text-[#f59e0b] animate-pulse" />}
                              <span className={`text-[13px] font-black italic tracking-tighter ${status.finished ? 'text-[#10b981]' : 'text-[#f59e0b]'}`}>
                                {status.finished ? 'Eclosão Pronta!' : `${status.days}d ${status.hours}h restantes`}
                              </span>
                            </div>
                            <span className="text-[9px] font-black text-[#475569] uppercase">{Math.round(status.progress)}%</span>
                          </div>
                          <div className="h-1 bg-[#1e293b] rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${status.progress}%` }}
                              className={`h-full ${status.finished ? 'bg-[#10b981]' : 'bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]'}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isAddingIncubator && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingIncubator(false)} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] border border-[#334155] p-10 rounded-[40px] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white font-headline italic tracking-tighter">Nova Chocadeira</h3>
                <button onClick={() => setIsAddingIncubator(false)} className="text-[#475569] hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddIncubator} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Identificação da Máquina</label>
                  <input required name="name" type="text" placeholder="Ex: Master Hatch 500" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Capacidade Total (Ovos)</label>
                  <input required name="capacity" type="number" placeholder="Ex: 24" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-all" />
                </div>
                <button type="submit" className="w-full py-4 bg-[#3b82f6] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all">Salvar Chocadeira</button>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingBatch(null)} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] border border-[#334155] p-10 rounded-[40px] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white font-headline italic tracking-tighter">Novo Lote de Ovos</h3>
                <button onClick={() => setIsAddingBatch(null)} className="text-[#475569] hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={(e) => handleAddBatch(e, isAddingBatch)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Identificação / Casal</label>
                  <input required name="name" type="text" placeholder="Ex: Casal MR-42" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Quantidade de Ovos</label>
                  <input required name="count" type="number" placeholder="Ex: 4" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-all" />
                </div>
                <button type="submit" className="w-full py-4 bg-[#f59e0b] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all">Iniciar Incubação</button>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingBatch(null)} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#1e293b] border border-[#334155] p-10 rounded-[40px] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white font-headline italic tracking-tighter">Atualizar Estatísticas</h3>
                <button onClick={() => setIsEditingBatch(null)} className="text-[#475569] hover:text-white"><X size={24} /></button>
              </div>
              <form onSubmit={handleUpdateBatch} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Nome do Lote</label>
                    <input required name="name" defaultValue={isEditingBatch.batch.name} type="text" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Total Ovos</label>
                    <input required name="count" defaultValue={isEditingBatch.batch.count} type="number" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#334155]">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest pl-1">Ovos Férteis</label>
                    <input name="fertile" defaultValue={isEditingBatch.batch.fertile} type="number" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#10b981]/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Ovos Claros</label>
                    <input name="infertile" defaultValue={isEditingBatch.batch.infertile} type="number" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest pl-1">Nasceram</label>
                    <input name="hatched" defaultValue={isEditingBatch.batch.hatched} type="number" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#3b82f6]/30" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#f43f5e] uppercase tracking-widest pl-1">Morto na Casca</label>
                    <input name="dead_in_shell" defaultValue={isEditingBatch.batch.dead_in_shell} type="number" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#f43f5e]/30" />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                   <button type="submit" className="flex-1 py-4 bg-[#3b82f6] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-opacity-90 transition-all">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
