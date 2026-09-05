import { useState } from 'react';
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
  Plus
} from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
  profile?: any;
}

const BottomNav = ({ onOpenMenu, profile }: BottomNavProps) => {
  const location = useLocation();
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);

  const mainNavItems = [
    { path: '/', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { path: '/eggs', label: 'Ovos', icon: <Egg size={20} /> },
    { path: '/breeding', label: 'Incubação', icon: <Thermometer size={20} /> },
    { path: '/birds', label: 'Aves', icon: <Bird size={20} /> },
  ];

  const allModules = [
    { path: '/', label: 'Painel Geral', desc: 'Resumo e métricas', icon: <LayoutDashboard size={22} />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { path: '/birds', label: 'Gestão de Aves', desc: 'Plantel e matrizes', icon: <Bird size={22} />, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    { path: '/breeding', label: 'Chocadeira', desc: 'Incubação e lotes', icon: <Thermometer size={22} />, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { path: '/maternity', label: 'Maternidade', desc: 'Nascimentos e filhotes', icon: <Baby size={22} />, color: 'bg-rose-50 text-rose-600 border-rose-200' },
    { path: '/eggs', label: 'Coleta de Ovos', desc: 'Estoque e baias', icon: <Plus size={22} />, color: 'bg-sky-50 text-sky-600 border-sky-200' },
    { path: '/shipping', label: 'Remessas', desc: 'Envios e fretes', icon: <Truck size={22} />, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { path: '/products', label: 'Produtos', desc: 'Catálogo comercial', icon: <Tag size={22} />, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { path: '/ration', label: 'Ração e Dieta', desc: 'Fórmulas e custos', icon: <ArrowRight size={22} />, color: 'bg-teal-50 text-teal-600 border-teal-200' },
    { path: '/finance', label: 'Financeiro', desc: 'Entradas e despesas', icon: <Wallet size={22} />, color: 'bg-green-50 text-green-600 border-green-200' },
    { path: '/chat', label: 'Chat Exclusivo', desc: 'Comunidade criadores', icon: <MessageSquare size={22} />, color: 'bg-violet-50 text-violet-600 border-violet-200' },
    { path: '/settings', label: 'Configurações', desc: 'Criatório e equipe', icon: <Settings size={22} />, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { path: '/subscription', label: 'Assinatura', desc: 'Planos e faturas', icon: <CreditCard size={22} />, color: 'bg-pink-50 text-pink-600 border-pink-200' },
  ];

  const hasPermission = (path: string) => {
    if (profile?.role === 'tratador') {
      if (path === '/') return true;
      if (path === '/settings') return true;
      if (path === '/subscription') return false;

      const mapping: { [key: string]: string } = {
        '/birds': 'birds',
        '/breeding': 'breeding',
        '/maternity': 'maternity',
        '/eggs': 'eggs',
        '/shipping': 'shipping',
        '/products': 'shipping',
        '/ration': 'ration',
        '/finance': 'finance',
        '/chat': 'chat'
      };

      const moduleKey = mapping[path];
      return moduleKey ? (profile.permissions?.[moduleKey] ?? false) : false;
    }
    return true;
  };

  const visibleNavItems = mainNavItems.filter((item) => hasPermission(item.path));
  const visibleAllModules = allModules.filter((item) => hasPermission(item.path));

  return (
    <>
      {/* Bottom Bar for Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe transition-colors duration-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16">
          {visibleNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuModalOpen(false)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive 
                    ? 'text-[#2563EB] dark:text-blue-500 font-bold' 
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
          
          {/* "Menu / Mais" button to open the full pages sheet */}
          <button
            onClick={() => setIsMenuModalOpen(true)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors cursor-pointer ${
              isMenuModalOpen 
                ? 'text-[#2563EB] dark:text-blue-500 font-bold' 
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium'
            }`}
          >
            <MoreHorizontal size={20} />
            <span className="text-[10px] font-semibold">Menu</span>
          </button>
        </div>
      </div>

      {/* Full Mobile Navigation Sheet Modal */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="lg:hidden fixed inset-0 z-[80] flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Slide-up Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl border-t border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden pb-safe"
            >
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
                  aria-label="Fechar"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Grid of All 12 Modules */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
                  Módulos do Sistema ({visibleAllModules.length} disponíveis)
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {visibleAllModules.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMenuModalOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left group ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-sm ring-1 ring-blue-500/20'
                            : 'bg-[#F8FAFC] dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className={`p-2 rounded-xl border shrink-0 ${item.color}`}>
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold font-headline uppercase tracking-tight truncate ${
                            isActive ? 'text-[#2563EB] dark:text-blue-400' : 'text-[#1F2937] dark:text-slate-100'
                          }`}>
                            {item.label}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate font-medium">
                            {item.desc}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Sidebar Drawer Fallback Link */}
                <div className="pt-2">
                  <button
                    onClick={() => {
                      setIsMenuModalOpen(false);
                      onOpenMenu();
                    }}
                    className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>Abrir Barra Lateral Completa</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BottomNav;
