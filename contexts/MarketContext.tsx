import React, { createContext, useContext, useState, useEffect } from 'react';
import { Marche, Projet, LibraryDocument, StatutGlobal, AuditLog, UserRole, AOType, MarketType } from '../types';
import { storage } from '../utils/storage';
import { FONCTIONS as INITIAL_FONCTIONS } from '../constants';
import { generateUUID } from '../utils/uid';

interface MarketContextType {
  markets: Marche[];
  deletedMarkets: Marche[];
  projects: Projet[];
  libraryDocs: LibraryDocument[];
  fonctions: string[];
  aoTypes: string[];
  marketTypes: string[];
  auditLogs: AuditLog[];
  addMarket: (market: Marche) => void;
  addMarkets: (newMarkets: Marche[]) => void;
  updateMarket: (id: string, updates: Partial<Marche>) => void;
  updateMarketDoc: (marketId: string, jalonKey: string, docId: string) => void;
  removeMarket: (id: string) => void;
  restoreMarket: (id: string) => void;
  permanentDeleteMarket: (id: string) => void;
  addProject: (project: Projet) => void;
  updateProject: (id: string, updates: Partial<Projet>) => void;
  getMarketById: (id: string) => Marche | undefined;
  updateJalon: (marketId: string, type: 'prevues' | 'realisees', key: string, value: string) => void;
  updateComment: (marketId: string, key: string, value: string) => void;
  addLibraryDoc: (doc: LibraryDocument) => void;
  removeLibraryDoc: (id: string) => void;
  addFonction: (libelle: string) => void;
  removeFonction: (libelle: string) => void;
  addAOType: (label: string) => void;
  removeAOType: (label: string) => void;
  addMarketType: (label: string) => void;
  removeMarketType: (label: string) => void;
  addLog: (module: string, action: string, details: string) => void;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

export const MarketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [markets, setMarkets] = useState<Marche[]>([]);
  const [deletedMarkets, setDeletedMarkets] = useState<Marche[]>([]);
  const [projects, setProjects] = useState<Projet[]>([]);
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);
  const [fonctions, setFonctions] = useState<string[]>([]);
  const [aoTypes, setAoTypes] = useState<string[]>([]);
  const [marketTypes, setMarketTypes] = useState<string[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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
    setProjects(JSON.parse(localStorage.getItem('edc_projects') || '[]'));
    setLibraryDocs(JSON.parse(localStorage.getItem('edc_library') || '[]'));
    setFonctions(JSON.parse(localStorage.getItem('edc_fonctions') || JSON.stringify(INITIAL_FONCTIONS)));
    setAoTypes(JSON.parse(localStorage.getItem('edc_aotypes') || JSON.stringify(Object.values(AOType))));
    setMarketTypes(JSON.parse(localStorage.getItem('edc_markettypes') || JSON.stringify(Object.values(MarketType))));
    setAuditLogs(JSON.parse(localStorage.getItem('edc_audit_logs') || '[]'));
  }, []);

  const addLog = (module: string, action: string, details: string) => {
    const session = storage.getSession();
    const newLog: AuditLog = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      userName: session?.name || 'Système',
      userRole: session?.role || UserRole.GUEST,
      module, action, details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 1000);
      localStorage.setItem('edc_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

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

  const addProject = (project: Projet) => {
    setProjects(prev => {
      const updated = [...prev, project];
      localStorage.setItem('edc_projects', JSON.stringify(updated));
      addLog('Projets', 'Création', `Nouveau projet : ${project.libelle}`);
      return updated;
    });
  };

  const updateProject = (id: string, updates: Partial<Projet>) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem('edc_projects', JSON.stringify(updated));
      return updated;
    });
  };

  const addLibraryDoc = (doc: LibraryDocument) => {
    setLibraryDocs(prev => {
      const updated = [...prev, doc];
      localStorage.setItem('edc_library', JSON.stringify(updated));
      return updated;
    });
  };

  const removeLibraryDoc = (id: string) => {
    setLibraryDocs(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('edc_library', JSON.stringify(updated));
      return updated;
    });
  };

  const addFonction = (libelle: string) => {
    setFonctions(prev => {
      const updated = [...prev, libelle];
      localStorage.setItem('edc_fonctions', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFonction = (libelle: string) => {
    setFonctions(prev => {
      const updated = prev.filter(f => f !== libelle);
      localStorage.setItem('edc_fonctions', JSON.stringify(updated));
      return updated;
    });
  };

  const addAOType = (label: string) => {
    setAoTypes(prev => {
      const updated = [...prev, label];
      localStorage.setItem('edc_aotypes', JSON.stringify(updated));
      return updated;
    });
  };

  const removeAOType = (label: string) => {
    setAoTypes(prev => {
      const updated = prev.filter(t => t !== label);
      localStorage.setItem('edc_aotypes', JSON.stringify(updated));
      return updated;
    });
  };

  const addMarketType = (label: string) => {
    setMarketTypes(prev => {
      const updated = [...prev, label];
      localStorage.setItem('edc_markettypes', JSON.stringify(updated));
      return updated;
    });
  };

  const removeMarketType = (label: string) => {
    setMarketTypes(prev => {
      const updated = prev.filter(t => t !== label);
      localStorage.setItem('edc_markettypes', JSON.stringify(updated));
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
      markets, deletedMarkets, projects, libraryDocs, fonctions, aoTypes, marketTypes, auditLogs,
      addMarket, addMarkets, updateMarket, updateMarketDoc, removeMarket, restoreMarket, permanentDeleteMarket,
      addProject, updateProject, getMarketById, updateJalon, updateComment, addLibraryDoc, removeLibraryDoc,
      addFonction, removeFonction, addAOType, removeAOType, addMarketType, removeMarketType, addLog
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