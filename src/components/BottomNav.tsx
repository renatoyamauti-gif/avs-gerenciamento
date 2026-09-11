import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Egg, 
  Thermometer, 
  Bird, 
  MoreHorizontal, 
  Baby, 
  Truck, 
  Tag, 
  ArrowRight, 
  Wallet, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  X,
  Plus,
  SlidersHorizontal,
  Check,
  RotateCcw,
  ArrowLeft,
  LogOut,
  Loader2
} from 'lucide-react';
import { hasPermission } from '../lib/permissions';
import { performSignOut } from '../lib/authHelper';

interface BottomNavProps {
  onOpenMenu: () => void;
  profile?: any;
}

export interface NavModuleDef {
  path: string;
  shortLabel: string;
  label: string;
  desc: string;
  getBottomIcon: () => React.ReactNode;
  icon: React.ReactNode;
  color: string;
}

export const STORAGE_KEY = 'avs_custom_bottom_nav';
export const DEFAULT_NAV_PATHS = ['/', '/eggs', '/breeding', '/birds'];

export const ALL_MODULES: NavModuleDef[] = [
  { 
    path: '/', 
    shortLabel: 'Início', 
    label: 'Painel Geral', 
    desc: 'Resumo e métricas', 
    getBottomIcon: () => <LayoutDashboard size={20} />, 
    icon: <LayoutDashboard size={22} />, 
    color: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900' 
  },
  { 
    path: '/eggs', 
    shortLabel: 'Ovos', 
    label: 'Coleta de Ovos', 
    desc: 'Estoque e baias', 
    getBottomIcon: () => <Egg size={20} />, 
    icon: <Plus size={22} />, 
    color: 'bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900' 
  },
  { 
    path: '/breeding', 
    shortLabel: 'Incubação', 
    label: 'Chocadeira', 
    desc: 'Incubação e lotes', 
    getBottomIcon: () => <Thermometer size={20} />, 
    icon: <Thermometer size={22} />, 
    color: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900' 
  },
  { 
    path: '/birds', 
    shortLabel: 'Aves', 
    label: 'Gestão de Aves', 
    desc: 'Plantel e matrizes', 
    getBottomIcon: () => <Bird size={20} />, 
    icon: <Bird size={22} />, 
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-900' 
  },
  { 
    path: '/maternity', 
    shortLabel: 'Maternidade', 
    label: 'Maternidade', 
    desc: 'Nascimentos e filhotes', 
    getBottomIcon: () => <Baby size={20} />, 
    icon: <Baby size={22} />, 
    color: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900' 
  },
  { 
    path: '/shipping', 
    shortLabel: 'Remessas', 
    label: 'Remessas', 
    desc: 'Envios e fretes', 
    getBottomIcon: () => <Truck size={20} />, 
    icon: <Truck size={22} />, 
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900' 
  },
  { 
    path: '/products', 
    shortLabel: 'Produtos', 
    label: 'Produtos', 
    desc: 'Catálogo comercial', 
    getBottomIcon: () => <Tag size={20} />, 
    icon: <Tag size={22} />, 
    color: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900' 
  },
  { 
    path: '/ration', 
    shortLabel: 'Ração', 
    label: 'Ração e Dieta', 
    desc: 'Fórmulas e custos', 
    getBottomIcon: () => <ArrowRight size={20} />, 
    icon: <ArrowRight size={22} />, 
    color: 'bg-teal-50 text-teal-600 border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900' 
  },
  { 
    path: '/finance', 
    shortLabel: 'Financeiro', 
    label: 'Financeiro', 
    desc: 'Entradas e despesas', 
    getBottomIcon: () => <Wallet size={20} />, 
    icon: <Wallet size={22} />, 
    color: 'bg-green-50 text-green-600 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-900' 
  },
  { 
    path: '/chat', 
    shortLabel: 'Chat', 
    label: 'Chat Exclusivo', 
    desc: 'Comunidade criadores', 
    getBottomIcon: () => <MessageSquare size={20} />, 
    icon: <MessageSquare size={22} />, 
    color: 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/50 dark:text-violet-400 dark:border-violet-900' 
  },
  { 
    path: '/settings', 
    shortLabel: 'Ajustes', 
    label: 'Configurações', 
    desc: 'Criatório e equipe', 
    getBottomIcon: () => <Settings size={20} />, 
    icon: <Settings size={22} />, 
    color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
  },
  { 
    path: '/subscription', 
    shortLabel: 'Plano', 
    label: 'Assinatura', 
    desc: 'Planos e faturas', 
    getBottomIcon: () => <CreditCard size={20} />, 
    icon: <CreditCard size={22} />, 
    color: 'bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-950/50 dark:text-pink-400 dark:border-pink-900' 
  },
];

