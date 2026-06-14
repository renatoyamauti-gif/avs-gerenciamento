import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Egg,
  Inbox
} from 'lucide-react';
import { dbService } from '../lib/dbService';
import { calculateEggStock, normalizeBreed } from '../lib/stockHelper';

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [baias, setBaias] = useState<any[]>([]);
  const [eggLogs, setEggLogs] = useState<any[]>([]);
  const [incubators, setIncubators] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [birds, setBirds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search State
  const [productSearch, setProductSearch] = useState('');

  // Form State
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productWeight, setProductWeight] = useState('0.1');
  const [productWidth, setProductWidth] = useState('10');
  const [productHeight, setProductHeight] = useState('10');
  const [productLength, setProductLength] = useState('10');
  const [productEggRaca, setProductEggRaca] = useState('');
  const [productEggBaia, setProductEggBaia] = useState('');
  const [productEggsPerUnit, setProductEggsPerUnit] = useState('0');
  const [productIsEggLinked, setProductIsEggLinked] = useState(false);
  
  const [savingProduct, setSavingProduct] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, racasData, baiasData, eggLogsData, incubatorsData, ordersData, birdsData] = await Promise.all([
        dbService.getProducts(),
        dbService.getRacas(),
        dbService.getBaias(),
        dbService.getEggLogs(),
        dbService.getIncubators(),
        dbService.getOrders(),
        dbService.getBirds()
      ]);
      setProducts(productsData || []);
      setRacas(racasData || []);
      setBaias(baiasData || []);
      setEggLogs(eggLogsData || []);
      setIncubators(incubatorsData || []);
      setOrders(ordersData || []);
      setBirds(birdsData || []);
    } catch (err) {
      console.error('Erro ao carregar catálogo de produtos:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showFeedback('error', 'Nome do produto é obrigatório.');
      return;
    }
    setSavingProduct(true);
    try {
      const productData = {
        name: productName,
        sku: productSku,
        description: productDescription,
        price: parseFloat(productPrice) || 0,
        stock: parseInt(productStock) || 0,
        weight: parseFloat(productWeight) || 0.1,
        width: parseFloat(productWidth) || 10,
        height: parseFloat(productHeight) || 10,
        length: parseFloat(productLength) || 10,
        egg_raca: productIsEggLinked ? productEggRaca || null : null,
        egg_baia: productIsEggLinked ? productEggBaia || null : null,
        eggs_per_unit: productIsEggLinked ? parseInt(productEggsPerUnit) || 0 : 0
      };

      if (editingProduct) {
        (productData as any).id = editingProduct.id;
      }

      await dbService.saveProduct(productData);
      await loadData();
      
      // Reset Product Form
      resetForm();
      showFeedback('success', editingProduct ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
    } catch (err: any) {
      showFeedback('error', 'Erro ao salvar produto: ' + err.message);
    } finally {
      setSavingProduct(false);
    }
  };

  const resetForm = () => {
    setProductName('');
    setProductSku('');
    setProductDescription('');
    setProductPrice('');
    setProductStock('');
    setProductWeight('0.1');
    setProductWidth('10');
    setProductHeight('10');
    setProductLength('10');
    setProductEggRaca('');
    setProductEggBaia('');
    setProductEggsPerUnit('0');
    setProductIsEggLinked(false);
    setEditingProduct(null);
    setIsAddingProduct(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;
    try {
      await dbService.deleteProduct(id);
      await loadData();
      showFeedback('success', 'Produto excluído com sucesso!');
    } catch (err: any) {
      showFeedback('error', 'Erro ao excluir produto: ' + err.message);
    }
  };

  const handleStartEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name || '');
    setProductSku(product.sku || '');
    setProductDescription(product.description || '');
    setProductPrice(String(product.price || ''));
    setProductStock(String(product.stock || ''));
    setProductWeight(String(product.weight ?? '0.1'));
    setProductWidth(String(product.width ?? '10'));
    setProductHeight(String(product.height ?? '10'));
    setProductLength(String(product.length ?? '10'));
    setProductEggRaca(product.egg_raca || '');
    setProductEggBaia(product.egg_baia || '');
    setProductEggsPerUnit(String(product.eggs_per_unit || '0'));
    setProductIsEggLinked(Boolean(product.egg_raca || product.egg_baia));
    setIsAddingProduct(true);
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const eggStockMap = React.useMemo(() => {
    return calculateEggStock({
      eggLogs,
      incubators,
      orders,
      products,
      birds
    });
  }, [eggLogs, incubators, orders, products, birds]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-[#2563EB]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Catálogo...</p>
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
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight flex items-center gap-3">
            <Tag className="text-[#2563EB]" size={32} />
            Catálogo de Produtos
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Cadastre e gerencie seus produtos, pesos, dimensões para envios e vínculos com o estoque de ovos.
          </p>
        </div>
      </header>

      {/* Feedback messages */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`flex items-center gap-3 p-4 rounded-2xl border ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-xs font-bold uppercase tracking-wider">{feedback.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {isAddingProduct ? (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] max-w-3xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-lg text-[#1F2937] flex items-center gap-2">
              <Tag className="text-[#2563EB]" size={20} />
              {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
            </h3>
            <button 
              type="button"
              onClick={resetForm}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Produto</label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Galo Índio Gigante ou Dúzia Ovos GSB"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código / SKU</label>
                <input
                  type="text"
                  placeholder="Ex: OV-GSB-01"
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descrição</label>
                <textarea
                  placeholder="Breve descrição do produto..."
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço de Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estoque Atual</label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
            </div>

            {/* Packaging and weight specifications */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-[#1F2937] text-sm">Dimensões & Peso de Envio (Padrão)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Peso (kg)</label>
                  <input
                    type="number"
                    step="0.001"
                    min="0.001"
                    placeholder="0.1"
                    value={productWeight}
                    onChange={(e) => setProductWeight(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Comprimento (cm)</label>
                  <input
                    type="number"
                    min="2"
                    placeholder="10"
                    value={productLength}
                    onChange={(e) => setProductLength(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Largura (cm)</label>
                  <input
                    type="number"
                    min="11"
                    placeholder="11"
                    value={productWidth}
                    onChange={(e) => setProductWidth(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Altura (cm)</label>
                  <input
                    type="number"
                    min="2"
                    placeholder="10"
                    value={productHeight}
                    onChange={(e) => setProductHeight(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                Nota: O Melhor Envio possui limites mínimos para dimensões (Ex: largura mínima de 11cm).
              </p>
            </div>

            {/* Egg Stock Linkage */}
            <div className="bg-[#F8FAFC] border border-slate-100 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[#1F2937] text-sm">Vincular ao Estoque de Ovos</h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Se este produto representa ovos (ex: dúzia de ovos), associe-o abaixo para descontar do estoque ao vender.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={productIsEggLinked} 
                    onChange={(e) => setProductIsEggLinked(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                </label>
              </div>

              {productIsEggLinked && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vincular a Raça</label>
                    <select
                      value={productEggRaca}
                      onChange={(e) => {
                        setProductEggRaca(e.target.value);
                        if (e.target.value) setProductEggBaia('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                    >
                      <option value="">Nenhuma raça</option>
                      {racas.map((r: any) => (
                        <option key={r.id} value={r.name}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ou Vincular a Baia</label>
                    <select
                      value={productEggBaia}
                      onChange={(e) => {
                        setProductEggBaia(e.target.value);
                        if (e.target.value) setProductEggRaca('');
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                    >
                      <option value="">Nenhuma baia</option>
                      {baias.map((b: any) => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ovos por Unidade</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="Ex: 12 para dúzia"
                      value={productEggsPerUnit}
                      onChange={(e) => setProductEggsPerUnit(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-[#F1F5F9] text-slate-600 hover:bg-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
              >
                Voltar
              </button>
              <button
                disabled={savingProduct}
                type="submit"
                className="px-6 py-3 bg-[#2563EB] text-white hover:bg-[#1D4ED8] rounded-2xl text-xs font-bold uppercase tracking-widest shadow-md transition-all disabled:opacity-50 cursor-pointer"
              >
                {savingProduct ? 'Salvando...' : 'Salvar Produto'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#1F2937] tracking-tight">Produtos Cadastrados</h3>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                Gerencie seus produtos e defina peso/dimensões para envios.
              </p>
            </div>
            <button
              onClick={() => setIsAddingProduct(true)}
              className="bg-[#2563EB] text-white px-5 py-3 rounded-2xl shadow-sm hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Cadastrar Produto
            </button>
          </div>

          <div className="flex bg-white border border-slate-100 p-2.5 rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] items-center gap-3 max-w-md">
            <Search className="text-slate-400 shrink-0 ml-1.5" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full text-sm text-[#1F2937] outline-none"
            />
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col items-center justify-center gap-4">
              <Inbox size={48} className="text-slate-300" />
              <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider">
                {productSearch ? 'Nenhum produto atende aos critérios de busca.' : 'Nenhum produto cadastrado.'}
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                      <th scope="col" className="px-6 py-4">Produto</th>
                      <th scope="col" className="px-6 py-4">SKU</th>
                      <th scope="col" className="px-6 py-4">Estoque</th>
                      <th scope="col" className="px-6 py-4">Preço</th>
                      <th scope="col" className="px-6 py-4">Peso/Embalagem</th>
                      <th scope="col" className="px-6 py-4">Vínculo Ovos</th>
                      <th scope="col" className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredProducts.map((p) => {
                      const isLinked = Boolean(p.egg_raca || p.egg_baia);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-[#1F2937]">{p.name}</div>
                            {p.description && (
                              <div className="text-xs text-slate-400 font-medium mt-0.5 line-clamp-1">{p.description}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-500 font-mono text-xs">{p.sku || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {/* Estoque Físico */}
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Físico:</span>
                                <span className={`text-xs font-extrabold ${p.stock > 0 ? 'text-slate-700' : p.stock < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                                  {p.stock > 0 ? `+${p.stock}` : p.stock} u.
                                </span>
                              </div>
                              {/* Estoque de Ovos (Coletas) */}
                              {Boolean(p.egg_raca || p.egg_baia) && (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ovos:</span>
                                  {(() => {
                                    const normR = p.egg_raca ? normalizeBreed(p.egg_raca) : null;
                                    const availableEggs = normR 
                                      ? (eggStockMap.racas[normR]?.available || 0) 
                                      : (eggStockMap.baias[p.egg_baia]?.available || 0);
                                    const eggsPerUnit = Number(p.eggs_per_unit) || 1;
                                    const availableUnits = availableEggs >= 0 
                                      ? Math.floor(availableEggs / eggsPerUnit)
                                      : Math.ceil(availableEggs / eggsPerUnit);
                                    
                                    return (
                                      <span className={`text-xs font-black px-1.5 py-0.5 rounded-md ${
                                        availableEggs > 0 
                                          ? 'bg-emerald-50 text-emerald-600' 
                                          : availableEggs < 0 
                                            ? 'bg-rose-50 text-rose-600' 
                                            : 'bg-slate-50 text-slate-400'
                                      }`}>
                                        {availableEggs > 0 ? `+${availableEggs}` : availableEggs} ovos ({availableUnits > 0 ? `+${availableUnits}` : availableUnits} u.)
                                      </span>
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-bold text-slate-800">
                            R$ {(p.price || 0).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-500 text-xs">
                            <div>{p.weight || 0.1} kg</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {p.length || 10}x{p.width || 11}x{p.height || 10} cm
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {isLinked ? (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6]">
                                <Egg size={14} />
                                <span>{p.egg_raca ? `Raça: ${p.egg_raca}` : `Baia: ${p.egg_baia}`}</span>
                                <span className="bg-[#FAF5FF] px-2 py-0.5 rounded-full text-[10px] border border-purple-100">
                                  {p.eggs_per_unit || 0} ovos
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sem vínculo</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleStartEditProduct(p)}
                                className="p-2 hover:bg-slate-100 text-slate-500 hover:text-[#2563EB] rounded-xl transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
