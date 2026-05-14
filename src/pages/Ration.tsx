import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Edit3, 
  ShoppingBag, 
  X, 
  DollarSign, 
  ListChecks, 
  CheckSquare, 
  Square,
  Wheat,
  Loader2,
  Lock,
  Star
} from 'lucide-react';
import { dbService } from '../lib/dbService';
import { useSubscription } from '../hooks/useSubscription';

interface Ingredient {
  id: string;
  name: string;
  price_per_kg: number;
}

interface RecipeItem {
  ingredientId: string;
  weight: number;
}

interface FeedRecipe {
  id: string;
  name: string;
  items: RecipeItem[];
  price_per_kg: number;
  description?: string;
}

export default function Ration() {
  const [activeTab, setActiveTab] = useState<'recipes' | 'ingredients'>('recipes');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<FeedRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  const [isEditingRecipe, setIsEditingRecipe] = useState<FeedRecipe | null>(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [selectedInModal, setSelectedInModal] = useState<RecipeItem[]>([]);

  const [isEditingIngredient, setIsEditingIngredient] = useState<Ingredient | null>(null);
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const { isFreePlan } = useSubscription();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ingData, recData] = await Promise.all([
        dbService.getIngredients(),
        dbService.getRations()
      ]);
      setIngredients(ingData || []);
      setRecipes(recData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isEditingRecipe) {
      setSelectedInModal(isEditingRecipe.items || []);
    } else {
      setSelectedInModal([]);
    }
  }, [isEditingRecipe, isAddingRecipe]);

  // Recipe Methods
  const toggleIngredientInModal = (id: string) => {
    setSelectedInModal(prev => {
      const exists = prev.find(i => i.ingredientId === id);
      if (exists) {
        return prev.filter(i => i.ingredientId !== id);
      }
      return [...prev, { ingredientId: id, weight: 1 }];
    });
  };

  const updateWeightInModal = (id: string, weight: number) => {
    setSelectedInModal(prev => prev.map(i => i.ingredientId === id ? { ...i, weight } : i));
  };

  const calculateTotalPrice = (items: RecipeItem[]) => {
    let totalValue = 0;
    let totalWeight = 0;
    items.forEach(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      if (ing) {
        totalValue += (ing.price_per_kg || 0) * item.weight;
        totalWeight += item.weight;
      }
    });
    return totalWeight > 0 ? totalValue / totalWeight : 0;
  };

  const handleSaveRecipe = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const manualPrice = parseFloat(formData.get('pricePerKg') as string) || 0;
    const items = selectedInModal;
    const finalPrice = items.length > 0 ? calculateTotalPrice(items) : manualPrice;

    const newRecipe: any = {
      id: isEditingRecipe?.id,
      name: formData.get('name') as string,
      items: items,
      price_per_kg: finalPrice || manualPrice,
    };

    try {
      await dbService.saveRation(newRecipe);
      await loadData();
      setIsEditingRecipe(null);
      setIsAddingRecipe(false);
      setSelectedInModal([]);
    } catch (error) {
      alert('Erro ao salvar ração: ' + error);
    }
  };

  const removeRecipe = async (id: string) => {
    if (!confirm('Deseja excluir esta ração?')) return;
    try {
      await dbService.deleteRation(id);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  // Ingredient Methods
  const handleSaveIngredient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newIng: any = {
      id: isEditingIngredient?.id,
      name: formData.get('name') as string,
      price_per_kg: parseFloat(formData.get('pricePerKg') as string) || 0,
    };

    try {
      await dbService.saveIngredient(newIng);
      await loadData();
      setIsEditingIngredient(null);
      setIsAddingIngredient(false);
    } catch (error) {
      alert('Erro ao salvar ingrediente: ' + error);
    }
  };

  const removeIngredient = async (id: string) => {
    if (!confirm('Deseja excluir este ingrediente?')) return;
    try {
      await dbService.deleteIngredient(id);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#2563EB]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Dados...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-10"
    >
      <header className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight">Nutrição Técnica</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Gestão de rações e banco de ingredientes individuais.</p>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('recipes')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'recipes' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-slate-500 hover:text-[#2563EB] border border-slate-200 hover:border-[#2563EB]'
              }`}
            >
              Rações
            </button>
            <button 
              onClick={() => setActiveTab('ingredients')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'ingredients' ? 'bg-[#2563EB] text-white shadow-md' : 'bg-white text-slate-500 hover:text-[#2563EB] border border-slate-200 hover:border-[#2563EB]'
              }`}
            >
              Ingredientes
            </button>
          </div>
        </div>
        
        {isFreePlan ? (
          <></>
        ) : activeTab === 'recipes' ? (
          <button 
            onClick={() => setIsAddingRecipe(true)}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} /> Desenvolver Ração
          </button>
        ) : (
          <button 
            onClick={() => setIsAddingIngredient(true)}
            className="flex items-center gap-2 bg-[#16A34A] text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#15803D] hover:scale-[1.02] active:scale-95 transition-all"
          >
            <Plus size={20} /> Cadastrar Ingrediente
          </button>
        )}
      </header>

      {isFreePlan ? (
        <div className="bg-white border border-[#F59E0B]/30 p-10 rounded-[32px] text-center flex flex-col items-center gap-6 mt-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="bg-[#FEF3C7] p-6 rounded-full">
            <Lock size={48} className="text-[#F59E0B]" />
          </div>
          <div className="max-w-lg">
            <h3 className="text-2xl font-bold text-[#1F2937] font-headline tracking-tight mb-4">Funcionalidade Premium</h3>
            <p className="text-slate-500 font-medium leading-relaxed mb-8">
              O módulo de Nutrição Técnica e gestão de ingredientes está disponível apenas nos planos Profissional e Anual. Assine agora para ter controle total sobre a dieta e os custos de alimentação das suas aves!
            </p>
            <a href="/subscription" className="inline-flex items-center gap-2 bg-[#F59E0B] text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#D97706] hover:scale-[1.02] active:scale-95 transition-all">
              <Star size={18} /> Fazer Upgrade
            </a>
          </div>
        </div>
      ) : activeTab === 'recipes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <motion.div 
              key={recipe.id}
              layout
              className="bg-white border border-slate-100 rounded-3xl p-8 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] group hover:border-[#2563EB]/30 transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#EFF6FF] p-3 rounded-xl border border-[#DBEAFE] text-[#2563EB]">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingRecipe(recipe)} className="p-2 text-slate-400 hover:text-[#2563EB] transition-colors bg-slate-50 hover:bg-[#EFF6FF] rounded-lg">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => removeRecipe(recipe.id)} className="p-2 text-slate-400 hover:text-[#EF4444] transition-colors bg-slate-50 hover:bg-[#FEF2F2] rounded-lg">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-[#1F2937] font-headline mb-2">{recipe.name}</h3>
                
                <div className="space-y-4 my-6">
                  <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3 text-[#2563EB]">
                      <ListChecks size={16} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Fórmula Atual</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(recipe.items || []).map(item => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        return ing ? (
                          <div key={item.ingredientId} className="flex flex-col gap-0.5 bg-white px-3 py-2 rounded-xl border border-slate-200">
                             <span className="text-xs font-bold text-[#1F2937] leading-tight">{ing.name}</span>
                             <span className="text-xs font-medium text-[#2563EB]">{item.weight}kg</span>
                          </div>
                        ) : null;
                      })}
                      {(!recipe.items || recipe.items.length === 0) && <p className="text-xs text-slate-400 italic">Nenhum ingrediente selecionado</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Custo Unitário</span>
                  <div className="flex items-center gap-1 text-[#16A34A]">
                    <span className="text-sm font-bold">R$</span>
                    <span className="text-2xl font-black">{(recipe.price_per_kg || 0).toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-slate-400 ml-1">/ KG</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {recipes.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">
              Nenhuma ração cadastrada no banco.
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {ingredients.map((ing) => (
            <motion.div 
              key={ing.id}
              layout
              className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-[#16A34A]/30 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#DCFCE7] p-3 rounded-xl border border-[#BBF7D0] text-[#16A34A]">
                  <Wheat size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setIsEditingIngredient(ing)} className="p-2 text-slate-400 hover:text-[#16A34A] bg-slate-50 hover:bg-[#DCFCE7] rounded-lg">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => removeIngredient(ing.id)} className="p-2 text-slate-400 hover:text-[#EF4444] bg-slate-50 hover:bg-[#FEF2F2] rounded-lg">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-[#1F2937] font-headline mb-4">{ing.name}</h4>
                <div className="flex items-baseline gap-1 text-[#16A34A]">
                  <span className="text-sm font-bold">R$</span>
                  <span className="text-xl font-black">{(ing.price_per_kg || 0).toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">/ KG</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ingredients.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400 font-medium">
              Nenhum ingrediente cadastrado no banco.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(isAddingRecipe || isEditingRecipe) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingRecipe(false); setIsEditingRecipe(null); }} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#1F2937] tracking-tight">{isEditingRecipe ? 'Editar Fórmula' : 'Desenvolver Ração'}</h3>
                <button type="button" onClick={() => { setIsAddingRecipe(false); setIsEditingRecipe(null); }} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveRecipe} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Ração</label>
                  <input required name="name" defaultValue={isEditingRecipe?.name} type="text" placeholder="Ex: Mix Reprodução" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Selecionar Ingredientes e Pesos (kg)</label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {ingredients.map(ing => {
                      const selectedItem = selectedInModal.find(i => i.ingredientId === ing.id);
                      return (
                        <div key={ing.id} className={`flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border transition-all ${selectedItem ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-slate-100 opacity-70 hover:opacity-100 hover:border-slate-200'}`}>
                          <div 
                            onClick={() => toggleIngredientInModal(ing.id)}
                            className="flex items-center gap-3 cursor-pointer flex-1"
                          >
                            <div className={`h-5 w-5 border border-slate-200 rounded-lg flex items-center justify-center transition-colors bg-white ${selectedItem ? 'border-[#2563EB] bg-[#2563EB]' : ''}`}>
                              <div className={`w-2 h-2 bg-white rounded-full transition-opacity ${selectedItem ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            <span className={`text-sm font-bold ${selectedItem ? 'text-[#2563EB]' : 'text-[#1F2937]'}`}>{ing.name}</span>
                          </div>
                          
                          {selectedItem && (
                            <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-[#DBEAFE] shadow-sm">
                              <input 
                                type="number" 
                                step="0.01"
                                value={selectedItem.weight}
                                onChange={(e) => updateWeightInModal(ing.id, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-transparent text-[#2563EB] text-right outline-none font-bold text-sm"
                                placeholder="Peso"
                              />
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">kg</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {ingredients.length === 0 && <p className="text-sm text-[#EF4444] italic">Nenhum ingrediente cadastrado no banco ainda.</p>}
                </div>

                <div className="space-y-2 bg-[#F8FAFC] p-6 rounded-[24px] border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Custo Total por KG (R$)</label>
                    <span className="bg-[#DCFCE7] text-[#16A34A] text-[9px] font-black px-2 py-1 rounded-full uppercase">Cálculo Automático</span>
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-[#16A34A]" size={24} />
                    <p className="text-4xl font-black text-[#1F2937] pl-8 tracking-tighter">
                       {calculateTotalPrice(selectedInModal).toFixed(2)}
                    </p>
                    <input type="hidden" name="pricePerKg" value={calculateTotalPrice(selectedInModal)} />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">O preço é calculado proporcionalmente aos pesos informados.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setIsAddingRecipe(false); setIsEditingRecipe(null); }} className="flex-1 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all">Finalizar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {(isAddingIngredient || isEditingIngredient) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingIngredient(false); setIsEditingIngredient(null); }} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white border border-slate-100 p-8 sm:p-10 rounded-[32px] shadow-2xl">
              <h3 className="text-2xl font-bold text-[#1F2937] tracking-tight mb-8">{isEditingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}</h3>
              <form onSubmit={handleSaveIngredient} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome do Ingrediente</label>
                  <input required name="name" defaultValue={isEditingIngredient?.name} type="text" placeholder="Ex: Girassol Miúdo" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#16A34A]/50 focus:ring-4 focus:ring-[#16A34A]/10 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Preço por KG (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#16A34A]" size={18} />
                    <input required name="pricePerKg" defaultValue={isEditingIngredient?.price_per_kg} type="number" step="0.01" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-[#1F2937] font-bold focus:bg-white focus:border-[#16A34A]/50 focus:ring-4 focus:ring-[#16A34A]/10 transition-all outline-none" />
                  </div>
                </div>
                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => { setIsAddingIngredient(false); setIsEditingIngredient(null); }} className="flex-1 px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-[#16A34A] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#15803D] hover:scale-[1.02] active:scale-95 transition-all">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
