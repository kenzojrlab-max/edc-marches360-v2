import React, { createContext, useContext, useState, useEffect } from 'react';
import { FONCTIONS as INITIAL_FONCTIONS } from '../constants';
import { AOType, MarketType } from '../types';

interface ConfigContextType {
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

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fonctions, setFonctions] = useState<string[]>([]);
  const [aoTypes, setAoTypes] = useState<string[]>([]);
  const [marketTypes, setMarketTypes] = useState<string[]>([]);

  useEffect(() => {
    setFonctions(JSON.parse(localStorage.getItem('edc_fonctions') || JSON.stringify(INITIAL_FONCTIONS)));
    setAoTypes(JSON.parse(localStorage.getItem('edc_aotypes') || JSON.stringify(Object.values(AOType))));
    setMarketTypes(JSON.parse(localStorage.getItem('edc_markettypes') || JSON.stringify(Object.values(MarketType))));
  }, []);

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

  return (
    <ConfigContext.Provider value={{
      fonctions, aoTypes, marketTypes,
      addFonction, removeFonction, addAOType, removeAOType, addMarketType, removeMarketType
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