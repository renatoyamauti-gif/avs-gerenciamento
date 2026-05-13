import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, AlertCircle, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setMode('login');
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Confirme seu e-mail para completar o cadastro!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      let errorMsg = err.message || 'Ocorreu um erro inesperado.';
      if (errorMsg.toLowerCase().includes('rate limit')) {
        errorMsg = 'Muitas tentativas. Aguarde um momento antes de tentar novamente.';
      } else if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'E-mail ou senha inválidos.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Este e-mail já está cadastrado.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#020617] text-white font-body selection:bg-[#cbd5e1]/20 relative overflow-hidden">
      
      {/* Background Decorators - Deep Luxury Abstract */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-br from-[#1e293b]/40 to-transparent rounded-full blur-[150px]" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[80%] bg-gradient-to-tl from-[#3b82f6]/10 via-[#0ea5e9]/5 to-transparent rounded-full blur-[180px]" />
        <div className="absolute bottom-0 left-[20%] w-[50%] h-[50%] bg-gradient-to-tr from-[#020617] to-transparent z-10" />
      </div>

      <div className="w-full flex flex-col lg:flex-row relative z-10">
        
        {/* Left Side - Brand & Vision */}
        <div className="hidden lg:flex w-1/2 flex-col justify-between p-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-[#ffffff] to-[#94a3b8] rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <Sparkles size={24} className="text-[#020617]" />
            </div>
            <span className="text-2xl font-headline font-bold tracking-[0.1em] text-white">AVS<span className="text-slate-500 ml-2 font-normal">GERENCIAMENTO</span></span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="max-w-xl"
          >
            <h1 className="text-5xl xl:text-6xl font-headline font-light text-white leading-[1.1] tracking-tight mb-8">
              Precisão absoluta.<br/>
              <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Controle total.</span>
            </h1>
            <p className="text-slate-400 text-lg font-light leading-relaxed tracking-wide">
              Experimente a interface de criatório mais sofisticada já criada. Onde genética encontra elegância, e dados se tornam arte.
            </p>
          </motion.div>

          <div className="flex flex-col gap-2">
            <div className="h-[1px] w-16 bg-gradient-to-r from-slate-600 to-transparent mb-6" />
            <p className="text-slate-500 text-sm tracking-[0.2em] uppercase font-semibold">© {new Date().getFullYear()} Edição Premium</p>
          </div>
        </div>

        {/* Right Side - The Glassmorphism Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24">
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(40px)" }}
            transition={{ duration: 1, delay: 0.1 }}
            className="w-full max-w-[440px] bg-[#0f172a]/40 border border-[#334155]/50 p-10 sm:p-14 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden"
          >
            {/* Subtle inner top glow for 3D effect */}
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div className="mb-12">
              <h2 className="text-3xl font-headline font-semibold text-white tracking-tight mb-3">
                {mode === 'login' ? 'Bem-vindo de volta.' : mode === 'register' ? 'Inicie seu legado.' : 'Recuperação.'}
              </h2>
              <p className="text-slate-400 text-sm font-medium tracking-wide">
                {mode === 'login' ? 'Insira suas credenciais blindadas.' : mode === 'register' ? 'Crie sua conta exclusiva.' : 'Restaure seu acesso seguro.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">
                  Endereço de E-mail
                </label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors duration-300" />
                  <input
                    id="email"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="w-full bg-[#020617]/50 border border-[#334155]/60 rounded-2xl pl-12 pr-4 py-4 text-white text-base font-light focus:bg-[#0f172a]/80 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-300 outline-none placeholder:text-slate-600"
                  />
                </div>
              </div>

              <AnimatePresence mode="popLayout">
                {mode !== 'forgot_password' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex items-center justify-between ml-1">
                      <label htmlFor="password" className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                        Senha de Acesso
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setMode('forgot_password'); setError(null); }}
                          className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-[0.1em] transition-colors"
                        >
                          Recuperar
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors duration-300" />
                      <input
                        id="password"
                        required={mode !== 'forgot_password'}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#020617]/50 border border-[#334155]/60 rounded-2xl pl-12 pr-4 py-4 text-white text-base font-light focus:bg-[#0f172a]/80 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-300 outline-none placeholder:text-slate-600 tracking-[0.2em]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {mode === 'register' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label htmlFor="confirmPassword" className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">
                      Confirmar Senha
                    </label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white transition-colors duration-300" />
                      <input
                        id="confirmPassword"
                        required={mode === 'register'}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#020617]/50 border border-[#334155]/60 rounded-2xl pl-12 pr-4 py-4 text-white text-base font-light focus:bg-[#0f172a]/80 focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all duration-300 outline-none placeholder:text-slate-600 tracking-[0.2em]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#4c0519]/40 border border-[#f43f5e]/30 rounded-2xl p-4 flex items-start gap-3 text-[#f43f5e] text-sm font-medium backdrop-blur-md"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative flex items-center justify-center gap-3 bg-white text-[#020617] text-sm font-bold py-4 px-4 rounded-2xl transition-all duration-500 hover:bg-slate-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-8 overflow-hidden"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
                
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : mode === 'login' ? (
                  <>Autenticar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : mode === 'register' ? (
                  <>Solicitar Acesso <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <>Restaurar Acesso <Mail size={18} /></>
                )}
              </button>
            </form>

            <div className="mt-10 text-center">
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="text-[11px] font-bold text-slate-500 hover:text-white uppercase tracking-[0.15em] transition-colors"
              >
                {mode === 'login' ? 'Não possui acesso? Registre-se' : 'Retornar para o Login'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Shimmer keyframes injected locally for the button */}
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
