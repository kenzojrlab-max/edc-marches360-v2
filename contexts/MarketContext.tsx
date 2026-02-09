import React, { createContext, useContext, useState, useEffect } from 'react';
import { Marche, StatutGlobal } from '../types';
import { useLogs } from './LogsContext';
import { useProjects } from './ProjectContext';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Fonction utilitaire pour normaliser les chaînes de caractères (pour comparaison)
const normalizeForComparison = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/\s+/g, ' ')
    .trim();
};

// Fonction pour générer une clé d'identification unique pour un marché
// Critères : objet, budget, fonction, activité
const generateMarketKey = (m: { objet: string; montant_prevu: number; fonction: string; activite: string }): string => {
  return [
    normalizeForComparison(m.objet),
    Math.round(m.montant_prevu || 0).toString(),
    normalizeForComparison(m.fonction),
    normalizeForComparison(m.activite)
  ].join('|');
};

interface MarketContextType {
  markets: Marche[];
  deletedMarkets: Marche[];
  addMarket: (market: Marche) => void;
  addMarkets: (newMarkets: Marche[]) => Promise<void>;
  updateMarket: (id: string, updates: Partial<Marche>) => void;
  updateMarketDoc: (marketId: string, jalonKey: string, docId: string) => void;
  addMarketDocToArray: (marketId: string, jalonKey: string, docId: string) => void;
  removeMarketDocFromArray: (marketId: string, jalonKey: string, docId: string) => void;
  removeMarket: (id: string) => void;
  removeMarketsByProjectId: (projectId: string) => void;
  restoreMarket: (id: string) => void;
  permanentDeleteMarket: (id: string) => void;
  getMarketById: (id: string) => Marche | undefined;
  updateJalon: (marketId: string, type: 'prevues' | 'realisees', key: string, value: string) => void;
  updateComment: (marketId: string, key: string, value: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Marche[]>([]);
  const [deletedMarkets, setDeletedMarkets] = useState<Marche[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { addLog } = useLogs();
  const { projects } = useProjects();

  // AJOUT : Écoute de l'état d'authentification
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribeAuth();
  }, []);

