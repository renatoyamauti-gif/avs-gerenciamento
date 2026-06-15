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
import Maternity from './pages/Maternity';
import Remessas from './pages/Remessas';
import Products from './pages/Products';
import Finance from './pages/Finance';
import Ration from './pages/Ration';
import SettingsPage from './pages/Settings';
import Chat from './pages/Chat';
import Subscription from './pages/Subscription';
import BreedingLineage from './pages/BreedingLineage';
import Auth from './components/Auth';
import BottomNav from './components/BottomNav';
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { dbService } from './lib/dbService';
import { useSubscription } from './hooks/useSubscription';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { plan, loading: subLoading, isFreePlan, isTrialExpired, trialDaysLeft, isTrialActive } = useSubscription();

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

  // Define se o sistema deve ser bloqueado totalmente (apenas se o período de testes grátis expirou)
  const isLocked = isFreePlan;

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center transition-colors">
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <Auth />
      </div>
    );
  }

  const hasPermission = (moduleName: string) => {
    if (!profile) return true;
    if (profile.role !== 'tratador') return true;
    return profile.permissions?.[moduleName] ?? false;
  };

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 flex flex-col lg:flex-row pb-16 lg:pb-0 transition-colors duration-200">
        {!isLocked && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} profile={profile} />}
        
        <main className={`flex-1 min-h-screen relative transition-all ${!isLocked ? 'lg:ml-64' : ''}`}>
          {/* Mobile Header */}
          {!isLocked && (
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
          )}

          {/* Desktop Header is imported here */}
          {!isLocked && (
            <div className="hidden lg:block">
              <Header />
            </div>
          )}
          <div className={`pb-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto ${!isLocked ? 'pt-24 lg:pt-28' : 'pt-10'}`}>
            
            {/* Banner de Trial */}
            {!isLocked && isTrialActive && plan === 'free' && (
              <div className="mb-6 bg-gradient-to-r from-amber-400 to-amber-600 text-white p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-amber-500/20">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-full">
                    <Heart size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg font-headline tracking-tight">Período de Teste Ativo</h3>
                    <p className="text-sm font-medium text-white/90">
                      Você tem <span className="font-black text-white">{trialDaysLeft} {trialDaysLeft === 1 ? 'dia' : 'dias'}</span> de acesso total ao sistema.
                    </p>
                  </div>
                </div>
                <a 
                  href="/subscription" 
                  className="w-full sm:w-auto px-6 py-2.5 bg-white text-amber-600 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-amber-50 transition-colors text-center shadow-sm"
                >
                  Assinar Agora
                </a>
              </div>
            )}
            
            {/* Boas-vindas Simplificado conforme solicitado no mockup */}
            {!isLocked && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-white dark:bg-slate-900 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm border border-slate-100 dark:border-slate-800 transition-colors duration-200"
            >
              <div className="flex items-center gap-4">
                <div className="bg-[#E0E7FF] dark:bg-blue-900/30 p-4 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#3B82F6] dark:text-blue-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-[#1F2937] dark:text-slate-100 font-headline tracking-tight uppercase">
                    BEM-VINDO, {getFirstName()}
                  </h2>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                    CRIATÓRIO: {getCriatorioName()}
                  </p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-900 text-[#EF4444] border-2 border-[#FCA5A5] dark:border-red-900/40 rounded-full text-sm font-bold uppercase tracking-widest hover:bg-[#FEF2F2] dark:hover:bg-red-950/20 transition-all cursor-pointer"
              >
                <LogOut size={16} /> Sair da conta
              </button>
            </motion.div>
            )}

            <AnimatePresence mode="wait">
              {isLocked ? (
                <Routes>
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="*" element={<Navigate to="/subscription" />} />
                </Routes>
              ) : (
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/birds" element={hasPermission('birds') ? <Plantel /> : <Navigate to="/" />} />
                  <Route path="/birds/lineage/:id" element={hasPermission('birds') ? <BreedingLineage /> : <Navigate to="/" />} />
                  <Route path="/breeding" element={hasPermission('breeding') ? <Chocadeira /> : <Navigate to="/" />} />
                  <Route path="/maternity" element={hasPermission('maternity') ? <Maternity /> : <Navigate to="/" />} />
                  <Route path="/eggs" element={hasPermission('eggs') ? <EggCollection /> : <Navigate to="/" />} />
                  <Route path="/shipping" element={hasPermission('shipping') ? <Remessas /> : <Navigate to="/" />} />
                  <Route path="/products" element={hasPermission('shipping') ? <Products /> : <Navigate to="/" />} />
                  <Route path="/ration" element={hasPermission('ration') ? <Ration /> : <Navigate to="/" />} />
                  <Route path="/finance" element={hasPermission('finance') ? <Finance /> : <Navigate to="/" />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/chat" element={hasPermission('chat') ? <Chat /> : <Navigate to="/" />} />
                  <Route path="/subscription" element={profile?.role !== 'tratador' ? <Subscription /> : <Navigate to="/" />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              )}
            </AnimatePresence>

            <footer className="pt-12 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mt-20 gap-4 text-center sm:text-left mb-6 transition-colors duration-200">
              <div>2026  AVS GERENCIAMENTO, CRIADO E DESENVOLVIDO POR CRIATÓRIO SITIEIRO - TODOS OS DIREITOS RESERVADOS.</div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <a href="#" className="hover:text-[#2563EB] transition-colors">Política de Privacidade</a>
                <a href="#" className="hover:text-[#2563EB] transition-colors">Termos de Uso</a>
                <a href="#" className="hover:text-[#2563EB] transition-colors">Suporte</a>
              </div>
            </footer>
          </div>
        </main>
        
        {/* Bottom Navigation for Mobile */}
        {!isLocked && <BottomNav onOpenMenu={() => setIsSidebarOpen(true)} profile={profile} />}
      </div>
    </Router>
  );
}
