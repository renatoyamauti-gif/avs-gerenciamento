import { supabase, supabaseAdmin } from './supabaseClient';
import { handleSupabaseError } from './errorHandlers';

export const dbService = {
  // Birds (Plantel)
  async getBirds() {
    const { data, error } = await supabase
      .from('birds')
      .select('*, rations(*)');
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

    if (error && error.code !== 'PGRST116') { // Handle "not found" vs actual error
      handleSupabaseError(error, 'get', 'profiles');
    }
    return data;
  },

  async updateProfile(updates: any) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Não autenticado');

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: user.id, ...updates, updated_at: new Date().toISOString() })
      .select();

    if (error) handleSupabaseError(error, 'update', 'profiles');
    return data[0];
  }
};
