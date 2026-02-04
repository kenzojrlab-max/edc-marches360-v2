/**
 * Cloud Function pour l'IA Gemini
 * La clé API reste UNIQUEMENT côté serveur (jamais exposée au client)
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";

const API_KEY = process.env.GEMINI_API_KEY;

export const generateAIResponse = onCall({ cors: true, timeoutSeconds: 120 }, async (request) => {

  // Sécurité : Vérifier que l'utilisateur est authentifié
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté pour utiliser l\'IA.');
  }

  if (!API_KEY) {
    logger.error("La clé API Gemini est manquante dans la configuration.");
    throw new HttpsError('internal', 'Erreur de configuration serveur (Clé API).');
  }

  const { prompt, mode } = request.data;

  if (!prompt) {
    throw new HttpsError('invalid-argument', 'Le prompt est vide.');
  }

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: mode === 'REPORT' ? 4000 : 1000,
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.info(`Réponse IA générée (mode: ${mode || 'CHAT'}) pour ${request.auth.uid}`);

    return { response: text };

  } catch (error: any) {
    logger.error("Erreur lors de l'appel à Gemini", error);
    throw new HttpsError('internal', 'Erreur lors de la génération de la réponse IA.', error.message);
  }
});
