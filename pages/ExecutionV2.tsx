import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarketFilter } from '../hooks/useMarketFilter';
import { BulleInput } from '../components/BulleInput';
import { FileManager } from '../components/FileManager';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { Modal } from '../components/Modal';
import {
  Lock, Search, TrendingUp, Plus, Trash2, FileText, CreditCard, Save,
  CheckCircle2, Layers, ArrowRight, Users, ChevronDown, ChevronUp,
  CalendarDays, Package
} from 'lucide-react';
import { TruncatedText } from '../components/TruncatedText';
import { useToast } from '../contexts/ToastContext';
import { PeriodeMensuelle, Livrable, BonLivraison, Avenant } from '../types';

// Mois en français
const MOIS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

export const ExecutionV2: React.FC = () => {
  const navigate = useNavigate();
  const { markets, updateMarket } = useMarkets();
  const { projects } = useProjects();
  const { can } = useAuth();
  const { theme, themeType } = useTheme();
  const toast = useToast();

  const {
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    yearOptions, financementOptions, filteredMarkets: baseFilteredMarkets
  } = useMarketFilter(markets, projects);

  const filteredMarkets = useMemo(() => {
    return baseFilteredMarkets.filter(m => !m.is_annule && !m.is_infructueux);
  }, [baseFilteredMarkets]);

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contractual' | 'actors' | 'financial'>('contractual');
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedPeriodeId, setExpandedPeriodeId] = useState<string | null>(null);

  const selectedMarket = markets.find(m => m.id === selectedMarketId);

  const updateExec = async (marketId: string, updates: any) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    try {
      await updateMarket(marketId, { execution: { ...market.execution, ...updates } });
    } catch {
      toast.error("Erreur lors de la mise à jour. Vérifiez votre connexion.");
    }
  };

  const handleDocUpload = (marketId: string, key: string, docId: string) => {
    updateExec(marketId, { [key]: docId });
  };

  const handleSave = () => {
    setShowSuccess(true);
    toast.success("Données synchronisées avec succès.");
    setTimeout(() => { setShowSuccess(false); setSelectedMarketId(null); }, 2000);
  };

  // --- Helpers pour créer une nouvelle période mensuelle ---
  const addPeriode = (marketId: string) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    const periodes = market.execution.periodes || [];
    const nextOrdre = periodes.length + 1;
    const now = new Date();
    const targetMonth = (now.getMonth() + periodes.length) % 12;
    const targetYear = now.getFullYear() + Math.floor((now.getMonth() + periodes.length) / 12);

    const newP: PeriodeMensuelle = {
      id: Date.now().toString(),
      label: `${MOIS_FR[targetMonth]} ${targetYear}`,
      date_debut: '',
      date_fin: '',
      ordre: nextOrdre,
      montant_decompte: 0,
      has_reclamation: false,
      statut_paiement: 'EN_ATTENTE'
    };
    updateExec(marketId, { periodes: [...periodes, newP] });
    setExpandedPeriodeId(newP.id);
  };

  const updatePeriode = (marketId: string, periodeId: string, updates: Partial<PeriodeMensuelle>) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    const updated = (market.execution.periodes || []).map(p => p.id === periodeId ? { ...p, ...updates } : p);
    updateExec(marketId, { periodes: updated });
  };

  const removePeriode = (marketId: string, periodeId: string) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    const updated = (market.execution.periodes || []).filter(p => p.id !== periodeId);
    updateExec(marketId, { periodes: updated });
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-40 relative">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 relative z-30">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black ${theme.textMain} tracking-tight uppercase flex items-center gap-3`}>
            Saisie Exécution V2 <span className="text-[10px] bg-accent px-2 py-1 rounded text-white">NOUVEAU</span>
          </h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Gestion contractuelle et financière (Forfait / Bordereau / Fourniture).</p>
        </div>
        <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto relative z-30`}>
          <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
            <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="text-[10px] font-black uppercase tracking-widest">Pilotage</span>
          </div>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} placeholder="Exercice" /></div>
          <div className="w-full md:w-56"><CustomBulleSelect label="" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} placeholder="Tous les financements" /></div>
          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : theme.textSecondary}`} size={16} />
            <input type="text" placeholder="N° ou objet..." className={`${theme.input} pl-12 pr-6 py-2.5 w-full font-black ${themeType === 'glass' ? 'text-white placeholder:text-white/40' : ''}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* CARTES DES MARCHÉS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
        {filteredMarkets.length > 0 ? filteredMarkets.map(m => {
          const isLocked = !m.dates_realisees.signature_marche;
          return (
            <div key={m.id} onClick={() => setSelectedMarketId(m.id)} className={`group ${theme.card} p-8 md:p-10 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full ${isLocked ? 'grayscale opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <span className={`px-2 py-0.5 ${theme.buttonShape} text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary`}>{m.numDossier}</span>
                {isLocked ? <Lock size={16} className={theme.textSecondary} /> : <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-sm"></div>}
              </div>
              <TruncatedText text={m.objet} as="h3" className={`text-md md:text-lg font-black ${theme.textMain} uppercase leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2`} />
              {m.activite && <p className={`text-[10px] font-bold ${theme.textSecondary} uppercase tracking-wide mb-4`}>{m.activite}</p>}
              <div className="mt-auto p-4 bg-black/5 rounded-2xl border border-white/5">
                {isLocked ? (
                  <p className={`text-[9px] font-bold ${theme.textSecondary} uppercase italic flex items-center gap-2`}><Lock size={12}/> Signature requise</p>
                ) : (
                  <div className={`flex justify-between items-center text-[10px] font-black uppercase ${theme.textSecondary}`}>
                    <span>{m.execution.type_contrat || 'À configurer'}</span>
                    <TrendingUp size={14} className="text-success" />
                  </div>
                )}
              </div>
            </div>
          );
        }) : (
          <div className={`col-span-full py-24 text-center ${theme.card} border-dashed`}>
            <Search size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucun marché en exécution</p>
          </div>
        )}
      </div>

      {/* MODAL DE SAISIE */}
      {selectedMarket && (
        <Modal isOpen={!!selectedMarketId} onClose={() => setSelectedMarketId(null)} title={selectedMarket.numDossier} subtitle={selectedMarket.objet} size="xl"
          footer={selectedMarket.dates_realisees.signature_marche ? (
            <div className="flex items-center justify-between w-full">
              <div className="hidden md:block">
                {showSuccess && <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-[10px] font-black uppercase animate-in fade-in"><CheckCircle2 size={14} /> Données synchronisées</div>}
              </div>
              <button onClick={handleSave} className={`${theme.buttonPrimary} px-10 py-3 ${theme.buttonShape} font-black text-[11px] uppercase shadow-lg flex items-center gap-2`}><Save size={16} /> Enregistrer</button>
            </div>
          ) : undefined}
        >
          {!selectedMarket.dates_realisees.signature_marche ? (
            <div className="py-20 flex flex-col items-center gap-6 text-center">
              <div className={`w-20 h-20 ${theme.card} flex items-center justify-center text-slate-200 shadow-lg`}><Lock size={40} /></div>
              <h2 className={`text-xl font-black ${theme.textMain} uppercase`}>Module Verrouillé</h2>
              <p className={`text-xs font-bold ${theme.textSecondary} uppercase italic`}>Signature requise.</p>
              <button onClick={() => navigate(`/tracking?id=${selectedMarket.id}`)} className={`${theme.buttonPrimary} px-8 py-3 ${theme.buttonShape} text-[10px] font-black uppercase flex items-center gap-2`}>Aller au pilotage <ArrowRight size={14}/></button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              {/* ONGLETS */}
              <div className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 shrink-0">
                {[
                  { id: 'contractual' as const, icon: FileText, label: 'Contractuel' },
                  { id: 'actors' as const, icon: Users, label: 'Acteurs' },
                  { id: 'financial' as const, icon: CreditCard, label: 'Financier' },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`p-5 ${theme.buttonShape} border text-left flex items-center gap-4 transition-all shrink-0 lg:w-full ${activeTab === tab.id ? theme.buttonPrimary : `bg-transparent ${theme.textSecondary} border-white/10 hover:bg-white/5`}`}>
                    <tab.icon size={18} /><span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{tab.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex-1 min-w-0 space-y-8">

                {/* ═══════ ONGLET CONTRACTUEL ═══════ */}
                {activeTab === 'contractual' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    {/* Config */}
                    <section className={`p-6 ${theme.card} border-l-4 border-primary space-y-4`}>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Paramètres du Contrat</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CustomBulleSelect label="Type de Contrat" value={selectedMarket.execution.type_contrat || ''} options={[
                          { value: 'BORDEREAU', label: 'Au Bordereau (Suivi Mensuel)' },
                          { value: 'FORFAIT', label: 'Au Forfait (Livrables)' },
                          { value: 'FOURNITURE', label: 'Fourniture (Bons de Livraison)' }
                        ]} onChange={(val) => updateExec(selectedMarket.id, { type_contrat: val })} placeholder="Choisir..." />
                        <BulleInput label="Référence Contrat" value={selectedMarket.execution.ref_contrat || ''} onChange={e => updateExec(selectedMarket.id, { ref_contrat: e.target.value })} />
                        <BulleInput label="Délai Contractuel (Mois)" type="number" value={selectedMarket.execution.delai_mois || ''} onChange={e => updateExec(selectedMarket.id, { delai_mois: Number(e.target.value) })} />
                      </div>
                    </section>

                    {/* Documents Admin */}
                    <section className="space-y-4">
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-success pl-3`}>Documents Officiels & T0</h3>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: 'Notification du contrat', key: 'doc_notif_contrat_id' },
                          { label: 'OS de Démarrage', key: 'doc_notif_os_id', isDateable: true, dateKey: 'date_notif_os' },
                          { label: 'Cautionnement Définitif', key: 'doc_caution_def_id' },
                          { label: 'Contrat enregistré', key: 'doc_contrat_enreg_id' },
                          { label: 'Police d\'Assurance', key: 'doc_assurance_id' },
                          { label: 'Dossier d\'Exécution', key: 'doc_dossier_exec_id' },
                          { label: 'Rapport d\'exécution', key: 'doc_rapport_exec_id' },
                          { label: 'PV Réception Provisoire', key: 'doc_pv_provisoire_id', isDateable: true, dateKey: 'date_pv_provisoire' },
                          { label: 'PV Réception Définitive', key: 'doc_pv_definitif_id', isDateable: true, dateKey: 'date_pv_definitif' }
                        ].map((item, idx) => (
                          <div key={idx} className={`p-4 ${theme.card} border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/5 transition-all gap-4`}>
                            <div className="flex-1 min-w-0">
                              <span className={`text-[11px] font-black ${theme.textMain} uppercase tracking-tight block`}>{item.label}</span>
                              {item.isDateable && item.dateKey && (
                                <div className="mt-2 w-full md:w-44"><BulleInput type="date" label="" value={(selectedMarket.execution as any)[item.dateKey] || ''} onChange={e => updateExec(selectedMarket.id, { [item.dateKey!]: e.target.value })} /></div>
                              )}
                            </div>
                            <div className="shrink-0"><FileManager existingDocId={(selectedMarket.execution as any)[item.key]} onUpload={(id) => handleDocUpload(selectedMarket.id, item.key, id)} /></div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Avance Démarrage */}
                    <section className={`p-6 ${theme.card} border-white/5 space-y-4`}>
                      <div className="flex items-center justify-between">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Avance de Démarrage</h3>
                        <CustomBulleSelect label="" value={selectedMarket.execution.has_avance_demarrage ? 'OUI' : 'NON'} options={[{ value: 'OUI', label: 'OUI' }, { value: 'NON', label: 'NON' }]} onChange={v => updateExec(selectedMarket.id, { has_avance_demarrage: v === 'OUI' })} />
                      </div>
                      {selectedMarket.execution.has_avance_demarrage && (
                        <div className="grid grid-cols-1 gap-2 animate-in slide-in-from-top-2">
                          {[{ label: 'Caution d\'Avance', key: 'doc_caution_avance_id' }, { label: 'Facture d\'Avance', key: 'doc_facture_avance_id' }].map(item => (
                            <div key={item.key} className={`p-4 ${theme.card} border-white/5 flex items-center justify-between`}>
                              <span className={`text-[11px] font-black ${theme.textMain} uppercase`}>{item.label}</span>
                              <FileManager existingDocId={(selectedMarket.execution as any)[item.key]} onUpload={(id) => handleDocUpload(selectedMarket.id, item.key, id)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>

                    {/* Résiliation */}
                    <section className={`p-8 bg-danger/5 rounded-[2.5rem] border border-danger/10 space-y-6`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-danger"><Trash2 size={20} /><h3 className="text-[11px] font-black uppercase tracking-widest">Résiliation</h3></div>
                        <button onClick={() => updateExec(selectedMarket.id, { is_resilie: !selectedMarket.execution.is_resilie })} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedMarket.execution.is_resilie ? 'bg-danger text-white' : `bg-white/5 ${theme.textSecondary} border border-white/10`}`}>
                          {selectedMarket.execution.is_resilie ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                      {selectedMarket.execution.is_resilie && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-4">
                          {[{ step: 1, label: 'Mise en Demeure', key: 'doc_mise_en_demeure_id' }, { step: 2, label: 'Constat de Carence', key: 'doc_constat_carence_id' }, { step: 3, label: 'Décision Finale', key: 'doc_decision_resiliation_id' }].map(s => (
                            <div key={s.step} className={`p-4 ${theme.card} border-danger/10 text-center space-y-3 flex flex-col items-center`}>
                              <p className={`text-[8px] font-black ${theme.textSecondary} uppercase`}>Étape {s.step}</p>
                              <p className={`text-[10px] font-black ${theme.textMain} uppercase`}>{s.label}</p>
                              <FileManager existingDocId={(selectedMarket.execution as any)[s.key]} onUpload={(id) => handleDocUpload(selectedMarket.id, s.key, id)} />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {/* ═══════ ONGLET ACTEURS ═══════ */}
                {activeTab === 'actors' && (
                  <div className="space-y-8 animate-in fade-in duration-300">
                    <section className={`p-6 ${theme.card} border-l-4 border-accent space-y-4`}>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Type MOE</h3>
                      <div className="flex items-center gap-4 bg-black/10 p-3 rounded-xl">
                        {['PUBLIC', 'PRIVE'].map(opt => (
                          <label key={opt} className="flex items-center gap-2 cursor-pointer px-3">
                            <input type="radio" name="moe_type" checked={selectedMarket.execution.moe_type === opt} onChange={() => updateExec(selectedMarket.id, { moe_type: opt })} />
                            <span className={`text-[11px] font-bold ${theme.textMain}`}>{opt === 'PUBLIC' ? 'Public (EDC)' : 'Privé (Cabinet)'}</span>
                          </label>
                        ))}
                      </div>
                    </section>
                    <section className="space-y-4">
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-primary pl-3`}>MOA</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <BulleInput label="Chef de Service" value={selectedMarket.execution.moa_chef_service || ''} onChange={e => updateExec(selectedMarket.id, { moa_chef_service: e.target.value })} />
                        <BulleInput label="Ingénieur du Marché" value={selectedMarket.execution.moa_ingenieur || ''} onChange={e => updateExec(selectedMarket.id, { moa_ingenieur: e.target.value })} />
                      </div>
                    </section>
                    {selectedMarket.execution.moe_type === 'PRIVE' && (
                      <section className={`p-6 bg-accent/5 rounded-xl border border-accent/20 space-y-4 animate-in slide-in-from-top-2`}>
                        <h3 className="text-[9px] text-accent font-black uppercase">Cabinet MOE Privé</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <BulleInput label="Nom du Cabinet" value={selectedMarket.execution.moe_prive_nom || ''} onChange={e => updateExec(selectedMarket.id, { moe_prive_nom: e.target.value })} />
                          <BulleInput label="Montant Contrat" type="number" value={selectedMarket.execution.moe_prive_montant || ''} onChange={e => updateExec(selectedMarket.id, { moe_prive_montant: Number(e.target.value) })} />
                          <BulleInput label="Délai" value={selectedMarket.execution.moe_prive_delai || ''} onChange={e => updateExec(selectedMarket.id, { moe_prive_delai: e.target.value })} />
                          <BulleInput label="RCCM" value={selectedMarket.execution.moe_prive_rccm || ''} onChange={e => updateExec(selectedMarket.id, { moe_prive_rccm: e.target.value })} />
                        </div>
                      </section>
                    )}
                  </div>
                )}

                {/* ═══════ ONGLET FINANCIER ═══════ */}
                {activeTab === 'financial' && (
                  <div className="space-y-8 animate-in fade-in duration-300">

                    {/* Garantie */}
                    <section className={`p-6 ${theme.card} border-white/5 space-y-4`}>
                      <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Garantie & Caution</h3>
                      <div className="flex flex-wrap gap-2">
                        {['Retenue 10%', 'Caution Bancaire'].map(opt => (
                          <button key={opt} onClick={() => updateExec(selectedMarket.id, { type_retenue_garantie: opt })} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedMarket.execution.type_retenue_garantie === opt ? theme.buttonPrimary : `bg-white/5 ${theme.textSecondary} border border-white/10`}`}>{opt}</button>
                        ))}
                      </div>
                      {selectedMarket.execution.type_retenue_garantie === 'Caution Bancaire' && (
                        <div className={`p-4 bg-white/5 rounded-xl border border-accent/20 flex items-center justify-between gap-4 animate-in slide-in-from-top-2`}>
                          <span className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Preuve Caution Bancaire</span>
                          <FileManager existingDocId={selectedMarket.execution.doc_caution_bancaire_id} onUpload={(id) => handleDocUpload(selectedMarket.id, 'doc_caution_bancaire_id', id)} />
                        </div>
                      )}
                    </section>

                    {/* ══════════════════════════════════════ */}
                    {/* BORDEREAU : SUIVI MENSUEL (ACCORDÉON) */}
                    {/* ══════════════════════════════════════ */}
                    {(selectedMarket.execution.type_contrat === 'BORDEREAU' || !selectedMarket.execution.type_contrat) && (
                      <section className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-success pl-3 flex items-center gap-2`}>
                            <CalendarDays size={14} /> Suivi Mensuel ({(selectedMarket.execution.periodes || []).length} périodes)
                          </h3>
                          <button onClick={() => addPeriode(selectedMarket.id)} className="flex items-center gap-1.5 bg-success text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-success/20">
                            <Plus size={12} /> Nouvelle Période
                          </button>
                        </div>

                        {/* Cumul */}
                        {(selectedMarket.execution.periodes || []).length > 0 && (
                          <div className={`p-4 ${theme.card} border-white/5 flex justify-between items-center`}>
                            <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Cumul Décompté</span>
                            <span className={`text-sm font-black ${theme.textAccent}`}>
                              {(selectedMarket.execution.periodes || []).reduce((acc, p) => acc + (p.montant_decompte || 0), 0).toLocaleString()} FCFA
                            </span>
                          </div>
                        )}

                        {/* Liste des périodes (accordéon) */}
                        <div className="space-y-3">
                          {(selectedMarket.execution.periodes || []).sort((a, b) => a.ordre - b.ordre).map(p => {
                            const isExpanded = expandedPeriodeId === p.id;
                            return (
                              <div key={p.id} className={`${theme.card} border-white/5 overflow-hidden transition-all`}>
                                {/* Header de la période */}
                                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all" onClick={() => setExpandedPeriodeId(isExpanded ? null : p.id)}>
                                  <div className="flex items-center gap-4">
                                    {isExpanded ? <ChevronUp size={16} className={theme.textAccent} /> : <ChevronDown size={16} className={theme.textSecondary} />}
                                    <div>
                                      <p className={`text-[11px] font-black ${theme.textMain} uppercase`}>{p.label}</p>
                                      <p className={`text-[9px] ${theme.textSecondary}`}>
                                        {p.numero_decompte || '-'} • {p.montant_decompte?.toLocaleString() || '0'} FCFA
                                        <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-bold ${p.statut_paiement === 'PAYE' ? 'bg-success/20 text-success' : p.statut_paiement === 'FACTURE' ? 'bg-warning/20 text-warning' : 'bg-white/10'}`}>{p.statut_paiement}</span>
                                      </p>
                                    </div>
                                  </div>
                                  <button onClick={(e) => { e.stopPropagation(); removePeriode(selectedMarket.id, p.id); }} className="p-2 text-slate-400 hover:text-danger"><Trash2 size={14} /></button>
                                </div>

                                {/* Contenu déplié */}
                                {isExpanded && (
                                  <div className="p-6 border-t border-white/5 space-y-6 animate-in fade-in duration-200">
                                    {/* Ligne 1 : Label + Décompte */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <BulleInput label="Période" value={p.label} onChange={e => updatePeriode(selectedMarket.id, p.id, { label: e.target.value })} />
                                      <BulleInput label="N° Décompte" value={p.numero_decompte || ''} onChange={e => updatePeriode(selectedMarket.id, p.id, { numero_decompte: e.target.value })} placeholder="DC N°001" />
                                      <BulleInput label="Montant Décompte (FCFA)" type="number" value={p.montant_decompte} onChange={e => updatePeriode(selectedMarket.id, p.id, { montant_decompte: Number(e.target.value) })} />
                                    </div>

                                    {/* Ligne 2 : Documents du mois */}
                                    <div className="grid grid-cols-1 gap-2">
                                      {[
                                        { label: 'Attachement', key: 'doc_attachement_id' },
                                        { label: 'Rapport MOE', key: 'doc_rapport_moe_id' },
                                        { label: 'OS du mois', key: 'doc_os_periode_id' },
                                        { label: 'Facture', key: 'doc_facture_id' },
                                        { label: 'Ordre de Virement (OV)', key: 'doc_ov_id' },
                                      ].map(doc => (
                                        <div key={doc.key} className={`p-3 bg-white/5 rounded-xl flex items-center justify-between`}>
                                          <span className={`text-[10px] font-black ${theme.textMain} uppercase`}>{doc.label}</span>
                                          <FileManager existingDocId={(p as any)[doc.key]} onUpload={(id) => updatePeriode(selectedMarket.id, p.id, { [doc.key]: id })} />
                                        </div>
                                      ))}
                                    </div>

                                    {/* Ligne 3 : Observations */}
                                    <BulleInput label="Observations / Aléas techniques" value={p.observations || ''} onChange={e => updatePeriode(selectedMarket.id, p.id, { observations: e.target.value })} placeholder="Travaux conformes au planning..." />

                                    {/* Ligne 4 : Réclamation */}
                                    <div className={`p-4 bg-white/5 rounded-xl border border-white/5 space-y-3`}>
                                      <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Réclamation ?</span>
                                        <CustomBulleSelect label="" value={p.has_reclamation ? 'OUI' : 'NON'} options={[{ value: 'OUI', label: 'OUI' }, { value: 'NON', label: 'NON' }]} onChange={v => updatePeriode(selectedMarket.id, p.id, { has_reclamation: v === 'OUI' })} />
                                      </div>
                                      {p.has_reclamation && (
                                        <div className="space-y-3 animate-in slide-in-from-top-2">
                                          <BulleInput label="Objet réclamation" value={p.objet_reclamation || ''} onChange={e => updatePeriode(selectedMarket.id, p.id, { objet_reclamation: e.target.value })} />
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <div className="p-3 bg-black/5 rounded-xl flex items-center justify-between">
                                              <span className={`text-[9px] font-black ${theme.textSecondary} uppercase`}>Lettre réclamation</span>
                                              <FileManager existingDocId={p.doc_reclamation_id} onUpload={(id) => updatePeriode(selectedMarket.id, p.id, { doc_reclamation_id: id })} />
                                            </div>
                                            <div className="p-3 bg-black/5 rounded-xl flex items-center justify-between">
                                              <span className={`text-[9px] font-black ${theme.textSecondary} uppercase`}>Réponse MOA/MOE</span>
                                              <FileManager existingDocId={p.doc_reponse_reclamation_id} onUpload={(id) => updatePeriode(selectedMarket.id, p.id, { doc_reponse_reclamation_id: id })} />
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Ligne 5 : Statut paiement */}
                                    <div className="flex items-center gap-4">
                                      <CustomBulleSelect label="Statut paiement" value={p.statut_paiement} options={[
                                        { value: 'EN_ATTENTE', label: 'En attente' },
                                        { value: 'FACTURE', label: 'Facturé' },
                                        { value: 'PAYE', label: 'Payé' },
                                      ]} onChange={v => updatePeriode(selectedMarket.id, p.id, { statut_paiement: v as any })} />
                                      {p.statut_paiement === 'PAYE' && (
                                        <BulleInput type="date" label="Date paiement" value={p.date_paiement || ''} onChange={e => updatePeriode(selectedMarket.id, p.id, { date_paiement: e.target.value })} />
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {(selectedMarket.execution.periodes || []).length === 0 && (
                            <div className={`p-10 ${theme.card} border-dashed border-white/5 text-center`}>
                              <p className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Aucune période enregistrée. Cliquez sur "Nouvelle Période".</p>
                            </div>
                          )}
                        </div>
                      </section>
                    )}

                    {/* ══════════════════════════ */}
                    {/* FORFAIT : LIVRABLES       */}
                    {/* ══════════════════════════ */}
                    {selectedMarket.execution.type_contrat === 'FORFAIT' && (
                      <section className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-accent pl-3`}>Suivi des Livrables</h3>
                          <button onClick={() => {
                            const newL: Livrable = { id: Date.now().toString(), libelle: '', date_limite: '', statut: 'A_FAIRE', montant_prevu: 0 };
                            updateExec(selectedMarket.id, { livrables: [...(selectedMarket.execution.livrables || []), newL] });
                          }} className="flex items-center gap-1.5 bg-accent text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-accent/20"><Plus size={12} /> Nouveau Livrable</button>
                        </div>
                        <div className={`${theme.card} border-white/5 overflow-hidden overflow-x-auto`}>
                          <table className="w-full text-left min-w-[950px]">
                            <thead className="bg-black/5"><tr className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>
                              <th className="p-4">Livrable</th><th className="p-4">Deadline</th><th className="p-4">Montant</th><th className="p-4">Statut</th><th className="p-4">Rapport</th><th className="p-4">PV CSRT</th><th className="p-4">Facture</th><th className="p-4">OV</th><th className="p-4 text-right">Suppr.</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                              {(selectedMarket.execution.livrables || []).map(l => (
                                <tr key={l.id} className="hover:bg-white/5">
                                  <td className="p-4"><input type="text" className={`bg-transparent text-[11px] font-bold w-full outline-none ${theme.textMain}`} placeholder="Rapport Phase 1..." value={l.libelle} onChange={e => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, libelle: e.target.value } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4"><input type="date" className={`bg-transparent text-[10px] opacity-70 ${theme.textMain}`} value={l.date_limite} onChange={e => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, date_limite: e.target.value } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4"><input type="number" className={`bg-transparent font-black text-[11px] ${theme.textAccent} outline-none w-24`} value={l.montant_prevu} onChange={e => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, montant_prevu: Number(e.target.value) } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4">
                                    <select value={l.statut} onChange={e => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, statut: e.target.value as any } : it); updateExec(selectedMarket.id, { livrables: updated }); }} className="bg-black/20 text-white rounded-lg px-2 py-1 text-[9px] font-bold uppercase border border-white/10 outline-none">
                                      <option value="A_FAIRE" className="text-black">À Faire</option>
                                      <option value="SOUMIS" className="text-black">Soumis</option>
                                      <option value="VALIDE" className="text-black">Validé</option>
                                      <option value="REJETE" className="text-black">Rejeté</option>
                                    </select>
                                  </td>
                                  <td className="p-4"><FileManager existingDocId={l.doc_rapport_id} onUpload={(id) => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, doc_rapport_id: id } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4"><FileManager existingDocId={l.doc_pv_csrt_id} onUpload={(id) => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, doc_pv_csrt_id: id } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4"><FileManager existingDocId={l.doc_facture_id} onUpload={(id) => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, doc_facture_id: id } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4"><FileManager existingDocId={l.doc_ov_id} onUpload={(id) => { const updated = (selectedMarket.execution.livrables || []).map(it => it.id === l.id ? { ...it, doc_ov_id: id } : it); updateExec(selectedMarket.id, { livrables: updated }); }} /></td>
                                  <td className="p-4 text-right"><button onClick={() => { const updated = (selectedMarket.execution.livrables || []).filter(it => it.id !== l.id); updateExec(selectedMarket.id, { livrables: updated }); }} className="p-2 text-slate-400 hover:text-danger"><Trash2 size={14} /></button></td>
                                </tr>
                              ))}
                              {(selectedMarket.execution.livrables || []).length === 0 && (
                                <tr><td colSpan={9} className={`p-8 text-center text-[10px] font-black ${theme.textSecondary} uppercase italic opacity-40`}>Aucun livrable</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* ══════════════════════════════ */}
                    {/* FOURNITURE : BONS DE LIVRAISON */}
                    {/* ══════════════════════════════ */}
                    {selectedMarket.execution.type_contrat === 'FOURNITURE' && (
                      <section className="space-y-4 animate-in slide-in-from-right-4">
                        <div className="flex items-center justify-between">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-warning pl-3 flex items-center gap-2`}><Package size={14} /> Bons de Livraison</h3>
                          <button onClick={() => {
                            const bls = selectedMarket.execution.bons_livraison || [];
                            const newBL: BonLivraison = { id: Date.now().toString(), numero: `BL N°${String(bls.length + 1).padStart(3, '0')}`, designation: '', quantite: 0, montant: 0, date_livraison: '', statut: 'EN_ATTENTE' };
                            updateExec(selectedMarket.id, { bons_livraison: [...bls, newBL] });
                          }} className="flex items-center gap-1.5 bg-warning text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-warning/20"><Plus size={12} /> Nouveau BL</button>
                        </div>
                        <div className={`${theme.card} border-white/5 overflow-hidden overflow-x-auto`}>
                          <table className="w-full text-left min-w-[900px]">
                            <thead className="bg-black/5"><tr className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>
                              <th className="p-4">N° BL</th><th className="p-4">Désignation</th><th className="p-4">Qté</th><th className="p-4">Montant</th><th className="p-4">Statut</th><th className="p-4">BL Signé</th><th className="p-4">PV Réception</th><th className="p-4">OV</th><th className="p-4 text-right">Suppr.</th>
                            </tr></thead>
                            <tbody className="divide-y divide-white/5">
                              {(selectedMarket.execution.bons_livraison || []).map(bl => (
                                <tr key={bl.id} className="hover:bg-white/5">
                                  <td className={`p-4 text-[10px] font-black ${theme.textAccent}`}>{bl.numero}</td>
                                  <td className="p-4"><input type="text" className={`bg-transparent text-[11px] font-bold w-full outline-none ${theme.textMain}`} value={bl.designation} onChange={e => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, designation: e.target.value } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} /></td>
                                  <td className="p-4"><input type="number" className={`bg-transparent font-bold text-[11px] ${theme.textMain} outline-none w-16`} value={bl.quantite} onChange={e => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, quantite: Number(e.target.value) } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} /></td>
                                  <td className="p-4"><input type="number" className={`bg-transparent font-black text-[11px] ${theme.textAccent} outline-none w-28`} value={bl.montant} onChange={e => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, montant: Number(e.target.value) } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} /></td>
                                  <td className="p-4">
                                    <select value={bl.statut} onChange={e => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, statut: e.target.value as any } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} className="bg-black/20 text-white rounded-lg px-2 py-1 text-[9px] font-bold uppercase border border-white/10 outline-none">
                                      <option value="EN_ATTENTE" className="text-black">En attente</option>
                                      <option value="LIVRE" className="text-black">Livré</option>
                                      <option value="RECEPTIONNEE" className="text-black">Réceptionné</option>
                                      <option value="PAYE" className="text-black">Payé</option>
                                    </select>
                                  </td>
                                  <td className="p-4"><FileManager existingDocId={bl.doc_bl_id} onUpload={(id) => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, doc_bl_id: id } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} /></td>
                                  <td className="p-4"><FileManager existingDocId={bl.doc_pv_reception_id} onUpload={(id) => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, doc_pv_reception_id: id } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} /></td>
                                  <td className="p-4"><FileManager existingDocId={bl.doc_ov_id} onUpload={(id) => { const updated = (selectedMarket.execution.bons_livraison || []).map(it => it.id === bl.id ? { ...it, doc_ov_id: id } : it); updateExec(selectedMarket.id, { bons_livraison: updated }); }} /></td>
                                  <td className="p-4 text-right"><button onClick={() => { const updated = (selectedMarket.execution.bons_livraison || []).filter(it => it.id !== bl.id); updateExec(selectedMarket.id, { bons_livraison: updated }); }} className="p-2 text-slate-400 hover:text-danger"><Trash2 size={14} /></button></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* AVENANTS (commun aux 3 types) */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-warning pl-3`}>Avenants</h3>
                        <button onClick={() => {
                          const newA: Avenant = { id: Date.now().toString(), ref: '', objet: '', montant_incidence: 0 };
                          updateExec(selectedMarket.id, { avenants: [...selectedMarket.execution.avenants, newA], has_avenant: true });
                        }} className="flex items-center gap-1.5 bg-warning text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg"><Plus size={12} /> Nouvel Avenant</button>
                      </div>
                      {selectedMarket.execution.avenants.map(a => (
                        <div key={a.id} className={`${theme.card} p-6 border-warning/10 space-y-4 relative group`}>
                          <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { const updated = selectedMarket.execution.avenants.filter(it => it.id !== a.id); updateExec(selectedMarket.id, { avenants: updated }); }} className="p-2 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white"><Trash2 size={14} /></button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <BulleInput label="Objet" value={a.objet} onChange={e => { const updated = selectedMarket.execution.avenants.map(it => it.id === a.id ? { ...it, objet: e.target.value } : it); updateExec(selectedMarket.id, { avenants: updated }); }} />
                            <BulleInput label="Incidence (FCFA)" type="number" value={a.montant_incidence} onChange={e => { const updated = selectedMarket.execution.avenants.map(it => it.id === a.id ? { ...it, montant_incidence: Number(e.target.value) } : it); updateExec(selectedMarket.id, { avenants: updated }); }} />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[{ label: 'Notification', key: 'doc_notification_id' }, { label: 'OS', key: 'doc_os_id' }, { label: 'Enregistrement', key: 'doc_enreg_id' }].map(doc => (
                              <div key={doc.key} className="flex flex-col items-start p-3 bg-black/5 rounded-xl border border-white/5 gap-1.5">
                                <span className={`text-[8px] font-black ${theme.textSecondary} uppercase`}>{doc.label}</span>
                                <FileManager existingDocId={(a as any)[doc.key]} onUpload={(id) => { const updated = selectedMarket.execution.avenants.map(it => it.id === a.id ? { ...it, [doc.key]: id } : it); updateExec(selectedMarket.id, { avenants: updated }); }} />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {selectedMarket.execution.avenants.length === 0 && (
                        <div className={`p-8 ${theme.card} border-dashed border-white/5 text-center`}><p className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Aucun avenant.</p></div>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
