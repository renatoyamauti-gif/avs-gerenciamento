import React, { useState, useEffect, useMemo } from 'react';
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
  ChevronRight,
  Users,
  Plus,
  Trash2,
  Search,
  Egg,
  TrendingUp,
  Edit2,
  Clock,
  ArrowLeft,
  Check,
  ClipboardList
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

  // Tab Management State
  const [activeTab, setActiveTab] = useState<'shipping' | 'orders_clients'>('shipping');
  const [activeSubTab, setActiveSubTab] = useState<'orders' | 'clients' | 'stock'>('orders');

  // Orders and Clients Data States
  const [clients, setClients] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [racas, setRacas] = useState<any[]>([]);
  const [eggLogs, setEggLogs] = useState<any[]>([]);
  const [incubators, setIncubators] = useState<any[]>([]);
  const [baias, setBaias] = useState<any[]>([]);
  const [loadingOrdersClients, setLoadingOrdersClients] = useState(false);

  // Client Form State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<any | null>(null);
  const [clientName, setClientName] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPostalCode, setClientPostalCode] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientNumber, setClientNumber] = useState('');
  const [clientDistrict, setClientDistrict] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientState, setClientState] = useState('');
  const [loadingCep, setLoadingCep] = useState(false);

  // Order Form State
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [orderClientId, setOrderClientId] = useState('');
  const [orderOrigemType, setOrderOrigemType] = useState<'raca' | 'baia'>('raca');
  const [orderRaca, setOrderRaca] = useState('');
  const [orderBaia, setOrderBaia] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [formItems, setFormItems] = useState<{ origem_type: 'raca' | 'baia'; raca: string; baia: string; quantity: string }[]>([{ origem_type: 'raca', raca: '', baia: '', quantity: '' }]);
  const [orderStatus, setOrderStatus] = useState('Pendente');
  const [savingOrder, setSavingOrder] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  // Searches
  const [clientSearch, setClientSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadOrdersClientsData() {
    try {
      setLoadingOrdersClients(true);
      const [clientsData, ordersData, racasData, eggLogsData, incubatorsData, baiasData] = await Promise.all([
        dbService.getClients(),
        dbService.getOrders(),
        dbService.getRacas(),
        dbService.getEggLogs(),
        dbService.getIncubators(),
        dbService.getBaias()
      ]);
      setClients(clientsData || []);
      setOrders(ordersData || []);
      setRacas(racasData || []);
      setEggLogs(eggLogsData || []);
      setIncubators(incubatorsData || []);
      setBaias(baiasData || []);
    } catch (err) {
      console.error('Erro ao carregar dados de pedidos/clientes/estoque:', err);
    } finally {
      setLoadingOrdersClients(false);
    }
  }

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
      
      // Load orders and clients
      await loadOrdersClientsData();
    } finally {
      setLoading(false);
    }
  }

  // Egg Stock and Daily Collection Averages Calculation (both Breed and Baia)
  const eggStock = useMemo(() => {
    const racaMap: Record<string, { collected: number; incubated: number; sold: number; available: number; dailyAvg: number; daysCollected: number }> = {};
    const baiaMap: Record<string, { collected: number; incubated: number; sold: number; available: number; dailyAvg: number; daysCollected: number }> = {};

    // Initialize all breeds from racas table
    (racas || []).forEach(r => {
      const name = typeof r === 'string' ? r : r.name;
      if (name) {
        racaMap[name] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
      }
    });

    // Initialize all baias from baias table
    (baias || []).forEach(b => {
      const name = typeof b === 'string' ? b : b.name;
      if (name) {
        baiaMap[name] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
      }
    });

    const racaDays: Record<string, Set<string>> = {};
    const baiaDays: Record<string, Set<string>> = {};

    // 1. Process Egg Logs (Collected)
    (eggLogs || []).forEach(log => {
      const dateKey = `${log.year}-${log.month}-${log.day}`;
      
      // If collection is by breed (raca)
      if (log.raca && log.count) {
        log.raca.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((breed: string) => {
          if (!racaMap[breed]) {
            racaMap[breed] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
          }
          racaMap[breed].collected += log.count;

          if (!racaDays[breed]) {
            racaDays[breed] = new Set();
          }
          racaDays[breed].add(dateKey);
        });
      }

      // If collection is by baia
      if (log.baia && log.count) {
        log.baia.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((bName: string) => {
          if (!baiaMap[bName]) {
            baiaMap[bName] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
          }
          baiaMap[bName].collected += log.count;

          if (!baiaDays[bName]) {
            baiaDays[bName] = new Set();
          }
          baiaDays[bName].add(dateKey);
        });
      }
    });

    // 2. Process Incubator Batches (Incubated)
    (incubators || []).forEach(inc => {
      (inc.incubator_batches || []).forEach((batch: any) => {
        // Breed details
        if (batch.raca_details) {
          Object.entries(batch.raca_details).forEach(([breed, qty]) => {
            const quantity = Number(qty) || 0;
            if (!racaMap[breed]) {
              racaMap[breed] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
            }
            racaMap[breed].incubated += quantity;
          });
        }

        // Baia details
        if (batch.baia_details) {
          Object.entries(batch.baia_details).forEach(([bName, qty]) => {
            const quantity = Number(qty) || 0;
            if (!baiaMap[bName]) {
              baiaMap[bName] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
            }
            baiaMap[bName].incubated += quantity;
          });
        }
      });
    });

    // 3. Process Orders (Sold/Reserved)
    (orders || []).forEach(ord => {
      if (ord.status !== 'Cancelado') {
        const orderItems = ord.items && Array.isArray(ord.items) && ord.items.length > 0
          ? ord.items
          : [{ origem_type: ord.origem_type || 'raca', raca: ord.raca || '', baia: ord.baia || '', quantity: ord.quantity || 0 }];

        orderItems.forEach((item: any) => {
          const qty = Number(item.quantity) || 0;
          if (qty > 0) {
            const isRaca = (item.origem_type || 'raca') === 'raca';
            if (isRaca && item.raca) {
              const breed = item.raca;
              if (!racaMap[breed]) {
                racaMap[breed] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
              }
              racaMap[breed].sold += qty;
            } else if (!isRaca && item.baia) {
              const bName = item.baia;
              if (!baiaMap[bName]) {
                baiaMap[bName] = { collected: 0, incubated: 0, sold: 0, available: 0, dailyAvg: 0, daysCollected: 0 };
              }
              baiaMap[bName].sold += qty;
            }
          }
        });
      }
    });

    // 4. Calculate Available Stock and Daily Collection Average for Breeds
    Object.keys(racaMap).forEach(breed => {
      const item = racaMap[breed];
      item.available = item.collected - item.incubated - item.sold;
      const days = racaDays[breed]?.size || 1;
      item.daysCollected = days;
      item.dailyAvg = item.collected / days;
    });

    // 5. Calculate Available Stock and Daily Collection Average for Baias
    Object.keys(baiaMap).forEach(bName => {
      const item = baiaMap[bName];
      item.available = item.collected - item.incubated - item.sold;
      const days = baiaDays[bName]?.size || 1;
      item.daysCollected = days;
      item.dailyAvg = item.collected / days;
    });

    return { racas: racaMap, baias: baiaMap };
  }, [eggLogs, incubators, orders, racas, baias]);

  // CEP Lookup for Client form
  const handleCepLookup = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setClientAddress(data.logradouro || '');
        setClientDistrict(data.bairro || '');
        setClientCity(data.localidade || '');
        setClientState(data.uf || '');
      }
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setLoadingCep(false);
    }
  };

  // Save/Edit Client
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert('Nome do cliente é obrigatório.');
      return;
    }
    setSavingClient(true);
    try {
      const clientData = {
        name: clientName,
        cpf_cnpj: clientCpf,
        phone: clientPhone,
        email: clientEmail,
        postal_code: clientPostalCode.replace(/\D/g, ''),
        address: clientAddress,
        number: clientNumber,
        district: clientDistrict,
        city: clientCity,
        state: clientState
      };
      if (editingClient) {
        (clientData as any).id = editingClient.id;
      }
      await dbService.saveClient(clientData);
      await loadOrdersClientsData();
      
      // Reset Client Form
      setClientName('');
      setClientCpf('');
      setClientPhone('');
      setClientEmail('');
      setClientPostalCode('');
      setClientAddress('');
      setClientNumber('');
      setClientDistrict('');
      setClientCity('');
      setClientState('');
      setEditingClient(null);
      setIsAddingClient(false);
      alert('Cliente salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar cliente: ' + err.message);
    } finally {
      setSavingClient(false);
    }
  };

  // Delete Client
  const handleDeleteClient = async (id: string) => {
    if (!confirm('Deseja realmente excluir este cliente? Todos os pedidos associados serão excluídos.')) return;
    try {
      await dbService.deleteClient(id);
      await loadOrdersClientsData();
      alert('Cliente excluído com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir cliente: ' + err.message);
    }
  };

  // Edit Client trigger
  const handleStartEditClient = (client: any) => {
    setEditingClient(client);
    setClientName(client.name || '');
    setClientCpf(client.cpf_cnpj || '');
    setClientPhone(client.phone || '');
    setClientEmail(client.email || '');
    setClientPostalCode(client.postal_code || '');
    setClientAddress(client.address || '');
    setClientNumber(client.number || '');
    setClientDistrict(client.district || '');
    setClientCity(client.city || '');
    setClientState(client.state || '');
    setIsAddingClient(true);
  };

  // Save/Edit Order
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderClientId) {
      alert('Por favor, selecione um cliente.');
      return;
    }
    
    // Validate each item in the list
    if (formItems.length === 0) {
      alert('Por favor, adicione pelo menos um item ao pedido.');
      return;
    }

    for (let i = 0; i < formItems.length; i++) {
      const item = formItems[i];
      if (item.origem_type === 'raca' && !item.raca) {
        alert(`Por favor, selecione a raça no item ${i + 1}.`);
        return;
      }
      if (item.origem_type === 'baia' && !item.baia) {
        alert(`Por favor, selecione a baia no item ${i + 1}.`);
        return;
      }
      const qty = parseInt(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        alert(`Por favor, insira uma quantidade válida no item ${i + 1}.`);
        return;
      }
    }

    setSavingOrder(true);
    try {
      const parsedItems = formItems.map(item => ({
        origem_type: item.origem_type,
        raca: item.origem_type === 'raca' ? item.raca : '',
        baia: item.origem_type === 'baia' ? item.baia : '',
        quantity: parseInt(item.quantity)
      }));

      // Set top-level values based on first item for compatibility
      const mainItem = parsedItems[0];
      const totalQty = parsedItems.reduce((acc, curr) => acc + curr.quantity, 0);

      const orderData = {
        client_id: orderClientId,
        origem_type: mainItem.origem_type,
        raca: mainItem.raca,
        baia: mainItem.baia,
        quantity: totalQty,
        items: parsedItems,
        status: orderStatus
      };

      if (editingOrder) {
        (orderData as any).id = editingOrder.id;
      }
      
      await dbService.saveOrder(orderData);
      await loadOrdersClientsData();

      // Reset Order Form
      setOrderClientId('');
      setOrderRaca('');
      setOrderBaia('');
      setOrderOrigemType('raca');
      setOrderQuantity('');
      setFormItems([{ origem_type: 'raca', raca: '', baia: '', quantity: '' }]);
      setOrderStatus('Pendente');
      setEditingOrder(null);
      setIsAddingOrder(false);
      alert('Pedido salvo com sucesso!');
    } catch (err: any) {
      alert('Erro ao salvar pedido: ' + err.message);
    } finally {
      setSavingOrder(false);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id: string) => {
    if (!confirm('Deseja realmente excluir este pedido?')) return;
    try {
      await dbService.deleteOrder(id);
      await loadOrdersClientsData();
      alert('Pedido excluído com sucesso!');
    } catch (err: any) {
      alert('Erro ao excluir pedido: ' + err.message);
    }
  };

  // Edit Order trigger
  const handleStartEditOrder = (order: any) => {
    setEditingOrder(order);
    setOrderClientId(order.client_id || '');
    
    // Set formItems list
    if (order.items && Array.isArray(order.items) && order.items.length > 0) {
      setFormItems(order.items.map((item: any) => ({
        origem_type: item.origem_type || 'raca',
        raca: item.raca || '',
        baia: item.baia || '',
        quantity: String(item.quantity || '')
      })));
    } else {
      // Fallback
      setFormItems([{
        origem_type: order.origem_type || 'raca',
        raca: order.raca || '',
        baia: order.baia || '',
        quantity: String(order.quantity || '')
      }]);
    }
    
    setOrderOrigemType(order.origem_type || 'raca');
    setOrderRaca(order.raca || '');
    setOrderBaia(order.baia || '');
    setOrderQuantity(String(order.quantity || ''));
    setOrderStatus(order.status || 'Pendente');
    setIsAddingOrder(true);
  };

  // Update Order Status directly
  const handleUpdateOrderStatus = async (order: any, newStatus: string) => {
    try {
      const orderData = {
        id: order.id,
        client_id: order.client_id,
        origem_type: order.origem_type || 'raca',
        raca: order.raca || '',
        baia: order.baia || '',
        quantity: order.quantity,
        items: order.items || [],
        status: newStatus
      };
      await dbService.saveOrder(orderData);
      await loadOrdersClientsData();
    } catch (err: any) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // "Gerar Envio" Trigger from order list
  const handleGerarEnvio = (order: any) => {
    if (!order.clients) {
      alert('Cliente não encontrado neste pedido.');
      return;
    }
    const client = order.clients;
    
    // Set recipient fields
    setRecipientName(client.name || '');
    setRecipientPhone(client.phone || '');
    setRecipientEmail(client.email || '');
    setRecipientCpf(client.cpf_cnpj || '');
    setRecipientAddress(client.address || '');
    setRecipientNumber(client.number || '');
    setRecipientDistrict(client.district || '');
    setRecipientCity(client.city || '');
    setRecipientState(client.state || '');
    setDestPostalCode(client.postal_code || '');

    // Estimate weight: 1 egg = 60g (0.06kg) + package box base 500g (0.5kg)
    const estimatedWeight = (order.quantity * 0.06 + 0.5).toFixed(2);
    setWeight(estimatedWeight);

    // Switch tab
    setActiveTab('shipping');

    // Scroll to simulator
    setTimeout(() => {
      const element = document.getElementById('shipping-simulator-card');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 155);
  };

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

  const renderClientsTab = () => {
    const filteredClients = clients.filter(c => 
      c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.cpf_cnpj?.includes(clientSearch)
    );

    if (isAddingClient) {
      return (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] max-w-3xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-lg text-[#1F2937] flex items-center gap-2">
              <Users className="text-[#2563EB]" size={20} />
              {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
            </h3>
            <button 
              type="button"
              onClick={() => {
                setIsAddingClient(false);
                setEditingClient(null);
              }}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveClient} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Completo</label>
                <input
                  required
                  type="text"
                  placeholder="Nome completo do comprador"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CPF / CNPJ</label>
                  <input
                    type="text"
                    placeholder="Apenas números"
                    value={clientCpf}
                    onChange={(e) => setClientCpf(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                  <input
                    required
                    type="text"
                    placeholder="DDD + Número"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail</label>
                <input
                  required
                  type="email"
                  placeholder="comprador@exemplo.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CEP</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="Ex: 22021001"
                    maxLength={9}
                    value={clientPostalCode}
                    onChange={(e) => {
                      setClientPostalCode(e.target.value);
                      if (e.target.value.replace(/\D/g, '').length === 8) {
                        handleCepLookup(e.target.value);
                      }
                    }}
                    onBlur={() => handleCepLookup(clientPostalCode)}
                    className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl pl-3.5 pr-10 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                  />
                  {loadingCep && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-405" size={16} />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço de Entrega</label>
                <input
                  required
                  type="text"
                  placeholder="Rua, Avenida..."
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Número</label>
                <input
                  required
                  type="text"
                  value={clientNumber}
                  onChange={(e) => setClientNumber(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-center text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bairro</label>
                <input
                  required
                  type="text"
                  value={clientDistrict}
                  onChange={(e) => setClientDistrict(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cidade</label>
                <input
                  required
                  type="text"
                  value={clientCity}
                  onChange={(e) => setClientCity(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estado (UF)</label>
                <input
                  required
                  type="text"
                  maxLength={2}
                  placeholder="Ex: RJ"
                  value={clientState}
                  onChange={(e) => setClientState(e.target.value.toUpperCase())}
                  className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-center text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingClient}
              className="w-full py-3.5 bg-[#2563EB] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingClient ? <RefreshCw className="animate-spin" size={14} /> : editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-405" size={16} />
            <input
              type="text"
              placeholder="Pesquisar clientes por nome..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#2563EB]/50 focus:bg-white focus:ring-4 focus:ring-[#2563EB]/5 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setClientName('');
              setClientCpf('');
              setClientPhone('');
              setClientEmail('');
              setClientPostalCode('');
              setClientAddress('');
              setClientNumber('');
              setClientDistrict('');
              setClientCity('');
              setClientState('');
              setEditingClient(null);
              setIsAddingClient(true);
            }}
            className="bg-[#2563EB] text-white py-3 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#1D4ED8] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Cadastrar Cliente
          </button>
        </div>

        {filteredClients.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <Users className="mx-auto text-slate-300" size={40} />
            <p className="font-medium text-sm">Nenhum cliente cadastrado ou encontrado.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500">
                <thead className="bg-[#F8FAFC] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-4">Nome</th>
                    <th scope="col" className="px-6 py-4">Contato</th>
                    <th scope="col" className="px-6 py-4">CPF / CNPJ</th>
                    <th scope="col" className="px-6 py-4">Endereço de Entrega</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#1F2937]">{client.name}</td>
                      <td className="px-6 py-4 text-xs">
                        <div className="font-semibold text-slate-700">{client.phone}</div>
                        <div className="text-slate-450">{client.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-650">{client.cpf_cnpj || '-'}</td>
                      <td className="px-6 py-4 text-xs text-slate-600 leading-normal">
                        <div>{client.address}, {client.number}</div>
                        <div className="text-[10px] text-slate-400">{client.district} - {client.city}/{client.state} - CEP: {client.postal_code}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleStartEditClient(client)}
                            className="text-slate-400 hover:text-[#2563EB] p-2 hover:bg-slate-100 rounded-xl transition-all"
                            title="Editar cliente"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(client.id)}
                            className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                            title="Excluir cliente"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getOrderShippingForecast = (order: any) => {
    if (order.status === 'Enviado') return { text: 'Enviado', type: 'sent' };
    if (order.status === 'Cancelado') return { text: 'Cancelado', type: 'canceled' };

    const orderItems = order.items && Array.isArray(order.items) && order.items.length > 0
      ? order.items
      : [{ origem_type: order.origem_type || 'raca', raca: order.raca || '', baia: order.baia || '', quantity: order.quantity || 0 }];

    let maxDays = 0;
    let hasInsufficientStock = false;
    let missingCollectionsData = false;

    orderItems.forEach((item: any) => {
      const isRaca = (item.origem_type || 'raca') === 'raca';
      const selectedName = isRaca ? item.raca : item.baia;
      const stockInfo = selectedName ? (isRaca ? eggStock.racas[selectedName] : eggStock.baias[selectedName]) : null;

      const availableStock = stockInfo ? stockInfo.available : 0;
      const dailyCollectionAvg = stockInfo ? stockInfo.dailyAvg : 0;

      // In eggStock calculation, available = collected - incubated - sold
      // where 'sold' includes all active orders (including this one).
      // So if available < 0, it means we have a deficit of Math.abs(available) eggs.
      if (availableStock < 0) {
        hasInsufficientStock = true;
        const deficit = Math.abs(availableStock);
        if (dailyCollectionAvg > 0) {
          const days = Math.ceil(deficit / dailyCollectionAvg);
          if (days > maxDays) {
            maxDays = days;
          }
        } else {
          missingCollectionsData = true;
        }
      }
    });

    if (!hasInsufficientStock) {
      return { text: 'Pronto para Envio', type: 'ready' };
    }

    if (missingCollectionsData && maxDays === 0) {
      return { text: 'Sem dados de coleta', type: 'no_data' };
    }

    return { text: `${maxDays} ${maxDays === 1 ? 'dia' : 'dias'}`, type: 'forecast', days: maxDays };
  };

  const renderOrdersTab = () => {
    const filteredOrders = orders.filter(o => {
      const matchClient = o.clients?.name?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchRaca = o.raca?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchBaia = o.baia?.toLowerCase().includes(orderSearch.toLowerCase());
      
      const matchItems = o.items && Array.isArray(o.items) && o.items.some((item: any) => 
        (item.raca && item.raca.toLowerCase().includes(orderSearch.toLowerCase())) ||
        (item.baia && item.baia.toLowerCase().includes(orderSearch.toLowerCase()))
      );
      
      return matchClient || matchRaca || matchBaia || matchItems;
    });

    if (isAddingOrder) {

      return (
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)] max-w-2xl">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
            <h3 className="font-bold text-lg text-[#1F2937] flex items-center gap-2">
              <ClipboardList className="text-[#2563EB]" size={20} />
              {editingOrder ? 'Editar Pedido' : 'Registrar Novo Pedido'}
            </h3>
            <button 
              type="button"
              onClick={() => {
                setIsAddingOrder(false);
                setEditingOrder(null);
              }}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs uppercase tracking-wider"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSaveOrder} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selecione o Cliente</label>
              <select
                required
                value={orderClientId}
                onChange={(e) => setOrderClientId(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
              >
                <option value="">-- Escolha um cliente registrado --</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.cpf_cnpj ? `(${c.cpf_cnpj})` : ''}</option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-amber-600 font-medium mt-1">Nenhum cliente cadastrado. Cadastre um cliente primeiro na aba "Clientes".</p>
              )}
            </div>

            {/* Itens do Pedido */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens do Pedido</span>
                <button
                  type="button"
                  onClick={() => setFormItems([...formItems, { origem_type: 'raca', raca: '', baia: '', quantity: '' }])}
                  className="flex items-center gap-1 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-bold bg-[#2563EB]/5 px-3 py-1.5 rounded-xl hover:bg-[#2563EB]/10 transition-all"
                >
                  <Plus size={14} /> Adicionar Item
                </button>
              </div>

              <div className="space-y-4">
                {formItems.map((item, index) => {
                  const isRacaType = item.origem_type === 'raca';
                  const selectedName = isRacaType ? item.raca : item.baia;
                  const stockInfo = selectedName ? (isRacaType ? eggStock.racas[selectedName] : eggStock.baias[selectedName]) : null;
                  const availableStock = stockInfo ? stockInfo.available : 0;
                  const dailyCollectionAvg = stockInfo ? stockInfo.dailyAvg : 0;
                  const qtyRequested = parseInt(item.quantity) || 0;
                  const isStockSufficient = availableStock >= qtyRequested;
                  const eggsNeeded = qtyRequested - availableStock;

                  let daysToCollect = 0;
                  let predictedShipDateStr = '';
                  if (!isStockSufficient && eggsNeeded > 0) {
                    if (dailyCollectionAvg > 0) {
                      daysToCollect = Math.ceil(eggsNeeded / dailyCollectionAvg);
                      const shipDate = new Date();
                      shipDate.setDate(shipDate.getDate() + daysToCollect);
                      predictedShipDateStr = shipDate.toLocaleDateString('pt-BR');
                    }
                  }

                  return (
                    <div key={index} className="p-4 bg-slate-50/50 border border-slate-200/50 rounded-2xl space-y-3 relative">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Item #{index + 1}</span>
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setFormItems(formItems.filter((_, idx) => idx !== index))}
                            className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition-all"
                            title="Remover Item"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Origem</label>
                          <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...formItems];
                                newItems[index] = { ...newItems[index], origem_type: 'raca', raca: '', baia: '' };
                                setFormItems(newItems);
                              }}
                              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                                isRacaType 
                                  ? 'bg-[#2563EB] text-white' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Raça
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...formItems];
                                newItems[index] = { ...newItems[index], origem_type: 'baia', raca: '', baia: '' };
                                setFormItems(newItems);
                              }}
                              className={`flex-1 py-1 text-xs font-bold rounded-lg transition-all ${
                                !isRacaType 
                                  ? 'bg-[#2563EB] text-white' 
                                  : 'text-slate-500 hover:text-slate-700'
                              }`}
                            >
                              Baia
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {isRacaType ? 'Raça do Ovo' : 'Baia de Origem'}
                          </label>
                          {isRacaType ? (
                            <select
                              required
                              value={item.raca}
                              onChange={(e) => {
                                const newItems = [...formItems];
                                newItems[index] = { ...newItems[index], raca: e.target.value };
                                setFormItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                            >
                              <option value="">-- Selecione --</option>
                              {racas.map(r => {
                                const name = typeof r === 'string' ? r : r.name;
                                return <option key={name} value={name}>{name}</option>;
                              })}
                            </select>
                          ) : (
                            <select
                              required
                              value={item.baia}
                              onChange={(e) => {
                                const newItems = [...formItems];
                                newItems[index] = { ...newItems[index], baia: e.target.value };
                                setFormItems(newItems);
                              }}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                            >
                              <option value="">-- Selecione --</option>
                              {baias.map(b => {
                                const name = typeof b === 'string' ? b : b.name;
                                return <option key={name} value={name}>{name}</option>;
                              })}
                            </select>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quantidade</label>
                          <input
                            required
                            type="number"
                            min="1"
                            placeholder="Ex: 12"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...formItems];
                              newItems[index] = { ...newItems[index], quantity: e.target.value };
                              setFormItems(newItems);
                            }}
                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#1F2937] focus:border-[#2563EB]/50 transition-all outline-none"
                          />
                        </div>
                      </div>

                      {/* Item Stock Warning */}
                      {selectedName && qtyRequested > 0 && (
                        <div className="text-[11px] mt-2">
                          {isStockSufficient ? (
                            <div className="text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                              <Check className="text-emerald-600 shrink-0" size={14} />
                              <span>Estoque suficiente! Disponível: <strong>{availableStock}</strong> ovos.</span>
                            </div>
                          ) : (
                            <div className="text-amber-800 bg-amber-50 border border-amber-100 p-3 rounded-xl space-y-1">
                              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                <AlertCircle className="text-amber-600 shrink-0" size={14} />
                                <span>Estoque Insuficiente!</span>
                              </div>
                              <p className="leading-relaxed">
                                Disponível: <strong>{availableStock}</strong>. Faltam <strong>{eggsNeeded}</strong> para este item de {qtyRequested} ovos.
                              </p>
                              {dailyCollectionAvg > 0 ? (
                                <p className="bg-amber-100/30 p-2 rounded-lg border border-amber-200/40 font-semibold text-[10px]">
                                  Média: {dailyCollectionAvg.toFixed(1)}/dia. <br />
                                  Envio previsto em: <strong>{daysToCollect} dias</strong> ({predictedShipDateStr}).
                                </p>
                              ) : (
                                <p className="bg-amber-100/30 p-2 rounded-lg border border-amber-200/40 font-semibold text-[10px] text-amber-900">
                                  Sem coletas recentes. Não é possível calcular prazo.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status do Pedido</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full bg-[#F8FAFC] border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#1F2937] focus:bg-white focus:border-[#2563EB]/50 transition-all outline-none"
              >
                <option value="Pendente">Pendente (Aguardando envio)</option>
                <option value="Enviado">Enviado (Etiqueta emitida / postado)</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={savingOrder}
              className="w-full py-3.5 bg-[#2563EB] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-[#1D4ED8] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingOrder ? <RefreshCw className="animate-spin" size={14} /> : editingOrder ? 'Salvar Alterações' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-405" size={16} />
            <input
              type="text"
              placeholder="Pesquisar pedidos por cliente, raça ou baia..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm text-[#1F2937] outline-none focus:border-[#2563EB]/50 focus:bg-white focus:ring-4 focus:ring-[#2563EB]/5 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setOrderClientId('');
              setOrderRaca('');
              setOrderBaia('');
              setOrderOrigemType('raca');
              setOrderQuantity('');
              setOrderStatus('Pendente');
              setEditingOrder(null);
              setIsAddingOrder(true);
            }}
            className="bg-[#2563EB] text-white py-3 px-5 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-[#1D4ED8] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Novo Pedido
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-3">
            <ClipboardList className="mx-auto text-slate-300" size={40} />
            <p className="font-medium text-sm">Nenhum pedido registrado ou encontrado.</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-slate-500">
                <thead className="bg-[#F8FAFC] text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th scope="col" className="px-6 py-4">Cliente</th>
                    <th scope="col" className="px-6 py-4">Origem</th>
                    <th scope="col" className="px-6 py-4 text-center">Quantidade</th>
                    <th scope="col" className="px-6 py-4">Status</th>
                    <th scope="col" className="px-6 py-4">Previsão de Envio</th>
                    <th scope="col" className="px-6 py-4">Data do Pedido</th>
                    <th scope="col" className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => {
                    const client = order.clients;
                    return (
                      <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#1F2937]">{client?.name || 'Sem Cliente'}</div>
                          <div className="text-xs text-slate-400">{client?.phone || client?.email}</div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          <div className="flex flex-col gap-1.5">
                            {order.items && Array.isArray(order.items) && order.items.length > 0 ? (
                              order.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-1">
                                  {item.origem_type === 'baia' ? (
                                    <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                                      Baia: {item.baia} <span className="text-slate-400 font-normal">({item.quantity} ovos)</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100 uppercase">
                                      Raça: {item.raca} <span className="text-slate-400 font-normal">({item.quantity} ovos)</span>
                                    </span>
                                  )}
                                </div>
                              ))
                            ) : (
                              (order.origem_type || 'raca') === 'baia' ? (
                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 uppercase">
                                  Baia: {order.baia} <span className="text-slate-400 font-normal">({order.quantity} ovos)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-100 uppercase">
                                  Raça: {order.raca} <span className="text-slate-400 font-normal">({order.quantity} ovos)</span>
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-[#1F2937]">{order.quantity} ovos</td>
                        <td className="px-6 py-4">
                          <select
                            value={order.status}
                            onChange={(e) => handleUpdateOrderStatus(order, e.target.value)}
                            className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer ${
                              order.status === 'Enviado' 
                                ? 'bg-green-50 text-green-800 border-green-200' 
                                : order.status === 'Cancelado'
                                ? 'bg-slate-50 text-slate-600 border-slate-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Enviado">Enviado</option>
                            <option value="Cancelado">Cancelado</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          {(() => {
                            const forecast = getOrderShippingForecast(order);
                            if (forecast.type === 'ready') {
                              return (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 uppercase">
                                  Pronto
                                </span>
                              );
                            }
                            if (forecast.type === 'sent') {
                              return <span className="text-slate-400 italic font-medium">Enviado</span>;
                            }
                            if (forecast.type === 'canceled') {
                              return <span className="text-slate-400 italic font-medium">Cancelado</span>;
                            }
                            if (forecast.type === 'no_data') {
                              return (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200 uppercase">
                                  Sem Coleta
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-800 text-[10px] font-bold px-2.5 py-1 rounded-full border border-blue-200 uppercase">
                                {forecast.text}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.status === 'Pendente' && (
                              <button
                                type="button"
                                onClick={() => handleGerarEnvio(order)}
                                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl uppercase tracking-wider transition-colors shadow-sm active:scale-95"
                                title="Preencher simulador e etiquetas com dados deste pedido"
                              >
                                <Truck size={12} /> Gerar Envio
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleStartEditOrder(order)}
                              className="text-slate-400 hover:text-[#2563EB] p-2 hover:bg-slate-100 rounded-xl transition-all"
                              title="Editar pedido"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteOrder(order.id)}
                              className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-xl transition-all"
                              title="Excluir pedido"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
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
    );
  };

  const renderStockTab = () => {
    const racaEntries = Object.entries(eggStock.racas).map(([breed, val]) => {
      const data = val as any;
      return {
        breed,
        collected: data.collected,
        incubated: data.incubated,
        sold: data.sold,
        available: data.available,
        dailyAvg: data.dailyAvg,
        daysCollected: data.daysCollected
      };
    }).sort((a, b) => b.available - a.available);

    const baiaEntries = Object.entries(eggStock.baias).map(([baia, val]) => {
      const data = val as any;
      return {
        baia,
        collected: data.collected,
        incubated: data.incubated,
        sold: data.sold,
        available: data.available,
        dailyAvg: data.dailyAvg,
        daysCollected: data.daysCollected
      };
    }).sort((a, b) => b.available - a.available);

    return (
      <div className="space-y-10">
        <div className="bg-[#EFF6FF] border border-[#BFDBFE] p-6 rounded-3xl">
          <h4 className="font-bold text-sm text-[#1E40AF] mb-2 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp size={16} className="text-[#2563EB]" />
            Como o estoque é calculado?
          </h4>
          <p className="text-xs text-[#1E40AF] leading-relaxed">
            O **Estoque Disponível** para cada item (raça ou baia) é obtido subtraindo-se dos ovos coletados aqueles que já foram colocados em chocadeiras ou que estão reservados para pedidos (pendentes ou enviados). <br />
            <span className="font-semibold">Fórmula:</span> Coletados - Incubados - Vendidos (Status diferente de 'Cancelado')
          </p>
        </div>

        {/* Stock by Breed */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <Egg className="text-[#2563EB]" size={20} />
            Estoque por Raça
          </h3>
          {racaEntries.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 text-sm">
              Nenhum estoque por raça disponível.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {racaEntries.map((entry) => {
                const statusColor = entry.available > 50 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : entry.available > 10 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200';

                return (
                  <div key={entry.breed} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-[#1F2937]">{entry.breed}</h4>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${statusColor}`}>
                        Estoque: {entry.available}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-50 pt-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Coletado</span>
                        <span className="font-bold text-[#1F2937]">{entry.collected} ovos</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Incubados</span>
                        <span className="font-bold text-[#1F2937]">{entry.incubated} ovos</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Reservados</span>
                        <span className="font-bold text-[#1F2937]">{entry.sold} ovos</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Média de Coleta</span>
                        <span className="font-bold text-[#2563EB]">{entry.dailyAvg.toFixed(1)} / dia</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock by Baia */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
            <MapPin className="text-[#2563EB]" size={20} />
            Estoque por Baia
          </h3>
          {baiaEntries.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center text-slate-400 text-sm">
              Nenhum estoque por baia disponível.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {baiaEntries.map((entry) => {
                const statusColor = entry.available > 50 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : entry.available > 10 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200';

                return (
                  <div key={entry.baia} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-[0_2px_10px_rgba(0,0,0,0.01)] space-y-4">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-[#1F2937]">Baia {entry.baia}</h4>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase border ${statusColor}`}>
                        Estoque: {entry.available}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs border-t border-slate-50 pt-3">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Total Coletado</span>
                        <span className="font-bold text-[#1F2937]">{entry.collected} ovos</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Incubados</span>
                        <span className="font-bold text-[#1F2937]">{entry.incubated} ovos</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Reservados</span>
                        <span className="font-bold text-[#1F2937]">{entry.sold} ovos</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Média de Coleta</span>
                        <span className="font-bold text-[#2563EB]">{entry.dailyAvg.toFixed(1)} / dia</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderOrdersClients = () => {
    return (
      <div className="space-y-8">
        {/* Sub-tab navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            type="button"
            onClick={() => setActiveSubTab('orders')}
            className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'orders'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package size={16} /> Pedidos
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('clients')}
            className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'clients'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Users size={16} /> Clientes
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('stock')}
            className={`pb-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeSubTab === 'stock'
                ? 'border-[#2563EB] text-[#2563EB]'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Egg size={16} /> Estoque de Ovos
          </button>
        </div>

        {loadingOrdersClients ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="animate-spin text-[#2563EB]" size={32} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando dados...</p>
          </div>
        ) : (
          <div>
            {activeSubTab === 'clients' && renderClientsTab()}
            {activeSubTab === 'orders' && renderOrdersTab()}
            {activeSubTab === 'stock' && renderStockTab()}
          </div>
        )}
      </div>
    );
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
            Simulador de frete, etiquetas de envio e controle de pedidos vinculados ao estoque de ovos.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex bg-[#F1F5F9] p-1.5 rounded-2xl border border-slate-100 shadow-sm shrink-0 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'shipping'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Truck size={14} /> Envios & Simulação
          </button>
          <button
            onClick={() => setActiveTab('orders_clients')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'orders_clients'
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users size={14} /> Pedidos & Clientes
          </button>
        </div>
      </header>

      {activeTab === 'shipping' ? (
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
            <div className="space-y-6">
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
        </div>

        {/* Center/Right column - Simulator and Label purchase */}
        <div className="lg:col-span-2 space-y-6">
          <div id="shipping-simulator-card" className="bg-white border border-slate-100 rounded-3xl p-8 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
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
      ) : (
        renderOrdersClients()
      )}
    </motion.div>
  );
}
