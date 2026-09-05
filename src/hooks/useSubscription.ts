import { useState, useEffect } from 'react';
import { dbService } from '../lib/dbService';
import { supabase } from '../lib/supabaseClient';

export type PlanType = 'free' | 'pro' | 'trimestral' | 'anual';

export function useSubscription() {
  const [plan, setPlan] = useState<PlanType>('free');
  const [loading, setLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPlan('free');
          setLoading(false);
          return;
        }

        const profile = await dbService.getProfile();
        const currentPlan = (profile && profile.plan) ? profile.plan.toLowerCase() as PlanType : 'free';
        
        let expired = false;
        let daysLeft = 0;

        if (currentPlan === 'free') {
          const createdDate = new Date(user.created_at);
          const now = new Date();
          const diffTime = now.getTime() - createdDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));
          
          daysLeft = Math.max(1, 7 - (diffDays > 7 ? (diffDays % 7) : diffDays));
          expired = false;
        }

        setPlan(currentPlan);
        setIsTrialExpired(false);
        setTrialDaysLeft(daysLeft);
      } catch (error) {
        console.error('Erro ao buscar perfil para a assinatura:', error);
        setPlan('free');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Todas as páginas, módulos e funções liberadas mesmo no período de teste grátis
  const isFreePlan = false;
  const isTrialActive = plan === 'free';
  const limits = {
    birds: 999999,
    incubators: 999999
  };

  return { plan, loading, isFreePlan, limits, isTrialExpired: false, isTrialActive, trialDaysLeft };
}
