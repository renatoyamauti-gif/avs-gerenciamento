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
          {visibleMenuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-headline font-semibold uppercase tracking-widest text-sm
                ${location.pathname === item.path 
                  ? 'bg-[#E0E7FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#3B82F6]'
                }
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 opacity-80 flex items-center justify-center">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">AVS OS v1.0.5</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
