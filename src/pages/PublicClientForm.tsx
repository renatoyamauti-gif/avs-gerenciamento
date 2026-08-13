import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  FileText, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function PublicClientForm() {
  const { userId } = useParams<{ userId: string }>();
  
  // Profile state
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Status states
  const [loadingCep, setLoadingCep] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadCreatorProfile();
    } else {
      setProfileError('Link de cadastro inválido. Falta o identificador do criador.');
      setLoadingProfile(false);
    }
  }, [userId]);

  const loadCreatorProfile = async () => {
    try {
      setLoadingProfile(true);
      const { data, error } = await supabase.rpc('get_public_profile', { profile_id: userId });
      
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error('Criatório não encontrado.');
      }
      
      setProfile(data[0]);
    } catch (err: any) {
      console.error('Erro ao carregar perfil do criador:', err);
      setProfileError(err.message || 'Erro ao carregar informações do criatório.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCepLookup = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        alert('CEP não encontrado.');
        return;
      }

      setAddress(data.logradouro || '');
      setDistrict(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || '');
    } catch (err) {
      console.error('Erro ao consultar CEP:', err);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!acceptedTerms) {
      setErrorMsg('Você precisa aceitar os termos e condições de envio para prosseguir.');
      return;
    }

    if (!userId) {
      setErrorMsg('ID do criador inválido.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('clients')
        .insert([{
          name: name.trim(),
          cpf_cnpj: cpfCnpj.replace(/\D/g, '') || null,
          phone: phone.trim(),
          email: email.trim(),
          postal_code: postalCode.replace(/\D/g, ''),
          address: address.trim(),
          number: number.trim(),
          complement: complement.trim() || null,
          district: district.trim(),
          city: city.trim(),
          state: state.trim().toUpperCase(),
          user_id: userId,
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        }]);

      if (error) throw error;
      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Erro ao salvar cadastro do cliente:', err);
      setErrorMsg(err.message || 'Ocorreu um erro ao salvar suas informações. Por favor, tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="text-[#2563EB] mb-4"
        >
          <RefreshCw size={40} />
        </motion.div>
        <p className="text-slate-500 font-semibold text-sm uppercase tracking-wider">Carregando formulário...</p>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[32px] shadow-lg border border-slate-100 dark:border-slate-800 max-w-md w-full text-center space-y-6"
        >
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-red-500">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-150 font-headline">Ops! Algo deu errado</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{profileError}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Verifique se o link compartilhado está completo e correto.</p>
        </motion.div>
      </div>
    );
  }

  const defaultTerms = `1. Condições de Envio: As postagens são realizadas em dias úteis específicos definidos no calendário de coletas do criatório.
2. Responsabilidade do Transporte: O transporte é efetuado por transportadora parceira ou Correios. O criatório não se responsabiliza por atrasos logísticos após a postagem.
3. Embalagem: Todos os produtos são devidamente embalados para máxima segurança. No caso de ovos férteis, embora a embalagem minimize os riscos, a taxa de eclosão depende de fatores externos e não garantimos taxa fixa de nascimento.
4. Endereço: É de inteira responsabilidade do comprador o preenchimento correto dos dados cadastrais e de envio.`;

  const termsText = profile?.shipping_terms?.trim() || defaultTerms;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between py-10 px-4 transition-colors duration-200">
      <div className="max-w-3xl w-full mx-auto">
        
        {/* Header/Logo */}
        <header className="text-center mb-8 space-y-2">
          <div className="inline-flex bg-[#EFF6FF] dark:bg-blue-950/40 p-4 rounded-3xl border border-[#DBEAFE] dark:border-blue-900/30 text-[#2563EB] mb-2 shadow-sm">
            <Truck size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-headline tracking-tight uppercase">
            Dados de Envio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">
            Criatório: {profile?.criatorio_name || 'NÃO CADASTRADO'}
          </p>
        </header>

        {submitSuccess ? (
          /* Success Screen */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-8 sm:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.02)] text-center space-y-6"
          >
            <div className="bg-green-50 dark:bg-green-950/20 p-5 rounded-full w-20 h-20 flex items-center justify-center mx-auto text-green-500">
              <CheckCircle2 size={44} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-150 font-headline">Cadastro Concluído!</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm sm:text-base leading-relaxed">
                Suas informações de endereço e aceite de termos foram salvas com sucesso no nosso sistema.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-left space-y-3 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <Clock className="text-blue-500 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-350">Próximo passo:</span> O criatório receberá seus dados automaticamente e prosseguirá com a preparação da sua remessa. Você receberá atualizações de rastreamento assim que disponíveis.
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400">Você já pode fechar esta janela.</p>
          </motion.div>
        ) : (
          /* Form Screen */
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[32px] p-6 sm:p-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-8"
          >
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-slate-850 dark:text-slate-200 font-headline flex items-center gap-2">
                <MapPin className="text-[#2563EB]" size={20} />
                Preencha suas Informações
              </h3>
              <p className="text-xs text-slate-450 dark:text-slate-500 font-medium mt-1">
                Certifique-se de que os dados estejam corretos para evitar problemas na entrega postal.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Information Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <User size={12} /> Nome Completo
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest ml-1">
                      CPF / CNPJ
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="Apenas números"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <Phone size={12} /> WhatsApp
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                    />
                  </div>
                </div>
              </div>

              {/* Email and CEP Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest ml-1 flex items-center gap-1">
                    <Mail size={12} /> E-mail
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="exemplo@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-455 uppercase tracking-widest ml-1">
                    CEP
                  </label>
                  <div className="relative">
                    <input
                      required
                      type="text"
                      placeholder="Apenas números"
                      maxLength={9}
                      value={postalCode}
                      onChange={(e) => {
                        setPostalCode(e.target.value);
                        if (e.target.value.replace(/\D/g, '').length === 8) {
                          handleCepLookup(e.target.value);
                        }
                      }}
                      onBlur={() => handleCepLookup(postalCode)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-4 pr-10 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                    />
                    {loadingCep && (
                      <RefreshCw className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />
                    )}
                  </div>
                </div>
              </div>

              {/* Address and details row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest ml-1">
                    Endereço
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Rua, Avenida..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 tracking-widest uppercase ml-1 text-center block">
                    Número
                  </label>
                  <input
                    required
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="S/N"
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-center text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none focus:ring-4 focus:ring-blue-500/5"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 tracking-widest uppercase ml-1">
                    Complemento
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Apto 32"
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
              </div>

              {/* District, City, State */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest ml-1">
                    Bairro
                  </label>
                  <input
                    required
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest ml-1">
                    Cidade
                  </label>
                  <input
                    required
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-455 tracking-widest uppercase ml-1 text-center block">
                    Estado (UF)
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={2}
                    placeholder="UF"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3 text-sm text-center text-slate-800 dark:text-slate-100 font-medium focus:bg-white dark:focus:bg-slate-900 focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
              </div>

              {/* Shipping Terms Block */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#2563EB]" />
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Termos e Condições de Envio
                  </label>
                </div>
                
                <div className="w-full h-44 overflow-y-auto bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-2 whitespace-pre-wrap select-none scrollbar-thin">
                  {termsText}
                </div>

                {/* Consent checkbox */}
                <div className="flex items-start gap-3 mt-4 ml-1">
                  <button
                    type="button"
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
                      acceptedTerms 
                        ? 'bg-[#2563EB] border-[#2563EB] text-white shadow-sm' 
                        : 'bg-white dark:bg-slate-950 border-slate-350 dark:border-slate-800 hover:border-slate-400'
                    }`}
                  >
                    {acceptedTerms && <CheckCircle2 size={12} className="stroke-[3]" />}
                  </button>
                  <span 
                    onClick={() => setAcceptedTerms(!acceptedTerms)}
                    className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 leading-normal select-none cursor-pointer"
                  >
                    Eu li e concordo com os Termos e Condições de Envio descritos acima.
                  </span>
                </div>
              </div>

              {/* Status and Submission Actions */}
              {errorMsg && (
                <div className="p-4 rounded-2xl text-xs font-bold bg-[#FEF2F2] dark:bg-red-950/20 text-[#EF4444] border border-[#FECACA] dark:border-red-900/35 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !acceptedTerms}
                className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="animate-spin" size={14} />
                    Processando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    Confirmar e Enviar Dados
                  </>
                )}
              </button>
            </form>
          </motion.div>
        )}
      </div>

      <footer className="text-center text-[10px] text-slate-400 dark:text-slate-650 uppercase font-semibold tracking-wider mt-10">
        © 2026 AVS Gerenciamento — Desenvolvido por Criatório Sitieiro
      </footer>
    </div>
  );
}
