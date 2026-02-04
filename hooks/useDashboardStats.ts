import { useMemo } from 'react';
import { Marche, Projet, StatutGlobal, SourceFinancement } from '../types';
import { JALONS_GROUPS } from '../constants';
import { calculateDaysBetween } from '../utils/date';

export const useDashboardStats = (filteredMarkets: Marche[], allMarkets: Marche[], projects: Projet[]) => {
  
  // Couleurs pour les graphiques
  const COLORS = {
    primary: '#005bb5', // Bleu EDC
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    slate: '#94a3b8'
  };

  // 1. Nombre de Marchés prévus au PPM
  const volumeStats = useMemo(() => {
    return {
      prevu: filteredMarkets.length,
      realise: filteredMarkets.filter(m => m.dates_realisees.lancement_ao).length
    };
  }, [filteredMarkets]);

  // 2. Volume total des marchés (Financier)
  const budgetStats = useMemo(() => {
    return filteredMarkets.reduce((acc, m) => {
      let montantSigne = 0;
      if (m.dates_realisees.signature_marche) {
        montantSigne = m.montant_ttc_reel || m.montant_prevu || 0;
      }

      return {
        prevu: acc.prevu + (m.montant_prevu || 0),
        realise: acc.realise + montantSigne
      };
    }, { prevu: 0, realise: 0 });
  }, [filteredMarkets]);

  // 3. Taux d’exécution du PPM
  const executionRateStats = useMemo(() => {
    const total = filteredMarkets.length;
    if (total === 0) return { prevu: 50, realise: 0 };
    
    const lances = filteredMarkets.filter(m => m.dates_realisees.lancement_ao).length;
    const rate = (lances / total) * 100;
    
    return {
      prevu: 50,
      realise: parseFloat(rate.toFixed(2))
    };
  }, [filteredMarkets]);

  // 4. Délais moyen de Passation (INTELLIGENT)
  const delayStats = useMemo(() => {
    // On prend les marchés signés (année de fin = sélectionnée via les filtres)
    const closedMarkets = filteredMarkets.filter(m => m.dates_realisees.signature_marche);
    
    if (closedMarkets.length === 0) return { prevu: 120, realise: 0 }; 

    // Liste des jalons "de début" possibles, par ordre de préférence (chronologique inverse)
    // On cherche le point de départ le plus ancien disponible si la Saisine CIPM manque
    const potentialStartKeys = [
      'saisine_cipm',      // Le standard
      'examen_dao',        // Fallback 1
      'validation_dossier',// Fallback 2
      'lancement_ao'       // Fallback 3 (au pire, on compte depuis le lancement)
    ];

    const totalDays = closedMarkets.reduce((acc, m) => {
        const dateFin = m.dates_realisees.signature_marche!;
        
        // Trouver la première date de début valide
        let dateDebut = '';
        for (const key of potentialStartKeys) {
          if (m.dates_realisees[key as keyof typeof m.dates_realisees]) {
            dateDebut = m.dates_realisees[key as keyof typeof m.dates_realisees] as string;
            break; // On a trouvé le point de départ le plus précis/ancien disponible
          }
        }

        if (dateDebut) {
          // calculateDaysBetween gère parfaitement les années différentes (ex: 2022 à 2023)
          return acc + calculateDaysBetween(dateDebut, dateFin);
        }
        
        return acc; // Si aucune date de début n'est trouvée, on ignore ce marché dans la somme
    }, 0);
    
    // On ne divise que par le nombre de marchés qui avaient des dates valides pour ne pas fausser la moyenne
    const validMarketsCount = closedMarkets.filter(m => 
      potentialStartKeys.some(key => m.dates_realisees[key as keyof typeof m.dates_realisees])
    ).length;

    return {
      prevu: 120,
      realise: validMarketsCount > 0 ? Math.round(totalDays / validMarketsCount) : 0
    };
  }, [filteredMarkets]);

  // 5. Nombre (et %) de recours enregistré
  const recoursStats = useMemo(() => {
    const count = filteredMarkets.filter(m => m.has_recours).length;
    const launchedCount = filteredMarkets.filter(m => m.dates_realisees.lancement_ao).length;
    const rate = launchedCount > 0 ? ((count / launchedCount) * 100).toFixed(1) : "0.0";
    
    return {
      prevu: 0,
      realise: count,
      rate: rate
    };
  }, [filteredMarkets]);

  // 6. Nombre de procédures infructueuses ou annulées
  const failureStats = useMemo(() => {
    const count = filteredMarkets.filter(m => m.is_infructueux || m.is_annule).length;
    return {
      prevu: 0,
      realise: count
    };
  }, [filteredMarkets]);

  // --- Indicateurs secondaires ---

  const funnelData = useMemo(() => {
    const counts = {
      planifies: filteredMarkets.length,
      lances: filteredMarkets.filter(m => m.dates_realisees.lancement_ao).length,
      attribues: filteredMarkets.filter(m => m.dates_realisees.notification_attrib).length,
      signes: filteredMarkets.filter(m => m.dates_realisees.signature_marche).length,
    };

    return [
      { name: 'Programmés', value: counts.planifies, fill: '#94a3b8' },
      { name: 'Lancés', value: counts.lances, fill: COLORS.primary },
      { name: 'Attribués', value: counts.attribues, fill: COLORS.warning },
      { name: 'Signés', value: counts.signes, fill: COLORS.success },
    ];
  }, [filteredMarkets]);

  const procedureData = useMemo(() => {
    const map = new Map<string, number>();
    filteredMarkets.forEach(m => {
      const type = (m.typeAO || 'Autre').toString();
      map.set(type, (map.get(type) || 0) + 1);
    });
    
    return Array.from(map.entries()).map(([name, value], index) => ({
      name,
      value,
      color: [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger][index % 4]
    }));
  }, [filteredMarkets]);

  const functionStats = useMemo(() => {
    const groups = new Map<string, any>();
    filteredMarkets.forEach(m => {
      const func = m.fonction || 'Non défini';
      if (!groups.has(func)) {
        groups.set(func, { name: func, planifies: 0, lances: 0, signes: 0, budgetPrevu: 0, budgetSigne: 0 });
      }
      const g = groups.get(func);
      g.planifies++;
      if (m.dates_realisees.lancement_ao) g.lances++;
      if (m.dates_realisees.signature_marche) g.signes++;
      g.budgetPrevu += m.montant_prevu;
      
      const montantSigne = (m.dates_realisees.signature_marche) ? (m.montant_ttc_reel || m.montant_prevu || 0) : 0;
      g.budgetSigne += montantSigne;
    });
    return Array.from(groups.values());
  }, [filteredMarkets]);

  const historicalData = useMemo(() => {
    const yearsMap = new Map<number, any>();
    allMarkets.forEach(m => {
        const p = projects.find(p => p.id === m.projet_id);
        if (!p) return;
        const year = p.exercice;
        if (!yearsMap.has(year)) {
            yearsMap.set(year, { year: year.toString(), total: 0, signes: 0, budgetEDC: 0, budgetBailleur: 0 });
        }
        const y = yearsMap.get(year);
        y.total++;
        if (m.dates_realisees.signature_marche) y.signes++;
        if (m.source_financement === SourceFinancement.BUDGET_EDC) y.budgetEDC += m.montant_prevu;
        else y.budgetBailleur += m.montant_prevu;
    });
    return Array.from(yearsMap.values())
        .sort((a, b) => parseInt(a.year) - parseInt(b.year))
        .map(d => ({
            ...d,
            tauxExecution: d.total ? Math.round((d.signes / d.total) * 100) : 0
        }));
  }, [allMarkets, projects]);

  // Nombre de marchés signés par exercice (pour courbe)
  const marchesSignesParExercice = useMemo(() => {
    const yearsMap = new Map<number, { year: string; signes: number }>();
    allMarkets.forEach(m => {
      const p = projects.find(p => p.id === m.projet_id);
      if (!p) return;
      const year = p.exercice;
      if (!yearsMap.has(year)) {
        yearsMap.set(year, { year: year.toString(), signes: 0 });
      }
      const y = yearsMap.get(year)!;
      if (m.dates_realisees.signature_marche) y.signes++;
    });
    return Array.from(yearsMap.values()).sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [allMarkets, projects]);

  // Taux d'exécution du PPM par exercice (pour courbe)
  const tauxExecutionParExercice = useMemo(() => {
    const yearsMap = new Map<number, { year: string; total: number; signes: number }>();
    allMarkets.forEach(m => {
      const p = projects.find(p => p.id === m.projet_id);
      if (!p) return;
      const year = p.exercice;
      if (!yearsMap.has(year)) {
        yearsMap.set(year, { year: year.toString(), total: 0, signes: 0 });
      }
      const y = yearsMap.get(year)!;
      y.total++;
      if (m.dates_realisees.signature_marche) y.signes++;
    });
    return Array.from(yearsMap.values())
      .sort((a, b) => parseInt(a.year) - parseInt(b.year))
      .map(d => ({
        year: d.year,
        tauxExecution: d.total > 0 ? Math.round((d.signes / d.total) * 100) : 0
      }));
  }, [allMarkets, projects]);

  // Exécution du PPM par fonction analytique (barres groupées)
  const executionPPMParFonction = useMemo(() => {
    const groups = new Map<string, { name: string; planifies: number; lances: number; signes: number }>();
    filteredMarkets.forEach(m => {
      const func = m.fonction || 'Non défini';
      if (!groups.has(func)) {
        groups.set(func, { name: func, planifies: 0, lances: 0, signes: 0 });
      }
      const g = groups.get(func)!;
      g.planifies++;
      if (m.dates_realisees.lancement_ao) g.lances++;
      if (m.dates_realisees.signature_marche) g.signes++;
    });
    return Array.from(groups.values());
  }, [filteredMarkets]);

  // Taux d'exécution budgétaire par fonction (Budget programmé vs exécuté)
  const tauxBudgetaireParFonction = useMemo(() => {
    const groups = new Map<string, { name: string; budgetProgramme: number; budgetExecute: number; tauxExecution: number }>();
    filteredMarkets.forEach(m => {
      const func = m.fonction || 'Non défini';
      if (!groups.has(func)) {
        groups.set(func, { name: func, budgetProgramme: 0, budgetExecute: 0, tauxExecution: 0 });
      }
      const g = groups.get(func)!;
      g.budgetProgramme += m.montant_prevu || 0;
      if (m.dates_realisees.signature_marche) {
        g.budgetExecute += m.montant_ttc_reel || m.montant_prevu || 0;
      }
    });
    return Array.from(groups.values()).map(g => ({
      ...g,
      tauxExecution: g.budgetProgramme > 0 ? Math.round((g.budgetExecute / g.budgetProgramme) * 100) : 0
    }));
  }, [filteredMarkets]);

  const totalAvenants = useMemo(() => {
    return filteredMarkets.reduce((acc, m) => acc + (m.execution?.avenants?.length || 0), 0);
  }, [filteredMarkets]);

  const ppmExecutionRate = useMemo(() => {
    if (filteredMarkets.length === 0) return "0.0";
    const signes = filteredMarkets.filter(m => m.dates_realisees.signature_marche).length;
    return ((signes / filteredMarkets.length) * 100).toFixed(1);
  }, [filteredMarkets]);

  const alertsList = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const jalonsKeys = JALONS_GROUPS.flatMap(g => g.keys);
    const marketsWithDelay = filteredMarkets.map(m => {
        if (m.is_annule || m.is_infructueux || m.execution?.is_resilie || m.dates_realisees.signature_marche) {
            return { market: m, maxDelay: 0 };
        }
        let maxDelay = 0;
        jalonsKeys.forEach(key => {
            const prevue = m.dates_prevues[key as keyof typeof m.dates_prevues];
            const realisee = m.dates_realisees[key as keyof typeof m.dates_realisees];
            if (prevue && !realisee && today > prevue) {
                const delay = calculateDaysBetween(prevue, today);
                if (delay > maxDelay) maxDelay = delay;
            }
        });
        return { market: m, maxDelay };
    });
    return marketsWithDelay
        .filter(item => item.maxDelay > 0)
        .sort((a, b) => b.maxDelay - a.maxDelay)
        .map(item => item.market);
  }, [filteredMarkets]);

  return {
    volumeStats,
    budgetStats,
    executionRateStats,
    delayStats,
    recoursStats,
    failureStats,
    funnelData,
    procedureData,
    functionStats,
    historicalData,
    totalAvenants,
    ppmExecutionRate,
    alertsList,
    marchesSignesParExercice,
    tauxExecutionParExercice,
    executionPPMParFonction,
    tauxBudgetaireParFonction,
    COLORS
  };
};