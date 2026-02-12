import React, { useState, useEffect, useMemo } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarketLogic } from '../hooks/useMarketLogic';
import { useMarketLifecycle } from '../hooks/useMarketLifecycle';
import {
  Search, ExternalLink, X, FileBox, FileCheck, AlertTriangle,
  UserCheck, Banknote, Gavel, Ban,
  Clock, Info as InfoIcon, Activity
} from 'lucide-react';
import { JALONS_PPM_CONFIG, JALONS_LABELS, JALONS_GROUPS, JALONS_PPM_KEYS, getJalonsGroupsForMarket } from '../constants';
import { formatDate, getLateStatus, calculateDaysBetween } from '../utils/date';
import { useSearchParams } from 'react-router-dom';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { FileManager } from '../components/FileManager';
import { MultiFileManager } from '../components/MultiFileManager';
import { Marche, RecoursStatut } from '../types';
import { getRecoursTypeLabel, getRecoursStatusLabel, getRecoursStatusColor, isSuspensif } from '../utils/recours';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import { TruncatedText } from '../components/TruncatedText';

// --- STYLES DÉFINIS COMME HOOKS (SANS PARENTHÈSES À LA FIN) ---

const useLightTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #3b82f6 #FDFEFE; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #FDFEFE; } .ant-table-body::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; } }
    .ant-table-thead > tr > th { background: #e0eaf7 !important; color: #1a2333 !important; border-bottom: 2px solid #b8cce8 !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; position: sticky; top: 0; z-index: 2 !important; }
    .ant-table-thead > tr > th.th-fixed-priority { z-index: 100 !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #1a2333 !important; }
    .ant-table-tbody > tr > td { background: #FDFEFE !important; color: #1a2333 !important; border-bottom: 1px solid #e5e7eb !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #f3f4f6 !important; }
    .ant-table-thead > tr > th.ant-table-cell-fix-left, .ant-table-thead > tr > th.ant-table-cell-fix-right { background: #e0eaf7 !important; z-index: 3 !important; }
    .ant-table-tbody > tr > td.ant-table-cell-fix-left, .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: #FDFEFE !important; z-index: 1 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #f3f4f6 !important; }
    .ant-table-tbody > tr.highlighted-row > td, .ant-table-tbody > tr.highlighted-row > .ant-table-cell-fix-left, .ant-table-tbody > tr.highlighted-row > .ant-table-cell-fix-right { background: #fef3c7 !important; }
    .date-cell { font-size: 12px !important; font-weight: 700 !important; }
    .date-prevue, .date-realisee-pending { color: #64748b !important; }
    .date-realisee-done { color: #22c55e !important; }
    .date-realisee-late { color: #ef4444 !important; }
    .ant-table-tbody > tr > td .text-white { color: #ffffff !important; }
    .ant-table-tbody > tr > td .bg-warning .text-black, .ant-table-tbody > tr > td .bg-warning.text-black { color: #000000 !important; }
  `,
}));

const useDarkTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #3b82f6 #1a2333; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #1a2333; } .ant-table-body::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; } }
    .ant-table-thead > tr > th { background: #0d1a30 !important; color: #ffffff !important; border-bottom: 2px solid rgba(59,130,246,0.3) !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; position: sticky; top: 0; z-index: 2 !important; }
    .ant-table-thead > tr > th.th-fixed-priority { z-index: 100 !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #ffffff !important; }
    .ant-table-tbody > tr > td { background: #1e293b !important; color: #ffffff !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #334155 !important; }
    .ant-table-thead > tr > th.ant-table-cell-fix-left, .ant-table-thead > tr > th.ant-table-cell-fix-right { background: #0d1a30 !important; z-index: 3 !important; }
    .ant-table-tbody > tr > td.ant-table-cell-fix-left, .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: #1e293b !important; z-index: 1 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #334155 !important; }
    .ant-table-tbody > tr.highlighted-row > td, .ant-table-tbody > tr.highlighted-row > .ant-table-cell-fix-left, .ant-table-tbody > tr.highlighted-row > .ant-table-cell-fix-right { background: #422006 !important; }
    .date-cell { font-size: 12px !important; font-weight: 700 !important; }
    .date-prevue, .date-realisee-pending { color: #94a3b8 !important; }
    .date-realisee-done { color: #22c55e !important; }
    .date-realisee-late { color: #ef4444 !important; }
    .ant-table-tbody > tr > td .text-white { color: #ffffff !important; }
    .ant-table-tbody > tr > td .bg-warning .text-black, .ant-table-tbody > tr > td .bg-warning.text-black { color: #000000 !important; }
  `,
}));

// --------------------------------------------------------------------------------

const CircularProgress = ({ percent, color, icon: Icon }: { percent: number, color: string, icon: any }) => {
  const { theme } = useTheme();
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg viewBox="0 0 192 192" className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="opacity-10" />
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={`${color} transition-all duration-1000 ease-out`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
        <Icon size={28} strokeWidth={theme.iconStroke} className={`${color} mb-1 ${theme.iconStyle}`} />
        <span className={`text-2xl font-black ${theme.textMain} leading-none`}>{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

// Clés des jalons à griser si le marché est infructueux (après prop_attribution)
const JALONS_AFTER_INFRUCTUEUX = [
  'negociation_contractuelle', 'avis_conforme_ca', 'ano_bailleur_attrib',
  'souscription', 'saisine_cipm_projet',
  'ano_bailleur_projet', 'signature_marche'
];

// Groupes de jalons PPM pour colonnes repliables
const PPM_JALON_GROUPS = [
  { id: 'preparation', label: 'Préparation', keys: ['saisine_cipm', 'ano_bailleur_dao', 'lancement_ao'] },
  { id: 'consultation', label: 'Consultation', keys: ['depouillement'] },
  { id: 'attribution', label: 'Attribution', keys: ['prop_attribution', 'negociation_contractuelle', 'ano_bailleur_attrib', 'avis_conforme_ca', 'publication'] },
  { id: 'contractualisation', label: 'Contract.', keys: ['souscription', 'saisine_cipm_projet', 'ano_bailleur_projet', 'signature_marche'] },
];

// Fonction pour calculer l'état dynamique basé sur la dernière date renseignée
const getEtatDynamique = (m: Marche): { label: string; color: string } => {
  // Statuts terminaux prioritaires
  if (m.is_annule) return { label: "Annulé", color: "bg-danger text-white" };
  if (m.is_infructueux) return { label: "Infructueux", color: "bg-warning text-black" };
  if (m.dates_realisees?.signature_marche) return { label: "Signé", color: "bg-success text-white" };

  // Parcourir les jalons dans l'ordre inverse pour trouver le dernier renseigné
  const jalonsOrder = JALONS_PPM_KEYS;
  for (let i = jalonsOrder.length - 1; i >= 0; i--) {
    const key = jalonsOrder[i];
    if (m.dates_realisees?.[key as keyof typeof m.dates_realisees]) {
      return { label: JALONS_LABELS[key] || key, color: "bg-primary/10 text-primary" };
    }
  }

  return { label: "Non lancé", color: "bg-slate-100 text-slate-600" };
};

export const PPMView: React.FC = () => {
  const { markets } = useMarkets();
  const { projects } = useProjects();
  useAuth();
  const { theme } = useTheme();

  // Détection du mode sombre pour les styles du tableau
  const isDarkTheme = theme.mode === 'dark';

  // --- APPEL CORRECT DES HOOKS DE STYLE ---
  const { styles: lightStyles } = useLightTableStyles();
  const { styles: darkStyles } = useDarkTableStyles();
  
  // Sélection du bon style selon le thème
  const styles = isDarkTheme ? darkStyles : lightStyles;
  // ----------------------------------------

  // Utilisation du Hook de logique
  const { isJalonApplicable, isJalonActive, isPhaseAccessible } = useMarketLogic();

  // Hook pour le cycle de vie des marchés (filtrage passation vs exécution)
  const { isInPassation } = useMarketLifecycle(markets, projects);

  // Année en cours par défaut
  const currentYear = new Date().getFullYear().toString();

  const [selectedFinancement, setSelectedFinancement] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [detailMarketId, setDetailMarketId] = useState<string | null>(null);
  const [scrolledId, setScrolledId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('ppmview_hidden_cols'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };
  const toggleColumnVisibility = (key: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('ppmview_hidden_cols', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const highlightedId = searchParams.get('id');

    if (highlightedId) {
      const targetMarket = markets.find(m => m.id === highlightedId);
      if (targetMarket) {
        const parentProject = projects.find(p => p.id === targetMarket.projet_id);
        if (parentProject) {
          setSelectedYear(parentProject.exercice.toString());
          const financement = parentProject.sourceFinancement === 'BUDGET_EDC'
            ? 'Budget EDC'
            : parentProject.nomBailleur || '';
          setSelectedFinancement(financement);
        }
        // Réinitialiser les filtres qui pourraient masquer le marché
        setSearchTerm('');
        setStatusFilter('all');

        // Calculer la page de pagination où se trouve le marché
        const allFiltered = markets
          .filter(m => {
            const pp = projects.find(p => p.id === m.projet_id);
            const matchYear = parentProject ? pp?.exercice.toString() === parentProject.exercice.toString() : true;
            let matchFinancement = true;
            if (parentProject) {
              const fin = parentProject.sourceFinancement === 'BUDGET_EDC' ? 'Budget EDC' : parentProject.nomBailleur || '';
              if (fin) {
                if (fin === 'Budget EDC') matchFinancement = m.source_financement === 'BUDGET_EDC';
                else matchFinancement = m.nom_bailleur === fin || pp?.nomBailleur === fin;
              }
            }
            return matchYear && matchFinancement;
          })
          .sort((a, b) => parseInt(a.numDossier?.replace(/\D/g, '') || '0', 10) - parseInt(b.numDossier?.replace(/\D/g, '') || '0', 10));

        const targetIndex = allFiltered.findIndex(m => m.id === highlightedId);
        if (targetIndex >= 0) {
          setCurrentPage(Math.floor(targetIndex / 15) + 1);
        }
      }
      setScrolledId(highlightedId);
      const timer = setTimeout(() => {
        const element = document.getElementById(`market-row-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('id');
          setSearchParams(newParams, { replace: true });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [searchParams, markets, projects]);

  // Réinitialiser le financement si celui sélectionné n'est plus disponible pour l'année choisie
  useEffect(() => {
    if (selectedFinancement) {
      const availableFinancements = new Set<string>();

      const filteredProjects = selectedYear
        ? projects.filter(p => p.exercice.toString() === selectedYear)
        : projects;

      const filteredMarketsForCheck = selectedYear
        ? markets.filter(m => {
            const parentProject = projects.find(p => p.id === m.projet_id);
            return parentProject?.exercice.toString() === selectedYear;
          })
        : markets;

      filteredProjects.forEach(p => {
        if (p.sourceFinancement === 'BUDGET_EDC') {
          availableFinancements.add('Budget EDC');
        } else if (p.nomBailleur) {
          availableFinancements.add(p.nomBailleur);
        }
      });

      filteredMarketsForCheck.forEach(m => {
        if (m.source_financement === 'BUDGET_EDC') {
          availableFinancements.add('Budget EDC');
        } else if (m.nom_bailleur) {
          availableFinancements.add(m.nom_bailleur);
        }
      });

      if (!availableFinancements.has(selectedFinancement)) {
        setSelectedFinancement('');
      }
    }
  }, [selectedYear, projects, markets]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString()))) as string[];
    return years.sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const yearOptions = [{ value: '', label: 'Tous les exercices' }, ...availableYears.map(y => ({ value: y, label: y }))];

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

  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      // MODIFIÉ : Inclure tous les marchés (signés, infructueux, annulés)
      // pour avoir une vue complète du plan de passation
      const parentProject = projects.find(p => p.id === m.projet_id);

      // Filtre par Année
      const matchYear = !selectedYear || parentProject?.exercice.toString() === selectedYear;

      // Filtre par Financement (Budget EDC ou nom du bailleur - niveau marché ou projet)
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

      // Filtre par recherche texte
      const matchSearch = (m.numDossier || "").toLowerCase().includes(searchTerm.toLowerCase()) || (m.objet || "").toLowerCase().includes(searchTerm.toLowerCase());

      // Exclure les marchés résiliés (visibles uniquement dans Exécution des Marchés)
      if (m.execution?.is_resilie) return false;

      // Filtre par statut rapide
      let matchStatus = true;
      if (statusFilter !== 'all') {
        if (statusFilter === 'signe') matchStatus = !!m.dates_realisees?.signature_marche;
        else if (statusFilter === 'annule') matchStatus = !!m.is_annule;
        else if (statusFilter === 'infructueux') matchStatus = !!m.is_infructueux;
        else if (statusFilter === 'non_lance') {
          const datesRealisees = m.dates_realisees || {};
          matchStatus = !Object.values(datesRealisees).some(v => v);
        }
        else if (statusFilter === 'en_cours') matchStatus = !m.dates_realisees?.signature_marche && !m.is_annule && !m.is_infructueux && Object.values(m.dates_realisees || {}).some(v => v);
      }

      return matchFinancement && matchSearch && matchYear && matchStatus;
    });
  }, [markets, projects, selectedFinancement, selectedYear, searchTerm, isInPassation, statusFilter]);

  // Configuration des colonnes pour Ant Design Table
  const tableColumns: TableColumnsType<Marche> = useMemo(() => {
    // Colonnes de base
    const baseColumns: TableColumnsType<Marche> = [
      {
        title: 'Dossier & Objet',
        dataIndex: 'numDossier',
        key: 'dossier',
        fixed: 'left',
        width: 420,
        onHeaderCell: () => ({ className: 'th-fixed-priority' }),

        render: (_, m) => {
          const isResilie = !!m.execution.is_resilie;
          const isClosed = !!m.execution.doc_pv_definitif_id;
          return (
            <div className="flex flex-col gap-2">
              <span className={`text-[10px] font-black px-3 py-1 ${theme.buttonShape} w-fit ${m.is_annule ? 'bg-danger text-white' : m.is_infructueux ? 'bg-warning text-black' : 'bg-primary text-white'}`}>{m.numDossier}</span>
              <TruncatedText text={m.objet} className={`text-xs font-black ${theme.textMain} line-clamp-2 uppercase whitespace-normal leading-snug`} />
              <div className="flex flex-wrap gap-1 mt-1">
                {isResilie && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-tighter shadow-sm animate-pulse">Marché Résilié</span>}
                {m.is_annule && <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black rounded uppercase tracking-tighter">Dossier Annulé</span>}
                {m.is_infructueux && <span className="px-2 py-0.5 bg-warning text-black text-[8px] font-black rounded uppercase tracking-tighter">Dossier Infructueux</span>}
                {isClosed && !isResilie && <span className="px-2 py-0.5 bg-green-600 text-white text-[8px] font-black rounded uppercase tracking-tighter">Marché exécuté & clôturé</span>}
              </div>
            </div>
          );
        },
      },
      {
        title: 'Budget Estimé',
        dataIndex: 'montant_prevu',
        key: 'budget',
        width: 180,
        align: 'right',
        sorter: (a: Marche, b: Marche) => (a.montant_prevu || 0) - (b.montant_prevu || 0),
        render: (value) => (
          <span className={`text-sm font-black ${theme.textMain}`}>
            {(value || 0).toLocaleString()} <span className={`text-[9px] ${theme.textSecondary}`}>FCFA</span>
          </span>
        ),
      },
      {
        title: 'Budget Signé',
        dataIndex: 'montant_ttc_reel',
        key: 'budget_signe',
        width: 180,
        align: 'right',
        sorter: (a: Marche, b: Marche) => (a.montant_ttc_reel || 0) - (b.montant_ttc_reel || 0),
        render: (value) => (
          <span className={`text-sm font-black ${theme.textMain}`}>
            {value ? (<>{value.toLocaleString()} <span className={`text-[9px] ${theme.textSecondary}`}>FCFA</span></>) : <span className={`text-[10px] ${theme.textSecondary}`}>-</span>}
          </span>
        ),
      },
      {
        title: 'Fonction Analytique',
        dataIndex: 'fonction',
        key: 'fonction',
        width: 150,
        render: (value) => (
          <span className={`text-[10px] font-black ${theme.textMain} uppercase`}>
            {value || '-'}
          </span>
        ),
      },
      {
        title: 'Activité',
        dataIndex: 'activite',
        key: 'activite',
        width: 150,
        render: (value) => (
          <TruncatedText text={value || '-'} className={`text-[10px] font-bold ${theme.textSecondary} uppercase line-clamp-2`} />
        ),
      },
      {
        title: 'Financement',
        dataIndex: 'source_financement',
        key: 'financement',
        width: 150,
        render: (_, m) => {
          const label = m.source_financement === 'BUDGET_EDC'
            ? 'Budget EDC'
            : m.nom_bailleur || 'Bailleur';
          return (
            <span className={`text-[9px] font-black px-2 py-1 rounded ${m.source_financement === 'BUDGET_EDC' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
              {label}
            </span>
          );
        },
      },
      {
        title: 'État',
        key: 'etat',
        width: 180,
        render: (_, m) => {
          const etat = getEtatDynamique(m);
          const icon = m.is_annule ? <Ban size={10} className="inline mr-1" />
            : m.is_infructueux ? <AlertTriangle size={10} className="inline mr-1" />
            : m.dates_realisees?.signature_marche ? <FileCheck size={10} className="inline mr-1" />
            : <Clock size={10} className="inline mr-1" />;
          return (
            <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg ${etat.color} inline-flex items-center gap-1`}>
              {icon}{etat.label}
            </span>
          );
        },
      },
    ];

    // Colonnes des jalons (groupées et repliables)
    const jalonColumns: TableColumnsType<Marche> = PPM_JALON_GROUPS.flatMap(group => {
      const isExpanded = expandedGroups.has(group.id);

      if (!isExpanded) {
        return [{
          title: (<span onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleGroup(group.id); }} className="cursor-pointer select-none whitespace-nowrap">{'\u25B8'} {group.label}</span>),
          key: `group_${group.id}`,
          width: 140,
          align: 'center' as const,
          render: (_: any, m: Marche) => {
            const applicable = group.keys.filter(k => isJalonApplicable(m, k) && !(m.is_infructueux && JALONS_AFTER_INFRUCTUEUX.includes(k)));
            const completed = applicable.filter(k => m.dates_realisees[k as keyof typeof m.dates_realisees]).length;
            if (applicable.length === 0) return <span className="text-[10px] opacity-30 italic">N/A</span>;
            const pct = Math.round((completed / applicable.length) * 100);
            return (
              <div className="flex items-center gap-1.5 justify-center">
                <div className="w-10 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.2)' }}>
                  <div className={`h-full rounded-full ${pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${pct}%` }} />
                </div>
                <span className={`text-[9px] font-black ${pct === 100 ? 'text-green-500' : theme.textSecondary}`}>{completed}/{applicable.length}</span>
              </div>
            );
          },
        }] as TableColumnsType<Marche>;
      }

      return [{
        title: (<span onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleGroup(group.id); }} className="cursor-pointer select-none whitespace-nowrap">{'\u25BE'} {group.label}</span>),
        key: `group_${group.id}`,
        children: group.keys.map(key => {
          const jalon = JALONS_PPM_CONFIG.find(j => j.key === key)!;
          return {
            title: jalon.label,
            key: jalon.key,
            children: [
              {
                title: 'Prévue',
                dataIndex: ['dates_prevues', jalon.key],
                key: `${jalon.key}_prevue`,
                width: 110,
                align: 'center' as const,
                render: (_: any, m: Marche) => {
                  const isGrayed = m.is_infructueux && JALONS_AFTER_INFRUCTUEUX.includes(jalon.key);
                  if (!isJalonApplicable(m, jalon.key)) return <span className="date-cell text-[10px] opacity-30 italic">N/A</span>;
                  if (isGrayed) return <span className="date-cell text-[10px] opacity-30 italic">-</span>;
                  const p = m.dates_prevues[jalon.key as keyof typeof m.dates_prevues];
                  return <span className="date-cell date-prevue">{formatDate(p || null)}</span>;
                },
              },
              {
                title: 'Réalisée',
                dataIndex: ['dates_realisees', jalon.key],
                key: `${jalon.key}_realisee`,
                width: 110,
                align: 'center' as const,
                render: (_: any, m: Marche) => {
                  const isGrayed = m.is_infructueux && JALONS_AFTER_INFRUCTUEUX.includes(jalon.key);
                  if (!isJalonApplicable(m, jalon.key)) return null;
                  if (isGrayed) return <span className="date-cell text-[10px] opacity-30 italic">-</span>;
                  const p = m.dates_prevues[jalon.key as keyof typeof m.dates_prevues];
                  const r = m.dates_realisees[jalon.key as keyof typeof m.dates_realisees];
                  const comment = m.comments?.[jalon.key];
                  const s = getLateStatus(p || null, r || null);
                  const statusClass = s === 'late' ? 'date-realisee-late' : s === 'done' ? 'date-realisee-done' : 'date-realisee-pending';
                  return (
                    <div title={comment ? `OBSERVATION : ${comment}` : undefined} className={`date-cell ${statusClass}`}>
                      <div className="flex items-center justify-center gap-1.5">
                        {formatDate(r || null)}
                        {comment && <InfoIcon size={14} className="text-blue-500 cursor-help" />}
                      </div>
                    </div>
                  );
                },
              },
            ],
          };
        }),
      }] as TableColumnsType<Marche>;
    });

    // Colonnes finales
    const endColumns: TableColumnsType<Marche> = [
      {
        title: 'Synthèse Délais',
        key: 'synthese',
        width: 200,
        render: (_, m) => {
          const delaiPrevu = (m.dates_prevues.saisine_cipm && m.dates_prevues.signature_marche) ? calculateDaysBetween(m.dates_prevues.saisine_cipm, m.dates_prevues.signature_marche) : null;

          // Calcul du délai réalisé: si pas de signature, utiliser la date du jour
          const today = new Date().toISOString().split('T')[0];
          const dateFinRealise = m.dates_realisees.signature_marche || today;
          const delaiRealise = m.dates_realisees.saisine_cipm ? calculateDaysBetween(m.dates_realisees.saisine_cipm, dateFinRealise) : null;
          const isProvisoire = m.dates_realisees.saisine_cipm && !m.dates_realisees.signature_marche;

          return (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter"><span className={theme.textSecondary}>Prévu :</span><span className={theme.textMain}>{delaiPrevu !== null ? `${delaiPrevu} j` : '-'}</span></div>
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                <span className={theme.textSecondary}>Réalisé :</span>
                <span className={delaiRealise !== null ? (isProvisoire ? 'text-warning' : theme.textAccent) : theme.textSecondary}>
                  {delaiRealise !== null ? `${delaiRealise} j` : '-'}
                  {isProvisoire && <span className="text-[8px] ml-1">(en cours)</span>}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        title: 'Détails',
        key: 'details',
        fixed: 'right',
        width: 100,
        align: 'center',
        onHeaderCell: () => ({ className: 'th-fixed-priority' }),

        render: (_, m) => (
          <button onClick={() => setDetailMarketId(m.id)} className={`p-3 ${theme.buttonSecondary} ${theme.buttonShape} transition-colors`}>
            <ExternalLink size={18} />
          </button>
        ),
      },
    ];

    const filteredBaseColumns = baseColumns.filter(c => !hiddenColumns.has(c.key as string));
    return [...filteredBaseColumns, ...jalonColumns, ...endColumns];
  }, [theme, isJalonApplicable, setDetailMarketId, isDarkTheme, expandedGroups, hiddenColumns]);

  // Données du tableau avec key pour Ant Design - TRI PAR NUMÉRO DE DOSSIER CROISSANT
  const tableData = useMemo(() =>
    [...filteredMarkets]
      .sort((a, b) => {
        // Extraire les parties numériques du numDossier pour un tri naturel
        const numA = parseInt(a.numDossier?.replace(/\D/g, '') || '0', 10);
        const numB = parseInt(b.numDossier?.replace(/\D/g, '') || '0', 10);
        return numA - numB;
      })
      .map(m => ({ ...m, key: m.id })),
  [filteredMarkets]);

  // Fonction utilitaire pour vérifier si un jalon a au moins un document
  const jalonHasDocument = (docValue: string | string[] | undefined): boolean => {
    if (!docValue) return false;
    if (Array.isArray(docValue)) return docValue.length > 0;
    return !!docValue;
  };

  const calculateProgress = (m: Marche) => {
    const allBaseKeys = getJalonsGroupsForMarket(m.type_ouverture || '2_temps').flatMap(g => g.keys);

    // Filtrer les étapes pertinentes avec le Hook
    const relevantKeys = allBaseKeys.filter(key => {
        // Règle 1 : Applicabilité (ANO)
        if (!isJalonApplicable(m, key)) return false;

        // Règle 2 : Conditionnels
        if (key === 'additif' && !m.has_additif) return false;
        if (key === 'preselection_doc' && !m.has_preselection) return false;
        if (key === 'demande_eclaircissement_doc' && !m.has_demande_eclaircissement) return false;
        if (key === 'reponse_eclaircissement_doc' && !m.has_reponse_eclaircissement) return false;

        // Règle 3 : Exceptions graphiques (non comptées dans le % global)
        if (key === 'annule' || key === 'infructueux' || key === 'recours') return false;

        // Règle 4 : Exclure les champs non-documentaires du calcul
        if (key === 'titulaire' || key === 'montant_ttc_reel' || key === 'delai_contractuel') return false;

        return true;
    });

    // Calcul basé UNIQUEMENT sur les documents (pas les dates)
    const completedCount = relevantKeys.filter(k => {
      return jalonHasDocument(m.docs?.[k]);
    }).length;

    const passPercent = relevantKeys.length > 0 ? (completedCount / relevantKeys.length) * 100 : 0;

    const exec = m.execution;
    const execWeight = [exec.ref_contrat, exec.doc_notif_contrat_id, exec.doc_notif_os_id, exec.doc_pv_provisoire_id].filter(Boolean).length;
    return { passation: Math.min(passPercent, 100), execution: (execWeight / 4) * 100 };
  };

  // Statut basé uniquement sur les documents
  const getDocumentStatus = (docId: string | string[] | undefined) => {
    if (jalonHasDocument(docId)) {
      return { label: "Document disponible", color: "text-green-500 font-black", icon: <FileCheck size={12}/> };
    }
    return { label: "En attente de document", color: "text-slate-500 italic", icon: <Clock size={12}/> };
  };

  const selectedMarket = markets.find(m => m.id === detailMarketId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">
      {/* HEADER & FILTRES */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 relative z-20">
        <div className="border-l-4 border-primary pl-4">
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`} style={{ fontFamily: "'Poppins', sans-serif" }}>Suivi PPM</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Registre complet consolidé par exercice.</p>
        </div>
        <div className={`${theme.card} p-3 flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-40`}>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
          <div className="w-full md:w-64"><CustomBulleSelect label="" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} /></div>

          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.mode === 'dark' ? 'text-white' : theme.textSecondary}`} size={16} strokeWidth={theme.iconStroke} />
            <input type="text" placeholder="Rechercher..." className={`${theme.input} pl-10 pr-4 py-2.5 w-full font-black ${theme.mode === 'dark' ? 'text-white' : ''}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* FILTRES RAPIDES & SÉLECTEUR DE COLONNES */}
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="w-48">
          <CustomBulleSelect
            label=""
            value={statusFilter}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'non_lance', label: 'Non lancés' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'signe', label: 'Signés' },
              { value: 'infructueux', label: 'Infructueux' },
              { value: 'annule', label: 'Annulés' },
            ]}
            onChange={setStatusFilter}
          />
        </div>
        <div className="relative">
          <button onClick={() => setShowColumnSelector(!showColumnSelector)} className={`px-3 py-1.5 text-[10px] font-black uppercase ${theme.card} ${theme.textSecondary} rounded-lg border border-white/10`}>Colonnes</button>
          {showColumnSelector && (
            <div className={`absolute right-0 top-full mt-1 ${theme.card} shadow-2xl rounded-lg p-3 z-50 min-w-[200px] border border-white/10`}>
              {[
                { key: 'budget', label: 'Budget Estimé' },
                { key: 'budget_signe', label: 'Budget Signé' },
                { key: 'fonction', label: 'Fonction Analytique' },
                { key: 'activite', label: 'Activité' },
                { key: 'financement', label: 'Financement' },
                { key: 'etat', label: 'État' },
                { key: 'synthese', label: 'Synthèse Délais' },
              ].map(col => (
                <label key={col.key} className={`flex items-center gap-2 py-1.5 text-[11px] font-bold ${theme.textMain} cursor-pointer`}>
                  <input type="checkbox" checked={!hiddenColumns.has(col.key)} onChange={() => toggleColumnVisibility(col.key)} className="rounded" />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TABLEAU */}
      <div className={`${theme.card} flex flex-col relative overflow-hidden z-10`}>
        <Table<Marche>
          className={styles.customTable}
          columns={tableColumns}
          dataSource={tableData}
          scroll={{ x: 'max-content', y: 55 * 10 }}
          pagination={{ current: currentPage, pageSize: 15, onChange: (page: number) => setCurrentPage(page), showTotal: (total: number, range: [number, number]) => <span className={`text-xs font-bold ${theme.textSecondary}`}>{range[0]}-{range[1]} sur {total} marchés</span>, showSizeChanger: false }}
          bordered={false}
          size="middle"
          rowClassName={(record) => {
            const isAborted = record.is_annule || record.is_infructueux;
            const isHighlighted = scrolledId === record.id;
            return `cursor-pointer transition-all ${isAborted ? 'opacity-80' : ''} ${isHighlighted ? 'highlighted-row' : ''}`;
          }}
          onRow={(record) => ({
            id: `market-row-${record.id}`,
            onDoubleClick: () => setDetailMarketId(record.id),
          })}
          locale={{ emptyText: <div className="p-20 text-center font-black uppercase text-slate-400">Aucun marché trouvé</div> }}
        />
      </div>

      {/* MODAL DE DÉTAILS */}
      {selectedMarket && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
           <div className={`relative w-full max-w-[900px] h-[95vh] ${theme.card} shadow-2xl overflow-hidden flex flex-col animate-zoom-in border border-white/10`}>
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 ${theme.card} flex items-center justify-center font-black text-xl ${theme.textAccent}`}>{selectedMarket.numDossier.charAt(0)}</div>
                  <div className="max-w-3xl">
                    <h2 className={`text-xl font-black ${theme.textMain} uppercase leading-none`}>{selectedMarket.numDossier}</h2>
                    <TruncatedText text={selectedMarket.objet} as="p" className={`text-sm font-bold ${theme.textSecondary} mt-1 line-clamp-1 uppercase`} />
                  </div>
                </div>
                <button onClick={() => setDetailMarketId(null)} className={`${theme.buttonSecondary} ${theme.buttonShape} px-6 py-4 flex items-center gap-3 font-black text-xs uppercase transition-all`}>Fermer <X size={18}/></button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="px-12 py-5 bg-black/5 border-b border-white/5 flex items-center justify-between">
                      <h3 className={`text-sm font-black uppercase tracking-[0.15em] ${theme.textAccent}`}>Phase Passation détaillée</h3>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 ${theme.card} text-[9px] font-black uppercase`}>{selectedMarket.source_financement}</span>
                        <span className={`px-3 py-1 ${theme.card} text-[9px] font-black uppercase`}>{selectedMarket.type_ouverture === '1_temps' ? 'Ouverture 1 temps' : 'Ouverture 2 temps'}</span>
                      </div>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                      <div className="mb-12 flex justify-center"><CircularProgress percent={calculateProgress(selectedMarket).passation} color={theme.textAccent} icon={FileBox} /></div>
                      <div className="space-y-10">
                         {/* ... Alerts ... */}
                         {(selectedMarket.is_annule || selectedMarket.is_infructueux || selectedMarket.has_recours) && (
                           <div className="p-8 rounded-[2rem] bg-slate-950 border border-white/10 space-y-6 shadow-2xl animate-in slide-in-from-top-4">
                              <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[11px] tracking-widest"><AlertTriangle size={20}/> Statut Spécifique du Dossier</div>
                              <div className="space-y-4">
                                 {selectedMarket.is_annule && (
                                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                      <div className="flex items-center gap-2 text-danger font-black uppercase text-[10px]"><Ban size={14}/> Annulation Validée</div>
                                      <p className="text-[11px] font-bold text-slate-400 italic">Motif : {selectedMarket.motif_annulation || "Non renseigné"}</p>
                                      <FileManager existingDocId={Array.isArray(selectedMarket.docs?.['annule_doc']) ? selectedMarket.docs?.['annule_doc'][0] : selectedMarket.docs?.['annule_doc']} onUpload={() => {}} disabled />
                                   </div>
                                 )}
                                 {selectedMarket.is_infructueux && (
                                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                      <div className="flex items-center gap-2 text-warning font-black uppercase text-[10px]"><Activity size={14}/> Dossier déclaré Infructueux</div>
                                      <FileManager existingDocId={Array.isArray(selectedMarket.docs?.['infructueux_doc']) ? selectedMarket.docs?.['infructueux_doc'][0] : selectedMarket.docs?.['infructueux_doc']} onUpload={() => {}} disabled />
                                   </div>
                                 )}
                                 {selectedMarket.has_recours && (
                                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                      <div className="flex items-center gap-2 text-blue-400 font-black uppercase text-[10px]"><Gavel size={14}/> Recours Introduit</div>
                                      {selectedMarket.recours ? (
                                        <div className="space-y-2">
                                          <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase">
                                              {getRecoursTypeLabel(selectedMarket.recours.type)}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${getRecoursStatusColor(selectedMarket.recours.statut)}`}>
                                              {getRecoursStatusLabel(selectedMarket.recours.statut)}
                                            </span>
                                            {isSuspensif(selectedMarket.recours.type) && (
                                              <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[9px] font-black uppercase">Suspensif</span>
                                            )}
                                          </div>
                                          <p className="text-[10px] text-slate-500">Introduit le : {formatDate(selectedMarket.recours.date_introduction)}</p>
                                          {(selectedMarket.recours.statut === RecoursStatut.CLOTURE_REJETE || selectedMarket.recours.statut === RecoursStatut.CLOTURE_ACCEPTE) && (
                                            <p className="text-[11px] font-bold text-slate-400 italic">
                                              Verdict : {selectedMarket.recours.verdict || (selectedMarket.recours.statut === RecoursStatut.CLOTURE_ACCEPTE ? 'Accepté' : 'Rejeté')}
                                            </p>
                                          )}
                                          {selectedMarket.docs?.['recours_lettre'] && (
                                            <MultiFileManager existingDocIds={selectedMarket.docs['recours_lettre']} onAdd={() => {}} onRemove={() => {}} disabled />
                                          )}
                                        </div>
                                      ) : (
                                        <p className="text-[11px] font-bold text-slate-400 italic">Verdict : {selectedMarket.recours_issue || "En attente de jugement"}</p>
                                      )}
                                   </div>
                                 )}
                              </div>
                           </div>
                         )}

                         {getJalonsGroupsForMarket(selectedMarket.type_ouverture || '2_temps').filter(g => isPhaseAccessible(selectedMarket, g.id)).map((group) => (
                           <div key={group.id} className="space-y-4">
                              <h4 className={`text-xs font-black uppercase tracking-widest ${theme.textSecondary} px-4 py-1.5 rounded-full w-fit bg-black/5`}>{group.label}</h4>
                              <div className="grid grid-cols-1 gap-2">
                                 {group.keys.filter(key => {
                                    // Utilisation du Hook pour le filtrage
                                    if (!isJalonApplicable(selectedMarket, key)) return false;

                                    // Exceptions
                                    if (['annule', 'infructueux', 'recours'].includes(key)) return false;
                                    if (key === 'additif' && !selectedMarket.has_additif) return false;
                                    if (key === 'preselection_doc' && !selectedMarket.has_preselection) return false;
                                    if (key === 'demande_eclaircissement_doc' && !selectedMarket.has_demande_eclaircissement) return false;
                                    if (key === 'reponse_eclaircissement_doc' && !selectedMarket.has_reponse_eclaircissement) return false;

                                    // Arrêt workflow
                                    if (!isJalonActive(selectedMarket, key)) return false;

                                    return true;
                                 }).map(key => {
                                    const docId = selectedMarket.docs?.[key];
                                    const status = getDocumentStatus(docId);

                                    // Cas spéciaux sans documents
                                    if (key === 'titulaire') return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-all`}>
                                         <div className="flex items-center gap-4">
                                            <UserCheck className="text-primary" size={18} />
                                            <div><p className="text-xs font-black text-slate-400 uppercase leading-none">Titulaire</p><p className={`text-sm font-black ${theme.textMain} uppercase mt-1`}>{selectedMarket.titulaire || "Non attribué"}</p></div>
                                         </div>
                                      </div>
                                    );
                                    if (key === 'montant_ttc_reel') return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between bg-success/5 hover:bg-success/10 transition-all`}>
                                         <div className="flex items-center gap-4">
                                            <Banknote className="text-success" size={18} />
                                            <div><p className="text-xs font-black text-slate-400 uppercase leading-none">Montant marché signé</p><p className={`text-sm font-black ${theme.textMain} mt-1`}>{selectedMarket.montant_ttc_reel?.toLocaleString() || "-"} FCFA</p></div>
                                         </div>
                                      </div>
                                    );
                                    if (key === 'delai_contractuel') return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between bg-white/5 hover:bg-white/10 transition-all`}>
                                         <div className="flex items-center gap-4">
                                            <Clock className={theme.textAccent} size={18} />
                                            <div><p className="text-xs font-black text-slate-400 uppercase leading-none">Délai contractuel d'exécution</p><p className={`text-sm font-black ${theme.textMain} mt-1`}>{selectedMarket.delai_contractuel || "-"}</p></div>
                                         </div>
                                      </div>
                                    );

                                    // Rendu standard : Nom du jalon + État document + Documents à télécharger
                                    return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all group`}>
                                         <div className="flex flex-col gap-0.5">
                                            <p className={`text-xs font-black ${theme.textMain} uppercase leading-none`}>{JALONS_LABELS[key] || key}</p>
                                            <span className={`text-[10px] uppercase tracking-tighter flex items-center gap-1.5 ${status.color}`}>
                                               {status.icon} {status.label}
                                            </span>
                                         </div>
                                         <MultiFileManager existingDocIds={docId} onAdd={() => {}} onRemove={() => {}} viewOnly />
                                      </div>
                                    );
                                 })}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};