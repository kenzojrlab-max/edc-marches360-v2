import { Marche, SourceFinancement, RecoursStatut } from '../types';
import { JALONS_GROUPS, getJalonsGroupsForMarket } from '../constants';

export const useMarketLogic = () => {

  // Règle 1 : Vérifie si un jalon est techniquement applicable (ex: ANO impossible sur Budget EDC)
  const isJalonApplicable = (market: Marche, key: string): boolean => {
    const isEDC = market.source_financement === SourceFinancement.BUDGET_EDC;
    if (isEDC && key.includes('ano')) return false;
    return true;
  };

  // Règle 2 : Vérifie si un jalon est "actif" dans le cycle de vie (n'a pas été coupé par une annulation/infructuosité)
  const isJalonActive = (market: Marche, key: string): boolean => {
    const groups = getJalonsGroupsForMarket(market.type_ouverture || '2_temps');
    const allKeys = groups.flatMap(g => g.keys);
    const currentIdx = allKeys.indexOf(key);

    if (market.is_infructueux) {
      // Publication des résultats reste visible même si infructueux
      if (key === 'publication') return true;
      const stopIdx = allKeys.indexOf('infructueux');
      // On affiche jusqu'à l'étape "infructueux" incluse
      if (currentIdx > stopIdx) return false;
    }

    if (market.is_annule) {
      const stopIdx = allKeys.indexOf('annule');
      // On affiche jusqu'à l'étape "annule" incluse
      if (currentIdx > stopIdx) return false;
    }

    return true;
  };

  // Règle 3 : Vérifie si une phase entière est accessible (pour la navigation par onglets/scroll)
  const isPhaseAccessible = (market: Marche | null | undefined, phaseId: string): boolean => {
    if (!market) return true;
    const groups = JALONS_GROUPS;
    const activeIndex = groups.findIndex(g => g.id === phaseId);

    if (market.is_infructueux) {
      const stopIndex = groups.findIndex(g => g.keys.includes('infructueux'));
      return activeIndex <= stopIndex;
    }

    if (market.is_annule) {
      const stopIndex = groups.findIndex(g => g.keys.includes('annule'));
      return activeIndex <= stopIndex;
    }

    return true;
  };

  // Jalons bloqués quand le marché est suspendu (recours type C)
  const JALONS_BLOCKED_BY_SUSPENDU = [
    'notification_attrib', 'souscription', 'saisine_cipm_projet',
    'validation_projet', 'ano_bailleur_projet', 'signature_marche', 'notification'
  ];

  const isBlockedBySuspendu = (market: Marche, key: string): boolean => {
    return market.recours?.statut === RecoursStatut.SUSPENDU && JALONS_BLOCKED_BY_SUSPENDU.includes(key);
  };

  return { isJalonApplicable, isJalonActive, isPhaseAccessible, isBlockedBySuspendu };
};
