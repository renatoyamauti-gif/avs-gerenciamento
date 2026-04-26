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
        <Loader2 className="animate-spin text-[#3b82f6]" size={48} />
        <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">Carregando Dados...</p>
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
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic">Nutrição Técnica</h2>
          <p className="text-[#94a3b8] font-medium text-sm">Gestão de rações e banco de ingredientes individuais.</p>
          
          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('recipes')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'recipes' ? 'bg-[#3b82f6] text-white' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              Rações
            </button>
            <button 
              onClick={() => setActiveTab('ingredients')}
              className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === 'ingredients' ? 'bg-[#3b82f6] text-white' : 'text-[#94a3b8] hover:text-white'
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
            className="flex items-center gap-2 bg-[#3b82f6] text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} /> DESENVOLVER RAÇÃO
          </button>
        ) : (
          <button 
            onClick={() => setIsAddingIngredient(true)}
            className="flex items-center gap-2 bg-[#10b981] text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={20} /> CADASTRAR INGREDIENTE
          </button>
        )}
      </header>

      {isFreePlan ? (
        <div className="bg-[#1e293b] border border-[#f59e0b]/30 p-10 rounded-[32px] text-center flex flex-col items-center gap-6 mt-8">
          <div className="bg-[#f59e0b]/10 p-6 rounded-full">
            <Lock size={48} className="text-[#f59e0b]" />
          </div>
          <div className="max-w-lg">
            <h3 className="text-2xl font-black text-white font-headline tracking-tighter italic mb-4">Funcionalidade Premium</h3>
            <p className="text-[#94a3b8] font-medium leading-relaxed mb-8">
              O módulo de Nutrição Técnica e gestão de ingredientes está disponível apenas nos planos Profissional e Anual. Assine agora para ter controle total sobre a dieta e os custos de alimentação das suas aves!
            </p>
            <a href="/subscription" className="inline-flex items-center gap-2 bg-gradient-to-r from-[#eab308] to-[#f59e0b] text-[#1e293b] px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.3)] hover:scale-105 active:scale-95 transition-all">
              <Star size={16} /> Fazer Upgrade
            </a>
          </div>
        </div>
      ) : activeTab === 'recipes' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <motion.div 
              key={recipe.id}
              layout
              className="bg-[#1e293b] border border-[#334155] rounded-[32px] p-8 flex flex-col justify-between shadow-sm group hover:border-[#3b82f6]/40 transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#3b82f6]/10 p-3 rounded-xl text-[#3b82f6]">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingRecipe(recipe)} className="p-2 text-[#94a3b8] hover:text-[#3b82f6] transition-colors">
                      <Edit3 size={18} />
                    </button>
                    <button onClick={() => removeRecipe(recipe.id)} className="p-2 text-[#94a3b8] hover:text-[#f43f5e] transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-white font-headline mb-2">{recipe.name}</h3>
                
                <div className="space-y-4 my-6">
                  <div className="bg-[#0f172a] p-4 rounded-2xl border border-[#334155]/30">
                    <div className="flex items-center gap-2 mb-3 text-[#3b82f6]">
                      <ListChecks size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Fórmula Atual</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(recipe.items || []).map(item => {
                        const ing = ingredients.find(i => i.id === item.ingredientId);
                        return ing ? (
                          <div key={item.ingredientId} className="flex flex-col gap-0.5 bg-[#0f172a] px-3 py-2 rounded-xl border border-[#334155]">
                             <span className="text-[10px] font-bold text-white leading-tight">{ing.name}</span>
                             <span className="text-[9px] font-medium text-[#3b82f6] italic">{item.weight}kg</span>
                          </div>
                        ) : null;
                      })}
                      {(!recipe.items || recipe.items.length === 0) && <p className="text-[10px] text-[#475569] italic">Nenhum ingrediente selecionado</p>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-[#334155]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#94a3b8] uppercase">Custo Unitário</span>
                  <div className="flex items-center gap-1 text-[#3b82f6]">
                    <span className="text-sm font-bold">R$</span>
                    <span className="text-2xl font-black">{(recipe.price_per_kg || 0).toFixed(2)}</span>
                    <span className="text-[10px] font-bold text-[#94a3b8] ml-1">/ KG</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {recipes.length === 0 && (
            <div className="col-span-full py-20 text-center text-[#94a3b8] font-medium opacity-40 italic">
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
              className="bg-[#1e293b] border border-[#334155] rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:border-[#10b981]/40 transition-all group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-[#10b981]/10 p-2.5 rounded-xl text-[#10b981]">
                  <Wheat size={20} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setIsEditingIngredient(ing)} className="p-1.5 text-[#94a3b8] hover:text-[#10b981]">
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => removeIngredient(ing.id)} className="p-1.5 text-[#94a3b8] hover:text-[#f43f5e]">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-headline mb-4">{ing.name}</h4>
                <div className="flex items-baseline gap-1 text-[#10b981]">
                  <span className="text-[10px] font-bold">R$</span>
                  <span className="text-xl font-black">{(ing.price_per_kg || 0).toFixed(2)}</span>
                  <span className="text-[9px] font-bold text-[#94a3b8] ml-1">/ KG</span>
                </div>
              </div>
            </motion.div>
          ))}
          {ingredients.length === 0 && (
            <div className="col-span-full py-20 text-center text-[#94a3b8] font-medium opacity-40 italic">
              Nenhum ingrediente cadastrado no banco.
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {(isAddingRecipe || isEditingRecipe) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingRecipe(false); setIsEditingRecipe(null); }} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-2xl bg-[#1e293b] border border-[#334155] p-10 rounded-[40px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-white font-headline tracking-tighter">{isEditingRecipe ? 'Editar Fórmula' : 'Desenvolver Ração'}</h3>
                <button type="button" onClick={() => { setIsAddingRecipe(false); setIsEditingRecipe(null); }} className="text-[#94a3b8] hover:text-white"><X size={20} /></button>
              </div>
              <form onSubmit={handleSaveRecipe} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Nome da Ração</label>
                  <input required name="name" defaultValue={isEditingRecipe?.name} type="text" placeholder="Ex: Mix Reprodução" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#3b82f6]/50 transition-all" />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Selecionar Ingredientes e Pesos (kg)</label>
                  <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {ingredients.map(ing => {
                      const selectedItem = selectedInModal.find(i => i.ingredientId === ing.id);
                      return (
                        <div key={ing.id} className={`flex items-center justify-between p-4 bg-[#0f172a] rounded-2xl border transition-all ${selectedItem ? 'border-[#3b82f6] bg-[#3b82f6]/5' : 'border-[#334155] opacity-70 hover:opacity-100'}`}>
                          <div 
                            onClick={() => toggleIngredientInModal(ing.id)}
                            className="flex items-center gap-3 cursor-pointer flex-1"
                          >
                            <div className={`h-5 w-5 border border-[#334155] rounded-lg flex items-center justify-center transition-colors ${selectedItem ? 'bg-[#3b82f6] border-[#3b82f6]' : 'bg-transparent'}`}>
                              <div className={`w-2 h-2 bg-white rounded-full transition-opacity ${selectedItem ? 'opacity-100' : 'opacity-0'}`} />
                            </div>
                            <span className="text-sm font-bold text-white">{ing.name}</span>
                          </div>
                          
                          {selectedItem && (
                            <div className="flex items-center gap-3 bg-[#1e293b] px-3 py-2 rounded-xl border border-[#334155]">
                              <input 
                                type="number" 
                                step="0.01"
                                value={selectedItem.weight}
                                onChange={(e) => updateWeightInModal(ing.id, parseFloat(e.target.value) || 0)}
                                className="w-16 bg-transparent text-white text-right outline-none font-bold text-xs"
                                placeholder="Peso"
                              />
                              <span className="text-[10px] font-bold text-[#94a3b8] uppercase">kg</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {ingredients.length === 0 && <p className="text-xs text-[#f43f5e] italic">Nenhum ingrediente cadastrado no banco ainda.</p>}
                </div>

                <div className="space-y-2 bg-[#3b82f6]/5 p-6 rounded-[24px] border border-[#3b82f6]/20">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest pl-1">Custo Total por KG (R$)</label>
                    <span className="bg-[#10b981] text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Cálculo Automático</span>
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-[#3b82f6]" size={20} />
                    <p className="text-4xl font-black text-white pl-8">
                       {calculateTotalPrice(selectedInModal).toFixed(2)}
                    </p>
                    <input type="hidden" name="pricePerKg" value={calculateTotalPrice(selectedInModal)} />
                  </div>
                  <p className="text-[10px] text-[#94a3b8] mt-2 italic font-medium">O preço é calculado proporcionalmente aos pesos informados.</p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setIsAddingRecipe(false); setIsEditingRecipe(null); }} className="flex-1 px-6 py-4 rounded-xl font-bold text-[10px] uppercase tracking-widest text-[#94a3b8] hover:bg-[#334155]">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-4 bg-[#3b82f6] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#2563eb]">Finalizar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {(isAddingIngredient || isEditingIngredient) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddingIngredient(false); setIsEditingIngredient(null); }} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] border border-[#334155] p-8 rounded-[32px] shadow-2xl">
              <h3 className="text-2xl font-bold text-white font-headline mb-6">{isEditingIngredient ? 'Editar Ingrediente' : 'Novo Ingrediente'}</h3>
              <form onSubmit={handleSaveIngredient} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Nome do Ingrediente</label>
                  <input required name="name" defaultValue={isEditingIngredient?.name} type="text" placeholder="Ex: Girassol Miúdo" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#10b981]/50 transition-all font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Preço por KG (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10b981]" size={16} />
                    <input required name="pricePerKg" defaultValue={isEditingIngredient?.price_per_kg} type="number" step="0.01" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl pl-10 pr-4 py-3 text-white outline-none focus:ring-2 focus:ring-[#10b981]/50 font-bold" />
                  </div>
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => { setIsAddingIngredient(false); setIsEditingIngredient(null); }} className="flex-1 px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-[#94a3b8] hover:bg-[#334155]">Cancelar</button>
                  <button type="submit" className="flex-1 px-6 py-3 bg-[#10b981] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#059669]">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
