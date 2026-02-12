import { Marche, RecoursType, RecoursStatut } from '../types';
import { calculateBusinessDays, calculateDaysBetween } from './date';

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
  daysRemaining?: number;
}

export const checkRecoursEligibility = (
  market: Marche,
  type: RecoursType
): EligibilityResult => {
  const today = new Date().toISOString().split('T')[0];

  switch (type) {
    case RecoursType.AVANT_OUVERTURE: {
      const openingDate = market.dates_prevues.depouillement || market.dates_prevues.depouillement_1t;
      if (!openingDate) return { eligible: false, reason: 'Date de dépouillement prévue non définie.' };
      const daysUntil = calculateDaysBetween(today, openingDate);
      if (daysUntil <= 7) {
        return { eligible: false, reason: `Délai expiré : il reste ${daysUntil} jour(s) avant l'ouverture (minimum 7 requis).` };
      }
      return { eligible: true, daysRemaining: daysUntil - 7 };
    }

    case RecoursType.DURANT_OUVERTURE: {
      const openingActual = market.dates_realisees.depouillement || market.dates_realisees.depouillement_1t;
      if (!openingActual) return { eligible: false, reason: 'Date de dépouillement réalisée non définie.' };
      const bizDaysSince = calculateBusinessDays(openingActual, today);
      if (bizDaysSince > 3) {
        return { eligible: false, reason: `Délai expiré : ${bizDaysSince} jour(s) ouvrable(s) écoulés depuis l'ouverture (maximum 3).` };
      }
      return { eligible: true, daysRemaining: 3 - bizDaysSince };
    }

    case RecoursType.APRES_ATTRIBUTION: {
      const publicationDate = market.dates_realisees.publication;
      if (!publicationDate) return { eligible: false, reason: 'Date de publication des résultats non définie.' };
      const bizDaysSince = calculateBusinessDays(publicationDate, today);
      if (bizDaysSince > 5) {
        return { eligible: false, reason: `Délai expiré : ${bizDaysSince} jour(s) ouvrable(s) écoulés depuis la publication (maximum 5).` };
      }
      return { eligible: true, daysRemaining: 5 - bizDaysSince };
    }
  }
};

export const getRecoursTypeLabel = (type?: RecoursType): string => {
  switch (type) {
    case RecoursType.AVANT_OUVERTURE: return 'Avant l\'ouverture des plis';
    case RecoursType.DURANT_OUVERTURE: return 'Durant l\'ouverture des plis';
    case RecoursType.APRES_ATTRIBUTION: return 'Après l\'attribution (Résultats)';
    default: return 'Non défini';
  }
};

export const getRecoursTypeShortLabel = (type?: RecoursType): string => {
  switch (type) {
    case RecoursType.AVANT_OUVERTURE: return 'Type A';
    case RecoursType.DURANT_OUVERTURE: return 'Type B';
    case RecoursType.APRES_ATTRIBUTION: return 'Type C';
    default: return '-';
  }
};

export const getRecoursStatusLabel = (statut?: RecoursStatut): string => {
  switch (statut) {
    case RecoursStatut.EN_COURS_EXAMEN: return 'En cours d\'examen';
    case RecoursStatut.SUSPENDU: return 'Suspendu';
    case RecoursStatut.CLOTURE_REJETE: return 'Clôturé - Rejeté';
    case RecoursStatut.CLOTURE_ACCEPTE: return 'Clôturé - Accepté';
    default: return 'Inconnu';
  }
};

export const getRecoursStatusColor = (statut?: RecoursStatut): string => {
  switch (statut) {
    case RecoursStatut.EN_COURS_EXAMEN: return 'bg-blue-500/10 text-blue-400';
    case RecoursStatut.SUSPENDU: return 'bg-red-500/10 text-red-400';
    case RecoursStatut.CLOTURE_REJETE: return 'bg-green-500/10 text-green-400';
    case RecoursStatut.CLOTURE_ACCEPTE: return 'bg-orange-500/10 text-orange-400';
    default: return 'bg-slate-500/10 text-slate-400';
  }
};

export const isSuspensif = (type?: RecoursType): boolean => {
  return type === RecoursType.APRES_ATTRIBUTION;
};
