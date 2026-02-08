import React, { createContext, useContext, useState, useEffect } from 'react';
import { LibraryDocument } from '../types';
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface LibraryContextType {
  libraryDocs: LibraryDocument[];
  addLibraryDoc: (doc: LibraryDocument) => void;
  removeLibraryDoc: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);

  // Écoute Firestore UNIQUEMENT si l'utilisateur est authentifié
  useEffect(() => {
    let unsubSnapshot: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnapshot) {
        unsubSnapshot();
        unsubSnapshot = null;
      }

      if (!user) {
        setLibraryDocs([]);
        return;
      }

      unsubSnapshot = onSnapshot(collection(db, "library"), (snapshot) => {
        const docs = snapshot.docs.map(doc => doc.data() as LibraryDocument);
        setLibraryDocs(docs);
      }, (error) => {
        console.error("Erreur de synchronisation Library:", error);
      });
    });

    return () => {
      if (unsubSnapshot) unsubSnapshot();
      unsubAuth();
    };
  }, []);

  const addLibraryDoc = async (newDoc: LibraryDocument) => {
    try {
      // CORRECTION : Sauvegarde dans Firestore (Cloud) au lieu de localStorage
      // On utilise l'ID du document comme clé unique
      await setDoc(doc(db, "library", newDoc.id), newDoc);
    } catch (error) {
      console.error("Erreur lors de l'ajout du document:", error);
    }
  };

  const removeLibraryDoc = async (id: string) => {
    try {
      // CORRECTION : Suppression dans Firestore (Cloud)
      await deleteDoc(doc(db, "library", id));
    } catch (error) {
      console.error("Erreur lors de la suppression du document:", error);
    }
  };

  return (
    <LibraryContext.Provider value={{ libraryDocs, addLibraryDoc, removeLibraryDoc }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
};
