import React, { useState, useMemo } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarketFilter } from '../hooks/useMarketFilter';
import { useMarketLifecycle } from '../hooks/useMarketLifecycle';
import { Modal } from '../components/Modal';
import { FileManager } from '../components/FileManager';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { TruncatedText } from '../components/TruncatedText';
import { formatDate } from '../utils/date';
import { Marche } from '../types';
import {
  FileDown, Calendar, User, Briefcase, CheckCircle2, BarChart3,
  AlertTriangle, Search, Layers, Activity, Banknote,
  TrendingUp, X, CalendarDays, Package, ChevronDown, ChevronUp
} from 'lucide-react';

// ══════════════════════════════════════
// COMPOSANTS UTILITAIRES
// ══════════════════════════════════════

// Progress Circulaire
const CircularProgress = ({ percent, color, icon: Icon }: { percent: number; color: string; icon: any }) => {
  const { theme } = useTheme();
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-36 h-36 flex items-center justify-center">
      <svg viewBox="0 0 192 192" className="absolute inset-0 w-full h-full transform -rotate-90 pointer-events-none">
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" className="opacity-10" />
        <circle cx="96" cy="96" r={radius} stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={`${color} transition-all duration-1000 ease-out`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none z-10">
        <Icon size={24} className={`${color} mb-1`} />
        <span className={`text-2xl font-black ${theme.textMain} leading-none`}>{Math.round(percent)}%</span>
      </div>
    </div>
  );
};

// Calcul avancement dynamique V2
const calculateV2Progress = (m: Marche): number => {
  const exec = m.execution;

  // FORFAIT : livrables validés / total
  if (exec.type_contrat === 'FORFAIT' && exec.livrables && exec.livrables.length > 0) {
    const validated = exec.livrables.filter(l => l.statut === 'VALIDE').length;
    return (validated / exec.livrables.length) * 100;
  }

  // BORDEREAU : cumul décomptes mensuels / montant marché
  if (exec.type_contrat === 'BORDEREAU' && exec.periodes && exec.periodes.length > 0 && m.montant_ttc_reel) {
    const totalDecompte = exec.periodes.reduce((acc, p) => acc + (p.montant_decompte || 0), 0);
    return Math.min((totalDecompte / m.montant_ttc_reel) * 100, 100);
  }

  // FOURNITURE : BL réceptionnés ou payés / total
  if (exec.type_contrat === 'FOURNITURE' && exec.bons_livraison && exec.bons_livraison.length > 0) {
    const done = exec.bons_livraison.filter(bl => bl.statut === 'RECEPTIONNEE' || bl.statut === 'PAYE').length;
    return (done / exec.bons_livraison.length) * 100;
  }

  // FALLBACK V1 : décomptes anciens ou docs admin
  if (exec.decomptes?.length && m.montant_ttc_reel) {
    const totalDecompte = exec.decomptes.reduce((acc, d) => acc + d.montant, 0);
    return Math.min((totalDecompte / m.montant_ttc_reel) * 100, 100);
  }

  const steps = [exec.doc_notif_contrat_id, exec.doc_notif_os_id, exec.doc_pv_provisoire_id, exec.doc_pv_definitif_id];
  const completed = steps.filter(Boolean).length;
  return (completed / steps.length) * 100;
};

// Cumul financier V2
const getCumulFinancier = (m: Marche): number => {
  const exec = m.execution;
  if (exec.type_contrat === 'BORDEREAU' && exec.periodes?.length) {
    return exec.periodes.reduce((acc, p) => acc + (p.montant_decompte || 0), 0);
  }
  if (exec.type_contrat === 'FORFAIT' && exec.livrables?.length) {
    return exec.livrables.filter(l => l.statut === 'VALIDE').reduce((acc, l) => acc + (l.montant_prevu || 0), 0);
  }
  if (exec.type_contrat === 'FOURNITURE' && exec.bons_livraison?.length) {
    return exec.bons_livraison.filter(bl => bl.statut === 'RECEPTIONNEE' || bl.statut === 'PAYE').reduce((acc, bl) => acc + (bl.montant || 0), 0);
  }
  // Fallback V1
  return exec.decomptes?.reduce((acc, d) => acc + d.montant, 0) || 0;
};

