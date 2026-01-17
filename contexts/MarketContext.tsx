import React, { createContext, useContext, useState, useEffect } from 'react';
import { Marche, StatutGlobal } from '../types';
import { storage } from '../utils/storage';
import { useLogs } from './LogsContext'; // Import du hook

interface MarketContextType {
  markets: Marche[];
  deletedMarkets: Marche[];
  addMarket: (market: Marche) => void;
  addMarkets: (newMarkets: Marche[]) => void;
  updateMarket: (id: string, updates: Partial<Marche>) => void;
  updateMarketDoc: (marketId: string, jalonKey: string, docId: string) => void;
  removeMarket: (id: string) => void;
  removeMarketsByProjectId: (projectId: string) => void; // NOUVELLE FONCTION AJOUTÉE
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
  
  // Utilisation du contexte Logs pour tracer les actions (ne re-render pas si les logs changent)
  const { addLog } = useLogs();

  useEffect(() => {
    let storedMarkets = storage.getMarkets();
    storedMarkets = storedMarkets.map(m => ({
      ...m,
      dates_prevues: m.dates_prevues || {},
      dates_realisees: m.dates_realisees || {},
      comments: m.comments || {},
      docs: m.docs || {},
      execution: m.execution || { decomptes: [], avenants: [], has_avenant: false, is_resilie: false, resiliation_step: 0 }
    }));
    setMarkets(storedMarkets);
    setDeletedMarkets(JSON.parse(localStorage.getItem('edc_deleted_markets') || '[]'));
  }, []);

  const addMarket = (market: Marche) => {
    setMarkets(prev => {
      const updated = [...prev, { ...market, docs: market.docs || {}, comments: market.comments || {} }];
      storage.saveMarkets(updated);
      addLog('Passation', 'Inscription Marché', `Marché ${market.numDossier} inscrit.`);
      return updated;
    });
  };

  const addMarkets = (newMarkets: Marche[]) => {
    setMarkets(prev => {
      const updated = [...prev, ...newMarkets.map(m => ({ ...m, docs: m.docs || {}, comments: m.comments || {} }))];
      storage.saveMarkets(updated);
      addLog('Passation', 'Import Excel', `${newMarkets.length} marchés importés.`);
      return updated;
    });
  };

  const updateMarket = (id: string, updates: Partial<Marche>) => {
    setMarkets(prev => {
      const updated = prev.map(m => {
        if (m.id === id) {
          const newMarket = { ...m, ...updates };
          if (newMarket.dates_realisees?.signature_marche) newMarket.statut_global = StatutGlobal.SIGNE;
          else if (Object.values(newMarket.dates_realisees || {}).some(v => v)) newMarket.statut_global = StatutGlobal.EN_COURS;
          return newMarket;
        }
        return m;
      });
      storage.saveMarkets(updated);
      return updated;
    });
  };

  const updateMarketDoc = (marketId: string, jalonKey: string, docId: string) => {
    setMarkets(prev => {
      const updated = prev.map(m => m.id === marketId ? { ...m, docs: { ...(m.docs || {}), [jalonKey]: docId } } : m);
      storage.saveMarkets(updated);
      return updated;
    });
  };

  const removeMarket = (id: string) => {
    const target = markets.find(m => m.id === id);
    if (!target) return;
    setMarkets(prev => {
      const updated = prev.filter(m => m.id !== id);
      storage.saveMarkets(updated);
      return updated;
    });
    setDeletedMarkets(prev => {
      const updated = [target, ...prev];
      localStorage.setItem('edc_deleted_markets', JSON.stringify(updated));
      return updated;
    });
  };

  // --- NOUVELLE FONCTION IMPLÉMENTÉE ---
  const removeMarketsByProjectId = (projectId: string) => {
    // Identifier les marchés concernés
    const targets = markets.filter(m => m.projet_id === projectId);
    
    if (targets.length === 0) return;

    // Supprimer de la liste active
    setMarkets(prev => {
      const updated = prev.filter(m => m.projet_id !== projectId);
      storage.saveMarkets(updated);
      return updated;
    });

    // Ajouter à la corbeille (cascade soft delete)
    setDeletedMarkets(prev => {
      const updated = [...targets, ...prev];
      localStorage.setItem('edc_deleted_markets', JSON.stringify(updated));
      return updated;
    });
    
    addLog('Système', 'Suppression en cascade', `${targets.length} marchés archivés suite à la suppression du projet ${projectId}.`);
  };
  // --------------------------------------

  const restoreMarket = (id: string) => {
    const target = deletedMarkets.find(m => m.id === id);
    if (!target) return;
    setDeletedMarkets(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('edc_deleted_markets', JSON.stringify(updated));
      return updated;
    });
    setMarkets(prev => {
      const updated = [...prev, target];
      storage.saveMarkets(updated);
      return updated;
    });
  };

  const permanentDeleteMarket = (id: string) => {
    setDeletedMarkets(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('edc_deleted_markets', JSON.stringify(updated));
      return updated;
    });
  };

  const getMarketById = (id: string) => markets.find(m => m.id === id);

  const updateJalon = (marketId: string, type: 'prevues' | 'realisees', key: string, value: string) => {
    const field = type === 'prevues' ? 'dates_prevues' : 'dates_realisees';
    setMarkets(prev => {
      const updated = prev.map(m => {
        if (m.id === marketId) {
          const updatedDates = { ...m[field as 'dates_prevues' | 'dates_realisees'], [key]: value };
          const newMarket = { ...m, [field]: updatedDates };
          if (key === 'signature_marche' && value) newMarket.statut_global = StatutGlobal.SIGNE;
          return newMarket;
        }
        return m;
      });
      storage.saveMarkets(updated);
      return updated;
    });
  };

  const updateComment = (marketId: string, key: string, value: string) => {
    setMarkets(prev => {
      const updated = prev.map(m => {
        if (m.id === marketId) {
          return { ...m, comments: { ...(m.comments || {}), [key]: value } };
        }
        return m;
      });
      storage.saveMarkets(updated);
      return updated;
    });
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