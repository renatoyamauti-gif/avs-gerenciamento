import { supabase, supabaseAdmin } from './supabaseClient';
import { handleSupabaseError } from './errorHandlers';

let _cachedProfile: any = null;
const _queryCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 300000; // 5 minutes TTL

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function isNetworkError(error: any): boolean {
  if (!error) return false;
  const message = error.message || '';
  if (!navigator.onLine) return true;
  if (message.includes('Failed to fetch') || message.includes('fetch') || message.includes('network') || message.includes('NetworkError')) {
    return true;
  }
  try {
    const parsed = JSON.parse(message);
    if (parsed.error && (parsed.error.includes('Failed to fetch') || parsed.error.includes('TypeError: Load failed'))) {
      return true;
    }
  } catch {}
  return false;
}

function getCachedData(key: string) {
  const cached = _queryCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    const stored = localStorage.getItem(`avs_cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      _queryCache[key] = parsed;
      if (Date.now() - parsed.timestamp < CACHE_TTL) {
        return parsed.data;
      }
    }
  } catch (e) {
    console.error(`Error reading cache for ${key}:`, e);
  }
  return null;
}

function getOfflineFallback(key: string) {
  const memCached = _queryCache[key];
  if (memCached) return memCached.data;

  try {
    const stored = localStorage.getItem(`avs_cache_${key}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.data;
    }
  } catch (e) {
    console.error(`Error reading fallback cache for ${key}:`, e);
  }
  return null;
}

function setCachedData(key: string, data: any) {
  const cachedObj = {
    data,
    timestamp: Date.now()
  };
  _queryCache[key] = cachedObj;
  try {
    localStorage.setItem(`avs_cache_${key}`, JSON.stringify(cachedObj));
  } catch (e) {
    console.error(`Error saving cache for ${key}:`, e);
  }
}

function invalidateCache(key: string) {
  delete _queryCache[key];
  try {
    localStorage.removeItem(`avs_cache_${key}`);
  } catch (e) {
    console.error(`Error invalidating cache for ${key}:`, e);
  }
}

interface PendingAction {
  id: string;
  table: string;
  action: 'insert' | 'update' | 'delete' | 'custom';
  data: any;
  customOpName?: string;
}

function getOfflineQueue(): PendingAction[] {
  try {
    const stored = localStorage.getItem('avs_offline_queue');
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error reading offline queue:", e);
    return [];
  }
}

function saveOfflineQueue(queue: PendingAction[]) {
  try {
    localStorage.setItem('avs_offline_queue', JSON.stringify(queue));
    window.dispatchEvent(new CustomEvent('offline-queue-updated'));
  } catch (e) {
    console.error("Error saving offline queue:", e);
  }
}

function addToOfflineQueue(table: string, action: PendingAction['action'], data: any, customOpName?: string) {
  const queue = getOfflineQueue();
  const newAction: PendingAction = {
    id: generateUUID(),
    table,
    action,
    data,
    customOpName
  };
  queue.push(newAction);
  saveOfflineQueue(queue);
}

function applyLocalWriteToCache(cacheKey: string, action: 'insert' | 'update' | 'delete', item: any) {
  let list = getOfflineFallback(cacheKey) || [];
  if (!Array.isArray(list)) return;

  if (action === 'insert') {
    if (!list.some((x: any) => x.id === item.id)) {
      list = [...list, item];
    }
  } else if (action === 'update') {
    list = list.map((x: any) => x.id === item.id ? { ...x, ...item } : x);
  } else if (action === 'delete') {
    const itemId = typeof item === 'object' ? item.id : item;
    list = list.filter((x: any) => x.id !== itemId);
  }

  setCachedData(cacheKey, list);
}

let _isSyncing = false;

async function syncOfflineQueue() {
  if (_isSyncing) return;
  if (!navigator.onLine) return;

  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  _isSyncing = true;
  console.log(`[Offline Sync] Sincronizando ${queue.length} operações pendentes...`);

  const remainingQueue: PendingAction[] = [];

  for (const op of queue) {
    try {
      if (op.action === 'custom') {
        if (op.customOpName === 'updateBirdsBaia') {
          const { birdIds, baiaName } = op.data;
          const { error } = await supabase
            .from('birds')
            .update({ baia: baiaName })
            .in('id', birdIds);
          if (error) throw error;
        } else if (op.customOpName === 'deleteBaia') {
          const { id, name } = op.data;
          if (id) {
            const { error } = await supabase.from('baias').delete().eq('id', id);
            if (error) throw error;
          }
          if (name) {
            const { error } = await supabase.from('birds').update({ baia: null }).eq('baia', name);
            if (error) throw error;
          }
        } else if (op.customOpName === 'cascadeRenameBaia') {
          const { oldName, newName } = op.data;
          await supabase.from('birds').update({ baia: newName }).eq('baia', oldName);
          await supabase.from('baia_history').update({ baia_name: newName }).eq('baia_name', oldName);
          await supabase.from('egg_logs').update({ baia: newName }).eq('baia', oldName);
        }
      } else if (op.action === 'insert' || op.action === 'update') {
        const { error } = await supabase
          .from(op.table)
          .upsert([op.data]);
        if (error) throw error;
      } else if (op.action === 'delete') {
        const id = typeof op.data === 'object' ? op.data.id : op.data;
        const { error } = await supabase
          .from(op.table)
          .delete()
          .eq('id', id);
        if (error) throw error;
      }
      console.log(`[Offline Sync] Sincronizado com sucesso: ${op.table} - ${op.action}`);
    } catch (err) {
      console.error(`[Offline Sync] Falha ao sincronizar operação:`, op, err);
      if (isNetworkError(err)) {
        remainingQueue.push(op);
        const index = queue.indexOf(op);
        remainingQueue.push(...queue.slice(index + 1));
        break;
      }
      console.warn(`[Offline Sync] Pulando operação com erro permanente para não travar a fila.`);
    }
  }

  saveOfflineQueue(remainingQueue);
  _isSyncing = false;

  if (remainingQueue.length === 0) {
    dbService.clearCache();
    window.dispatchEvent(new CustomEvent('profileUpdated'));
  }
}

