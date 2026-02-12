import React, { useState } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useMarketLogic } from '../hooks/useMarketLogic'; 
import { useMarketFilter } from '../hooks/useMarketFilter'; // AJOUT
import { 
  Save, Search, CheckCircle2, Clock, Activity, Settings2, ChevronRight,
  ArrowLeft, ArrowRight, UserCheck, Banknote, AlertTriangle, XCircle, Ban, Layers, History, FileText
} from 'lucide-react';
import { JALONS_LABELS, JALONS_GROUPS, getJalonsGroupsForMarket } from '../constants';
import { Modal } from '../components/Modal';
import { BulleInput } from '../components/BulleInput';
import { MultiFileManager } from '../components/MultiFileManager';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { SourceFinancement, StatutGlobal, RecoursStatut } from '../types';
import Footer from '../components/Footer';
import { TruncatedText } from '../components/TruncatedText';
import { RecoursSection } from '../components/RecoursSection';

// Clés des jalons à griser si le marché est infructueux (après prop_attribution)
const JALONS_AFTER_INFRUCTUEUX = [
  'negociation_contractuelle', 'avis_conforme_ca', 'ano_bailleur_attrib', 'notification_attrib',
  'titulaire', 'montant_ttc_reel', 'delai_contractuel', 'souscription', 'saisine_cipm_projet',
  'validation_projet', 'ano_bailleur_projet', 'signature_marche'
];

