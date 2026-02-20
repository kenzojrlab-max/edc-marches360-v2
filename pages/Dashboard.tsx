import React from 'react';
import {
  TrendingUp, BarChart2, Activity, Briefcase, ChevronRight, Clock, AlertTriangle,
  Layers, DollarSign, FileStack, Gavel, Ban, X, Printer, Download, XCircle,
  BookOpen, PlusCircle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';
// Contextes
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

// Hooks personnalisés
import { useDashboardStats, AlertMarket } from '../hooks/useDashboardStats';
import { useMarketFilter } from '../hooks/useMarketFilter';

import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { TruncatedText } from '../components/TruncatedText';

// Fonction de formatage exacte (pas d'arrondi)
const formatCurrency = (val: number) => {
  return val.toLocaleString('fr-FR') + ' FCFA';
};

// Fonction d'export Excel pour les modales (chargement dynamique de xlsx)
const exportToXLSX = async (data: Record<string, any>[], headers: { key: string; label: string }[], filename: string) => {
  const XLSX = await import('xlsx');
  const wsData = [
    headers.map(h => h.label),
    ...data.map(row => headers.map(h => row[h.key] ?? ''))
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Auto-width des colonnes
  ws['!cols'] = headers.map((_, i) => ({
    wch: Math.max(
      headers[i].label.length,
      ...data.map(row => String(row[headers[i].key] ?? '').length)
    ) + 2
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Données');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// Fonction d'impression d'un tableau
const printTable = (title: string, tableId: string) => {
  const printContent = document.getElementById(tableId);
  if (!printContent) return;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Segoe UI', sans-serif; padding: 20px; }
          h1 { font-size: 18px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #0a1120; color: white; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
          tr:nth-child(even) { background: #f8fafc; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        ${printContent.outerHTML}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
};

export const Dashboard: React.FC = () => {
  const { markets, updateMarket } = useMarkets();
  const { projects } = useProjects();
  const { theme, themeType } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  // --- Filtres (via Hook) ---
  const {
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    selectedFonction, setSelectedFonction,
    yearOptions,
    financementOptions,
    fonctionOptions,
    filteredMarkets
  } = useMarketFilter(markets, projects);

  // --- Stats (via Hook) ---
  const {
    volumeStats, budgetStats, executionRateStats, delayStats, recoursStats, failureStats,
    alertsList, ppmVsInscritStats, marchesSignesParExercice, tauxExecutionParExercice,
    executionPPMParFonction, tauxBudgetaireParFonction, COLORS
  } = useDashboardStats(filteredMarkets, markets, projects);

  // États pour les modals KPI
  const [modalPPM, setModalPPM] = React.useState(false);
  const [modalVolume, setModalVolume] = React.useState(false);
  const [modalInfructueux, setModalInfructueux] = React.useState(false);

  // Marchés non lancés (pas de date lancement_ao)
  const marchesNonLances = React.useMemo(() =>
    filteredMarkets.filter(m => !m.dates_realisees.lancement_ao),
    [filteredMarkets]
  );

  // Marchés signés avec délai contractuel
  const marchesSigned = React.useMemo(() =>
    filteredMarkets
      .filter(m => m.dates_realisees.signature_marche)
      .map(m => ({
        ...m,
        dateSignatureFormatted: new Date(m.dates_realisees.signature_marche!).toLocaleDateString('fr-FR')
      })),
    [filteredMarkets]
  );

  // Marchés infructueux
  const marchesInfructueux = React.useMemo(() =>
    filteredMarkets.filter(m => m.is_infructueux),
    [filteredMarkets]
  );

  // Dismiss alerte
  const handleDismissAlert = async (marketId: string) => {
    try {
      await updateMarket(marketId, { alert_dismissed: true });
    } catch {
      toast.error("Erreur lors de la suppression de l'alerte.");
    }
  };

  const handleDismissMultipleAlerts = async (marketIds: string[]) => {
    let errors = 0;
    for (const id of marketIds) {
      try { await updateMarket(id, { alert_dismissed: true }); } catch { errors++; }
    }
    if (errors > 0) toast.warning(`${errors} alerte(s) n'ont pas pu être supprimées.`);
  };

  // Sélection des alertes pour suppression multiple
  const [selectedAlerts, setSelectedAlerts] = React.useState<Set<string>>(new Set());

  const toggleAlertSelection = (id: string) => {
    setSelectedAlerts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // État pour l'analyseur dynamique
  const [analyseMetrique, setAnalyseMetrique] = React.useState<'volume' | 'budget' | 'delai' | 'taux'>('volume');
  const [analyseDimension, setAnalyseDimension] = React.useState<'fonction' | 'procedure' | 'financement'>('fonction');

  // Données dynamiques pour l'analyseur
  const dynamicAnalyseData = React.useMemo(() => {
    const groupKey = analyseDimension === 'fonction' ? 'fonction' :
                     analyseDimension === 'procedure' ? 'typeAO' : 'source_financement';

    const groups = new Map<string, { name: string; volume: number; budget: number; delai: number; taux: number; count: number }>();

    filteredMarkets.forEach(m => {
      const key = (m[groupKey as keyof typeof m] || 'Non défini').toString();
      if (!groups.has(key)) {
        groups.set(key, { name: key, volume: 0, budget: 0, delai: 0, taux: 0, count: 0 });
      }
      const g = groups.get(key)!;
      g.volume++;
      g.budget += m.montant_prevu || 0;
      g.count++;
      if (m.dates_realisees.signature_marche) {
        g.taux++;
      }
    });

    return Array.from(groups.values()).map(g => ({
      ...g,
      taux: g.count > 0 ? Math.round((g.taux / g.count) * 100) : 0
    }));
  }, [filteredMarkets, analyseDimension]);

  // --- Rendu ---
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 relative">

      {/* 1. BARRE DE FILTRES */}
      <div className={`${theme.card} p-6 flex flex-wrap items-center gap-6 mb-8 relative z-30`}>
        <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden md:flex`}>
          <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pilotage</span>
        </div>
        <div className="w-full md:w-40"><CustomBulleSelect label="Exercice" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
        <div className="w-full md:w-64"><CustomBulleSelect label="Financement" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} /></div>
        <div className="w-full md:w-64"><CustomBulleSelect label="Fonction" value={selectedFonction} options={fonctionOptions} onChange={setSelectedFonction} /></div>
      </div>

      {/* 2. GRILLE DES KPIs (7 CARTES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">

        {/* KPI 1 : Nombre de Marchés planifiés */}
        <div onClick={() => setModalPPM(true)} className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full cursor-pointer`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Nombre de Marchés planifiés</p>
              <FileStack size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textSecondary}`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{volumeStats.prevu}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Planifiés</span>
              </div>
              <p className={`text-sm font-bold ${theme.textAccent} mt-2 flex items-center gap-1`}>
                 <span className="bg-primary/10 px-2 py-0.5 rounded">{volumeStats.realise}</span> consultations lancées
              </p>
           </div>
        </div>

        {/* KPI 2 : Volume total des marchés */}
        <div onClick={() => setModalVolume(true)} className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full cursor-pointer`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Volume total des marchés</p>
              <DollarSign size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-success`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-3xl font-black ${theme.textMain}`}>{formatCurrency(budgetStats.prevu)}</h3>
              </div>
              <p className={`text-xs font-bold ${theme.textSecondary} uppercase mt-1`}>Volume Prévu</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                 <p className={`text-sm font-bold ${theme.textAccent}`}>
                    Réalisé : {formatCurrency(budgetStats.realise)}
                 </p>
              </div>
           </div>
        </div>

        {/* KPI 3 : Taux d'exécution du PPM */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Taux d'exécution du PPM</p>
              <Activity size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textAccent}`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{executionRateStats.realise}%</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Réalisé</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Objectif cible : <span className={theme.textMain}>{executionRateStats.prevu}%</span>
              </p>
           </div>
        </div>

        {/* KPI 4 : Délais moyen de Passation */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full ${delayStats.realise > delayStats.prevu ? 'border-danger/30' : ''}`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Délais moyen de Passation</p>
              <Clock size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${delayStats.realise > delayStats.prevu ? 'text-danger' : 'text-success'}`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain} ${delayStats.realise > delayStats.prevu ? 'text-danger' : ''}`}>{delayStats.realise}j</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Réalisé</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Délai règlementaire : {delayStats.prevu}j
              </p>
           </div>
        </div>

        {/* KPI 5 : Nombre (et %) de recours enregistré */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Nombre (et %) de recours</p>
              <Gavel size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-blue-500`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{recoursStats.realise}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Enregistrés</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Soit <span className="text-blue-500 font-black">{recoursStats.rate}%</span> des procédures
              </p>
           </div>
        </div>

        {/* KPI 6 : Nombre de procédures infructueuses ou annulées */}
        <div onClick={() => setModalInfructueux(true)} className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full cursor-pointer`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Procédures infructueuses / annulées</p>
              <Ban size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-danger`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{failureStats.realise}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Dossiers</span>
              </div>
           </div>
        </div>

        {/* KPI 7 (NOUVEAU) : Marchés prévus (PPM) + inscrits (Hors PPM) */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Marchés prévus & inscrits</p>
              <PlusCircle size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-violet-500`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{ppmVsInscritStats.total.nombre}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Total</span>
              </div>
              <p className={`text-xs font-bold ${theme.textSecondary} mt-1`}>
                 Volume : <span className={theme.textMain}>{formatCurrency(ppmVsInscritStats.total.volume)}</span>
              </p>
              <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
                 <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <BookOpen size={12} className="text-primary" /> PPM
                    </span>
                    <span className={`text-xs font-black ${theme.textMain}`}>{ppmVsInscritStats.ppm.nombre} ({formatCurrency(ppmVsInscritStats.ppm.volume)})</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-bold">
                      <PlusCircle size={12} className="text-violet-500" /> Inscrits
                    </span>
                    <span className={`text-xs font-black ${theme.textMain}`}>{ppmVsInscritStats.inscrit.nombre} ({formatCurrency(ppmVsInscritStats.inscrit.volume)})</span>
                 </div>
              </div>
           </div>
        </div>

      </div>

      {/* NOUVEAU : Volume Marchés prévus (PPM) vs Inscrits (Hors PPM) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        <div className={`${theme.card} p-8`}>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen size={20} className="text-primary" />
            <h3 className={`text-sm font-black uppercase tracking-widest ${theme.textMain}`}>Volume des marchés prévus (PPM)</h3>
          </div>
          <h3 className={`text-3xl font-black ${theme.textMain}`}>{formatCurrency(ppmVsInscritStats.ppm.volume)}</h3>
          <p className={`text-xs font-bold ${theme.textSecondary} mt-2`}>{ppmVsInscritStats.ppm.nombre} marchés dans le PPM</p>
        </div>
        <div className={`${theme.card} p-8`}>
          <div className="flex items-center gap-3 mb-4">
            <PlusCircle size={20} className="text-violet-500" />
            <h3 className={`text-sm font-black uppercase tracking-widest ${theme.textMain}`}>Volume des marchés inscrits (Hors PPM)</h3>
          </div>
          <h3 className={`text-3xl font-black ${theme.textMain}`}>{formatCurrency(ppmVsInscritStats.inscrit.volume)}</h3>
          <p className={`text-xs font-bold ${theme.textSecondary} mt-2`}>{ppmVsInscritStats.inscrit.nombre} marchés inscrits manuellement</p>
        </div>
      </div>

      {/* 3. ALERTES CRITIQUES */}
      <div className={`${theme.card} p-10 relative z-10`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-danger">
             <AlertTriangle size={24} />
             <h3 className={`text-xl font-black uppercase tracking-widest ${theme.textMain}`} style={{ fontFamily: "'Poppins', sans-serif" }}>Alertes Critiques</h3>
          </div>
          <div className="flex items-center gap-4">
            <p className={`text-sm font-bold ${theme.textSecondary}`}>Marchés sans saisine CIPM réalisée</p>
            {selectedAlerts.size > 0 && (
              <button
                onClick={() => { handleDismissMultipleAlerts(Array.from(selectedAlerts)); setSelectedAlerts(new Set()); }}
                className="px-4 py-2 bg-danger/10 text-danger rounded-xl text-xs font-black uppercase tracking-widest hover:bg-danger/20 transition-all flex items-center gap-2"
              >
                <XCircle size={14} /> Retirer {selectedAlerts.size} alerte{selectedAlerts.size > 1 ? 's' : ''}
              </button>
            )}
          </div>
        </div>

        {/* Légende des couleurs */}
        <div className="flex items-center gap-6 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className={`text-xs font-bold ${theme.textSecondary}`}>Date prévue dépassée - Pas de réalisation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className={`text-xs font-bold ${theme.textSecondary}`}>Réalisation effectuée en retard</span>
          </div>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {alertsList.map((m: AlertMarket, i: number) => {
            const isNoRealisation = m.alertType === 'no_realisation';
            const borderColor = isNoRealisation ? 'hover:border-red-500/30' : 'hover:border-amber-500/30';
            const badgeColor = isNoRealisation ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500';
            const iconColor = isNoRealisation ? 'text-red-500' : 'text-amber-500';
            const badgeText = isNoRealisation ? `Retard ${m.maxDelay}j` : `Retard réalisé ${m.maxDelay}j`;

            return (
              <div key={i} className={`flex items-center justify-between p-6 ${theme.buttonShape} bg-black/5 border border-white/5 ${borderColor} transition-all group`}>
                <div className="flex items-center gap-5">
                  {/* Checkbox de sélection */}
                  <input
                    type="checkbox"
                    checked={selectedAlerts.has(m.id)}
                    onChange={() => toggleAlertSelection(m.id)}
                    className="w-4 h-4 accent-danger cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                  <div
                    className="flex items-center gap-5 cursor-pointer flex-1"
                    onClick={() => navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`)}
                  >
                    <div className={`w-12 h-12 ${theme.card} flex items-center justify-center ${iconColor} shadow-sm group-hover:scale-110 transition-transform`}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className={`font-black ${theme.textMain} text-sm tracking-tight uppercase mb-1`}>{m.numDossier}</h4>
                      <TruncatedText text={m.objet} as="p" className={`text-xs font-bold ${theme.textSecondary} line-clamp-1`} />
                      <p className={`text-[10px] font-bold ${theme.textSecondary} mt-1 opacity-70`}>
                        Situation : {m.lastJalonRealise}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-4 py-1.5 ${badgeColor} rounded-full text-xs font-black uppercase tracking-widest`}>{badgeText}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDismissAlert(m.id); }}
                    className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary} opacity-0 group-hover:opacity-100 transition-opacity`}
                    title="Retirer des alertes"
                  >
                    <XCircle size={16} />
                  </button>
                  <ChevronRight size={18} className={`${theme.textSecondary} cursor-pointer`} onClick={() => navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`)} />
                </div>
              </div>
            );
          })}
          {alertsList.length === 0 && <div className="p-10 text-center text-slate-400 font-black uppercase italic text-sm">Aucune alerte en cours</div>}
        </div>
      </div>

      {/* 4. ANALYSE OPÉRATIONNELLE */}
      <h2 className={`${theme.textMain} text-xl font-black uppercase tracking-tight pl-4 border-l-4 border-primary relative z-10`} style={{ fontFamily: "'Poppins', sans-serif" }}>
        Analyse Opérationnelle
      </h2>

      {/* Courbes: Marchés signés et Taux d'exécution PPM par exercice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Courbe 1: Nombre de marchés signés par exercice */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <TrendingUp size={18} /> Marchés Signés par Exercice
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marchesSignesParExercice} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} />
                <Line type="monotone" dataKey="signes" name="Marchés signés" stroke={COLORS.success} strokeWidth={4} dot={{r: 6, strokeWidth:2, fill:'white'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Courbe 2: Taux d'exécution du PPM par exercice */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Activity size={18} /> Taux d'Exécution PPM par Exercice
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tauxExecutionParExercice} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} formatter={(value: number) => [`${value}%`, 'Taux']} />
                <Line type="monotone" dataKey="tauxExecution" name="Taux d'exécution" stroke={COLORS.warning} strokeWidth={4} dot={{r: 6, strokeWidth:2, fill:'white'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Graphiques par fonction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Exécution du PPM par fonction analytique */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Briefcase size={18} /> Exécution PPM par Fonction Analytique
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionPPMParFonction} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="name" tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} axisLine={false} tickLine={false} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} />
                <Legend wrapperStyle={{fontSize:'11px', fontWeight:'bold', paddingTop:'20px'}} />
                <Bar dataKey="planifies" name="Programmés" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="lances" name="Lancés" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="signes" name="Signés" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Taux d'exécution budgétaire par fonction */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <DollarSign size={18} /> Taux d'Exécution Budgétaire par Fonction
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tauxBudgetaireParFonction} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} formatter={(value: number, name: string) => [name === 'tauxExecution' ? `${value}%` : formatCurrency(value), name === 'budgetProgramme' ? 'Budget Programmé' : name === 'budgetExecute' ? 'Budget Exécuté' : 'Taux']} />
                <Legend wrapperStyle={{fontSize:'11px', fontWeight:'bold', paddingTop:'20px'}} />
                <Bar dataKey="budgetProgramme" name="Budget Programmé" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="budgetExecute" name="Budget Exécuté" fill={COLORS.success} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analyseur Dynamique */}
      <div className={`${theme.card} p-10 relative z-10`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <h3 className={`${theme.textMain} text-lg font-black flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <BarChart2 size={18} /> Analyseur Dynamique
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Métrique:</span>
              <div className="flex gap-1">
                {[
                  { key: 'volume', label: 'Volume' },
                  { key: 'budget', label: 'Budget' },
                  { key: 'delai', label: 'Délai' },
                  { key: 'taux', label: 'Taux' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setAnalyseMetrique(opt.key as any)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                      analyseMetrique === opt.key
                        ? 'bg-primary text-white'
                        : `${theme.buttonShape} ${theme.textSecondary} hover:bg-white/10`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Par:</span>
              <div className="flex gap-1">
                {[
                  { key: 'fonction', label: 'Fonction' },
                  { key: 'procedure', label: 'Procédure' },
                  { key: 'financement', label: 'Financement' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setAnalyseDimension(opt.key as any)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                      analyseDimension === opt.key
                        ? 'bg-accent text-white'
                        : `${theme.buttonShape} ${theme.textSecondary} hover:bg-white/10`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicAnalyseData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}}
                formatter={(value: number) => analyseMetrique === 'budget' ? formatCurrency(value) : analyseMetrique === 'taux' ? `${value}%` : value}
              />
              <Bar
                dataKey={analyseMetrique}
                fill={analyseMetrique === 'volume' ? COLORS.primary : analyseMetrique === 'budget' ? COLORS.success : analyseMetrique === 'delai' ? COLORS.warning : COLORS.danger}
                radius={[8, 8, 0, 0]}
                barSize={40}
              >
                {dynamicAnalyseData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={analyseMetrique === 'volume' ? COLORS.primary : analyseMetrique === 'budget' ? COLORS.success : analyseMetrique === 'delai' ? COLORS.warning : COLORS.danger}
                    fillOpacity={0.8 + (index * 0.02)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MODAL : Marchés non lancés (PPM) */}
      {modalPPM && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setModalPPM(false)}>
          <div className={`${theme.card} w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col m-4`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textMain}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                Marchés non lancés ({marchesNonLances.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printTable('Marchés non lancés', 'table-non-lances')}
                  className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}
                  title="Imprimer"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => exportToXLSX(
                    marchesNonLances.map(m => ({
                      numDossier: m.numDossier,
                      objet: m.objet,
                      typeAO: m.typeAO,
                      montant_prevu: m.montant_prevu
                    })),
                    [
                      { key: 'numDossier', label: 'N° Dossier' },
                      { key: 'objet', label: 'Objet du marché' },
                      { key: 'typeAO', label: 'Type AO' },
                      { key: 'montant_prevu', label: 'Montant prévu' }
                    ],
                    'Marches_non_lances'
                  )}
                  className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}
                  title="Télécharger Excel"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setModalPPM(false)} className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}><X size={20} /></button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-6">
              {marchesNonLances.length === 0 ? (
                <p className={`text-center py-10 ${theme.textSecondary} italic`}>Tous les marchés ont été lancés.</p>
              ) : (
                <table id="table-non-lances" className="w-full text-left">
                  <thead>
                    <tr className={`text-xs font-black uppercase tracking-widest ${theme.textSecondary} border-b border-white/10`}>
                      <th className="pb-4 pr-4">N° Dossier</th>
                      <th className="pb-4 pr-4">Objet du marché</th>
                      <th className="pb-4 pr-4">Type AO</th>
                      <th className="pb-4 text-right">Montant prévu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marchesNonLances.map(m => (
                      <tr key={m.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer`} onClick={() => { setModalPPM(false); navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`); }}>
                        <td className={`py-4 pr-4 text-sm font-bold ${theme.textMain}`}>{m.numDossier}</td>
                        <td className={`py-4 pr-4 text-sm ${theme.textSecondary}`}><TruncatedText text={m.objet} as="span" className="line-clamp-1" /></td>
                        <td className={`py-4 pr-4 text-xs font-bold ${theme.textSecondary} uppercase`}>{m.typeAO}</td>
                        <td className={`py-4 text-sm font-bold ${theme.textMain} text-right`}>{formatCurrency(m.montant_prevu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Marchés signés (Volume) */}
      {modalVolume && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setModalVolume(false)}>
          <div className={`${theme.card} w-full max-w-6xl max-h-[80vh] overflow-hidden flex flex-col m-4`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textMain}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                Marchés signés ({marchesSigned.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printTable('Marchés signés', 'table-signes')}
                  className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}
                  title="Imprimer"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => exportToXLSX(
                    marchesSigned.map(m => ({
                      numDossier: m.numDossier,
                      objet: m.objet,
                      attributaire: m.titulaire || '—',
                      dateSignature: m.dateSignatureFormatted,
                      delaiContractuel: m.delai_contractuel || '—',
                      montant: m.montant_ttc_reel || m.montant_prevu
                    })),
                    [
                      { key: 'numDossier', label: 'N° Dossier' },
                      { key: 'objet', label: 'Objet du marché' },
                      { key: 'attributaire', label: 'Attributaire' },
                      { key: 'dateSignature', label: 'Date de signature' },
                      { key: 'delaiContractuel', label: "Délai contractuel d'exécution" },
                      { key: 'montant', label: 'Montant' }
                    ],
                    'Marches_signes'
                  )}
                  className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}
                  title="Télécharger Excel"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setModalVolume(false)} className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}><X size={20} /></button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-6">
              {marchesSigned.length === 0 ? (
                <p className={`text-center py-10 ${theme.textSecondary} italic`}>Aucun marché signé.</p>
              ) : (
                <table id="table-signes" className="w-full text-left">
                  <thead>
                    <tr className={`text-xs font-black uppercase tracking-widest ${theme.textSecondary} border-b border-white/10`}>
                      <th className="pb-4 pr-4">N° Dossier</th>
                      <th className="pb-4 pr-4">Objet du marché</th>
                      <th className="pb-4 pr-4">Attributaire</th>
                      <th className="pb-4 pr-4 text-center">Date de signature</th>
                      <th className="pb-4 pr-4 text-center">Délai contractuel</th>
                      <th className="pb-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marchesSigned.map(m => (
                      <tr key={m.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer`} onClick={() => { setModalVolume(false); navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`); }}>
                        <td className={`py-4 pr-4 text-sm font-bold ${theme.textMain}`}>{m.numDossier}</td>
                        <td className={`py-4 pr-4 text-sm ${theme.textMain}`}><TruncatedText text={m.objet} as="span" className="line-clamp-1 font-bold" /></td>
                        <td className={`py-4 pr-4 text-sm ${theme.textSecondary}`}>{m.titulaire || '—'}</td>
                        <td className={`py-4 pr-4 text-sm font-bold text-center ${theme.textMain}`}>{m.dateSignatureFormatted}</td>
                        <td className={`py-4 pr-4 text-sm font-bold text-center ${theme.textAccent}`}>{m.delai_contractuel || '—'}</td>
                        <td className={`py-4 text-sm font-bold ${theme.textMain} text-right`}>{formatCurrency(m.montant_ttc_reel || m.montant_prevu)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL : Procédures infructueuses */}
      {modalInfructueux && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setModalInfructueux(false)}>
          <div className={`${theme.card} w-full max-w-5xl max-h-[80vh] overflow-hidden flex flex-col m-4`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textMain}`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                Procédures infructueuses ({marchesInfructueux.length})
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printTable('Procédures infructueuses', 'table-infructueux')}
                  className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}
                  title="Imprimer"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => exportToXLSX(
                    marchesInfructueux.map(m => ({
                      objet: m.objet,
                      dateLancement: m.dates_realisees.lancement_ao ? new Date(m.dates_realisees.lancement_ao).toLocaleDateString('fr-FR') : '—',
                      motif: m.motif_infructueux || 'Non renseigné'
                    })),
                    [
                      { key: 'objet', label: 'Nom du marché' },
                      { key: 'dateLancement', label: 'Date de lancement' },
                      { key: 'motif', label: "Motif d'infructuosité" }
                    ],
                    'Procedures_infructueuses'
                  )}
                  className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}
                  title="Télécharger Excel"
                >
                  <Download size={18} />
                </button>
                <button onClick={() => setModalInfructueux(false)} className={`p-2 rounded-xl hover:bg-white/10 ${theme.textSecondary}`}><X size={20} /></button>
              </div>
            </div>
            <div className="overflow-auto flex-1 p-6">
              {marchesInfructueux.length === 0 ? (
                <p className={`text-center py-10 ${theme.textSecondary} italic`}>Aucune procédure infructueuse.</p>
              ) : (
                <table id="table-infructueux" className="w-full text-left">
                  <thead>
                    <tr className={`text-xs font-black uppercase tracking-widest ${theme.textSecondary} border-b border-white/10`}>
                      <th className="pb-4 pr-4">Nom du marché</th>
                      <th className="pb-4 pr-4">Date de lancement</th>
                      <th className="pb-4">Motif d'infructuosité</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marchesInfructueux.map(m => (
                      <tr key={m.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer`} onClick={() => { setModalInfructueux(false); navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`); }}>
                        <td className={`py-4 pr-4 text-sm font-bold ${theme.textMain}`}><TruncatedText text={m.objet} as="span" className="line-clamp-1" /></td>
                        <td className={`py-4 pr-4 text-sm ${theme.textSecondary}`}>
                          {m.dates_realisees.lancement_ao ? new Date(m.dates_realisees.lancement_ao).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className={`py-4 text-sm ${theme.textSecondary}`}>{m.motif_infructueux || <span className="italic opacity-50">Non renseigné</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
