import { 
  ref, 
  uploadBytesResumable, // MODIFIÉ : On utilise la version "Resumable" pour le suivi
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db, storage as firebaseStorage } from "../firebase"; 
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
   * MODIFICATION : Ajout du callback onProgress pour suivre l'avancement
   */
  uploadFile: (file: File, folder: string = 'marches_docs', onProgress?: (progress: number) => void): Promise<PieceJointe> => {
    return new Promise((resolve, reject) => {
      try {
        // A. Création d'une référence unique
        const uniqueId = crypto.randomUUID();
        const storageRef = ref(firebaseStorage, `${folder}/${uniqueId}_${file.name}`);

        // B. Lancement de l'upload avec suivi (UploadTask)
        const uploadTask = uploadBytesResumable(storageRef, file);

        // C. Écoute des événements
        uploadTask.on('state_changed', 
          (snapshot) => {
            // Calcul du pourcentage
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(progress);
          },
          (error) => {
            // Gestion des erreurs d'upload
            console.error("Erreur upload Firebase:", error);
            reject(error);
          },
          async () => {
            // D. Fin de l'upload -> Récupération URL & Enregistrement Firestore
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const newDoc: PieceJointe = {
                id: uniqueId,
                nom: file.name,
                type: file.type,
                size: file.size,
                url: downloadURL,
                date_upload: new Date().toISOString()
              };

              // E. Sauvegarde de la fiche dans la collection Firestore "documents"
              await setDoc(doc(db, "documents", uniqueId), newDoc);

              resolve(newDoc);
            } catch (err) {
              console.error("Erreur post-upload (Firestore):", err);
              reject(err);
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
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

      // 2. Supprimer le fichier physique du Storage
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