  // CORRECTION : On n'écoute les marchés QUE si l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated) {
      setMarkets([]);
      return;
    }

    // Récupérer TOUS les marchés sans filtre de date
    const unsubscribe = onSnapshot(collection(db, "markets"), (snapshot) => {
      const marketsData = snapshot.docs.map(doc => {
        const m = doc.data() as Marche;
        return {
          ...m,
          dates_prevues: m.dates_prevues || {},
          dates_realisees: m.dates_realisees || {},
          comments: m.comments || {},
          docs: m.docs || {},
          execution: m.execution || { decomptes: [], avenants: [], has_avenant: false, is_resilie: false, resiliation_step: 0 }
        };
      });
      marketsData.sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
      
      setMarkets(marketsData);
    }, (error) => {
      console.warn("Accès aux marchés refusé:", error.code);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // CORRECTION : On n'écoute les marchés supprimés QUE si l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated) {
      setDeletedMarkets([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "deleted_markets"), (snapshot) => {
      const deletedData = snapshot.docs.map(docSnap => ({
        ...docSnap.data(),
        id: docSnap.id // S'assurer que l'ID est bien présent
      } as Marche));
      setDeletedMarkets(deletedData);
    }, (error) => {
      console.warn("Accès aux marchés supprimés refusé:", error.code);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addMarket = async (market: Marche) => {
    try {
      const safeMarket = JSON.parse(JSON.stringify({ 
        ...market, 
        docs: market.docs || {}, 
        comments: market.comments || {} 
      }));
      await setDoc(doc(db, "markets", market.id), safeMarket);
      addLog('Passation', 'Inscription Marché', `Marché ${market.numDossier} inscrit.`);
    } catch (error) {
      console.error("Erreur addMarket:", error);
      alert("Erreur lors de l'ajout du marché. Vérifiez la console.");
    }
  };

  const addMarkets = async (newMarkets: Marche[]) => {
    try {
      const BATCH_SIZE = 450;
      const chunks = [];
      
      for (let i = 0; i < newMarkets.length; i += BATCH_SIZE) {
        chunks.push(newMarkets.slice(i, i + BATCH_SIZE));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(m => {
          const docRef = doc(db, "markets", m.id);
          
          const safeMarket = JSON.parse(JSON.stringify(m));

          // Garder docs et comments comme objets vides au lieu de les supprimer
          // pour éviter les erreurs "Cannot read property of undefined" ailleurs
          if (!safeMarket.docs) safeMarket.docs = {};
          if (!safeMarket.comments) safeMarket.comments = {};

          batch.set(docRef, safeMarket, { merge: true });
        });
        await batch.commit();
      }

      addLog('Passation', 'Import Excel', `${newMarkets.length} marchés importés/mis à jour.`);
    } catch (error: any) {
      console.error("Erreur addMarkets:", error);
      alert(`Erreur d'importation : ${error.message || "Erreur inconnue"}`);
    }
  };

  const updateMarket = async (id: string, updates: Partial<Marche>) => {
    try {
      const marketRef = doc(db, "markets", id);
      let finalUpdates = { ...updates };
      const currentMarket = markets.find(m => m.id === id);
      
      if (finalUpdates.dates_realisees && currentMarket) {
         const mergedDates = { ...currentMarket.dates_realisees, ...finalUpdates.dates_realisees };
         if (mergedDates.signature_marche) finalUpdates.statut_global = StatutGlobal.SIGNE;
         else if (Object.values(mergedDates).some(v => v)) finalUpdates.statut_global = StatutGlobal.EN_COURS;
      }

      const safeUpdates = JSON.parse(JSON.stringify(finalUpdates));
      await updateDoc(marketRef, safeUpdates);
    } catch (error) {
      console.error("Erreur updateMarket:", error);
    }
  };

  const updateMarketDoc = async (marketId: string, jalonKey: string, docId: string) => {
    try {
      const marketRef = doc(db, "markets", marketId);
      await updateDoc(marketRef, {
        [`docs.${jalonKey}`]: docId
      });
    } catch (error) {
      console.error("Erreur updateMarketDoc:", error);
    }
  };

  // Ajouter un document à un tableau de documents pour un jalon
  const addMarketDocToArray = async (marketId: string, jalonKey: string, docId: string) => {
    try {
      const currentMarket = markets.find(m => m.id === marketId);
      if (!currentMarket) return;

      const currentDocs = currentMarket.docs?.[jalonKey];
      let newDocs: string[];

      if (!currentDocs) {
        newDocs = [docId];
      } else if (Array.isArray(currentDocs)) {
        newDocs = [...currentDocs, docId];
      } else {
        // Migration: ancien format string vers tableau
        newDocs = [currentDocs, docId];
      }

      const marketRef = doc(db, "markets", marketId);
      await updateDoc(marketRef, {
        [`docs.${jalonKey}`]: newDocs
      });
    } catch (error) {
      console.error("Erreur addMarketDocToArray:", error);
    }
  };

  // Supprimer un document d'un tableau de documents pour un jalon
  const removeMarketDocFromArray = async (marketId: string, jalonKey: string, docId: string) => {
    try {
      const currentMarket = markets.find(m => m.id === marketId);
      if (!currentMarket) return;

      const currentDocs = currentMarket.docs?.[jalonKey];
      let newDocs: string[] | undefined;

      if (Array.isArray(currentDocs)) {
        newDocs = currentDocs.filter(id => id !== docId);
        if (newDocs.length === 0) newDocs = undefined;
      } else if (currentDocs === docId) {
        newDocs = undefined;
      } else {
        return; // Document non trouvé
      }

      const marketRef = doc(db, "markets", marketId);
      await updateDoc(marketRef, {
        [`docs.${jalonKey}`]: newDocs || null
      });
    } catch (error) {
      console.error("Erreur removeMarketDocFromArray:", error);
    }
  };

  const removeMarket = async (id: string) => {
    try {
      const target = markets.find(m => m.id === id);
      if (!target) return;

      const batch = writeBatch(db);
      batch.delete(doc(db, "markets", id));
      const safeTarget = JSON.parse(JSON.stringify(target));
      batch.set(doc(db, "deleted_markets", id), safeTarget);
      
      await batch.commit();
    } catch (error) {
      console.error("Erreur removeMarket:", error);
    }
  };

  const removeMarketsByProjectId = async (projectId: string) => {
    try {
      const targets = markets.filter(m => m.projet_id === projectId);
      if (targets.length === 0) return;

      const ITEMS_PER_BATCH = 225; // 2 opérations par marché (delete + set)

      for (let i = 0; i < targets.length; i += ITEMS_PER_BATCH) {
        const batch = writeBatch(db);
        targets.slice(i, i + ITEMS_PER_BATCH).forEach(m => {
          batch.delete(doc(db, "markets", m.id));
          const safeMarket = JSON.parse(JSON.stringify(m));
          batch.set(doc(db, "deleted_markets", m.id), safeMarket);
        });
        await batch.commit();
      }

      addLog('Système', 'Suppression en cascade', `${targets.length} marchés archivés suite à la suppression du projet.`);
    } catch (error) {
      console.error("Erreur removeMarketsByProjectId:", error);
    }
  };

  const restoreMarket = async (id: string) => {
    try {
      const target = deletedMarkets.find(m => m.id === id);
      if (!target) return;

      const batch = writeBatch(db);
      batch.delete(doc(db, "deleted_markets", id));
      const safeTarget = JSON.parse(JSON.stringify(target));
      batch.set(doc(db, "markets", id), safeTarget);
      
      await batch.commit();
    } catch (error) {
      console.error("Erreur restoreMarket:", error);
    }
  };

  const permanentDeleteMarket = async (id: string) => {
    try {
      await deleteDoc(doc(db, "deleted_markets", id));
    } catch (error) {
      console.error("Erreur permanentDeleteMarket:", error);
    }
  };

  const getMarketById = (id: string) => markets.find(m => m.id === id);

  const updateJalon = async (marketId: string, type: 'prevues' | 'realisees', key: string, value: string) => {
    try {
      const field = type === 'prevues' ? 'dates_prevues' : 'dates_realisees';
      const marketRef = doc(db, "markets", marketId);

      const updates: any = {
        [`${field}.${key}`]: value
      };

      if (key === 'signature_marche' && value) {
        updates.statut_global = StatutGlobal.SIGNE;

        // Auto-remplir montant_ttc_reel avec montant_prevu si non saisi
        const currentMarket = markets.find(m => m.id === marketId);
        if (currentMarket && !currentMarket.montant_ttc_reel && currentMarket.montant_prevu) {
          updates.montant_ttc_reel = currentMarket.montant_prevu;
        }
      }

      await updateDoc(marketRef, updates);

      // SYNCHRONISATION AUTOMATIQUE vers les années suivantes
      // Si on saisit une date réalisée, on la propage aux marchés correspondants des années suivantes
      if (type === 'realisees' && value) {
        const currentMarket = markets.find(m => m.id === marketId);
        if (!currentMarket) return;

        // Trouver le projet du marché actuel pour connaître son année
        const currentProject = projects.find(p => p.id === currentMarket.projet_id);
        if (!currentProject) return;

        const currentYear = currentProject.exercice;
        const currentMarketKey = generateMarketKey(currentMarket);

        // Trouver tous les marchés correspondants dans les années SUIVANTES
        const matchingMarkets = markets.filter(m => {
          // Exclure le marché actuel
          if (m.id === marketId) return false;

          // Vérifier si c'est le même marché (mêmes critères)
          if (generateMarketKey(m) !== currentMarketKey) return false;

          // Vérifier que c'est une année SUIVANTE
          const marketProject = projects.find(p => p.id === m.projet_id);
          if (!marketProject) return false;

          return marketProject.exercice > currentYear;
        });

        // Mettre à jour les marchés correspondants
        if (matchingMarkets.length > 0) {
          const batch = writeBatch(db);

          matchingMarkets.forEach(m => {
            const matchingMarketRef = doc(db, "markets", m.id);
            const syncUpdates: any = {
              [`dates_realisees.${key}`]: value
            };

            // Si c'est la signature, mettre à jour le statut et le montant si nécessaire
            if (key === 'signature_marche') {
              syncUpdates.statut_global = StatutGlobal.SIGNE;

              // Propager montant_ttc_reel si non défini dans le marché cible
              if (!m.montant_ttc_reel && currentMarket.montant_prevu) {
                syncUpdates.montant_ttc_reel = currentMarket.montant_prevu;
              }
            }

            batch.update(matchingMarketRef, syncUpdates);
          });

          await batch.commit();
          console.log(`Synchronisation: ${matchingMarkets.length} marché(s) mis à jour pour le jalon ${key}`);
        }
      }
    } catch (error) {
      console.error("Erreur updateJalon:", error);
    }
  };

  const updateComment = async (marketId: string, key: string, value: string) => {
    try {
      const marketRef = doc(db, "markets", marketId);
      await updateDoc(marketRef, {
        [`comments.${key}`]: value
      });
    } catch (error) {
      console.error("Erreur updateComment:", error);
    }
  };

  return (
    <MarketContext.Provider value={{
      markets, deletedMarkets, addMarket, addMarkets, updateMarket, updateMarketDoc,
      addMarketDocToArray, removeMarketDocFromArray,
      removeMarket, removeMarketsByProjectId, restoreMarket, permanentDeleteMarket, getMarketById, updateJalon, updateComment
    }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarkets = () => {
  const context = useContext(MarketContext);
  if (!context) throw new Error("useMarkets must be used within MarketProvider");
  return context;
};
