import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Egg, Thermometer, Bird, MoreHorizontal } from 'lucide-react';

interface BottomNavProps {
  onOpenMenu: () => void;
  profile?: any;
}

const BottomNav = ({ onOpenMenu, profile }: BottomNavProps) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Início', icon: <LayoutDashboard size={20} /> },
    { path: '/eggs', label: 'Ovos', icon: <Egg size={20} /> },
    { path: '/breeding', label: 'Incubação', icon: <Thermometer size={20} /> },
    { path: '/birds', label: 'Aves', icon: <Bird size={20} /> },
  ];

  const hasPermission = (path: string) => {
    if (!profile) return false; // Default to false (fail-secure) while profile is loading
    if (profile.role !== 'tratador') return true;

    if (path === '/') return true;

    const mapping: { [key: string]: string } = {
      '/eggs': 'eggs',
      '/breeding': 'breeding',
      '/birds': 'birds',
    };

    const moduleKey = mapping[path];
    return moduleKey ? (profile.permissions?.[moduleKey] ?? false) : false;
  };

  const visibleNavItems = navItems.filter((item) => hasPermission(item.path));

  return (
    <div className="lg:hidden fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-50 pb-safe transition-colors duration-200">
      <div className="flex justify-around items-center h-16">
        {visibleNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive 
                  ? 'text-[#2563EB] dark:text-blue-500' 
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
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
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-semibold">Mais</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
