/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bird, 
  Egg, 
  Wallet, 
  Settings, 
  Plus,
  ArrowRight,
  X,
  CreditCard,
  Baby,
  MessageSquare,
  Truck,
  Tag
} from 'lucide-react';
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: any;
}

const colorThemes: Record<string, {
  activeLink: string;
  activeIcon: string;
  inactiveIcon: string;
  hoverLink: string;
}> = {
  '/': {
    activeLink: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-450',
    activeIcon: 'bg-blue-600 text-white shadow-md shadow-blue-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-blue-50/50 dark:hover:bg-blue-950/15 hover:text-blue-650 dark:hover:text-blue-450'
  },
  '/birds': {
    activeLink: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-450',
    activeIcon: 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-indigo-50/50 dark:hover:bg-indigo-950/15 hover:text-indigo-650 dark:hover:text-indigo-455'
  },
  '/breeding': {
    activeLink: 'bg-amber-50 dark:bg-amber-955/15 text-amber-600 dark:text-amber-450',
    activeIcon: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-amber-50/50 dark:hover:bg-amber-955/10 hover:text-amber-650 dark:hover:text-amber-450'
  },
  '/maternity': {
    activeLink: 'bg-rose-50 dark:bg-rose-955/15 text-rose-600 dark:text-rose-450',
    activeIcon: 'bg-rose-500 text-white shadow-md shadow-rose-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-rose-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-rose-50/50 dark:hover:bg-rose-955/10 hover:text-rose-650 dark:hover:text-rose-450'
  },
  '/eggs': {
    activeLink: 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-450',
    activeIcon: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-sky-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-sky-50/50 dark:hover:bg-sky-950/15 hover:text-sky-650 dark:hover:text-sky-455'
  },
  '/shipping': {
    activeLink: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450',
    activeIcon: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/15 hover:text-emerald-650 dark:hover:text-emerald-450'
  },
  '/products': {
    activeLink: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-450',
    activeIcon: 'bg-purple-500 text-white shadow-md shadow-purple-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-purple-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-purple-50/50 dark:hover:bg-purple-950/15 hover:text-purple-650 dark:hover:text-purple-450'
  },
  '/ration': {
    activeLink: 'bg-teal-50 dark:bg-teal-955/15 text-teal-600 dark:text-teal-455',
    activeIcon: 'bg-teal-500 text-white shadow-md shadow-teal-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-teal-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-teal-50/50 dark:hover:bg-teal-955/10 hover:text-teal-650 dark:hover:text-teal-450'
  },
  '/finance': {
    activeLink: 'bg-green-50 dark:bg-green-955/15 text-green-600 dark:text-green-455',
    activeIcon: 'bg-green-600 text-white shadow-md shadow-green-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-green-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-green-50/50 dark:hover:bg-green-955/10 hover:text-green-650 dark:hover:text-green-450'
  },
  '/settings': {
    activeLink: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200',
    activeIcon: 'bg-slate-600 text-white shadow-md shadow-slate-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-slate-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-700 dark:hover:text-slate-200'
  },
  '/chat': {
    activeLink: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-455',
    activeIcon: 'bg-violet-500 text-white shadow-md shadow-violet-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-violet-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-violet-50/50 dark:hover:bg-violet-950/15 hover:text-violet-650 dark:hover:text-violet-455'
  },
  '/subscription': {
    activeLink: 'bg-pink-50 dark:bg-pink-955/15 text-pink-600 dark:text-pink-455',
    activeIcon: 'bg-pink-500 text-white shadow-md shadow-pink-500/20',
    inactiveIcon: 'bg-[#F1F5F9] dark:bg-slate-800/80 text-slate-400 dark:text-slate-500 group-hover:bg-pink-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-sm',
    hoverLink: 'hover:bg-pink-50/50 dark:hover:bg-pink-955/10 hover:text-pink-650 dark:hover:text-pink-455'
  }
};

const Sidebar = ({ isOpen, onClose, profile }: SidebarProps) => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: "PAINEL DE CONTROLE", icon: <LayoutDashboard size={18} /> },
    { path: '/birds', label: "Gestão de Aves", icon: <Bird size={18} /> },
    { path: '/breeding', label: "Chocadeira", icon: <Egg size={18} /> },
    { path: '/maternity', label: "Maternidade", icon: <Baby size={18} /> },
    { path: '/eggs', label: "Ovos", icon: <Plus size={18} /> },
    { path: '/shipping', label: "Remessas", icon: <Truck size={18} /> },
    { path: '/products', label: "Produtos", icon: <Tag size={18} /> },
    { path: '/ration', label: "Ração", icon: <ArrowRight size={18} /> },
    { path: '/finance', label: "Financeiro", icon: <Wallet size={18} /> },
    { path: '/settings', label: "CONFIGURAÇÕES", icon: <Settings size={18} /> },
    { path: '/chat', label: "Chat Exclusivo", icon: <MessageSquare size={18} /> },
    { path: '/subscription', label: "Assinatura", icon: <CreditCard size={18} /> },
  ];

  const hasPermission = (path: string) => {
    if (!profile) return true;
    if (profile.role !== 'tratador') return true;

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
  };

  const visibleMenuItems = menuItems.filter(item => hasPermission(item.path));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed left-0 top-0 h-full w-64 z-[70] bg-white dark:bg-slate-900 flex flex-col p-6 space-y-2 border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-4xl font-black text-[#2563EB] dark:text-blue-500 font-headline tracking-tighter italic flex flex-col">
            AVS
            <span className="text-sm font-black tracking-[0.4em] text-[#3B82F6] dark:text-blue-400 uppercase -mt-1 leading-none">GERENCIAMENTO</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-650 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1">
          {visibleMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const theme = colorThemes[item.path] || colorThemes['/'];
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`
                  flex items-center gap-3.5 px-3 py-2.5 rounded-2xl transition-all duration-300 ease-in-out font-headline font-bold uppercase tracking-wider text-xs group
                  ${isActive 
                    ? theme.activeLink + ' shadow-[0_4px_20px_rgba(0,0,0,0.02)]' 
                    : `text-slate-500 dark:text-slate-400 ${theme.hoverLink}`
                  }
                `}
              >
                <div className={`
                  w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ease-in-out shrink-0
                  ${isActive ? theme.activeIcon : theme.inactiveIcon}
                `}>
                  {item.icon}
                </div>
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 opacity-80 flex items-center justify-center">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">AVS OS v1.0.5</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
