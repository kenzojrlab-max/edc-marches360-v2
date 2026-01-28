import { useState, useMemo, useEffect } from 'react';
import { Marche, Projet } from '../types';
import { FONCTIONS } from '../constants';

export const useMarketFilter = (markets: Marche[], projects: Projet[]) => {
  // --- Année en cours par défaut ---
  const currentYear = new Date().getFullYear().toString();

  // --- États des filtres ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedFinancement, setSelectedFinancement] = useState<string>('');
  const [selectedFonction, setSelectedFonction] = useState<string>('');

  // --- Options pour les listes déroulantes (Calculées une seule fois) ---
  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString())));
    return [
      { value: '', label: 'Tous les exercices' },
      ...years.sort((a, b) => b.localeCompare(a)).map(y => ({ value: y, label: y }))
    ];
  }, [projects]);

  // Options de financement dynamiques selon l'année sélectionnée
  const financementOptions = useMemo(() => {
    const financements = new Set<string>();

    // Filtrer les projets par année sélectionnée
    const filteredProjects = selectedYear
      ? projects.filter(p => p.exercice.toString() === selectedYear)
      : projects;

    // Filtrer les marchés par année (via leur projet parent)
    const filteredMarketsForFinancement = selectedYear
      ? markets.filter(m => {
          const parentProject = projects.find(p => p.id === m.projet_id);
          return parentProject?.exercice.toString() === selectedYear;
        })
      : markets;

    // Depuis les projets filtrés
    filteredProjects.forEach(p => {
      if (p.sourceFinancement === 'BUDGET_EDC') {
        financements.add('Budget EDC');
      } else if (p.nomBailleur) {
        financements.add(p.nomBailleur);
      }
    });

    // Depuis les marchés filtrés (pour les bailleurs définis directement au niveau du marché)
    filteredMarketsForFinancement.forEach(m => {
      if (m.source_financement === 'BUDGET_EDC') {
        financements.add('Budget EDC');
      } else if (m.nom_bailleur) {
        financements.add(m.nom_bailleur);
      }
    });

    return [
      { value: '', label: 'Tous les financements' },
      ...Array.from(financements).sort().map(f => ({ value: f, label: f }))
    ];
  }, [projects, markets, selectedYear]);

  // Réinitialiser le financement si celui sélectionné n'est plus disponible pour l'année choisie
  useEffect(() => {
    if (selectedFinancement) {
      const availableFinancements = financementOptions.map(f => f.value);
      if (!availableFinancements.includes(selectedFinancement)) {
        setSelectedFinancement('');
      }
    }
  }, [selectedYear, financementOptions]);

  // Options de fonction analytique avec "Toutes les fonctions"
  const fonctionOptions = useMemo(() => {
    return [
      { value: '', label: 'Toutes les fonctions' },
      ...FONCTIONS.map(f => ({ value: f, label: f }))
    ];
  }, []);

  // --- Logique de filtrage centrale ---
  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      // 1. Liaison avec le projet parent
      const parentProject = projects.find(p => p.id === m.projet_id);

      // 2. Filtre par Année (Exercice du projet)
      const matchYear = !selectedYear || parentProject?.exercice.toString() === selectedYear;

      // 3. Filtre par Financement (Budget EDC ou nom du bailleur - niveau marché ou projet)
      let matchFinancement = true;
      if (selectedFinancement) {
        if (selectedFinancement === 'Budget EDC') {
          matchFinancement = m.source_financement === 'BUDGET_EDC';
        } else {
          // Vérifier d'abord le nom du bailleur du marché, sinon celui du projet
          const bailleurMarche = m.nom_bailleur;
          const bailleurProjet = parentProject?.nomBailleur;
          matchFinancement = bailleurMarche === selectedFinancement || bailleurProjet === selectedFinancement;
        }
      }

      // 4. Filtre par Fonction (Utilisé dans Dashboard)
      const matchFonction = !selectedFonction || m.fonction === selectedFonction;

      // 5. Filtre Recherche Texte (Numéro ou Objet) - (Utilisé dans Tracking/Execution)
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || (
        (m.numDossier || "").toLowerCase().includes(term) ||
        (m.objet || "").toLowerCase().includes(term)
      );

      return matchYear && matchFinancement && matchFonction && matchSearch;
    });
  }, [markets, projects, selectedYear, selectedFinancement, selectedFonction, searchTerm]);

  return {
    // États
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    selectedFonction, setSelectedFonction,

    // Données calculées
    yearOptions,
    financementOptions,
    fonctionOptions,
    filteredMarkets
  };
};