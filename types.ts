export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

export enum SourceFinancement {
  BUDGET_EDC = 'BUDGET_EDC',
  BAILLEUR = 'BAILLEUR'
}

export enum AOType {
  AON = 'AON',
  AOI = 'AOI',
  ASMI = 'ASMI',
  GG = 'Gré à Gré',
  DC = 'Demande de Cotation'
}

export enum MarketType {
  TRAVAUX = 'Travaux',
  FOURNITURES = 'Fournitures',
  SERVICES = 'Services',
  PRESTATIONS_INTELLECTUELLES = 'Prestations Intellectuelles'
}

export enum StatutGlobal {
  PLANIFIE = 'PLANIFIE',
  EN_COURS = 'EN_COURS',
  ATTRIBUE = 'ATTRIBUE',
  SIGNE = 'SIGNE',
  CLOTURE = 'CLOTURE',
  ANNULE = 'ANNULE',
  INFRUCTUEUX = 'INFRUCTUEUX'
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: UserRole;
  module: string;
  action: string;
  details: string;
}

export interface LibraryDocument {
  id: string;
  titre: string;
  categorie: string;
  description?: string;
  format: string;
  url: string;
  taille: string;
  date_upload: string;
  auteur: string;
  uploaded_by: string;
}

export interface PieceJointe {
  id: string;
  nom: string;
  url: string;
  size: number;
  type: string;
  date_upload: string;
}

export interface Decompte {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  date_validation: string;
  doc_id?: string;
}

export interface Avenant {
  id: string;
  ref: string;
  objet: string;
  montant_incidence: number;
  delai_execution?: string;
  doc_notification_id?: string;
  doc_os_id?: string;
  doc_enreg_id?: string;
}

export interface ExecutionData {
  ref_contrat?: string;
  delai_mois?: number;
  type_retenue_garantie?: 'Retenue 10%' | 'Caution Bancaire';
  doc_caution_bancaire_id?: string;
  doc_notif_contrat_id?: string;
  doc_notif_os_id?: string;
  doc_os_demarrage_id?: string;
  doc_caution_def_id?: string;
  doc_assurance_id?: string;
  doc_enreg_impots_id?: string;
  doc_contrat_enreg_id?: string;
  doc_rapport_exec_id?: string;
  doc_pv_provisoire_id?: string;
  doc_pv_definitif_id?: string;
  date_pv_definitif?: string;
  decomptes: Decompte[];
  avenants: Avenant[];
  has_avenant: boolean;
  is_resilie: boolean;
  resiliation_step: number;
  doc_mise_en_demeure_id?: string;
  doc_constat_carence_id?: string;
  doc_decision_resiliation_id?: string;
}

export interface MarcheDates {
  saisine_prev?: string;
  saisine_cipm?: string;
  examen_dao?: string;
  validation_dossier?: string;
  ano_bailleur_dao?: string;
  lancement_ao?: string;
  additif?: string;
  depouillement?: string;
  validation_eval?: string;
  ano_bailleur_eval?: string;
  ouverture_financiere?: string;
  prop_attribution?: string;
  avis_conforme_ca?: string;
  ano_bailleur_attrib?: string;
  publication?: string;
  notification_attrib?: string;
  souscription?: string;
  saisine_cipm_projet?: string;
  examen_projet?: string;
  validation_projet?: string;
  ano_bailleur_projet?: string;
  signature_marche?: string;
  notification?: string;
  recours?: string;
}

export interface Marche {
  id: string;
  projet_id: string;
  numDossier: string;
  objet: string;
  fonction: string;
  activite: string;
  typeAO: AOType | string;
  typePrestation: MarketType | string;
  montant_prevu: number;
  montant_ttc_reel?: number;
  imputation_budgetaire: string;
  source_financement: SourceFinancement;
  dates_prevues: MarcheDates;
  dates_realisees: MarcheDates;
  comments: Record<string, string>;
  docs: Record<string, string | undefined>;
  statut_global: StatutGlobal;
  is_infructueux: boolean;
  is_annule: boolean;
  has_additif: boolean;
  motif_annulation?: string;
  has_recours: boolean;
  recours_issue?: string;
  titulaire?: string;
  execution: ExecutionData;
  created_by: string;
  date_creation: string;
}

export interface Projet {
  id: string;
  libelle: string;
  sourceFinancement: SourceFinancement;
  nomBailleur?: string;
  exercice: number;
  created_at: string;
  ppm_doc_id?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  password?: string;
  fonction?: string;
  projets_autorises?: string[];
  statut: 'actif' | 'inactif';
  created_at: string;
  photoURL?: string; 
}