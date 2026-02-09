export const FONCTIONS = [
  "Exploitation et maintenance des ouvrages de régularisation et de production d'électricité",
  "Développement des projets",
  "EDC support"
];

export const JALONS_LABELS: Record<string, string> = {
  saisine_cipm: "Saisine CIPM",
  examen_dao: "Examen DAO",
  validation_dossier: "Validation du dossier (PV)",
  ano_bailleur_dao: "ANO Bailleur",
  lancement_ao: "Lancement AO",
  additif: "Additif (Document)",
  // Ouverture 2 temps
  depouillement: "Dépouillement des Offres",
  validation_eval: "Validation rapport éval. admin & tech (PV)",
  ano_bailleur_eval: "ANO Bailleurs (Évaluation)",
  ouverture_financiere: "Ouverture des offres financières (PV)",
  rapport_consolide: "Rapport consolidé",
  validation_rapport_consolide: "Validation rapport consolidé",
  ano_bailleur_consolide: "ANO Bailleur (Rapport consolidé)",
  // Ouverture 1 temps
  depouillement_1t: "Dépouillement des Offres",
  validation_rapport_1t: "Validation rapport",
  ano_bailleur_1t: "ANO Bailleur",
  infructueux: "Dossier Infructueux (Décision)",
  prop_attribution: "Proposition d'attribution par la CIPM",
  negociation_contractuelle: "Négociation contractuelle",
  avis_conforme_ca: "Avis conforme CA",
  ano_bailleur_attrib: "ANO Bailleur",
  publication: "Publication des résultats",
  notification_attrib: "Notification attribution",
  titulaire: "Titulaire du marché",
  montant_ttc_reel: "Montant TTC (FCFA)",
  souscription: "Souscription du projet de marché",
  saisine_cipm_projet: "Saisine CIPM",
  validation_projet: "Validation projet (PV)",
  ano_bailleur_projet: "ANO Bailleur",
  signature_marche: "Signature marché",
  annule: "Annulation du dossier (Motif + Accord CA)",
  notification: "Notification finale",
  recours: "Recours (Verdict)",
  dao_doc: "DAO (Dossier d'Appel d'Offres)",
  adf_doc: "Attestation de Disponibilité des Fonds (ADF)"
};

export const JALONS_PPM_KEYS = [
  'saisine_cipm',
  'examen_dao',
  'ano_bailleur_dao',
  'lancement_ao',
  'depouillement',
  'prop_attribution',
  'negociation_contractuelle',
  'ano_bailleur_attrib',
  'avis_conforme_ca',
  'publication',
  'souscription',
  'saisine_cipm_projet',
  'ano_bailleur_projet',
  'signature_marche'
];

export const JALONS_PPM_CONFIG = JALONS_PPM_KEYS.map(key => ({
  key,
  label: JALONS_LABELS[key] || key
}));

// Clés pour ouverture en 2 temps (consultation & évaluation)
export const CONSULTATION_2_TEMPS_KEYS = [
  'additif', 'depouillement', 'validation_eval', 'ano_bailleur_eval',
  'ouverture_financiere', 'rapport_consolide', 'validation_rapport_consolide', 'ano_bailleur_consolide'
];

// Clés pour ouverture en 1 temps (consultation & évaluation)
export const CONSULTATION_1_TEMPS_KEYS = [
  'additif', 'depouillement_1t', 'validation_rapport_1t', 'ano_bailleur_1t'
];

export const JALONS_GROUPS = [
  {
    id: 'preparation',
    label: 'I. Préparation & Lancement',
    keys: ['dao_doc', 'adf_doc', 'saisine_cipm', 'examen_dao', 'validation_dossier', 'ano_bailleur_dao', 'lancement_ao']
  },
  {
    id: 'consultation',
    label: 'II. Consultation & Évaluation',
    // Les clés réelles seront déterminées dynamiquement selon type_ouverture
    keys: [...CONSULTATION_2_TEMPS_KEYS]
  },
  {
    id: 'attribution',
    label: 'III. Attribution & Notification',
    keys: ['prop_attribution', 'negociation_contractuelle', 'infructueux', 'ano_bailleur_attrib', 'avis_conforme_ca', 'publication', 'notification_attrib', 'titulaire', 'montant_ttc_reel']
  },
  {
    id: 'contractualisation',
    label: 'IV. Contractualisation',
    keys: ['souscription', 'saisine_cipm_projet', 'validation_projet', 'ano_bailleur_projet', 'signature_marche']
  },
  {
    id: 'cloture',
    label: 'V. Clôture & Notification',
    keys: ['annule', 'notification', 'recours']
  }
];

// Helper: retourne les groupes de jalons avec les clés consultation adaptées au type d'ouverture
export const getJalonsGroupsForMarket = (typeOuverture: '1_temps' | '2_temps' = '2_temps') => {
  return JALONS_GROUPS.map(group => {
    if (group.id === 'consultation') {
      return {
        ...group,
        keys: typeOuverture === '1_temps' ? CONSULTATION_1_TEMPS_KEYS : CONSULTATION_2_TEMPS_KEYS
      };
    }
    return group;
  });
};

// NOUVEAU : SYSTÈME DE Z-INDEX CENTRALISÉ (Pour référence)
export const LAYERS = {
  BASE: 0,
  CARD: 10,
  TABLE_FIXED: 20,
  TABLE_HEADER: 30,
  FILTER_BAR: 40,
  DROPDOWN: 50,
  SIDEBAR: 100,
  MODAL: 1000,
  TOAST: 9999
};