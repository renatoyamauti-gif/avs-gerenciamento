import { useState, useEffect } from 'react';
import { dbService } from '../lib/dbService';

export type PlanType = 'free' | 'pro' | 'anual';

export function useSubscription() {
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await dbService.getProfile();
        // Verifica se o perfil existe e se tem uma coluna 'plan' definida.
        // Se não existir, por padrão o usuário será 'free'.
        if (profile && profile.plan) {
          setPlan(profile.plan as PlanType);
        } else {
          setPlan('free');
        }
      } catch (error) {
        console.error('Erro ao buscar perfil para a assinatura:', error);
        setPlan('free');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const isFreePlan = plan === 'free';
  
  // Limites definidos para o plano grátis (Iniciante)
  const limits = {
    birds: 5,
    incubators: 1
  };

  return { plan, loading, isFreePlan, limits };
}
