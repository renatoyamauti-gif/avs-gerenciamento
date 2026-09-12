export interface AppNotification {
  id: string;
  type: 'delivery' | 'order' | 'system';
  title: string;
  message: string;
  orderId?: string;
  trackingCode?: string;
  clientName?: string;
  createdAt: string;
  read: boolean;
}

const STORAGE_KEY = 'avs_delivery_notifications';

export const notificationService = {
  getNotifications(): AppNotification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: any) => n && typeof n === 'object' && !!n.id);
        }
      }
    } catch {}
    return [];
  },

  getUnreadCount(): number {
    return this.getNotifications().filter(n => n && !n.read).length;
  },

  addDeliveryNotification(order: any, clientName?: string): AppNotification {
    const notifications = this.getNotifications();
    const tracking = order.tracking_code ? String(order.tracking_code).trim().toUpperCase() : '';
    const client = clientName || 
      (Array.isArray(order.clients) ? order.clients[0]?.name : order.clients?.name) || 
      order.client?.name || 
      order.client_name || 
      'Cliente';
    
    // Evita duplicar notificação idêntica para o mesmo pedido
    const existing = notifications.find(n => n && n.orderId === order.id && n.type === 'delivery');
    if (existing) {
      return existing;
    }

    const newNotif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'delivery',
      title: 'Pedido Entregue! 📦',
      message: `A remessa para ${client}${tracking ? ` (Rastreio: ${tracking})` : ''} foi marcada como entregue com sucesso!`,
      orderId: order.id,
      trackingCode: tracking,
      clientName: client,
      createdAt: new Date().toISOString(),
      read: false
    };

    const updated = [newNotif, ...notifications].slice(0, 40);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Erro ao salvar notificações no localStorage:', e);
    }

    // Dispara evento para sincronizar todos os componentes abertos
    window.dispatchEvent(new CustomEvent('avs_notifications_updated', { detail: updated }));

    // Dispara notificação nativa silenciosa somente se já autorizada explicitamente pelo usuário
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(newNotif.title, {
          body: newNotif.message,
          icon: '/icon-192.png'
        });
      }
    } catch {}

    return newNotif;
  },

  markAsRead(id: string) {
    const list = this.getNotifications().map(n => n.id === id ? { ...n, read: true } : n);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    window.dispatchEvent(new CustomEvent('avs_notifications_updated', { detail: list }));
  },

  markAllAsRead() {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {}
    window.dispatchEvent(new CustomEvent('avs_notifications_updated', { detail: list }));
  },

  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent('avs_notifications_updated', { detail: [] }));
  },

  syncFromOrders(orders: any[]) {
    if (!Array.isArray(orders) || orders.length === 0) return;

    const currentList = this.getNotifications();
    const existingOrderIds = new Set(currentList.map(n => n.orderId).filter(Boolean));
    const newNotifications: AppNotification[] = [];

    // Busca pedidos com status 'Entregue' que ainda não possuem notificação
    const deliveredOrders = orders.filter(
      (o: any) => o && o.status === 'Entregue' && o.id && !existingOrderIds.has(o.id)
    );

    if (deliveredOrders.length === 0) return;

    for (const order of deliveredOrders) {
      const tracking = order.tracking_code ? String(order.tracking_code).trim().toUpperCase() : '';
      const client = 
        (Array.isArray(order.clients) ? order.clients[0]?.name : order.clients?.name) || 
        order.client?.name || 
        order.client_name || 
        'Cliente';
      const dateStr = order.updated_at || order.created_at || new Date().toISOString();

      newNotifications.push({
        id: `notif_order_${order.id}`,
        type: 'delivery',
        title: 'Pedido Entregue! 📦',
        message: `A remessa para ${client}${tracking ? ` (Rastreio: ${tracking})` : ''} foi marcada como entregue!`,
        orderId: order.id,
        trackingCode: tracking,
        clientName: client,
        createdAt: dateStr,
        read: false
      });
    }

    if (newNotifications.length > 0) {
      const merged = [...newNotifications, ...currentList].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {}
      window.dispatchEvent(new CustomEvent('avs_notifications_updated', { detail: merged }));
    }
  }
};
