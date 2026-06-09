import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Baby, Plus, MoreVertical, X, Trash2, Loader2, Info, History, Calendar, Weight, Activity } from 'lucide-react';
import { dbService } from '../lib/dbService';

interface MaternityRecord {
  id: string;
  identifier: string;
  raca: string;
  birth_date: string;
  status: string;
  notes?: string;
  initial_weight?: number;
  feed_recipe_id?: string;
  baia?: string;
  img_url?: string;
  maternity_history?: MaternityHistory[];
}

interface MaternityHistory {
  id: string;
  maternity_id: string;
  date: string;
  weight_grams: number;
  notes?: string;
}

export default function Maternity() {
  const [records, setRecords] = useState<MaternityRecord[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaternityRecord | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados');
  const [history, setHistory] = useState<MaternityHistory[]>([]);
  const [isAddingHistory, setIsAddingHistory] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [data, recipesData] = await Promise.all([
        dbService.getMaternityRecords(),
        dbService.getRations()
      ]);
      setRecords(data || []);
      setRecipes(recipesData || []);
    } catch (error) {
      console.error('Erro ao carregar registros de maternidade:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(maternityId: string) {
    try {
      const data = await dbService.getMaternityHistory(maternityId);
      setHistory(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico da maternidade:', error);
    }
  }

  useEffect(() => {
    if (editingRecord) {
      loadHistory(editingRecord.id);
      setImagePreview(editingRecord.img_url || null);
    } else {
      setHistory([]);
      setActiveTab('dados');
      setIsAddingHistory(false);
      setImagePreview(null);
    }
  }, [editingRecord]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePrintRecord = () => {
    window.print();
  };

  const handleSaveRecord = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const recordData: any = {
      identifier: formData.get('identifier') as string,
      raca: formData.get('raca') as string,
      birth_date: formData.get('birth_date') as string,
      status: formData.get('status') as string,
      initial_weight: parseFloat(formData.get('initial_weight') as string) || null,
      feed_recipe_id: formData.get('feed_recipe_id') as string || null,
      baia: formData.get('baia') as string || null,
      img_url: imagePreview || editingRecord?.img_url || null,
      notes: formData.get('notes') as string,
    };

    if (editingRecord) {
      recordData.id = editingRecord.id;
    }

    try {
      await dbService.saveMaternityRecord(recordData);
      await loadData();
      setIsAdding(false);
      setEditingRecord(null);
      setImagePreview(null);
    } catch (error) {
      alert('Erro ao salvar registro: ' + error);
    }
  };

  const removeRecord = async (id: string) => {
    if (!confirm('Tem certeza que quer excluir/deletar este registro? Pois será irreversível.')) return;
    try {
      await dbService.deleteMaternityRecord(id);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  const handleSaveHistory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRecord) return;
    
    const formData = new FormData(e.currentTarget);
    const historyData: any = {
      maternity_id: editingRecord.id,
      date: formData.get('date') as string,
      weight_grams: parseFloat(formData.get('weight_grams') as string) || 0,
      notes: formData.get('notes') as string,
    };

    try {
      await dbService.saveMaternityHistory(historyData);
      await loadHistory(editingRecord.id);
      setIsAddingHistory(false);
    } catch (error) {
      alert('Erro ao salvar histórico de crescimento: ' + error);
    }
  };

  const removeHistory = async (id: string) => {
    if (!confirm('Tem certeza que quer excluir/deletar este histórico? Pois será irreversível.')) return;
    try {
      await dbService.deleteMaternityHistory(id);
      if (editingRecord) await loadHistory(editingRecord.id);
    } catch (error) {
      alert('Erro ao excluir registro de peso: ' + error);
    }
  };

  const calculateDaysOld = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birth.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#2563EB]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Maternidade...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-8 pb-10"
    >
      <section className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-headline font-bold text-[#1F2937] tracking-tight">Maternidade</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Gestão de nascimentos e acompanhamento de crescimento.</p>
        </div>
        <div className="flex gap-3 print:hidden">
          <button 
            onClick={() => {
              setEditingRecord(null);
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-[#2563EB] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-md transition-all hover:bg-[#1D4ED8] hover:scale-105 active:scale-95"
          >
            <Plus size={16} /> REGISTRAR NASCIMENTO
          </button>
        </div>
      </section>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)] print:shadow-none print:border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs uppercase tracking-widest font-bold text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4">Identificação</th>
                <th className="px-6 py-4">Raça</th>
                <th className="px-6 py-4">Nascimento / Idade</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const daysOld = calculateDaysOld(record.birth_date);
                return (
                  <tr key={record.id} className="group border-b border-slate-100 hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-[#1F2937]">
                      <div className="flex items-center gap-4">
                        {record.img_url ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                            <img src={record.img_url} alt={record.identifier} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="bg-[#EFF6FF] p-2 rounded-lg text-[#2563EB] shrink-0">
                            <Baby size={16} />
                          </div>
                        )}
                        {record.identifier}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                      {record.raca}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-[#1F2937]">{new Date(record.birth_date).toLocaleDateString('pt-BR')}</span>
                        <span className="text-xs text-slate-400 font-bold">{daysOld} dia{daysOld !== 1 ? 's' : ''} de vida</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit
                        ${record.status === 'Berçário' ? 'bg-[#FEF3C7] text-[#D97706]' : 
                          record.status === 'Crescimento' ? 'bg-[#DCFCE7] text-[#16A34A]' : 
                          record.status === 'Transferido' ? 'bg-[#DBEAFE] text-[#2563EB]' : 
                          record.status === 'Óbito' ? 'bg-[#FEE2E2] text-[#EF4444]' :
                          'bg-slate-100 text-slate-600'}
                      `}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 print:hidden">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setEditingRecord(record);
                            setActiveTab('historico');
                            setIsAdding(true);
                          }}
                          className="p-2 hover:bg-[#EFF6FF] rounded-xl transition-colors text-slate-400 hover:text-[#2563EB]"
                          title="Acompanhar Crescimento"
                        >
                          <Activity size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setEditingRecord(record);
                            setActiveTab('dados');
                            setIsAdding(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-[#1F2937]"
                          title="Editar Registro"
                        >
                          <MoreVertical size={16} />
                        </button>
                        <button onClick={() => removeRecord(record.id)} className="p-2 hover:bg-[#FEF2F2] rounded-xl transition-colors text-slate-400 hover:text-[#EF4444]"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                    Nenhum nascimento registrado na maternidade.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
              className="relative w-full max-w-2xl bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#1F2937] print:hidden">
                    {editingRecord ? `Gerenciar: ${editingRecord.identifier}` : 'Registrar Nascimento'}
                  </h3>
                  <h3 className="text-2xl font-bold text-[#1F2937] hidden print:block">
                    Ficha do Filhote: {editingRecord?.identifier}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 print:hidden">
                    {editingRecord ? 'Atualize os dados ou acompanhe o crescimento.' : 'Insira os dados do novo filhote.'}
                  </p>
                </div>
                <div className="flex gap-2 print:hidden">
                  {editingRecord && (
                    <button onClick={handlePrintRecord} className="bg-[#EFF6FF] text-[#2563EB] p-2 hover:bg-[#DBEAFE] rounded-xl transition-colors text-sm font-bold uppercase tracking-widest flex items-center gap-2 px-4">
                      Exportar Ficha
                    </button>
                  )}
                  <button onClick={() => setIsAdding(false)} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors">
                    <X size={20} />
                  </button>
                </div>
              </div>

              {editingRecord && (
                <div className="flex gap-4 mb-6 border-b border-slate-100 print:hidden">
                  <button 
                    onClick={() => setActiveTab('dados')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'dados' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-slate-400 hover:text-[#1F2937]'}`}
                  >
                    Dados do Registro
                  </button>
                  <button 
                    onClick={() => setActiveTab('historico')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'historico' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-slate-400 hover:text-[#1F2937]'}`}
                  >
                    Acompanhamento
                  </button>
                </div>
              )}

              {activeTab === 'dados' ? (
                <form onSubmit={handleSaveRecord} className="space-y-6">
                  <div className="flex justify-center mb-8 print:hidden">
                    <label className="w-32 h-32 rounded-3xl bg-[#F8FAFC] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2563EB] transition-colors group relative overflow-hidden">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <div className="text-slate-400 group-hover:text-[#2563EB]"><Baby size={32} /></div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#2563EB]">Foto</span>
                        </>
                      )}
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                    </label>
                  </div>

                  {/* Print View Photo */}
                  <div className="hidden print:flex justify-center mb-8">
                    {imagePreview && (
                      <div className="w-48 h-48 rounded-3xl overflow-hidden border border-slate-200">
                        <img src={imagePreview} alt="Foto do Filhote" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Identificação / Anilha</label>
                      <input required name="identifier" defaultValue={editingRecord?.identifier} type="text" placeholder="Ex: Pintinho 01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Raça / Genética</label>
                      <input required name="raca" defaultValue={editingRecord?.raca} type="text" placeholder="Ex: GSB, Galo Índio" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data de Nascimento</label>
                      <input required name="birth_date" defaultValue={editingRecord?.birth_date} type="date" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status Atual</label>
                      <select name="status" defaultValue={editingRecord?.status || 'Berçário'} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none appearance-none">
                        <option value="Berçário">Berçário</option>
                        <option value="Crescimento">Crescimento</option>
                        <option value="Transferido">Transferido para Plantel</option>
                        <option value="Óbito">Óbito</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Baia / Grupo (Opcional)</label>
                    <input name="baia" defaultValue={editingRecord?.baia} type="text" placeholder="Ex: Baia 01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Peso ao Nascer (g)</label>
                      <input name="initial_weight" defaultValue={editingRecord?.initial_weight} type="number" step="any" placeholder="Ex: 45.5" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Ração</label>
                      <select name="feed_recipe_id" defaultValue={editingRecord?.feed_recipe_id || ''} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none appearance-none">
                        <option value="">Selecione uma Ração...</option>
                        {recipes.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Observações Gerais</label>
                    <textarea name="notes" defaultValue={editingRecord?.notes} placeholder="Informações adicionais sobre o filhote..." rows={3} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none resize-none"></textarea>
                  </div>

                  <button type="submit" className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] transition-all print:hidden">
                    {editingRecord ? 'Atualizar Dados' : 'Salvar Nascimento'}
                  </button>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center print:hidden">
                    <h4 className="text-sm font-bold text-[#1F2937] uppercase tracking-widest">Histórico de Peso e Desenvolvimento</h4>
                    <button 
                      onClick={() => setIsAddingHistory(true)}
                      className="text-xs font-bold text-[#2563EB] uppercase tracking-widest bg-[#EFF6FF] px-4 py-2 rounded-xl hover:bg-[#DBEAFE] transition-colors"
                    >
                      + Novo Registro
                    </button>
                  </div>

                  {isAddingHistory && (
                    <form onSubmit={handleSaveHistory} className="bg-[#F8FAFC] p-5 rounded-2xl border border-slate-200 space-y-4 relative">
                      <button type="button" onClick={() => setIsAddingHistory(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={16} /></button>
                      <h5 className="text-xs font-bold text-[#1F2937] uppercase tracking-widest">Adicionar Acompanhamento</h5>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                          <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] font-medium outline-none" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Peso (g)</label>
                          <input required name="weight_grams" type="number" step="0.1" placeholder="Ex: 50.5" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] font-medium outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Observações</label>
                        <input name="notes" type="text" placeholder="Ex: Alimentação normal" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] font-medium outline-none" />
                      </div>
                      <button type="submit" className="w-full py-3 bg-[#10B981] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#059669] transition-all">
                        Salvar Registro
                      </button>
                    </form>
                  )}

                  <div className="space-y-3">
                    {history.length === 0 ? (
                      <p className="text-center py-6 text-sm text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Nenhum registro de crescimento encontrado.
                      </p>
                    ) : (
                      history.map((h) => (
                        <div key={h.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-slate-200 transition-colors">
                          <div className="flex gap-4 items-center">
                            <div className="bg-[#DCFCE7] text-[#16A34A] p-2 rounded-xl">
                              <Activity size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1F2937]">{new Date(h.date).toLocaleDateString('pt-BR')}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-black text-[#2563EB]">{h.weight_grams}g</span>
                                {h.notes && (
                                  <>
                                    <span className="text-slate-300">•</span>
                                    <span className="text-[10px] text-slate-500 font-medium uppercase">{h.notes}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <button onClick={() => removeHistory(h.id)} className="text-slate-400 hover:text-[#EF4444] p-2"><Trash2 size={16} /></button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
