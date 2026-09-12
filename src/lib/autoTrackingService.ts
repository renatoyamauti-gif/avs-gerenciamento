import { dbService } from './dbService';
import { notificationService } from './notificationService';
import { correiosTrackingService } from './correiosTrackingService';

const LAST_CHECK_KEY = 'avs_last_auto_tracking_time';
const MIN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutos

export const autoTrackingService = {
  isChecking: false,

  init() {
    if (typeof window === 'undefined') return;

    // Sincroniza imediatamente com os pedidos entregues existentes
    dbService.getOrders().then(orders => {
      if (Array.isArray(orders) && orders.length > 0) {
        notificationService.syncFromOrders(orders);
      }
    }).catch(() => {});

    // Executa em segundo plano após 8 segundos do carregamento inicial
    setTimeout(() => {
      this.checkPendingOrders().catch(() => {});
    }, 8000);

    // Repete suavemente a cada 30 minutos enquanto o app estiver aberto
    setInterval(() => {
      this.checkPendingOrders().catch(() => {});
    }, 30 * 60 * 1000);

    // Quando o dispositivo voltar a ficar online, agenda verificação suave
    window.addEventListener('online', () => {
      setTimeout(() => {
        this.checkPendingOrders().catch(() => {});
      }, 5000);
    });
  },

  async checkPendingOrders(force = false): Promise<number> {
    if (this.isChecking) return 0;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return 0;

    const now = Date.now();
    const lastCheck = Number(localStorage.getItem(LAST_CHECK_KEY) || 0);

    if (!force && now - lastCheck < MIN_INTERVAL_MS) {
      dbService.getOrders().then(orders => {
        if (Array.isArray(orders) && orders.length > 0) {
          notificationService.syncFromOrders(orders);
        }
      }).catch(() => {});
      return 0;
    }

    this.isChecking = true;

    try {
      // 1. Busca pedidos locais/banco
      const orders = await dbService.getOrders().catch(() => []);
      if (!Array.isArray(orders) || orders.length === 0) {
        localStorage.setItem(LAST_CHECK_KEY, String(now));
        return 0;
      }

      // Sincroniza pedidos que já estão entregues com o sininho de notificações
      notificationService.syncFromOrders(orders);

      // Filtra pedidos em trânsito com código de rastreio válido
      const pendingOrders = orders.filter((o: any) => {
        const code = String(o.tracking_code || '').trim().toUpperCase();
        return (
          code.length >= 6 &&
          o.status !== 'Entregue' &&
          o.status !== 'Cancelado'
        );
      });

      if (pendingOrders.length === 0) {
        localStorage.setItem(LAST_CHECK_KEY, String(now));
        return 0;
      }

      // 2. Busca perfil com as credenciais salvas
      const profile = await dbService.getProfile().catch(() => null);
      let deliveredCount = 0;
      const alreadyDeliveredOrderIds = new Set<string>();

      // Limita a checagem a 15 pedidos por ciclo para garantir leveza absoluta
      const ordersToCheck = pendingOrders.slice(0, 15);

      // 3. Verificação via Melhor Envio (se configurado)
      if (profile?.melhor_envio_token) {
        try {
          const codes = ordersToCheck.map((o: any) => String(o.tracking_code).trim().toUpperCase());
          const isSandbox = profile.melhor_envio_sandbox ?? true;
          const baseUrl = isSandbox ? '/api/melhorenvio-sandbox' : '/api/melhorenvio-prod';
          const cleanToken = profile.melhor_envio_token.replace(/\s+/g, '');

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 7000);

          const response = await fetch(`${baseUrl}/api/v2/me/shipment/tracking`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${cleanToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ orders: codes }),
            signal: controller.signal
          }).catch(() => null);

          clearTimeout(timeoutId);

          if (response && response.ok) {
            const data = await response.json().catch(() => null);
            if (data) {
              for (const order of ordersToCheck) {
                const code = String(order.tracking_code).trim().toUpperCase();
                const item = data[code] || (Array.isArray(data.orders) ? data.orders.find((x: any) => x.id === code || x.protocol === code) : null);
                
                if (item) {
                  const isDelivered = 
                    item.status === 'delivered' || 
                    (Array.isArray(item.history) && item.history.some((h: any) => {
                      const desc = (h.description || h.status || '').toLowerCase();
                      return desc.includes('entregue') || desc.includes('entrega efetuada');
                    }));

                  if (isDelivered && !alreadyDeliveredOrderIds.has(order.id)) {
                    alreadyDeliveredOrderIds.add(order.id);
                    await this.markOrderAsDelivered(order);
                    deliveredCount++;
                  }
                }
              }
            }
          }
        } catch (meErr) {
          console.debug('Melhor Envio auto-tracking silencioso:', meErr);
        }
      }

      // 4. Verificação via Correios CWS (se ativado e credenciais presentes)
      const correiosOrders = ordersToCheck.filter((o: any) => {
        const code = String(o.tracking_code).trim().toUpperCase();
        return /^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(code) && o.status !== 'Entregue' && !alreadyDeliveredOrderIds.has(o.id);
      });

      if (
        correiosOrders.length > 0 &&
        profile?.correios_user &&
        profile?.correios_password &&
        profile?.correios_enabled
      ) {
        try {
          const isSandbox = profile.correios_sandbox ?? false;
          const baseUrl = isSandbox ? '/api/correios-sandbox' : '/api/correios-prod';
          const credentials = btoa(`${profile.correios_user.trim()}:${profile.correios_password.trim()}`);

          // Autentica token dos Correios
          const authController = new AbortController();
          const authTimeout = setTimeout(() => authController.abort(), 6000);

          const authRes = await fetch(`${baseUrl}/token/v1/autentica/contrato`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ numero: (profile.correios_contract || '').trim() }),
            signal: authController.signal
          }).catch(() => null);

          clearTimeout(authTimeout);

          if (authRes && authRes.ok) {
            const authData = await authRes.json().catch(() => null);
            const bearerToken = authData?.token || authData?.access_token;

            if (bearerToken) {
              for (const order of correiosOrders) {
                const code = String(order.tracking_code).trim().toUpperCase();
                
                const trackController = new AbortController();
                const trackTimeout = setTimeout(() => trackController.abort(), 5000);

                const trackRes = await fetch(`${baseUrl}/srorastro/v1/objetos/${code}?resultado=U`, {
                  method: 'GET',
                  headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Accept': 'application/json'
                  },
                  signal: trackController.signal
                }).catch(() => null);

                clearTimeout(trackTimeout);

                if (trackRes && trackRes.ok) {
                  const trackData = await trackRes.json().catch(() => null);
                  const objeto = trackData?.objetos?.[0];
                  if (objeto && Array.isArray(objeto.eventos) && objeto.eventos.length > 0) {
                    const latestDesc = (objeto.eventos[0].descricao || '').toLowerCase();
                    if ((latestDesc.includes('entregue') || latestDesc.includes('entrega efetuada')) && !alreadyDeliveredOrderIds.has(order.id)) {
                      alreadyDeliveredOrderIds.add(order.id);
                      await this.markOrderAsDelivered(order);
                      deliveredCount++;
                    }
                  }
                }

                await new Promise(r => setTimeout(r, 400));
              }
            }
          }
        } catch (coErr) {
          console.debug('Correios auto-tracking silencioso:', coErr);
        }
      }

      // 5. Verificação Pública Universal dos Correios (em tempo real para todos os pedidos restantes)
      const remainingOrders = ordersToCheck.filter((o: any) => !alreadyDeliveredOrderIds.has(o.id));
      for (const order of remainingOrders) {
        const code = String(order.tracking_code || '').trim().toUpperCase();
        if (correiosTrackingService.isCorreiosFormat(code)) {
          try {
            const result = await correiosTrackingService.track(code);
            if (result && result.status === 'delivered') {
              alreadyDeliveredOrderIds.add(order.id);
              await this.markOrderAsDelivered(order);
              deliveredCount++;
            }
          } catch (err) {
            console.debug(`Falha ao checar rastreio público para ${code}:`, err);
          }
          // Intervalo suave de 300ms entre requisições
          await new Promise(r => setTimeout(r, 300));
        }
      }

      localStorage.setItem(LAST_CHECK_KEY, String(Date.now()));

      if (deliveredCount > 0) {
        window.dispatchEvent(new CustomEvent('avs_orders_updated'));
      }

      return deliveredCount;
    } catch (err) {
      console.debug('Erro silencioso no auto-tracking:', err);
      return 0;
    } finally {
      this.isChecking = false;
    }
  },

  async markOrderAsDelivered(order: any) {
    try {
      const clientObj = order.clients || order.client || null;
      const clientName = clientObj?.name || 'Cliente';

      const updatedOrder = {
        ...order,
        status: 'Entregue'
      };

      const saved = await dbService.saveOrder(updatedOrder);

      // Dispara o alerta para o sininho no topo da página
      notificationService.addDeliveryNotification(saved || updatedOrder, clientName);
    } catch (e) {
      console.debug('Falha ao salvar pedido entregue no auto-tracking:', e);
    }
  }
};
