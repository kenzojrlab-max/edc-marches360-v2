import React, { createContext, useContext, useState, useEffect } from 'react';
import { Marche, StatutGlobal } from '../types';
import { useLogs } from './LogsContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

interface MarketContextType {
  markets: Marche[];
  deletedMarkets: Marche[];
  addMarket: (market: Marche) => void;
  addMarkets: (newMarkets: Marche[]) => void;
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
  
  const { addLog } = useLogs();

  // Écoute temps réel des Marchés Actifs
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "markets"), (snapshot) => {
      const marketsData = snapshot.docs.map(doc => {
        const m = doc.data() as Marche;
        // Garantir que les objets imbriqués existent pour éviter les crashs
        return {
          ...m,
          dates_prevues: m.dates_prevues || {},
          dates_realisees: m.dates_realisees || {},
          comments: m.comments || {},
          docs: m.docs || {},
          execution: m.execution || { decomptes: [], avenants: [], has_avenant: false, is_resilie: false, resiliation_step: 0 }
        };
      });
      setMarkets(marketsData);
    });
    return () => unsubscribe();
  }, []);

  // Écoute temps réel de la Corbeille
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "deleted_markets"), (snapshot) => {
      const deletedData = snapshot.docs.map(doc => doc.data() as Marche);
      setDeletedMarkets(deletedData);
    });
    return () => unsubscribe();
  }, []);

  const addMarket = async (market: Marche) => {
    try {
      const safeMarket = { ...market, docs: market.docs || {}, comments: market.comments || {} };
      await setDoc(doc(db, "markets", market.id), safeMarket);
      addLog('Passation', 'Inscription Marché', `Marché ${market.numDossier} inscrit.`);
    } catch (error) {
      console.error("Erreur addMarket:", error);
    }
  };

  const addMarkets = async (newMarkets: Marche[]) => {
    try {
      // Firestore limite les batchs à 500 opérations, on découpe si nécessaire (ici simplifié)
      const batch = writeBatch(db);
      newMarkets.forEach(m => {
        const docRef = doc(db, "markets", m.id);
        const safeMarket = { ...m, docs: m.docs || {}, comments: m.comments || {} };
        batch.set(docRef, safeMarket);
      });
      await batch.commit();
      addLog('Passation', 'Import Excel', `${newMarkets.length} marchés importés.`);
    } catch (error) {
      console.error("Erreur addMarkets:", error);
    }
  };

  const updateMarket = async (id: string, updates: Partial<Marche>) => {
    try {
      const marketRef = doc(db, "markets", id);
      // Logique métier locale pour le statut
      let finalUpdates = { ...updates };
      const currentMarket = markets.find(m => m.id === id);
      
      // Si on met à jour les dates, on recalcule le statut global
      if (finalUpdates.dates_realisees && currentMarket) {
         const mergedDates = { ...currentMarket.dates_realisees, ...finalUpdates.dates_realisees };
         if (mergedDates.signature_marche) finalUpdates.statut_global = StatutGlobal.SIGNE;
         else if (Object.values(mergedDates).some(v => v)) finalUpdates.statut_global = StatutGlobal.EN_COURS;
      }

      await updateDoc(marketRef, finalUpdates);
    } catch (error) {
      console.error("Erreur updateMarket:", error);
    }
  };

  const updateMarketDoc = async (marketId: string, jalonKey: string, docId: string) => {
    try {
      const marketRef = doc(db, "markets", marketId);
      // Notation pointée pour mettre à jour une clé spécifique d'une Map dans Firestore
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
      // 1. Supprimer de "markets"
      batch.delete(doc(db, "markets", id));
      // 2. Ajouter dans "deleted_markets"
      batch.set(doc(db, "deleted_markets", id), target);
      
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
        batch.set(doc(db, "deleted_markets", m.id), m);
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
      batch.set(doc(db, "markets", id), target);
      
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