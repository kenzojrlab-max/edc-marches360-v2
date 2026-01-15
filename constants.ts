export const FONCTIONS = [
  "Exploitation et maintenance des ouvrages de régularisation et de production d'électricité",
  "Développement des projets",
  "EDC support"
];

export const JALONS_LABELS: Record<string, string> = {
  saisine_prev: "Saisine prévisionnelle de la CIPM",
  saisine_cipm: "Saisine CIPM",
  examen_dao: "Examen DAO",
  validation_dossier: "Validation du dossier (PV)",
  ano_bailleur_dao: "ANO Bailleur",
  lancement_ao: "Lancement AO",
  additif: "Additif (Document)",
  depouillement: "Dépouillement des Offres",
  validation_eval: "Validation rapport éval. admin & tech (PV)",
  ano_bailleur_eval: "ANO Bailleurs (Évaluation)",
  ouverture_financiere: "Ouverture des offres financières (PV)",
  infructueux: "Dossier Infructueux (Décision)",
  prop_attribution: "Proposition d'attribution par la CIPM",
  avis_conforme_ca: "Avis conforme CA",
  ano_bailleur_attrib: "ANO Bailleur",
  publication: "Publication des résultats",
  notification_attrib: "Notification attribution",
  titulaire: "Titulaire du marché",
  montant_ttc_reel: "Montant TTC (FCFA)",
  souscription: "Souscription du projet",
  saisine_cipm_projet: "Saisine CIPM",
  examen_projet: "Examen projet",
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
  'avis_conforme_ca', 
  'ano_bailleur_attrib', 
  'publication', 
  'souscription', 
  'saisine_cipm_projet', 
  'examen_projet', 
  'ano_bailleur_projet', 
  'signature_marche'
];

export const JALONS_PPM_CONFIG = JALONS_PPM_KEYS.map(key => ({
  key,
  label: JALONS_LABELS[key] || key
}));

export const JALONS_GROUPS = [
  {
    id: 'preparation',
    label: 'I. Préparation & Lancement',
    keys: ['dao_doc', 'adf_doc', 'saisine_prev', 'saisine_cipm', 'examen_dao', 'validation_dossier', 'ano_bailleur_dao', 'lancement_ao']
  },
  {
    id: 'consultation',
    label: 'II. Consultation & Évaluation',
    keys: ['additif', 'depouillement', 'validation_eval', 'ano_bailleur_eval', 'ouverture_financiere']
  },
  {
    id: 'attribution',
    label: 'III. Attribution & Notification',
    keys: ['infructueux', 'prop_attribution', 'avis_conforme_ca', 'ano_bailleur_attrib', 'publication', 'notification_attrib', 'titulaire', 'montant_ttc_reel']
  },
  {
    id: 'contractualisation',
    label: 'IV. Contractualisation',
    keys: ['souscription', 'saisine_cipm_projet', 'examen_projet', 'validation_projet', 'ano_bailleur_projet', 'signature_marche']
  },
  {
    id: 'cloture',
    label: 'V. Clôture & Notification',
    keys: ['annule', 'notification', 'recours']
  }
];

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