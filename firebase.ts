import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// 1. Importe GoogleAuthProvider
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD6hWkbVJHfFHNIacroMLWPI6igc0htaNk",
  authDomain: "edc-marches360.firebaseapp.com",
  projectId: "edc-marches360",
  storageBucket: "edc-marches360.firebasestorage.app",
  messagingSenderId: "770570879132",
  appId: "1:770570879132:web:1fde4a813b4c3d2764ad59"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// 2. Initialise et exporte le fournisseur Google
export const googleProvider = new GoogleAuthProvider();