export const Tracking: React.FC = () => {
  const { markets, updateMarket, addMarketDocToArray, removeMarketDocFromArray, updateJalon } = useMarkets();
  const { projects } = useProjects();
  const { can } = useAuth();
  const { theme } = useTheme();

  const { isJalonApplicable, isJalonActive, isPhaseAccessible, isBlockedBySuspendu: checkBlockedBySuspendu } = useMarketLogic();
  
  // --- CORRECTION : Utilisation du Hook de filtrage ---
  const {
    searchTerm, setSearchTerm,
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    yearOptions,
    financementOptions,
    filteredMarkets
  } = useMarketFilter(markets, projects);
  
  // --- AJOUT DU TRI : Tri naturel sur le numéro de dossier ---
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    const numA = a.numDossier || '';
    const numB = b.numDossier || '';
    // numeric: true permet de trier "2" avant "10" correctement
    return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
  });
  
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string>(JALONS_GROUPS[0].id);
  const [showSuccess, setShowSuccess] = useState(false);

  const jalonsKeys = JALONS_GROUPS.flatMap(g => g.keys);

  // Groupes de jalons dynamiques selon le type d'ouverture du marché sélectionné
  const getMarketGroups = (market: any) => getJalonsGroupsForMarket(market?.type_ouverture || '2_temps');

  const calculateAvancement = (m: any) => {
    if (m.is_annule) return { label: "Annulé", color: "bg-danger/10 text-danger" };
    if (m.is_infructueux) return { label: "Infructueux", color: "bg-warning/10 text-warning" };
    if (m.recours?.statut === RecoursStatut.SUSPENDU) return { label: "Suspendu (Recours)", color: "bg-orange-500/10 text-orange-500" };
    let lastJalonLabel = "Non lancé";
    const datesRealisees = m.dates_realisees || {};
    for (let i = jalonsKeys.length - 1; i >= 0; i--) {
      const key = jalonsKeys[i];
      if (datesRealisees[key]) {
        lastJalonLabel = JALONS_LABELS[key];
        break;
      }
    }
    return { 
      label: lastJalonLabel, 
      color: m.statut_global === 'SIGNE' ? "bg-success/10 text-success" : "bg-blue-edc-50 text-blue-edc-900" 
    };
  };

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => { 
      setShowSuccess(false); 
      setSelectedMarketId(null); 
    }, 1500);
  };

  const selectedMarket = markets.find(m => m.id === selectedMarketId);
  const marketGroups = selectedMarket ? getMarketGroups(selectedMarket) : JALONS_GROUPS;
  const activePhase = marketGroups.find(g => g.id === activePhaseId);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black ${theme.textMain} tracking-tight uppercase`} style={{ fontFamily: "'Poppins', sans-serif" }}>Suivi des Marchés</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Pilotage opérationnel des jalons de passation.</p>
        </div>
        <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto relative z-30`}>
          <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
            <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pilotage</span>
          </div>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
          <div className="w-full md:w-64"><CustomBulleSelect label="" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} /></div>
          <div className="relative w-full md:w-64">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.mode === 'dark' ? 'text-white' : theme.textSecondary}`} size={16} strokeWidth={theme.iconStroke} />
            <input
              type="text"
              placeholder="N° ou objet..."
              className={`${theme.input} pl-12 pr-6 py-2.5 w-full font-black ${theme.mode === 'dark' ? 'text-white placeholder:text-white/40' : ''}`} 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* UTILISATION DE sortedMarkets AU LIEU DE filteredMarkets */}
        {sortedMarkets.length > 0 ? sortedMarkets.map(m => {
          const status = calculateAvancement(m);
          return (
            <div key={m.id} onClick={() => { setSelectedMarketId(m.id); setActivePhaseId(JALONS_GROUPS[0].id); }} className={`group ${theme.card} p-8 md:p-10 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 flex flex-col h-full`}>
              <div className="flex items-center justify-between mb-4 md:mb-6">
                <span className={`px-2 py-0.5 ${theme.buttonShape} text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary`}>{m.numDossier}</span>
                <div className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight flex items-center gap-1.5 ${status.color}`}>
                  {m.statut_global === 'SIGNE' ? <CheckCircle2 size={10}/> : (m.is_annule || m.is_infructueux) ? <XCircle size={10}/> : <Clock size={10}/>}
                  {status.label}
                </div>
              </div>
              <TruncatedText text={m.objet} as="h3" className={`text-md md:text-lg font-black ${theme.textMain} uppercase leading-snug group-hover:text-primary transition-colors mb-2 line-clamp-2`} />
              {m.activite && (
                <p className={`text-[10px] font-bold ${theme.textSecondary} uppercase tracking-wide mb-4`}>{m.activite}</p>
              )}
              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <div className={`flex items-center gap-2 text-[10px] font-black ${theme.textSecondary} uppercase tracking-widest`}><Activity size={14} className={theme.textAccent} /><span>Pilotage actif</span></div>
                <ChevronRight size={16} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textSecondary} group-hover:text-primary transition-all`} />
              </div>
            </div>
          );
        }) : (
          <div className={`col-span-full py-24 text-center ${theme.card} border-dashed`}>
            <Search size={40} className={`mx-auto ${theme.textSecondary} opacity-40 mb-4`} />
            <p className={`${theme.textSecondary} font-black uppercase tracking-widest text-xs`}>Aucun marché trouvé</p>
          </div>
        )}
      </div>

      {selectedMarket && (
        <Modal isOpen={!!selectedMarketId} onClose={() => setSelectedMarketId(null)} title={`Édition : ${selectedMarket.numDossier}`} subtitle={selectedMarket.objet} size="xl" footer={
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
              className={`${theme.buttonPrimary} px-10 py-3 ${theme.buttonShape} font-black text-[11px] uppercase shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all flex items-center gap-2`}
            >
              <Save size={16} /> Enregistrer
            </button>
          </div>
        }>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-64 flex lg:flex-col gap-2 overflow-x-auto pb-2 shrink-0">
              {marketGroups.map((group) => {
                const accessible = isPhaseAccessible(selectedMarket, group.id);
                return (
                  <button 
                    key={group.id} 
                    disabled={!accessible}
                    onClick={() => setActivePhaseId(group.id)} 
                    className={`p-4 ${theme.buttonShape} border text-left flex items-center justify-between transition-all shrink-0 lg:w-full ${accessible ? '' : 'opacity-30 cursor-not-allowed grayscale'} ${activePhaseId === group.id ? theme.buttonPrimary : `bg-transparent ${theme.textSecondary} border-white/10 hover:bg-white/5`}`}
                  >
                    <div className="flex items-center gap-3"><Settings2 size={16} /><span className="text-[10px] font-black uppercase tracking-wide leading-none">{group.label.split('. ')[1] || group.label}</span></div>
                    <ChevronRight size={14} className={`hidden lg:block ${activePhaseId === group.id ? 'opacity-100' : 'opacity-0'}`} />
                  </button>
                );
              })}
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className={`text-md font-black ${theme.textMain} uppercase tracking-tight`}>{activePhase?.label}</h3>
                <div className={`px-3 py-1 ${theme.card} text-[9px] font-black uppercase`}>Étape {marketGroups.indexOf(activePhase!) + 1}/5</div>
              </div>

              {activePhaseId === 'consultation' && (
                <div className={`p-6 ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-3xl border space-y-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${theme.textSecondary} font-black uppercase text-xs`}>Type d'ouverture</div>
                    <CustomBulleSelect
                      label=""
                      value={selectedMarket.type_ouverture === '1_temps' ? '1_TEMPS' : '2_TEMPS'}
                      options={[
                        { value: '2_TEMPS', label: 'Ouverture en 2 temps' },
                        { value: '1_TEMPS', label: 'Ouverture en 1 temps' }
                      ]}
                      onChange={v => updateMarket(selectedMarket.id, { type_ouverture: v === '1_TEMPS' ? '1_temps' : '2_temps' })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {activePhase?.keys.filter(k => isJalonActive(selectedMarket, k)).map((key) => {
                  const isRestricted = !isJalonApplicable(selectedMarket, key);
                  const parentProject = projects.find(p => p.id === selectedMarket.projet_id);
                  const currentVal = selectedMarket.dates_realisees[key as keyof typeof selectedMarket.dates_realisees];
                  let isHistorical = false;

                  // Grisage si marché infructueux et champ après prop_attribution
                  const isGrayedByInfructueux = selectedMarket.is_infructueux && JALONS_AFTER_INFRUCTUEUX.includes(key);

                  // Grisage si marché suspendu par recours type C
                  const isBlockedBySuspendu = checkBlockedBySuspendu(selectedMarket, key);

                  if (currentVal && parentProject) {
                    const dateYear = new Date(currentVal).getFullYear();
                    if (dateYear < parentProject.exercice) {
                      isHistorical = true;
                    }
                  }

                  if (key === 'infructueux') return (
                    <div key={key} className={`p-8 rounded-3xl ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-warning/5 border-warning/10'} border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.mode === 'dark' ? 'text-white' : 'text-warning'} font-black uppercase text-xs`}><AlertTriangle size={18}/> Dossier Infructueux ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.is_infructueux ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {is_infructueux: v==='OUI', statut_global: v==='OUI' ? StatutGlobal.INFRUCTUEUX : StatutGlobal.EN_COURS})} />
                       </div>
                       {selectedMarket.is_infructueux && (
                         <div className="space-y-4 animate-in fade-in">
                           <BulleInput label="Motif d'infructuosité" value={selectedMarket.motif_infructueux} onChange={e => updateMarket(selectedMarket.id, {motif_infructueux: e.target.value})} />
                           <div className="flex justify-end">
                             <MultiFileManager
                               existingDocIds={selectedMarket.docs?.['infructueux_doc']}
                               onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'infructueux_doc', id)}
                               onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'infructueux_doc', id)}
                             />
                           </div>
                         </div>
                       )}
                    </div>
                  );

                  if (key === 'annule') {
                    const hasDepouillement = !!(selectedMarket.dates_realisees.depouillement || selectedMarket.dates_realisees.depouillement_1t);
                    return (
                    <div key={key} className={`p-8 rounded-3xl ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-danger/5 border-danger/10'} border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.mode === 'dark' ? 'text-white' : 'text-danger'} font-black uppercase text-xs`}><Ban size={18}/> Annuler le Dossier ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.is_annule ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {is_annule: v==='OUI', statut_global: v==='OUI' ? StatutGlobal.ANNULE : StatutGlobal.EN_COURS})} />
                       </div>
                       {selectedMarket.is_annule && (
                         <div className="space-y-4 animate-in fade-in">
                            <BulleInput label="Motif d'annulation" value={selectedMarket.motif_annulation} onChange={e => updateMarket(selectedMarket.id, {motif_annulation: e.target.value})} />
                            <div className="flex justify-end">
                              <MultiFileManager
                                existingDocIds={selectedMarket.docs?.['annule_doc']}
                                onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'annule_doc', id)}
                                onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'annule_doc', id)}
                              />
                            </div>
                            {hasDepouillement && (
                              <div className={`p-4 rounded-2xl ${theme.mode === 'dark' ? 'bg-orange-500/5 border-orange-500/10' : 'bg-orange-50 border-orange-200'} border space-y-3`}>
                                <p className={`text-[10px] font-black uppercase ${theme.mode === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>Demande d'autorisation du Conseil d'Administration</p>
                                <div className="flex justify-end">
                                  <MultiFileManager
                                    existingDocIds={selectedMarket.docs?.['annule_autorisation_ca']}
                                    onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'annule_autorisation_ca', id)}
                                    onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'annule_autorisation_ca', id)}
                                  />
                                </div>
                              </div>
                            )}
                         </div>
                       )}
                    </div>
                    );
                  }

                  if (key === 'additif') return (
                    <div key={key} className={`p-6 ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-3xl border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.textSecondary} font-black uppercase text-xs`}>Y'a-t-il eu un Additif ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.has_additif ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {has_additif: v==='OUI'})} />
                       </div>
                       {selectedMarket.has_additif && (
                         <div className="flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
                           <BulleInput type="date" label="Date de l'additif" value={selectedMarket.dates_realisees.additif} onChange={e => updateJalon(selectedMarket.id, 'realisees', 'additif', e.target.value)} />
                           <MultiFileManager
                             existingDocIds={selectedMarket.docs?.['additif']}
                             onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'additif', id)}
                             onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'additif', id)}
                           />
                         </div>
                       )}
                    </div>
                  );
                  
                  if (key === 'recours') return (
                    <RecoursSection
                      key={key}
                      market={selectedMarket}
                      updateMarket={updateMarket}
                      addMarketDocToArray={addMarketDocToArray}
                      removeMarketDocFromArray={removeMarketDocFromArray}
                    />
                  );

                  if (key === 'titulaire') return (
                    <div key={key} className={`p-6 ${theme.card} border-white/5 flex items-center gap-4 ${isGrayedByInfructueux ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                       <UserCheck className={theme.textAccent} size={20} />
                       <BulleInput label={JALONS_LABELS[key]} value={selectedMarket.titulaire || ''} onChange={e => updateMarket(selectedMarket.id, {titulaire: e.target.value})} disabled={isGrayedByInfructueux} />
                       {isGrayedByInfructueux && <span className="text-[8px] italic opacity-60">(Infructueux)</span>}
                    </div>
                  );

                  if (key === 'montant_ttc_reel') return (
                    <div key={key} className={`p-6 ${theme.card} border-white/5 flex items-center gap-4 ${isGrayedByInfructueux ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                       <Banknote className="text-success" size={20} />
                       <BulleInput label={JALONS_LABELS[key]} type="number" value={selectedMarket.montant_ttc_reel || ''} onChange={e => updateMarket(selectedMarket.id, {montant_ttc_reel: Number(e.target.value)})} disabled={isGrayedByInfructueux} />
                       {isGrayedByInfructueux && <span className="text-[8px] italic opacity-60">(Infructueux)</span>}
                    </div>
                  );

                  if (key === 'delai_contractuel') return (
                    <div key={key} className={`p-6 ${theme.card} border-white/5 flex items-center gap-4 ${isGrayedByInfructueux ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                       <Clock className={theme.textAccent} size={20} />
                       <BulleInput label={JALONS_LABELS[key]} value={selectedMarket.delai_contractuel || ''} onChange={e => updateMarket(selectedMarket.id, {delai_contractuel: e.target.value})} disabled={isGrayedByInfructueux} />
                       {isGrayedByInfructueux && <span className="text-[8px] italic opacity-60">(Infructueux)</span>}
                    </div>
                  );
                  
                  if (key === 'negociation_contractuelle') return (
                    <div key={key} className={`p-6 ${theme.card} flex items-center justify-between group border-white/5 ${isGrayedByInfructueux ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${theme.card} ${theme.textAccent} flex items-center justify-center group-hover:scale-110 transition-transform`}><FileText size={20}/></div>
                          <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none`}>{JALONS_LABELS[key]}</p>
                       </div>
                       <MultiFileManager
                         existingDocIds={selectedMarket.docs?.[key]}
                         onAdd={(id) => addMarketDocToArray(selectedMarket.id, key, id)}
                         onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, key, id)}
                         disabled={!can('WRITE') || isGrayedByInfructueux}
                       />
                    </div>
                  );

                  if (key === 'etudes_prealables_doc') return (
                    <div key={key} className={`p-6 ${theme.card} flex items-center justify-between group border-white/5`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${theme.card} ${theme.textAccent} flex items-center justify-center group-hover:scale-110 transition-transform`}><FileText size={20}/></div>
                          <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none`}>{JALONS_LABELS[key]}</p>
                       </div>
                       <MultiFileManager
                         existingDocIds={selectedMarket.docs?.[key]}
                         onAdd={(id) => addMarketDocToArray(selectedMarket.id, key, id)}
                         onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, key, id)}
                         disabled={!can('WRITE')}
                       />
                    </div>
                  );

                  if (key === 'preselection_doc') return (
                    <div key={key} className={`p-6 ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-3xl border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.textSecondary} font-black uppercase text-xs`}>Y'a-t-il eu une Présélection ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.has_preselection ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {has_preselection: v==='OUI'})} />
                       </div>
                       {selectedMarket.has_preselection && (
                         <div className="flex items-center justify-end gap-4 animate-in slide-in-from-top-2">
                           <MultiFileManager
                             existingDocIds={selectedMarket.docs?.['preselection_doc']}
                             onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'preselection_doc', id)}
                             onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'preselection_doc', id)}
                           />
                         </div>
                       )}
                    </div>
                  );

                  if (key === 'demande_eclaircissement_doc') return (
                    <div key={key} className={`p-6 ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-3xl border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.textSecondary} font-black uppercase text-xs`}>Y'a-t-il eu une demande d'éclaircissement ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.has_demande_eclaircissement ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {has_demande_eclaircissement: v==='OUI'})} />
                       </div>
                       {selectedMarket.has_demande_eclaircissement && (
                         <div className="flex items-center justify-end gap-4 animate-in slide-in-from-top-2">
                           <MultiFileManager
                             existingDocIds={selectedMarket.docs?.['demande_eclaircissement_doc']}
                             onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'demande_eclaircissement_doc', id)}
                             onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'demande_eclaircissement_doc', id)}
                           />
                         </div>
                       )}
                    </div>
                  );

                  if (key === 'reponse_eclaircissement_doc') return (
                    <div key={key} className={`p-6 ${theme.mode === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-3xl border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.textSecondary} font-black uppercase text-xs`}>Y'a-t-il eu une réponse ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.has_reponse_eclaircissement ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {has_reponse_eclaircissement: v==='OUI'})} />
                       </div>
                       {selectedMarket.has_reponse_eclaircissement && (
                         <div className="flex items-center justify-end gap-4 animate-in slide-in-from-top-2">
                           <MultiFileManager
                             existingDocIds={selectedMarket.docs?.['reponse_eclaircissement_doc']}
                             onAdd={(id) => addMarketDocToArray(selectedMarket.id, 'reponse_eclaircissement_doc', id)}
                             onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, 'reponse_eclaircissement_doc', id)}
                           />
                         </div>
                       )}
                    </div>
                  );

                  if (key === 'dao_doc' || key === 'adf_doc') return (
                    <div key={key} className={`p-6 ${theme.card} flex items-center justify-between group border-white/5`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${theme.card} ${theme.textAccent} flex items-center justify-center group-hover:scale-110 transition-transform`}><FileText size={20}/></div>
                          <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none`}>{JALONS_LABELS[key]}</p>
                       </div>
                       <MultiFileManager
                         existingDocIds={selectedMarket.docs?.[key]}
                         onAdd={(id) => addMarketDocToArray(selectedMarket.id, key, id)}
                         onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, key, id)}
                         disabled={!can('WRITE')}
                       />
                    </div>
                  );
                  
                  return (
                    <div
                      key={key}
                      className={`p-4 ${theme.card} border-white/5 flex items-center justify-between gap-4
                        ${isRestricted || isGrayedByInfructueux || isBlockedBySuspendu ? 'opacity-30 pointer-events-none grayscale' : ''}
                        ${isHistorical ? 'opacity-70 bg-black/5' : ''}
                      `}
                    >
                       <div className="flex flex-col">
                         <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none pr-2`}>
                           {JALONS_LABELS[key] || key}
                           {isRestricted && <span className="text-[8px] italic opacity-60 ml-2">(N/A)</span>}
                           {isGrayedByInfructueux && <span className="text-[8px] italic opacity-60 ml-2">(Infructueux)</span>}
                           {isBlockedBySuspendu && <span className="text-[8px] italic opacity-60 ml-2">(Suspendu)</span>}
                         </p>
                         {isHistorical && currentVal && (
                           <span className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase mt-1">
                             <History size={10} /> Historique ({new Date(currentVal).getFullYear()})
                           </span>
                         )}
                       </div>
                       <div className="flex items-center gap-3 shrink-0">
                          <div className="w-36">
                            <BulleInput
                              label=""
                              type="date"
                              value={currentVal || ''}
                              onChange={e => updateJalon(selectedMarket.id, 'realisees', key, e.target.value)}
                              disabled={!can('WRITE') || isRestricted || isGrayedByInfructueux}
                            />
                          </div>
                          <MultiFileManager
                            existingDocIds={selectedMarket.docs?.[key]}
                            onAdd={(id) => addMarketDocToArray(selectedMarket.id, key, id)}
                            onRemove={(id) => removeMarketDocFromArray(selectedMarket.id, key, id)}
                            disabled={!can('WRITE') || isRestricted || isGrayedByInfructueux}
                          />
                       </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-6 border-t border-white/5 flex justify-between">
                 <button
                  disabled={marketGroups.indexOf(activePhase!) === 0}
                  onClick={() => setActivePhaseId(marketGroups[marketGroups.indexOf(activePhase!) - 1].id)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase ${theme.textSecondary} disabled:opacity-0 transition-all hover:translate-x-[-4px]`}
                 >
                   <ArrowLeft size={14} /> Précédent
                 </button>
                 <button
                  disabled={marketGroups.indexOf(activePhase!) === marketGroups.length - 1 || !isPhaseAccessible(selectedMarket, marketGroups[marketGroups.indexOf(activePhase!) + 1].id)}
                  onClick={() => setActivePhaseId(marketGroups[marketGroups.indexOf(activePhase!) + 1].id)}
                  className={`flex items-center gap-2 text-[10px] font-black uppercase ${theme.textAccent} disabled:opacity-0 transition-all hover:translate-x-[4px]`}
                 >
                   Suivant <ArrowRight size={14} />
                 </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
      
      <Footer />
    </div>
  );
};