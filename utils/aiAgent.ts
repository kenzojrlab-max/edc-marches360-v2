import { getFunctions, httpsCallable } from "firebase/functions";
import { getApp } from "firebase/app";
import { Marche, Projet } from '../types';

// Firebase Functions initialisé à la demande (pas au chargement du module)
let _functions: ReturnType<typeof getFunctions> | null = null;
const getFirebaseFunctions = () => {
  if (!_functions) {
    _functions = getFunctions(getApp(), 'us-central1');
  }
  return _functions;
};

const MAX_ITEMS_CONTEXT = 200;
const MAX_HISTORY_MESSAGES = 10; // Derniers 10 messages pour le contexte conversationnel

const cleanText = (text: string | undefined, maxLength: number = 500): string => {
  if (!text) return "";
  return text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().substring(0, maxLength);
};

const getGreetingByTime = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 18) return "Bon après-midi";
  if (hour >= 18 || hour < 5) return "Bonsoir";
  return "Bonjour";
};

// Ne garder que les dates non-vides pour économiser l'espace
const formatDates = (dates: Record<string, string | undefined>): Record<string, string> => {
  const result: Record<string, string> = {};
  if (!dates) return result;
  Object.entries(dates).forEach(([key, value]) => {
    if (value) result[key] = value;
  });
  return result;
};

// Résumé complet des données d'exécution
const formatExecution = (exec: any): any => {
  if (!exec) return null;

  const summary: any = {};

  if (exec.type_contrat) summary.type_contrat = exec.type_contrat;
  if (exec.ref_contrat) summary.ref_contrat = exec.ref_contrat;
  if (exec.delai_mois) summary.delai_mois = exec.delai_mois;
  if (exec.type_retenue_garantie) summary.type_retenue_garantie = exec.type_retenue_garantie;
  if (exec.date_notif_os) summary.date_os_demarrage = exec.date_notif_os;
  if (exec.date_pv_provisoire) summary.date_pv_provisoire = exec.date_pv_provisoire;
  if (exec.date_pv_definitif) summary.date_pv_definitif = exec.date_pv_definitif;

  // MOA / MOE
  if (exec.moa_chef_service) summary.moa_chef_service = exec.moa_chef_service;
  if (exec.moa_ingenieur) summary.moa_ingenieur = exec.moa_ingenieur;
  if (exec.moe_type) {
    summary.moe_type = exec.moe_type;
    if (exec.moe_type === 'PRIVE') {
      summary.moe_prive = {
        nom: exec.moe_prive_nom,
        montant: exec.moe_prive_montant,
        delai: exec.moe_prive_delai,
        ref: exec.moe_prive_ref,
        rccm: exec.moe_prive_rccm
      };
    }
  }

  // Avance démarrage
  if (exec.has_avance_demarrage) summary.has_avance_demarrage = true;

  // Décomptes
  if (exec.decomptes?.length > 0) {
    summary.nb_decomptes = exec.decomptes.length;
    summary.montant_total_decomptes = exec.decomptes.reduce((s: number, d: any) => s + (d.montant || 0), 0);
    summary.decomptes = exec.decomptes.map((d: any) => ({
      numero: d.numero,
      objet: d.objet,
      montant: d.montant,
      date_validation: d.date_validation
    }));
  }

  // Avenants
  if (exec.has_avenant && exec.avenants?.length > 0) {
    summary.nb_avenants = exec.avenants.length;
    summary.montant_total_avenants = exec.avenants.reduce((s: number, a: any) => s + (a.montant_incidence || 0), 0);
    summary.avenants = exec.avenants.map((a: any) => ({
      ref: a.ref,
      objet: a.objet,
      montant_incidence: a.montant_incidence,
      delai_execution: a.delai_execution
    }));
  }

  // Résiliation
  if (exec.is_resilie) {
    summary.is_resilie = true;
    summary.etape_resiliation = exec.resiliation_step;
  }

  // Pénalités
  if (exec.montant_penalites) summary.montant_penalites = exec.montant_penalites;

  // Suivi BORDEREAU (périodes mensuelles)
  if (exec.periodes?.length > 0) {
    summary.nb_periodes = exec.periodes.length;
    summary.montant_total_periodes = exec.periodes.reduce((s: number, p: any) => s + (p.montant_decompte || 0), 0);
    summary.periodes = exec.periodes.map((p: any) => {
      const periode: any = {
        label: p.label,
        montant_decompte: p.montant_decompte,
        statut_paiement: p.statut_paiement
      };
      if (p.numero_decompte) periode.numero_decompte = p.numero_decompte;
      if (p.has_reclamation) periode.has_reclamation = true;
      if (p.objet_reclamation) periode.objet_reclamation = p.objet_reclamation;
      if (p.observations) periode.observations = p.observations;
      if (p.aleas_techniques) periode.aleas_techniques = p.aleas_techniques;
      if (p.date_paiement) periode.date_paiement = p.date_paiement;
      if (p.montant_facture) periode.montant_facture = p.montant_facture;
      return periode;
    });
  }

  // Suivi FORFAIT (livrables)
  if (exec.livrables?.length > 0) {
    summary.nb_livrables = exec.livrables.length;
    summary.livrables = exec.livrables.map((l: any) => {
      const livrable: any = {
        libelle: l.libelle,
        statut: l.statut,
        montant_prevu: l.montant_prevu,
        date_limite: l.date_limite
      };
      if (l.statut_paiement) livrable.statut_paiement = l.statut_paiement;
      if (l.validation_date) livrable.validation_date = l.validation_date;
      if (l.has_reclamation) livrable.has_reclamation = true;
      if (l.date_paiement) livrable.date_paiement = l.date_paiement;
      return livrable;
    });
  }

  // Suivi FOURNITURE (bons de livraison)
  if (exec.bons_livraison?.length > 0) {
    summary.nb_bons_livraison = exec.bons_livraison.length;
    summary.bons_livraison = exec.bons_livraison.map((b: any) => ({
      numero: b.numero,
      designation: b.designation,
      quantite: b.quantite,
      montant: b.montant,
      date_livraison: b.date_livraison,
      statut: b.statut
    }));
  }

  return Object.keys(summary).length > 0 ? summary : null;
};

