/**
 * Importation des modules nécessaires
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";

// 1. Initialisation de Gemini avec la clé API
// IMPORTANT : La clé sera stockée dans les variables d'environnement
const API_KEY = process.env.GEMINI_API_KEY;

// 2. Définition de la fonction 'generateAIResponse'
// cors: true permet à ton site React d'appeler cette fonction sans être bloqué
export const generateAIResponse = onCall({ cors: true, timeoutSeconds: 60 }, async (request) => {
  
  // Vérification de sécurité de base
  if (!API_KEY) {
    logger.error("La clé API Gemini est manquante dans la configuration.");
    throw new HttpsError('internal', 'Erreur de configuration serveur (Clé API).');
  }

  // Récupération du prompt envoyé par ton application React
  const { prompt } = request.data;

  if (!prompt) {
    throw new HttpsError('invalid-argument', 'Le prompt est vide.');
  }

  try {
    // Connexion à Gemini
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // On utilise le modèle flash (rapide et efficace)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Génération de la réponse
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info("Réponse IA générée avec succès");

    // On renvoie le texte à ton application React
    return { response: text };

  } catch (error: any) {
    logger.error("Erreur lors de l'appel à Gemini", error);
    throw new HttpsError('internal', 'Erreur lors de la génération de la réponse IA.', error.message);
  }
});