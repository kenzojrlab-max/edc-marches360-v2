import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarketFilter } from '../hooks/useMarketFilter'; // AJOUT
import { Decompte, Avenant } from '../types';
import { BulleInput } from '../components/BulleInput';
import { FileManager } from '../components/FileManager';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { Modal } from '../components/Modal';
import { 
  Lock, Search, TrendingUp, AlertTriangle, Plus, Trash2, 
  ArrowRight, ShieldCheck, FileText, CreditCard, Save, CheckCircle2, Layers
} from 'lucide-react';

export const Execution: React.FC = () => {
  const navigate = useNavigate();
  
  const { markets, updateMarket } = useMarkets();
  const { projects } = useProjects();
  
  const { isGuest, can } = useAuth();
  const { theme, themeType } = useTheme();
  
  // --- CORRECTION : Utilisation du Hook de filtrage + Filtre spécifique Exécution ---
  const {
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedProjectId, setSelectedProjectId,
    yearOptions,
    projectOptions,
    filteredMarkets: baseFilteredMarkets // On renomme pour appliquer le filtre supplémentaire
  } = useMarketFilter(markets, projects);

  // Filtre spécifique pour l'exécution : on masque les annulés/infructueux
  const filteredMarkets = useMemo(() => {
    return baseFilteredMarkets.filter(m => !m.is_annule && !m.is_infructueux);
  }, [baseFilteredMarkets]);

  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contractual' | 'financial'>('contractual');
  const [showSuccess, setShowSuccess] = useState(false);

  const selectedMarket = markets.find(m => m.id === selectedMarketId);

  const updateExec = (marketId: string, updates: any) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    updateMarket(marketId, { execution: { ...market.execution, ...updates } });
  };

  const handleDocUpload = (marketId: string, key: string, docId: string) => {
    updateExec(marketId, { [key]: docId });
  };

  const handleDecompteDocUpload = (marketId: string, decompteId: string, docId: string) => {
    const market = markets.find(m => m.id === marketId);
    if (!market) return;
    const updatedDecomptes = market.execution.decomptes.map(d => 
      d.id === decompteId ? { ...d, doc_id: docId } : d
    );
    updateExec(marketId, { decomptes: updatedDecomptes });
  };

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setSelectedMarketId(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-40 relative">
      {/* HEADER - CORRECTION Z-INDEX : z-[200] -> z-30 */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2 relative z-30">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Exécution des Marchés</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Suivi financier et contractuel après signature.</p>
        </div>
        
        {/* CORRECTION Z-INDEX : z-[300] -> z-30 */}
        <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto relative z-30`}>
           <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
            <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="text-[10px] font-black uppercase tracking-widest">Pilotage</span>
          </div>
          <div className="w-full md:w-40">
            <CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} placeholder="Exercice" />
          </div>
          <div className="w-full md:w-56">
            <CustomBulleSelect label="" value={selectedProjectId} options={projectOptions} onChange={setSelectedProjectId} placeholder="Tous les projets" />
          </div>
          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : theme.textSecondary}`} size={16} strokeWidth={theme.iconStroke} />
            <input 
              type="text" 
              placeholder="N° ou objet..." 
              className={`${theme.input} pl-12 pr-6 py-2.5 w-full font-black ${themeType === 'glass' ? 'text-white placeholder:text-white/40' : ''}`} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* GRID DE MARCHÉS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
        {filteredMarkets.length > 0 ? filteredMarkets.map(m => {
          const isLocked = !m.dates_realisees.signature_marche;
          return (
            <div key={m.id} onClick={() => setSelectedMarketId(m.id)} className={`group ${theme.card} p-8 md:p-10 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full ${isLocked ? 'grayscale opacity-60' : ''}`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <span className={`px-2 py-0.5 ${theme.buttonShape} text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary`}>{m.numDossier}</span>
                {isLocked ? <Lock size={16} className={theme.textSecondary} /> : <div className="w-3 h-3 bg-success rounded-full animate-pulse shadow-sm"></div>}
              </div>
              <h3 className={`text-md md:text-lg font-black ${theme.textMain} uppercase leading-snug group-hover:text-primary transition-colors mb-4 line-clamp-2`}>{m.objet}</h3>
              <div className="mt-auto p-4 bg-black/5 rounded-2xl border border-white/5">
                {isLocked ? (
                  <p className={`text-[9px] font-bold ${theme.textSecondary} uppercase italic flex items-center gap-2 leading-none`}><Lock size={12}/> Signature requise</p>
                ) : (
                  <div className={`flex justify-between items-center text-[10px] font-black uppercase ${theme.textSecondary}`}>
                     <span>Prêt pour exécution</span>
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

      {/* MODAL D'ÉDITION D'EXÉCUTION */}
      {selectedMarket && (
        <Modal 
          isOpen={!!selectedMarketId} 
          onClose={() => setSelectedMarketId(null)} 
          title={`${selectedMarket.numDossier}`} 
          size="xl"
          footer={selectedMarket.dates_realisees.signature_marche ? (
            <div className="flex items-center justify-between w-full">
              <div className="hidden md:block">
                {showSuccess && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-success/10 text-success rounded-xl text-[10px] font-black uppercase animate-in fade-in slide-in-from-left-4">
                    <CheckCircle2 size={14} /> Données synchronisées
                  </div>
                )}
              </div>
              <button 
                onClick={handleSave}
                className={`${theme.buttonPrimary} px-10 py-3 ${theme.buttonShape} font-black text-[11px] uppercase shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all w-full md:w-auto flex items-center justify-center gap-2`}
              >
                <Save size={16} /> Enregistrer
              </button>
            </div>
          ) : undefined}
        >
          {!selectedMarket.dates_realisees.signature_marche ? (
            <div className="py-20 flex flex-col items-center gap-6 text-center">
               <div className={`w-20 h-20 ${theme.card} flex items-center justify-center text-slate-200 shadow-lg`}><Lock size={40} /></div>
               <div className="space-y-2">
                  <h2 className={`text-xl font-black ${theme.textMain} uppercase`}>Module Verrouillé</h2>
                  <p className={`text-xs font-bold ${theme.textSecondary} uppercase italic`}>Signature du marché requise dans le registre de pilotage.</p>
               </div>
               <button onClick={() => navigate(`/tracking?id=${selectedMarket.id}`)} className={`${theme.buttonPrimary} px-8 py-3 ${theme.buttonShape} text-[10px] font-black uppercase flex items-center gap-2`}>Aller au pilotage <ArrowRight size={14}/></button>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
               {/* NAVIGATION INTERNE (TABS) */}
               <div className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0 shrink-0">
                  <button onClick={() => setActiveTab('contractual')} className={`p-5 ${theme.buttonShape} border text-left flex items-center gap-4 transition-all shrink-0 lg:w-full ${activeTab === 'contractual' ? theme.buttonPrimary : `bg-transparent ${theme.textSecondary} border-white/10 hover:bg-white/5`}`}>
                     <FileText size={18} />
                     <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Contractuel</span>
                  </button>
                  <button onClick={() => setActiveTab('financial')} className={`p-5 ${theme.buttonShape} border text-left flex items-center gap-4 transition-all shrink-0 lg:w-full ${activeTab === 'financial' ? theme.buttonPrimary : `bg-transparent ${theme.textSecondary} border-white/10 hover:bg-white/5`}`}>
                     <CreditCard size={18} />
                     <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Financier</span>
                  </button>
               </div>

               {/* CONTENU DES ONGLETS */}
               <div className="flex-1 min-w-0 space-y-8">
                  {activeTab === 'contractual' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                       <section className={`grid grid-cols-1 md:grid-cols-2 gap-6 p-8 ${theme.card} border-white/5`}>
                          <BulleInput label="Référence Contrat" value={selectedMarket.execution.ref_contrat} onChange={e => updateExec(selectedMarket.id, {ref_contrat: e.target.value})} />
                          <BulleInput label="Délai Contractuel (Mois)" type="number" value={selectedMarket.execution.delai_mois} onChange={e => updateExec(selectedMarket.id, {delai_mois: Number(e.target.value)})} />
                       </section>

                       <section className="space-y-4">
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-success pl-3`}>Livraison & Documents Officiels</h3>
                          <div className="grid grid-cols-1 gap-2">
                             {[
                               { label: 'Notification du contrat', key: 'doc_notif_contrat_id', isDateable: false },
                               { label: 'OS de Démarrage', key: 'doc_notif_os_id', isDateable: true, dateKey: 'date_notif_os' },
                               { label: 'Cautionnement Définitif', key: 'doc_caution_def_id', isDateable: false },
                               { label: 'Contrat enregistré', key: 'doc_contrat_enreg_id', isDateable: false },
                               { label: 'Police d\'Assurance', key: 'doc_assurance_id', isDateable: false },
                               { label: 'Rapport d\'exécution', key: 'doc_rapport_exec_id', isDateable: false },
                               { label: 'PV de réception provisoire', key: 'doc_pv_provisoire_id', isDateable: true, dateKey: 'date_pv_provisoire' },
                               { label: 'PV de réception définitive', key: 'doc_pv_definitif_id', isDateable: true, dateKey: 'date_pv_definitif' }
                             ].map((item, idx) => (
                               <div key={idx} className={`p-4 ${theme.card} border-white/5 flex flex-col md:flex-row md:items-center justify-between hover:bg-white/5 transition-all gap-4`}>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-[11px] font-black ${theme.textMain} uppercase tracking-tight block truncate`}>{item.label}</span>
                                    {/* CORRECTION : Ajout des champs de date pour OS, PV Provisoire et PV Définitif */}
                                    {item.isDateable && item.dateKey && (
                                      <div className="mt-2 w-full md:w-44">
                                        <BulleInput 
                                          type="date" 
                                          label="" 
                                          value={(selectedMarket.execution as any)[item.dateKey] || ''} 
                                          onChange={e => updateExec(selectedMarket.id, {[item.dateKey!]: e.target.value})} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="shrink-0">
                                    <FileManager existingDocId={(selectedMarket.execution as any)[item.key]} onUpload={(id) => handleDocUpload(selectedMarket.id, item.key, id)} />
                                  </div>
                               </div>
                             ))}
                          </div>
                       </section>

                       <section className={`p-8 bg-danger/5 rounded-[2.5rem] border border-danger/10 space-y-6`}>
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-3 text-danger"><Trash2 size={20} /><h3 className="text-[11px] font-black uppercase tracking-widest">Résiliation de Marché</h3></div>
                             <button onClick={() => updateExec(selectedMarket.id, {is_resilie: !selectedMarket.execution.is_resilie})} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedMarket.execution.is_resilie ? 'bg-danger text-white' : `bg-white/5 ${theme.textSecondary} border border-white/10`}`}>
                                {selectedMarket.execution.is_resilie ? "Désactiver" : "Activer Procédure"}
                             </button>
                          </div>
                          {selectedMarket.execution.is_resilie && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4">
                                {[
                                   {step: 1, label: 'Mise en Demeure', key: 'doc_mise_en_demeure_id'},
                                   {step: 2, label: 'Constat de Carence', key: 'doc_constat_carence_id'},
                                   {step: 3, label: 'Décision Finale', key: 'doc_decision_resiliation_id'}
                                ].map((s) => (
                                  <div key={s.step} className={`p-4 ${theme.card} border-danger/10 text-center space-y-3 flex flex-col items-center min-w-0`}>
                                    <p className={`text-[8px] font-black ${theme.textSecondary} uppercase tracking-widest`}>Étape {s.step}</p>
                                    <p className={`text-[10px] font-black ${theme.textMain} uppercase leading-none truncate w-full`}>{s.label}</p>
                                    <div className="w-full flex justify-center">
                                      <FileManager existingDocId={(selectedMarket.execution as any)[s.key]} onUpload={(id) => handleDocUpload(selectedMarket.id, s.key, id)} />
                                    </div>
                                  </div>
                                ))}
                             </div>
                          )}
                       </section>
                    </div>
                  )}

                  {activeTab === 'financial' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                       <section className={`p-8 ${theme.card} border-white/5 space-y-4`}>
                          <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Garantie & Caution</h3>
                          <div className="flex flex-wrap gap-2">
                             {['Retenue 10%', 'Caution Bancaire'].map((opt) => (
                                <button key={opt} onClick={() => updateExec(selectedMarket.id, {type_retenue_garantie: opt})} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all ${selectedMarket.execution.type_retenue_garantie === opt ? theme.buttonPrimary : `bg-white/5 ${theme.textSecondary} border border-white/10`}`}>{opt}</button>
                             ))}
                          </div>
                          {selectedMarket.execution.type_retenue_garantie === 'Caution Bancaire' && (
                             <div className={`p-4 bg-white/5 rounded-xl border border-accent/20 flex items-center justify-between gap-4 animate-in slide-in-from-top-2`}>
                                <span className={`text-[10px] font-black ${theme.textSecondary} uppercase italic leading-none truncate flex-1`}>Preuve Caution Bancaire</span>
                                <FileManager existingDocId={selectedMarket.execution.doc_caution_bancaire_id} onUpload={(id) => handleDocUpload(selectedMarket.id, 'doc_caution_bancaire_id', id)} />
                             </div>
                          )}
                       </section>

                       <section className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-success pl-3`}>Suivi des Décomptes</h3>
                             <button onClick={() => {
                                const newD: Decompte = { id: Date.now().toString(), numero: (selectedMarket.execution.decomptes.length + 1).toString(), objet: '', montant: 0, date_validation: '' };
                                updateExec(selectedMarket.id, { decomptes: [...selectedMarket.execution.decomptes, newD] });
                             }} className="flex items-center gap-1.5 bg-success text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-success/20"><Plus size={12} /> Nouveau</button>
                          </div>
                          <div className={`${theme.card} border-white/5 overflow-hidden overflow-x-auto`}>
                             <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-black/5"><tr className={`text-[9px] font-black uppercase ${theme.textSecondary}`}>
                                   <th className="p-4">N°</th><th className="p-4">Objet / Libellé</th><th className="p-4">Montant (FCFA)</th><th className="p-4">Preuve</th><th className="p-4 text-right">Action</th>
                                </tr></thead>
                                <tbody className="divide-y divide-white/5">
                                   {selectedMarket.execution.decomptes.map((d) => (
                                     <tr key={d.id} className="hover:bg-white/5 transition-all">
                                        <td className={`p-4 text-[10px] font-black ${theme.textAccent}`}>N°{d.numero}</td>
                                        <td className="p-4">
                                          <input 
                                            type="text" 
                                            className={`bg-transparent text-[11px] font-bold w-full outline-none ${theme.textMain} placeholder:opacity-20`} 
                                            placeholder="ex: Décompte n°1..." 
                                            value={d.objet} 
                                            onChange={e => {const updated = selectedMarket.execution.decomptes.map(it => it.id === d.id ? {...it, objet: e.target.value} : it); updateExec(selectedMarket.id, {decomptes: updated})}} 
                                          />
                                        </td>
                                        <td className="p-4"><input type="number" className={`bg-transparent font-black text-[11px] ${theme.textAccent} outline-none w-32`} value={d.montant} onChange={e => {const updated = selectedMarket.execution.decomptes.map(it => it.id === d.id ? {...it, montant: Number(e.target.value)} : it); updateExec(selectedMarket.id, {decomptes: updated})}} /></td>
                                        <td className="p-4"><FileManager existingDocId={d.doc_id} onUpload={(id) => handleDecompteDocUpload(selectedMarket.id, d.id, id)} /></td>
                                        <td className="p-4 text-right"><button onClick={() => {const updated = selectedMarket.execution.decomptes.filter(it => it.id !== d.id); updateExec(selectedMarket.id, {decomptes: updated})}} className="p-2 text-slate-400 hover:text-danger transition-colors"><Trash2 size={14} /></button></td>
                                     </tr>
                                   ))}
                                   {selectedMarket.execution.decomptes.length === 0 && (
                                     <tr><td colSpan={5} className={`p-8 text-center text-[10px] font-black ${theme.textSecondary} uppercase italic opacity-40`}>Aucun décompte enregistré</td></tr>
                                   )}
                                </tbody>
                             </table>
                             <div className="p-4 bg-black/10 border-t border-white/5 flex justify-between items-center px-6">
                                <span className={`text-[10px] font-black ${theme.textSecondary} uppercase`}>Cumul Décompté</span>
                                <span className={`text-sm font-black ${theme.textAccent}`}>{selectedMarket.execution.decomptes.reduce((acc, d) => acc + d.montant, 0).toLocaleString()} FCFA</span>
                             </div>
                          </div>
                       </section>

                       <section className="space-y-4">
                          <div className="flex items-center justify-between">
                             <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} border-l-4 border-warning pl-3`}>Gestion des Avenants</h3>
                             <button onClick={() => {
                                const newA: Avenant = { id: Date.now().toString(), ref: '', objet: '', montant_incidence: 0, delai_execution: '' };
                                updateExec(selectedMarket.id, { avenants: [...selectedMarket.execution.avenants, newA], has_avenant: true });
                             }} className="flex items-center gap-1.5 bg-warning text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-warning/20"><Plus size={12} /> Nouvel Avenant</button>
                          </div>
                          {selectedMarket.execution.avenants.map(a => (
                             <div key={a.id} className={`${theme.card} p-8 border-warning/10 space-y-6 relative overflow-hidden group`}>
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                   <button onClick={() => {const updated = selectedMarket.execution.avenants.filter(it => it.id !== a.id); updateExec(selectedMarket.id, {avenants: updated})}} className="p-2.5 bg-danger/10 text-danger rounded-xl hover:bg-danger hover:text-white transition-all"><Trash2 size={16} /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <BulleInput label="Objet de l'avenant" value={a.objet} onChange={e => {const updated = selectedMarket.execution.avenants.map(it => it.id === a.id ? {...it, objet: e.target.value} : it); updateExec(selectedMarket.id, {avenants: updated})}} />
                                  <BulleInput label="Incidence Financière (FCFA)" type="number" value={a.montant_incidence} onChange={e => {const updated = selectedMarket.execution.avenants.map(it => it.id === a.id ? {...it, montant_incidence: Number(e.target.value)} : it); updateExec(selectedMarket.id, {avenants: updated})}} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {[
                                    {label: 'Notification', key: 'doc_notification_id'},
                                    {label: 'OS', key: 'doc_os_id'},
                                    {label: 'Enregistrement', key: 'doc_enreg_id'}
                                  ].map(doc => (
                                    <div key={doc.key} className="flex flex-col items-start p-3 bg-black/5 rounded-xl border border-white/5 min-w-0 gap-1.5">
                                      <span className={`text-[8px] font-black ${theme.textSecondary} uppercase`}>{doc.label}</span>
                                      <div className="w-full flex justify-start">
                                        <FileManager 
                                          existingDocId={(a as any)[doc.key]} 
                                          onUpload={(id) => {
                                            const updated = selectedMarket.execution.avenants.map(it => it.id === a.id ? {...it, [doc.key]: id} : it);
                                            updateExec(selectedMarket.id, {avenants: updated});
                                          }} 
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                             </div>
                          ))}
                          {selectedMarket.execution.avenants.length === 0 && (
                            <div className={`p-10 ${theme.card} border-dashed border-white/5 text-center`}>
                               <p className={`text-[10px] font-black ${theme.textSecondary} uppercase italic`}>Aucun avenant notifié pour ce marché.</p>
                            </div>
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