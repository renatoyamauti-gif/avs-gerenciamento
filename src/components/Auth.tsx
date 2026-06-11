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
      let loginEmail = email.trim();
      if (!loginEmail.includes('@')) {
        loginEmail = `${loginEmail.toLowerCase().replace(/\s+/g, '')}@avs.local`;
      }

      if (mode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(loginEmail, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
        alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setMode('login');
      } else if (mode === 'register') {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem.');
        }
        const { error } = await supabase.auth.signUp({ email: loginEmail, password });
        if (error) throw error;
        alert('Confirme seu e-mail para completar o cadastro!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
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

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Erro ao iniciar login com o Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#F8FAFC] text-[#1F2937] font-body selection:bg-[#3B82F6]/20 relative overflow-hidden">
      
      {/* Background Decorators - Clean Light Abstract */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-gradient-to-br from-[#DBEAFE]/40 to-transparent rounded-full blur-[100px]" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[80%] bg-gradient-to-tl from-[#EFF6FF]/50 to-transparent rounded-full blur-[120px]" />
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
            <div className="w-12 h-12 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-[0_4px_20px_rgba(37,99,235,0.3)]">
              <Sparkles size={24} className="text-white" />
            </div>
            <span className="text-2xl font-headline font-bold tracking-[0.1em] text-[#2563EB]">AVS<span className="text-[#6B7280] ml-2 font-normal">GERENCIAMENTO</span></span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="max-w-xl"
          >
            <h1 className="text-5xl xl:text-6xl font-headline font-bold text-[#1F2937] leading-[1.1] tracking-tight mb-8">
              Gestão simplificada.<br/>
              <span className="text-[#2563EB]">Controle na palma da mão.</span>
            </h1>
            <p className="text-slate-500 text-lg font-medium leading-relaxed tracking-wide">
              Experimente a interface mais limpa e eficiente para gerenciar seu plantel. Rápido, seguro e pensado para o seu dia a dia.
            </p>
          </motion.div>

          <div className="flex flex-col gap-2">
            <div className="h-[1px] w-16 bg-slate-300 mb-6" />
            <p className="text-slate-400 text-sm tracking-[0.2em] uppercase font-bold">© {new Date().getFullYear()} AVS Sistemas</p>
          </div>
        </div>

        {/* Right Side - The Clean Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-[440px] bg-white border border-slate-100 p-8 sm:p-12 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden"
          >

            <div className="mb-10">
              <h2 className="text-3xl font-headline font-bold text-[#1F2937] tracking-tight mb-2">
                {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Crie sua conta' : 'Recuperar senha'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {mode === 'login' ? 'Acesse seu painel de controle.' : mode === 'register' ? 'Comece a gerenciar seu plantel hoje.' : 'Enviaremos instruções para o seu e-mail.'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-6">
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Usuário ou E-mail
                </label>
                <div className="relative group">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors duration-300" />
                  <input
                    id="email"
                    required
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ex: joao ou voce@exemplo.com"
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-[#1F2937] text-sm font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300 outline-none placeholder:text-slate-400"
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
                      <label htmlFor="password" className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Senha
                      </label>
                      {mode === 'login' && (
                        <button
                          type="button"
                          onClick={() => { setMode('forgot_password'); setError(null); }}
                          className="text-xs font-bold text-[#2563EB] hover:text-[#1E40AF] transition-colors"
                        >
                          Esqueceu a senha?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors duration-300" />
                      <input
                        id="password"
                        required={mode !== 'forgot_password'}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-[#1F2937] text-sm font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300 outline-none placeholder:text-slate-400"
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
                    <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      Confirmar Senha
                    </label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors duration-300" />
                      <input
                        id="confirmPassword"
                        required={mode === 'register'}
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-11 pr-4 py-3.5 text-[#1F2937] text-sm font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all duration-300 outline-none placeholder:text-slate-400"
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
                    className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-4 flex items-start gap-3 text-[#EF4444] text-sm font-medium"
                  >
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#2563EB] text-white text-sm font-bold py-4 px-4 rounded-2xl transition-all duration-300 hover:bg-[#1D4ED8] disabled:opacity-50 mt-8 shadow-sm"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : mode === 'login' ? (
                  <>Entrar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : mode === 'register' ? (
                  <>Criar Conta <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <>Enviar link <Mail size={18} /></>
                )}
              </button>
            </form>

            {mode !== 'forgot_password' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-100"></div>
                  </div>
                  <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest">
                    <span className="bg-white px-4 text-slate-400">ou</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-[#F8FAFC] text-sm font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>{mode === 'login' ? 'Entrar com o Google' : 'Cadastrar com o Google'}</span>
                </button>
              </>
            )}

            <div className="mt-8 text-center pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="text-sm font-bold text-[#6B7280] hover:text-[#2563EB] transition-colors"
              >
                {mode === 'login' ? 'Não possui uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