const prepareDataContext = (markets: Marche[], projects: Projet[]) => {
  if (markets.length === 0) return "AUCUNE DONNÉE DISPONIBLE.";

  const sortedMarkets = [...markets].sort((a, b) =>
    new Date(b.date_creation || 0).getTime() - new Date(a.date_creation || 0).getTime()
  );

  const slicedMarkets = sortedMarkets.slice(0, MAX_ITEMS_CONTEXT);

  return slicedMarkets.map(m => {
    const proj = projects.find(p => p.id === m.projet_id);

    const marketData: any = {
      // Identification
      id: m.id,
      dossier: m.numDossier,
      objet: cleanText(m.objet),
      projet: proj?.libelle || "Non rattaché",
      exercice: proj?.exercice,

      // Classification
      type_ao: m.typeAO,
      type_prestation: m.typePrestation,
      type_ouverture: m.type_ouverture,
      fonction: m.fonction,
      activite: m.activite,

      // Financier
      montant_prevu: m.montant_prevu,
      montant_signe: m.montant_ttc_reel,
      source_financement: m.source_financement,
      nom_bailleur: m.nom_bailleur,
      imputation_budgetaire: m.imputation_budgetaire,
      delai_contractuel: m.delai_contractuel,

      // Statut et flags
      statut: m.statut_global,
      is_hors_ppm: m.is_hors_ppm || false,
      is_infructueux: m.is_infructueux,
      is_annule: m.is_annule,
      has_additif: m.has_additif,
      has_preselection: m.has_preselection,
      has_demande_eclaircissement: m.has_demande_eclaircissement,
      has_reponse_eclaircissement: m.has_reponse_eclaircissement,
      has_recours: m.has_recours,

      // Motifs
      motif_annulation: m.motif_annulation,
      motif_infructueux: m.motif_infructueux,
      recours_issue: m.recours_issue,

      // Recours détaillé
      recours: m.recours ? {
        type: m.recours.type,
        statut: m.recours.statut,
        date_introduction: m.recours.date_introduction,
        verdict: m.recours.verdict,
        date_cloture: m.recours.date_cloture
      } : undefined,

      // Titulaire
      titulaire: m.titulaire,

      // Toutes les dates prévues et réalisées
      dates_prevues: formatDates(m.dates_prevues as unknown as Record<string, string | undefined>),
      dates_realisees: formatDates(m.dates_realisees as unknown as Record<string, string | undefined>),

      // Tous les commentaires
      commentaires: m.comments && Object.keys(m.comments).length > 0 ? m.comments : undefined,

      // Exécution complète
      execution: formatExecution(m.execution),

      // Métadonnées
      cree_par: m.created_by,
      date_creation: m.date_creation
    };

    // Supprimer les valeurs null/undefined/false pour économiser l'espace
    Object.keys(marketData).forEach(key => {
      const val = marketData[key];
      if (val === null || val === undefined || val === "" || val === false) {
        delete marketData[key];
      }
      // Supprimer les objets vides
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length === 0) {
        delete marketData[key];
      }
    });

    return JSON.stringify(marketData);
  }).join("\n");
};

