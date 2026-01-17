import { useState, useMemo } from 'react';
import { Marche, Projet } from '../types';

export const useMarketFilter = (markets: Marche[], projects: Projet[]) => {
  // --- États des filtres ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedFonction, setSelectedFonction] = useState<string>('');

  // --- Options pour les listes déroulantes (Calculées une seule fois) ---
  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString())));
    return [
      { value: '', label: 'Tous les exercices' }, 
      ...years.sort((a, b) => b.localeCompare(a)).map(y => ({ value: y, label: y }))
    ];
  }, [projects]);

  const projectOptions = useMemo(() => {
    return [
      { value: '', label: 'Tous les projets' }, 
      ...projects.map(p => ({ value: p.id, label: p.libelle }))
    ];
  }, [projects]);

  // --- Logique de filtrage centrale ---
  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      // 1. Liaison avec le projet parent
      const parentProject = projects.find(p => p.id === m.projet_id);
      
      // 2. Filtre par Année (Exercice du projet)
      const matchYear = !selectedYear || parentProject?.exercice.toString() === selectedYear;

      // 3. Filtre par Projet
      const matchProject = !selectedProjectId || m.projet_id === selectedProjectId;

      // 4. Filtre par Fonction (Utilisé dans Dashboard)
      const matchFonction = !selectedFonction || m.fonction === selectedFonction;

      // 5. Filtre Recherche Texte (Numéro ou Objet) - (Utilisé dans Tracking/Execution)
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || (
        (m.numDossier || "").toLowerCase().includes(term) || 
        (m.objet || "").toLowerCase().includes(term)
      );

      return matchYear && matchProject && matchFonction && matchSearch;
    });
  }, [markets, projects, selectedYear, selectedProjectId, selectedFonction, searchTerm]);

  return {
    // États
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedProjectId, setSelectedProjectId,
    selectedFonction, setSelectedFonction,
    
    // Données calculées
    yearOptions,
    projectOptions,
    filteredMarkets
  };
};