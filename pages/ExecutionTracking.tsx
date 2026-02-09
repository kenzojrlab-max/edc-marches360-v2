import React, { useState, useMemo } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarketLifecycle } from '../hooks/useMarketLifecycle';
import { useMarketFilter } from '../hooks/useMarketFilter';
import {
  Search, X, Activity, Lock, FileText, TrendingUp, AlertTriangle,
  CheckCircle2, Banknote, Clock, Receipt, ShieldCheck, Calendar,
  Layers, ExternalLink, MessageSquare
} from 'lucide-react';
import { formatDate } from '../utils/date';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { FileManager } from '../components/FileManager';
import { Marche } from '../types';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';
import { TruncatedText } from '../components/TruncatedText';

// --- STYLES POUR LE TABLEAU ---
const useLightTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #22c55e #FDFEFE; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #FDFEFE; } .ant-table-body::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 4px; } }
    .ant-table-thead > tr { position: static !important; z-index: auto !important; }
    .ant-table-thead > tr > th { background: #e6f4ea !important; color: #1a2333 !important; border-bottom: 2px solid #c3dfc9 !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; position: sticky; top: 0; z-index: 2 !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #1a2333 !important; }
    .ant-table-tbody > tr > td { background: #FDFEFE !important; color: #1a2333 !important; border-bottom: 1px solid #e5e7eb !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #f3f4f6 !important; }
    .ant-table-thead > tr > th.ant-table-cell-fix-left, .ant-table-thead > tr > th.ant-table-cell-fix-right { background: #e6f4ea !important; z-index: 100 !important; }
    .ant-table-tbody > tr > td.ant-table-cell-fix-left, .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: #FDFEFE !important; z-index: 5 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #f3f4f6 !important; }
  `,
}));

const useDarkTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #22c55e #1a2333; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #1a2333; } .ant-table-body::-webkit-scrollbar-thumb { background: #22c55e; border-radius: 4px; } }
    .ant-table-thead > tr { position: static !important; z-index: auto !important; }
    .ant-table-thead > tr > th { background: #0d2818 !important; color: #ffffff !important; border-bottom: 2px solid rgba(34,197,94,0.3) !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; position: sticky; top: 0; z-index: 2 !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #ffffff !important; }
    .ant-table-tbody > tr > td { background: #1e293b !important; color: #ffffff !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #334155 !important; }
    .ant-table-thead > tr > th.ant-table-cell-fix-left, .ant-table-thead > tr > th.ant-table-cell-fix-right { background: #0d2818 !important; z-index: 100 !important; }
    .ant-table-tbody > tr > td.ant-table-cell-fix-left, .ant-table-tbody > tr > td.ant-table-cell-fix-right { background: #1e293b !important; z-index: 5 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #334155 !important; }
  `,
}));

// --- COMPOSANT PROGRESS CIRCULAIRE ---
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

