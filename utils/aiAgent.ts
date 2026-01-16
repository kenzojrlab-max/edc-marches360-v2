import { GoogleGenerativeAI } from "@google/generative-ai";
import { Marche, Projet } from '../types';

// Configuration API
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenerativeAI(API_KEY);

// Limite de sécurité pour ne pas exploser le contexte
const MAX_ITEMS_CONTEXT = 50;

const cleanText = (text: string | undefined, maxLength: number = 100): string => {
  if (!text) return "Non renseigné";
  const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.substring(0, maxLength) + "..." : clean;
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
    return "⚠️ Erreur de configuration : Clé API manquante.";
  }

  const dataContext = prepareDataContext(markets, projects);

  // PROMPTS STRICTS RESTAURÉS DEPUIS L'ANCIEN CODE
  const chatSystemPrompt = `
    Tu es l'Assistant Virtuel "EDC Marchés360", expert en analyse de données de marchés publics.
    
    RÈGLES D'IDENTIFICATION STRICTES :
    - Au début de ta réponse (surtout si l'utilisateur te salue), tu DOIS impérativement dire : "bonjour je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360".
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
    
    MISSION : Rédiger une synthèse (Rapport).
    
    RÈGLES DE VÉRITÉ :
    - NE JAMAIS INVENTER DE DONNÉES.
    - Si la liste des données est vide, réponds simplement : "Aucune donnée trouvée pour ce périmètre."
    - Utilise UNIQUEMENT le champ 'situation_actuelle' pour expliquer les blocages.
    
    STRUCTURE OBLIGATOIRE :
    # I. SYNTHÈSE
    # II. RÉALISATIONS CLÉS (Tableau)
    # III. ANALYSE PASSATION
    # IV. DIFFICULTÉS & BLOCAGES (Basé sur situation_actuelle)

    DONNÉES FILTRÉES :
    ${dataContext}
  `;

  const finalPrompt = mode === 'CHAT' ? chatSystemPrompt : reportSystemPrompt;

  try {
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // Utilisation du modèle flash performant
      generationConfig: {
        temperature: 0.1, // Température très basse pour limiter les hallucinations
        maxOutputTokens: 1000,
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