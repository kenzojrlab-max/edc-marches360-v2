import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Search, ExternalLink, X, FileBox, FileCheck, Activity, Lock, 
  FileText, CreditCard, TrendingUp, Layers, AlertTriangle, 
  AlertCircle, CheckCircle2, UserCheck, Banknote, Gavel, Ban, 
  ChevronRight, Calendar, Download, Info, XCircle, Clock, Receipt, HardHat,
  ShieldCheck
} from 'lucide-react';
import { JALONS_PPM_CONFIG, JALONS_LABELS, JALONS_GROUPS } from '../constants';
import { formatDate, getLateStatus, calculateDaysBetween } from '../utils/date';
import { useSearchParams } from 'react-router-dom';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { FileManager } from '../components/FileManager';
import { Marche, SourceFinancement } from '../types';
import { storage } from '../utils/storage';

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

export const PPMView: React.FC = () => {
  const { markets, projects } = useMarkets();
  const { can } = useAuth();
  const { theme, themeType } = useTheme();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [detailMarketId, setDetailMarketId] = useState<string | null>(null);
  const [scrolledId, setScrolledId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const projectFilter = searchParams.get('projectId');
    const highlightedId = searchParams.get('id');
    
    if (projectFilter) setSelectedProjectId(projectFilter);
    
    if (highlightedId) {
      // 1. Trouver le marché pour ajuster les filtres automatiquement
      const targetMarket = markets.find(m => m.id === highlightedId);
      if (targetMarket) {
        const parentProject = projects.find(p => p.id === targetMarket.projet_id);
        if (parentProject) {
          setSelectedYear(parentProject.exercice.toString());
          setSelectedProjectId(parentProject.id);
        }
      }

      // 2. Déclencher le scroll après un court délai pour laisser le temps aux filtres de s'appliquer
      setScrolledId(highlightedId);
      const timer = setTimeout(() => {
        const element = document.getElementById(`market-row-${highlightedId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Nettoyer l'ID des params après le scroll réussi pour éviter les répétitions
          const newParams = new URLSearchParams(searchParams);
          newParams.delete('id');
          setSearchParams(newParams, { replace: true });
        }
      }, 600);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, markets, projects]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString()))) as string[];
    return years.sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const yearOptions = [{ value: '', label: 'Tous les exercices' }, ...availableYears.map(y => ({ value: y, label: y }))];
  const projectOptions = useMemo(() => [{ value: '', label: 'Tous les projets' }, ...projects.map(p => ({ value: p.id, label: p.libelle }))], [projects]);

  const selectedProjectObj = useMemo(() => 
    projects.find(p => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const handleDownloadSignedPPM = async () => {
    if (!selectedProjectObj?.ppm_doc_id || !can('DOWNLOAD')) return;
    const doc = await storage.getDocById(selectedProjectObj.ppm_doc_id);
    if (!doc) return;
    const link = document.createElement('a');
    link.href = doc.url || (doc as any).data;
    link.download = doc.nom || `PPM_Signe_${selectedProjectObj.libelle}.pdf`;
    link.click();
  };

  const handleTopScroll = () => { if (topScrollRef.current && tableContainerRef.current) tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft; };
  const handleTableScroll = () => { if (tableContainerRef.current && topScrollRef.current) topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft; };

  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      const parentProject = projects.find(p => p.id === m.projet_id);
      const matchProject = !selectedProjectId || m.projet_id === selectedProjectId;
      const matchYear = !selectedYear || parentProject?.exercice.toString() === selectedYear;
      const matchSearch = (m.numDossier || "").toLowerCase().includes(searchTerm.toLowerCase()) || (m.objet || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchProject && matchSearch && matchYear;
    });
  }, [markets, projects, selectedProjectId, selectedYear, searchTerm]);

  const getSolidBg = () => {
    if (themeType === 'glass') return 'bg-[#1a2333]'; 
    if (themeType === 'cyber') return 'bg-[#050b1a]';
    if (themeType === 'retro') return 'bg-white';
    if (themeType === 'clay') return 'bg-[#f0f2f5]';
    return 'bg-white';
  };

  const calculateProgress = (m: Marche) => {
    const isEDC = m.source_financement === SourceFinancement.BUDGET_EDC;
    let passKeys = JALONS_GROUPS.flatMap(g => g.keys);
    passKeys = passKeys.filter(key => {
      if (isEDC && key.includes('ano')) return false;
      if (key === 'additif' && !m.has_additif) return false;
      if (key === 'recours' && !m.has_recours) return false;
      if (key === 'infructueux' && !m.is_infructueux) return false;
      if (key === 'annule' && !m.is_annule) return false;
      return true;
    });
    const completedCount = passKeys.filter(k => !!m.dates_realisees[k as keyof typeof m.dates_realisees] || !!m.docs?.[k]).length;
    const passPercent = passKeys.length > 0 ? (completedCount / passKeys.length) * 100 : 0;
    
    const exec = m.execution;
    const execWeight = [exec.ref_contrat, exec.doc_notif_contrat_id, exec.doc_notif_os_id, exec.doc_pv_provisoire_id].filter(Boolean).length;
    return { passation: Math.min(passPercent, 100), execution: (execWeight / 4) * 100 };
  };

  const getStepStatus = (date: string | undefined, docId: string | undefined) => {
    if (date && docId) return { label: "Étape Finalisée & Archivée", color: "text-green-500 font-black", icon: <CheckCircle2 size={12}/> };
    if (date) return { label: `Validé le ${formatDate(date)}`, color: "text-primary font-bold", icon: <CheckCircle2 size={12}/> };
    if (docId) return { label: "Preuve Enregistrée", color: "text-accent font-bold", icon: <FileCheck size={12}/> };
    return { label: "En attente de confirmation", color: "text-slate-500 italic", icon: <Clock size={12}/> };
  };

  const selectedMarket = markets.find(m => m.id === detailMarketId);

  // LOGIQUE DE SLICING DES JALONS
  const getVisibleJalonsOfGroup = (group: typeof JALONS_GROUPS[0], m: Marche) => {
    const visible = [];
    for (const key of group.keys) {
      visible.push(key);
      if (key === 'infructueux' && m.is_infructueux) break;
      if (key === 'annule' && m.is_annule) break;
    }
    return visible;
  };

  const isGroupVisible = (group: typeof JALONS_GROUPS[0], m: Marche) => {
    const groups = JALONS_GROUPS;
    const currentIdx = groups.indexOf(group);
    if (m.is_infructueux) {
      const stopIdx = groups.findIndex(g => g.keys.includes('infructueux'));
      return currentIdx <= stopIdx;
    }
    if (m.is_annule) {
      const stopIdx = groups.findIndex(g => g.keys.includes('annule'));
      return currentIdx <= stopIdx;
    }
    return true;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">
      {/* HEADER & FILTRES */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 relative z-[200]">
        <div className="border-l-4 border-primary pl-4">
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Suivi PPM</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Registre complet consolidé par exercice.</p>
        </div>
        <div className={`${theme.card} p-3 flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-[300]`}>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
          <div className="w-full md:w-64"><CustomBulleSelect label="" value={selectedProjectId} options={projectOptions} onChange={setSelectedProjectId} /></div>
          
          {selectedProjectObj?.ppm_doc_id && (
            <button 
              onClick={handleDownloadSignedPPM}
              className={`flex items-center gap-2 px-4 py-2.5 bg-success/10 text-success hover:bg-success hover:text-white ${theme.buttonShape} text-[10px] font-black uppercase transition-all shadow-sm border border-success/20 shrink-0`}
              title="Télécharger le PPM Signé"
            >
              <FileCheck size={16} /> <span className="hidden xl:inline">PPM Signé</span>
            </button>
          )}

          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : theme.textSecondary}`} size={16} strokeWidth={theme.iconStroke} />
            <input type="text" placeholder="Rechercher..." className={`${theme.input} pl-10 pr-4 py-2.5 w-full font-black ${themeType === 'glass' ? 'text-white' : ''}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* TABLEAU AVEC CORRECTION STICKY & Z-INDEX */}
      <div className={`${theme.card} flex flex-col relative overflow-visible z-[10]`}>
        <div ref={topScrollRef} onScroll={handleTopScroll} className="overflow-x-auto overflow-y-hidden custom-scrollbar border-b border-white/5 sticky top-0 z-[100] h-4">
          <div className="h-[1px] min-w-[3600px]"></div>
        </div>
        <div ref={tableContainerRef} onScroll={handleTableScroll} className="overflow-auto custom-scrollbar max-h-[75vh]">
          <table className="w-full text-left border-collapse min-w-[3600px] table-fixed">
            <thead>
              <tr className="z-[300]">
                {/* Coin En-tête : Z-INDEX MAXIMAL (100) pour passer au dessus de tout */}
                <th rowSpan={2} className={`p-8 border-b border-r border-white/5 text-[10px] font-black uppercase ${theme.textSecondary} sticky left-0 top-0 ${getSolidBg()} z-[100] w-[420px] align-middle text-center`}>Dossier & Objet</th>
                <th rowSpan={2} className={`p-8 border-b border-r border-white/5 text-[10px] font-black uppercase ${theme.textSecondary} text-center sticky top-0 ${getSolidBg()} z-[80] w-[180px] align-middle`}>Budget Estimé</th>
                {JALONS_PPM_CONFIG.map(jalon => (
                  <th key={jalon.key} colSpan={2} className={`p-6 border-b border-r border-white/5 text-[10px] font-black uppercase ${theme.textSecondary} text-center ${getSolidBg()} sticky top-0 z-[80] align-middle`}>{jalon.label}</th>
                ))}
                <th rowSpan={2} className={`p-8 border-b border-r border-white/5 text-[10px] font-black uppercase ${theme.textSecondary} text-center sticky top-0 ${getSolidBg()} z-[80] w-[200px] align-middle`}>Synthèse Délais</th>
                <th rowSpan={2} className={`p-8 border-b border-white/5 text-[10px] font-black uppercase ${theme.textSecondary} text-center sticky right-0 top-0 ${getSolidBg()} z-[90] w-[100px] align-middle`}>Détails</th>
              </tr>
              <tr className="z-[250]">
                {/* Ligne PRÉVUE/RÉALISÉE : Z-INDEX 80 et top exact pour éviter les fuites de dates */}
                {JALONS_PPM_CONFIG.map(jalon => (
                  <React.Fragment key={`${jalon.key}-sub`}>
                    <th className={`p-4 border-b border-r border-white/5 text-[9px] font-black ${theme.textSecondary} text-center uppercase sticky top-[82px] ${getSolidBg()} z-[80]`}>Prévue</th>
                    <th className={`p-4 border-b border-r border-white/5 text-[9px] font-black ${theme.textAccent} text-center uppercase sticky top-[82px] ${getSolidBg()} z-[80]`}>Réalisée</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMarkets.length > 0 ? filteredMarkets.map((m) => {
                const isAborted = m.is_annule || m.is_infructueux;
                const isHighlighted = scrolledId === m.id;
                const isClosed = !!m.execution.doc_pv_definitif_id;
                const isResilie = !!m.execution.is_resilie;

                const delaiPrevu = (m.dates_prevues.saisine_cipm && m.dates_prevues.signature_marche) ? calculateDaysBetween(m.dates_prevues.saisine_cipm, m.dates_prevues.signature_marche) : null;
                const delaiRealise = (m.dates_realisees.saisine_cipm && m.dates_realisees.signature_marche) ? calculateDaysBetween(m.dates_realisees.saisine_cipm, m.dates_realisees.signature_marche) : null;
                
                return (
                  <tr 
                    key={m.id} 
                    id={`market-row-${m.id}`} 
                    onDoubleClick={() => setDetailMarketId(m.id)} 
                    className={`group transition-all cursor-pointer hover:bg-white/10 ${isAborted ? 'opacity-80 grayscale-[0.5]' : ''} ${isHighlighted ? 'bg-primary/10 ring-4 ring-primary ring-inset animate-pulse' : ''}`}
                  >
                    {/* Colonne de gauche fixe dans le body : Z-INDEX 50 pour passer AU DESSUS des PRÉVUE/RÉALISÉE du body */}
                    <td className={`p-8 border-r border-white/5 sticky left-0 z-[50] ${getSolidBg()}`}>
                      <div className="flex flex-col gap-2">
                        <span className={`text-[10px] font-black px-3 py-1 ${theme.buttonShape} w-fit ${m.is_annule ? 'bg-danger text-white' : m.is_infructueux ? 'bg-warning text-black' : 'bg-primary text-white'}`}>{m.numDossier}</span>
                        <span className={`text-xs font-black ${theme.textMain} line-clamp-2 uppercase whitespace-normal leading-snug`}>{m.objet}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {isResilie && <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black rounded uppercase tracking-tighter shadow-sm animate-pulse">Marché Résilié</span>}
                          {m.is_annule && <span className="px-2 py-0.5 bg-black text-white text-[8px] font-black rounded uppercase tracking-tighter">Dossier Annulé</span>}
                          {m.is_infructueux && <span className="px-2 py-0.5 bg-warning text-black text-[8px] font-black rounded uppercase tracking-tighter">Dossier Infructueux</span>}
                          {isClosed && !isResilie && <span className="px-2 py-0.5 bg-green-600 text-white text-[8px] font-black rounded uppercase tracking-tighter">Marché exécuté & clôturé</span>}
                        </div>
                      </div>
                    </td>
                    <td className={`p-8 border-r border-white/5 text-sm font-black ${theme.textMain} text-right`}>{(m.montant_prevu || 0).toLocaleString()} <span className="text-[9px] opacity-30">FCFA</span></td>
                    {JALONS_PPM_CONFIG.map(jalon => {
                      const isEDC = m.source_financement === SourceFinancement.BUDGET_EDC;
                      if (isEDC && jalon.key.includes('ano')) return <td key={jalon.key} colSpan={2} className={`p-4 border-r border-white/5 text-center text-[9px] font-black ${theme.textSecondary} opacity-20 italic`}>N/A</td>;
                      const p = m.dates_prevues[jalon.key as keyof typeof m.dates_prevues];
                      const r = m.dates_realisees[jalon.key as keyof typeof m.dates_realisees];
                      const s = getLateStatus(p || null, r || null);
                      return (
                        <React.Fragment key={`${m.id}-${jalon.key}`}>
                          <td className={`p-4 border-r border-white/5 text-center text-[10px] font-bold ${theme.textSecondary} opacity-60`}>{formatDate(p || null)}</td>
                          <td className={`p-4 border-r border-white/5 text-center text-[10px] font-black ${s === 'late' ? 'text-red-500 bg-red-500/10' : s === 'done' ? 'text-green-500 bg-green-500/10' : theme.textSecondary}`}>{formatDate(r || null)}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="p-8 border-r border-white/5">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter"><span className={theme.textSecondary}>Prévu :</span><span className={theme.textMain}>{delaiPrevu !== null ? `${delaiPrevu} j` : '-'}</span></div>
                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter"><span className={theme.textSecondary}>Réalisé :</span><span className={delaiRealise !== null ? theme.textAccent : theme.textSecondary}>{delaiRealise !== null ? `${delaiRealise} j` : '-'}</span></div>
                      </div>
                    </td>
                    <td className={`p-6 text-center sticky right-0 z-[50] ${getSolidBg()} w-[100px]`}><button onClick={() => setDetailMarketId(m.id)} className={`p-3 ${theme.buttonSecondary} ${theme.buttonShape}`}><ExternalLink size={18} /></button></td>
                  </tr>
                );
              }) : (<tr><td colSpan={100} className="p-40 text-center font-black uppercase text-slate-400">Aucun marché trouvé</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DÉTAILS - SYNCHRONISATION 360° */}
      {selectedMarket && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-2 md:p-4">
           <div className={`relative w-full max-w-[1400px] h-[95vh] ${theme.card} shadow-2xl overflow-hidden flex flex-col animate-zoom-in border border-white/10`}>
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 ${theme.card} flex items-center justify-center font-black text-xl ${theme.textAccent}`}>{selectedMarket.numDossier.charAt(0)}</div>
                  <div className="max-w-3xl">
                    <h2 className={`text-xl font-black ${theme.textMain} uppercase leading-none`}>{selectedMarket.numDossier}</h2>
                    <p className={`text-sm font-bold ${theme.textSecondary} mt-1 line-clamp-1 uppercase`}>{selectedMarket.objet}</p>
                  </div>
                </div>
                <button onClick={() => setDetailMarketId(null)} className={`${theme.buttonSecondary} ${theme.buttonShape} px-6 py-4 flex items-center gap-3 font-black text-xs uppercase transition-all`}>Fermer <X size={18}/></button>
              </div>

              <div className="flex-1 flex divide-x divide-white/5 overflow-hidden">
                {/* VOLET GAUCHE: PASSATION DÉTAILLÉE AVEC SLICING */}
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="px-12 py-5 bg-black/5 border-b border-white/5 flex items-center justify-between">
                      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textAccent}`}>Phase Passation détaillée</h3>
                      <span className={`px-3 py-1 ${theme.card} text-[9px] font-black uppercase`}>{selectedMarket.source_financement}</span>
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                      <div className="mb-12 flex justify-center"><CircularProgress percent={calculateProgress(selectedMarket).passation} color={theme.textAccent} icon={FileBox} /></div>
                      <div className="space-y-10">
                         {/* SECTIONS CONDITIONNELLES ANNULATION / RECOURS / INFRUCTUEUX */}
                         {(selectedMarket.is_annule || selectedMarket.is_infructueux || selectedMarket.has_recours) && (
                           <div className="p-8 rounded-[2rem] bg-slate-950 border border-white/10 space-y-6 shadow-2xl animate-in slide-in-from-top-4">
                              <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[11px] tracking-widest"><AlertTriangle size={20}/> Statut Spécifique du Dossier</div>
                              <div className="space-y-4">
                                 {selectedMarket.is_annule && (
                                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                      <div className="flex items-center gap-2 text-danger font-black uppercase text-[10px]"><Ban size={14}/> Annulation Validée</div>
                                      <p className="text-[11px] font-bold text-slate-400 italic">Motif : {selectedMarket.motif_annulation || "Non renseigné"}</p>
                                      <FileManager existingDocId={selectedMarket.docs?.['annule_doc']} onUpload={() => {}} disabled />
                                   </div>
                                 )}
                                 {selectedMarket.is_infructueux && (
                                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                      <div className="flex items-center gap-2 text-warning font-black uppercase text-[10px]"><Activity size={14}/> Dossier déclaré Infructueux</div>
                                      <FileManager existingDocId={selectedMarket.docs?.['infructueux_doc']} onUpload={() => {}} disabled />
                                   </div>
                                 )}
                                 {selectedMarket.has_recours && (
                                   <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                                      <div className="flex items-center gap-2 text-blue-400 font-black uppercase text-[10px]"><Gavel size={14}/> Recours Introduit</div>
                                      <p className="text-[11px] font-bold text-slate-400 italic">Verdict : {selectedMarket.recours_issue || "En attente de jugement"}</p>
                                      <FileManager existingDocId={selectedMarket.docs?.['recours_doc']} onUpload={() => {}} disabled />
                                   </div>
                                 )}
                              </div>
                           </div>
                         )}

                         {JALONS_GROUPS.filter(g => isGroupVisible(g, selectedMarket)).map((group) => (
                           <div key={group.id} className="space-y-4">
                              <h4 className={`text-[9px] font-black uppercase tracking-widest ${theme.textSecondary} px-4 py-1 rounded-full w-fit bg-black/5`}>{group.label}</h4>
                              <div className="grid grid-cols-1 gap-2">
                                 {getVisibleJalonsOfGroup(group, selectedMarket).map(key => {
                                    const date = selectedMarket.dates_realisees[key as keyof typeof selectedMarket.dates_realisees];
                                    const docId = selectedMarket.docs?.[key];
                                    const status = getStepStatus(date, docId);

                                    if (key === 'titulaire') return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between bg-primary/5 hover:bg-primary/10 transition-all`}>
                                         <div className="flex items-center gap-4">
                                            <UserCheck className="text-primary" size={18} />
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase leading-none">Titulaire</p><p className={`text-xs font-black ${theme.textMain} uppercase mt-1`}>{selectedMarket.titulaire || "Non attribué"}</p></div>
                                         </div>
                                      </div>
                                    );
                                    if (key === 'montant_ttc_reel') return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between bg-success/5 hover:bg-success/10 transition-all`}>
                                         <div className="flex items-center gap-4">
                                            <Banknote className="text-success" size={18} />
                                            <div><p className="text-[10px] font-black text-slate-400 uppercase leading-none">Montant TTC</p><p className={`text-xs font-black ${theme.textMain} mt-1`}>{selectedMarket.montant_ttc_reel?.toLocaleString() || "-"} FCFA</p></div>
                                         </div>
                                      </div>
                                    );

                                    return (
                                      <div key={key} className={`p-4 ${theme.buttonShape} border border-white/5 flex items-center justify-between hover:bg-white/5 transition-all group`}>
                                         <div className="flex flex-col gap-0.5">
                                            <p className={`text-[10px] font-black ${theme.textMain} uppercase leading-none`}>{JALONS_LABELS[key] || key}</p>
                                            <span className={`text-[9px] uppercase tracking-tighter flex items-center gap-1.5 ${status.color}`}>
                                              {status.icon} {status.label}
                                            </span>
                                         </div>
                                         <FileManager existingDocId={docId} onUpload={() => {}} disabled />
                                      </div>
                                    );
                                 })}
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* VOLET DROIT: EXÉCUTION DÉTAILLÉE SYNCHRONISÉE */}
                <div className="flex-1 flex flex-col overflow-hidden">
                   <div className="px-12 py-5 bg-black/5 border-b border-white/5 flex items-center justify-between">
                      <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] text-green-500`}>Phase Exécution (Financier & Contractuel)</h3>
                      {selectedMarket.execution.is_resilie && <span className="px-3 py-1 bg-red-600 text-white text-[9px] font-black uppercase rounded shadow-lg animate-pulse">Résiliation Active</span>}
                   </div>
                   <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
                      <div className="mb-12 flex justify-center"><CircularProgress percent={calculateProgress(selectedMarket).execution} color="text-green-500" icon={Activity} /></div>
                      
                      {/* VERROUILLAGE SI DOSSIER STOPPÉ PRÉMATURÉMENT */}
                      {(selectedMarket.is_annule || selectedMarket.is_infructueux) ? (
                         <div className="p-12 text-center flex flex-col items-center gap-8 bg-slate-950/50 rounded-[3rem] border border-white/5">
                            <div className={`w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 shadow-2xl`}><XCircle size={48} /></div>
                            <div className="space-y-3">
                               <h4 className="text-lg font-black text-white uppercase tracking-tight">Phase Verrouillée Définitivement</h4>
                               <p className={`text-xs font-bold ${theme.textSecondary} uppercase italic leading-relaxed`}>Le dossier a été clôturé avant signature <br/> (Annulation ou Infructuosité)</p>
                            </div>
                         </div>
                      ) : !selectedMarket.dates_realisees.signature_marche ? (
                        <div className="p-12 text-center flex flex-col items-center gap-8">
                           <div className={`w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-slate-500 shadow-sm`}><Lock size={48} /></div>
                           <p className={`text-xs font-black ${theme.textSecondary} uppercase italic leading-relaxed`}>Phase Verrouillée <br/> Signature du marché requise pour ouvrir l'exécution</p>
                        </div>
                      ) : (
                        <div className="space-y-10 animate-in slide-in-from-right-4 pb-20">
                           
                           {/* DÉTAILS DU CONTRAT */}
                           <section className={`p-8 ${theme.card} border-white/5 space-y-6 relative`}>
                              <div className="flex items-center gap-3 text-green-500"><FileText size={20}/><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Synthèse Contractuelle</h4></div>
                              <div className="grid grid-cols-2 gap-8">
                                 <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Réf. Contrat</p><p className={`text-sm font-black ${theme.textMain}`}>{selectedMarket.execution.ref_contrat || 'Non renseignée'}</p></div>
                                 <div><p className="text-[9px] font-black text-slate-500 uppercase mb-1">Délai Global</p><p className={`text-sm font-black ${theme.textMain}`}>{selectedMarket.execution.delai_mois ? `${selectedMarket.execution.delai_mois} Mois` : 'Non défini'}</p></div>
                              </div>
                              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                                 <div><p className="text-[9px] font-black text-slate-500 uppercase">Garantie</p><p className={`text-[11px] font-bold ${theme.textMain} opacity-60 uppercase`}>{selectedMarket.execution.type_retenue_garantie || "Non définie"}</p></div>
                                 <FileManager existingDocId={selectedMarket.execution.doc_caution_bancaire_id} onUpload={() => {}} disabled />
                              </div>
                           </section>

                           {/* DÉCOMPTES & PAIEMENTS */}
                           <section className="space-y-4">
                              <div className="flex items-center justify-between px-4"><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><Receipt size={14}/> Décomptes ({selectedMarket.execution.decomptes.length})</h4><span className="text-xs font-black text-green-500">{selectedMarket.execution.decomptes.reduce((acc, d) => acc + d.montant, 0).toLocaleString()} FCFA</span></div>
                              <div className="space-y-2">
                                 {selectedMarket.execution.decomptes.map(d => (
                                   <div key={d.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                      <div className="flex-1">
                                         <p className={`text-xs font-black ${theme.textMain} uppercase`}>{d.objet || `Décompte N°${d.numero}`}</p>
                                         <p className="text-[9px] font-bold text-slate-500 uppercase">{d.date_validation ? `Validé le ${formatDate(d.date_validation)}` : "En attente de paiement"}</p>
                                      </div>
                                      <div className="flex items-center gap-4">
                                         <p className="text-xs font-black text-green-500">{d.montant.toLocaleString()} FCFA</p>
                                         <FileManager existingDocId={d.doc_id} onUpload={() => {}} disabled />
                                      </div>
                                   </div>
                                 ))}
                                 {selectedMarket.execution.decomptes.length === 0 && <p className="text-[10px] font-bold text-slate-500 italic px-6 py-4 bg-black/20 rounded-2xl border border-dashed border-white/10 text-center">Aucun décompte enregistré.</p>}
                              </div>
                           </section>

                           {/* AVENANTS DÉTAILLÉS */}
                           <section className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2"><TrendingUp size={14}/> Historique des Avenants</h4>
                              <div className="space-y-3">
                                 {selectedMarket.execution.avenants.map((a, i) => (
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
                                              <span className="text-[8px] font-black text-slate-500 uppercase">{doc.label}</span>
                                              <FileManager existingDocId={(a as any)[doc.key]} onUpload={() => {}} disabled />
                                           </div>
                                         ))}
                                      </div>
                                   </div>
                                 ))}
                                 {selectedMarket.execution.avenants.length === 0 && <p className="text-[10px] font-bold text-slate-500 italic px-4">Aucun avenant notifié.</p>}
                              </div>
                           </section>

                           {/* WORKFLOW DE RÉSILIATION */}
                           {selectedMarket.execution.is_resilie && (
                             <section className="p-8 bg-red-500/5 rounded-[2.5rem] border border-red-500/20 space-y-6 animate-in zoom-in-95">
                                <div className="flex items-center gap-3 text-red-500 font-black uppercase text-[11px] tracking-widest"><AlertTriangle size={20}/> Procédure de Résiliation</div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                   {[
                                      {step: 1, label: 'Mise en Demeure', key: 'doc_mise_en_demeure_id'},
                                      {step: 2, label: 'Constat de Carence', key: 'doc_constat_carence_id'},
                                      {step: 3, label: 'Décision Finale', key: 'doc_decision_resiliation_id'}
                                   ].map(s => (
                                      <div key={s.step} className="p-4 bg-white/5 rounded-2xl border border-red-500/10 text-center space-y-3 flex flex-col items-center">
                                         <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Étape {s.step}</p>
                                         <p className={`text-[10px] font-black ${theme.textMain} uppercase leading-none truncate w-full`}>{s.label}</p>
                                         <FileManager existingDocId={(selectedMarket.execution as any)[s.key]} onUpload={() => {}} disabled />
                                      </div>
                                   ))}
                                </div>
                             </section>
                           )}

                           {/* DOCUMENTS OFFICIELS D'EXÉCUTION */}
                           <section className="space-y-4">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4 flex items-center gap-2"><ShieldCheck size={14}/> Garanties & Documents Officiels</h4>
                              <div className="grid grid-cols-1 gap-2">
                                 {[
                                   { label: 'Notification du contrat', key: 'doc_notif_contrat_id' },
                                   { label: 'OS de Démarrage', key: 'doc_notif_os_id' },
                                   { label: 'Cautionnement Définitif', key: 'doc_caution_def_id' },
                                   { label: 'Contrat enregistré', key: 'doc_contrat_enreg_id' },
                                   { label: 'Police d\'Assurance', key: 'doc_assurance_id' },
                                   { label: 'PV Réception Provisoire', key: 'doc_pv_provisoire_id' },
                                   { label: 'PV Réception Définitive', key: 'doc_pv_definitif_id' }
                                 ].map(doc => {
                                   const docId = (selectedMarket.execution as any)[doc.key];
                                   const status = getStepStatus(undefined, docId);
                                   return (
                                     <div key={doc.key} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/10 transition-all">
                                        <div className="flex flex-col">
                                           <span className={`text-[10px] font-black ${theme.textMain} opacity-80 uppercase`}>{doc.label}</span>
                                           <span className={`text-[8px] uppercase tracking-tighter ${status.color}`}>{status.label}</span>
                                        </div>
                                        <FileManager existingDocId={docId} onUpload={() => {}} disabled />
                                     </div>
                                   );
                                 })}
                              </div>
                           </section>
                        </div>
                      )}
                   </div>
                </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
