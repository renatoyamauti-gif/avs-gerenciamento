import { supabase, supabaseAdmin } from './supabaseClient';
import { handleSupabaseError } from './errorHandlers';

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
      user_id: user.id
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

    const historyData = { ...history, user_id: user.id };

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

    const historyData = { ...history, user_id: user.id };

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
    const baiaData = { ...baia, user_id: user.id };
    
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

    const racaData = { ...raca, user_id: user.id };

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

    const rationData = { ...ration, user_id: user.id };

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

    const ingredientData = { ...ingredient, user_id: user.id };

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

    const transactionData = { ...transaction, user_id: user.id };

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

    const logData = { ...log, user_id: user.id };

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

    const incData = { ...incubator, user_id: user.id };
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

    const batchData = { ...batch, user_id: user.id };

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

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Prioridade absoluta para o Auth Metadata.
    // Isso previne que Triggers antigos ou corrompidos do banco de dados sobrescrevam o nome.
    return {
      ...(data || {}),
      id: user.id,
      full_name: user.user_metadata?.full_name || data?.full_name || '',
      phone: user.user_metadata?.phone || data?.phone || '',
      criatorio_name: user.user_metadata?.criatorio_name || data?.criatorio_name || ''
    };
  },

  async updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    // Salva também diretamente no Auth Metadata como um backup infalível!
    await supabase.auth.updateUser({
      data: updates
    });

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select();

    if (error && error.code !== 'PGRST116') {
       console.error("DB Profile Save Error (Ignored due to Auth Fallback):", error);
    }
    
    return data ? data[0] : updates;
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

    const recordData = { ...record, user_id: user.id };

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

    const historyData = { ...history, user_id: user.id };

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

    const { error } = await supabaseAdmin
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
  }
};