// DocCell lecture seule
const DocCell: React.FC<{ docId?: string; label: string }> = ({ docId, label }) => {
  const { theme } = useTheme();
  if (!docId) return <span className={`text-[9px] ${theme.textSecondary} italic`}>—</span>;
  return <FileManager existingDocId={docId} onUpload={() => {}} disabled />;
};

// Badge statut paiement
const PaiementBadge: React.FC<{ statut: string }> = ({ statut }) => {
  const colors: Record<string, string> = {
    'PAYE': 'bg-success/20 text-success',
    'FACTURE': 'bg-warning/20 text-warning',
    'EN_ATTENTE': 'bg-white/10 text-slate-400',
  };
  const labels: Record<string, string> = { 'PAYE': 'Payé', 'FACTURE': 'Facturé', 'EN_ATTENTE': 'En attente' };
  return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${colors[statut] || 'bg-white/10'}`}>{labels[statut] || statut}</span>;
};

// ══════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════

export const ExecutionTrackingV2: React.FC = () => {
  const { markets } = useMarkets();
  const { projects } = useProjects();
  const { theme, themeType } = useTheme();
  const { isClosed } = useMarketLifecycle(markets, projects);

  const {
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    yearOptions, financementOptions, filteredMarkets: baseFilteredMarkets
  } = useMarketFilter(markets, projects);

  const executionMarkets = useMemo(() =>
    baseFilteredMarkets.filter(m => m.dates_realisees.signature_marche && !m.is_annule),
    [baseFilteredMarkets]
  );

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedPeriodeId, setExpandedPeriodeId] = useState<string | null>(null);
  const selectedMarket = markets.find(m => m.id === selectedMarketId);

  // Filtres
  const displayMarkets = useMemo(() => {
    if (statusFilter === 'all') return executionMarkets;
    if (statusFilter === 'resilie') return executionMarkets.filter(m => m.execution?.is_resilie);
    if (statusFilter === 'cloture') return executionMarkets.filter(m => isClosed(m));
    if (statusFilter === 'en_cours') return executionMarkets.filter(m => !isClosed(m) && !m.execution?.is_resilie);
    return executionMarkets;
  }, [executionMarkets, statusFilter, isClosed]);

  // Stats globales
  const stats = useMemo(() => ({
    total: executionMarkets.length,
    totalFinancier: executionMarkets.reduce((acc, m) => acc + getCumulFinancier(m), 0),
    clotures: executionMarkets.filter(m => isClosed(m)).length,
    resilies: executionMarkets.filter(m => m.execution?.is_resilie).length,
  }), [executionMarkets, isClosed]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 relative z-20">
        <div className="border-l-4 border-green-500 pl-4">
          <h1 className={`text-2xl md:text-3xl font-black ${theme.textMain} tracking-tight uppercase flex items-center gap-3`}>
            Suivi Exécution V2 <span className="text-[10px] bg-accent px-2 py-1 rounded text-white">NOUVEAU</span>
          </h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Tableau de bord de suivi financier et technique.</p>
        </div>
        <div className={`${theme.card} p-3 flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-40`}>
          <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
            <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="text-[10px] font-black uppercase tracking-widest">Pilotage</span>
          </div>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} placeholder="Exercice" /></div>
          <div className="w-full md:w-56"><CustomBulleSelect label="" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} placeholder="Tous les financements" /></div>
          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : theme.textSecondary}`} size={16} />
            <input type="text" placeholder="Rechercher..." className={`${theme.input} pl-10 pr-4 py-2.5 w-full font-black`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div><p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Marchés en Exécution</p><h3 className={`text-2xl font-black ${theme.textMain}`}>{stats.total}</h3></div>
          <Activity size={24} className="text-green-500" />
        </div>
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div><p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Cumul Financier</p><h3 className="text-2xl font-black text-green-500">{stats.totalFinancier.toLocaleString()} <span className="text-sm">FCFA</span></h3></div>
          <Banknote size={24} className="text-green-500" />
        </div>
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div><p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Clôturés</p><h3 className={`text-2xl font-black ${theme.textMain}`}>{stats.clotures}</h3></div>
          <CheckCircle2 size={24} className="text-primary" />
        </div>
        <div className={`${theme.card} p-6 flex items-center justify-between`}>
          <div><p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-1`}>Résiliés</p><h3 className="text-2xl font-black text-danger">{stats.resilies}</h3></div>
          <AlertTriangle size={24} className="text-danger" />
        </div>
      </div>

      {/* FILTRES RAPIDES */}
      <div className="flex items-center gap-2 px-2">
        <div className="w-48">
          <CustomBulleSelect
            label=""
            value={statusFilter}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'en_cours', label: 'En cours' },
              { value: 'cloture', label: 'Clôturés' },
              { value: 'resilie', label: 'Résiliés' },
            ]}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* TABLEAU PRINCIPAL */}
      <div className={`${theme.card} overflow-hidden overflow-x-auto`}>
        <table className="w-full text-left min-w-[900px]">
          <thead className="bg-black/5">
            <tr className={`text-[10px] font-black uppercase ${theme.textSecondary}`}>
              <th className="p-4">Dossier</th>
              <th className="p-4">Objet</th>
              <th className="p-4">Type</th>
              <th className="p-4">Montant Marché</th>
              <th className="p-4">Cumul Exécuté</th>
              <th className="p-4">Avancement</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayMarkets.map(m => {
              const progress = calculateV2Progress(m);
              const cumul = getCumulFinancier(m);
              const isResilie = m.execution?.is_resilie;
              return (
                <tr key={m.id} className={`hover:bg-white/5 transition-all ${isResilie ? 'opacity-60' : ''}`}>
                  <td className={`p-4 text-[11px] font-bold ${theme.textAccent}`}>{m.numDossier}</td>
                  <td className={`p-4 text-[11px] font-medium ${theme.textMain} max-w-xs truncate`}>{m.objet}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                      m.execution.type_contrat === 'FORFAIT' ? 'bg-accent/10 text-accent' :
                      m.execution.type_contrat === 'FOURNITURE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}>{m.execution.type_contrat || 'BORDEREAU'}</span>
                  </td>
                  <td className={`p-4 text-[11px] font-black ${theme.textMain}`}>{m.montant_ttc_reel?.toLocaleString() || '—'} <span className={`text-[9px] ${theme.textSecondary}`}>FCFA</span></td>
                  <td className={`p-4 text-[11px] font-black text-green-500`}>{cumul.toLocaleString()} <span className="text-[9px] opacity-60">FCFA</span></td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 bg-black/20 rounded-full overflow-hidden">
                        <div className={`h-full ${progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-primary' : 'bg-warning'}`} style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-[9px] font-bold opacity-60">{Math.round(progress)}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => setSelectedMarketId(m.id)} className={`${theme.buttonPrimary} px-4 py-1.5 rounded-lg text-[10px] font-black uppercase`}>Détails</button>
                  </td>
                </tr>
              );
            })}
            {displayMarkets.length === 0 && (
              <tr><td colSpan={7} className="p-20 text-center font-black uppercase text-slate-400 text-xs">Aucun marché trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════ */}
      {/* MODAL DÉTAILS                         */}
      {/* ══════════════════════════════════════ */}
      {selectedMarket && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
          <div className={`relative w-full max-w-[900px] h-[95vh] ${theme.card} shadow-2xl overflow-hidden flex flex-col animate-zoom-in border border-white/10`}>

            {/* Header Modal */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-6">
                <div className={`w-16 h-16 ${theme.card} flex items-center justify-center font-black text-xl text-green-500`}>{selectedMarket.numDossier.charAt(0)}</div>
                <div className="max-w-xl">
                  <h2 className={`text-xl font-black ${theme.textMain} uppercase leading-none`}>{selectedMarket.numDossier}</h2>
                  <TruncatedText text={selectedMarket.objet} as="p" className={`text-sm font-bold ${theme.textSecondary} mt-1 line-clamp-1 uppercase`} />
                  {selectedMarket.titulaire && <p className="text-xs font-bold text-primary mt-2 uppercase">Titulaire : {selectedMarket.titulaire}</p>}
                </div>
              </div>
              <button onClick={() => { setSelectedMarketId(null); setExpandedPeriodeId(null); }} className={`${theme.buttonSecondary} ${theme.buttonShape} px-6 py-4 flex items-center gap-3 font-black text-xs uppercase`}>Fermer <X size={18} /></button>
            </div>

            {/* Contenu scrollable */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-10">

              {/* ── Progress + Résumé ── */}
              <div className="flex flex-col md:flex-row items-center gap-8">
                <CircularProgress percent={calculateV2Progress(selectedMarket)} color="text-green-500" icon={Activity} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  {/* Acteurs */}
                  <div className={`p-4 ${theme.card} border-white/5 space-y-2`}>
                    <h4 className={`text-[9px] font-black uppercase ${theme.textSecondary} flex items-center gap-2`}><User size={12} /> Acteurs</h4>
                    <p className={`text-[11px] font-bold ${theme.textMain}`}>MOA: <span className="opacity-70">{selectedMarket.execution.moa_chef_service || 'N/A'}</span></p>
                    <p className={`text-[11px] font-bold ${theme.textMain}`}>Ingénieur: <span className="opacity-70">{selectedMarket.execution.moa_ingenieur || 'N/A'}</span></p>
                    {selectedMarket.execution.moe_type === 'PRIVE' && (
                      <p className="text-[11px] font-bold text-accent">MOE: {selectedMarket.execution.moe_prive_nom || '—'}</p>
                    )}
                  </div>
                  {/* Dates */}
                  <div className={`p-4 ${theme.card} border-white/5 space-y-2`}>
                    <h4 className={`text-[9px] font-black uppercase ${theme.textSecondary} flex items-center gap-2`}><Calendar size={12} /> Dates Clés</h4>
                    <p className={`text-[10px] ${theme.textMain}`}>Signature: <span className="font-bold">{formatDate(selectedMarket.dates_realisees.signature_marche || null)}</span></p>
                    <p className={`text-[10px] ${theme.textMain}`}>T0 (OS): <span className="font-bold">{formatDate(selectedMarket.execution.date_notif_os || null)}</span></p>
                    <p className={`text-[10px] ${theme.textMain}`}>Délai: <span className="font-bold">{selectedMarket.execution.delai_mois ? `${selectedMarket.execution.delai_mois} mois` : '—'}</span></p>
                  </div>
                  {/* Config */}
                  <div className={`p-4 ${theme.card} border-white/5 space-y-2`}>
                    <h4 className={`text-[9px] font-black uppercase ${theme.textSecondary} flex items-center gap-2`}><Briefcase size={12} /> Contrat</h4>
                    <p className={`text-[10px] ${theme.textMain}`}>Type: <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                      selectedMarket.execution.type_contrat === 'FORFAIT' ? 'bg-accent/10 text-accent' :
                      selectedMarket.execution.type_contrat === 'FOURNITURE' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                    }`}>{selectedMarket.execution.type_contrat || 'BORDEREAU'}</span></p>
                    <p className={`text-[10px] ${theme.textMain}`}>Réf: <span className="font-bold">{selectedMarket.execution.ref_contrat || '—'}</span></p>
                    <p className={`text-[10px] ${theme.textMain}`}>Garantie: <span className="font-bold">{selectedMarket.execution.type_retenue_garantie || '—'}</span></p>
                  </div>
                </div>
              </div>

              {/* ══════════════════════════════════════ */}
              {/* BORDEREAU : Périodes Mensuelles        */}
              {/* ══════════════════════════════════════ */}
              {(selectedMarket.execution.type_contrat === 'BORDEREAU' || !selectedMarket.execution.type_contrat) && (
                <div className="space-y-4">
                  <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}>
                    <CalendarDays size={14} className="text-success" /> Suivi Mensuel ({(selectedMarket.execution.periodes || []).length} périodes)
                  </h3>

                  {/* Cumul global */}
                  {(selectedMarket.execution.periodes || []).length > 0 && (
                    <div className={`p-4 ${theme.card} border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3`}>
                      <div className="flex items-center gap-6">
                        <div><span className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>Cumul Décompté</span><p className="text-lg font-black text-green-500">{(selectedMarket.execution.periodes || []).reduce((acc, p) => acc + (p.montant_decompte || 0), 0).toLocaleString()} FCFA</p></div>
                        <div><span className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>Périodes Payées</span><p className={`text-lg font-black ${theme.textMain}`}>{(selectedMarket.execution.periodes || []).filter(p => p.statut_paiement === 'PAYE').length} / {(selectedMarket.execution.periodes || []).length}</p></div>
                      </div>
                      {selectedMarket.montant_ttc_reel && (
                        <div><span className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>Reste à Exécuter</span><p className={`text-lg font-black ${theme.textAccent}`}>{(selectedMarket.montant_ttc_reel! - (selectedMarket.execution.periodes || []).reduce((acc, p) => acc + (p.montant_decompte || 0), 0)).toLocaleString()} FCFA</p></div>
                      )}
                    </div>
                  )}

                  {/* Accordéon des périodes */}
                  <div className="space-y-2">
                    {(selectedMarket.execution.periodes || []).sort((a, b) => a.ordre - b.ordre).map(p => {
                      const isExpanded = expandedPeriodeId === p.id;
                      return (
                        <div key={p.id} className={`${theme.card} border-white/5 overflow-hidden`}>
                          {/* Header période */}
                          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all" onClick={() => setExpandedPeriodeId(isExpanded ? null : p.id)}>
                            <div className="flex items-center gap-4">
                              {isExpanded ? <ChevronUp size={16} className={theme.textAccent} /> : <ChevronDown size={16} className={theme.textSecondary} />}
                              <div>
                                <p className={`text-[11px] font-black ${theme.textMain} uppercase`}>{p.label}</p>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className={`text-[9px] ${theme.textSecondary}`}>{p.numero_decompte || '—'}</span>
                                  <span className={`text-[10px] font-black ${theme.textAccent}`}>{(p.montant_decompte || 0).toLocaleString()} FCFA</span>
                                  <PaiementBadge statut={p.statut_paiement} />
                                  {p.has_reclamation && <span className="px-1.5 py-0.5 bg-danger/20 text-danger rounded text-[8px] font-black uppercase">Réclamation</span>}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Détails période */}
                          {isExpanded && (
                            <div className="p-6 border-t border-white/5 space-y-4 animate-in fade-in duration-200">
                              {/* Infos */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div><span className={`text-[8px] font-black uppercase ${theme.textSecondary}`}>N° Décompte</span><p className={`text-[11px] font-bold ${theme.textMain}`}>{p.numero_decompte || '—'}</p></div>
                                <div><span className={`text-[8px] font-black uppercase ${theme.textSecondary}`}>Montant</span><p className="text-[11px] font-black text-green-500">{(p.montant_decompte || 0).toLocaleString()} FCFA</p></div>
                                <div><span className={`text-[8px] font-black uppercase ${theme.textSecondary}`}>N° Facture</span><p className={`text-[11px] font-bold ${theme.textMain}`}>{p.numero_facture || '—'}</p></div>
                                <div><span className={`text-[8px] font-black uppercase ${theme.textSecondary}`}>Paiement</span><p className="text-[11px]"><PaiementBadge statut={p.statut_paiement} />{p.date_paiement && <span className={`ml-2 text-[9px] ${theme.textSecondary}`}>{formatDate(p.date_paiement)}</span>}</p></div>
                              </div>

                              {/* Documents */}
                              <div className="grid grid-cols-1 gap-1.5">
                                {[
                                  { label: 'Attachement', docId: p.doc_attachement_id },
                                  { label: 'Rapport MOE', docId: p.doc_rapport_moe_id },
                                  { label: 'OS du mois', docId: p.doc_os_periode_id },
                                  { label: 'Facture', docId: p.doc_facture_id },
                                  { label: 'Ordre de Virement', docId: p.doc_ov_id },
                                ].map(doc => (
                                  <div key={doc.label} className="p-3 bg-white/5 rounded-xl flex items-center justify-between">
                                    <span className={`text-[10px] font-black ${theme.textMain} uppercase`}>{doc.label}</span>
                                    <DocCell docId={doc.docId} label={doc.label} />
                                  </div>
                                ))}
                              </div>

                              {/* Observations */}
                              {p.observations && (
                                <div className="p-3 bg-white/5 rounded-xl">
                                  <span className={`text-[8px] font-black uppercase ${theme.textSecondary}`}>Observations</span>
                                  <p className={`text-[11px] ${theme.textMain} mt-1`}>{p.observations}</p>
                                </div>
                              )}

                              {/* Réclamation */}
                              {p.has_reclamation && (
                                <div className="p-4 bg-danger/5 rounded-xl border border-danger/10 space-y-2">
                                  <span className="text-[9px] font-black uppercase text-danger">Réclamation</span>
                                  <p className={`text-[11px] font-bold ${theme.textMain}`}>{p.objet_reclamation || '—'}</p>
                                  <div className="flex gap-4">
                                    <div className="flex items-center gap-2"><span className={`text-[9px] ${theme.textSecondary}`}>Lettre:</span><DocCell docId={p.doc_reclamation_id} label="Réclamation" /></div>
                                    <div className="flex items-center gap-2"><span className={`text-[9px] ${theme.textSecondary}`}>Réponse:</span><DocCell docId={p.doc_reponse_reclamation_id} label="Réponse" /></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(selectedMarket.execution.periodes || []).length === 0 && (
                      <div className={`p-8 ${theme.card} border-dashed border-white/5 text-center`}><p className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Aucune période enregistrée</p></div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════ */}
              {/* FORFAIT : Livrables                   */}
              {/* ══════════════════════════════════════ */}
              {selectedMarket.execution.type_contrat === 'FORFAIT' && (
                <div className="space-y-3">
                  <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}>
                    <BarChart3 size={14} className="text-accent" /> Livrables ({(selectedMarket.execution.livrables || []).length})
                  </h3>
                  <div className={`${theme.card} overflow-hidden overflow-x-auto`}>
                    <table className="w-full text-left min-w-[750px]">
                      <thead className="bg-black/10"><tr className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>
                        <th className="p-3">Livrable</th><th className="p-3">Deadline</th><th className="p-3">Montant</th><th className="p-3">Statut</th><th className="p-3">Rapport</th><th className="p-3">PV CSRT</th><th className="p-3">Facture</th><th className="p-3">OV</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {(selectedMarket.execution.livrables || []).map(l => (
                          <tr key={l.id}>
                            <td className={`p-3 text-[11px] font-bold ${theme.textMain}`}>{l.libelle || '—'}</td>
                            <td className={`p-3 text-[10px] ${theme.textSecondary}`}>{l.date_limite ? formatDate(l.date_limite) : '—'}</td>
                            <td className="p-3 text-[11px] font-mono font-bold">{l.montant_prevu?.toLocaleString() || '—'}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              l.statut === 'VALIDE' ? 'bg-success/20 text-success' :
                              l.statut === 'REJETE' ? 'bg-danger/20 text-danger' :
                              l.statut === 'SOUMIS' ? 'bg-primary/20 text-primary' : 'bg-white/10'
                            }`}>{l.statut}</span></td>
                            <td className="p-3"><DocCell docId={l.doc_rapport_id} label="Rapport" /></td>
                            <td className="p-3"><DocCell docId={l.doc_pv_csrt_id} label="PV" /></td>
                            <td className="p-3"><DocCell docId={l.doc_facture_id} label="Facture" /></td>
                            <td className="p-3"><DocCell docId={l.doc_ov_id} label="OV" /></td>
                          </tr>
                        ))}
                        {(!selectedMarket.execution.livrables || selectedMarket.execution.livrables.length === 0) && (
                          <tr><td colSpan={8} className="p-6 text-center text-[10px] italic opacity-50">Aucun livrable</td></tr>
                        )}
                      </tbody>
                    </table>
                    {/* Cumul livrables validés */}
                    {(selectedMarket.execution.livrables || []).filter(l => l.statut === 'VALIDE').length > 0 && (
                      <div className="p-4 bg-black/10 border-t border-white/5 flex justify-between items-center px-6">
                        <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Cumul Validé</span>
                        <span className="text-sm font-black text-green-500">{(selectedMarket.execution.livrables || []).filter(l => l.statut === 'VALIDE').reduce((acc, l) => acc + (l.montant_prevu || 0), 0).toLocaleString()} FCFA</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════ */}
              {/* FOURNITURE : Bons de Livraison         */}
              {/* ══════════════════════════════════════ */}
              {selectedMarket.execution.type_contrat === 'FOURNITURE' && (
                <div className="space-y-3">
                  <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}>
                    <Package size={14} className="text-warning" /> Bons de Livraison ({(selectedMarket.execution.bons_livraison || []).length})
                  </h3>
                  <div className={`${theme.card} overflow-hidden overflow-x-auto`}>
                    <table className="w-full text-left min-w-[750px]">
                      <thead className="bg-black/10"><tr className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>
                        <th className="p-3">N° BL</th><th className="p-3">Désignation</th><th className="p-3">Qté</th><th className="p-3">Montant</th><th className="p-3">Statut</th><th className="p-3">BL Signé</th><th className="p-3">PV Réception</th><th className="p-3">OV</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {(selectedMarket.execution.bons_livraison || []).map(bl => (
                          <tr key={bl.id}>
                            <td className={`p-3 text-[10px] font-black ${theme.textAccent}`}>{bl.numero}</td>
                            <td className={`p-3 text-[11px] font-bold ${theme.textMain}`}>{bl.designation || '—'}</td>
                            <td className={`p-3 text-[11px] font-bold ${theme.textMain}`}>{bl.quantite}</td>
                            <td className="p-3 text-[11px] font-mono font-bold">{bl.montant?.toLocaleString() || '—'}</td>
                            <td className="p-3"><span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                              bl.statut === 'PAYE' ? 'bg-success/20 text-success' :
                              bl.statut === 'RECEPTIONNEE' ? 'bg-primary/20 text-primary' :
                              bl.statut === 'LIVRE' ? 'bg-accent/20 text-accent' : 'bg-white/10'
                            }`}>{bl.statut}</span></td>
                            <td className="p-3"><DocCell docId={bl.doc_bl_id} label="BL" /></td>
                            <td className="p-3"><DocCell docId={bl.doc_pv_reception_id} label="PV" /></td>
                            <td className="p-3"><DocCell docId={bl.doc_ov_id} label="OV" /></td>
                          </tr>
                        ))}
                        {(!selectedMarket.execution.bons_livraison || selectedMarket.execution.bons_livraison.length === 0) && (
                          <tr><td colSpan={8} className="p-6 text-center text-[10px] italic opacity-50">Aucun bon de livraison</td></tr>
                        )}
                      </tbody>
                    </table>
                    {/* Cumul BL */}
                    {(selectedMarket.execution.bons_livraison || []).length > 0 && (
                      <div className="p-4 bg-black/10 border-t border-white/5 flex justify-between items-center px-6">
                        <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Cumul Réceptionné</span>
                        <span className="text-sm font-black text-green-500">{(selectedMarket.execution.bons_livraison || []).filter(bl => bl.statut === 'RECEPTIONNEE' || bl.statut === 'PAYE').reduce((acc, bl) => acc + (bl.montant || 0), 0).toLocaleString()} FCFA</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════ */}
              {/* FALLBACK V1 : Anciens décomptes        */}
              {/* ══════════════════════════════════════ */}
              {!selectedMarket.execution.type_contrat && (selectedMarket.execution.decomptes || []).length > 0 && (
                <div className="space-y-3">
                  <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}>
                    <BarChart3 size={14} className="text-primary" /> Décomptes (V1 - Legacy)
                  </h3>
                  <div className={`${theme.card} overflow-hidden overflow-x-auto`}>
                    <table className="w-full text-left min-w-[500px]">
                      <thead className="bg-black/10"><tr className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>
                        <th className="p-3">N°</th><th className="p-3">Objet</th><th className="p-3">Montant</th><th className="p-3">Document</th>
                      </tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {(selectedMarket.execution.decomptes || []).map(d => (
                          <tr key={d.id}>
                            <td className={`p-3 text-[11px] font-bold ${theme.textAccent}`}>#{d.numero}</td>
                            <td className={`p-3 text-[11px] ${theme.textMain}`}>{d.objet || '—'}</td>
                            <td className="p-3 text-[11px] font-mono">{d.montant.toLocaleString()}</td>
                            <td className="p-3"><DocCell docId={d.doc_attachement_id || d.doc_id} label="Doc" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Avenants ── */}
              {(selectedMarket.execution.avenants || []).length > 0 && (
                <div className="space-y-3">
                  <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}><TrendingUp size={14} className="text-warning" /> Avenants ({selectedMarket.execution.avenants.length})</h3>
                  {selectedMarket.execution.avenants.map((a, i) => (
                    <div key={a.id} className="p-5 bg-white/5 rounded-2xl border border-warning/10 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="px-3 py-1 bg-warning/10 text-warning text-[10px] font-black rounded-lg uppercase">Avenant N°{i + 1}</span>
                        <span className={`text-[10px] font-black ${theme.textMain}`}>{a.montant_incidence.toLocaleString()} FCFA</span>
                      </div>
                      <p className={`text-xs font-bold ${theme.textMain} uppercase`}>{a.objet}</p>
                      <div className="flex gap-4">
                        {[{ label: 'Notification', key: 'doc_notification_id' }, { label: 'OS', key: 'doc_os_id' }, { label: 'Enregistrement', key: 'doc_enreg_id' }].map(doc => (
                          <div key={doc.key} className="flex items-center gap-2">
                            <span className={`text-[9px] ${theme.textSecondary}`}>{doc.label}:</span>
                            <DocCell docId={(a as any)[doc.key]} label={doc.label} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ── Résiliation ── */}
              {selectedMarket.execution.is_resilie && (
                <div className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/20 space-y-6">
                  <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[11px] tracking-widest"><AlertTriangle size={20} /> Procédure de Résiliation</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { step: 1, label: 'Mise en Demeure', key: 'doc_mise_en_demeure_id' },
                      { step: 2, label: 'Constat de Carence', key: 'doc_constat_carence_id' },
                      { step: 3, label: 'Décision Finale', key: 'doc_decision_resiliation_id' }
                    ].map(s => (
                      <div key={s.step} className="p-4 bg-white/5 rounded-2xl border border-red-500/10 text-center space-y-3 flex flex-col items-center">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Étape {s.step}</p>
                        <p className={`text-xs font-black ${theme.textMain} uppercase leading-none`}>{s.label}</p>
                        <DocCell docId={(selectedMarket.execution as any)[s.key]} label={s.label} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Documents Admin ── */}
              <div className="space-y-3">
                <h3 className={`text-[11px] font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}><FileDown size={14} className="text-primary" /> Documents Administratifs</h3>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Notification du contrat', key: 'doc_notif_contrat_id' },
                    { label: 'OS de Démarrage', key: 'doc_notif_os_id', dateKey: 'date_notif_os' },
                    { label: 'Cautionnement Définitif', key: 'doc_caution_def_id' },
                    { label: 'Contrat enregistré', key: 'doc_contrat_enreg_id' },
                    { label: 'Police d\'Assurance', key: 'doc_assurance_id' },
                    { label: 'Dossier d\'Exécution', key: 'doc_dossier_exec_id' },
                    { label: 'Rapport d\'exécution', key: 'doc_rapport_exec_id' },
                    { label: 'PV Réception Provisoire', key: 'doc_pv_provisoire_id', dateKey: 'date_pv_provisoire' },
                    { label: 'PV Réception Définitive', key: 'doc_pv_definitif_id', dateKey: 'date_pv_definitif' }
                  ].map(doc => {
                    const docId = (selectedMarket.execution as any)?.[doc.key];
                    const dateValue = doc.dateKey ? (selectedMarket.execution as any)?.[doc.dateKey] : null;
                    return (
                      <div key={doc.key} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between hover:bg-white/10 transition-all">
                        <div className="flex flex-col">
                          <span className={`text-xs font-black ${theme.textMain} opacity-80 uppercase`}>{doc.label}</span>
                          {dateValue && <span className="text-[10px] uppercase tracking-tighter flex items-center gap-1.5 text-green-500 font-black"><Calendar size={10} /> {formatDate(dateValue)}</span>}
                          {!dateValue && !docId && <span className={`text-[10px] ${theme.textSecondary} italic`}>En attente</span>}
                        </div>
                        <DocCell docId={docId} label={doc.label} />
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
