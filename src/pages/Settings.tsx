import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, 
  User, 
  Save, 
  LogOut, 
  Shield, 
  Bell, 
  CheckCircle2, 
  Loader2, 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  Lock, 
  Plus, 
  X 
} from 'lucide-react';
import { dbService } from '../lib/dbService';
import { supabase } from '../lib/supabaseClient';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');
  
  // Password update states
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Team management states
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submittingSubUser, setSubmittingSubUser] = useState(false);
  const [teamMessage, setTeamMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // New subuser fields
  const [subUserUsername, setSubUserUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);
  const [subUserPassword, setSubUserPassword] = useState('');
  const [subUserFullName, setSubUserFullName] = useState('');
  const [subUserPermissions, setSubUserPermissions] = useState<any>({
    birds: true,
    breeding: true,
    maternity: true,
    eggs: true,
    ration: true,
    shipping: false,
    finance: false,
    chat: true
  });

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    const cleanUsername = subUserUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!cleanUsername) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }

    setIsCheckingUsername(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const { available } = await dbService.checkUsernameAvailability(cleanUsername);
        setUsernameAvailable(available);
        if (!available) {
          const sug = await dbService.getUsernameSuggestions(cleanUsername, profile);
          setUsernameSuggestions(sug);
        } else {
          setUsernameSuggestions([]);
        }
      } catch (err) {
        console.error('Erro ao validar nome de usuário:', err);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [subUserUsername, profile]);

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

  async function loadTeam() {
    setLoadingTeam(true);
    setTeamMessage(null);
    try {
      const members = await dbService.getTeamMembers();
      setTeamMembers(members);
    } catch (error: any) {
      console.error('Erro ao carregar equipe:', error);
      setTeamMessage({ type: 'error', text: 'Erro ao carregar equipe: ' + error.message });
    } finally {
      setLoadingTeam(false);
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

  async function handleAddSubUser(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingSubUser(true);
    setTeamMessage(null);

    const sanitizedUsername = subUserUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (!sanitizedUsername) {
      setTeamMessage({ type: 'error', text: 'O nome de usuário não pode ser vazio.' });
      setSubmittingSubUser(false);
      return;
    }

    if (isCheckingUsername) {
      setTeamMessage({ type: 'error', text: 'Aguarde a verificação de disponibilidade do nome de usuário.' });
      setSubmittingSubUser(false);
      return;
    }

    if (usernameAvailable === false) {
      setTeamMessage({ type: 'error', text: 'Por favor, escolha um nome de usuário disponível.' });
      setSubmittingSubUser(false);
      return;
    }

    if (subUserPassword.length < 6) {
      setTeamMessage({ type: 'error', text: 'A senha do tratador deve ter pelo menos 6 caracteres.' });
      setSubmittingSubUser(false);
      return;
    }

    try {
      await dbService.createSubUser(
        sanitizedUsername,
        subUserPassword,
        subUserFullName,
        subUserPermissions
      );

      setTeamMessage({ type: 'success', text: 'Tratador cadastrado com sucesso!' });
      setSubUserUsername('');
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      setSubUserPassword('');
      setSubUserFullName('');
      setSubUserPermissions({
        birds: true,
        breeding: true,
        maternity: true,
        eggs: true,
        ration: true,
        shipping: false,
        finance: false,
        chat: true
      });
      setShowAddForm(false);
      await loadTeam();
    } catch (error: any) {
      console.error('Erro ao adicionar tratador:', error);
      let errorMsg = error.message || 'Erro inesperado.';
      if (
        errorMsg.includes('Email already exists') || 
        errorMsg.includes('User already registered') || 
        errorMsg.includes('email_exists') ||
        errorMsg.includes('already exists')
      ) {
        errorMsg = 'Este nome de usuário já está em uso.';
      }
      setTeamMessage({ type: 'error', text: 'Erro ao cadastrar tratador: ' + errorMsg });
    } finally {
      setSubmittingSubUser(false);
    }
  }

  async function handleDeleteSubUser(id: string, name: string) {
    if (!confirm(`Tem certeza de que deseja excluir o tratador "${name}"? Esta ação removerá o acesso dele imediatamente.`)) {
      return;
    }

    setLoadingTeam(true);
    setTeamMessage(null);

    try {
      await dbService.deleteSubUser(id);
      setTeamMessage({ type: 'success', text: 'Tratador excluído com sucesso!' });
      await loadTeam();
    } catch (error: any) {
      console.error('Erro ao excluir tratador:', error);
      setTeamMessage({ type: 'error', text: 'Erro ao excluir tratador: ' + error.message });
      setLoadingTeam(false);
    }
  }

  const getDisplayEmail = (emailStr: string) => {
    if (!emailStr) return '';
    if (emailStr.endsWith('@avs.local')) {
      return emailStr.split('@')[0];
    }
    return emailStr;
  };

  const handlePermissionToggle = (key: string) => {
    setSubUserPermissions({
      ...subUserPermissions,
      [key]: !subUserPermissions[key]
    });
  };

  const getPermissionLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      birds: 'Gestão de Aves',
      breeding: 'Chocadeira',
      maternity: 'Maternidade',
      eggs: 'Ovos (Coletas)',
      ration: 'Rações',
      shipping: 'Remessas',
      finance: 'Financeiro',
      chat: 'Chat Exclusivo'
    };
    return labels[key] || key;
  };

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
          <p className="text-slate-500 font-medium text-sm mt-1">Gerencie seu perfil, preferências e equipe do criatório.</p>
        </div>
      </header>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'profile'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <User size={16} /> Meu Perfil
        </button>
        {profile?.role !== 'tratador' && (
          <button
            type="button"
            onClick={() => { setActiveTab('team'); loadTeam(); }}
            className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'team'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={16} /> Equipe / Tratadores
          </button>
        )}
      </div>

      {activeTab === 'profile' ? (
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
      ) : (
        /* Team management view */
        <div className="space-y-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-bold text-[#1F2937] font-headline tracking-tight">Membros da Equipe</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Gerencie as contas de tratadores e defina suas permissões de acesso.</p>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] hover:scale-[1.02] active:scale-95 transition-all"
              >
                <UserPlus size={16} /> Cadastrar Tratador
              </button>
            )}
          </div>

          {teamMessage && (
            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-2 ${teamMessage.type === 'success' ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]' : 'bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]'}`}>
              {teamMessage.type === 'success' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
              {teamMessage.text}
            </div>
          )}

          {/* Form to add sub-user */}
          {showAddForm && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-6"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-lg font-bold text-[#1F2937]">
                  <UserPlus className="text-[#2563EB]" size={20} />
                  <span>Novo Tratador</span>
                </div>
                <button 
                  onClick={() => setShowAddForm(false)} 
                  className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-lg transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddSubUser} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input
                      required
                      type="text"
                      placeholder="Ex: João Silva"
                      value={subUserFullName}
                      onChange={(e) => setSubUserFullName(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nome de Usuário</label>
                    <div className="relative group">
                       <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                      <input
                        required
                        type="text"
                        placeholder="Ex: joaosilva"
                        value={subUserUsername}
                        onChange={(e) => setSubUserUsername(e.target.value)}
                        className={`w-full bg-[#F8FAFC] border rounded-2xl pl-11 pr-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 transition-all outline-none ${
                          usernameAvailable === true 
                            ? 'border-green-300 focus:ring-green-500/10 focus:border-green-500' 
                            : usernameAvailable === false
                              ? 'border-red-300 focus:ring-red-500/10 focus:border-red-500'
                              : 'border-slate-200 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50'
                        }`}
                      />
                    </div>
                    {isCheckingUsername && (
                      <p className="text-[10px] text-slate-450 font-bold ml-1 flex items-center gap-1">
                        <Loader2 className="animate-spin text-slate-400" size={10} /> Verificando disponibilidade...
                      </p>
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <p className="text-[10px] text-green-600 font-bold ml-1 flex items-center gap-1">
                        <CheckCircle2 className="text-green-500" size={10} /> Nome de usuário disponível!
                      </p>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <div className="space-y-1.5 ml-1">
                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <Shield className="text-red-500" size={10} /> Nome de usuário já em uso.
                        </p>
                        {usernameSuggestions.length > 0 && (
                          <div className="pt-0.5">
                            <span className="text-[9px] text-slate-450 font-extrabold uppercase tracking-wider block mb-1">Sugestões disponíveis:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {usernameSuggestions.map((sug) => (
                                <button
                                  key={sug}
                                  type="button"
                                  onClick={() => setSubUserUsername(sug)}
                                  className="text-[10px] font-black px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 active:scale-95 transition-all shadow-sm"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Senha Inicial</label>
                    <div className="relative group">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#2563EB] transition-colors" />
                      <input
                        required
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={subUserPassword}
                        onChange={(e) => setSubUserPassword(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:ring-4 focus:ring-[#2563EB]/10 focus:border-[#2563EB]/50 transition-all outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Módulos Permitidos</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Object.keys(subUserPermissions).map((key) => {
                      const isAllowed = subUserPermissions[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePermissionToggle(key)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-xs font-bold transition-all ${
                            isAllowed 
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#2563EB]'
                              : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          <span>{getPermissionLabel(key)}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all ${
                            isAllowed ? 'bg-[#2563EB] border-[#2563EB]' : 'border-slate-300'
                          }`}>
                            {isAllowed && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submittingSubUser}
                    className="flex items-center justify-center gap-2 bg-[#2563EB] text-white px-8 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] transition-all disabled:opacity-50"
                  >
                    {submittingSubUser ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                    Salvar Tratador
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="bg-slate-100 text-slate-600 px-6 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.section>
          )}

          {/* Sub-users list */}
          {loadingTeam ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-[#2563EB]" size={32} />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-[32px] p-12 text-center text-slate-400 text-sm font-medium">
              Nenhum tratador cadastrado na equipe.
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-500">
                  <thead className="bg-[#F8FAFC] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th scope="col" className="px-6 py-4">Nome</th>
                      <th scope="col" className="px-6 py-4">Usuário</th>
                      <th scope="col" className="px-6 py-4">Módulos Ativos</th>
                      <th scope="col" className="px-6 py-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamMembers.map((member) => {
                      const permissionsObj = member.permissions || {};
                      const allowedModules = Object.keys(permissionsObj).filter(k => permissionsObj[k]);
                      
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-[#1F2937]">{member.full_name}</td>
                          <td className="px-6 py-4 font-semibold text-xs text-slate-600">{getDisplayEmail(member.email || member.sender_email) || member.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {allowedModules.length === 0 ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-red-50 text-red-700 border-red-100 uppercase">Nenhum</span>
                              ) : (
                                allowedModules.map(key => (
                                  <span key={key} className="text-[10px] font-bold px-2 py-0.5 rounded-md border bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE] uppercase">
                                    {getPermissionLabel(key)}
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDeleteSubUser(member.id, member.full_name)}
                              className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-xl transition-all"
                              title="Excluir Tratador"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
