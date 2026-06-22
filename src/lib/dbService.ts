import { supabase, supabaseAdmin } from './supabaseClient';
import { handleSupabaseError } from './errorHandlers';

let _cachedProfile: any = null;

export const dbService = {
  // Birds (Plantel)
  async getBirds() {
    const { data, error } = await supabase
      .from('birds')
      .select('*, rations(*), bird_history(id)');
    if (error) handleSupabaseError(error, 'list', 'birds');
    return data;
  },

  async saveBird(bird: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const birdData = {
      ...bird,
      user_id: await this.getOwnerId()
    };

    if (bird.id && bird.id.length > 15) { // Simple check for UUID vs temporary local ID
      const { data, error } = await supabase
        .from('birds')
        .update(birdData)
        .eq('id', bird.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'birds');
      return data[0];
    } else {
      delete birdData.id;
      const { data, error } = await supabase
        .from('birds')
        .insert([birdData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'birds');
      return data[0];
    }
  },

  async deleteBird(id: string) {
    const { error } = await supabase
      .from('birds')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'birds');
  },

  async updateBirdsBaia(birdIds: string[], baiaName: string | null) {
    const { error } = await supabase
      .from('birds')
      .update({ baia: baiaName })
      .in('id', birdIds);
    if (error) handleSupabaseError(error, 'update', 'birds');
  },

  async getBirdHistory(birdId: string) {
    const { data, error } = await supabase
      .from('bird_history')
      .select('*')
      .eq('bird_id', birdId)
      .order('date', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'bird_history');
    return data;
  },

  async saveBirdHistory(history: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const historyData = { ...history, user_id: await this.getOwnerId() };

    if (history.id && history.id.length > 15) {
      const { data, error } = await supabase
        .from('bird_history')
        .update(historyData)
        .eq('id', history.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'bird_history');
      return data[0];
    } else {
      delete historyData.id;
      const { data, error } = await supabase
        .from('bird_history')
        .insert([historyData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'bird_history');
      return data[0];
    }
  },

  async deleteBirdHistory(id: string) {
    const { error } = await supabase
      .from('bird_history')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'bird_history');
  },

  // Baia History
  async getBaiaHistory(baiaName: string) {
    const { data, error } = await supabase
      .from('baia_history')
      .select('*')
      .eq('baia_name', baiaName)
      .order('date', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'baia_history');
    return data;
  },

  async saveBaiaHistory(history: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const historyData = { ...history, user_id: await this.getOwnerId() };

    if (history.id && history.id.length > 15) {
      const { data, error } = await supabase
        .from('baia_history')
        .update(historyData)
        .eq('id', history.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'baia_history');
      return data[0];
    } else {
      delete historyData.id;
      const { data, error } = await supabase
        .from('baia_history')
        .insert([historyData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'baia_history');
      return data[0];
    }
  },

  async deleteBaiaHistory(id: string) {
    const { error } = await supabase
      .from('baia_history')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'baia_history');
  },

  // Baias (New Table)
  async getBaias() {
    const { data, error } = await supabase
      .from('baias')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'baias');
    return data;
  },

  async saveBaia(baia: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const oldName = baia.old_name;
    delete baia.old_name;
    const baiaData = { ...baia, user_id: await this.getOwnerId() };
    
    let resultData;

    if (baia.id && baia.id.length > 15) {
      const { data, error } = await supabase
        .from('baias')
        .update(baiaData)
        .eq('id', baia.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'baias');
      resultData = data[0];
    } else {
      delete baiaData.id;
      const { data, error } = await supabase
        .from('baias')
        .insert([baiaData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'baias');
      resultData = data[0];
    }

    // Cascade rename if necessary
    if (oldName && oldName !== baia.name) {
      await supabase.from('birds').update({ baia: baia.name }).eq('baia', oldName);
      await supabase.from('baia_history').update({ baia_name: baia.name }).eq('baia_name', oldName);
      await supabase.from('egg_logs').update({ baia: baia.name }).eq('baia', oldName);
    }

    return resultData;
  },

  async deleteBaia(id: string | null, name?: string) {
    if (id) {
      const { error } = await supabase
        .from('baias')
        .delete()
        .eq('id', id);
      if (error) handleSupabaseError(error, 'delete', 'baias');
    }
    if (name) {
      // Clear birds that were in this baia
      await supabase.from('birds').update({ baia: null }).eq('baia', name);
    }
  },

  // Racas
  async getRacas() {
    const { data, error } = await supabase
      .from('racas')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'racas');
    return data;
  },

  async saveRaca(raca: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const racaData = { ...raca, user_id: await this.getOwnerId() };

    if (raca.id && raca.id.length > 15) {
      const { data, error } = await supabase
        .from('racas')
        .update(racaData)
        .eq('id', raca.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'racas');
      return data[0];
    } else {
      delete racaData.id;
      const { data, error } = await supabase
        .from('racas')
        .insert([racaData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'racas');
      return data[0];
    }
  },

  async deleteRaca(id: string) {
    const { error } = await supabase
      .from('racas')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'racas');
  },

  // Transaction Categories
  async getTransactionCategories() {
    const { data, error } = await supabase
      .from('transaction_categories')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'transaction_categories');
    return data;
  },

  async saveTransactionCategory(category: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const catData = { ...category, user_id: await this.getOwnerId() };

    if (category.id && category.id.length > 15) {
      const { data, error } = await supabase
        .from('transaction_categories')
        .update(catData)
        .eq('id', category.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'transaction_categories');
      return data[0];
    } else {
      delete catData.id;
      const { data, error } = await supabase
        .from('transaction_categories')
        .insert([catData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'transaction_categories');
      return data[0];
    }
  },

  async deleteTransactionCategory(id: string) {
    const { error } = await supabase
      .from('transaction_categories')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'transaction_categories');
  },

  // Rations
  async getRations() {
    const { data, error } = await supabase
      .from('rations')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'rations');
    return data;
  },

  async saveRation(ration: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const rationData = { ...ration, user_id: await this.getOwnerId() };

    if (ration.id && ration.id.length > 15) {
      const { data, error } = await supabase
        .from('rations')
        .update(rationData)
        .eq('id', ration.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'rations');
      return data[0];
    } else {
      const { id, ...cleanData } = rationData;
      const { data, error } = await supabase
        .from('rations')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'rations');
      return data[0];
    }
  },

  async deleteRation(id: string) {
    const { error } = await supabase
      .from('rations')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'rations');
  },

  // Ingredients
  async getIngredients() {
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'ingredients');
    return data;
  },

  async saveIngredient(ingredient: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const ingredientData = { ...ingredient, user_id: await this.getOwnerId() };

    if (ingredient.id && ingredient.id.length > 15) {
      const { data, error } = await supabase
        .from('ingredients')
        .update(ingredientData)
        .eq('id', ingredient.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'ingredients');
      return data[0];
    } else {
      const { id, ...cleanData } = ingredientData;
      const { data, error } = await supabase
        .from('ingredients')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'ingredients');
      return data[0];
    }
  },

  async deleteIngredient(id: string) {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'ingredients');
  },

  // Finance
  async getTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'transactions');
    return data;
  },

  async saveTransaction(transaction: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const transactionData = { ...transaction, user_id: await this.getOwnerId() };

    if (transaction.id && transaction.id.length > 15) {
      const { data, error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', transaction.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'transactions');
      return data[0];
    } else {
      const { id, ...cleanData } = transactionData;
      const { data, error } = await supabase
        .from('transactions')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'transactions');
      return data[0];
    }
  },

  async deleteTransaction(id: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'transactions');
  },

  // Eggs
  async getEggLogs() {
    const { data, error } = await supabase
      .from('egg_logs')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('day', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'egg_logs');
    return data;
  },

  async saveEggLog(log: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const logData = { ...log, user_id: await this.getOwnerId() };

    if (log.id && log.id.length > 15) {
      const { data, error } = await supabase
        .from('egg_logs')
        .update(logData)
        .eq('id', log.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'egg_logs');
      return data[0];
    } else {
      const { id, ...cleanData } = logData;
      const { data, error } = await supabase
        .from('egg_logs')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'egg_logs');
      return data[0];
    }
  },

  async deleteEggLog(id: string) {
    const { error } = await supabase
      .from('egg_logs')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'egg_logs');
  },

  // Incubators
  async getIncubators() {
    const { data, error } = await supabase
      .from('incubators')
      .select('*, incubator_batches(*)');
    if (error) handleSupabaseError(error, 'list', 'incubators');
    return data;
  },

  async saveIncubator(incubator: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const incData = { ...incubator, user_id: await this.getOwnerId() };
    delete incData.incubator_batches; // Don't try to save child relationship items directly here

    if (incubator.id && incubator.id.length > 15) {
      const { data, error } = await supabase
        .from('incubators')
        .update(incData)
        .eq('id', incubator.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'incubators');
      return data[0];
    } else {
      const { id, ...cleanData } = incData;
      const { data, error } = await supabase
        .from('incubators')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'incubators');
      return data[0];
    }
  },

  async deleteIncubator(id: string) {
    const { error } = await supabase
      .from('incubators')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'incubators');
  },

  async saveBatch(batch: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const batchData = { ...batch, user_id: await this.getOwnerId() };

    if (batch.id && batch.id.length > 15) {
      const { data, error } = await supabase
        .from('incubator_batches')
        .update(batchData)
        .eq('id', batch.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'incubator_batches');
      return data[0];
    } else {
      const { id, ...cleanData } = batchData;
      const { data, error } = await supabase
        .from('incubator_batches')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'incubator_batches');
      return data[0];
    }
  },

  async deleteBatch(id: string) {
    const { error } = await supabase
      .from('incubator_batches')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'incubator_batches');
  },

  // Profiles
  async getProfile() {
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
    return profileData;
  },

  async updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    _cachedProfile = null; // Invalidate cache

    await supabase.auth.updateUser({
      data: updates
    });

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select();

    if (error && error.code !== 'PGRST116') {
       console.error("DB Profile Save Error (Ignored due to Auth Fallback):", error);
    }
    
    return data ? data[0] : updates;
  },

  async getOwnerId() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // 1. Check cache first. Bypassed for keepers if parent_user_id is missing.
    if (_cachedProfile && _cachedProfile.id === user.id) {
      if (_cachedProfile.parent_user_id) {
        return _cachedProfile.parent_user_id;
      }
      if (_cachedProfile.role !== 'tratador') {
        return user.id;
      }
    }

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
    const { data, error } = await supabase
      .from('maternity')
      .select('*')
      .order('birth_date', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'maternity');
    return data;
  },

  async saveMaternityRecord(record: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const recordData = { ...record, user_id: await this.getOwnerId() };

    if (record.id && record.id.length > 15) {
      const { data, error } = await supabase
        .from('maternity')
        .update(recordData)
        .eq('id', record.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'maternity');
      return data[0];
    } else {
      delete recordData.id;
      const { data, error } = await supabase
        .from('maternity')
        .insert([recordData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'maternity');
      return data[0];
    }
  },

  async deleteMaternityRecord(id: string) {
    const { error } = await supabase
      .from('maternity')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'maternity');
  },

  async getMaternityHistory(maternityId: string) {
    const { data, error } = await supabase
      .from('maternity_history')
      .select('*')
      .eq('maternity_id', maternityId)
      .order('date', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'maternity_history');
    return data;
  },

  async saveMaternityHistory(history: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const historyData = { ...history, user_id: await this.getOwnerId() };

    if (history.id && history.id.length > 15) {
      const { data, error } = await supabase
        .from('maternity_history')
        .update(historyData)
        .eq('id', history.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'maternity_history');
      return data[0];
    } else {
      delete historyData.id;
      const { data, error } = await supabase
        .from('maternity_history')
        .insert([historyData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'maternity_history');
      return data[0];
    }
  },

  async deleteMaternityHistory(id: string) {
    const { error } = await supabase
      .from('maternity_history')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'maternity_history');
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
        criatorio_name: criatorioName
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
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'clients');
    return data;
  },

  async saveClient(client: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const clientData = { ...client, user_id: await this.getOwnerId() };

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
  },

  async deleteClient(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'clients');
  },

  // Orders
  async getOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*, clients(*)')
      .order('created_at', { ascending: false });
    if (error) handleSupabaseError(error, 'list', 'orders');
    return data;
  },

  async saveOrder(order: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const orderData = { ...order, user_id: await this.getOwnerId() };
    delete orderData.clients; // Remove preloaded relationship if any

    if (order.id && order.id.length > 15) {
      const { data, error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', order.id)
        .select();
      if (error) handleSupabaseError(error, 'update', 'orders');
      return data[0];
    } else {
      const { id, ...cleanData } = orderData;
      const { data, error } = await supabase
        .from('orders')
        .insert([cleanData])
        .select();
      if (error) handleSupabaseError(error, 'create', 'orders');
      return data[0];
    }
  },

  async deleteOrder(id: string) {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'orders');
  },

  // Products
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    if (error) handleSupabaseError(error, 'list', 'products');
    return data;
  },

  async saveProduct(product: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const productData = { ...product, user_id: await this.getOwnerId() };

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
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) handleSupabaseError(error, 'delete', 'products');
  },

  clearCache() {
    _cachedProfile = null;
  }
};

