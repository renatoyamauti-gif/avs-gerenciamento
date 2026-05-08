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
        errorMsg = 'Muitas tentativas. Por favor, aguarde cerca de 1 hora para tentar novamente ou verifique sua caixa de entrada/spam.';
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
    <div className="min-h-screen w-full flex bg-[#0f172a] overflow-hidden text-slate-200">
      
      {/* Lado Esquerdo - Decorativo (Oculto em mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#020617] via-[#0f172a] to-[#1e293b] flex-col justify-between p-12 overflow-hidden border-r border-white/5">
        {/* Glow Effects */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none" />
        
        {/* Animated Orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 text-white mb-12"
          >
            <div className="p-3 bg-gradient-to-tr from-primary to-blue-400 rounded-2xl shadow-lg shadow-primary/20">
              <Sparkles size={28} className="text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight font-headline">AVS System</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl xl:text-6xl font-black text-white font-headline leading-tight tracking-tighter mb-6">
              Gerencie seu <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                plantel com maestria.
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-md font-medium leading-relaxed">
              O ecossistema completo para o criador moderno. Controle financeiro, genética, chocadeiras e muito mais em um só lugar com precisão e beleza.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative z-10"
        >
          <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <span>© {new Date().getFullYear()} AVS</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span>Plataforma Premium</span>
          </div>
        </motion.div>
      </div>

      {/* Lado Direito - Formulário */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile Background Elements */}
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent lg:hidden pointer-events-none" />
        <div className="absolute top-[-20%] right-[-20%] w-[300px] h-[300px] bg-primary/20 rounded-full blur-[100px] lg:hidden pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[440px] relative z-10"
        >
          {/* Header Form */}
          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-white font-headline tracking-tight mb-3">
              {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Crie sua conta' : 'Recuperar acesso'}
            </h2>
            <p className="text-slate-400 font-medium text-sm sm:text-base">
              {mode === 'login' ? 'Entre com seus dados para acessar sua conta.' : mode === 'register' ? 'Comece sua jornada gerenciando suas aves hoje.' : 'Enviaremos um link seguro para o seu e-mail.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4 sm:space-y-5">
            <div className="space-y-2 relative group">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2 transition-colors group-focus-within:text-primary">
                E-mail
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-white focus:bg-white/10 focus:border-primary/50 hover:border-white/20 transition-all outline-none text-sm placeholder:text-slate-600 backdrop-blur-md shadow-inner"
                />
              </div>
            </div>

            <AnimatePresence mode="popLayout">
              {mode !== 'forgot_password' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-2 relative group"
                >
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2 transition-colors group-focus-within:text-primary">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      required={mode !== 'forgot_password'}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-white focus:bg-white/10 focus:border-primary/50 hover:border-white/20 transition-all outline-none text-sm placeholder:text-slate-600 backdrop-blur-md shadow-inner"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {mode === 'register' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  className="space-y-2 relative group overflow-hidden"
                >
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2 transition-colors group-focus-within:text-primary">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors" />
                    <input
                      required={mode === 'register'}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 sm:py-4 text-white focus:bg-white/10 focus:border-primary/50 hover:border-white/20 transition-all outline-none text-sm placeholder:text-slate-600 backdrop-blur-md shadow-inner"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {mode === 'login' && (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => { setMode('forgot_password'); setError(null); }}
                  className="text-[12px] font-bold text-slate-400 hover:text-primary transition-colors"
                >
                  Esqueceu a senha?
                </button>
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 text-red-400 text-sm font-medium mt-4"
                >
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-2xl bg-primary px-4 py-4 text-sm font-bold text-white shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] transition-all hover:bg-blue-500 hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)] active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 mt-6"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              <div className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : mode === 'login' ? (
                  <>Entrar <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : mode === 'register' ? (
                  <>Criar conta <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <>Enviar link <Mail size={18} className="ml-1" /></>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-sm text-slate-400 font-medium">
              {mode === 'login' ? 'Ainda não tem uma conta?' : mode === 'register' ? 'Já possui uma conta?' : 'Lembrou sua senha?'}
              {' '}
              <button
                type="button"
                onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                className="text-white font-bold hover:text-primary transition-colors"
              >
                {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
