import { useState, useMemo, useEffect } from 'react';
import { Marche, Projet } from '../types';
import { useConfig } from '../contexts/ConfigContext';

// Fonction utilitaire pour normaliser les chaînes de caractères (comparaison insensible à la casse et aux accents)
const normalizeString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .replace(/\s+/g, ' ')
    .trim();
};

// Fonction pour trouver la fonction correspondante dans les constantes
const matchFonction = (marketFonction: string, selectedFonction: string): boolean => {
  if (!selectedFonction) return true; // Pas de filtre = tout passe
  if (!marketFonction) return false;

  const normalizedMarket = normalizeString(marketFonction);
  const normalizedSelected = normalizeString(selectedFonction);

  // Correspondance exacte après normalisation
  if (normalizedMarket === normalizedSelected) return true;

  // Correspondance partielle pour gérer les variantes (ex: "régularisation" vs "régulations")
  // On vérifie si les mots clés principaux sont présents
  const keyWords = ['exploitation', 'maintenance', 'developpement', 'projets', 'edc', 'support'];

  // Pour "Exploitation et maintenance..."
  if (normalizedSelected.includes('exploitation') && normalizedSelected.includes('maintenance')) {
    return normalizedMarket.includes('exploitation') && normalizedMarket.includes('maintenance');
  }

  // Pour "Développement des projets"
  if (normalizedSelected.includes('developpement') && normalizedSelected.includes('projets')) {
    return normalizedMarket.includes('developpement') && normalizedMarket.includes('projets');
  }

  // Pour "EDC support"
  if (normalizedSelected.includes('edc') && normalizedSelected.includes('support')) {
    return normalizedMarket.includes('edc') && normalizedMarket.includes('support');
  }

  return false;
};

export const useMarketFilter = (markets: Marche[], projects: Projet[]) => {
  const { fonctions } = useConfig();

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

  // Options de fonction analytique dynamiques depuis ConfigContext
  const fonctionOptions = useMemo(() => {
    return [
      { value: '', label: 'Toutes les fonctions' },
      ...fonctions.map(f => ({ value: f, label: f }))
    ];
  }, [fonctions]);

  // --- Logique de filtrage centrale ---
  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      // 1. Liaison avec le projet parent
      const parentProject = projects.find(p => p.id === m.projet_id);
      const exerciceProjet = parentProject?.exercice;

      // 2. Filtre par Année - LOGIQUE SIMPLIFIÉE
      // Un marché appartient TOUJOURS à l'année de son projet (exercice)
      // Cela garantit qu'un marché importé pour 2023 apparaît toujours en 2023,
      // même s'il a des dates réalisées de 2022 (agrégées ou catégorisées)
      let matchYear = true;
      if (selectedYear) {
        const yearFilter = parseInt(selectedYear);
        matchYear = exerciceProjet === yearFilter;
      }

      // 3. Filtre par Financement (Budget EDC ou nom du bailleur - niveau marché ou projet)
      let matchFinancementResult = true;
      if (selectedFinancement) {
        if (selectedFinancement === 'Budget EDC') {
          matchFinancementResult = m.source_financement === 'BUDGET_EDC';
        } else {
          // Vérifier d'abord le nom du bailleur du marché, sinon celui du projet
          const bailleurMarche = m.nom_bailleur;
          const bailleurProjet = parentProject?.nomBailleur;
          matchFinancementResult = bailleurMarche === selectedFinancement || bailleurProjet === selectedFinancement;
        }
      }

      // 4. Filtre par Fonction (Utilisé dans Dashboard) - COMPARAISON INSENSIBLE À LA CASSE
      const matchFonctionResult = matchFonction(m.fonction, selectedFonction);

      // 5. Filtre Recherche Texte (Numéro ou Objet) - (Utilisé dans Tracking/Execution)
      const term = searchTerm.toLowerCase();
      const matchSearch = !term || (
        (m.numDossier || "").toLowerCase().includes(term) ||
        (m.objet || "").toLowerCase().includes(term)
      );

      return matchYear && matchFinancementResult && matchFonctionResult && matchSearch;
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