export default function BottomNav({ onOpenMenu, profile }: BottomNavProps) {
  const location = useLocation();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customError, setCustomError] = useState('');

  // Carrega atalhos customizados do localStorage com fallback
  const [selectedPaths, setSelectedPaths] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.slice(0, 4);
        }
      }
    } catch (e) {
      console.error('Falha ao carregar atalhos do bottomNav:', e);
    }
    return DEFAULT_NAV_PATHS;
  });

  // Estado temporário durante a edição no modal
  const [tempSelectedPaths, setTempSelectedPaths] = useState<string[]>(selectedPaths);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setIsMenuModalOpen(false);
    await performSignOut();
  };

  useEffect(() => {
    setTempSelectedPaths(selectedPaths);
  }, [selectedPaths]);

  // Sincroniza com alterações feitas na tela de Configurações
  useEffect(() => {
    const handleSync = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setSelectedPaths(e.detail);
      } else {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) setSelectedPaths(JSON.parse(saved));
        } catch {}
      }
    };

    window.addEventListener('avs_custom_nav_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('avs_custom_nav_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Filtra os módulos de acordo com as permissões do perfil atual
  const visibleAllModules = ALL_MODULES.filter(item => hasPermission(profile, item.path));

  // Itens que serão exibidos na barra inferior (máximo de 4)
  const visibleNavItems = selectedPaths
    .map(path => ALL_MODULES.find(m => m.path === path))
    .filter((item): item is NavModuleDef => Boolean(item))
    .filter(item => hasPermission(profile, item.path));

  // Caso todos os atalhos customizados estejam bloqueados por permissão, fallback seguro
  const finalNavItems = visibleNavItems.length > 0 
    ? visibleNavItems 
    : ALL_MODULES.filter(item => hasPermission(profile, item.path)).slice(0, 4);

  const handleToggleModule = (path: string) => {
    setCustomError('');
    if (tempSelectedPaths.includes(path)) {
      if (tempSelectedPaths.length <= 1) {
        setCustomError('Selecione pelo menos 1 atalho para a barra inferior.');
        return;
      }
      setTempSelectedPaths(tempSelectedPaths.filter(p => p !== path));
    } else {
      if (tempSelectedPaths.length >= 4) {
        setCustomError('Máximo de 4 atalhos atingido. Desmarque um para escolher outro.');
        return;
      }
      setTempSelectedPaths([...tempSelectedPaths, path]);
    }
  };

  const handleSaveCustomNav = () => {
    if (tempSelectedPaths.length === 0) {
      setCustomError('Selecione ao menos 1 atalho.');
      return;
    }
    setSelectedPaths(tempSelectedPaths);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tempSelectedPaths));
      window.dispatchEvent(new CustomEvent('avs_custom_nav_updated', { detail: tempSelectedPaths }));
    } catch (e) {
      console.error('Erro ao salvar atalhos no localStorage:', e);
    }
    setIsCustomizing(false);
    setIsMenuModalOpen(false);
  };

  const handleResetDefault = () => {
    const validDefaults = DEFAULT_NAV_PATHS.filter(path => hasPermission(profile, path));
    setTempSelectedPaths(validDefaults);
    setCustomError('');
  };

  return (
    <>
      {/* Barra Inferior Mobile Fixa */}
      <nav 
        aria-label="Navegação inferior móvel"
        className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe transition-colors duration-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      >
        <div className="flex justify-around items-center h-16 px-1">
          {finalNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  setIsMenuModalOpen(false);
                  setIsCustomizing(false);
                }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                  isActive 
                    ? 'text-[#2563EB] dark:text-blue-500 font-bold' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {item.getBottomIcon()}
                  {isActive && (
                    <motion.div 
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#2563EB] dark:bg-blue-500"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-semibold tracking-tight mt-1 truncate max-w-[62px] text-center">
                  {item.shortLabel}
                </span>
              </Link>
            );
          })}
          
          {/* Botão Fixo "Menu / Mais" */}
          <button
            onClick={() => {
              setIsCustomizing(false);
              setIsMenuModalOpen(true);
            }}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all cursor-pointer ${
              isMenuModalOpen 
                ? 'text-[#2563EB] dark:text-blue-500 font-bold' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
            aria-label="Abrir menu com todas as páginas"
          >
            <div className="relative flex items-center justify-center">
              <MoreHorizontal size={20} />
              {isMenuModalOpen && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#2563EB] dark:bg-blue-500" />
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-tight mt-1">
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Modal / Sheet de Navegação e Personalização */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="lg:hidden fixed inset-0 z-[80] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsMenuModalOpen(false);
                setIsCustomizing(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-up Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[88vh] bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl border-t border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden pb-safe"
            >
              {/* VISTA 1: PERSONALIZAR ATALHOS */}
              {isCustomizing ? (
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Header Personalização */}
                  <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsCustomizing(false);
                          setCustomError('');
                        }}
                        className="p-1.5 -ml-1 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        aria-label="Voltar para o menu"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      <div>
                        <h3 className="text-base font-black font-headline uppercase tracking-tight text-[#1F2937] dark:text-slate-100">
                          Personalizar Atalhos
                        </h3>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                          Escolha até 4 atalhos para a barra inferior
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        tempSelectedPaths.length === 4 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' 
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                      }`}>
                        {tempSelectedPaths.length} de 4
                      </span>
                    </div>
                  </div>

                  {/* Alerta de erro/limite */}
                  {customError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300 text-xs font-bold rounded-2xl flex items-center justify-between"
                    >
                      <span>⚠️ {customError}</span>
                      <button onClick={() => setCustomError('')} className="p-1 text-amber-600 hover:text-amber-800">
                        <X size={14} />
                      </button>
                    </motion.div>
                  )}

                  {/* Lista de Seleção de Módulos */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 custom-scrollbar">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                      Toque para ativar ou desativar o atalho no rodapé:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {visibleAllModules.map((item) => {
                        const isSelected = tempSelectedPaths.includes(item.path);
                        const orderIndex = tempSelectedPaths.indexOf(item.path);

                        return (
                          <button
                            key={item.path}
                            type="button"
                            onClick={() => handleToggleModule(item.path)}
                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all text-left cursor-pointer w-full ${
                              isSelected
                                ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm ring-2 ring-blue-500/20'
                                : 'bg-[#F8FAFC] dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`p-2 rounded-xl border shrink-0 ${item.color}`}>
                                {item.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className={`text-xs font-bold font-headline uppercase tracking-tight truncate ${
                                    isSelected ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#1F2937] dark:text-slate-100'
                                  }`}>
                                    {item.label}
                                  </p>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                    "{item.shortLabel}"
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 ml-2">
                              {isSelected ? (
                                <div className="flex items-center gap-1 bg-[#2563EB] text-white px-2 py-1 rounded-xl text-[11px] font-black shadow-sm">
                                  <Check size={12} strokeWidth={3} />
                                  <span>#{orderIndex + 1}</span>
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-xl border-2 border-slate-300 dark:border-slate-600 flex items-center justify-center text-slate-300" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Barra de Ações Salvar / Restaurar */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      onClick={handleSaveCustomNav}
                      className="w-full py-3.5 px-6 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-2xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Check size={16} />
                      <span>Salvar Atalhos Selecionados ({tempSelectedPaths.length}/4)</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleResetDefault}
                      className="w-full sm:w-auto py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} />
                      <span>Padrão</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* VISTA 2: TODAS AS PÁGINAS E FUNÇÕES (PADRÃO) */
                <div className="flex flex-col flex-1 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-pulse" />
                      <h3 className="text-base font-black font-headline uppercase tracking-tight text-[#1F2937] dark:text-slate-100">
                        Todas as Páginas e Funções
                      </h3>
                    </div>
                    <button 
                      onClick={() => setIsMenuModalOpen(false)}
                      className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
                      aria-label="Fechar modal"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Banner de Acesso Rápido à Personalização */}
                  <div className="flex items-center justify-between px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-100/80 dark:border-blue-900/40">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-[#2563EB]/10 dark:bg-blue-400/10 text-[#2563EB] dark:text-blue-400 rounded-xl">
                        <SlidersHorizontal size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Atalhos do Rodapé
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {finalNavItems.map(i => i.shortLabel).join(', ')}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setTempSelectedPaths(selectedPaths);
                        setIsCustomizing(true);
                        setCustomError('');
                      }}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95"
                    >
                      <SlidersHorizontal size={12} />
                      <span>Alterar</span>
                    </button>
                  </div>

                  {/* Grade dos Módulos do Sistema */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                      Módulos do Sistema ({visibleAllModules.length} disponíveis)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {visibleAllModules.map((item) => {
                        const isActive = location.pathname === item.path;
                        const isPinned = selectedPaths.includes(item.path);

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMenuModalOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group relative ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/20'
                                : 'bg-[#F8FAFC] dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`p-2 rounded-xl border shrink-0 ${item.color}`}>
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-xs font-bold font-headline uppercase tracking-tight truncate ${
                                  isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#1F2937] dark:text-slate-100'
                                }`}>
                                  {item.label}
                                </p>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                                {item.desc}
                              </p>
                            </div>
                            {isPinned && (
                              <span 
                                title="Fixado na barra inferior"
                                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#2563EB] dark:bg-blue-400 ring-2 ring-white dark:ring-slate-900" 
                              />
                            )}
                          </Link>
                        );
                      })}
                    </div>

                    {/* Botão para Personalizar Rodapé em destaque */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setTempSelectedPaths(selectedPaths);
                          setIsCustomizing(true);
                          setCustomError('');
                        }}
                        className="w-full py-3.5 px-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-[#2563EB] dark:text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                      >
                        <SlidersHorizontal size={16} />
                        <span>Personalizar Atalhos do Rodapé</span>
                      </button>
                    </div>

                    {/* Barra Lateral Desktop / Fallback */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuModalOpen(false);
                          onOpenMenu();
                        }}
                        className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <span>Abrir Barra Lateral Completa</span>
                      </button>
                    </div>

                    {/* Botão Sair da Conta no Menu Mobile */}
                    <div className="pt-1 pb-2">
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className="w-full py-3 px-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all cursor-pointer touch-manipulation active:scale-[0.98] disabled:opacity-50 select-none"
                      >
                        {isSigningOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
                        <span>{isSigningOut ? 'Saindo...' : 'Sair da Conta'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
