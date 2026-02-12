import { useState, useEffect } from 'react';
import { Marche, RecoursType } from '../types';
import { getBusinessDaysRemaining, getCalendarDaysRemaining } from '../utils/date';

export interface TimerInfo {
  label: string;
  remaining: number;
  total: number;
  isExpired: boolean;
  deadlineDate: string;
  unit: string;
}

export const useRecoursTimer = (market: Marche): TimerInfo | null => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!market.has_recours || !market.recours) return null;
  const { recours } = market;

  // Recours déjà clôturé : pas de timer
  if (recours.date_cloture) return null;

  // Type A - Step 1 : 3 jours calendaires pour réponse DG
  if (recours.type === RecoursType.AVANT_OUVERTURE && recours.current_step === 1 && !recours.date_reponse_dg) {
    const info = getCalendarDaysRemaining(recours.date_introduction, 3);
    return { ...info, label: 'Réponse du Directeur Général', unit: 'jours calendaires' };
  }

  // Types B/C - Step 1 : 7 jours ouvrables pour avis Comité
  if (recours.type !== RecoursType.AVANT_OUVERTURE && recours.current_step === 1 && !recours.date_avis_comite) {
    const info = getBusinessDaysRemaining(recours.date_introduction, 7);
    return { ...info, label: 'Avis du Comité d\'Arbitrage', unit: 'jours ouvrables' };
  }

  // Types B/C - Step 2 : 15 jours calendaires total depuis introduction
  if (recours.type !== RecoursType.AVANT_OUVERTURE && recours.current_step === 2 && !recours.date_decision_ca) {
    const info = getCalendarDaysRemaining(recours.date_introduction, 15);
    return { ...info, label: 'Décision finale du CA', unit: 'jours calendaires' };
  }

  return null;
};
