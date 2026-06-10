import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Truck, 
  Settings, 
  Key, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Calculator, 
  FileText, 
  MapPin, 
  DollarSign, 
  Inbox, 
  ArrowRight,
  Package,
  Calendar,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { dbService } from '../lib/dbService';
import { supabase } from '../lib/supabaseClient';

interface ShippingOption {
  id: number;
  name: string;
  price: number;
  custom_price: number;
  delivery_time: number;
  error?: string;
  company: {
    id: number;
    name: string;
    picture: string;
  };
}

export default function Remessas() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Settings State
  const [originPostalCode, setOriginPostalCode] = useState('');
  const [token, setToken] = useState('');
  const [sandbox, setSandbox] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'success' | 'error'>('idle');
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isEditingMelhorEnvio, setIsEditingMelhorEnvio] = useState(false);
  const [isEditingSender, setIsEditingSender] = useState(false);
  const [savingSender, setSavingSender] = useState(false);

  // Calculator State
  const [destPostalCode, setDestPostalCode] = useState('');
  const [weight, setWeight] = useState('1.0');
  const [width, setWidth] = useState('20');
  const [height, setHeight] = useState('15');
  const [length, setLength] = useState('25');
  const [calculating, setCalculating] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Label Generation State
  const [selectedService, setSelectedService] = useState<ShippingOption | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [labelResult, setLabelResult] = useState<any>(null);
  const [labelError, setLabelError] = useState<string | null>(null);

  // Recipient form for label generation
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientCpf, setRecipientCpf] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [recipientDistrict, setRecipientDistrict] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientState, setRecipientState] = useState('');

  // Sender details (pre-filled or customized)
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [senderCpf, setSenderCpf] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [senderDistrict, setSenderDistrict] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const prof = await dbService.getProfile();
      setProfile(prof);
      if (prof) {
        setOriginPostalCode(prof.origin_postal_code || '');
        setToken(prof.melhor_envio_token || '');
        setSandbox(prof.melhor_envio_sandbox ?? false);
        
        // Load sender details from saved profile or fallback to defaults
        setSenderName(prof.sender_name || prof.full_name || '');
        setSenderPhone(prof.sender_phone || prof.phone || '');
        setSenderCpf(prof.sender_cpf || '');
        setSenderAddress(prof.sender_address || '');
        setSenderNumber(prof.sender_number || '');
        setSenderDistrict(prof.sender_district || '');
        setSenderCity(prof.sender_city || '');
        setSenderState(prof.sender_state || '');
        
        const { data: { user } } = await supabase.auth.getUser();
        const emailFallback = user ? user.email : '';
        setSenderEmail(prof.sender_email || emailFallback || '');

        if (prof.melhor_envio_token) {
          validateToken(prof.melhor_envio_token, prof.melhor_envio_sandbox ?? true);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de envio:', err);
    } finally {
      setLoading(false);
    }
  }

  const getBaseUrl = (isSandbox: boolean) => {
    return isSandbox 
      ? '/api/melhorenvio-sandbox' 
      : '/api/melhorenvio-prod';
  };

  const getExternalBaseUrl = (isSandbox: boolean) => {
    return isSandbox 
      ? 'https://sandbox.melhorenvio.com.br' 
      : 'https://melhorenvio.com.br';
  };

  // Helper to query with proxy to bypass CORS
  const fetchWithProxy = async (url: string, options: any) => {
    return fetch(url, options);
  };

  async function validateToken(testToken: string, isSandbox: boolean) {
    const cleanToken = testToken.replace(/\s+/g, '');
    if (!cleanToken) return;
    setValidationStatus('validating');
    setValidationError(null);

    const baseUrl = getBaseUrl(isSandbox);
    const apiUrl = `${baseUrl}/api/v2/me`;

    try {
      const response = await fetchWithProxy(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Accept': 'application/json'
        }
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errMsg = 'Token inválido ou expirado.';
        try {
          const errData = JSON.parse(responseText);
          if (errData.message) errMsg = errData.message;
        } catch (e) {
          errMsg = responseText.substring(0, 150) || errMsg;
        }
        throw new Error(errMsg);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Resposta do proxy não é um JSON válido: ${responseText.substring(0, 150)}`);
      }

      setConnectedUser(data);
      setValidationStatus('success');
    } catch (err: any) {
      console.error(err);
      setValidationError(err.message || 'Erro ao conectar com Melhor Envio.');
      setValidationStatus('error');
      setConnectedUser(null);
    }
  }

  const handleSaveMelhorEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setValidationError(null);

    const cleanToken = token.replace(/\s+/g, '');

    try {
      await dbService.updateProfile({
        origin_postal_code: originPostalCode.replace(/\D/g, ''),
        melhor_envio_token: cleanToken,
        melhor_envio_sandbox: sandbox
      });

      setToken(cleanToken);
      await validateToken(cleanToken, sandbox);
      setIsEditingMelhorEnvio(false);
      alert('Configurações do Melhor Envio salvas com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar configurações do Melhor Envio: ' + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveSender = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSender(true);

    try {
      await dbService.updateProfile({
        sender_name: senderName,
        sender_phone: senderPhone,
        sender_email: senderEmail,
        sender_cpf: senderCpf,
        sender_address: senderAddress,
        sender_number: senderNumber,
        sender_district: senderDistrict,
        sender_city: senderCity,
        sender_state: senderState
      });

      setIsEditingSender(false);
      alert('Dados do remetente salvos com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar dados do remetente: ' + err.message);
    } finally {
      setSavingSender(false);
    }
  };

  const handleCalculateShipping = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.replace(/\s+/g, '');
    if (!cleanToken) {
      setCalcError('Por favor, configure e valide seu token do Melhor Envio primeiro.');
      return;
    }
    if (!originPostalCode) {
      setCalcError('CEP de origem é obrigatório.');
      return;
    }

    setCalculating(true);
    setCalcError(null);
    setShippingOptions([]);
    setSelectedService(null);

    const baseUrl = getBaseUrl(sandbox);
    const apiUrl = `${baseUrl}/api/v2/me/shipment/calculate`;

    const cleanOrigin = originPostalCode.replace(/\D/g, '');
    const cleanDest = destPostalCode.replace(/\D/g, '');

    const bodyData = {
      from: { postal_code: cleanOrigin },
      to: { postal_code: cleanDest },
      products: [
        {
          id: 'shipping_item_1',
          width: parseInt(width) || 20,
          height: parseInt(height) || 15,
          length: parseInt(length) || 25,
          weight: parseFloat(weight) || 1.0,
          insurance_value: 0,
          quantity: 1
        }
      ]
    };

    try {
      const response = await fetchWithProxy(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(bodyData)
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errMsg = 'Falha ao calcular frete. Verifique o CEP de destino.';
        try {
          const errData = JSON.parse(responseText);
          if (errData.message) errMsg = errData.message;
        } catch (e) {
          errMsg = responseText.substring(0, 150) || errMsg;
        }
        throw new Error(errMsg);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Resposta do cálculo não é um JSON válido: ${responseText.substring(0, 150)}`);
      }
      
      // Filter out options with errors or no price
      const validOptions = (data || [])
        .filter((option: any) => !option.error && option.price)
        .map((option: any) => ({
          id: option.id,
          name: option.name,
          price: parseFloat(option.price),
          custom_price: parseFloat(option.custom_price || option.price),
          delivery_time: option.delivery_time,
          company: {
            id: option.company.id,
            name: option.company.name,
            picture: option.company.picture
          }
        }));

      setShippingOptions(validOptions);
      if (validOptions.length === 0) {
        setCalcError('Nenhuma opção de entrega disponível para as dimensões e CEP informados.');
      }
    } catch (err: any) {
      console.error(err);
      setCalcError(err.message || 'Erro ao calcular cotações de frete.');
    } finally {
      setCalculating(false);
    }
  };

  const handleCreateLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = token.replace(/\s+/g, '');
    if (!selectedService || !cleanToken) return;

    setGeneratingLabel(true);
    setLabelError(null);
    setLabelResult(null);

    const baseUrl = getBaseUrl(sandbox);
    const apiUrl = `${baseUrl}/api/v2/me/cart`;

    const cleanOrigin = originPostalCode.replace(/\D/g, '');
    const cleanDest = destPostalCode.replace(/\D/g, '');

    const cartData = {
      service: selectedService.id,
      from: {
        name: senderName || 'Remetente AVS',
        phone: senderPhone.replace(/\D/g, '') || '11999999999',
        email: senderEmail || 'remetente@exemplo.com',
        document: senderCpf.replace(/\D/g, '') || '12345678909',
        address: senderAddress || 'Rua de Origem',
        number: senderNumber || '100',
        district: senderDistrict || 'Bairro',
        city: senderCity || 'Cidade',
        postal_code: cleanOrigin,
        state_abbr: senderState || 'SP'
      },
      to: {
        name: recipientName,
        phone: recipientPhone.replace(/\D/g, ''),
        email: recipientEmail,
        document: recipientCpf.replace(/\D/g, ''),
        address: recipientAddress,
        number: recipientNumber,
        district: recipientDistrict,
        city: recipientCity,
        postal_code: cleanDest,
        state_abbr: recipientState
      },
      products: [
        {
          name: 'Ovos férteis / Aves vivas / Itens criatórios',
          quantity: 1,
          unitary_value: 10
        }
      ],
      volumes: [
        {
          width: parseInt(width) || 20,
          height: parseInt(height) || 15,
          length: parseInt(length) || 25,
          weight: parseFloat(weight) || 1.0
        }
      ]
    };

    try {
      const response = await fetchWithProxy(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(cartData)
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errMsg = 'Falha ao gerar etiqueta no carrinho.';
        try {
          const errData = JSON.parse(responseText);
          if (errData.message) errMsg = errData.message;
        } catch (e) {
          errMsg = responseText.substring(0, 150) || errMsg;
        }
        throw new Error(errMsg);
      }

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Resposta de criação de etiqueta não é um JSON válido: ${responseText.substring(0, 150)}`);
      }
      setLabelResult(data);
      alert('Rascunho de envio inserido no carrinho do seu Melhor Envio!');
    } catch (err: any) {
      console.error(err);
      setLabelError(err.message || 'Erro ao gerar etiqueta no Melhor Envio.');
    } finally {
      setGeneratingLabel(false);
    }
  };

  const isMelhorEnvioConfigured = !!(
    originPostalCode && 
    token && 
    validationStatus === 'success'
  );

  const isSenderConfigured = !!(
    senderName && 
    senderCpf && 
    senderPhone && 
    senderAddress && 
    senderNumber && 
    senderDistrict && 
    senderCity && 
    senderState
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="animate-spin text-[#2563EB]" size={48} />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Carregando Configurações...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="space-y-10 pb-20"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-bold text-[#1F2937] font-headline tracking-tight flex items-center gap-3">
            <Truck className="text-[#2563EB]" size={32} />
            Gestão de Remessas
          </h2>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Simulador de frete e geração de etiquetas integrado ao **Melhor Envio** (Abordagem Privada).
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - Integration settings */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card 1: Melhor Envio API Connection */}
          {isMelhorEnvioConfigured && !isEditingMelhorEnvio ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <Truck className="text-[#2563EB]" size={20} />
                  <h3 className="font-bold text-[#1F2937] text-base">Melhor Envio</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${sandbox ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {sandbox ? 'Sandbox' : 'Produção'}
                </span>
              </div>

              {/* Status Indicator Button */}
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-105 rounded-2xl">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Conexão Ativa</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/50 px-2.5 py-0.5 rounded-full uppercase font-mono">OK</span>
              </div>

              <div className="space-y-3 text-xs">
                {connectedUser && (
                  <div className="bg-[#F8FAFC] border border-slate-100 p-3 rounded-2xl space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Usuário</p>
                    <p className="font-bold text-[#1F2937]">{connectedUser.name}</p>
                    <p className="text-slate-500 font-mono text-[10px]">{connectedUser.email}</p>
                  </div>
                )}

                <div className="bg-[#F8FAFC] border border-slate-100 p-3 rounded-2xl flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CEP de Origem</span>
                    <span className="font-bold text-[#1F2937]">{originPostalCode}</span>
                  </div>
                  <MapPin size={16} className="text-slate-400" />
                </div>
              </div>

              <button
                onClick={() => setIsEditingMelhorEnvio(true)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-350 text-slate-600 hover:bg-slate-50 py-3.5 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
              >
                <Settings size={14} /> Editar Conexão
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <Settings className="text-[#2563EB]" size={20} />
                  <h3 className="font-bold text-[#1F2937] text-lg">Integração Melhor Envio</h3>
                </div>
                {isMelhorEnvioConfigured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">Ativo</span>
                )}
              </div>

              <form onSubmit={handleSaveMelhorEnvio} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CEP de Origem</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      type="text"
                      placeholder="Ex: 01310-100"
                      value={originPostalCode}
                      onChange={(e) => setOriginPostalCode(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Token de API Melhor Envio</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-4 text-slate-400" size={16} />
                    <textarea
                      required
                      rows={3}
                      placeholder="Cole seu token gerado no painel do Melhor Envio..."
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-[#1F2937] text-xs font-mono focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#F8FAFC] border border-slate-100 rounded-2xl">
                  <div>
                    <span className="text-xs font-bold text-[#1F2937] uppercase tracking-wider block">Ambiente Sandbox</span>
                    <span className="text-[10px] text-slate-400 font-medium">Ativar para realizar testes simulados.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={sandbox} 
                      onChange={(e) => setSandbox(e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]"></div>
                  </label>
                </div>

                {validationStatus === 'validating' && (
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                    <RefreshCw className="animate-spin text-slate-400" size={16} />
                    Validando Token...
                  </div>
                )}

                {validationStatus === 'success' && connectedUser && (
                  <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-2xl p-4 flex gap-3 text-[#2E7D32] text-xs font-medium">
                    <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <span className="font-bold block uppercase tracking-wider">Conectado com sucesso!</span>
                      <p className="mt-1">Usuário: **{connectedUser.name}**</p>
                      <p>E-mail: {connectedUser.email}</p>
                    </div>
                  </div>
                )}

                {validationStatus === 'error' && validationError && (
                  <div className="bg-[#FFEBEE] border border-[#FFCDD2] rounded-2xl p-4 flex gap-3 text-[#C62828] text-xs font-medium">
                    <AlertCircle className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <span className="font-bold block uppercase tracking-wider">Falha na Conexão</span>
                      <p className="mt-1">{validationError}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  {isMelhorEnvioConfigured && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingMelhorEnvio(false);
                        setValidationError(null);
                      }}
                      className="w-1/3 border border-slate-200 hover:border-slate-300 text-slate-600 py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className={`flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] active:scale-95 transition-all disabled:opacity-50 ${isMelhorEnvioConfigured ? 'w-2/3' : 'w-full'}`}
                  >
                    {savingSettings ? <RefreshCw className="animate-spin" size={14} /> : 'Salvar & Validar'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Card 2: Dados do Remetente */}
          {isSenderConfigured && !isEditingSender ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#2563EB]" size={20} />
                  <h3 className="font-bold text-[#1F2937] text-base">Remetente Cadastrado</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">Salvo</span>
              </div>

              <div className="space-y-4">
                {/* Sender Details Summary */}
                <div className="bg-[#F8FAFC] border border-slate-100 rounded-2xl p-4 space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Nome / Criador</span>
                    <span className="font-bold text-[#1F2937]">{senderName}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">CPF / CNPJ</span>
                      <span className="font-medium text-slate-600">{senderCpf}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Telefone</span>
                      <span className="font-medium text-slate-600">{senderPhone}</span>
                    </div>
                  </div>

                  {senderEmail && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">E-mail</span>
                      <span className="font-medium text-slate-600">{senderEmail}</span>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Endereço de Origem</span>
                    <span className="font-medium text-slate-600 block leading-relaxed">
                      {senderAddress}, {senderNumber} <br />
                      {senderDistrict} - {senderCity} / {senderState}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditingSender(true)}
                className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-350 text-slate-600 hover:bg-slate-50 py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm"
              >
                <Settings size={14} /> Editar Remetente
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                <div className="flex items-center gap-3">
                  <MapPin className="text-[#2563EB]" size={20} />
                  <h3 className="font-bold text-[#1F2937] text-lg">Dados do Remetente</h3>
                </div>
                {isSenderConfigured && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-100 text-emerald-800">Salvo</span>
                )}
              </div>

              <form onSubmit={handleSaveSender} className="space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Criador</label>
                    <input 
                      required 
                      type="text" 
                      value={senderName} 
                      onChange={(e) => setSenderName(e.target.value)} 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPF / CNPJ</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Apenas números" 
                        value={senderCpf} 
                        onChange={(e) => setSenderCpf(e.target.value)} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="DDD + Número" 
                        value={senderPhone} 
                        onChange={(e) => setSenderPhone(e.target.value)} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                    <input 
                      required 
                      type="email" 
                      value={senderEmail} 
                      onChange={(e) => setSenderEmail(e.target.value)} 
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço de Origem</label>
                      <input 
                        required 
                        type="text" 
                        placeholder="Rua/Av..." 
                        value={senderAddress} 
                        onChange={(e) => setSenderAddress(e.target.value)} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Número</label>
                      <input 
                        required 
                        type="text" 
                        value={senderNumber} 
                        onChange={(e) => setSenderNumber(e.target.value)} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-center text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bairro</label>
                      <input 
                        required 
                        type="text" 
                        value={senderDistrict} 
                        onChange={(e) => setSenderDistrict(e.target.value)} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cidade</label>
                      <input 
                        required 
                        type="text" 
                        value={senderCity} 
                        onChange={(e) => setSenderCity(e.target.value)} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado (UF)</label>
                      <input 
                        required 
                        type="text" 
                        maxLength={2} 
                        placeholder="Ex: SP" 
                        value={senderState} 
                        onChange={(e) => setSenderState(e.target.value.toUpperCase())} 
                        className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3 py-2 text-sm text-center text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {isSenderConfigured && (
                    <button
                      type="button"
                      onClick={() => setIsEditingSender(false)}
                      className="w-1/3 border border-slate-200 hover:border-slate-350 text-slate-600 py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingSender}
                    className={`flex items-center justify-center gap-2 bg-[#2563EB] text-white py-3 px-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] active:scale-95 transition-all disabled:opacity-50 ${isSenderConfigured ? 'w-2/3' : 'w-full'}`}
                  >
                    {savingSender ? <RefreshCw className="animate-spin" size={14} /> : 'Salvar Dados'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {(!isMelhorEnvioConfigured || isEditingMelhorEnvio) && (
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-[#1E40AF] text-sm uppercase tracking-wider">Como gerar seu Token?</h4>
              <ol className="list-decimal list-inside text-xs text-[#1E40AF] space-y-2 leading-relaxed">
                <li>Acesse o painel do seu <strong>Melhor Envio</strong> (Sandbox ou Produção).</li>
                <li>No menu lateral esquerdo, vá em <strong>Gerenciar &gt; Tokens</strong> ou em <strong>Integrações &gt; Permissões de Acesso</strong>.</li>
                <li>Clique no botão <strong>Novo Token</strong> ou <strong>Gerar Novo Token</strong>.</li>
                <li>Defina um nome para o token, clique no botão <strong>Selecionar todos</strong> (para conceder todas as permissões) e depois em <strong>Gerar</strong>.</li>
                <li>Copie o token gerado imediatamente e cole no campo acima.</li>
              </ol>
              <a 
                href={sandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 mt-2"
              >
                Acessar Melhor Envio <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Center/Right column - Simulator and Label purchase */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <Calculator className="text-[#2563EB]" size={20} />
              <h3 className="font-bold text-[#1F2937] text-lg">Simular Valores e Prazos</h3>
            </div>

            <form onSubmit={handleCalculateShipping} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">CEP de Destino</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      type="text"
                      placeholder="Ex: 22021-001"
                      value={destPostalCode}
                      onChange={(e) => setDestPostalCode(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Peso Estimado (kg)</label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl pl-10 pr-4 py-3.5 text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 focus:ring-4 focus:ring-[#2563EB]/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Largura (cm)</label>
                  <input
                    required
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-center text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Altura (cm)</label>
                  <input
                    required
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-center text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Comprimento (cm)</label>
                  <input
                    required
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-3 text-center text-[#1F2937] font-medium focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={calculating || !token}
                className="w-full py-4 bg-[#16A34A] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#15803D] active:scale-95 transition-all disabled:opacity-50"
              >
                {calculating ? (
                  <span className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} /> Calculando Tarifas...</span>
                ) : 'Calcular Frete'}
              </button>
            </form>

            {calcError && (
              <div className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs font-medium p-4 rounded-2xl flex gap-2 mt-6">
                <AlertCircle size={18} className="shrink-0" />
                <span>{calcError}</span>
              </div>
            )}

            {shippingOptions.length > 0 && (
              <div className="space-y-4 mt-8">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Opções Disponíveis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {shippingOptions.map((option) => (
                    <div 
                      key={option.id}
                      onClick={() => setSelectedService(option)}
                      className={`border p-5 rounded-2xl cursor-pointer flex flex-col justify-between transition-all ${
                        selectedService?.id === option.id 
                          ? 'border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/20 shadow-sm' 
                          : 'border-slate-100 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <img src={option.company.picture} alt={option.company.name} className="w-10 h-10 object-contain bg-[#F8FAFC] rounded-lg p-1 border border-slate-100" />
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">{option.company.name}</span>
                            <span className="text-sm font-bold text-[#1F2937]">{option.name}</span>
                          </div>
                        </div>
                        <div className="h-5 w-5 border border-slate-300 rounded-full flex items-center justify-center bg-white shrink-0">
                          {selectedService?.id === option.id && <div className="h-3 w-3 bg-[#2563EB] rounded-full" />}
                        </div>
                      </div>

                      <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-100">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Prazo</span>
                          <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1"><Calendar size={12} className="text-[#2563EB]" /> {option.delivery_time} dias úteis</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preço Sugerido</span>
                          <span className="text-lg font-black text-[#16A34A] block">R$ {option.price.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Label Generator Form */}
          <AnimatePresence>
            {selectedService && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] space-y-6"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <FileText className="text-[#2563EB]" size={20} />
                  <div>
                    <h3 className="font-bold text-[#1F2937] text-lg">Gerar Rascunho da Etiqueta</h3>
                    <p className="text-xs text-slate-500">Serviço Selecionado: **{selectedService.company.name} {selectedService.name}**</p>
                  </div>
                </div>

                <form onSubmit={handleCreateLabel} className="space-y-6">
                  {/* Sender Details Preview */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                      <h4 className="text-xs font-bold text-[#2563EB] uppercase tracking-widest">1. Dados do Remetente (Criatório)</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingSender(true);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-[10px] font-bold text-[#2563EB] hover:underline"
                      >
                        Editar Remetente
                      </button>
                    </div>
                    <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 text-xs text-[#475569] flex gap-3 items-start">
                      <MapPin className="text-[#2563EB] shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1">
                        <p className="font-bold text-[#1F2937]">{senderName || 'Não configurado'}</p>
                        <p className="leading-relaxed">
                          {senderAddress ? `${senderAddress}, ${senderNumber}` : 'Endereço não cadastrado'} <br />
                          {senderDistrict && `${senderDistrict} - `}{senderCity && `${senderCity} / `}{senderState}
                          {originPostalCode && ` | CEP: ${originPostalCode}`}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {senderCpf && `CPF/CNPJ: ${senderCpf}`} {senderPhone && ` | Tel: ${senderPhone}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recipient details */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-[#16A34A] uppercase tracking-widest border-b border-slate-100 pb-1">2. Dados do Destinatário (Comprador)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome do Comprador</label>
                        <input required type="text" placeholder="Nome completo" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none focus:border-[#2563EB]/30 transition-all" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPF / CNPJ</label>
                          <input required type="text" placeholder="Apenas números" value={recipientCpf} onChange={(e) => setRecipientCpf(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none focus:border-[#2563EB]/30 transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                          <input required type="text" placeholder="DDD + Número" value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none focus:border-[#2563EB]/30 transition-all" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                        <input required type="email" placeholder="comprador@exemplo.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço de Entrega</label>
                          <input required type="text" placeholder="Rua/Av..." value={recipientAddress} onChange={(e) => setRecipientAddress(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Número</label>
                          <input required type="text" value={recipientNumber} onChange={(e) => setRecipientNumber(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-center text-[#1F2937] font-bold outline-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bairro</label>
                        <input required type="text" value={recipientDistrict} onChange={(e) => setRecipientDistrict(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cidade</label>
                        <input required type="text" value={recipientCity} onChange={(e) => setRecipientCity(e.target.value)} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-[#1F2937] font-medium outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado (UF)</label>
                        <input required type="text" maxLength={2} placeholder="Ex: RJ" value={recipientState} onChange={(e) => setRecipientState(e.target.value.toUpperCase())} className="w-full bg-[#F8FAFC] border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-center text-[#1F2937] font-bold outline-none" />
                      </div>
                    </div>
                  </div>

                  {labelError && (
                    <div className="bg-[#FFEBEE] border border-[#FFCDD2] text-[#C62828] text-xs font-medium p-4 rounded-2xl flex gap-2">
                      <AlertCircle size={18} className="shrink-0" />
                      <span>{labelError}</span>
                    </div>
                  )}

                  {labelResult && (
                    <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-3xl p-6 flex flex-col gap-4 text-[#2E7D32]">
                      <div className="flex gap-3">
                        <CheckCircle2 className="shrink-0 mt-0.5" size={24} />
                        <div>
                          <span className="font-bold text-lg block uppercase tracking-wider">Etiqueta Adicionada ao Carrinho!</span>
                          <p className="mt-1 text-sm">A remessa foi gerada com sucesso e inserida no carrinho da sua conta do Melhor Envio.</p>
                        </div>
                      </div>
                      <div className="bg-white border border-[#A5D6A7]/30 rounded-2xl p-4 space-y-2 text-[#1F2937] text-xs">
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">ID da Remessa:</span>
                          <span className="font-bold font-mono">{labelResult.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">Serviço:</span>
                          <span className="font-bold">{labelResult.service?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-400">Valor Pago:</span>
                          <span className="font-bold text-[#16A34A]">R$ {parseFloat(labelResult.price || 0).toFixed(2)}</span>
                        </div>
                      </div>
                      <a 
                        href={`${getExternalBaseUrl(sandbox)}/painel/carrinho`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-[#16A34A] text-white text-center rounded-2xl font-bold text-sm uppercase tracking-widest shadow-sm hover:bg-[#15803D] transition-colors flex items-center justify-center gap-2"
                      >
                        Pagar e Imprimir Etiqueta <ExternalLink size={16} />
                      </a>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={generatingLabel}
                    className="w-full py-4 bg-[#2563EB] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] active:scale-95 transition-all disabled:opacity-50"
                  >
                    {generatingLabel ? (
                      <span className="flex items-center justify-center gap-2"><RefreshCw className="animate-spin" size={18} /> Inserindo no Carrinho...</span>
                    ) : 'Confirmar e Gerar Etiqueta'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
