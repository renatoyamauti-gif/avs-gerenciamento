import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, MoreVertical, Hash, Info, History, X, Camera, Trash2, Loader2, Lock, Mars, Venus, Settings } from 'lucide-react';
import { IMAGES } from '../constants';
import { dbService } from '../lib/dbService';
import { useSubscription } from '../hooks/useSubscription';

interface Bird {
  id: string;
  name: string;
  species: string;
  color: string;
  img_url: string;
  status: string;
  ring_number: string;
  monthly_feed_grams?: number;
  feed_recipe_id?: string;
  monthly_feed_cost?: number;
  origin: 'Própria' | 'Adquirida';
  breeder_name?: string;
  acquisition_price?: number;
  sale_price?: number;
  gender?: 'Macho' | 'Fêmea';
  baia?: string;
  weight?: number;
  vaccination_protocol?: string;
  bird_history?: { id: string }[];
}

export default function Plantel() {
  const [birds, setBirds] = useState<Bird[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingBird, setEditingBird] = useState<Bird | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { isFreePlan, limits } = useSubscription();
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBaia, setFilterBaia] = useState('All');
  const [birdOrigin, setBirdOrigin] = useState<'Própria' | 'Adquirida'>('Própria');
  const [selectedRecipePrice, setSelectedRecipePrice] = useState(0);
  const [monthlyGrams, setMonthlyGrams] = useState(0);
  const [formStatus, setFormStatus] = useState('Active');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedRecipeId, setFeedRecipeId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'dados' | 'historico'>('dados');
  const [birdHistory, setBirdHistory] = useState<any[]>([]);
  const [isAddingHistory, setIsAddingHistory] = useState(false);
  const [editingHistoryItem, setEditingHistoryItem] = useState<any>(null);

  const [extraBaias, setExtraBaias] = useState<string[]>(() => {
    const saved = localStorage.getItem('avs_extra_baias');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('avs_extra_baias', JSON.stringify(extraBaias));
  }, [extraBaias]);

  async function loadBirdHistory(birdId: string) {
    try {
      const history = await dbService.getBirdHistory(birdId);
      setBirdHistory(history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }

  const [baiaTab, setBaiaTab] = useState<'aves' | 'historico'>('aves');
  const [baiaHistory, setBaiaHistory] = useState<any[]>([]);
  const [isAddingBaiaHistory, setIsAddingBaiaHistory] = useState(false);
  const [editingBaiaHistoryItem, setEditingBaiaHistoryItem] = useState<any>(null);
  
  const [baiasData, setBaiasData] = useState<any[]>([]);
  const [isEditingBaia, setIsEditingBaia] = useState(false);
  const [baiaToEdit, setBaiaToEdit] = useState<any>(null);

  useEffect(() => {
    setBaiaTab('aves');
  }, [filterBaia]);

  async function loadBaiaHistoryData(baiaName: string) {
    try {
      const history = await dbService.getBaiaHistory(baiaName);
      setBaiaHistory(history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico da baia:', error);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [birdsData, recipesData] = await Promise.all([
        dbService.getBirds(),
        dbService.getRations()
      ]);
      setBirds(birdsData || []);
      setRecipes(recipesData || []);

      let fetchedBaias: any[] = [];
      try {
        fetchedBaias = await dbService.getBaias();
      } catch (e) {
        console.warn('Baias table might not exist yet');
      }
      setBaiasData(fetchedBaias || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (editingBird) {
      setBirdOrigin(editingBird.origin || 'Própria');
      setFormStatus(editingBird.status || 'Active');
      setMonthlyGrams(editingBird.monthly_feed_grams || 0);
      setFeedRecipeId(editingBird.feed_recipe_id || '');
      setImagePreview(editingBird.img_url || null);
      const recipe = recipes.find(r => r.id === editingBird.feed_recipe_id);
      setSelectedRecipePrice(recipe?.price_per_kg || 0);
      loadBirdHistory(editingBird.id);
    } else {
      setActiveTab('dados');
      setBirdHistory([]);
      setIsAddingHistory(false);
      setEditingHistoryItem(null);
    }
  }, [editingBird, recipes]);

  const handleSaveHistory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingBird) return;
    
    const formData = new FormData(e.currentTarget);
    const historyData: any = {
      bird_id: editingBird.id,
      date: formData.get('date') as string,
      weight_grams: parseFloat(formData.get('weight') as string) || null,
      health_status: formData.get('healthStatus') as string,
      notes: formData.get('notes') as string,
    };

    if (editingHistoryItem?.id) {
      historyData.id = editingHistoryItem.id;
    }

    try {
      await dbService.saveBirdHistory(historyData);
      await loadBirdHistory(editingBird.id);
      setIsAddingHistory(false);
      setEditingHistoryItem(null);
    } catch (error) {
      alert('Erro ao salvar histórico: ' + error);
    }
  };

  const removeHistory = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try {
      await dbService.deleteBirdHistory(id);
      if (editingBird) await loadBirdHistory(editingBird.id);
    } catch (error) {
      alert('Erro ao excluir registro: ' + error);
    }
  };

  const handleSaveBaiaHistory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (filterBaia === 'All') return;
    
    const formData = new FormData(e.currentTarget);
    const actionType = formData.get('action_type') as string;
    const rawNotes = formData.get('notes') as string;
    const combinedNotes = actionType && actionType !== 'Outros' ? `[${actionType}] ${rawNotes}` : rawNotes;

    const historyData: any = {
      baia_name: filterBaia,
      date: formData.get('date') as string,
      notes: combinedNotes,
    };

    if (editingBaiaHistoryItem?.id) {
      historyData.id = editingBaiaHistoryItem.id;
    }

    try {
      await dbService.saveBaiaHistory(historyData);
      await loadBaiaHistoryData(filterBaia);
      setIsAddingBaiaHistory(false);
      setEditingBaiaHistoryItem(null);
    } catch (error) {
      alert('Erro ao salvar histórico: ' + error);
    }
  };

  const removeBaiaHistory = async (id: string) => {
    if (!confirm('Deseja excluir este registro?')) return;
    try {
      await dbService.deleteBaiaHistory(id);
      await loadBaiaHistoryData(filterBaia);
    } catch (error) {
      alert('Erro ao excluir registro: ' + error);
    }
  };

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

  const handleSaveBird = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dailyGrams = parseFloat(formData.get('dailyFeedGrams') as string) || 0;
    const monthlyGramsStorage = dailyGrams * 30;
    const recipeId = formData.get('feedRecipeId') as string;
    const recipe = recipes.find(r => r.id === recipeId);
    const costPerKg = recipe?.price_per_kg || 0;
    const monthlyCost = (monthlyGramsStorage / 1000) * costPerKg;
    const status = formData.get('status') as string;

    const birdData: any = {
      id: editingBird?.id,
      name: formData.get('name') as string,
      ring_number: formData.get('ringNumber') as string,
      species: formData.get('species') as string,
      color: formData.get('color') as string,
      status: status,
      origin: formData.get('origin') as 'Própria' | 'Adquirida',
      breeder_name: formData.get('breederName') as string,
      acquisition_price: parseFloat(formData.get('acquisitionPrice') as string) || 0,
      sale_price: status === 'Vendida' ? parseFloat(formData.get('salePrice') as string) || 0 : null,
      monthly_feed_grams: monthlyGramsStorage,
      feed_recipe_id: recipeId || null,
      monthly_feed_cost: monthlyCost,
      img_url: imagePreview || editingBird?.img_url || IMAGES.bird1,
      gender: formData.get('gender') as 'Macho' | 'Fêmea' || undefined,
      baia: formData.get('baia') as string || null,
      weight: parseFloat(formData.get('weight') as string) || null,
      vaccination_protocol: formData.get('vaccinationProtocol') as string || null,
    };

    try {
      const wasSoldBefore = editingBird?.status === 'Vendida';
      const isNowSold = status === 'Vendida';
      const salePrice = birdData.sale_price;

      await dbService.saveBird(birdData);

      if (isNowSold && !wasSoldBefore && salePrice && salePrice > 0) {
        await dbService.saveTransaction({
          type: 'Entrada',
          category: 'Venda de Aves',
          reason: `Venda da ave: ${birdData.name} (${birdData.ring_number})`,
          amount: salePrice,
          date: new Date().toISOString().split('T')[0]
        });
      }

      await loadData();
      setIsAdding(false);
      setEditingBird(null);
      // Reset temporary states
      setBirdOrigin('Própria');
      setSelectedRecipePrice(0);
      setMonthlyGrams(0);
      setFormStatus('Active');
      setImagePreview(null);
      setFeedRecipeId('');
    } catch (error) {
      alert('Erro ao salvar ave: ' + error);
    }
  };

  const removeBird = async (id: string) => {
    if (!confirm('Deseja excluir esta ave?')) return;
    try {
      await dbService.deleteBird(id);
      await loadData();
    } catch (error) {
      alert('Erro ao excluir: ' + error);
    }
  };

  const filteredBirds = birds.filter(bird => {
    const matchesSearch = bird.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (bird.ring_number?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (bird.species?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'All' || bird.status === filterStatus;
    const matchesBaia = filterBaia === 'All' || bird.baia === filterBaia;
    return matchesSearch && matchesFilter && matchesBaia;
  });

  const uniqueBaias = Array.from(new Set([...birds.map(b => b.baia).filter(Boolean), ...extraBaias, ...baiasData.map(b => b.name)])).sort();

  const activeBirds = filteredBirds.filter(b => b.status !== 'Vendida');
  const totalBirds = activeBirds.length;
  const totalMonthlyWeight = activeBirds.reduce((acc, b) => acc + (b.monthly_feed_grams || 0), 0);
  const totalMonthlyCost = activeBirds.reduce((acc, b) => acc + (b.monthly_feed_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#3b82f6]" size={48} />
        <p className="text-slate-200 font-bold uppercase tracking-widest text-sm">Carregando Plantel...</p>
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
          <h2 className="text-3xl font-headline font-bold text-[#1F2937] tracking-tight">Gestão de Aves</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Gerenciamento completo das aves do sistema.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-[#6B7280] font-bold text-sm uppercase tracking-widest transition-all hover:bg-slate-50 hover:text-[#2563EB] shadow-sm">
            <Filter size={16} />
            Filtrar
          </button>
          <button 
            onClick={() => {
              if (isFreePlan && birds.length >= limits.birds) {
                alert(`Você atingiu o limite de ${limits.birds} aves do plano Iniciante. Acesse o menu Assinatura para fazer o upgrade!`);
                return;
              }
              setEditingBird(null);
              setBirdOrigin('Própria');
              setFormStatus('Active');
              setMonthlyGrams(0);
              setSelectedRecipePrice(0);
              setImagePreview(null);
              setFeedRecipeId('');
              setIsAdding(true);
            }}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm uppercase tracking-widest shadow-md transition-all ${
              isFreePlan && birds.length >= limits.birds
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] hover:scale-105 active:scale-95'
            }`}
          >
            {isFreePlan && birds.length >= limits.birds ? <Lock size={16} /> : <Plus size={16} />}
            ADICIONAR AVE
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="bg-[#EFF6FF] p-4 rounded-2xl border border-[#DBEAFE] shrink-0">
            <Hash className="text-[#2563EB]" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total de Aves</p>
            <p className="text-xl sm:text-2xl font-black text-[#1F2937]">{totalBirds}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl flex items-center gap-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="bg-[#DCFCE7] p-4 rounded-2xl border border-[#BBF7D0] shrink-0">
            <Info className="text-[#16A34A]" size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Peso Mensal (Total)</p>
            <p className="text-xl sm:text-2xl font-black text-[#1F2937]">
              {totalMonthlyWeight >= 1000 ? `${(totalMonthlyWeight / 1000).toFixed(2)} kg` : `${totalMonthlyWeight} g`}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl flex items-center gap-4 border-l-4 border-l-[#16A34A] sm:col-span-2 lg:col-span-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <div className="bg-[#DCFCE7] p-4 rounded-2xl border border-[#BBF7D0] shrink-0">
            <span className="text-[#16A34A] font-black text-xl">R$</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custo Mensal (Total)</p>
            <p className="text-xl sm:text-2xl font-black text-[#16A34A]">
              R$ {totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
              <input 
                type="text" 
                placeholder="Pesquisar por nome, anilha ou espécie..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F8FAFC] text-[#1F2937] rounded-full pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#2563EB]/20 transition-all border border-slate-200 placeholder-slate-400 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest overflow-x-auto pb-2">
            {['All', 'Breeding', 'Juvenile', 'Active', 'Resting', 'Vendida', 'Reservada', 'Doente'].map(status => (
              <span 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`cursor-pointer whitespace-nowrap px-3 py-1.5 rounded-full transition-colors ${filterStatus === status ? 'bg-[#2563EB] text-white' : 'hover:bg-slate-100 hover:text-[#1F2937]'}`}
              >
                {status === 'All' ? 'Todos' : (status === 'Breeding' ? 'Reprodução' : status)}
              </span>
            ))}
          </div>
        </div>
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-[#F8FAFC]">
            <div className="flex gap-3 overflow-x-auto hide-scrollbar flex-1 items-center">
              <button
                onClick={() => setFilterBaia('All')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${filterBaia === 'All' ? 'bg-[#2563EB] text-white border-transparent' : 'bg-white text-slate-500 hover:text-[#2563EB] border border-slate-200 hover:border-[#2563EB]/30'}`}
              >
                Todas as Aves
              </button>
              {uniqueBaias.map(baia => (
                <button
                  key={baia as string}
                  onClick={() => setFilterBaia(baia as string)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-sm ${filterBaia === baia ? 'bg-[#2563EB] text-white border-transparent' : 'bg-white text-slate-500 hover:text-[#2563EB] border border-slate-200 hover:border-[#2563EB]/30'}`}
                >
                  {baia as string}
                </button>
              ))}
              <button
                onClick={() => {
                  setBaiaToEdit(null);
                  setIsEditingBaia(true);
                }}
                className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap shadow-sm bg-white text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981] hover:text-white"
              >
                <Plus size={14} /> Baia
              </button>
            </div>
          </div>
          {filterBaia !== 'All' && (
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white">
              <div className="flex gap-4">
                <button 
                  onClick={() => setBaiaTab('aves')}
                  className={`pb-2 text-sm font-bold uppercase tracking-widest transition-colors ${baiaTab === 'aves' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-slate-400 hover:text-[#1F2937]'}`}
                >
                  Aves da Baia
                </button>
                <button 
                  onClick={() => {
                    setBaiaTab('historico');
                    loadBaiaHistoryData(filterBaia);
                  }}
                  className={`pb-2 text-sm font-bold uppercase tracking-widest transition-colors ${baiaTab === 'historico' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-slate-400 hover:text-[#1F2937]'}`}
                >
                  Histórico
                </button>
              </div>
              <button
                onClick={() => {
                  const bData = baiasData.find(b => b.name === filterBaia) || { name: filterBaia };
                  setBaiaToEdit(bData);
                  setIsEditingBaia(true);
                }}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-[#2563EB] transition-colors bg-[#F8FAFC] px-3 py-1.5 rounded-lg border border-slate-200"
              >
                <Settings size={14} /> Editar Baia
              </button>
            </div>
          )}

        {baiaTab === 'aves' || filterBaia === 'All' ? (
          <>
            <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] text-xs uppercase tracking-widest font-bold text-slate-400 border-b border-slate-100">
                <th className="px-6 py-4">Ave</th>
                <th className="px-6 py-4">Anilha</th>
                <th className="px-6 py-4">Espécie</th>
                <th className="px-6 py-4">Consumo Mensal</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredBirds.map((bird) => (
                <tr key={bird.id} className="group border-b border-slate-100 hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200">
                        <img src={bird.img_url} alt={bird.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-[#1F2937] group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          {bird.name}
                          {bird.gender === 'Macho' && <Mars size={14} className="text-[#2563EB]" />}
                          {bird.gender === 'Fêmea' && <Venus size={14} className="text-[#EF4444]" />}
                          {bird.bird_history && bird.bird_history.length > 0 && (
                            <div title="Possui histórico" className="bg-[#10B981]/10 p-1 rounded-full text-[#10B981] ml-1">
                              <History size={12} />
                            </div>
                          )}
                        </span>
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-slate-400 font-bold uppercase">{bird.origin}</span>
                          {bird.baia && (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">
                              {bird.baia}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-slate-500 font-medium text-sm">
                      <Hash size={12} className="text-slate-400" />
                      {bird.ring_number || 'Sem anilha'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium transition-all">
                    {bird.species}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col bg-white p-2 rounded-xl border border-slate-100 w-fit min-w-[100px] shadow-sm">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-bold text-slate-400">R$</span>
                        <span className="text-sm font-bold text-[#1F2937]">{(bird.monthly_feed_cost || 0).toFixed(2)}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">mensal</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`
                        px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest w-fit
                        ${bird.status === 'Breeding' ? 'bg-[#DBEAFE] text-[#2563EB]' : 
                          bird.status === 'Juvenile' ? 'bg-[#FEF3C7] text-[#D97706]' : 
                          bird.status === 'Active' ? 'bg-[#DCFCE7] text-[#16A34A]' : 
                          bird.status === 'Doente' ? 'bg-[#FEE2E2] text-[#EF4444]' :
                          bird.status === 'Vendida' ? 'bg-[#FEE2E2] text-[#EF4444]' :
                          'bg-slate-100 text-slate-600'}
                      `}>
                        {bird.status === 'Breeding' ? 'Reprodução' : bird.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-[#1F2937]"><Info size={16} /></button>
                      <button 
                        onClick={() => {
                          setEditingBird(bird);
                          setIsAdding(true);
                        }}
                        className="p-2 hover:bg-[#EFF6FF] rounded-xl transition-colors text-slate-400 hover:text-[#2563EB]"
                      >
                        <MoreVertical size={16} />
                      </button>
                      <button onClick={() => removeBird(bird.id)} className="p-2 hover:bg-[#FEF2F2] rounded-xl transition-colors text-slate-400 hover:text-[#EF4444]"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Professional Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredBirds.map((bird) => (
            <div key={bird.id} className="p-6 space-y-4 hover:bg-slate-50 active:bg-slate-100 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                    <img src={bird.img_url} alt={bird.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#1F2937] text-lg tracking-tight flex items-center gap-1">
                      {bird.name}
                      {bird.gender === 'Macho' && <Mars size={16} className="text-[#2563EB]" />}
                      {bird.gender === 'Fêmea' && <Venus size={16} className="text-[#EF4444]" />}
                      {bird.bird_history && bird.bird_history.length > 0 && (
                        <div title="Possui histórico" className="bg-[#10B981]/10 p-1 rounded-full text-[#10B981] ml-1">
                          <History size={14} />
                        </div>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${bird.status === 'Breeding' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-slate-100 text-slate-500'}`}>
                        {bird.status === 'Breeding' ? 'Reprodução' : bird.status}
                      </span>
                      {bird.baia && (
                        <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          {bird.baia}
                        </span>
                      )}
                      <span className="text-xs text-slate-400 font-medium font-mono">#{bird.ring_number || 'S/N'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingBird(bird); setIsAdding(true); }} className="p-2.5 bg-white rounded-xl text-[#2563EB] border border-slate-200 hover:scale-105 shadow-sm transition-all"><MoreVertical size={18} /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Espécie</p>
                  <p className="text-xs font-semibold text-[#1F2937] truncate">{bird.species}</p>
                </div>
                <div className="bg-[#F8FAFC] p-3 rounded-2xl border border-slate-100 flex flex-col justify-center border-l-4 border-l-[#16A34A]">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Custo Mensal</p>
                  <p className="text-sm font-bold text-[#16A34A]">R$ {(bird.monthly_feed_cost || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredBirds.length === 0 && (
            <div className="py-20 text-center text-slate-400 font-medium">
              Nenhuma ave encontrada.
            </div>
          )}
        </div>
          </>
        ) : (
          <div className="p-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="flex justify-between items-center">
                <h4 className="text-[#1F2937] font-bold text-sm uppercase tracking-widest">Registros de Histórico</h4>
                <button 
                  onClick={() => {
                    setIsAddingBaiaHistory(!isAddingBaiaHistory);
                    if (isAddingBaiaHistory) setEditingBaiaHistoryItem(null);
                  }} 
                  className="flex items-center gap-2 bg-[#2563EB] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1D4ED8] transition-colors shadow-sm"
                >
                  {isAddingBaiaHistory ? <X size={14} /> : <Plus size={14} />} 
                  {isAddingBaiaHistory ? 'Cancelar' : 'Novo Registro'}
                </button>
              </div>

              <AnimatePresence>
                {isAddingBaiaHistory && (
                  <motion.form 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveBaiaHistory} 
                    className="bg-[#EFF6FF] p-5 rounded-2xl border border-[#DBEAFE] space-y-4 overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                        <input required name="date" type="date" defaultValue={editingBaiaHistoryItem?.date || new Date().toISOString().split('T')[0]} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Ação</label>
                        <select name="action_type" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium">
                          <option value="Limpeza">Limpeza</option>
                          <option value="Desinfecção">Desinfecção</option>
                          <option value="Manejo">Manejo</option>
                          <option value="Alimentação">Alimentação</option>
                          <option value="Outros">Outros</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Anotações</label>
                      <textarea required name="notes" rows={3} defaultValue={editingBaiaHistoryItem?.notes || ''} placeholder="Ex: Detalhes do registro..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium resize-none"></textarea>
                    </div>
                    <button type="submit" className="w-full py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-sm hover:bg-[#1D4ED8] transition-all">
                      {editingBaiaHistoryItem ? 'Salvar Alteração' : 'Adicionar Histórico'}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="space-y-4">
                {baiaHistory.map(item => (
                  <div key={item.id} className="bg-[#F8FAFC] border border-slate-100 p-4 rounded-2xl group hover:border-slate-200 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-[#1F2937] border border-slate-100 shadow-sm flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
                          {new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingBaiaHistoryItem(item); setIsAddingBaiaHistory(true); }} className="p-1.5 hover:bg-[#EFF6FF] text-slate-400 hover:text-[#2563EB] rounded-lg transition-colors"><MoreVertical size={14} /></button>
                        <button onClick={() => removeBaiaHistory(item.id)} className="p-1.5 hover:bg-[#FEF2F2] text-slate-400 hover:text-[#EF4444] rounded-lg transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">{item.notes}</p>
                  </div>
                ))}
                {baiaHistory.length === 0 && !isAddingBaiaHistory && (
                  <div className="text-center py-10 bg-[#F8FAFC] rounded-2xl border border-dashed border-slate-200">
                    <History className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-slate-400 font-medium text-sm">Nenhum registro de histórico para esta baia.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAdding(false); setEditingBird(null); }} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white p-8 sm:p-10 rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-[#1F2937]">
                    {editingBird ? 'Editar Ave' : 'Adicionar Nova Ave'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium mt-1">Preencha os detalhes da ave abaixo</p>
                </div>
                <button onClick={() => { setIsAdding(false); setEditingBird(null); setActiveTab('dados'); setIsAddingHistory(false); }} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {editingBird && (
                <div className="flex gap-4 mb-6 border-b border-slate-100">
                  <button 
                    onClick={() => setActiveTab('dados')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'dados' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-slate-400 hover:text-[#1F2937]'}`}
                  >
                    Dados Cadastrais
                  </button>
                  <button 
                    onClick={() => setActiveTab('historico')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'historico' ? 'text-[#2563EB] border-b-2 border-[#2563EB]' : 'text-slate-400 hover:text-[#1F2937]'}`}
                  >
                    Histórico
                  </button>
                </div>
              )}

              {activeTab === 'dados' ? (
                <form onSubmit={handleSaveBird} className="space-y-8">
                <div className="flex justify-center mb-8">
                  <label className="w-32 h-32 rounded-3xl bg-[#F8FAFC] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#2563EB] transition-colors group relative overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="text-slate-400 group-hover:text-[#2563EB]" size={32} />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-[#2563EB]">Foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Ave</label>
                    <input required name="name" defaultValue={editingBird?.name} type="text" placeholder="Ex: Blue Jewel" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Número da Anilha (Opcional)</label>
                    <input name="ringNumber" defaultValue={editingBird?.ring_number} type="text" placeholder="Ex: MC-2024-001" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sexo</label>
                    <div className="flex gap-4">
                      {['Macho', 'Fêmea'].map(option => (
                        <label key={option} className="flex-1 flex items-center justify-center gap-2 bg-[#F8FAFC] border border-slate-200 rounded-2xl py-3 cursor-pointer transition-all hover:border-[#2563EB] has-[:checked]:bg-[#EFF6FF] has-[:checked]:border-[#2563EB] has-[:checked]:text-[#2563EB] text-slate-500">
                          <input 
                            type="radio" 
                            name="gender" 
                            value={option} 
                            defaultChecked={editingBird?.gender === option}
                            className="hidden" 
                          />
                          {option === 'Macho' ? <Mars size={16} /> : <Venus size={16} />}
                          <span className="text-xs font-bold uppercase tracking-widest">{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Peso (g)</label>
                    <input 
                      name="weight" 
                      defaultValue={editingBird?.weight || ''} 
                      type="number" 
                      step="any"
                      placeholder="Ex: 850" 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Espécie</label>
                    <input required name="species" defaultValue={editingBird?.species} type="text" placeholder="Ex: Arara Azul" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      name="status" 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none appearance-none"
                    >
                      <option value="Active">Ativa</option>
                      <option value="Breeding">Em Reprodução</option>
                      <option value="Juvenile">Juvenil</option>
                      <option value="Resting">Descanso</option>
                      <option value="Vendida">Vendida</option>
                      <option value="Reservada">Reservada</option>
                      <option value="Doente">Doente</option>
                    </select>
                  </div>
                </div>

                {formStatus === 'Vendida' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-[#F59E0B] uppercase tracking-widest ml-1">Valor de Venda (R$)</label>
                    <input name="salePrice" defaultValue={editingBird?.sale_price} type="number" step="0.01" placeholder="Ex: 2500" className="w-full bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl px-4 py-3 text-[#1F2937] font-bold focus:ring-4 focus:ring-[#F59E0B]/10 transition-all outline-none" />
                  </motion.div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Coloração / Mutação</label>
                    <input name="color" defaultValue={editingBird?.color} type="text" placeholder="Ex: Azul e Ouro" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Baia / Grupo</label>
                    <input 
                      name="baia" 
                      list="baias-list"
                      defaultValue={editingBird ? editingBird.baia : (filterBaia !== 'All' ? filterBaia : '')} 
                      type="text" 
                      placeholder="Ex: Baia 01" 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                    />
                    <datalist id="baias-list">
                      {uniqueBaias.map(baia => (
                        <option key={baia} value={baia} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-[#2563EB] uppercase tracking-widest">Protocolo Alimentar</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo de Ração</label>
                      <select 
                        name="feedRecipeId" 
                        value={feedRecipeId}
                        onChange={(e) => {
                          setFeedRecipeId(e.target.value);
                          const recipe = recipes.find(r => r.id === e.target.value);
                          setSelectedRecipePrice(recipe?.price_per_kg || 0);
                        }}
                        className={`w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none appearance-none ${recipes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={recipes.length === 0}
                      >
                        {recipes.length === 0 ? (
                          <option value="">Nenhuma ração cadastrada</option>
                        ) : (
                          <option value="">Selecione uma Ração...</option>
                        )}
                        {recipes.map(r => (
                          <option key={r.id} value={r.id}>{r.name} (R$ {r.price_per_kg.toFixed(2)}/kg)</option>
                        ))}
                      </select>
                      {recipes.length === 0 && (
                        <p className="text-xs text-[#F59E0B] mt-1 font-bold">Cadastre uma ração no menu lateral primeiro.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Consumo Diário (gramas)</label>
                      <input 
                        name="dailyFeedGrams" 
                        defaultValue={editingBird ? (editingBird.monthly_feed_grams || 0) / 30 : ''}
                        type="number" 
                        step="any"
                        placeholder="Ex: 50" 
                        onChange={(e) => setMonthlyGrams((parseFloat(e.target.value) || 0) * 30)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" 
                      />
                    </div>
                  </div>
                  {monthlyGrams > 0 && selectedRecipePrice > 0 && (
                    <div className="bg-[#EFF6FF] px-4 py-3 rounded-2xl border border-[#DBEAFE] flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">Consumo Mensal Estimado:</span>
                        <span className="text-sm font-black text-[#1F2937]">{(monthlyGrams).toFixed(0)}g</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">Custo Mensal Estimado:</span>
                        <span className="text-sm font-black text-[#16A34A]">R$ {((monthlyGrams / 1000) * selectedRecipePrice).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-[#059669] uppercase tracking-widest">Protocolo Sanitário / Vacinação</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Esquema de Vacinas, Vermífugos e Suplementos</label>
                    <textarea 
                      name="vaccinationProtocol" 
                      defaultValue={editingBird?.vaccination_protocol || ''} 
                      rows={3}
                      placeholder="Ex: Vacina Bouba Aviária em 12/03. Vermífugo programado para 15/06." 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none resize-none" 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h4 className="text-sm font-bold text-[#16A34A] uppercase tracking-widest">Origem e Aquisição</h4>
                  <div className="flex gap-4 mb-4">
                    {['Própria', 'Adquirida'].map(option => (
                      <label key={option} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl border cursor-pointer transition-all ${birdOrigin === option ? 'bg-[#DCFCE7] border-[#16A34A] text-[#16A34A]' : 'bg-[#F8FAFC] border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                        <input 
                          type="radio" 
                          name="origin" 
                          value={option} 
                          checked={birdOrigin === option}
                          onChange={() => setBirdOrigin(option as any)}
                          className="hidden" 
                        />
                        <span className="text-xs font-bold uppercase tracking-widest">{option}</span>
                      </label>
                    ))}
                  </div>

                  {birdOrigin === 'Adquirida' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome do Criatório</label>
                        <input name="breederName" defaultValue={editingBird?.breederName} type="text" placeholder="Ex: Criatório Central" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#16A34A]/50 focus:ring-4 focus:ring-[#16A34A]/10 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Valor de Aquisição (R$)</label>
                        <input name="acquisitionPrice" defaultValue={editingBird?.acquisitionPrice} type="number" placeholder="Ex: 1500" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#16A34A]/50 focus:ring-4 focus:ring-[#16A34A]/10 transition-all outline-none" />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] transition-all hover:scale-[1.02] active:scale-95">
                    {editingBird ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </button>
                </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[#1F2937] font-bold text-sm uppercase tracking-widest">Registros de Histórico</h4>
                    <button 
                      onClick={() => {
                        setIsAddingHistory(!isAddingHistory);
                        if (isAddingHistory) setEditingHistoryItem(null);
                      }} 
                      className="flex items-center gap-2 bg-[#2563EB] text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#1D4ED8] transition-colors shadow-sm"
                    >
                      {isAddingHistory ? <X size={14} /> : <Plus size={14} />} 
                      {isAddingHistory ? 'Cancelar' : 'Novo Registro'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isAddingHistory && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleSaveHistory} 
                        className="bg-[#EFF6FF] p-5 rounded-2xl border border-[#DBEAFE] space-y-4 mb-6 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Data</label>
                            <input required name="date" type="date" defaultValue={editingHistoryItem?.date || new Date().toISOString().split('T')[0]} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Peso (g)</label>
                            <input name="weight" type="number" step="any" defaultValue={editingHistoryItem?.weight_grams || ''} placeholder="Ex: 850" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Saúde</label>
                            <select name="healthStatus" defaultValue={editingHistoryItem?.health_status || 'Normal'} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium appearance-none">
                              <option value="Normal">Normal</option>
                              <option value="Em Tratamento">Em Tratamento</option>
                              <option value="Observação">Observação</option>
                              <option value="Doente">Doente</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Anotações</label>
                          <textarea name="notes" rows={3} defaultValue={editingHistoryItem?.notes || ''} placeholder="Ex: Iniciou postura hoje." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-[#1F2937] focus:ring-2 focus:ring-[#2563EB]/20 outline-none text-sm font-medium resize-none"></textarea>
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] transition-all">
                          Salvar Registro
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3">
                    {birdHistory.length === 0 ? (
                      <div className="py-10 text-center text-slate-400 font-medium">
                        Nenhum registro de histórico encontrado.
                      </div>
                    ) : (
                      birdHistory.map((history) => (
                        <div key={history.id} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col gap-3 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#F8FAFC] px-3 py-1 rounded-lg border border-slate-200">
                                <span className="text-xs font-bold text-slate-600">{new Date(history.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              </div>
                              {history.weight_grams && (
                                <span className="text-sm font-black text-[#16A34A]">{history.weight_grams}g</span>
                              )}
                              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                history.health_status === 'Normal' ? 'bg-[#DCFCE7] text-[#16A34A]' : 
                                history.health_status === 'Em Tratamento' ? 'bg-[#FEF3C7] text-[#D97706]' : 
                                history.health_status === 'Observação' ? 'bg-[#FEF3C7] text-[#D97706]' : 
                                'bg-[#FEE2E2] text-[#EF4444]'
                              }`}>
                                {history.health_status}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingHistoryItem(history); setIsAddingHistory(true); }} className="text-slate-400 hover:text-[#2563EB] transition-colors p-1">
                                <MoreVertical size={16} />
                              </button>
                              <button onClick={() => removeHistory(history.id)} className="text-slate-400 hover:text-[#EF4444] transition-colors p-1">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-slate-100 font-medium leading-relaxed">
                              {history.notes}
                            </p>
                          )}
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


      <AnimatePresence>
        {isEditingBaia && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsEditingBaia(false); setBaiaToEdit(null); }} className="absolute inset-0 bg-[#020617]/40 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white p-8 rounded-[32px] shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-[#1F2937]">
                  {baiaToEdit?.name ? 'Editar Baia' : 'Nova Baia'}
                </h3>
                <button onClick={() => { setIsEditingBaia(false); setBaiaToEdit(null); }} className="bg-[#F8FAFC] p-2 text-slate-400 hover:text-[#EF4444] rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newName = formData.get('name') as string;
                if (!newName) return;
                
                try {
                  const bData: any = {
                    name: newName,
                    old_name: baiaToEdit?.name,
                    description: formData.get('description') as string,
                    capacity: parseInt(formData.get('capacity') as string) || null,
                    type: formData.get('type') as string,
                  };
                  if (baiaToEdit?.id) {
                    bData.id = baiaToEdit.id;
                  }
                  await dbService.saveBaia(bData);
                  
                  if (baiaToEdit?.name && newName !== baiaToEdit.name) {
                    setExtraBaias(prev => prev.filter(b => b !== baiaToEdit.name));
                  }
                  
                  // If new baia, set filter to it
                  setFilterBaia(newName);
                  
                  await loadData();
                  setIsEditingBaia(false);
                  setBaiaToEdit(null);
                } catch (err: any) {
                  alert('Erro ao salvar baia (Lembre-se de rodar o SQL no Supabase!): ' + err.message);
                }
              }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Baia</label>
                  <input required name="name" defaultValue={baiaToEdit?.name || ''} placeholder="Ex: Baia Principal" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tipo / Categoria</label>
                  <select name="type" defaultValue={baiaToEdit?.type || ''} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none">
                    <option value="">Selecione...</option>
                    <option value="Reprodução">Reprodução</option>
                    <option value="Crescimento">Crescimento</option>
                    <option value="Maternidade">Maternidade</option>
                    <option value="Isolamento">Isolamento</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Capacidade (Aves)</label>
                    <input name="capacity" type="number" defaultValue={baiaToEdit?.capacity || ''} placeholder="Ex: 50" className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Descrição / Notas</label>
                  <textarea name="description" rows={3} defaultValue={baiaToEdit?.description || ''} placeholder="Informações adicionais..." className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none resize-none" />
                </div>

                <div className="pt-4 flex gap-3">
                  {baiaToEdit?.id && (
                    <button type="button" onClick={async () => {
                      if (confirm('ATENÇÃO: Deseja excluir os dados desta baia? Isso NÃO excluirá as aves.')) {
                        try {
                          await dbService.deleteBaia(baiaToEdit.id);
                          setFilterBaia('All');
                          await loadData();
                          setIsEditingBaia(false);
                          setBaiaToEdit(null);
                        } catch(e:any) {
                          alert('Erro ao excluir: ' + e.message);
                        }
                      }
                    }} className="px-4 py-3 bg-[#FEF2F2] text-[#EF4444] rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#FEE2E2] transition-colors">
                      <Trash2 size={18} />
                    </button>
                  )}
                  <button type="submit" className="flex-1 py-3 bg-[#2563EB] text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-sm hover:bg-[#1D4ED8] transition-all">
                    Salvar Baia
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
