import { GoogleGenerativeAI } from "@google/generative-ai";
import { Marche, Projet } from '../types';

const ai = new GoogleGenerativeAI(process.env.API_KEY || "");

const prepareDataContext = (markets: Marche[], projects: Projet[]) => {
  if (markets.length === 0) return "AUCUNE DONNÉE DISPONIBLE DANS LE SYSTÈME POUR CE PÉRIMÈTRE.";
  
  const summary = markets.map(m => {
    const proj = projects.find(p => p.id === m.projet_id);
    const situation = m.comments?.['situation_globale'] || "Rien à signaler";

    return {
      dossier: m.numDossier,
      objet: m.objet,
      statut: m.statut_global,
      projet: proj?.libelle || 'N/A',
      budget: m.montant_prevu + " FCFA",
      montant_signe: (m.montant_ttc_reel || 0) + " FCFA",
      titulaire: m.titulaire || 'Non attribué',
      situation_actuelle: situation,
      dates: {
        lancement: m.dates_realisees.lancement_ao || "Non lancé",
        signature: m.dates_realisees.signature_marche || "Non signé",
      }
    };
  });
  return JSON.stringify(summary);
};

export const sendMessageToGemini = async (
  message: string,
  markets: Marche[], 
  projects: Projet[],
  mode: 'CHAT' | 'REPORT' = 'CHAT'
): Promise<string> => {
  const dataContext = prepareDataContext(markets, projects);
  // const currentYear = new Date().getFullYear(); // (Variable non utilisée, peut être commentée ou retirée)

  const chatSystemPrompt = `
    Tu es l'Assistant Virtuel "EDC Marchés360", expert en analyse de données de marchés publics.
    
    RÈGLES D'IDENTIFICATION STRICTES :
    - Au début de ta réponse (surtout si l'utilisateur te salue), tu DOIS impérativement dire : "bonjour je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360".
    - Ne jamais utiliser "Bonjour. Je suis l'Assistant Virtuel EDC Marchés360". Utilise uniquement le nom "Zen'ô".

    TES RÈGLES D'OR :
    1. Tes réponses doivent être COURTES, PRÉCISES et PROFESSIONNELLES.
    2. Base-toi UNIQUEMENT sur les données JSON fournies ci-dessous. N'invente rien.
    3. Si l'utilisateur demande la situation ou le blocage d'un marché, cite explicitement le contenu du champ 'situation_actuelle'.
    4. Si tu dois donner des montants, formate-les en FCFA.
    5. Si les données sont vides ou absentes pour une question, dis explicitement : "bonjour je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360. Actuellement, aucune donnée n'est disponible dans le système pour ce périmètre. Comment puis-je vous aider ?"

    DONNÉES : ${dataContext}
  `;

  const reportSystemPrompt = `
    Tu es un Expert Senior en Passation des Marchés à la Cellule des Marchés de l'EDC (Electricity Development Corporation).
    
    TA MISSION :
    Rédiger le "RAPPORT SUR LA PASSATION ET L’EXÉCUTION DES MARCHÉS".
    
    RÈGLES DE VÉRITÉ :
    - NE JAMAIS INVENTER DE DONNÉES. 
    - Si la liste des données ci-dessous est vide ou qu'aucun marché ne correspond, réponds simplement : "Aucune donnée n'a été trouvée pour ce périmètre (Année/Projet). Le rapport ne peut être généré."
    - Utilise UNIQUEMENT le champ 'situation_actuelle' pour expliquer les blocages.

    STRUCTURE OBLIGATOIRE (Markdown) :
    # I - SYNTHÈSE DES DONNÉES ANALYSÉES
    # II - PRINCIPALES RÉALISATIONS (Tableau Markdown)
    # III - PASSATION DES MARCHÉS (Analyse Délais/PPM)
    # IV - EXÉCUTION PAR FONCTION (Tableau Détails)
    # V - DIFFICULTÉS (Marchés infructueux/Avenants)
    # VI - PERSPECTIVES

    DONNÉES FILTRÉES FOURNIES : ${dataContext}
  `;

  const finalPrompt = mode === 'CHAT' ? chatSystemPrompt : reportSystemPrompt;

  try {
    // 1. Initialisation du modèle avec la configuration MODIFIÉE
    const model = ai.getGenerativeModel({ 
      model: 'gemini-2.5-flash', // <--- Modification effectuée ici
      generationConfig: {
        temperature: 0.1
      }
    });

    // 2. Génération du contenu
    const result = await model.generateContent(`${finalPrompt}\n\nDEMANDE UTILISATEUR : ${message}`);
    const response = await result.response;
    
    // 3. Récupération du texte (c'est une méthode)
    return response.text();

  } catch (error) {
    console.error("Erreur Gemini:", error); // Ajout d'un log pour aider au débogage
    return "Désolé, j'ai rencontré une difficulté technique.";
  }
};