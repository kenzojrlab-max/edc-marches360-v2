import { GoogleGenerativeAI } from "@google/generative-ai";
import { Marche, Projet } from '../types';

// CORRECTION SÉCURITÉ & CONFIGURATION
// Utilisation de import.meta.env pour Vite (Standard moderne)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = new GoogleGenerativeAI(API_KEY);

// Limite de sécurité pour ne pas exploser le contexte de l'IA
const MAX_ITEMS_CONTEXT = 50;

// Helper pour nettoyer et tronquer les textes longs (économie de tokens)
const cleanText = (text: string | undefined, maxLength: number = 100): string => {
  if (!text) return "Non renseigné";
  const clean = text.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  return clean.length > maxLength ? clean.substring(0, maxLength) + "..." : clean;
};

const prepareDataContext = (markets: Marche[], projects: Projet[]) => {
  if (markets.length === 0) return "AUCUNE DONNÉE DISPONIBLE.";

  // 1. TRI & FILTRAGE DRASTIQUE
  // On prend les marchés les plus récents en premier pour la pertinence
  const sortedMarkets = [...markets].sort((a, b) => 
    new Date(b.date_creation || 0).getTime() - new Date(a.date_creation || 0).getTime()
  );

  // On coupe pour ne garder que les X derniers éléments (Protection Token Limit)
  const slicedMarkets = sortedMarkets.slice(0, MAX_ITEMS_CONTEXT);

  // 2. FORMATAGE COMPACT (TEXTE PLUTÔT QUE JSON)
  // Le JSON consomme trop de tokens avec les répétitions de clés {"key":...}
  // On utilise un format fiche texte plus dense.
  return slicedMarkets.map(m => {
    const proj = projects.find(p => p.id === m.projet_id);
    const situation = m.comments?.['situation_globale'] || "Rien à signaler";
    
    // Format optimisé pour l'IA
    return `
---
DOSSIER: ${m.numDossier}
OBJET: ${cleanText(m.objet)}
STATUT: ${m.statut_global}
PROJET: ${cleanText(proj?.libelle)}
BUDGET: ${m.montant_prevu} FCFA
SIGNÉ: ${m.montant_ttc_reel || 0} FCFA
TITULAIRE: ${cleanText(m.titulaire)}
SITUATION: ${cleanText(situation, 200)}
DATES: Lancement ${m.dates_realisees.lancement_ao || '?'} | Signature ${m.dates_realisees.signature_marche || '?'}
`.trim();
  }).join("\n");
};

export const sendMessageToGemini = async (
  message: string,
  markets: Marche[], 
  projects: Projet[],
  mode: 'CHAT' | 'REPORT' = 'CHAT'
): Promise<string> => {
  // Sécurité : Vérifier si la clé est présente
  if (!API_KEY) {
    return "⚠️ Erreur de configuration : La clé API Gemini (VITE_GEMINI_API_KEY) est manquante dans le fichier .env";
  }

  // Préparation optimisée des données
  const dataContext = prepareDataContext(markets, projects);

  const chatSystemPrompt = `
    Tu es l'Assistant Virtuel "EDC Marchés360".
    
    RÈGLES STRICTES :
    1. Commence toujours par : "bonjour je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360".
    2. Tes réponses doivent être COURTES et SYNTHÉTIQUES.
    3. Base-toi UNIQUEMENT sur les données ci-dessous. Si l'info n'y est pas, dis-le.
    4. Utilise le champ 'SITUATION' pour expliquer les blocages.

    LISTE DES MARCHÉS (50 plus récents) :
    ${dataContext}
  `;

  const reportSystemPrompt = `
    Tu es un Expert Senior en Passation des Marchés (EDC).
    
    MISSION : Rédiger une synthèse des marchés fournis.
    
    RÈGLES :
    - NE RIEN INVENTER. Utilise strictement les données fournies.
    - Si aucune donnée pertinente, dis-le.
    
    STRUCTURE :
    # I. SYNTHÈSE
    # II. RÉALISATIONS CLÉS (Tableau)
    # III. ANALYSE PASSATION
    # IV. DIFFICULTÉS (Basé sur le champ SITUATION)

    DONNÉES FILTRÉES :
    ${dataContext}
  `;

  const finalPrompt = mode === 'CHAT' ? chatSystemPrompt : reportSystemPrompt;

  try {
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.1, // Très bas pour éviter les hallucinations
        maxOutputTokens: 1000, // Limite la réponse pour la vitesse
      }
    });

    const result = await model.generateContent(`${finalPrompt}\n\nQUESTION UTILISATEUR : ${message}`);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Erreur Gemini:", error);
    return "Désolé, une erreur technique est survenue lors de l'analyse des données (Erreur API ou Quota).";
  }
};