import React, { createContext, useContext, useState, useEffect } from 'react';
import { Marche, StatutGlobal } from '../types';
import { useLogs } from './LogsContext';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface MarketContextType {
  markets: Marche[];
  deletedMarkets: Marche[];
  addMarket: (market: Marche) => void;
  addMarkets: (newMarkets: Marche[]) => Promise<void>;
  updateMarket: (id: string, updates: Partial<Marche>) => void;
  updateMarketDoc: (marketId: string, jalonKey: string, docId: string) => void;
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

    const currentYear = new Date().getFullYear();
    const startOfYear = `${currentYear}-01-01`;

    const marketsQuery = query(
      collection(db, "markets"),
      where("date_creation", ">=", startOfYear)
    );

    const unsubscribe = onSnapshot(marketsQuery, (snapshot) => {
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
      const deletedData = snapshot.docs.map(doc => doc.data() as Marche);
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

          if (!safeMarket.docs || Object.keys(safeMarket.docs).length === 0) {
            delete safeMarket.docs;
          }
          if (!safeMarket.comments || Object.keys(safeMarket.comments).length === 0) {
            delete safeMarket.comments;
          }

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

      const batch = writeBatch(db);
      targets.forEach(m => {
        batch.delete(doc(db, "markets", m.id));
        const safeMarket = JSON.parse(JSON.stringify(m));
        batch.set(doc(db, "deleted_markets", m.id), safeMarket);
      });

      await batch.commit();
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
      }

      await updateDoc(marketRef, updates);
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