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
  CreditCard
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const menuItems = [
    { path: '/', label: 'PAINEL DE CONTROLE', icon: <LayoutDashboard size={18} /> },
    { path: '/birds', label: 'Gestão de Aves', icon: <Bird size={18} /> },
    { path: '/breeding', label: 'Chocadeira', icon: <Egg size={18} /> },
    { path: '/eggs', label: 'Coleta de Ovos', icon: <Plus size={18} /> },
    { path: '/ration', label: 'Ração', icon: <ArrowRight size={18} /> },
    { path: '/finance', label: 'Financeiro', icon: <Wallet size={18} /> },
    { path: '/settings', label: 'CONFIGURAÇÕES', icon: <Settings size={18} /> },
    { path: '/subscription', label: 'Assinatura', icon: <CreditCard size={18} /> },
  ];

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
        fixed left-0 top-0 h-full w-64 z-[70] bg-[#1e293b] flex flex-col p-6 space-y-2 border-r border-[#334155]
        transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex justify-between items-center mb-8">
          <div className="text-4xl font-black text-white font-headline tracking-tighter italic flex flex-col">
            AVS
            <span className="text-sm font-black tracking-[0.4em] text-[#3b82f6] uppercase -mt-1 leading-none">GERENCIAMENTO</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden text-slate-200 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out font-headline font-semibold uppercase tracking-widest text-sm
                ${location.pathname === item.path 
                  ? 'bg-[#334155] text-[#3b82f6] shadow-sm' 
                  : 'text-slate-200 hover:bg-[#334155]/50 hover:text-white'
                }
              `}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-[#334155] opacity-50 flex items-center justify-center">
          <p className="text-[8px] font-bold text-[#475569] uppercase tracking-[0.2em]">AVS OS v1.0.5</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
