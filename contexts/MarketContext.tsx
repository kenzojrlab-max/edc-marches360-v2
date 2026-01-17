import React, { createContext, useContext, useState, useEffect } from 'react';
import { Marche, StatutGlobal } from '../types';
import { useLogs } from './LogsContext';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';

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
  
  const { addLog } = useLogs();

  useEffect(() => {
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
      // CORRECTION : Tri par date_creation pour respecter l'ordre d'import
      marketsData.sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
      
      setMarkets(marketsData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "deleted_markets"), (snapshot) => {
      const deletedData = snapshot.docs.map(doc => doc.data() as Marche);
      setDeletedMarkets(deletedData);
    });
    return () => unsubscribe();
  }, []);

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

      console.log(`Début import : ${newMarkets.length} marchés en ${chunks.length} lots.`);

      for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(m => {
          const docRef = doc(db, "markets", m.id);
          
          // CORRECTION MAJEURE ICI (POINT 5) : Gestion des doublons et protection des données
          
          // 1. On crée une copie propre des données à importer
          const safeMarket = JSON.parse(JSON.stringify(m));

          // 2. IMPORTANT : On supprime les champs docs et comments de l'objet à envoyer
          // SI ET SEULEMENT SI ils sont vides dans l'import.
          // Cela empêche d'écraser les fichiers/commentaires existants en base avec du "vide".
          if (!safeMarket.docs || Object.keys(safeMarket.docs).length === 0) {
            delete safeMarket.docs;
          }
          if (!safeMarket.comments || Object.keys(safeMarket.comments).length === 0) {
            delete safeMarket.comments;
          }

          // 3. On utilise { merge: true }
          // Si le marché existe : on met à jour SEULEMENT les champs présents dans safeMarket (montant, dates...)
          // Si le marché n'existe pas : on le crée.
          batch.set(docRef, safeMarket, { merge: true });
        });
        await batch.commit();
        console.log(`Lot importé (${chunk.length} éléments)`);
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