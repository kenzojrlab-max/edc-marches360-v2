import React, { createContext, useContext, useState, useEffect } from 'react';
import { LibraryDocument } from '../types';
// Importation des outils Firebase Firestore pour la synchronisation
import { collection, onSnapshot, setDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

interface LibraryContextType {
  libraryDocs: LibraryDocument[];
  addLibraryDoc: (doc: LibraryDocument) => void;
  removeLibraryDoc: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);

  // CORRECTION : Utilisation de onSnapshot pour écouter la base de données en temps réel
  useEffect(() => {
    // On écoute la collection "library" dans Firestore
    // Dès qu'un changement arrive (ajout sur PC), le mobile reçoit l'info instantanément
    const unsubscribe = onSnapshot(collection(db, "library"), (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data() as LibraryDocument);
      setLibraryDocs(docs);
    }, (error) => {
      console.error("Erreur de synchronisation Library:", error);
    });

    // Nettoyage de l'écouteur quand on quitte
    return () => unsubscribe();
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