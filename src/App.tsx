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
import { supabase } from './lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="text-primary font-bold text-xl font-headline tracking-widest italic uppercase"
        >
          Carregando Sistema...
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <Auth />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-surface flex flex-col lg:flex-row">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        <main className="flex-1 min-h-screen relative lg:ml-64 transition-all">
          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 w-full bg-[#1e293b] h-16 border-b border-[#334155] z-40 flex items-center justify-between px-6">
            <div className="text-2xl font-black text-white font-headline tracking-tighter italic">
              AVS <span className="text-[8px] text-[#3b82f6] tracking-[0.2em]">GERENCIAMENTO</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="text-slate-200 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
          </div>

          <Header />
          <div className="pt-24 lg:pt-24 pb-12 px-4 sm:px-6 lg:px-10 max-w-7xl mx-auto">
            
            {/* Boas-vindas Simplificado conforme solicitado */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 p-6 bg-[#1e293b] border border-[#334155] rounded-[24px] flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-2xl">
                  <Heart className="text-primary" size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white font-headline tracking-tighter italic uppercase break-all">Bem-vindo, {session.user.email}</h2>
                  <p className="text-sm font-bold text-slate-200 uppercase tracking-widest">Sua sessão está ativa no AVS Gerenciamento</p>
                </div>
              </div>
              <button 
                onClick={handleSignOut}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-[#f43f5e]/20 transition-all"
              >
                <LogOut size={16} /> Sair
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

            <footer className="pt-12 border-t border-outline-variant/15 flex flex-col sm:flex-row justify-between items-center text-[8px] sm:text-sm font-bold text-outline-variant uppercase tracking-[0.2em] mt-20 gap-4 text-center sm:text-left">
              <div>® 2026 AVS GERENCIAMENTOS - Criado e desenvolvido por Criatório Sitieiro. Todos os direitos reservados.</div>
              <div className="flex flex-wrap justify-center gap-4 sm:gap-8">
                <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-primary transition-colors">Export Logs</a>
                <a href="#" className="hover:text-primary transition-colors">System Status</a>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </Router>
  );
}