export const dbService = {
  async handleWriteOperation(
    table: string,
    cacheKey: string,
    id: string | undefined,
    data: any,
    executeOnline: () => Promise<any>
  ) {
    invalidateCache(cacheKey);
    const tempId = id || generateUUID();
    const resolvedData = { ...data, id: tempId };
    
    if (navigator.onLine) {
      try {
        const result = await executeOnline();
        applyLocalWriteToCache(cacheKey, id ? 'update' : 'insert', result);
        syncOfflineQueue().catch(console.error);
        return result;
      } catch (err) {
        if (isNetworkError(err)) {
          console.warn(`Network error in write to ${table}. Queueing offline.`);
          return this.handleOfflineWrite(table, cacheKey, id, resolvedData);
        }
        throw err;
      }
    } else {
      return this.handleOfflineWrite(table, cacheKey, id, resolvedData);
    }
  },

  handleOfflineWrite(table: string, cacheKey: string, id: string | undefined, resolvedData: any) {
    const list = getOfflineFallback(cacheKey) || [];
    const isUpdate = id && list.some((x: any) => x.id === id);
    const action = isUpdate ? 'update' : 'insert';
    
    addToOfflineQueue(table, action, resolvedData);
    applyLocalWriteToCache(cacheKey, action, resolvedData);
    return resolvedData;
  },

  async handleDeleteOperation(
    table: string,
    cacheKey: string,
    id: string,
    executeOnline: () => Promise<any>
  ) {
    invalidateCache(cacheKey);
    
    if (navigator.onLine) {
      try {
        await executeOnline();
        applyLocalWriteToCache(cacheKey, 'delete', id);
        syncOfflineQueue().catch(console.error);
      } catch (err) {
        if (isNetworkError(err)) {
          console.warn(`Network error in delete from ${table}. Queueing offline.`);
          this.handleOfflineDelete(table, cacheKey, id);
          return;
        }
        throw err;
      }
    } else {
      this.handleOfflineDelete(table, cacheKey, id);
    }
  },

  handleOfflineDelete(table: string, cacheKey: string, id: string) {
    addToOfflineQueue(table, 'delete', { id });
    applyLocalWriteToCache(cacheKey, 'delete', id);
  },

  async syncOfflineQueue() {
    await syncOfflineQueue();
  },

  // Birds (Plantel)
  async getBirds() {
    const cached = getCachedData('birds');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('birds')
        .select('*, rations(*), bird_history(id)');
      if (error) handleSupabaseError(error, 'list', 'birds');
      setCachedData('birds', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('birds');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveBird(bird: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || bird.user_id;
    const birdData = {
      ...bird,
      user_id: ownerId
    };

    return this.handleWriteOperation(
      'birds',
      'birds',
      bird.id,
      birdData,
      async () => {
        if (bird.id && bird.id.length > 15) {
          const { data, error } = await supabase
            .from('birds')
            .update(birdData)
            .eq('id', bird.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'birds');
          return data[0];
        } else {
          const { id, ...insertData } = birdData;
          const { data, error } = await supabase
            .from('birds')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'birds');
          return data[0];
        }
      }
    );
  },

  async deleteBird(id: string) {
    return this.handleDeleteOperation(
      'birds',
      'birds',
      id,
      async () => {
        const { error } = await supabase
          .from('birds')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'birds');
      }
    );
  },

  async updateBirdsBaia(birdIds: string[], baiaName: string | null) {
    invalidateCache('birds');
    if (navigator.onLine) {
      try {
        const { error } = await supabase
          .from('birds')
          .update({ baia: baiaName })
          .in('id', birdIds);
        if (error) handleSupabaseError(error, 'update', 'birds');
        
        const birds = getOfflineFallback('birds') || [];
        const updated = birds.map((b: any) => birdIds.includes(b.id) ? { ...b, baia: baiaName } : b);
        setCachedData('birds', updated);
        
        syncOfflineQueue().catch(console.error);
      } catch (err) {
        if (isNetworkError(err)) {
          this.updateBirdsBaiaOffline(birdIds, baiaName);
          return;
        }
        throw err;
      }
    } else {
      this.updateBirdsBaiaOffline(birdIds, baiaName);
    }
  },

  updateBirdsBaiaOffline(birdIds: string[], baiaName: string | null) {
    addToOfflineQueue('birds', 'custom', { birdIds, baiaName }, 'updateBirdsBaia');
    const birds = getOfflineFallback('birds') || [];
    const updated = birds.map((b: any) => birdIds.includes(b.id) ? { ...b, baia: baiaName } : b);
    setCachedData('birds', updated);
  },

  async getBirdHistory(birdId: string) {
    const cacheKey = `bird_history_${birdId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('bird_history')
        .select('*')
        .eq('bird_id', birdId)
        .order('date', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'bird_history');
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback(cacheKey);
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveBirdHistory(history: any) {
    const cacheKey = `bird_history_${history.bird_id}`;
    const ownerId = await this.getOwnerId().catch(() => null) || history.user_id;
    const historyData = { ...history, user_id: ownerId };

    return this.handleWriteOperation(
      'bird_history',
      cacheKey,
      history.id,
      historyData,
      async () => {
        if (history.id && history.id.length > 15) {
          const { data, error } = await supabase
            .from('bird_history')
            .update(historyData)
            .eq('id', history.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'bird_history');
          return data[0];
        } else {
          const { id, ...insertData } = historyData;
          const { data, error } = await supabase
            .from('bird_history')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'bird_history');
          return data[0];
        }
      }
    );
  },

  async deleteBirdHistory(id: string) {
    let birdId: string | null = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('avs_cache_bird_history_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed.data) && parsed.data.some((h: any) => h.id === id)) {
              birdId = key.replace('avs_cache_bird_history_', '');
              break;
            }
          }
        }
      }
    } catch {}

    const cacheKey = birdId ? `bird_history_${birdId}` : 'bird_history_all';

    return this.handleDeleteOperation(
      'bird_history',
      cacheKey,
      id,
      async () => {
        const { error } = await supabase
          .from('bird_history')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'bird_history');
      }
    );
  },

  // Baia History
  async getBaiaHistory(baiaName: string) {
    const cacheKey = `baia_history_${baiaName}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('baia_history')
        .select('*')
        .eq('baia_name', baiaName)
        .order('date', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'baia_history');
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback(cacheKey);
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveBaiaHistory(history: any) {
    const cacheKey = `baia_history_${history.baia_name}`;
    const ownerId = await this.getOwnerId().catch(() => null) || history.user_id;
    const historyData = { ...history, user_id: ownerId };

    return this.handleWriteOperation(
      'baia_history',
      cacheKey,
      history.id,
      historyData,
      async () => {
        if (history.id && history.id.length > 15) {
          const { data, error } = await supabase
            .from('baia_history')
            .update(historyData)
            .eq('id', history.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'baia_history');
          return data[0];
        } else {
          const { id, ...insertData } = historyData;
          const { data, error } = await supabase
            .from('baia_history')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'baia_history');
          return data[0];
        }
      }
    );
  },

  async deleteBaiaHistory(id: string) {
    let baiaName: string | null = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('avs_cache_baia_history_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed.data) && parsed.data.some((h: any) => h.id === id)) {
              baiaName = key.replace('avs_cache_baia_history_', '');
              break;
            }
          }
        }
      }
    } catch {}

    const cacheKey = baiaName ? `baia_history_${baiaName}` : 'baia_history_all';

    return this.handleDeleteOperation(
      'baia_history',
      cacheKey,
      id,
      async () => {
        const { error } = await supabase
          .from('baia_history')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'baia_history');
      }
    );
  },

  // Baias (New Table)
  async getBaias() {
    const cached = getCachedData('baias');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('baias')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'baias');
      setCachedData('baias', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('baias');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveBaia(baia: any) {
    const oldName = baia.old_name;
    const baiaData = { ...baia };
    delete baiaData.old_name;

    const ownerId = await this.getOwnerId().catch(() => null) || baia.user_id;
    const resolvedBaiaData = { ...baiaData, user_id: ownerId };

    const result = await this.handleWriteOperation(
      'baias',
      'baias',
      baia.id,
      resolvedBaiaData,
      async () => {
        if (baia.id && baia.id.length > 15) {
          const { data, error } = await supabase
            .from('baias')
            .update(resolvedBaiaData)
            .eq('id', baia.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'baias');
          return data[0];
        } else {
          const { id, ...insertData } = resolvedBaiaData;
          const { data, error } = await supabase
            .from('baias')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'baias');
          return data[0];
        }
      }
    );

    if (oldName && oldName !== baia.name) {
      invalidateCache('birds');
      invalidateCache('egg_logs');
      if (navigator.onLine) {
        try {
          await supabase.from('birds').update({ baia: baia.name }).eq('baia', oldName);
          await supabase.from('baia_history').update({ baia_name: baia.name }).eq('baia_name', oldName);
          await supabase.from('egg_logs').update({ baia: baia.name }).eq('baia', oldName);
        } catch (err) {
          if (isNetworkError(err)) {
            addToOfflineQueue('birds', 'custom', { oldName, newName: baia.name }, 'cascadeRenameBaia');
          } else {
            throw err;
          }
        }
      } else {
        addToOfflineQueue('birds', 'custom', { oldName, newName: baia.name }, 'cascadeRenameBaia');
      }

      const birds = getOfflineFallback('birds') || [];
      const updatedBirds = birds.map((b: any) => b.baia === oldName ? { ...b, baia: baia.name } : b);
      setCachedData('birds', updatedBirds);

      const eggLogs = getOfflineFallback('egg_logs') || [];
      const updatedEggLogs = eggLogs.map((e: any) => e.baia === oldName ? { ...e, baia: baia.name } : e);
      setCachedData('egg_logs', updatedEggLogs);
    }

    return result;
  },

  async deleteBaia(id: string | null, name?: string) {
    invalidateCache('baias');
    invalidateCache('birds');
    
    if (navigator.onLine) {
      try {
        if (id) {
          const { error } = await supabase
            .from('baias')
            .delete()
            .eq('id', id);
          if (error) handleSupabaseError(error, 'delete', 'baias');
        }
        if (name) {
          await supabase.from('birds').update({ baia: null }).eq('baia', name);
        }
        
        if (id) applyLocalWriteToCache('baias', 'delete', id);
        if (name) {
          const birds = getOfflineFallback('birds') || [];
          const updated = birds.map((b: any) => b.baia === name ? { ...b, baia: null } : b);
          setCachedData('birds', updated);
        }
        syncOfflineQueue().catch(console.error);
      } catch (err) {
        if (isNetworkError(err)) {
          this.deleteBaiaOffline(id, name);
          return;
        }
        throw err;
      }
    } else {
      this.deleteBaiaOffline(id, name);
    }
  },

  deleteBaiaOffline(id: string | null, name?: string) {
    addToOfflineQueue('baias', 'custom', { id, name }, 'deleteBaia');
    if (id) applyLocalWriteToCache('baias', 'delete', id);
    if (name) {
      const birds = getOfflineFallback('birds') || [];
      const updated = birds.map((b: any) => b.baia === name ? { ...b, baia: null } : b);
      setCachedData('birds', updated);
    }
  },

  // Racas
  async getRacas() {
    const cached = getCachedData('racas');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('racas')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'racas');
      setCachedData('racas', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('racas');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveRaca(raca: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || raca.user_id;
    const racaData = { ...raca, user_id: ownerId };

    return this.handleWriteOperation(
      'racas',
      'racas',
      raca.id,
      racaData,
      async () => {
        if (raca.id && raca.id.length > 15) {
          const { data, error } = await supabase
            .from('racas')
            .update(racaData)
            .eq('id', raca.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'racas');
          return data[0];
        } else {
          const { id, ...insertData } = racaData;
          const { data, error } = await supabase
            .from('racas')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'racas');
          return data[0];
        }
      }
    );
  },

  async deleteRaca(id: string) {
    return this.handleDeleteOperation(
      'racas',
      'racas',
      id,
      async () => {
        const { error } = await supabase
          .from('racas')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'racas');
      }
    );
  },

  // Transaction Categories
  async getTransactionCategories() {
    const cached = getCachedData('transaction_categories');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'transaction_categories');
      setCachedData('transaction_categories', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('transaction_categories');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveTransactionCategory(category: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || category.user_id;
    const catData = { ...category, user_id: ownerId };

    return this.handleWriteOperation(
      'transaction_categories',
      'transaction_categories',
      category.id,
      catData,
      async () => {
        if (category.id && category.id.length > 15) {
          const { data, error } = await supabase
            .from('transaction_categories')
            .update(catData)
            .eq('id', category.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'transaction_categories');
          return data[0];
        } else {
          const { id, ...insertData } = catData;
          const { data, error } = await supabase
            .from('transaction_categories')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'transaction_categories');
          return data[0];
        }
      }
    );
  },

  async deleteTransactionCategory(id: string) {
    return this.handleDeleteOperation(
      'transaction_categories',
      'transaction_categories',
      id,
      async () => {
        const { error } = await supabase
          .from('transaction_categories')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'transaction_categories');
      }
    );
  },

  // Rations
  async getRations() {
    const cached = getCachedData('rations');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('rations')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'rations');
      setCachedData('rations', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('rations');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveRation(ration: any) {
    invalidateCache('birds');
    const ownerId = await this.getOwnerId().catch(() => null) || ration.user_id;
    const rationData = { ...ration, user_id: ownerId };

    return this.handleWriteOperation(
      'rations',
      'rations',
      ration.id,
      rationData,
      async () => {
        if (ration.id && ration.id.length > 15) {
          const { data, error } = await supabase
            .from('rations')
            .update(rationData)
            .eq('id', ration.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'rations');
          return data[0];
        } else {
          const { id, ...insertData } = rationData;
          const { data, error } = await supabase
            .from('rations')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'rations');
          return data[0];
        }
      }
    );
  },

  async deleteRation(id: string) {
    invalidateCache('birds');
    return this.handleDeleteOperation(
      'rations',
      'rations',
      id,
      async () => {
        const { error } = await supabase
          .from('rations')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'rations');
      }
    );
  },

  // Ingredients
  async getIngredients() {
    const cached = getCachedData('ingredients');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'ingredients');
      setCachedData('ingredients', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('ingredients');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveIngredient(ingredient: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || ingredient.user_id;
    const ingredientData = { ...ingredient, user_id: ownerId };

    return this.handleWriteOperation(
      'ingredients',
      'ingredients',
      ingredient.id,
      ingredientData,
      async () => {
        if (ingredient.id && ingredient.id.length > 15) {
          const { data, error } = await supabase
            .from('ingredients')
            .update(ingredientData)
            .eq('id', ingredient.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'ingredients');
          return data[0];
        } else {
          const { id, ...insertData } = ingredientData;
          const { data, error } = await supabase
            .from('ingredients')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'ingredients');
          return data[0];
        }
      }
    );
  },

  async deleteIngredient(id: string) {
    return this.handleDeleteOperation(
      'ingredients',
      'ingredients',
      id,
      async () => {
        const { error } = await supabase
          .from('ingredients')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'ingredients');
      }
    );
  },

  // Finance
  async getTransactions() {
    const cached = getCachedData('transactions');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'transactions');
      setCachedData('transactions', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('transactions');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveTransaction(transaction: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || transaction.user_id;
    const transactionData = { ...transaction, user_id: ownerId };

    return this.handleWriteOperation(
      'transactions',
      'transactions',
      transaction.id,
      transactionData,
      async () => {
        if (transaction.id && transaction.id.length > 15) {
          const { data, error } = await supabase
            .from('transactions')
            .update(transactionData)
            .eq('id', transaction.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'transactions');
          return data[0];
        } else {
          const { id, ...insertData } = transactionData;
          const { data, error } = await supabase
            .from('transactions')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'transactions');
          return data[0];
        }
      }
    );
  },

  async deleteTransaction(id: string) {
    return this.handleDeleteOperation(
      'transactions',
      'transactions',
      id,
      async () => {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'transactions');
      }
    );
  },

  // Eggs
  async getEggLogs() {
    const cached = getCachedData('egg_logs');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('egg_logs')
        .select('*, collector:profiles!collector_id(full_name)')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .order('day', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'egg_logs');
      setCachedData('egg_logs', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('egg_logs');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveEggLog(log: any) {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const ownerId = await this.getOwnerId().catch(() => null) || log.user_id;
    const logData = { 
      ...log, 
      user_id: ownerId,
      collector_id: log.collector_id || user?.id
    };

    return this.handleWriteOperation(
      'egg_logs',
      'egg_logs',
      log.id,
      logData,
      async () => {
        if (log.id && log.id.length > 15) {
          const { data, error } = await supabase
            .from('egg_logs')
            .update(logData)
            .eq('id', log.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'egg_logs');
          return data[0];
        } else {
          const { id, ...insertData } = logData;
          const { data, error } = await supabase
            .from('egg_logs')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'egg_logs');
          return data[0];
        }
      }
    );
  },

  async deleteEggLog(id: string) {
    return this.handleDeleteOperation(
      'egg_logs',
      'egg_logs',
      id,
      async () => {
        const { error } = await supabase
          .from('egg_logs')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'egg_logs');
      }
    );
  },

  // Incubators
  async getIncubators() {
    const cached = getCachedData('incubators');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('incubators')
        .select('*, incubator_batches(*)');
      if (error) handleSupabaseError(error, 'list', 'incubators');
      setCachedData('incubators', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('incubators');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveIncubator(incubator: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || incubator.user_id;
    const incData = { ...incubator, user_id: ownerId };
    const savedBatches = incData.incubator_batches;
    delete incData.incubator_batches;

    return this.handleWriteOperation(
      'incubators',
      'incubators',
      incubator.id,
      incData,
      async () => {
        if (incubator.id && incubator.id.length > 15) {
          const { data, error } = await supabase
            .from('incubators')
            .update(incData)
            .eq('id', incubator.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'incubators');
          return { ...data[0], incubator_batches: savedBatches || [] };
        } else {
          const { id, ...insertData } = incData;
          const { data, error } = await supabase
            .from('incubators')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'incubators');
          return { ...data[0], incubator_batches: [] };
        }
      }
    );
  },

  async deleteIncubator(id: string) {
    return this.handleDeleteOperation(
      'incubators',
      'incubators',
      id,
      async () => {
        const { error } = await supabase
          .from('incubators')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'incubators');
      }
    );
  },

  async saveBatch(batch: any) {
    invalidateCache('incubators');
    const ownerId = await this.getOwnerId().catch(() => null) || batch.user_id;
    const batchData = { ...batch, user_id: ownerId };

    const result = await this.handleWriteOperation(
      'incubator_batches',
      'incubator_batches_cache',
      batch.id,
      batchData,
      async () => {
        if (batch.id && batch.id.length > 15) {
          const { data, error } = await supabase
            .from('incubator_batches')
            .update(batchData)
            .eq('id', batch.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'incubator_batches');
          return data[0];
        } else {
          const { id, ...insertData } = batchData;
          const { data, error } = await supabase
            .from('incubator_batches')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'incubator_batches');
          return data[0];
        }
      }
    );

    const incubators = getOfflineFallback('incubators') || [];
    const updatedIncubators = incubators.map((inc: any) => {
      if (inc.id === batch.incubator_id) {
        let batches = inc.incubator_batches || [];
        if (batch.id && batches.some((b: any) => b.id === batch.id)) {
          batches = batches.map((b: any) => b.id === batch.id ? result : b);
        } else {
          batches = [...batches, result];
        }
        return { ...inc, incubator_batches: batches };
      }
      return inc;
    });
    setCachedData('incubators', updatedIncubators);

    return result;
  },

  async deleteBatch(id: string) {
    invalidateCache('incubators');
    
    let incubatorId: string | null = null;
    const incubators = getOfflineFallback('incubators') || [];
    for (const inc of incubators) {
      if (inc.incubator_batches?.some((b: any) => b.id === id)) {
        incubatorId = inc.id;
        break;
      }
    }

    await this.handleDeleteOperation(
      'incubator_batches',
      'incubator_batches_cache',
      id,
      async () => {
        const { error } = await supabase
          .from('incubator_batches')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'incubator_batches');
      }
    );

    if (incubatorId) {
      const updatedIncubators = incubators.map((inc: any) => {
        if (inc.id === incubatorId) {
          const batches = (inc.incubator_batches || []).filter((b: any) => b.id !== id);
          return { ...inc, incubator_batches: batches };
        }
        return inc;
      });
      setCachedData('incubators', updatedIncubators);
    }
  },

  // Profiles
  async getProfile(forceRefresh = false) {
    if (!forceRefresh && _cachedProfile) {
      return _cachedProfile;
    }

    try {
      const stored = localStorage.getItem('avs_cached_profile');
      if (stored && !forceRefresh) {
        _cachedProfile = JSON.parse(stored);
        return _cachedProfile;
      }
    } catch (e) {
      console.error("Error reading cached profile:", e);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar perfil do Supabase (ignorado devido a metadados de fallback):", error);
      }

      const profileData = {
        ...(data || {}),
        id: user.id,
        full_name: user.user_metadata?.full_name || data?.full_name || '',
        phone: user.user_metadata?.phone || data?.phone || '',
        criatorio_name: user.user_metadata?.criatorio_name || data?.criatorio_name || '',
        melhor_envio_token: user.user_metadata?.melhor_envio_token || data?.melhor_envio_token || '',
        origin_postal_code: user.user_metadata?.origin_postal_code || data?.origin_postal_code || '',
        melhor_envio_sandbox: user.user_metadata?.melhor_envio_sandbox ?? data?.melhor_envio_sandbox ?? false,
        superfrete_token: user.user_metadata?.superfrete_token || data?.superfrete_token || '',
        superfrete_sandbox: user.user_metadata?.superfrete_sandbox ?? data?.superfrete_sandbox ?? false,
        superfrete_enabled: user.user_metadata?.superfrete_enabled ?? data?.superfrete_enabled ?? false,
        correios_user: user.user_metadata?.correios_user || data?.correios_user || '',
        correios_password: user.user_metadata?.correios_password || data?.correios_password || '',
        correios_contract: user.user_metadata?.correios_contract || data?.correios_contract || '',
        correios_card: user.user_metadata?.correios_card || data?.correios_card || '',
        correios_sandbox: user.user_metadata?.correios_sandbox ?? data?.correios_sandbox ?? false,
        correios_enabled: user.user_metadata?.correios_enabled ?? data?.correios_enabled ?? false,
        correios_pac_code: user.user_metadata?.correios_pac_code || data?.correios_pac_code || '03298',
        correios_sedex_code: user.user_metadata?.correios_sedex_code || data?.correios_sedex_code || '03220',
        sender_name: user.user_metadata?.sender_name || data?.sender_name || '',
        sender_cpf: user.user_metadata?.sender_cpf || data?.sender_cpf || '',
        sender_phone: user.user_metadata?.sender_phone || data?.sender_phone || '',
        sender_email: user.user_metadata?.sender_email || data?.sender_email || '',
        sender_address: user.user_metadata?.sender_address || data?.sender_address || '',
        sender_number: user.user_metadata?.sender_number || data?.sender_number || '',
        sender_district: user.user_metadata?.sender_district || data?.sender_district || '',
        sender_city: user.user_metadata?.sender_city || data?.sender_city || '',
        sender_state: user.user_metadata?.sender_state || data?.sender_state || '',
        role: user.user_metadata?.role || data?.role || 'admin',
        permissions: user.user_metadata?.permissions || data?.permissions || null,
        parent_user_id: user.user_metadata?.parent_user_id || data?.parent_user_id || null
      };

      _cachedProfile = profileData;
      try {
        localStorage.setItem('avs_cached_profile', JSON.stringify(profileData));
      } catch {}
      return profileData;
    } catch (err) {
      if (isNetworkError(err) || !navigator.onLine) {
        if (_cachedProfile) return _cachedProfile;
        try {
          const stored = localStorage.getItem('avs_cached_profile');
          if (stored) {
            _cachedProfile = JSON.parse(stored);
            return _cachedProfile;
          }
        } catch {}
      }
      throw err;
    }
  },

  async updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    _cachedProfile = null; // Invalidate cache
    try {
      localStorage.removeItem('avs_cached_profile');
    } catch {}

    const profile = await this.getProfile();
    const cleanUpdates = { ...updates };
    if (profile && profile.role === 'tratador') {
      delete cleanUpdates.criatorio_name;
    }

    if (navigator.onLine) {
      try {
        await supabase.auth.updateUser({
          data: cleanUpdates
        });

        const { data, error } = await supabase
          .from('profiles')
          .upsert({ id: user.id, ...cleanUpdates, updated_at: new Date().toISOString() })
          .select();

        if (error && error.code !== 'PGRST116') {
           console.error("DB Profile Save Error (Ignored due to Auth Fallback):", error);
        }
        
        const finalResult = data ? data[0] : { ...profile, ...cleanUpdates };
        _cachedProfile = finalResult;
        try {
          localStorage.setItem('avs_cached_profile', JSON.stringify(finalResult));
        } catch {}
        return finalResult;
      } catch (err) {
        if (isNetworkError(err)) {
          return this.updateProfileOffline(user.id, profile, cleanUpdates);
        }
        throw err;
      }
    } else {
      return this.updateProfileOffline(user.id, profile, cleanUpdates);
    }
  },

  updateProfileOffline(userId: string, currentProfile: any, cleanUpdates: any) {
    const finalResult = { ...currentProfile, ...cleanUpdates, id: userId };
    _cachedProfile = finalResult;
    try {
      localStorage.setItem('avs_cached_profile', JSON.stringify(finalResult));
    } catch {}
    addToOfflineQueue('profiles', 'update', { id: userId, ...cleanUpdates });
    return finalResult;
  },

  async getOwnerId() {
    // 1. Check cache first.
    if (_cachedProfile) {
      if (_cachedProfile.parent_user_id) {
        return _cachedProfile.parent_user_id;
      }
      if (_cachedProfile.role !== 'tratador') {
        return _cachedProfile.id;
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // 2. Fetch parent_user_id directly from public.profiles table
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('parent_user_id, role')
        .eq('id', user.id)
        .single();
      
      if (!error && data) {
        if (_cachedProfile && _cachedProfile.id === user.id) {
          _cachedProfile.parent_user_id = data.parent_user_id;
          _cachedProfile.role = data.role || _cachedProfile.role;
        }
        return data.parent_user_id || user.id;
      }
      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao buscar parent_user_id direto no banco:", error);
      }
    } catch (err) {
      console.error("Falha ao buscar parent_user_id direto no banco:", err);
    }

    // 3. Fallback to auth metadata or getProfile()
    const metadataParentId = user.user_metadata?.parent_user_id;
    if (metadataParentId) return metadataParentId;

    const profile = await this.getProfile();
    return profile ? (profile.parent_user_id || profile.id) : user.id;
  },

  // Maternity
  async getMaternityRecords() {
    const cached = getCachedData('maternity');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('maternity')
        .select('*')
        .order('birth_date', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'maternity');
      setCachedData('maternity', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('maternity');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveMaternityRecord(record: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || record.user_id;
    const recordData = { ...record, user_id: ownerId };

    return this.handleWriteOperation(
      'maternity',
      'maternity',
      record.id,
      recordData,
      async () => {
        if (record.id && record.id.length > 15) {
          const { data, error } = await supabase
            .from('maternity')
            .update(recordData)
            .eq('id', record.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'maternity');
          return data[0];
        } else {
          const { id, ...insertData } = recordData;
          const { data, error } = await supabase
            .from('maternity')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'maternity');
          return data[0];
        }
      }
    );
  },

  async deleteMaternityRecord(id: string) {
    return this.handleDeleteOperation(
      'maternity',
      'maternity',
      id,
      async () => {
        const { error } = await supabase
          .from('maternity')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'maternity');
      }
    );
  },

  async getMaternityHistory(maternityId: string) {
    const cacheKey = `maternity_history_${maternityId}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('maternity_history')
        .select('*')
        .eq('maternity_id', maternityId)
        .order('date', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'maternity_history');
      setCachedData(cacheKey, data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback(cacheKey);
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveMaternityHistory(history: any) {
    const cacheKey = `maternity_history_${history.maternity_id}`;
    const ownerId = await this.getOwnerId().catch(() => null) || history.user_id;
    const historyData = { ...history, user_id: ownerId };

    return this.handleWriteOperation(
      'maternity_history',
      cacheKey,
      history.id,
      historyData,
      async () => {
        if (history.id && history.id.length > 15) {
          const { data, error } = await supabase
            .from('maternity_history')
            .update(historyData)
            .eq('id', history.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'maternity_history');
          return data[0];
        } else {
          const { id, ...insertData } = historyData;
          const { data, error } = await supabase
            .from('maternity_history')
            .insert([insertData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'maternity_history');
          return data[0];
        }
      }
    );
  },

  async deleteMaternityHistory(id: string) {
    let maternityId: string | null = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('avs_cache_maternity_history_')) {
          const stored = localStorage.getItem(key);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed.data) && parsed.data.some((h: any) => h.id === id)) {
              maternityId = key.replace('avs_cache_maternity_history_', '');
              break;
            }
          }
        }
      }
    } catch {}

    const cacheKey = maternityId ? `maternity_history_${maternityId}` : 'maternity_history_all';

    return this.handleDeleteOperation(
      'maternity_history',
      cacheKey,
      id,
      async () => {
        const { error } = await supabase
          .from('maternity_history')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'maternity_history');
      }
    );
  },

  // Chat
  async getChatMessages(limit = 100) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, profiles(full_name, criatorio_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('getChatMessages error:', error);
      return [];
    }
    return data?.reverse() || [];
  },

  async sendChatMessage(message: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('chat_messages')
      .insert([{ user_id: user.id, message }]);
    if (error) {
      console.error('sendChatMessage error:', error);
      throw error;
    }
  },

  async updateChatStatus(enabled: boolean) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { error } = await supabase
      .from('profiles')
      .update({ chat_enabled: enabled })
      .eq('id', user.id);
    
    if (error) {
      console.error("DB Chat Status Save Error:", error);
      throw error;
    }
  },

  async deleteChatMessage(messageId: string) {
    const { error } = await supabaseAdmin
      .from('chat_messages')
      .delete()
      .eq('id', messageId);
    if (error) {
      console.error('deleteChatMessage error:', error);
      throw error;
    }
  },

  async warnUser(userId: string, warningMessage: string | null) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ warning_message: warningMessage })
      .eq('id', userId);
    if (error) {
      console.error('warnUser error:', error);
      throw error;
    }
  },

  async blockUserFromChat(userId: string, blocked: boolean) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ chat_blocked: blocked })
      .eq('id', userId);
    if (error) {
      console.error('blockUserFromChat error:', error);
      throw error;
    }
  },

  async getProfiles() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('full_name');
    if (error) {
      console.error('getProfiles error:', error);
      return [];
    }
    return data || [];
  },

  async getTeamMembers() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('parent_user_id', user.id)
      .order('full_name');

    if (error) handleSupabaseError(error, 'list', 'profiles');
    return data || [];
  },

  async createSubUser(email: string, password: string, fullName: string, permissions: any) {
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error('Não autenticado');

    const adminProfile = await this.getProfile();
    const criatorioName = adminProfile?.criatorio_name || '';

    // Convert username to @avs.local email format if it's not a standard email
    let userEmail = email.trim();
    if (!userEmail.includes('@')) {
      userEmail = `${userEmail.toLowerCase().replace(/\s+/g, '')}@avs.local`;
    }

    // 1. Create the user account using admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'tratador',
        parent_user_id: adminUser.id,
        criatorio_name: criatorioName,
        permissions
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário de autenticação');

    // 2. Create the profile record in profiles table (use upsert to prevent conflicts with database triggers)
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        full_name: fullName,
        email: userEmail,
        parent_user_id: adminUser.id,
        role: 'tratador',
        permissions,
        criatorio_name: null
      })
      .select();

    if (profileError) {
      // Rollback auth user creation if profile fails to ensure consistency
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return profileData[0];
  },

  async checkUsernameAvailability(username: string) {
    const email = `${username.trim().toLowerCase().replace(/\s+/g, '')}@avs.local`;
    
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar disponibilidade de usuário:', error);
      throw error;
    }

    return {
      available: !data,
      exists: !!data
    };
  },

  async getUsernameSuggestions(username: string, adminProfile?: any) {
    const base = username.trim().toLowerCase().replace(/\s+/g, '');
    let criatorioSuffix = '';
    
    if (adminProfile?.criatorio_name) {
      criatorioSuffix = adminProfile.criatorio_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      
      criatorioSuffix = criatorioSuffix.replace(/^criatorio/, '');
    }

    const potentialSuggestions: string[] = [];
    
    if (criatorioSuffix && criatorioSuffix.length > 0) {
      potentialSuggestions.push(`${base}_${criatorioSuffix}`);
      potentialSuggestions.push(`${base}${criatorioSuffix}`);
    }

    for (let i = 1; i <= 5; i++) {
      potentialSuggestions.push(`${base}${i}`);
    }
    
    const suggestions: string[] = [];
    for (const sug of potentialSuggestions) {
      const email = `${sug}@avs.local`;
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      if (!error && !data) {
        suggestions.push(sug);
        if (suggestions.length >= 3) break;
      }
    }

    if (suggestions.length === 0) {
      for (let i = 0; i < 5; i++) {
        const rand = Math.floor(100 + Math.random() * 900);
        const sug = `${base}${rand}`;
        const email = `${sug}@avs.local`;
        const { data } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle();
        if (!data) {
          suggestions.push(sug);
          if (suggestions.length >= 3) break;
        }
      }
    }

    return suggestions;
  },

  async updateSubUser(id: string, fullName: string, permissions: any, password?: string) {
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error('Não autenticado');

    const { data: existingProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('parent_user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (existingProfile.parent_user_id !== adminUser.id) {
      throw new Error('Você não tem permissão para editar este usuário.');
    }

    const updateData: any = {
      user_metadata: {
        full_name: fullName,
        permissions
      }
    };
    if (password && password.trim().length >= 6) {
      updateData.password = password.trim();
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      id,
      updateData
    );
    if (authError) throw authError;

    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: fullName,
        permissions,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (profileError) throw profileError;
    return profileData[0];
  },

  async deleteSubUser(id: string) {
    // Verify that the user being deleted is indeed a child of the logged-in admin user
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) throw new Error('Não autenticado');

    const { data: profileToDelete, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('parent_user_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (profileToDelete.parent_user_id !== adminUser.id) {
      throw new Error('Você não tem permissão para excluir este usuário.');
    }

    // 1. Delete authentication account
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) throw authError;

    // 2. Delete database profile
    const { error: dbError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;
  },

  // Bird Lineage / Pedigree
  async getBirdLineage(birdId: string) {
    const { data: target, error } = await supabase
      .from('birds')
      .select('*')
      .eq('id', birdId)
      .single();
    if (error) throw error;
    if (!target) return null;

    let father = null;
    let mother = null;
    let paternalGrandfather = null;
    let paternalGrandmother = null;
    let maternalGrandfather = null;
    let maternalGrandmother = null;

    const parentIds = [target.father_id, target.mother_id].filter(Boolean);
    if (parentIds.length > 0) {
      const { data: parents, error: pErr } = await supabase
        .from('birds')
        .select('*')
        .in('id', parentIds);
      if (!pErr && parents) {
        father = parents.find(b => b.id === target.father_id) || null;
        mother = parents.find(b => b.id === target.mother_id) || null;
      }
    }

    const grandparentIds = [
      father?.father_id,
      father?.mother_id,
      mother?.father_id,
      mother?.mother_id
    ].filter(Boolean);

    if (grandparentIds.length > 0) {
      const { data: grandparents, error: gErr } = await supabase
        .from('birds')
        .select('*')
        .in('id', grandparentIds);
      if (!gErr && grandparents) {
        paternalGrandfather = grandparents.find(b => b.id === father?.father_id) || null;
        paternalGrandmother = grandparents.find(b => b.id === father?.mother_id) || null;
        maternalGrandfather = grandparents.find(b => b.id === mother?.father_id) || null;
        maternalGrandmother = grandparents.find(b => b.id === mother?.mother_id) || null;
      }
    }

    return {
      target,
      father,
      mother,
      paternalGrandfather,
      paternalGrandmother,
      maternalGrandfather,
      maternalGrandmother
    };
  },

  // Clients
  async getClients() {
    const cached = getCachedData('clients');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'clients');
      setCachedData('clients', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('clients');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveClient(client: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || client.user_id;
    const clientData = { ...client, user_id: ownerId };

    return this.handleWriteOperation(
      'clients',
      'clients',
      client.id,
      clientData,
      async () => {
        if (client.id && client.id.length > 15) {
          const { data, error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', client.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'clients');
          return data[0];
        } else {
          const { id, ...cleanData } = clientData;
          const { data, error } = await supabase
            .from('clients')
            .insert([cleanData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'clients');
          return data[0];
        }
      }
    );
  },

  async deleteClient(id: string) {
    return this.handleDeleteOperation(
      'clients',
      'clients',
      id,
      async () => {
        const { error } = await supabase
          .from('clients')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'clients');
      }
    );
  },

  // Orders
  async getOrders() {
    const cached = getCachedData('orders');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*, clients(*)')
        .order('created_at', { ascending: false });
      if (error) handleSupabaseError(error, 'list', 'orders');
      setCachedData('orders', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('orders');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveOrder(order: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || order.user_id;
    const orderData = { ...order, user_id: ownerId };
    const savedClients = orderData.clients;
    delete orderData.clients;

    const result = await this.handleWriteOperation(
      'orders',
      'orders',
      order.id,
      orderData,
      async () => {
        if (order.id && order.id.length > 15) {
          const { data, error } = await supabase
            .from('orders')
            .update(orderData)
            .eq('id', order.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'orders');
          return { ...data[0], clients: savedClients || null };
        } else {
          const { id, ...cleanData } = orderData;
          const { data, error } = await supabase
            .from('orders')
            .insert([cleanData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'orders');
          return { ...data[0], clients: null };
        }
      }
    );

    if (savedClients) {
      const orders = getOfflineFallback('orders') || [];
      const updated = orders.map((o: any) => o.id === result.id ? { ...o, clients: savedClients } : o);
      setCachedData('orders', updated);
    }
    return result;
  },

  async deleteOrder(id: string) {
    return this.handleDeleteOperation(
      'orders',
      'orders',
      id,
      async () => {
        const { error } = await supabase
          .from('orders')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'orders');
      }
    );
  },

  // Products
  async getProducts() {
    const cached = getCachedData('products');
    if (cached) return cached;
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      if (error) handleSupabaseError(error, 'list', 'products');
      setCachedData('products', data);
      return data;
    } catch (err) {
      if (isNetworkError(err)) {
        const fallback = getOfflineFallback('products');
        if (fallback) return fallback;
      }
      throw err;
    }
  },

  async saveProduct(product: any) {
    const ownerId = await this.getOwnerId().catch(() => null) || product.user_id;
    const productData = { ...product, user_id: ownerId };

    return this.handleWriteOperation(
      'products',
      'products',
      product.id,
      productData,
      async () => {
        if (product.id && product.id.length > 15) {
          const { data, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', product.id)
            .select();
          if (error) handleSupabaseError(error, 'update', 'products');
          return data[0];
        } else {
          const { id, ...cleanData } = productData;
          const { data, error } = await supabase
            .from('products')
            .insert([cleanData])
            .select();
          if (error) handleSupabaseError(error, 'create', 'products');
          return data[0];
        }
      }
    );
  },

  async deleteProduct(id: string) {
    return this.handleDeleteOperation(
      'products',
      'products',
      id,
      async () => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', id);
        if (error) handleSupabaseError(error, 'delete', 'products');
      }
    );
  },

  clearCache() {
    _cachedProfile = null;
    Object.keys(_queryCache).forEach(key => delete _queryCache[key]);
  },

  async getCollectors() {
    const ownerId = await this.getOwnerId();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .or(`id.eq.${ownerId},parent_user_id.eq.${ownerId}`)
      .order('full_name');
    if (error) handleSupabaseError(error, 'list', 'profiles');
    return data || [];
  }
};

