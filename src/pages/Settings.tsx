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
      criatorio_name: formData.get('criatorio_name'),
    };

    try {
      await dbService.updateProfile(updates);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      await loadProfile();
      window.dispatchEvent(new Event('profileUpdated'));
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
        <Loader2 className="animate-spin text-[#2563EB]" size={40} />
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
        <div className="bg-[#EFF6FF] p-3 rounded-2xl border border-[#DBEAFE]">
          <SettingsIcon size={32} className="text-[#2563EB]" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight">Configurações</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Gerencie seu perfil e preferências do sistema.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-8">
              <User className="text-[#2563EB]" size={24} />
              <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight">Configurações de Usuário</h3>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                  <input 
                    required 
                    name="full_name" 
                    type="text" 
                    defaultValue={profile?.full_name || ''}
                    placeholder="Seu nome completo" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome do Criatório</label>
                  <input 
                    name="criatorio_name" 
                    type="text" 
                    defaultValue={profile?.criatorio_name || ''}
                    placeholder="Ex: Criatório AVS" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                  <input 
                    name="phone" 
                    type="tel" 
                    defaultValue={profile?.phone || ''}
                    placeholder="(00) 00000-0000" 
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">E-mail (Não editável)</label>
                <input 
                  disabled 
                  value={userEmail}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-400 outline-none cursor-not-allowed font-medium" 
                />
                <p className="text-xs text-slate-400 mt-1 font-medium ml-1">O e-mail é gerenciado pelo sistema de autenticação.</p>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${message.type === 'success' ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
                  {message.text}
                </div>
              )}

              <div className="pt-6 flex items-center gap-4">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Salvar Alterações
                </button>


              </div>
            </form>
          </section>

          {/* System Notification Mock */}
          <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] opacity-60">
            <div className="flex items-center gap-3 mb-8">
              <Bell className="text-[#F59E0B]" size={24} />
              <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight">Notificações</h3>
            </div>
            <p className="text-sm text-slate-500 font-medium">Configurações de notificação serão implementadas em versões futuras.</p>
          </section>
        </div>

        {/* Danger Zone & Session & Security */}
        <div className="space-y-8">
          {/* Security (Password Update) */}
          <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="text-[#2563EB]" size={24} />
              <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight">Segurança</h3>
            </div>
            
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                <input 
                  required
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Senha</label>
                <input 
                  required
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>

              {passwordMessage && (
                <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${passwordMessage.type === 'success' ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]'}`}>
                  {passwordMessage.type === 'success' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
                  {passwordMessage.text}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={updatingPassword}
                  className="w-full flex items-center justify-center gap-2 bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-[#DBEAFE] disabled:opacity-50"
                >
                  {updatingPassword ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  Atualizar Senha
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-8">
              <LogOut className="text-[#EF4444]" size={24} />
              <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight">Sessão</h3>
            </div>
            <p className="text-xs text-slate-500 mb-6 tracking-widest uppercase font-bold">Encerrar acesso ao sistema</p>
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center justify-center gap-2 bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA] px-6 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all hover:bg-[#FEE2E2]"
            >
              <LogOut size={16} /> Encerrar Sessão
            </button>
          </section>

          <section className="bg-[#FEF2F2] border border-[#FECACA] rounded-[32px] p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-[#EF4444]" size={24} />
              <h3 className="text-xl font-bold text-[#EF4444] font-headline tracking-tight">Zona de Perigo</h3>
            </div>
            <p className="text-sm text-[#B91C1C] mb-6 font-medium">A exclusão da conta é irreversível e apagará todos os seus registros de aves, financeiro e incubação.</p>
            <button 
              className="w-full text-[#991B1B] text-sm font-bold uppercase tracking-widest hover:text-[#EF4444] transition-colors"
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
