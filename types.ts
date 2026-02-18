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
  INFRUCTUEUX = 'INFRUCTUEUX',
  SUSPENDU = 'SUSPENDU'
}

export enum RecoursType {
  AVANT_OUVERTURE = 'AVANT_OUVERTURE',
  DURANT_OUVERTURE = 'DURANT_OUVERTURE',
  APRES_ATTRIBUTION = 'APRES_ATTRIBUTION'
}

export enum RecoursStatut {
  EN_COURS_EXAMEN = 'EN_COURS_EXAMEN',
  SUSPENDU = 'SUSPENDU',
  CLOTURE_REJETE = 'CLOTURE_REJETE',
  CLOTURE_ACCEPTE = 'CLOTURE_ACCEPTE'
}

export interface RecoursData {
  type: RecoursType;
  statut: RecoursStatut;
  date_introduction: string;
  current_step: number;
  // Type A
  date_reponse_dg?: string;
  is_satisfait_dg?: boolean;
  date_escalation_ca?: string;
  // Types B & C
  date_avis_comite?: string;
  date_decision_ca?: string;
  // Clôture
  verdict?: string;
  date_cloture?: string;
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

// --- V1 : INCHANGÉ ---
export interface Decompte {
  id: string;
  numero: string;
  objet: string;
  montant: number;
  date_validation: string;
  doc_id?: string;
  doc_attachement_id?: string;
  doc_ov_id?: string;
}

// --- V1 : INCHANGÉ ---
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

// ============================================================
// V2 : NOUVELLES INTERFACES
// ============================================================

// --- BORDEREAU : Suivi Mensuel ---
// 1 mois = 1 PeriodeMensuelle avec tout dedans
export interface PeriodeMensuelle {
  id: string;
  label: string;                       // "Janvier 2025"
  date_debut: string;
  date_fin: string;
  ordre: number;                       // 1, 2, 3... pour le tri

  // Attachement & Décompte
  doc_attachement_id?: string;
  numero_decompte?: string;            // "DC N°001"
  montant_decompte: number;
  date_decompte?: string;

  // Rapport MOE
  doc_rapport_moe_id?: string;
  observations?: string;
  aleas_techniques?: string;

  // OS du mois
  doc_os_periode_id?: string;

  // Réclamation
  has_reclamation: boolean;
  objet_reclamation?: string;
  doc_reclamation_id?: string;
  doc_reponse_reclamation_id?: string;

  // Facturation & Paiement
  doc_facture_id?: string;
  numero_facture?: string;
  montant_facture?: number;
  doc_ov_id?: string;
  statut_paiement: 'EN_ATTENTE' | 'FACTURE' | 'PAYE';
  date_paiement?: string;
}

// --- FORFAIT : Suivi par Livrable ---
export interface Livrable {
  id: string;
  libelle: string;                     // "Rapport Phase 1"
  date_limite: string;
  statut: 'A_FAIRE' | 'SOUMIS' | 'VALIDE' | 'REJETE';
  montant_prevu: number;

  doc_rapport_id?: string;
  doc_pv_csrt_id?: string;
  doc_facture_id?: string;
  doc_ov_id?: string;

  doc_os_id?: string;
  has_reclamation?: boolean;
  doc_reclamation_id?: string;
  doc_reponse_reclamation_id?: string;

  validation_date?: string;
  statut_paiement?: 'EN_ATTENTE' | 'FACTURE' | 'PAYE';
  date_paiement?: string;
}

// --- FOURNITURE : Suivi par Bon de Livraison ---
export interface BonLivraison {
  id: string;
  numero: string;                      // "BL N°001"
  designation: string;
  quantite: number;
  montant: number;
  date_livraison: string;

  doc_bl_id?: string;
  doc_pv_reception_id?: string;
  doc_facture_id?: string;
  doc_ov_id?: string;

  statut: 'EN_ATTENTE' | 'LIVRE' | 'RECEPTIONNEE' | 'PAYE';
}

// ============================================================

export interface ExecutionData {
  // ===== V1 EXISTANT (INCHANGÉ) =====
  ref_contrat?: string;
  delai_mois?: number;
  type_retenue_garantie?: 'Retenue 10%' | 'Caution Bancaire';
  doc_caution_bancaire_id?: string;
  doc_notif_contrat_id?: string;
  doc_notif_os_id?: string;
  date_notif_os?: string; // AJOUT : Date de l'OS de démarrage
  doc_os_demarrage_id?: string;
  doc_caution_def_id?: string;
  doc_assurance_id?: string;
  doc_enreg_impots_id?: string;
  doc_contrat_enreg_id?: string;
  doc_rapport_exec_id?: string;
  doc_pv_provisoire_id?: string;
  date_pv_provisoire?: string; // AJOUT : Date du PV de réception provisoire
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

  // ===== V2 AJOUTS =====
  type_contrat?: 'BORDEREAU' | 'FORFAIT' | 'FOURNITURE';

  moa_chef_service?: string;
  moa_ingenieur?: string;
  moe_type?: 'PUBLIC' | 'PRIVE';
  moe_prive_nom?: string;
  moe_prive_montant?: number;
  moe_prive_delai?: string;
  moe_prive_ref?: string;
  moe_prive_rccm?: string;

  has_avance_demarrage?: boolean;
  doc_caution_avance_id?: string;
  doc_facture_avance_id?: string;

  doc_dossier_exec_id?: string;

  // 5. Tiroirs V2 (selon type_contrat)
  periodes?: PeriodeMensuelle[];     // BORDEREAU
  livrables?: Livrable[];            // FORFAIT
  bons_livraison?: BonLivraison[];   // FOURNITURE

  // 6. Pénalités
  montant_penalites?: number;
}

export type TypeOuverture = '1_temps' | '2_temps';

export interface MarcheDates {
  saisine_cipm?: string;
  validation_dossier?: string;
  ano_bailleur_dao?: string;
  lancement_ao?: string;
  additif?: string;
  date_initiale_depouillement?: string;
  depouillement?: string;
  validation_eval?: string;
  ano_bailleur_eval?: string;
  ouverture_financiere?: string;
  validation_rapport_consolide?: string;
  ano_bailleur_consolide?: string;
  depouillement_1t?: string;
  validation_rapport_1t?: string;
  ano_bailleur_1t?: string;
  infructueux?: string;
  prop_attribution?: string;
  negociation_contractuelle?: string;
  avis_conforme_ca?: string;
  ano_bailleur_attrib?: string;
  publication?: string;
  notification_attrib?: string;
  souscription?: string;
  saisine_cipm_projet?: string;
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
  delai_contractuel?: string;
  imputation_budgetaire: string;
  source_financement: SourceFinancement;
  nom_bailleur?: string;
  dates_prevues: MarcheDates;
  dates_realisees: MarcheDates;
  comments: Record<string, string>;
  docs: Record<string, string | string[] | undefined>;
  statut_global: StatutGlobal;
  is_infructueux: boolean;
  is_annule: boolean;
  has_additif: boolean;
  has_preselection: boolean;
  has_demande_eclaircissement: boolean;
  has_reponse_eclaircissement: boolean;
  type_ouverture: TypeOuverture;
  motif_annulation?: string;
  motif_infructueux?: string;
  has_recours: boolean;
  recours_issue?: string;
  recours?: RecoursData;
  titulaire?: string;
  execution: ExecutionData;
  is_hors_ppm?: boolean;
  alert_dismissed?: boolean;
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