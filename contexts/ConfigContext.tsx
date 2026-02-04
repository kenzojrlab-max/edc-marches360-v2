import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { FONCTIONS as INITIAL_FONCTIONS } from '../constants';
import { AOType, MarketType } from '../types';

// =================================================================
// INTERFACE DE CONFIGURATION COMPLÈTE
// =================================================================
// Combine les paramètres système ET la structure métier
export interface AppConfig {
  // --- Paramètres Système ---
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  systemMessage: string;
  taxRate: number;
  
  // --- Structure Métier (remplace localStorage) ---
  fonctions: string[];        // Fonctions analytiques
  aoTypes: string[];          // Types d'AO (AON, AOI, etc.)
  marketTypes: string[];      // Types de prestations (Travaux, Services, etc.)
}

interface ConfigContextType {
  // --- Paramètres Système ---
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => Promise<void>;
  isLoading: boolean;
  
  // --- Fonctions pour la Structure Métier (compatibilité avec l'ancien code) ---
  fonctions: string[];
  aoTypes: string[];
  marketTypes: string[];
  addFonction: (libelle: string) => void;
  removeFonction: (libelle: string) => void;
  addAOType: (label: string) => void;
  removeAOType: (label: string) => void;
  addMarketType: (label: string) => void;
  removeMarketType: (label: string) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Valeurs par défaut complètes
const DEFAULT_CONFIG: AppConfig = {
  // Système
  maintenanceMode: false,
  allowRegistrations: true,
  systemMessage: '',
  taxRate: 19.25,
  // Structure Métier
  fonctions: INITIAL_FONCTIONS,
  aoTypes: Object.values(AOType),
  marketTypes: Object.values(MarketType)
};

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  // Écoute Firestore UNIQUEMENT si l'utilisateur est authentifié
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setConfig(DEFAULT_CONFIG);
        setIsLoading(false);
        return;
      }

      const configRef = doc(db, "config", "general");

      const unsubSnapshot = onSnapshot(configRef, async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            ...DEFAULT_CONFIG,
            ...data
          } as AppConfig);
        } else {
          try {
            await setDoc(configRef, DEFAULT_CONFIG);
            setConfig(DEFAULT_CONFIG);
          } catch (error) {
            console.warn("Impossible de créer la config initiale:", error);
          }
        }
        setIsLoading(false);
      }, (error) => {
        console.error("Erreur de synchronisation Config:", error);
        setIsLoading(false);
      });

      return () => unsubSnapshot();
    });

    return () => unsubAuth();
  }, []);

  // =================================================================
  // FONCTION GÉNÉRALE DE MISE À JOUR
  // =================================================================
  const updateConfig = async (updates: Partial<AppConfig>) => {
    try {
      const configRef = doc(db, "config", "general");
      await updateDoc(configRef, updates);
    } catch (error) {
      console.error("Erreur updateConfig:", error);
      throw error;
    }
  };

  // =================================================================
  // FONCTIONS SPÉCIFIQUES POUR LA STRUCTURE MÉTIER
  // (Compatibilité avec le code existant qui utilise addFonction, etc.)
  // =================================================================
  
  const addFonction = async (libelle: string) => {
    const updated = [...config.fonctions, libelle];
    await updateConfig({ fonctions: updated });
  };

  const removeFonction = async (libelle: string) => {
    const updated = config.fonctions.filter(f => f !== libelle);
    await updateConfig({ fonctions: updated });
  };

  const addAOType = async (label: string) => {
    const updated = [...config.aoTypes, label];
    await updateConfig({ aoTypes: updated });
  };

  const removeAOType = async (label: string) => {
    const updated = config.aoTypes.filter(t => t !== label);
    await updateConfig({ aoTypes: updated });
  };

  const addMarketType = async (label: string) => {
    const updated = [...config.marketTypes, label];
    await updateConfig({ marketTypes: updated });
  };

  const removeMarketType = async (label: string) => {
    const updated = config.marketTypes.filter(t => t !== label);
    await updateConfig({ marketTypes: updated });
  };

  return (
    <ConfigContext.Provider value={{ 
      // Paramètres système
      config, 
      updateConfig, 
      isLoading,
      
      // Structure métier (accès direct pour compatibilité)
      fonctions: config.fonctions,
      aoTypes: config.aoTypes,
      marketTypes: config.marketTypes,
      addFonction, 
      removeFonction, 
      addAOType, 
      removeAOType, 
      addMarketType, 
      removeMarketType
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error("useConfig must be used within ConfigProvider");
  return context;
};