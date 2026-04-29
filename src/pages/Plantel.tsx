import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Plus, MoreVertical, Hash, Info, History, X, Camera, Trash2, Loader2, Lock, Mars, Venus } from 'lucide-react';
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

  async function loadBirdHistory(birdId: string) {
    try {
      const history = await dbService.getBirdHistory(birdId);
      setBirdHistory(history || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
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
    return matchesSearch && matchesFilter;
  });

  const activeBirds = filteredBirds.filter(b => b.status !== 'Vendida');
  const totalBirds = activeBirds.length;
  const totalMonthlyWeight = activeBirds.reduce((acc, b) => acc + (b.monthly_feed_grams || 0), 0);
  const totalMonthlyCost = activeBirds.reduce((acc, b) => acc + (b.monthly_feed_cost || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="animate-spin text-[#3b82f6]" size={48} />
        <p className="text-[#94a3b8] font-bold uppercase tracking-widest text-xs">Carregando Plantel...</p>
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
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic">Gestão de Aves</h2>
          <p className="text-[#94a3b8] font-medium text-sm">Gerenciamento completo das aves do sistema.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-[#1e293b] border border-[#334155] px-4 py-2 rounded-xl text-[#94a3b8] font-bold text-xs uppercase tracking-widest transition-all hover:bg-[#334155] hover:text-white">
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
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all ${
              isFreePlan && birds.length >= limits.birds
                ? 'bg-[#334155] text-[#94a3b8] cursor-not-allowed opacity-70'
                : 'bg-[#3b82f6] text-white hover:scale-105 active:scale-95'
            }`}
          >
            {isFreePlan && birds.length >= limits.birds ? <Lock size={16} /> : <Plus size={16} />}
            ADICIONAR AVE
          </button>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[#1e293b] border border-[#334155] p-5 sm:p-6 rounded-[24px] flex items-center gap-4">
          <div className="bg-[#3b82f6]/10 p-4 rounded-2xl border border-[#3b82f6]/20 shrink-0">
            <Hash className="text-[#3b82f6]" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Total de Aves</p>
            <p className="text-xl sm:text-2xl font-black text-white italic">{totalBirds}</p>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] p-5 sm:p-6 rounded-[24px] flex items-center gap-4">
          <div className="bg-[#10b981]/10 p-4 rounded-2xl border border-[#10b981]/20 shrink-0">
            <Info className="text-[#10b981]" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Peso Mensal (Total)</p>
            <p className="text-xl sm:text-2xl font-black text-white italic">
              {totalMonthlyWeight >= 1000 ? `${(totalMonthlyWeight / 1000).toFixed(2)} kg` : `${totalMonthlyWeight} g`}
            </p>
          </div>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] p-5 sm:p-6 rounded-[24px] flex items-center gap-4 border-l-4 border-l-[#10b981] sm:col-span-2 lg:col-span-1">
          <div className="bg-[#10b981]/10 p-4 rounded-2xl border border-[#10b981]/20 shrink-0">
            <span className="text-[#10b981] font-black text-xl">R$</span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#475569] uppercase tracking-widest">Custo Mensal (Total)</p>
            <p className="text-xl sm:text-2xl font-black text-[#10b981] italic">
              R$ {totalMonthlyCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-[24px] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-[#334155] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] size-4" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome, anilha ou espécie..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0f172a] text-white rounded-full pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-[#3b82f6]/20 transition-all border-none placeholder-[#94a3b8]/50"
            />
          </div>
          <div className="flex gap-6 text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest overflow-x-auto pb-2">
            {['All', 'Breeding', 'Juvenile', 'Active', 'Resting', 'Vendida', 'Reservada', 'Doente'].map(status => (
              <span 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`cursor-pointer whitespace-nowrap transition-colors ${filterStatus === status ? 'text-[#3b82f6] border-b-2 border-[#3b82f6] pb-1' : 'hover:text-white'}`}
              >
                {status === 'All' ? 'Todos' : (status === 'Breeding' ? 'Reprodução' : status)}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b] text-[10px] uppercase tracking-[0.2em] font-black text-[#94a3b8]/60">
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
                <tr key={bird.id} className="group border-b border-[#334155] hover:bg-[#334155]/30 transition-colors">
                  <td className="px-6 py-4 text-xs">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#334155]">
                        <img src={bird.img_url} alt={bird.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-headline font-bold text-white group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          {bird.name}
                          {bird.gender === 'Macho' && <Mars size={14} className="text-[#3b82f6]" />}
                          {bird.gender === 'Fêmea' && <Venus size={14} className="text-[#f43f5e]" />}
                        </span>
                        <span className="text-[9px] text-[#475569] font-bold uppercase">{bird.origin}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-[#94a3b8] font-mono text-xs">
                      <Hash size={12} className="text-[#475569]" />
                      {bird.ring_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 italic text-xs text-[#94a3b8] font-medium transition-all">
                    {bird.species}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col bg-[#0f172a] p-2 rounded-xl border border-[#334155] w-fit min-w-[100px] group-hover:border-[#3b82f6]/30 transition-colors">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[8px] font-bold text-[#3b82f6]">R$</span>
                        <span className="text-sm font-black text-white">{(bird.monthly_feed_cost || 0).toFixed(2)}</span>
                      </div>
                      <span className="text-[8px] font-bold text-[#475569] uppercase tracking-tighter">mensal</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`
                        px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest w-fit
                        ${bird.status === 'Breeding' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 
                          bird.status === 'Juvenile' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 
                          bird.status === 'Active' ? 'bg-[#10b981]/20 text-[#10b981]' : 
                          bird.status === 'Doente' ? 'bg-[#f43f5e]/20 text-[#f43f5e]' :
                          bird.status === 'Vendida' ? 'bg-[#f43f5e]/20 text-[#f43f5e]' :
                          'bg-[#334155] text-[#94a3b8]'}
                      `}>
                        {bird.status === 'Breeding' ? 'Reprodução' : bird.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button className="p-2 hover:bg-[#334155] rounded-xl transition-colors text-[#94a3b8] hover:text-white"><Info size={14} /></button>
                      <button 
                        onClick={() => {
                          setEditingBird(bird);
                          setIsAdding(true);
                        }}
                        className="p-2 hover:bg-[#334155] rounded-xl transition-colors text-[#94a3b8] hover:text-[#3b82f6]"
                      >
                        <MoreVertical size={14} />
                      </button>
                      <button onClick={() => removeBird(bird.id)} className="p-2 hover:bg-[#334155] rounded-xl transition-colors text-[#94a3b8] hover:text-[#f43f5e]"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Professional Cards */}
        <div className="md:hidden divide-y divide-[#334155]">
          {filteredBirds.map((bird) => (
            <div key={bird.id} className="p-6 space-y-4 hover:bg-[#334155]/10 active:bg-[#334155]/20 transition-all">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border border-[#334155] shadow-lg">
                    <img src={bird.img_url} alt={bird.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-lg tracking-tight font-headline italic flex items-center gap-1">
                      {bird.name}
                      {bird.gender === 'Macho' && <Mars size={16} className="text-[#3b82f6]" />}
                      {bird.gender === 'Fêmea' && <Venus size={16} className="text-[#f43f5e]" />}
                    </h4>
                    <div className="flex items-center gap-2">
                       <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${bird.status === 'Breeding' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'bg-[#334155] text-[#94a3b8]'}`}>
                        {bird.status === 'Breeding' ? 'Reprodução' : bird.status}
                      </span>
                      <span className="text-[10px] text-[#475569] font-mono font-bold">#{bird.ring_number}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingBird(bird); setIsAdding(true); }} className="p-3 bg-[#0f172a] rounded-xl text-[#3b82f6] border border-[#334155] hover:scale-105 transition-all"><MoreVertical size={18} /></button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#334155] flex flex-col justify-center">
                  <p className="text-[8px] font-black text-[#475569] uppercase tracking-widest mb-1">Espécie</p>
                  <p className="text-[11px] font-bold text-white truncate">{bird.species}</p>
                </div>
                <div className="bg-[#0f172a] p-3 rounded-2xl border border-[#334155] flex flex-col justify-center border-l-4 border-l-[#10b981]">
                  <p className="text-[8px] font-black text-[#475569] uppercase tracking-widest mb-1">Custo Mensal</p>
                  <p className="text-sm font-black text-[#10b981]">R$ {(bird.monthly_feed_cost || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredBirds.length === 0 && (
            <div className="py-20 text-center text-[#94a3b8] font-medium opacity-40 italic">
              Nenhuma ave encontrada.
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAdding(false); setEditingBird(null); }} className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-sm" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1e293b] border border-[#334155] p-10 rounded-[32px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white font-headline tracking-tighter italic">
                  {editingBird ? 'Editar Ave' : 'Adicionar Nova Ave'}
                </h3>
                <button onClick={() => { setIsAdding(false); setEditingBird(null); setActiveTab('dados'); setIsAddingHistory(false); }} className="text-[#94a3b8] hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              {editingBird && (
                <div className="flex gap-4 mb-6 border-b border-[#334155]">
                  <button 
                    onClick={() => setActiveTab('dados')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'dados' ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]' : 'text-[#94a3b8] hover:text-white'}`}
                  >
                    Dados Cadastrais
                  </button>
                  <button 
                    onClick={() => setActiveTab('historico')}
                    className={`pb-3 text-sm font-bold uppercase tracking-widest transition-colors ${activeTab === 'historico' ? 'text-[#3b82f6] border-b-2 border-[#3b82f6]' : 'text-[#94a3b8] hover:text-white'}`}
                  >
                    Histórico
                  </button>
                </div>
              )}

              {activeTab === 'dados' ? (
                <form onSubmit={handleSaveBird} className="space-y-8">
                <div className="flex justify-center mb-8">
                  <label className="w-32 h-32 rounded-3xl bg-[#0f172a] border border-dashed border-[#334155] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#3b82f6] transition-colors group relative overflow-hidden">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="text-[#475569] group-hover:text-[#3b82f6]" size={32} />
                        <span className="text-[10px] font-bold text-[#475569] uppercase group-hover:text-[#3b82f6]">Foto</span>
                      </>
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Nome da Ave</label>
                    <input required name="name" defaultValue={editingBird?.name} type="text" placeholder="Ex: Blue Jewel" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Número da Anilha</label>
                    <input required name="ringNumber" defaultValue={editingBird?.ring_number} type="text" placeholder="Ex: MC-2024-001" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-mono" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Sexo</label>
                    <div className="flex gap-4">
                      {['Macho', 'Fêmea'].map(option => (
                        <label key={option} className="flex-1 flex items-center justify-center gap-2 bg-[#0f172a] border border-[#334155] rounded-xl py-3 cursor-pointer transition-colors hover:border-[#3b82f6] has-[:checked]:bg-[#3b82f6]/10 has-[:checked]:border-[#3b82f6] has-[:checked]:text-[#3b82f6]">
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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Espécie</label>
                    <input required name="species" defaultValue={editingBird?.species} type="text" placeholder="Ex: Arara Azul" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Status</label>
                    <select 
                      name="status" 
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium"
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
                    <label className="text-[10px] font-bold text-[#f59e0b] uppercase tracking-widest pl-1">Valor de Venda (R$)</label>
                    <input name="salePrice" defaultValue={editingBird?.sale_price} type="number" step="0.01" placeholder="Ex: 2500" className="w-full bg-[#0f172a] border border-[#f59e0b]/30 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#f59e0b]/50 outline-none text-sm font-bold" />
                  </motion.div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Coloração / Mutação</label>
                  <input name="color" defaultValue={editingBird?.color} type="text" placeholder="Ex: Azul e Ouro" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                </div>

                <div className="space-y-4 pt-4 border-t border-[#334155]">
                  <h4 className="text-[10px] font-black text-[#3b82f6] uppercase tracking-widest">Protocolo Alimentar</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Tipo de Ração</label>
                      <select 
                        name="feedRecipeId" 
                        value={feedRecipeId}
                        onChange={(e) => {
                          setFeedRecipeId(e.target.value);
                          const recipe = recipes.find(r => r.id === e.target.value);
                          setSelectedRecipePrice(recipe?.price_per_kg || 0);
                        }}
                        className={`w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium ${recipes.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        <p className="text-[10px] text-[#f59e0b] mt-1 font-bold">Cadastre uma ração no menu lateral primeiro.</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Consumo Diário (gramas)</label>
                      <input 
                        name="dailyFeedGrams" 
                        defaultValue={editingBird ? (editingBird.monthly_feed_grams || 0) / 30 : ''}
                        type="number" 
                        step="any"
                        placeholder="Ex: 50" 
                        onChange={(e) => setMonthlyGrams((parseFloat(e.target.value) || 0) * 30)}
                        className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" 
                      />
                    </div>
                  </div>
                  {monthlyGrams > 0 && selectedRecipePrice > 0 && (
                    <div className="bg-[#3b82f6]/10 px-4 py-3 rounded-xl border border-[#3b82f6]/30 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-tighter">Consumo Mensal Estimado:</span>
                        <span className="text-[11px] font-black text-white">{(monthlyGrams).toFixed(0)}g</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-tighter">Custo Mensal Estimado:</span>
                        <span className="text-sm font-black text-[#10b981]">R$ {((monthlyGrams / 1000) * selectedRecipePrice).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t border-[#334155]">
                  <h4 className="text-[10px] font-black text-[#10b981] uppercase tracking-widest">Origem e Aquisição</h4>
                  <div className="flex gap-4 mb-4">
                    {['Própria', 'Adquirida'].map(option => (
                      <label key={option} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${birdOrigin === option ? 'bg-[#10b981]/10 border-[#10b981] text-[#10b981]' : 'bg-[#0f172a] border-[#334155] text-[#94a3b8]'}`}>
                        <input 
                          type="radio" 
                          name="origin" 
                          value={option} 
                          checked={birdOrigin === option}
                          onChange={() => setBirdOrigin(option as any)}
                          className="hidden" 
                        />
                        <span className="text-[10px] font-black uppercase tracking-widest">{option}</span>
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
                        <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Nome do Criatório</label>
                        <input name="breederName" defaultValue={editingBird?.breederName} type="text" placeholder="Ex: Criatório Central" className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#10b981]/50 outline-none text-sm font-medium" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Valor de Aquisição (R$)</label>
                        <input name="acquisitionPrice" defaultValue={editingBird?.acquisitionPrice} type="number" placeholder="Ex: 1500" className="w-full bg-[#0f172a] border border-[#10b981]/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#10b981]/50 outline-none text-sm font-medium" />
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full py-4 bg-[#3b82f6] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-[#2563eb] transition-all hover:scale-[1.02] active:scale-95">
                    {editingBird ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </button>
                </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-white font-bold text-sm uppercase tracking-widest">Registros de Histórico</h4>
                    <button 
                      onClick={() => {
                        setIsAddingHistory(!isAddingHistory);
                        if (isAddingHistory) setEditingHistoryItem(null);
                      }} 
                      className="flex items-center gap-2 bg-[#3b82f6] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#2563eb] transition-colors"
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
                        className="bg-[#0f172a] p-5 rounded-2xl border border-[#3b82f6]/50 space-y-4 mb-6 overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Data</label>
                            <input required name="date" type="date" defaultValue={editingHistoryItem?.date || new Date().toISOString().split('T')[0]} className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Peso (g)</label>
                            <input name="weight" type="number" step="any" defaultValue={editingHistoryItem?.weight_grams || ''} placeholder="Ex: 850" className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Saúde</label>
                            <select name="healthStatus" defaultValue={editingHistoryItem?.health_status || 'Normal'} className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium">
                              <option value="Normal">Normal</option>
                              <option value="Em Tratamento">Em Tratamento</option>
                              <option value="Observação">Observação</option>
                              <option value="Doente">Doente</option>
                            </select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1">Anotações (Postura, Alimentação, etc)</label>
                          <textarea name="notes" rows={3} defaultValue={editingHistoryItem?.notes || ''} placeholder="Ex: Iniciou postura hoje. / Mudança de ração para mix de sementes..." className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-[#3b82f6]/50 outline-none text-sm font-medium resize-none"></textarea>
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#3b82f6] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-[#2563eb] transition-all">
                          Salvar Registro
                        </button>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <div className="space-y-3">
                    {birdHistory.length === 0 ? (
                      <div className="py-10 text-center text-[#94a3b8] font-medium opacity-50 italic">
                        Nenhum registro de histórico encontrado.
                      </div>
                    ) : (
                      birdHistory.map((history) => (
                        <div key={history.id} className="bg-[#0f172a] border border-[#334155] p-4 rounded-xl flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="bg-[#1e293b] px-3 py-1 rounded-lg border border-[#334155]">
                                <span className="text-xs font-bold text-white">{new Date(history.date + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                              </div>
                              {history.weight_grams && (
                                <span className="text-xs font-black text-[#10b981]">{history.weight_grams}g</span>
                              )}
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                history.health_status === 'Normal' ? 'bg-[#10b981]/20 text-[#10b981]' : 
                                history.health_status === 'Em Tratamento' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 
                                history.health_status === 'Observação' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 
                                'bg-[#f43f5e]/20 text-[#f43f5e]'
                              }`}>
                                {history.health_status}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => { setEditingHistoryItem(history); setIsAddingHistory(true); }} className="text-[#94a3b8] hover:text-[#3b82f6] transition-colors p-1">
                                <MoreVertical size={14} />
                              </button>
                              <button onClick={() => removeHistory(history.id)} className="text-[#94a3b8] hover:text-[#f43f5e] transition-colors p-1">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {history.notes && (
                            <p className="text-sm text-[#94a3b8] bg-[#1e293b] p-3 rounded-lg border border-[#334155] italic">
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
    </motion.div>
  );
}
