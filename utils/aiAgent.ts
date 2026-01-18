import { GoogleGenerativeAI } from "@google/generative-ai";
import { Marche, Projet } from '../types';

// Configuration API SÉCURISÉE
// La clé n'est plus en clair, elle est injectée par Vite au build
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// Initialisation conditionnelle pour éviter les crashs si la clé manque
const ai = new GoogleGenerativeAI(API_KEY);

// Limite de sécurité pour ne pas exploser le contexte
const MAX_ITEMS_CONTEXT = 50;

const cleanText = (text: string | undefined, maxLength: number = 100): string => {
  if (!text) return "Non renseigné";
  const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.substring(0, maxLength) + "..." : clean;
};

// NOUVELLE FONCTION : Génère la salutation selon l'heure
const getGreetingByTime = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    return "Bonjour";
  } else if (hour >= 12 && hour < 18) {
    return "Bon après-midi";
  } else if (hour >= 18 && hour < 22) {
    return "Bonsoir";
  } else {
    return "Bonne nuit";
  }
};

const prepareDataContext = (markets: Marche[], projects: Projet[]) => {
  if (markets.length === 0) return "AUCUNE DONNÉE DISPONIBLE.";

  // Tri par date de création décroissante (plus récents en premier)
  const sortedMarkets = [...markets].sort((a, b) => 
    new Date(b.date_creation || 0).getTime() - new Date(a.date_creation || 0).getTime()
  );

  const slicedMarkets = sortedMarkets.slice(0, MAX_ITEMS_CONTEXT);

  return slicedMarkets.map(m => {
    const proj = projects.find(p => p.id === m.projet_id);
    const situation = m.comments?.['situation_globale'] || "Rien à signaler";
    
    // Format JSON stringifié comme dans l'ancien code pour la structure
    return JSON.stringify({
      dossier: m.numDossier,
      objet: cleanText(m.objet),
      statut: m.statut_global,
      projet: cleanText(proj?.libelle),
      budget: `${m.montant_prevu} FCFA`,
      montant_signe: `${m.montant_ttc_reel || 0} FCFA`,
      titulaire: cleanText(m.titulaire),
      situation_actuelle: situation,
      dates: {
        lancement: m.dates_realisees.lancement_ao || "Non lancé",
        signature: m.dates_realisees.signature_marche || "Non signé"
      }
    });
  }).join("\n");
};

export const sendMessageToGemini = async (
  message: string,
  markets: Marche[], 
  projects: Projet[],
  mode: 'CHAT' | 'REPORT' = 'CHAT'
): Promise<string> => {
  if (!API_KEY) {
    console.error("ERREUR CRITIQUE : La clé API Gemini (VITE_GEMINI_API_KEY) est manquante dans le fichier .env");
    return "⚠️ Erreur de configuration : Clé API manquante. Veuillez contacter l'administrateur.";
  }

  const dataContext = prepareDataContext(markets, projects);
  
  // CORRECTION : Récupération de l'heure actuelle pour la salutation
  const currentGreeting = getGreetingByTime();
  const currentHour = new Date().getHours();
  const timeOfDay = currentHour >= 5 && currentHour < 12 
    ? "le matin" 
    : currentHour >= 12 && currentHour < 18 
    ? "l'après-midi" 
    : currentHour >= 18 && currentHour < 22 
    ? "le soir" 
    : "la nuit";

  // PROMPTS STRICTS RESTAURÉS DEPUIS L'ANCIEN CODE
  const chatSystemPrompt = `
    Tu es l'Assistant Virtuel "EDC Marchés360", expert en analyse de données de marchés publics.
    
    CONTEXTE TEMPOREL :
    - Heure actuelle : ${currentHour}h
    - Moment de la journée : ${timeOfDay}
    - Salutation appropriée : "${currentGreeting}"
    
    RÈGLES D'IDENTIFICATION STRICTES :
    - Au début de ta réponse (surtout si l'utilisateur te salue), tu DOIS impérativement dire : "${currentGreeting}, je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360".
    - Utilise TOUJOURS "${currentGreeting}" au lieu de "bonjour" pour être poli selon l'heure.
    - Ne jamais utiliser "Bonjour. Je suis l'Assistant Virtuel...". Utilise uniquement le nom "Zen'ô".

    TES RÈGLES D'OR (ZERO HALLUCINATION) :
    1. Tes réponses doivent être COURTES, PRÉCISES et PROFESSIONNELLES.
    2. Base-toi UNIQUEMENT sur les données fournies ci-dessous. N'invente RIEN.
    3. Si l'utilisateur demande la situation ou le blocage d'un marché, cite explicitement le contenu du champ 'situation_actuelle'.
    4. Si les données sont vides ou absentes pour une question, dis explicitement : "Aucune donnée n'est disponible dans le système pour ce périmètre."

    DONNÉES DISPONIBLES : 
    ${dataContext}
  `;

  const reportSystemPrompt = `
    Tu es un Expert Senior en Passation des Marchés (EDC).
    
    MISSION : Rédiger un rapport de synthèse complet et détaillé sur les marchés publics fournis.
    
    RÈGLES DE VÉRITÉ ABSOLUES :
    - NE JAMAIS INVENTER DE DONNÉES.
    - Utilise TOUTES les informations fournies dans les données ci-dessous.
    - Si la liste des données est vide, réponds UNIQUEMENT : "Aucune donnée trouvée pour ce périmètre."
    - Utilise le champ 'situation_actuelle' pour expliquer les blocages et difficultés.
    - Cite les numéros de dossiers, les titulaires, les montants exacts.
    
    STRUCTURE OBLIGATOIRE DU RAPPORT :
    
    # I. SYNTHÈSE GÉNÉRALE
    (Vue d'ensemble : nombre total de marchés, montants globaux, répartition par statut)
    
    # II. TABLEAU RÉCAPITULATIF DES MARCHÉS
    Pour chaque marché, présente :
    - Numéro de dossier
    - Objet (description)
    - Statut actuel
    - Montant prévu vs Montant signé
    - Titulaire
    - Dates clés (lancement, signature)
    
    # III. ANALYSE DE LA PASSATION
    (Analyse des délais, respect des procédures, taux de réalisation)
    
    # IV. DIFFICULTÉS ET BLOCAGES IDENTIFIÉS
    (Basé sur le champ 'situation_actuelle' - cite les problèmes concrets pour chaque marché concerné)
    
    # V. RECOMMANDATIONS
    (Propositions d'amélioration basées sur les données observées)
    
    NOMBRE DE MARCHÉS À ANALYSER : ${markets.length}
    
    DONNÉES COMPLÈTES À ANALYSER :
    ${dataContext}
    
    IMPORTANT : Tu dois produire un rapport COMPLET et DÉTAILLÉ. Ne te limite pas. Analyse TOUS les marchés fournis.
  `;

  const finalPrompt = mode === 'CHAT' ? chatSystemPrompt : reportSystemPrompt;

  try {
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // Utilisation du modèle flash performant
      generationConfig: {
        temperature: 0.1, // Température très basse pour limiter les hallucinations
        maxOutputTokens: mode === 'REPORT' ? 4000 : 1000, // CORRECTION : Plus de tokens pour les rapports
      }
    });

    const result = await model.generateContent(`${finalPrompt}\n\nQUESTION UTILISATEUR : ${message}`);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Désolé, Zen'ô rencontre une difficulté technique (API/Quota).";
  }
};

// EXPORT de la fonction pour l'utiliser dans d'autres fichiers
export { getGreetingByTime };