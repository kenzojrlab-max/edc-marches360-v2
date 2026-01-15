// Fichier: src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// ⚠️ REMPLACE LES "..." PAR TES INFOS FIREBASE
// (Tu les trouves dans la Console Firebase > Paramètres du projet > Général > Vos applications)
const firebaseConfig = {
  apiKey: "AIzaSyD6hWkbVJHfFHNIacroMLWPI6igc0htaNk",
  authDomain: "edc-marches360.firebaseapp.com",
  projectId: "edc-marches360",
  storageBucket: "edc-marches360.firebasestorage.app",
  messagingSenderId: "770570879132",
  appId: "1:770570879132:web:1fde4a813b4c3d2764ad59"
};

// Initialisation
const app = initializeApp(firebaseConfig);

// Export des outils
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);