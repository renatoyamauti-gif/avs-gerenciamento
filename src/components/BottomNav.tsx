import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Egg, Thermometer, Bird, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
}

const BottomNav = ({ onOpenMenu }: BottomNavProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { path: '/eggs', label: 'Coleta', icon: <Egg size={20} /> },
    { path: '/breeding', label: 'Incubação', icon: <Thermometer size={20} /> },
    { path: '/birds', label: 'Aves', icon: <Bird size={20} /> },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#2563EB]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </Link>
          );
        })}
        
        {/* "Mais" button to open the Sidebar on mobile */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-semibold">Mais</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
