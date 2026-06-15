import { useState, useEffect } from 'react';
import { Bell, Settings, Search, Sun, Moon, Wifi, WifiOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IMAGES } from '../constants';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabaseClient';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(true);

  useEffect(() => {
    const checkConnection = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        setSupabaseConnected(false);
        return;
      }
      setIsOnline(true);
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error && error.message === 'Failed to fetch') {
          setSupabaseConnected(false);
        } else {
          setSupabaseConnected(true);
        }
      } catch {
        setSupabaseConnected(false);
      }
    };

    const handleOnline = () => {
      checkConnection();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSupabaseConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    checkConnection();

    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl hidden lg:flex justify-between items-center px-10 py-4 border-b border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="flex items-center gap-6">
        <div className="text-xl font-black text-[#1F2937] dark:text-slate-100 font-headline tracking-tighter italic">
          AVS <span className="text-sm text-[#2563EB] dark:text-blue-500 tracking-[0.2em] font-bold not-italic">GERENCIAMENTO</span>
        </div>
        <div className="relative group hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 size-4" />
          <input 
            type="text" 
            placeholder="Buscar no sistema..." 
            className="bg-[#F8FAFC] dark:bg-slate-800 text-[#1F2937] dark:text-slate-100 rounded-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 w-64 transition-all placeholder-slate-400 dark:placeholder-slate-550 font-medium outline-none"
          />
        </div>
      </div>
      <div className="flex items-center gap-6">
        {/* Connection Indicator */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-300 ${
          isOnline && supabaseConnected
            ? 'bg-[#EFF6FF] dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 border-[#DBEAFE] dark:border-blue-900/40'
            : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/40'
        }`}>
          {isOnline && supabaseConnected ? (
            <>
              <Wifi className="size-3.5 text-[#2563EB] dark:text-blue-400 animate-pulse" />
              <span>Conectado</span>
            </>
          ) : (
            <>
              <WifiOff className="size-3.5 text-red-600 dark:text-red-400" />
              <span>Sem internet</span>
            </>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </button>

        {/* Notification Bell */}
        <div className="relative group">
          <Bell className="text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 cursor-pointer transition-colors size-5" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-[#EF4444] rounded-full border border-white dark:border-slate-900"></span>
        </div>

        {/* Profile Avatar */}
        <Link to="/settings" className="h-10 w-10 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#2563EB] dark:hover:border-blue-500 transition-colors cursor-pointer block">
          <img 
            src={IMAGES.curator} 
            alt="Curator Profile" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
        </Link>
      </div>
    </header>
  );
};

export default Header;