export const ExecutionTracking: React.FC = () => {
  const { markets } = useMarkets();
  const { projects } = useProjects();
  const { can } = useAuth();
  const { theme } = useTheme();

  // Détection du mode sombre pour les styles du tableau
  const isDarkTheme = theme.mode === 'dark';
  const { styles: lightStyles } = useLightTableStyles();
  const { styles: darkStyles } = useDarkTableStyles();
  const styles = isDarkTheme ? darkStyles : lightStyles;

  // Hook pour le cycle de vie des marchés
  const { getExecutionMarkets, isFromPreviousYear, getOriginYear, isClosed } = useMarketLifecycle(markets, projects);

  // Hook de filtrage
  const {
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    yearOptions,
    financementOptions
  } = useMarketFilter(markets, projects);

  const [detailMarketId, setDetailMarketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    try { const s = localStorage.getItem('exec_hidden_cols'); return s ? new Set(JSON.parse(s)) : new Set(); } catch { return new Set(); }
  });
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const toggleColumnVisibility = (key: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      localStorage.setItem('exec_hidden_cols', JSON.stringify([...next]));
      return next;
    });
  };

  // Marchés filtrés pour l'exécution
  const filteredMarkets = useMemo(() => {
    let result = getExecutionMarkets(selectedYear);

    // Filtre par financement
    if (selectedFinancement) {
      result = result.filter(m => {
        const parentProject = projects.find(p => p.id === m.projet_id);
        if (selectedFinancement === 'Budget EDC') {
          return m.source_financement === 'BUDGET_EDC';
        } else {
          const bailleurMarche = m.nom_bailleur;
          const bailleurProjet = parentProject?.nomBailleur;
          return bailleurMarche === selectedFinancement || bailleurProjet === selectedFinancement;
        }
      });
    }

    // Filtre par recherche texte
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m =>
        (m.numDossier || "").toLowerCase().includes(term) ||
        (m.objet || "").toLowerCase().includes(term)
      );
    }

    // Filtre par statut rapide
    if (statusFilter !== 'all') {
      result = result.filter(m => {
        if (statusFilter === 'resilie') return !!m.execution?.is_resilie;
        if (statusFilter === 'cloture') return isClosed(m);
        if (statusFilter === 'en_cours') return !isClosed(m) && !m.execution?.is_resilie;
        return true;
      });
    }

    return result;
  }, [getExecutionMarkets, selectedYear, selectedFinancement, searchTerm, projects, statusFilter, isClosed]);

  // Override des cellules header pour forcer le z-index sur les colonnes fixées
  const tableComponents = useMemo(() => ({
    header: {
      cell: (props: any) => {
        const isFixed = props.className && (props.className.includes('ant-table-cell-fix-left') || props.className.includes('ant-table-cell-fix-right'));
        const style = isFixed
          ? { ...props.style, zIndex: 100 }
          : { ...props.style, zIndex: 1 };
        return <th {...props} style={style} />;
      },
    },
  }), []);

  // Colonnes du tableau
  const tableColumns: TableColumnsType<Marche> = useMemo(() => {
    return [
      {
        title: 'Dossier & Objet',
        dataIndex: 'numDossier',
        key: 'dossier',
        fixed: 'left',
        width: 350,

        render: (_, m) => {
          const isResilie = !!m.execution?.is_resilie;
          const isClotured = isClosed(m);
          return (
            <div className="flex flex-col gap-2">
              <span className={`text-[10px] font-black px-3 py-1 ${theme.buttonShape} w-fit ${isResilie ? 'bg-danger text-white' : isClotured ? 'bg-success text-white' : 'bg-primary text-white'}`}>{m.numDossier}</span>
              <TruncatedText text={m.objet} className={`text-xs font-black ${theme.textMain} line-clamp-2 uppercase whitespace-normal leading-snug`} />
              <div className="flex flex-wrap gap-1 mt-1">
                {isResilie && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-tighter shadow-sm animate-pulse">Marché Résilié</span>}
                {isClotured && !isResilie && <span className="px-2 py-0.5 bg-green-600 text-white text-[8px] font-black rounded uppercase tracking-tighter">Marché Clôturé</span>}
              </div>
            </div>
          );
        },
      },
      {
        title: 'Origine PPM',
        key: 'origine',
        width: 120,
        align: 'center',
        render: (_, m) => {
          const originYear = getOriginYear(m);
          const isPrevious = isFromPreviousYear(m, selectedYear);
          return (
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg ${isPrevious ? 'bg-warning/20 text-warning' : 'bg-primary/10 text-primary'}`}>
              {originYear || '-'}
              {isPrevious && <span className="block text-[8px] font-bold opacity-70 mt-0.5">Antérieur</span>}
            </span>
          );
        },
      },
      {
        title: 'Titulaire',
        dataIndex: 'titulaire',
        key: 'titulaire',
        width: 200,
        render: (value) => (
          <TruncatedText text={value || '-'} className={`text-[11px] font-bold ${theme.textMain} uppercase line-clamp-2`} />
        ),
      },
      {
        title: 'Montant TTC Réel',
        dataIndex: 'montant_ttc_reel',
        key: 'montant',
        width: 180,
        align: 'right',
        sorter: (a: Marche, b: Marche) => (a.montant_ttc_reel || 0) - (b.montant_ttc_reel || 0),
        render: (value) => (
          <span className={`text-sm font-black ${theme.textMain}`}>
            {value ? value.toLocaleString() : '-'} <span className={`text-[9px] ${theme.textSecondary}`}>FCFA</span>
          </span>
        ),
      },
      {
        title: 'Date Signature',
        key: 'signature',
        width: 130,
        align: 'center',
        render: (_, m) => (
          <span className={`text-[11px] font-bold ${theme.textAccent}`}>
            {formatDate(m.dates_realisees?.signature_marche || null)}
          </span>
        ),
      },
      {
        title: 'Décomptes',
        key: 'decomptes',
        width: 130,
        align: 'center',
        render: (_, m) => {
          const count = m.execution?.decomptes?.length || 0;
          const total = m.execution?.decomptes?.reduce((acc, d) => acc + d.montant, 0) || 0;
          return (
            <div className="flex flex-col items-center">
              <span className={`text-[10px] font-black ${theme.textMain}`}>{count} décompte{count > 1 ? 's' : ''}</span>
              <span className="text-[9px] font-bold text-green-500">{total.toLocaleString()} FCFA</span>
            </div>
          );
        },
      },
      {
        title: 'Avenants',
        key: 'avenants',
        width: 100,
        align: 'center',
        render: (_, m) => {
          const count = m.execution?.avenants?.length || 0;
          return (
            <span className={`text-[10px] font-black px-2 py-1 rounded ${count > 0 ? 'bg-warning/20 text-warning' : 'bg-white/5 ' + theme.textSecondary}`}>
              {count} avenant{count > 1 ? 's' : ''}
            </span>
          );
        },
      },
      {
        title: 'Avancement',
        key: 'avancement',
        width: 150,
        align: 'center',
        render: (_, m) => {
          const exec = m.execution;
          const steps = [exec?.doc_notif_contrat_id, exec?.doc_notif_os_id, exec?.doc_pv_provisoire_id, exec?.doc_pv_definitif_id];
          const completed = steps.filter(Boolean).length;
          const percent = (completed / 4) * 100;
          return (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${percent}%` }} />
              </div>
              <span className="text-[10px] font-black text-green-500">{Math.round(percent)}%</span>
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

        render: (_: any, m: Marche) => (
          <button onClick={() => setDetailMarketId(m.id)} className={`p-3 ${theme.buttonSecondary} ${theme.buttonShape} transition-colors`}>
            <ExternalLink size={18} />
          </button>
        ),
      },
    ].filter(c => !hiddenColumns.has(c.key as string));
  }, [theme, selectedYear, getOriginYear, isFromPreviousYear, isClosed, hiddenColumns]);

  const tableData = useMemo(() =>
    filteredMarkets.map(m => ({ ...m, key: m.id })),
  [filteredMarkets]);

  const selectedMarket = markets.find(m => m.id === detailMarketId);

  const calculateExecutionProgress = (m: Marche) => {
    const exec = m.execution;
    const steps = [exec?.ref_contrat, exec?.doc_notif_contrat_id, exec?.doc_notif_os_id, exec?.doc_pv_provisoire_id, exec?.doc_pv_definitif_id];
    const completed = steps.filter(Boolean).length;
    return (completed / steps.length) * 100;
  };

  const getStepStatus = (date: string | undefined, docId: string | undefined) => {
    if (date && docId) return { label: "Étape Finalisée & Archivée", color: "text-green-500 font-black", icon: <CheckCircle2 size={12}/> };
    if (date) return { label: `Validé le ${formatDate(date)}`, color: "text-primary font-bold", icon: <CheckCircle2 size={12}/> };
    if (docId) return { label: "Preuve Enregistrée", color: "text-accent font-bold", icon: <CheckCircle2 size={12}/> };
    return { label: "En attente de confirmation", color: "text-slate-500 italic", icon: <Clock size={12}/> };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">
      {/* HEADER & FILTRES */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 relative z-20">
        <div className="border-l-4 border-green-500 pl-4">
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`} style={{ fontFamily: "'Poppins', sans-serif" }}>Suivi Exécution Marchés</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Marchés signés et en cours d'exécution.</p>
        </div>
        <div className={`${theme.card} p-3 flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-40`}>
          <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
            <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pilotage</span>
          </div>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} placeholder="Exercice" /></div>
          <div className="w-full md:w-64"><CustomBulleSelect label="" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} placeholder="Tous les financements" /></div>
          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.mode === 'dark' ? 'text-white' : theme.textSecondary}`} size={16} strokeWidth={theme.iconStroke} />
            <input type="text" placeholder="Rechercher..." className={`${theme.input} pl-10 pr-4 py-2.5 w-full font-black ${theme.mode === 'dark' ? 'text-white' : ''}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Marchés en Exécution</p>
            <h3 className={`text-2xl font-black ${theme.textMain}`}>{filteredMarkets.length}</h3>
          </div>
          <Activity size={24} className="text-green-500" />
        </div>
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Total Décomptes</p>
            <h3 className={`text-2xl font-black text-green-500`}>
              {filteredMarkets.reduce((acc, m) => acc + (m.execution?.decomptes?.reduce((a, d) => a + d.montant, 0) || 0), 0).toLocaleString()} <span className="text-sm">FCFA</span>
            </h3>
          </div>
          <Banknote size={24} className="text-green-500" />
        </div>
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Marchés Clôturés</p>
            <h3 className={`text-2xl font-black ${theme.textMain}`}>{filteredMarkets.filter(m => isClosed(m)).length}</h3>
          </div>
          <CheckCircle2 size={24} className="text-primary" />
        </div>
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div>
            <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Marchés Résiliés</p>
            <h3 className={`text-2xl font-black text-danger`}>{filteredMarkets.filter(m => m.execution?.is_resilie).length}</h3>
          </div>
          <AlertTriangle size={24} className="text-danger" />
        </div>
      </div>

      {/* FILTRES RAPIDES & SÉLECTEUR DE COLONNES */}
      <div className="flex items-center justify-between gap-4 px-2">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Tous' },
            { key: 'en_cours', label: 'En cours' },
            { key: 'cloture', label: 'Clôturés' },
            { key: 'resilie', label: 'Résiliés' },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${statusFilter === f.key ? 'bg-green-500 text-white shadow-lg' : `${theme.card} ${theme.textSecondary} hover:opacity-80`}`}>{f.label}</button>
          ))}
        </div>
        <div className="relative">
          <button onClick={() => setShowColumnSelector(!showColumnSelector)} className={`px-3 py-1.5 text-[10px] font-black uppercase ${theme.card} ${theme.textSecondary} rounded-lg border border-white/10`}>Colonnes</button>
          {showColumnSelector && (
            <div className={`absolute right-0 top-full mt-1 ${theme.card} shadow-2xl rounded-lg p-3 z-50 min-w-[200px] border border-white/10`}>
              {[
                { key: 'origine', label: 'Origine PPM' },
                { key: 'titulaire', label: 'Titulaire' },
                { key: 'montant', label: 'Montant TTC Réel' },
                { key: 'signature', label: 'Date Signature' },
                { key: 'decomptes', label: 'Décomptes' },
                { key: 'avenants', label: 'Avenants' },
                { key: 'avancement', label: 'Avancement' },
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
          components={tableComponents}
          scroll={{ x: 'max-content', y: 55 * 10 }}
          pagination={{ pageSize: 15, showTotal: (total: number, range: [number, number]) => <span className={`text-xs font-bold ${theme.textSecondary}`}>{range[0]}-{range[1]} sur {total} marchés</span>, showSizeChanger: false }}
          bordered={false}
          size="middle"
          rowClassName={(record) => {
            const isClotured = isClosed(record);
            return `cursor-pointer transition-all ${isClotured ? 'opacity-70' : ''}`;
          }}
          onRow={(record) => ({
            onDoubleClick: () => setDetailMarketId(record.id),
          })}
          locale={{ emptyText: <div className="p-20 text-center font-black uppercase text-slate-400">Aucun marché en exécution</div> }}
        />
      </div>

      {/* MODAL DE DÉTAILS - PHASE EXÉCUTION UNIQUEMENT */}
      {selectedMarket && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
          <div className={`relative w-full max-w-[900px] h-[95vh] ${theme.card} shadow-2xl overflow-hidden flex flex-col animate-zoom-in border border-white/10`}>
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 ${theme.card} flex items-center justify-center font-black text-xl text-green-500`}>{selectedMarket.numDossier.charAt(0)}</div>
                <div className="max-w-xl">
                  <h2 className={`text-xl font-black ${theme.textMain} uppercase leading-none`}>{selectedMarket.numDossier}</h2>
                  <TruncatedText text={selectedMarket.objet} as="p" className={`text-sm font-bold ${theme.textSecondary} mt-1 line-clamp-1 uppercase`} />
                  {selectedMarket.titulaire && <p className="text-xs font-bold text-primary mt-2 uppercase">Titulaire : {selectedMarket.titulaire}</p>}
                </div>
              </div>
              <button onClick={() => setDetailMarketId(null)} className={`${theme.buttonSecondary} ${theme.buttonShape} px-6 py-4 flex items-center gap-3 font-black text-xs uppercase transition-all`}>Fermer <X size={18}/></button>
            </div>

            <div className="flex-1 overflow-hidden">
              <div className="px-12 py-5 bg-black/5 border-b border-white/5 flex items-center justify-between">
                <h3 className={`text-sm font-black uppercase tracking-[0.15em] text-green-500`}>Phase Exécution (Financier & Contractuel)</h3>
                {selectedMarket.execution?.is_resilie && <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase rounded shadow-lg animate-pulse">Résiliation Active</span>}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12" style={{ maxHeight: 'calc(95vh - 200px)' }}>
                <div className="mb-12 flex justify-center"><CircularProgress percent={calculateExecutionProgress(selectedMarket)} color="text-green-500" icon={Activity} /></div>

                <div className="space-y-10 animate-in slide-in-from-right-4 pb-20">
                  {/* DÉTAILS DU CONTRAT */}
                  <section className={`p-8 ${theme.card} border-white/5 space-y-6 relative`}>
                    <div className="flex items-center gap-3 text-green-500"><FileText size={20}/><h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Synthèse Contractuelle</h4></div>
                    <div className="grid grid-cols-2 gap-8">
                      <div><p className="text-xs font-black text-slate-500 uppercase mb-1">Réf. Contrat</p><p className={`text-sm font-black ${theme.textMain}`}>{selectedMarket.execution?.ref_contrat || 'Non renseignée'}</p></div>
                      <div><p className="text-xs font-black text-slate-500 uppercase mb-1">Délai Global</p><p className={`text-sm font-black ${theme.textMain}`}>{selectedMarket.execution?.delai_mois ? `${selectedMarket.execution.delai_mois} Mois` : 'Non défini'}</p></div>
                    </div>
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                      <div><p className="text-xs font-black text-slate-500 uppercase">Garantie</p><p className={`text-xs font-bold ${theme.textMain} opacity-60 uppercase`}>{selectedMarket.execution?.type_retenue_garantie || "Non définie"}</p></div>
                      <FileManager existingDocId={selectedMarket.execution?.doc_caution_bancaire_id} onUpload={() => {}} disabled />
                    </div>
                  </section>

                  {/* DÉCOMPTES */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between px-4"><h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Receipt size={14}/> Décomptes ({selectedMarket.execution?.decomptes?.length || 0})</h4><span className="text-xs font-black text-green-500">{(selectedMarket.execution?.decomptes?.reduce((acc, d) => acc + d.montant, 0) || 0).toLocaleString()} FCFA</span></div>
                    <div className="space-y-2">
                      {selectedMarket.execution?.decomptes?.map(d => (
                        <div key={d.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                          <div className="flex-1">
                            <p className={`text-xs font-black ${theme.textMain} uppercase`}>{d.objet || `Décompte N°${d.numero}`}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{d.date_validation ? `Validé le ${formatDate(d.date_validation)}` : "En attente de paiement"}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="text-xs font-black text-green-500">{d.montant.toLocaleString()} FCFA</p>
                            <FileManager existingDocId={d.doc_id} onUpload={() => {}} disabled />
                          </div>
                        </div>
                      ))}
                      {(!selectedMarket.execution?.decomptes || selectedMarket.execution.decomptes.length === 0) && (
                        <div className="p-8 text-center"><p className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Aucun décompte enregistré</p></div>
                      )}
                    </div>
                  </section>

                  {/* AVENANTS */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2"><TrendingUp size={14}/> Historique des Avenants</h4>
                    <div className="space-y-3">
                      {selectedMarket.execution?.avenants?.map((a, i) => (
                        <div key={a.id} className="p-6 bg-white/5 rounded-[2rem] border border-warning/10 space-y-4 group">
                          <div className="flex justify-between items-center"><span className="px-3 py-1 bg-warning/10 text-warning text-[10px] font-black rounded-lg uppercase">Avenant N°{i+1}</span><span className={`text-[10px] font-black ${theme.textMain}`}>{a.montant_incidence.toLocaleString()} FCFA</span></div>
                          <p className={`text-xs font-bold ${theme.textMain} uppercase leading-tight`}>{a.objet}</p>
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {[
                              {label: 'Notif.', key: 'doc_notification_id'},
                              {label: 'OS', key: 'doc_os_id'},
                              {label: 'Enreg.', key: 'doc_enreg_id'}
                            ].map(doc => (
                              <div key={doc.key} className="flex flex-col items-center p-2 bg-black/20 rounded-xl border border-white/5 gap-1">
                                <span className="text-[10px] font-black text-slate-500 uppercase">{doc.label}</span>
                                <FileManager existingDocId={(a as any)[doc.key]} onUpload={() => {}} disabled />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {(!selectedMarket.execution?.avenants || selectedMarket.execution.avenants.length === 0) && (
                        <div className="p-8 text-center"><p className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Aucun avenant enregistré</p></div>
                      )}
                    </div>
                  </section>

                  {/* RÉSILIATION */}
                  {selectedMarket.execution?.is_resilie && (
                    <section className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/20 space-y-6 animate-in zoom-in-95">
                      <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[11px] tracking-widest"><AlertTriangle size={20}/> Procédure de Résiliation</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                          {step: 1, label: 'Mise en Demeure', key: 'doc_mise_en_demeure_id'},
                          {step: 2, label: 'Constat de Carence', key: 'doc_constat_carence_id'},
                          {step: 3, label: 'Décision Finale', key: 'doc_decision_resiliation_id'}
                        ].map(s => (
                          <div key={s.step} className="p-4 bg-white/5 rounded-2xl border border-red-500/10 text-center space-y-3 flex flex-col items-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Étape {s.step}</p>
                            <p className={`text-xs font-black ${theme.textMain} uppercase leading-none`}>{s.label}</p>
                            <FileManager existingDocId={(selectedMarket.execution as any)[s.key]} onUpload={() => {}} disabled />
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* DOCS OFFICIELS */}
                  <section className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2"><ShieldCheck size={14}/> Garanties & Documents Officiels</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { label: 'Notification du contrat', key: 'doc_notif_contrat_id', dateKey: null },
                        { label: 'OS de Démarrage', key: 'doc_notif_os_id', dateKey: 'date_notif_os' },
                        { label: 'Cautionnement Définitif', key: 'doc_caution_def_id', dateKey: null },
                        { label: 'Contrat enregistré', key: 'doc_contrat_enreg_id', dateKey: null },
                        { label: 'Police d\'Assurance', key: 'doc_assurance_id', dateKey: null },
                        { label: 'Rapport d\'exécution', key: 'doc_rapport_exec_id', dateKey: null },
                        { label: 'PV Réception Provisoire', key: 'doc_pv_provisoire_id', dateKey: 'date_pv_provisoire' },
                        { label: 'PV Réception Définitive', key: 'doc_pv_definitif_id', dateKey: 'date_pv_definitif' }
                      ].map(doc => {
                        const docId = (selectedMarket.execution as any)?.[doc.key];
                        const dateValue = doc.dateKey ? (selectedMarket.execution as any)?.[doc.dateKey] : null;
                        const status = getStepStatus(dateValue, docId);
                        return (
                          <div key={doc.key} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                            <div className="flex flex-col">
                              <span className={`text-xs font-black ${theme.textMain} opacity-80 uppercase`}>{doc.label}</span>
                              {dateValue ? (
                                <span className="text-[10px] uppercase tracking-tighter flex items-center gap-1.5 text-green-500 font-black">
                                  <Calendar size={10}/> {formatDate(dateValue)}
                                </span>
                              ) : (
                                <span className={`text-[10px] uppercase tracking-tighter ${status.color}`}>{status.label}</span>
                              )}
                            </div>
                            <FileManager existingDocId={docId} onUpload={() => {}} disabled />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
