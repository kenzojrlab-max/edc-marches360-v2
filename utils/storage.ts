import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db, storage as firebaseStorage } from "../firebase"; // Assure-toi que src/firebase.ts existe
import { Marche, User, PieceJointe } from "../types";

// Clés pour le stockage local (Données légères uniquement)
const STORAGE_KEYS = {
  MARKETS: 'edc_markets',
  USERS: 'edc_users',
  SESSION: 'edc_session'
};

export const storage = {
  // =================================================================
  // 1. GESTION DES FICHIERS (FIREBASE STORAGE + FIRESTORE 'documents')
  // =================================================================

  /**
   * Envoie un fichier sur Firebase Storage et enregistre ses métadonnées dans Firestore
   */
  uploadFile: async (file: File, folder: string = 'marches_docs'): Promise<PieceJointe> => {
    try {
      // A. Création d'une référence unique (ex: marches_docs/123456_mon_fichier.pdf)
      const uniqueId = crypto.randomUUID();
      const storageRef = ref(firebaseStorage, `${folder}/${uniqueId}_${file.name}`);

      // B. Envoi du fichier physique (Blob)
      const snapshot = await uploadBytes(storageRef, file);

      // C. Récupération de l'URL publique de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);

      // D. Création de l'objet métadonnées
      const newDoc: PieceJointe = {
        id: uniqueId,
        nom: file.name,
        type: file.type,
        size: file.size,
        url: downloadURL, // L'URL distante Firebase
        date_upload: new Date().toISOString()
      };

      // E. Sauvegarde de la fiche dans la collection Firestore "documents"
      // Cela remplace IndexedDB pour le suivi des fichiers
      await setDoc(doc(db, "documents", uniqueId), newDoc);

      return newDoc;
    } catch (error) {
      console.error("Erreur upload Firebase:", error);
      throw error;
    }
  },

  /**
   * Récupère les infos d'un document par son ID depuis Firestore
   */
  getDocById: async (id: string): Promise<PieceJointe | undefined> => {
    try {
      const docRef = doc(db, "documents", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as PieceJointe;
      } else {
        console.warn("Document introuvable dans Firestore:", id);
        return undefined;
      }
    } catch (error) {
      console.error("Erreur récupération doc:", error);
      return undefined;
    }
  },

  /**
   * Supprime un fichier du Storage ET sa fiche dans Firestore
   */
  deleteDoc: async (docId: string, fileUrl?: string): Promise<void> => {
    try {
      // 1. Supprimer la fiche Firestore
      await deleteDoc(doc(db, "documents", docId));

      // 2. Supprimer le fichier physique du Storage (si l'URL est fournie ou récupérée)
      // Note: Pour faire propre, il faudrait extraire le chemin depuis l'URL, 
      // mais pour l'instant on sécurise surtout la base de données.
      if (fileUrl) {
        const fileRef = ref(firebaseStorage, fileUrl);
        await deleteObject(fileRef).catch(err => console.warn("Fichier déjà supprimé ou introuvable sur le storage", err));
      }
    } catch (error) {
      console.error("Erreur suppression doc:", error);
      throw error;
    }
  },

  // =================================================================
  // 2. GESTION DES DONNÉES MÉTIER (LOCALSTORAGE - TEMPORAIRE)
  // On garde ça pour l'instant pour ne pas casser l'application.
  // La migration vers Firestore (Collections 'marches', 'users') se fera
  // en modifiant les Contexts (MarketContext, AuthContext).
  // =================================================================

  getMarkets: (): Marche[] => {
    const data = localStorage.getItem(STORAGE_KEYS.MARKETS);
    return data ? JSON.parse(data) : [];
  },
  saveMarkets: (markets: Marche[]) => {
    localStorage.setItem(STORAGE_KEYS.MARKETS, JSON.stringify(markets));
  },
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },
  getSession: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  },
  setSession: (user: User | null) => {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
  }
};