/**
 * Cloud Function pour l'IA Gemini
 * La clé API reste UNIQUEMENT côté serveur (jamais exposée au client)
 */
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Déclaration du secret Firebase (configuré via: firebase functions:secrets:set GEMINI_API_KEY)
const geminiApiKey = defineSecret("GEMINI_API_KEY");
const ALLOWED_AI_ROLES = new Set(["SUPER_ADMIN", "ADMIN", "USER", "GUEST"]);

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const adminDb = admin.firestore();

export const generateAIResponse = onCall({ cors: true, timeoutSeconds: 120, secrets: [geminiApiKey] }, async (request) => {

  // Sécurité : Vérifier que l'utilisateur est authentifié
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Vous devez être connecté pour utiliser l\'IA.');
  }

  // Sécurité renforcée : contrôle serveur du statut et du rôle réel utilisateur
  const userDoc = await adminDb.collection("users").doc(request.auth.uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'Profil utilisateur introuvable.');
  }

  const userData = userDoc.data();
  const userStatus = userData?.statut;
  const userRole = userData?.role as string | undefined;

  if (userStatus !== "actif") {
    throw new HttpsError('permission-denied', 'Compte inactif.');
  }

  if (!userRole || !ALLOWED_AI_ROLES.has(userRole)) {
    throw new HttpsError('permission-denied', 'Votre rôle ne permet pas l\'accès à l\'assistant IA.');
  }

  const apiKey = geminiApiKey.value();
  if (!apiKey) {
    logger.error("La clé API Gemini est manquante dans la configuration.");
    throw new HttpsError('internal', 'Erreur de configuration serveur (Clé API).');
  }

  const { prompt, mode } = request.data;

  if (!prompt) {
    throw new HttpsError('invalid-argument', 'Le prompt est vide.');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: mode === 'REPORT' ? 65536 : 4000, // 65K pour rapports exhaustifs, 4K pour chat
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
