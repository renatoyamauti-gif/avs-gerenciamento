import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle, Loader2 } from 'lucide-react';

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
      setError(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-surface p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-[32px] p-10 shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-400" />
        
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-primary/10 p-4 rounded-3xl mb-6 ring-1 ring-primary/20">
            <LogIn className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-black text-white font-headline tracking-tighter italic uppercase">
            {mode === 'login' ? 'Bem-vindo de volta' : mode === 'register' ? 'Crie sua conta' : 'Recuperar senha'}
          </h2>
          <p className="text-[#94a3b8] font-medium text-sm mt-2">
            {mode === 'login' ? 'Acesse o seu criatório para gerenciar seu plantel.' : mode === 'register' ? 'Comece a gerenciar suas aves e finanças hoje.' : 'Digite seu e-mail para receber um link de recuperação.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1 flex items-center gap-2">
              <Mail size={12} /> E-mail
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none text-sm"
            />
          </div>

          {mode !== 'forgot_password' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1 flex items-center gap-2">
                <Lock size={12} /> Senha
              </label>
              <input
                required={mode !== 'forgot_password'}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none text-sm"
              />
            </div>
          )}

          {mode === 'register' && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="space-y-2"
            >
              <label className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-widest pl-1 flex items-center gap-2">
                <Lock size={12} /> Confirmar Senha
              </label>
              <input
                required={mode === 'register'}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none text-sm"
              />
            </motion.div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-error/10 border border-error/5 rounded-xl p-3 flex items-start gap-3 text-error text-xs font-bold leading-tight"
              >
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-blue-600 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : mode === 'login' ? (
              <><LogIn size={18} /> Entrar</>
            ) : mode === 'register' ? (
              <><UserPlus size={18} /> Cadastrar</>
            ) : (
              <><Mail size={18} /> Enviar Link</>
            )}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 text-center">
          {mode === 'login' && (
            <button
              type="button"
              onClick={() => { setMode('forgot_password'); setError(null); }}
              className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest hover:text-primary transition-colors"
            >
              Esqueci minha senha
            </button>
          )}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
            className="text-[10px] font-black text-[#94a3b8] uppercase tracking-widest hover:text-primary transition-colors"
          >
            {mode === 'login' ? 'Ainda não tem conta? Cadastrar-se' : 'Voltar para o Login'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
