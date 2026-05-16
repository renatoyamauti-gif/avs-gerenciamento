/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Plus, LogOut, Heart, Menu } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Plantel from './pages/Plantel';
import EggCollection from './pages/EggCollection';
import Chocadeira from './pages/Chocadeira';
import Finance from './pages/Finance';
import Ration from './pages/Ration';
import SettingsPage from './pages/Settings';
import Subscription from './pages/Subscription';
import Auth from './components/Auth';
import BottomNav from './components/BottomNav';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { dbService } from './lib/dbService';
export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session) {
        dbService.getProfile().then(setProfile);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        dbService.getProfile().then(setProfile);
      } else {
        setProfile(null);
      }
    });

    const handleProfileUpdate = () => {
      dbService.getProfile().then(setProfile);
    };
    window.addEventListener('profileUpdated', handleProfileUpdate);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getFirstName = () => {
    if (profile?.full_name) {
      const name = profile.full_name.split(' ')[0];
      return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }
    const emailName = session?.user?.email?.split('@')[0] || '';
    return emailName.charAt(0).toUpperCase() + emailName.slice(1).toLowerCase();
  };

  const getCriatorioName = () => {
    if (profile?.criatorio_name) {
      return profile.criatorio_name.toUpperCase();
    }
    return 'CRIATÓRIO NÃO CADASTRADO';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="text-[#2563EB] font-bold text-xl font-headline tracking-widest italic uppercase"
        >
          Carregando Sistema...
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row pb-16 lg:pb-0">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 min-h-screen relative lg:ml-64 transition-all">
          {/* Mobile Header (Blue background like the mockup) */}
          <div className="lg:hidden fixed top-0 left-0 w-full bg-[#2563EB] h-16 z-40 flex items-center justify-between px-6 shadow-md">
            <div className="text-2xl font-black text-white font-headline tracking-tighter italic">
              AVS <span className="text-[8px] text-[#DBEAFE] tracking-[0.2em] uppercase">GERENCIAMENTO</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-white hover:text-white/80 transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Desktop Header is imported here but we probably need it transparent or white on desktop */}
          <div className="hidden lg:block">
            <Header />
          </div>
          <div className="pt-24 lg:pt-28 pb-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
            
            {/* Boas-vindas Simplificado conforme solicitado no mockup */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-white rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#E0E7FF] p-4 rounded-full">
                  {/* User icon replacing the Heart to match the mockup */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3B82F6]"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] font-headline tracking-tight uppercase">
                    BEM-VINDO, {getFirstName()}
                  </h2>
                  <p className="text-sm font-bold text-slate-500 mt-1 uppercase tracking-widest">
                    CRIATÓRIO: {getCriatorioName()}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-[#EF4444] border-2 border-[#FCA5A5] rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#FEF2F2] transition-colors"
              >
                <LogOut size={16} /> Sair da conta
              </button>
            </motion.div>

            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/birds" element={<Plantel />} />
                <Route path="/breeding" element={<Chocadeira />} />
                <Route path="/eggs" element={<EggCollection />} />
                <Route path="/ration" element={<Ration />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/subscription" element={<Subscription />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>

            <footer className="pt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-sm font-semibold text-slate-400 uppercase tracking-[0.1em] mt-20 gap-4 text-center sm:text-left mb-6">
              <div>® 2026 AVS GERENCIAMENTOS - Todos os direitos reservados.</div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <a href="#" className="hover:text-[#2563EB] transition-colors">Política de Privacidade</a>
                <a href="#" className="hover:text-[#2563EB] transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-[#2563EB] transition-colors">Suporte</a>
              </div>
            </footer>
          </div>
        </main>
        
        {/* Bottom Navigation for Mobile */}
        <BottomNav onOpenMenu={() => setIsSidebarOpen(true)} />
      </div>
    </Router>
  );
}
