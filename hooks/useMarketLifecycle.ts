import { useMemo } from 'react';
import { Marche, Projet } from '../types';

/**
 * Hook pour gérer le cycle de vie des marchés
 * - Marché signé : a une date de signature
 * - Marché vivant : signé mais non clôturé (pas de réception définitive ni résiliation)
 * - Marché clôturé : a une réception définitive ou est résilié
 */
export const useMarketLifecycle = (markets: Marche[], projects: Projet[]) => {

  /**
   * Vérifie si un marché est signé (a une date de signature réalisée)
   */
  const isSigned = (m: Marche): boolean => {
    return !!m.dates_realisees?.signature_marche;
  };

  /**
   * Vérifie si un marché est clôturé (réception définitive ou résilié)
   */
  const isClosed = (m: Marche): boolean => {
    return !!m.execution?.date_pv_definitif ||
           !!m.execution?.doc_pv_definitif_id ||
           !!m.execution?.is_resilie;
  };

  /**
   * Vérifie si un marché est "vivant" (signé mais non clôturé)
   */
  const isAlive = (m: Marche): boolean => {
    return isSigned(m) && !isClosed(m) && !m.is_annule;
  };

  /**
   * Vérifie si un marché est en phase de passation (non signé, non annulé, non infructueux)
   */
  const isInPassation = (m: Marche): boolean => {
    return !isSigned(m) && !m.is_annule && !m.is_infructueux;
  };

  /**
   * Récupère l'année d'origine du PPM d'un marché
   */
  const getOriginYear = (m: Marche): number | null => {
    const project = projects.find(p => p.id === m.projet_id);
    return project?.exercice ?? null;
  };

  /**
   * Marchés pour le Suivi Plan de Passation (non signés)
   */
  const passationMarkets = useMemo(() => {
    return markets.filter(m => isInPassation(m));
  }, [markets]);

  /**
   * Marchés pour le Suivi Exécution (signés et vivants)
   * Pour une année N sélectionnée, on affiche :
   * - Les marchés signés du PPM de l'année N
   * - + Les marchés vivants (signés non clôturés) des PPM des années précédentes
   */
  const getExecutionMarkets = (selectedYear: string | null) => {
    return markets.filter(m => {
      // Doit être signé
      if (!isSigned(m)) return false;

      // Doit être non annulé
      if (m.is_annule) return false;

      // Si pas d'année sélectionnée, afficher tous les marchés vivants
      if (!selectedYear) {
        return isAlive(m);
      }

      const originYear = getOriginYear(m);
      const selectedYearNum = parseInt(selectedYear);

      // Marchés de l'année sélectionnée (signés)
      if (originYear === selectedYearNum) {
        return true;
      }

      // Marchés vivants des années précédentes
      if (originYear && originYear < selectedYearNum) {
        return isAlive(m);
      }

      return false;
    });
  };

  /**
   * Vérifie si un marché provient d'un PPM d'une année antérieure
   */
  const isFromPreviousYear = (m: Marche, selectedYear: string | null): boolean => {
    if (!selectedYear) return false;
    const originYear = getOriginYear(m);
    return originYear !== null && originYear < parseInt(selectedYear);
  };

  return {
    // Fonctions de vérification
    isSigned,
    isClosed,
    isAlive,
    isInPassation,
    getOriginYear,
    isFromPreviousYear,

    // Listes de marchés filtrées
    passationMarkets,
    getExecutionMarkets
  };
};
