import { useMemo } from 'react';
import { Marche, Projet, SourceFinancement } from '../types';
import { calculateDaysBetween } from '../utils/date';

// Palette de couleurs partagée
export const COLORS = {
  primary: '#1e3a8a',
  accent: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  slate: '#64748b'
};

export const useDashboardStats = (
  filteredMarkets: Marche[], 
  allMarkets: Marche[], 
  projects: Projet[]
) => {

  // 1. KPI DÉLAIS
  const delayStats = useMemo(() => {
    const plannedMarkets = filteredMarkets.filter(m => m.dates_prevues.saisine_cipm && m.dates_prevues.signature_marche);
    const avgPlanned = plannedMarkets.length > 0 
      ? Math.round(plannedMarkets.reduce((acc, m) => acc + calculateDaysBetween(m.dates_prevues.saisine_cipm!, m.dates_prevues.signature_marche!), 0) / plannedMarkets.length)
      : 0;

    const realMarkets = filteredMarkets.filter(m => m.dates_realisees.saisine_cipm && m.dates_realisees.signature_marche);
    const avgReal = realMarkets.length > 0 
      ? Math.round(realMarkets.reduce((acc, m) => acc + calculateDaysBetween(m.dates_realisees.saisine_cipm!, m.dates_realisees.signature_marche!), 0) / realMarkets.length)
      : 0;

    return { planned: avgPlanned, real: avgReal };
  }, [filteredMarkets]);

  // 2. ENTONNOIR (FUNNEL)
  const funnelData = useMemo(() => {
    const planifies = filteredMarkets.length;
    const lances = filteredMarkets.filter(m => m.dates_realisees.lancement_ao).length;
    const attribues = filteredMarkets.filter(m => m.dates_realisees.notification_attrib || m.titulaire).length;
    const signes = filteredMarkets.filter(m => m.dates_realisees.signature_marche).length;
    return [
      { name: 'Planifiés', value: planifies, fill: '#94a3b8' },
      { name: 'Lancés', value: lances, fill: COLORS.accent },
      { name: 'Attribués', value: attribues, fill: COLORS.primary },
      { name: 'Signés', value: signes, fill: COLORS.success }
    ];
  }, [filteredMarkets]);

  // 3. STATS BUDGET
  const budgetStats = useMemo(() => {
    const prevu = filteredMarkets.reduce((acc, m) => acc + (m.montant_prevu || 0), 0);
    const signe = filteredMarkets.filter(m => m.dates_realisees.signature_marche)
                                 .reduce((acc, m) => acc + (m.montant_ttc_reel || m.montant_prevu || 0), 0);
    const rate = prevu > 0 ? (signe / prevu) * 100 : 0;
    return { prevu, signe, rate };
  }, [filteredMarkets]);

  // 4. STATS PROCÉDURES (PIE CHART)
  const procedureData = useMemo(() => {
    const lances = filteredMarkets.filter(m => m.dates_realisees.lancement_ao);
    const signes = lances.filter(m => m.dates_realisees.signature_marche).length;
    const echecs = lances.filter(m => m.is_infructueux || m.is_annule).length;
    const encours = Math.max(0, lances.length - signes - echecs);
    return [
      { name: 'Succès', value: signes, color: COLORS.success },
      { name: 'Échecs', value: echecs, color: COLORS.danger },
      { name: 'En cours', value: encours, color: COLORS.warning }
    ];
  }, [filteredMarkets]);

  // 5. STATS PAR FONCTION
  const functionStats = useMemo(() => {
    const activeFonctions = Array.from(new Set(filteredMarkets.map(m => m.fonction).filter(Boolean))) as string[];
    return activeFonctions.map(func => {
      const marketsInFunc = filteredMarkets.filter(m => m.fonction === func);
      let shortName = func.split(' ').slice(0, 2).join(' ') + '...';
      return {
        name: shortName,
        planifies: marketsInFunc.length,
        lances: marketsInFunc.filter(m => m.dates_realisees.lancement_ao).length,
        signes: marketsInFunc.filter(m => m.dates_realisees.signature_marche).length,
        budgetPrevu: marketsInFunc.reduce((acc, m) => acc + (m.montant_prevu || 0), 0),
        budgetSigne: marketsInFunc.filter(m => m.dates_realisees.signature_marche).reduce((acc, m) => acc + (m.montant_ttc_reel || m.montant_prevu || 0), 0)
      };
    });
  }, [filteredMarkets]);

  // 6. HISTORIQUE (BASÉ SUR TOUS LES MARCHÉS)
  const historicalData = useMemo(() => {
    const groups: Record<string, any> = {};
    projects.forEach(p => {
      const year = p.exercice.toString();
      if (!groups[year]) groups[year] = { year, planifies: 0, lances: 0, budgetEDC: 0, budgetBailleur: 0 };
      
      // On utilise allMarkets ici pour avoir l'historique complet
      const pMarkets = allMarkets.filter(m => m.projet_id === p.id);
      
      groups[year].planifies += pMarkets.length;
      groups[year].lances += pMarkets.filter(m => m.dates_realisees.lancement_ao).length;
      pMarkets.forEach(m => {
        if (m.source_financement === SourceFinancement.BUDGET_EDC) groups[year].budgetEDC += (m.montant_prevu || 0);
        else groups[year].budgetBailleur += (m.montant_prevu || 0);
      });
    });
    return Object.values(groups).sort((a, b) => a.year.localeCompare(b.year)).map(g => ({
      ...g,
      tauxExecution: g.planifies > 0 ? Math.round((g.lances / g.planifies) * 100) : 0
    }));
  }, [allMarkets, projects]);

  return {
    delayStats,
    funnelData,
    budgetStats,
    procedureData,
    functionStats,
    historicalData,
    COLORS
  };
};