// Formater l'historique de conversation pour inclusion dans le prompt
const formatConversationHistory = (history: Array<{ role: string; content: string }>): string => {
  if (!history || history.length === 0) return "";
  const recentMessages = history.slice(-MAX_HISTORY_MESSAGES);
  return recentMessages.map(msg => {
    const role = msg.role === 'user' ? 'UTILISATEUR' : 'ZEN\'Ô';
    // Tronquer les messages longs dans l'historique pour économiser des tokens
    const content = msg.content.length > 500 ? msg.content.substring(0, 500) + "..." : msg.content;
    return `${role}: ${content}`;
  }).join("\n");
};

export const sendMessageToGemini = async (
  message: string,
  markets: Marche[],
  projects: Projet[],
  mode: 'CHAT' | 'REPORT' = 'CHAT',
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<string> => {

  const dataContext = prepareDataContext(markets, projects);

  const currentGreeting = getGreetingByTime();
  const currentHour = new Date().getHours();
  const timeOfDay = currentHour >= 5 && currentHour < 12
    ? "le matin"
    : currentHour >= 12 && currentHour < 18
    ? "l'après-midi"
    : "le soir";

  const isFirstMessage = conversationHistory.length === 0;
  const historyText = formatConversationHistory(conversationHistory);

  const chatSystemPrompt = `
    Tu es "Zen'ô", l'Assistant Virtuel de l'application EDC Marchés360, expert en analyse de données de marchés publics.

    CONTEXTE TEMPOREL :
    - Heure actuelle : ${currentHour}h
    - Moment de la journée : ${timeOfDay}
    - Salutation appropriée : "${currentGreeting}"

    RÈGLES D'IDENTIFICATION :
    ${isFirstMessage
      ? `- C'est la PREMIÈRE interaction. Commence par : "${currentGreeting}, je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360." puis réponds à la question.`
      : `- La conversation est DÉJÀ EN COURS. NE TE PRÉSENTE PAS à nouveau. NE DIS PAS "je suis Zen'ô". Réponds DIRECTEMENT à la question sans salutation ni présentation.`
    }

    TES RÈGLES D'OR (ZERO HALLUCINATION) :
    1. Tes réponses doivent être PRÉCISES et PROFESSIONNELLES.
    2. Base-toi UNIQUEMENT sur les données fournies ci-dessous. N'invente RIEN.
    3. Si l'utilisateur demande la situation ou le blocage d'un marché, cite le contenu du champ 'commentaires'.
    4. Si les données sont absentes, dis : "Cette information n'est pas disponible dans les données actuelles."
    5. Tu as accès à TOUTES les données des marchés : passation, suivi, exécution, financier, recours, etc.

    CHAMPS DISPONIBLES PAR MARCHÉ :
    - Identification : id, dossier, objet, projet, exercice
    - Classification : type_ao (AON/AOI/ASMI/Gré à Gré/Demande de Cotation), type_prestation (Travaux/Fournitures/Services/Prestations Intellectuelles), type_ouverture, fonction, activite
    - Financier : montant_prevu, montant_signe, source_financement, nom_bailleur, imputation_budgetaire, delai_contractuel
    - Statut : statut (PLANIFIE/EN_COURS/ATTRIBUE/SIGNE/CLOTURE/ANNULE/INFRUCTUEUX/SUSPENDU)
    - Flags importants : is_hors_ppm (true = marché inscrit manuellement, PAS importé avec le PPM), is_infructueux, is_annule, has_additif, has_preselection, has_recours
    - Motifs : motif_annulation, motif_infructueux, recours_issue
    - Recours détaillé : type, statut, date_introduction, verdict, date_cloture
    - Titulaire du marché
    - Dates prévues et réalisées : toutes les étapes de la passation
    - Commentaires : tous les commentaires par jalon
    - Exécution complète : type_contrat, ref_contrat, delai_mois, décomptes (détail), avenants (détail), résiliation, MOA/MOE, pénalités, périodes mensuelles, livrables, bons de livraison
    - Métadonnées : cree_par, date_creation

    ${historyText ? `HISTORIQUE DE LA CONVERSATION :\n${historyText}\n` : ''}

    DONNÉES COMPLÈTES (${markets.length} marchés) :
    ${dataContext}
  `;

  const reportSystemPrompt = `
    Tu es un Expert Senior en Passation des Marchés (EDC).

    MISSION : Rédiger un rapport de synthèse COMPLET et DÉTAILLÉ sur les marchés publics fournis.

    RÈGLES ABSOLUES :
    - NE JAMAIS INVENTER DE DONNÉES.
    - Utilise TOUTES les informations fournies dans les données ci-dessous.
    - Si la liste est vide, réponds UNIQUEMENT : "Aucune donnée trouvée pour ce périmètre."
    - Cite les numéros de dossiers, titulaires, montants exacts.
    - Tu as accès à TOUTES les données : passation, suivi, exécution, financier, recours.

    CHAMPS DISPONIBLES :
    - is_hors_ppm : true = marché inscrit manuellement (pas dans le PPM initial)
    - execution : contient type_contrat, décomptes, avenants, résiliation, MOA/MOE, périodes, livrables, bons de livraison
    - commentaires : observations et situations par jalon
    - Tous les détails de passation, financier et dates

    STRUCTURE OBLIGATOIRE DU RAPPORT :

    # I. SYNTHÈSE GÉNÉRALE
    (Vue d'ensemble : nombre total, montants globaux, répartition par statut et par type de prestation)
    (Distinguer les marchés PPM et hors-PPM avec is_hors_ppm)

    # II. TABLEAU RÉCAPITULATIF DES MARCHÉS
    | N° Dossier | Projet | Objet | Statut actuel | Montant Prévu | Montant Signé | Titulaire | Date Lancement | Date Signature |
    (Lister CHAQUE marché, aucune omission)

    # III. ANALYSE DE LA PASSATION
    (Analyse des délais entre étapes, respect des procédures, taux de réalisation)
    (Marchés infructueux ou annulés avec motifs)

    # IV. ÉTAT D'EXÉCUTION DES MARCHÉS SIGNÉS
    (Pour chaque marché signé : avancement, décomptes, avenants, résiliations éventuelles)

    # V. DIFFICULTÉS ET BLOCAGES IDENTIFIÉS
    (Basé sur les commentaires/situations actuelles - citer les problèmes concrets par marché)

    # VI. RECOMMANDATIONS
    (Propositions d'amélioration basées sur les données observées)

    NOMBRE DE MARCHÉS À ANALYSER : ${markets.length}

    DONNÉES COMPLÈTES À ANALYSER :
    ${dataContext}

    IMPORTANT : Tu DOIS produire un rapport COMPLET et EXHAUSTIF. Analyse TOUS les ${markets.length} marchés fournis sans exception. Ne te limite PAS. Continue jusqu'à avoir couvert CHAQUE section entièrement.
  `;

  const finalPrompt = mode === 'CHAT' ? chatSystemPrompt : reportSystemPrompt;
  const fullPrompt = `${finalPrompt}\n\nQUESTION UTILISATEUR : ${message}`;

  try {
    const callAI = httpsCallable<{ prompt: string; mode: string }, { response: string }>(getFirebaseFunctions(), 'generateAIResponse');
    const result = await callAI({ prompt: fullPrompt, mode });
    return result.data.response;

  } catch (error: any) {
    console.error("Erreur Cloud Function Gemini:", error);
    if (error.code === 'functions/unauthenticated') {
      return "Vous devez être connecté pour utiliser l'assistant IA.";
    }
    return "Désolé, Zen'ô rencontre une difficulté technique (API/Quota).";
  }
};

export { getGreetingByTime };
