import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings as SettingsIcon, User, Save, LogOut, Shield, Bell, CheckCircle2, Loader2 } from 'lucide-react';
import { dbService } from '../lib/dbService';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Password update states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || '');
      }
      const data = await dbService.getProfile();
      setProfile(data);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const updates = {
      full_name: formData.get('full_name'),
      phone: formData.get('phone'),
    };

    try {
      await dbService.updateProfile(updates);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      await loadProfile();
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Falha ao atualizar perfil: ' + error.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setPasswordMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: 'Falha ao atualizar senha: ' + error.message });
    } finally {
      setUpdatingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="space-y-10"
    >
      <header className="flex items-center gap-4">
        <div className="bg-primary/20 p-3 rounded-2xl border border-primary/30">
          <SettingsIcon size={32} className="text-primary" />
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white font-headline tracking-tighter italic uppercase">Configurações</h2>
          <p className="text-slate-200 font-medium text-sm italic">Gerencie seu perfil e preferências do sistema.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#1e293b] border border-[#334155] rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <User className="text-primary" size={24} />
              <h3 className="text-xl font-bold text-white font-headline tracking-tight uppercase italic">Configurações de Usuário</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Nome Completo</label>
                  <input 
                    required 
                    name="full_name" 
                    type="text" 
                    defaultValue={profile?.full_name || ''}
                    placeholder="Seu nome completo" 
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Telefone / WhatsApp</label>
                  <input 
                    name="phone" 
                    type="tel" 
                    defaultValue={profile?.phone || ''}
                    placeholder="(00) 00000-0000" 
                    className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">E-mail (Não editável)</label>
                <input 
                  disabled 
                  value={userEmail}
                  className="w-full bg-[#0f172a]/50 border border-[#334155] rounded-xl px-4 py-3 text-[#475569] outline-none cursor-not-allowed" 
                />
                <p className="text-sm text-[#475569] mt-1 italic italic">O e-mail é gerenciado pelo sistema de autenticação.</p>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : 'bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                  {message.text}
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-primary text-white px-8 py-4 rounded-xl font-bold text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  SALVAR ALTERAÇÕES
                </button>
              </div>
            </form>
          </section>

          {/* System Notification Mock */}
          <section className="bg-[#1e293b] border border-[#334155] rounded-[32px] p-8 shadow-sm opacity-60">
            <div className="flex items-center gap-3 mb-8">
              <Bell className="text-[#f59e0b]" size={24} />
              <h3 className="text-xl font-bold text-white font-headline tracking-tight uppercase italic">Notificações</h3>
            </div>
            <p className="text-sm text-slate-200">Configurações de notificação serão implementadas em versões futuras.</p>
          </section>
        </div>

        {/* Danger Zone & Session & Security */}
        <div className="space-y-8">
          {/* Security (Password Update) */}
          <section className="bg-[#1e293b] border border-[#334155] rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="text-primary" size={24} />
              <h3 className="text-xl font-bold text-white font-headline tracking-tight uppercase italic">Segurança</h3>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Nova Senha</label>
                <input 
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-200 uppercase tracking-widest pl-1">Confirmar Nova Senha</label>
                <input 
                  required
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-primary/50 transition-all outline-none"
                />
              </div>

              {passwordMessage && (
                <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20' : 'bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20'}`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                  {passwordMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={updatingPassword}
                  className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary border border-primary/20 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-primary/20 disabled:opacity-50"
                >
                  {updatingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  ATUALIZAR SENHA
                </button>
              </div>
            </form>
          </section>

          <section className="bg-[#1e293b] border border-[#334155] rounded-[32px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <LogOut className="text-[#f43f5e]" size={24} />
              <h3 className="text-xl font-bold text-white font-headline tracking-tight uppercase italic">Sessão</h3>
            </div>
            <p className="text-sm text-slate-200 mb-6 tracking-widest uppercase font-bold">Encerrar acesso ao sistema</p>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20 px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-[#f43f5e]/20"
            >
              <LogOut size={16} /> ENCERRAR SESSÃO
            </button>
          </section>

          <section className="bg-[#1e293b] border border-[#f43f5e]/20 rounded-[32px] p-8 shadow-sm border-l-4 border-l-[#f43f5e]">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-[#f43f5e]" size={24} />
              <h3 className="text-xl font-bold text-white font-headline tracking-tight uppercase italic">Zona de Perigo</h3>
            </div>
            <p className="text-sm text-slate-200 mb-6">A exclusão da conta é irreversível e apagará todos os seus registros de aves, financeiro e incubação.</p>
            <button 
              className="w-full text-[#475569] text-sm font-bold uppercase tracking-widest hover:text-[#f43f5e] transition-colors"
              onClick={() => alert('Para sua segurança, contate o administrador para excluir sua conta.')}
            >
              Excluir minha conta
            </button>
          </section>
        </div>
      </div>
    </motion.div>
  );
}
