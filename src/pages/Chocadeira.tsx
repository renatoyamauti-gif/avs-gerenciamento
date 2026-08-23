import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Egg, Plus, Trash2, Clock, AlertCircle, CheckCircle2, Thermometer, Droplets, Loader2, X, Lock, Baby } from 'lucide-react';
import { dbService } from '../lib/dbService';
import { useSubscription } from '../hooks/useSubscription';

interface BreedStats {
  quantity: number;
  fertile?: number;
  infertile?: number;
  hatched?: number;
  dead_in_shell?: number;
}

interface Batch {
  id: string;
  name: string;
  count: number;
  start_date: string;
  fertile: number;
  infertile: number;
  hatched: number;
  dead_in_shell: number;
  baia_details?: Record<string, number>;
  raca_details?: Record<string, number | BreedStats>;
  added_to_maternity?: boolean;
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
  const [addingToMaternityId, setAddingToMaternityId] = useState<string | null>(null);
  const { isFreePlan, limits } = useSubscription();

  const [uniqueBaias, setUniqueBaias] = useState<string[]>([]);
  const [uniqueRacas, setUniqueRacas] = useState<string[]>([]);
  const [modalBaias, setModalBaias] = useState<{ baia: string; quantity: number }[]>([]);
  const [modalRacas, setModalRacas] = useState<{
    raca: string;
    quantity: number;
    fertile?: number;
    infertile?: number;
    hatched?: number;
    dead_in_shell?: number;
  }[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [batchFertile, setBatchFertile] = useState<number>(0);
  const [batchInfertile, setBatchInfertile] = useState<number>(0);
  const [batchHatched, setBatchHatched] = useState<number>(0);
  const [batchDeadInShell, setBatchDeadInShell] = useState<number>(0);

  const sumRacaStats = useMemo(() => {
    let fertile = 0;
    let infertile = 0;
    let hatched = 0;
    let dead_in_shell = 0;
    modalRacas.forEach(r => {
      fertile += r.fertile || 0;
      infertile += r.infertile || 0;
      hatched += r.hatched || 0;
      dead_in_shell += r.dead_in_shell || 0;
    });
    return { fertile, infertile, hatched, dead_in_shell };
  }, [modalRacas]);

  useEffect(() => {
    if (isEditingBatch && modalRacas.length > 0) {
      setBatchFertile(sumRacaStats.fertile);
      setBatchInfertile(sumRacaStats.infertile);
      setBatchHatched(sumRacaStats.hatched);
      setBatchDeadInShell(sumRacaStats.dead_in_shell);
    }
  }, [sumRacaStats, modalRacas.length, isEditingBatch]);

  useEffect(() => {
    loadIncubators();
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

  const calculatedTotal = useMemo(() => {
    const totalBaias = modalBaias.reduce((sum, b) => sum + b.quantity, 0);
    const totalRacas = modalRacas.reduce((sum, r) => sum + r.quantity, 0);
    return totalBaias + totalRacas;
  }, [modalBaias, modalRacas]);

  useEffect(() => {
    if (calculatedTotal > 0 && totalCount === 0) {
      setTotalCount(calculatedTotal);
    }
  }, [calculatedTotal, totalCount]);

  const openAddBatch = (incubatorId: string) => {
    setModalBaias([]);
    setModalRacas([]);
    setTotalCount(0);
    setIsAddingBatch(incubatorId);
  };

  const openEditBatch = (incubatorId: string, batch: Batch) => {
    const initialBaias = batch.baia_details 
      ? Object.entries(batch.baia_details).map(([baia, quantity]) => ({ baia, quantity }))
      : [];
    const initialRacas = batch.raca_details
      ? Object.entries(batch.raca_details).map(([raca, val]) => {
          if (typeof val === 'object' && val !== null) {
            return {
              raca,
              quantity: val.quantity || 0,
              fertile: val.fertile || 0,
              infertile: val.infertile || 0,
              hatched: val.hatched || 0,
              dead_in_shell: val.dead_in_shell || 0,
            };
          }
          return {
            raca,
            quantity: val || 0,
            fertile: 0,
            infertile: 0,
            hatched: 0,
            dead_in_shell: 0,
          };
        })
      : [];
    setModalBaias(initialBaias);
    setModalRacas(initialRacas);
    setTotalCount(batch.count || 0);
    setBatchFertile(batch.fertile || 0);
    setBatchInfertile(batch.infertile || 0);
    setBatchHatched(batch.hatched || 0);
    setBatchDeadInShell(batch.dead_in_shell || 0);
    setIsEditingBatch({ incubatorId, batch });
  };

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

    const baia_details: Record<string, number> = {};
    modalBaias.forEach(item => {
      if (item.baia) {
        baia_details[item.baia] = (baia_details[item.baia] || 0) + item.quantity;
      }
    });

    const raca_details: Record<string, any> = {};
    modalRacas.forEach(item => {
      if (item.raca) {
        raca_details[item.raca] = {
          quantity: item.quantity,
          fertile: 0,
          infertile: 0,
          hatched: 0,
          dead_in_shell: 0
        };
      }
    });

    const batchData = {
      incubator_id: incubatorId,
      name: formData.get('name') as string,
      count: totalCount || calculatedTotal || parseInt(formData.get('count') as string) || 0,
      start_date: new Date().toISOString(),
      fertile: 0,
      infertile: 0,
      hatched: 0,
      dead_in_shell: 0,
      baia_details,
      raca_details
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
    
    const startDateStr = formData.get('start_date') as string;
    let newStartDate = isEditingBatch.batch.start_date;
    if (startDateStr) {
      const [year, month, day] = startDateStr.split('-');
      const d = new Date(isEditingBatch.batch.start_date);
      d.setFullYear(parseInt(year), parseInt(month) - 1, parseInt(day));
      newStartDate = d.toISOString();
    }

    const baia_details: Record<string, number> = {};
    modalBaias.forEach(item => {
      if (item.baia) {
        baia_details[item.baia] = (baia_details[item.baia] || 0) + item.quantity;
      }
    });

    const raca_details: Record<string, any> = {};
    modalRacas.forEach(item => {
      if (item.raca) {
        raca_details[item.raca] = {
          quantity: item.quantity,
          fertile: item.fertile || 0,
          infertile: item.infertile || 0,
          hatched: item.hatched || 0,
          dead_in_shell: item.dead_in_shell || 0,
        };
      }
    });

    const batchData = {
      id: isEditingBatch.batch.id,
      incubator_id: isEditingBatch.incubatorId,
      name: formData.get('name') as string,
      count: totalCount || calculatedTotal || parseInt(formData.get('count') as string) || 0,
      fertile: modalRacas.length > 0 ? sumRacaStats.fertile : (parseInt(formData.get('fertile') as string) || 0),
      infertile: modalRacas.length > 0 ? sumRacaStats.infertile : (parseInt(formData.get('infertile') as string) || 0),
      hatched: modalRacas.length > 0 ? sumRacaStats.hatched : (parseInt(formData.get('hatched') as string) || 0),
      dead_in_shell: modalRacas.length > 0 ? sumRacaStats.dead_in_shell : (parseInt(formData.get('dead_in_shell') as string) || 0),
      start_date: newStartDate,
      baia_details,
      raca_details
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
    if (!confirm('Tem certeza que quer excluir/deletar esta chocadeira? Pois será irreversível.')) return;
    try {
      await dbService.deleteIncubator(id);
      await loadIncubators();
    } catch (error) {
      alert('Erro ao excluir chocadeira: ' + error);
    }
  };

  const removeBatch = async (id: string) => {
    if (!confirm('Tem certeza que quer excluir/deletar este lote? Pois será irreversível.')) return;
    try {
      await dbService.deleteBatch(id);
      await loadIncubators();
    } catch (error) {
      alert('Erro ao excluir lote: ' + error);
    }
  };

  const handleAddToMaternity = async (batch: Batch) => {
    if (batch.added_to_maternity) return;
    
    const hatchedCount = batch.hatched || 0;
    if (hatchedCount <= 0) {
      alert('Nenhum ovo marcado como "Nasceu" neste lote.');
      return;
    }

    if (!confirm(`Deseja adicionar os ${hatchedCount} filhotes nascidos deste lote à maternidade?`)) {
      return;
    }

    setAddingToMaternityId(batch.id);
    try {
      const chicksToAdd: { raca: string; quantity: number }[] = [];

      if (batch.raca_details && Object.keys(batch.raca_details).length > 0) {
        Object.entries(batch.raca_details).forEach(([racaName, val]) => {
          if (typeof val === 'object' && val !== null) {
            const hatched = (val as any).hatched || 0;
            if (hatched > 0) {
              chicksToAdd.push({ raca: racaName, quantity: hatched });
            }
          }
        });
      }

      if (chicksToAdd.length === 0 && batch.hatched > 0) {
        const breedNames = batch.raca_details ? Object.keys(batch.raca_details) : [];
        if (breedNames.length === 1) {
          chicksToAdd.push({ raca: breedNames[0], quantity: batch.hatched });
        } else {
          chicksToAdd.push({ raca: 'Não especificada', quantity: batch.hatched });
        }
      }

      // Default birth date: start_date + 21 days or today, whichever is older/smaller
      const hatchDate = new Date(new Date(batch.start_date).getTime() + 21 * 24 * 60 * 60 * 1000);
      const today = new Date();
      const birthDate = (hatchDate > today ? today : hatchDate).toISOString().split('T')[0];

      for (const item of chicksToAdd) {
        for (let i = 1; i <= item.quantity; i++) {
          let identifier = '';
          if (item.raca === 'Não especificada') {
            identifier = `${batch.name}${item.quantity > 1 ? ` - ${String(i).padStart(2, '0')}` : ''}`;
          } else {
            identifier = `${batch.name} - ${item.raca}${item.quantity > 1 ? ` - ${String(i).padStart(2, '0')}` : ''}`;
          }

          const recordData = {
            identifier,
            raca: item.raca === 'Não especificada' ? '' : item.raca,
            birth_date: birthDate,
            status: 'Berçário',
            notes: `Adicionado automaticamente a partir do lote de incubação "${batch.name}".`
          };
          await dbService.saveMaternityRecord(recordData);
        }
      }

      // Update batch in db
      const updatedBatch = {
        ...batch,
        added_to_maternity: true
      };
      await dbService.saveBatch(updatedBatch);
      await loadIncubators();
      alert('Nascimentos adicionados à maternidade com sucesso!');
    } catch (error) {
      alert('Erro ao adicionar à maternidade: ' + error);
    } finally {
      setAddingToMaternityId(null);
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
        <Loader2 className="animate-spin text-[#F59E0B]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Chocadeiras...</p>
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
          <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight">Sistema de Incubação</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Monitoramento e controle de eclosão (21 dias).</p>
        </div>
        <button 
          onClick={() => {
            if (isFreePlan && incubators.length >= limits.incubators) {
              alert(`Você atingiu o limite de ${limits.incubators} chocadeira do plano Iniciante. Acesse o menu Assinatura para fazer o upgrade!`);
              return;
            }
            setIsAddingIncubator(true);
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md transition-all ${
            isFreePlan && incubators.length >= limits.incubators
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:scale-105 active:scale-95'
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
              className="bg-white border border-slate-100 rounded-3xl p-8 space-y-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="bg-[#EFF6FF] p-4 rounded-2xl border border-[#DBEAFE] text-[#2563EB]">
                    <Thermometer size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight">{inc.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Capacidade: {currentTotal} / {inc.capacity} Ovos</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeIncubator(inc.id)}
                  className="text-slate-400 hover:text-[#EF4444] transition-colors p-2 hover:bg-[#FEF2F2] rounded-xl"
                >
                  <Trash2 size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <Thermometer className="text-[#F59E0B]" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Temp.</p>
                    <p className="text-sm font-bold text-[#1F2937]">37.5°C</p>
                  </div>
                </div>
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <Droplets className="text-[#2563EB]" size={20} />
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Umidade</p>
                    <p className="text-sm font-bold text-[#1F2937]">55%</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Lotes em Incubação</h4>
                  <button 
                    disabled={currentTotal >= inc.capacity}
                    onClick={() => openAddBatch(inc.id)}
                    className="text-[#2563EB] text-xs font-bold uppercase hover:underline disabled:opacity-30 tracking-widest"
                  >
                    + Novo Lote
                  </button>
                </div>
                
                <div className="space-y-4">
                  {(!inc.incubator_batches || inc.incubator_batches.length === 0) && (
                    <div className="text-center py-10 opacity-50 flex flex-col items-center gap-2">
                      <div className="bg-slate-50 p-4 rounded-full">
                        <Egg size={40} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-semibold text-slate-400 mt-2">Chocadeira Vazia</p>
                    </div>
                  )}
                  {(inc.incubator_batches || []).map(batch => {
                    const status = getCountdown(batch.start_date);
                    return (
                      <div key={batch.id} className="bg-white p-5 rounded-2xl border border-slate-100 group hover:border-[#2563EB]/30 shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl ${status.finished ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEF3C7] text-[#D97706]'}`}>
                              <Egg size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1F2937] tracking-tight">{batch.name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className="text-xs text-slate-500 font-bold uppercase">{batch.count} UNIDADES</span>
                                {batch.baia_details && Object.entries(batch.baia_details).map(([baia, qty]) => (
                                  <span key={baia} className="bg-[#EFF6FF] text-[#2563EB] text-[10px] font-bold px-2 py-0.5 rounded-md border border-[#DBEAFE] uppercase">
                                    {baia}: {qty} ovos
                                  </span>
                                ))}
                                {batch.raca_details && Object.entries(batch.raca_details).map(([raca, val]) => {
                                  const qty = typeof val === 'object' && val !== null ? (val as any).quantity : val;
                                  const stats = typeof val === 'object' && val !== null ? (val as any) : null;
                                  const hasStats = stats && (stats.fertile > 0 || stats.infertile > 0 || stats.hatched > 0 || stats.dead_in_shell > 0);
                                  return (
                                    <div key={raca} className="flex flex-col gap-0.5 bg-[#FAF5FF] px-2 py-1 rounded-md border border-purple-200 uppercase">
                                      <span className="text-purple-600 text-[10px] font-bold leading-tight">
                                        {raca}: {qty} ovos
                                      </span>
                                      {hasStats && (
                                        <span className="text-[8px] text-slate-500 font-semibold normal-case leading-none">
                                          F:{stats.fertile || 0} C:{stats.infertile || 0} N:{stats.hatched || 0} M:{stats.dead_in_shell || 0}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => openEditBatch(inc.id, batch)}
                              className="text-slate-400 hover:text-[#2563EB] text-xs font-bold uppercase tracking-widest bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Editar
                            </button>
                            <button onClick={() => removeBatch(batch.id)} className="text-slate-400 hover:text-[#EF4444] p-2 hover:bg-[#FEF2F2] rounded-lg transition-colors"><Trash2 size={16} /></button>
                          </div>
                        </div>

                        {/* Stats Summary */}
                        <div className="grid grid-cols-4 gap-2 mb-4">
                          <div className="bg-[#F8FAFC] border border-slate-100 p-2 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Fértil</p>
                            <p className="text-sm font-black text-[#16A34A]">{batch.fertile || 0}</p>
                          </div>
                          <div className="bg-[#F8FAFC] border border-slate-100 p-2 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Claro</p>
                            <p className="text-sm font-black text-slate-600">{batch.infertile || 0}</p>
                          </div>
                          <div className="bg-[#F8FAFC] border border-slate-100 p-2 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Nasceu</p>
                            <p className="text-sm font-black text-[#2563EB]">{batch.hatched || 0}</p>
                          </div>
                          <div className="bg-[#F8FAFC] border border-slate-100 p-2 rounded-xl text-center">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">M. Casca</p>
                            <p className="text-sm font-black text-[#EF4444]">{batch.dead_in_shell || 0}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-2">
                              {status.finished ? <AlertCircle size={14} className="text-[#16A34A] animate-bounce" /> : <Clock size={14} className="text-[#F59E0B] animate-pulse" />}
                              <span className={`text-xs font-bold tracking-tight ${status.finished ? 'text-[#16A34A]' : 'text-[#F59E0B]'}`}>
                                {status.finished ? 'Eclosão Pronta!' : `${status.days}d ${status.hours}h restantes`}
                              </span>
                            </div>
                            <span className="text-xs font-black text-slate-500 uppercase">{Math.round(status.progress)}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${status.progress}%` }}
                              className={`h-full ${status.finished ? 'bg-[#16A34A]' : 'bg-gradient-to-r from-[#FCD34D] to-[#F59E0B]'}`}
                            />
                          </div>
                        </div>

                        {batch.hatched > 0 && (
                          <div className="pt-4 border-t border-dashed border-slate-100 mt-4 flex justify-end">
                            {batch.added_to_maternity ? (
                              <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">
                                <CheckCircle2 size={14} />
                                Adicionado à Maternidade
                              </span>
                            ) : (
                              <button
                                disabled={addingToMaternityId === batch.id}
                                onClick={() => handleAddToMaternity(batch)}
                                className="flex items-center gap-2 px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                              >
                                {addingToMaternityId === batch.id ? (
                                  <>
                                    <Loader2 className="animate-spin" size={14} />
                                    Adicionando...
                                  </>
                                ) : (
                                  <>
                                    <Baby size={14} />
                                    Mandar para Maternidade
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        )}
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingIncubator(false)} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#1F2937]">Nova Chocadeira</h3>
                <button onClick={() => setIsAddingIncubator(false)} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddIncubator} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Identificação da Máquina</label>
                  <input required name="name" type="text" placeholder="Ex: Master Hatch 500" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Capacidade Total (Ovos)</label>
                  <input required name="capacity" type="number" placeholder="Ex: 24" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>
                <button type="submit" className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all">Salvar Chocadeira</button>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingBatch(null)} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white p-8 rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar my-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#1F2937]">Novo Lote de Ovos</h3>
                <button onClick={() => setIsAddingBatch(null)} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={(e) => handleAddBatch(e, isAddingBatch)} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Identificação</label>
                  <input required name="name" type="text" placeholder="Ex: Lote 01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>

                {/* Composição por Baia */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Composição por Baia</label>
                    <button 
                      type="button" 
                      onClick={() => setModalBaias([...modalBaias, { baia: '', quantity: 1 }])}
                      className="text-[#2563EB] text-xs font-bold uppercase hover:underline tracking-widest"
                    >
                      + Adicionar Baia
                    </button>
                  </div>
                  {modalBaias.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
                      <select
                        value={item.baia}
                        onChange={(e) => {
                          const newBaias = [...modalBaias];
                          newBaias[idx].baia = e.target.value;
                          setModalBaias(newBaias);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] outline-none"
                        required
                      >
                        <option value="" disabled>Selecionar Baia</option>
                        {uniqueBaias.map(baia => (
                          <option key={baia} value={baia}>{baia}</option>
                        ))}
                        {!uniqueBaias.includes(item.baia) && item.baia && (
                          <option value={item.baia}>{item.baia}</option>
                        )}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newBaias = [...modalBaias];
                          newBaias[idx].quantity = parseInt(e.target.value) || 0;
                          setModalBaias(newBaias);
                        }}
                        placeholder="Qtd"
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-bold text-[#1F2937] outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setModalBaias(modalBaias.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-[#EF4444] p-1.5 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Composição por Raça */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Composição por Raça</label>
                    <button 
                      type="button" 
                      onClick={() => setModalRacas([...modalRacas, { raca: '', quantity: 1, fertile: 0, infertile: 0, hatched: 0, dead_in_shell: 0 }])}
                      className="text-[#2563EB] text-xs font-bold uppercase hover:underline tracking-widest"
                    >
                      + Adicionar Raça
                    </button>
                  </div>
                  {modalRacas.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
                      <select
                        value={item.raca}
                        onChange={(e) => {
                          const newRacas = [...modalRacas];
                          newRacas[idx].raca = e.target.value;
                          setModalRacas(newRacas);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] outline-none"
                        required
                      >
                        <option value="" disabled>Selecionar Raça</option>
                        {uniqueRacas.map(raca => (
                          <option key={raca} value={raca}>{raca}</option>
                        ))}
                        {!uniqueRacas.includes(item.raca) && item.raca && (
                          <option value={item.raca}>{item.raca}</option>
                        )}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newRacas = [...modalRacas];
                          newRacas[idx].quantity = parseInt(e.target.value) || 0;
                          setModalRacas(newRacas);
                        }}
                        placeholder="Qtd"
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-bold text-[#1F2937] outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setModalRacas(modalRacas.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-[#EF4444] p-1.5 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quantidade Total de Ovos</label>
                  <input 
                    required 
                    name="count" 
                    type="number" 
                    value={totalCount || ''} 
                    onChange={(e) => setTotalCount(parseInt(e.target.value) || 0)} 
                    placeholder="Ex: 4" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                  />
                </div>

                {calculatedTotal > 0 && totalCount !== calculatedTotal && (
                  <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
                    <span>
                      ⚠️ A quantidade total inserida ({totalCount}) é diferente da soma dos itens por baia/raça ({calculatedTotal}).
                    </span>
                    <button
                      type="button"
                      onClick={() => setTotalCount(calculatedTotal)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] whitespace-nowrap transition-all cursor-pointer"
                    >
                      Ajustar para {calculatedTotal}
                    </button>
                  </div>
                )}
                <button type="submit" className="w-full py-4 bg-[#F59E0B] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#D97706] hover:scale-[1.02] active:scale-95 transition-all">Iniciar Incubação</button>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingBatch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingBatch(null)} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white p-8 rounded-[32px] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar my-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#1F2937]">Atualizar Lote</h3>
                <button onClick={() => setIsEditingBatch(null)} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleUpdateBatch} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome do Lote</label>
                    <input required name="name" defaultValue={isEditingBatch.batch.name} type="text" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data Início</label>
                    <input required name="start_date" defaultValue={new Date(isEditingBatch.batch.start_date).toISOString().split('T')[0]} type="date" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                </div>

                {/* Composição por Baia */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Composição por Baia</label>
                    <button 
                      type="button" 
                      onClick={() => setModalBaias([...modalBaias, { baia: '', quantity: 1 }])}
                      className="text-[#2563EB] text-xs font-bold uppercase hover:underline tracking-widest"
                    >
                      + Adicionar Baia
                    </button>
                  </div>
                  {modalBaias.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100">
                      <select
                        value={item.baia}
                        onChange={(e) => {
                          const newBaias = [...modalBaias];
                          newBaias[idx].baia = e.target.value;
                          setModalBaias(newBaias);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] outline-none"
                        required
                      >
                        <option value="" disabled>Selecionar Baia</option>
                        {uniqueBaias.map(baia => (
                          <option key={baia} value={baia}>{baia}</option>
                        ))}
                        {!uniqueBaias.includes(item.baia) && item.baia && (
                          <option value={item.baia}>{item.baia}</option>
                        )}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newBaias = [...modalBaias];
                          newBaias[idx].quantity = parseInt(e.target.value) || 0;
                          setModalBaias(newBaias);
                        }}
                        placeholder="Qtd"
                        className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-bold text-[#1F2937] outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setModalBaias(modalBaias.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-[#EF4444] p-1.5 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Composição por Raça */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Composição por Raça</label>
                    <button 
                      type="button" 
                      onClick={() => setModalRacas([...modalRacas, { raca: '', quantity: 1, fertile: 0, infertile: 0, hatched: 0, dead_in_shell: 0 }])}
                      className="text-[#2563EB] text-xs font-bold uppercase hover:underline tracking-widest"
                    >
                      + Adicionar Raça
                    </button>
                  </div>
                  {modalRacas.map((item, idx) => (
                    <div key={idx} className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex items-center gap-3">
                        <select
                          value={item.raca}
                          onChange={(e) => {
                            const newRacas = [...modalRacas];
                            newRacas[idx].raca = e.target.value;
                            setModalRacas(newRacas);
                          }}
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] outline-none"
                          required
                        >
                          <option value="" disabled>Selecionar Raça</option>
                          {uniqueRacas.map(raca => (
                            <option key={raca} value={raca}>{raca}</option>
                          ))}
                          {!uniqueRacas.includes(item.raca) && item.raca && (
                            <option value={item.raca}>{item.raca}</option>
                          )}
                        </select>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const newRacas = [...modalRacas];
                            newRacas[idx].quantity = parseInt(e.target.value) || 0;
                            setModalRacas(newRacas);
                          }}
                          placeholder="Qtd"
                          className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-center font-bold text-[#1F2937] outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setModalRacas(modalRacas.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-[#EF4444] p-1.5 hover:bg-[#FEF2F2] rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Breed specific stats */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-dashed border-slate-200">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#16A34A] uppercase tracking-widest ml-1">Fértil</label>
                          <input
                            type="number"
                            min="0"
                            value={item.fertile ?? 0}
                            onChange={(e) => {
                              const newRacas = [...modalRacas];
                              newRacas[idx].fertile = parseInt(e.target.value) || 0;
                              setModalRacas(newRacas);
                            }}
                            className="w-full bg-white border border-[#16A34A]/30 rounded-xl px-2 py-1 text-xs text-center font-semibold text-[#1F2937] outline-none focus:border-[#16A34A]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest ml-1">Claro</label>
                          <input
                            type="number"
                            min="0"
                            value={item.infertile ?? 0}
                            onChange={(e) => {
                              const newRacas = [...modalRacas];
                              newRacas[idx].infertile = parseInt(e.target.value) || 0;
                              setModalRacas(newRacas);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1 text-xs text-center font-semibold text-[#1F2937] outline-none focus:border-[#2563EB]/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#2563EB] uppercase tracking-widest ml-1">Nasceu</label>
                          <input
                            type="number"
                            min="0"
                            value={item.hatched ?? 0}
                            onChange={(e) => {
                              const newRacas = [...modalRacas];
                              newRacas[idx].hatched = parseInt(e.target.value) || 0;
                              setModalRacas(newRacas);
                            }}
                            className="w-full bg-white border border-[#2563EB]/30 rounded-xl px-2 py-1 text-xs text-center font-semibold text-[#1F2937] outline-none focus:border-[#2563EB]"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-[#EF4444] uppercase tracking-widest ml-1">M. Casca</label>
                          <input
                            type="number"
                            min="0"
                            value={item.dead_in_shell ?? 0}
                            onChange={(e) => {
                              const newRacas = [...modalRacas];
                              newRacas[idx].dead_in_shell = parseInt(e.target.value) || 0;
                              setModalRacas(newRacas);
                            }}
                            className="w-full bg-white border border-[#EF4444]/30 rounded-xl px-2 py-1 text-xs text-center font-semibold text-[#1F2937] outline-none focus:border-[#EF4444]"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Quantidade Total de Ovos</label>
                  <input 
                    required 
                    name="count" 
                    type="number" 
                    value={totalCount || ''} 
                    onChange={(e) => setTotalCount(parseInt(e.target.value) || 0)} 
                    placeholder="Ex: 4" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                  />
                </div>

                {calculatedTotal > 0 && totalCount !== calculatedTotal && (
                  <div className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/40 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs font-medium">
                    <span>
                      ⚠️ A quantidade total inserida ({totalCount}) é diferente da soma dos itens por baia/raça ({calculatedTotal}).
                    </span>
                    <button
                      type="button"
                      onClick={() => setTotalCount(calculatedTotal)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] whitespace-nowrap transition-all cursor-pointer"
                    >
                      Ajustar para {calculatedTotal}
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#16A34A] uppercase tracking-widest ml-1">Ovos Férteis</label>
                      {modalRacas.length > 0 && <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Soma das raças</span>}
                    </div>
                    <input 
                      name="fertile" 
                      value={modalRacas.length > 0 ? sumRacaStats.fertile : batchFertile} 
                      onChange={(e) => setBatchFertile(parseInt(e.target.value) || 0)} 
                      disabled={modalRacas.length > 0} 
                      type="number" 
                      className={`w-full bg-[#F8FAFC] border border-[#16A34A]/30 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#16A34A]/50 focus:ring-4 focus:ring-[#16A34A]/10 transition-all outline-none ${modalRacas.length > 0 ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Ovos Claros</label>
                      {modalRacas.length > 0 && <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Soma das raças</span>}
                    </div>
                    <input 
                      name="infertile" 
                      value={modalRacas.length > 0 ? sumRacaStats.infertile : batchInfertile} 
                      onChange={(e) => setBatchInfertile(parseInt(e.target.value) || 0)} 
                      disabled={modalRacas.length > 0} 
                      type="number" 
                      className={`w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none ${modalRacas.length > 0 ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#2563EB] uppercase tracking-widest ml-1">Nasceram</label>
                      {modalRacas.length > 0 && <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Soma das raças</span>}
                    </div>
                    <input 
                      name="hatched" 
                      value={modalRacas.length > 0 ? sumRacaStats.hatched : batchHatched} 
                      onChange={(e) => setBatchHatched(parseInt(e.target.value) || 0)} 
                      disabled={modalRacas.length > 0} 
                      type="number" 
                      className={`w-full bg-[#F8FAFC] border border-[#2563EB]/30 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none ${modalRacas.length > 0 ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-[#EF4444] uppercase tracking-widest ml-1">Morto na Casca</label>
                      {modalRacas.length > 0 && <span className="text-[9px] font-bold text-purple-600 uppercase tracking-widest">Soma das raças</span>}
                    </div>
                    <input 
                      name="dead_in_shell" 
                      value={modalRacas.length > 0 ? sumRacaStats.dead_in_shell : batchDeadInShell} 
                      onChange={(e) => setBatchDeadInShell(parseInt(e.target.value) || 0)} 
                      disabled={modalRacas.length > 0} 
                      type="number" 
                      className={`w-full bg-[#F8FAFC] border border-[#EF4444]/30 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#EF4444]/50 focus:ring-4 focus:ring-[#EF4444]/10 transition-all outline-none ${modalRacas.length > 0 ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`} 
                    />
                  </div>
                </div>

                <div className="pt-6">
                   <button type="submit" className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all">Salvar Alterações</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
