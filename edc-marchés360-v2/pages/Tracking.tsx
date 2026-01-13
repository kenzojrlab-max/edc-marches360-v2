import React, { useState, useMemo } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Save, Search, CheckCircle2, Clock, Activity, Settings2, ChevronRight,
  ArrowLeft, ArrowRight, UserCheck, Banknote, AlertTriangle, XCircle, Ban, RefreshCcw, Calendar, FileText, Gavel, Layers
} from 'lucide-react';
import { JALONS_LABELS, JALONS_GROUPS } from '../constants';
import { Modal } from '../components/Modal';
import { BulleInput } from '../components/BulleInput';
import { FileManager } from '../components/FileManager';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { SourceFinancement, StatutGlobal } from '../types';

export const Tracking: React.FC = () => {
  const { markets, projects, updateMarket, updateMarketDoc, updateJalon } = useMarkets();
  const { can } = useAuth();
  const { theme, themeType } = useTheme();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>(''); 
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);
  const [activePhaseId, setActivePhaseId] = useState<string>(JALONS_GROUPS[0].id);
  const [showSuccess, setShowSuccess] = useState(false);

  const jalonsKeys = JALONS_GROUPS.flatMap(g => g.keys);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString())));
    return (years as string[]).sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const yearOptions = [{ value: '', label: 'Tous les exercices' }, ...availableYears.map(y => ({ value: y, label: y }))];

  const projectOptions = useMemo(() => {
    return [{ value: '', label: 'Tous les projets' }, ...projects.map(p => ({ value: p.id, label: p.libelle }))];
  }, [projects]);

  const calculateAvancement = (m: any) => {
    if (m.is_annule) return { label: "Annulé", color: "bg-danger/10 text-danger" };
    if (m.is_infructueux) return { label: "Infructueux", color: "bg-warning/10 text-warning" };
    let lastJalonLabel = "Inscrit au PPM";
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

  const filteredMarkets = useMemo(() => {
    return markets.filter(m => {
      const parentProject = projects.find(p => p.id === m.projet_id);
      const matchSearch = (m.numDossier || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.objet || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = !selectedYear || parentProject?.exercice.toString() === selectedYear;
      const matchProject = !selectedProjectId || m.projet_id === selectedProjectId;
      return matchSearch && matchYear && matchProject;
    });
  }, [markets, projects, searchTerm, selectedYear, selectedProjectId]);

  const selectedMarket = markets.find(m => m.id === selectedMarketId);
  const activePhase = JALONS_GROUPS.find(g => g.id === activePhaseId);

  const isPhaseAccessible = (phaseId: string) => {
    if (!selectedMarket) return true;
    const groups = JALONS_GROUPS;
    const activeIndex = groups.findIndex(g => g.id === phaseId);
    if (selectedMarket.is_infructueux) {
      const stopIndex = groups.findIndex(g => g.keys.includes('infructueux'));
      return activeIndex <= stopIndex;
    }
    if (selectedMarket.is_annule) {
      const stopIndex = groups.findIndex(g => g.keys.includes('annule'));
      return activeIndex <= stopIndex;
    }
    return true;
  };

  const getVisibleJalonsOfPhase = (phase: typeof activePhase) => {
    if (!phase || !selectedMarket) return [];
    const visible = [];
    for (const key of phase.keys) {
      visible.push(key);
      if (key === 'infructueux' && selectedMarket.is_infructueux) break;
      if (key === 'annule' && selectedMarket.is_annule) break;
    }
    return visible;
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 px-2">
        <div>
          <h1 className={`text-2xl md:text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Suivi des Marchés</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Pilotage opérationnel des jalons de passation.</p>
        </div>
        <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 w-full md:w-auto relative z-[50]`}>
          <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
            <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="text-[10px] font-black uppercase tracking-widest">Pilotage</span>
          </div>
          <div className="w-full md:w-40"><CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
          <div className="w-full md:w-64"><CustomBulleSelect label="" value={selectedProjectId} options={projectOptions} onChange={setSelectedProjectId} /></div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {filteredMarkets.length > 0 ? filteredMarkets.map(m => {
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
              <h3 className={`text-md md:text-lg font-black ${theme.textMain} uppercase leading-snug group-hover:text-primary transition-colors mb-4 line-clamp-2`}>{m.objet}</h3>
              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between">
                <div className={`flex items-center gap-2 text-[10px] font-black ${theme.textSecondary} uppercase tracking-widest`}><Activity size={14} className={theme.textAccent} /><span>Pilotage actif</span></div>
                <ChevronRight size={16} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textSecondary} group-hover:text-primary transition-all`} />
              </div>
            </div>
          );
        }) : (
          <div className={`col-span-full py-24 text-center ${theme.card} border-dashed`}>
            <Search size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Aucun marché trouvé</p>
          </div>
        )}
      </div>

      {selectedMarket && (
        <Modal isOpen={!!selectedMarketId} onClose={() => setSelectedMarketId(null)} title={`Édition : ${selectedMarket.numDossier}`} size="xl" footer={
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
              {JALONS_GROUPS.map((group) => {
                const accessible = isPhaseAccessible(group.id);
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
                <div className={`px-3 py-1 ${theme.card} text-[9px] font-black uppercase`}>Étape {JALONS_GROUPS.indexOf(activePhase!) + 1}/5</div>
              </div>

              <div className="space-y-4">
                {getVisibleJalonsOfPhase(activePhase).map((key) => {
                  const isANORestricted = key.includes('ano') && selectedMarket.source_financement === SourceFinancement.BUDGET_EDC;
                  
                  // RENDU DES CHAMPS SPÉCIFIQUES
                  if (key === 'infructueux') return (
                    <div key={key} className={`p-8 rounded-3xl ${themeType === 'glass' ? 'bg-white/5 border-white/10' : 'bg-warning/5 border-warning/10'} border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${themeType === 'glass' ? 'text-white' : 'text-warning'} font-black uppercase text-xs`}><AlertTriangle size={18}/> Dossier Infructueux ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.is_infructueux ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {is_infructueux: v==='OUI', statut_global: v==='OUI' ? StatutGlobal.INFRUCTUEUX : StatutGlobal.EN_COURS})} />
                       </div>
                       {selectedMarket.is_infructueux && <div className="flex justify-end pt-2"><FileManager existingDocId={selectedMarket.docs?.['infructueux_doc']} onUpload={(id) => updateMarketDoc(selectedMarket.id, 'infructueux_doc', id)} /></div>}
                    </div>
                  );

                  if (key === 'annule') return (
                    <div key={key} className={`p-8 rounded-3xl ${themeType === 'glass' ? 'bg-white/5 border-white/10' : 'bg-danger/5 border-danger/10'} border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${themeType === 'glass' ? 'text-white' : 'text-danger'} font-black uppercase text-xs`}><Ban size={18}/> Annuler le Dossier ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.is_annule ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {is_annule: v==='OUI', statut_global: v==='OUI' ? StatutGlobal.ANNULE : StatutGlobal.EN_COURS})} />
                       </div>
                       {selectedMarket.is_annule && (
                         <div className="space-y-4 animate-in fade-in">
                            <BulleInput label="Motif d'annulation" value={selectedMarket.motif_annulation} onChange={e => updateMarket(selectedMarket.id, {motif_annulation: e.target.value})} />
                            <div className="flex justify-end"><FileManager existingDocId={selectedMarket.docs?.['annule_doc']} onUpload={(id) => updateMarketDoc(selectedMarket.id, 'annule_doc', id)} /></div>
                         </div>
                       )}
                    </div>
                  );

                  if (key === 'additif') return (
                    <div key={key} className={`p-6 ${themeType === 'glass' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-100'} rounded-3xl border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${theme.textSecondary} font-black uppercase text-xs`}>A-t-il eu un Additif ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.has_additif ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {has_additif: v==='OUI'})} />
                       </div>
                       {selectedMarket.has_additif && (
                         <div className="flex items-center justify-between gap-4 animate-in slide-in-from-top-2">
                           <BulleInput type="date" label="Date de l'additif" value={selectedMarket.dates_realisees.additif} onChange={e => updateJalon(selectedMarket.id, 'realisees', 'additif', e.target.value)} />
                           <FileManager existingDocId={selectedMarket.docs?.['additif']} onUpload={(id) => updateMarketDoc(selectedMarket.id, 'additif', id)} />
                         </div>
                       )}
                    </div>
                  );
                  
                  if (key === 'recours') return (
                    <div key={key} className={`p-8 rounded-3xl ${themeType === 'glass' ? 'bg-white/5 border-white/10' : 'bg-blue-50/50 border-blue-100'} border space-y-4`}>
                       <div className="flex items-center justify-between">
                          <div className={`flex items-center gap-3 ${themeType === 'glass' ? 'text-white' : 'text-blue-600'} font-black uppercase text-xs`}><Gavel size={18}/> A-t-il eu un Recours ?</div>
                          <CustomBulleSelect label="" value={selectedMarket.has_recours ? 'OUI' : 'NON'} options={[{value:'OUI',label:'OUI'},{value:'NON',label:'NON'}]} onChange={v => updateMarket(selectedMarket.id, {has_recours: v==='OUI'})} />
                       </div>
                       {selectedMarket.has_recours && (
                         <div className="space-y-4 animate-in fade-in">
                            <BulleInput label="Verdict / Issue du recours" value={selectedMarket.recours_issue || ''} onChange={e => updateMarket(selectedMarket.id, {recours_issue: e.target.value})} />
                            <div className={`flex items-center justify-between p-4 ${theme.card} border-white/5`}>
                               <p className="text-[10px] font-black text-slate-400 uppercase">Décision du recours</p>
                               <FileManager existingDocId={selectedMarket.docs?.['recours_doc']} onUpload={(id) => updateMarketDoc(selectedMarket.id, 'recours_doc', id)} />
                            </div>
                         </div>
                       )}
                    </div>
                  );

                  if (key === 'titulaire') return (
                    <div key={key} className={`p-6 ${theme.card} border-white/5 flex items-center gap-4`}>
                       <UserCheck className={theme.textAccent} size={20} />
                       <BulleInput label={JALONS_LABELS[key]} value={selectedMarket.titulaire || ''} onChange={e => updateMarket(selectedMarket.id, {titulaire: e.target.value})} />
                    </div>
                  );

                  if (key === 'montant_ttc_reel') return (
                    <div key={key} className={`p-6 ${theme.card} border-white/5 flex items-center gap-4`}>
                       <Banknote className="text-success" size={20} />
                       <BulleInput label={JALONS_LABELS[key]} type="number" value={selectedMarket.montant_ttc_reel || ''} onChange={e => updateMarket(selectedMarket.id, {montant_ttc_reel: Number(e.target.value)})} />
                    </div>
                  );
                  
                  if (key === 'dao_doc' || key === 'adf_doc') return (
                    <div key={key} className={`p-6 ${theme.card} flex items-center justify-between group border-white/5`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 ${theme.card} ${theme.textAccent} flex items-center justify-center group-hover:scale-110 transition-transform`}><FileText size={20}/></div>
                          <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none`}>{JALONS_LABELS[key]}</p>
                       </div>
                       <FileManager existingDocId={selectedMarket.docs?.[key]} onUpload={(id) => updateMarketDoc(selectedMarket.id, key, id)} disabled={!can('WRITE')} />
                    </div>
                  );
                  
                  // JALONS STANDARDS (DATES)
                  return (
                    <div key={key} className={`p-4 ${theme.card} border-white/5 flex items-center justify-between gap-4 ${isANORestricted ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                       <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none truncate pr-2`}>{JALONS_LABELS[key] || key} {isANORestricted && <span className="text-[8px] italic opacity-60 ml-2">(N/A)</span>}</p>
                       <div className="flex items-center gap-3 shrink-0">
                          <div className="w-36"><BulleInput label="" type="date" value={selectedMarket.dates_realisees[key as keyof typeof selectedMarket.dates_realisees] || ''} onChange={e => updateJalon(selectedMarket.id, 'realisees', key, e.target.value)} disabled={!can('WRITE') || isANORestricted} /></div>
                          <FileManager existingDocId={selectedMarket.docs?.[key]} onUpload={(id) => updateMarketDoc(selectedMarket.id, key, id)} disabled={!can('WRITE') || isANORestricted} />
                       </div>
                    </div>
                  );
                })}
              </div>

              {/* NAVIGATION ENTRE LES PHASES */}
              <div className="pt-6 border-t border-white/5 flex justify-between">
                 <button 
                  disabled={JALONS_GROUPS.indexOf(activePhase!) === 0} 
                  onClick={() => setActivePhaseId(JALONS_GROUPS[JALONS_GROUPS.indexOf(activePhase!) - 1].id)} 
                  className={`flex items-center gap-2 text-[10px] font-black uppercase ${theme.textSecondary} disabled:opacity-0 transition-all hover:translate-x-[-4px]`}
                 >
                   <ArrowLeft size={14} /> Précédent
                 </button>
                 <button 
                  disabled={JALONS_GROUPS.indexOf(activePhase!) === JALONS_GROUPS.length - 1 || !isPhaseAccessible(JALONS_GROUPS[JALONS_GROUPS.indexOf(activePhase!) + 1].id)} 
                  onClick={() => setActivePhaseId(JALONS_GROUPS[JALONS_GROUPS.indexOf(activePhase!) + 1].id)} 
                  className={`flex items-center gap-2 text-[10px] font-black uppercase ${theme.textAccent} disabled:opacity-0 transition-all hover:translate-x-[4px]`}
                 >
                   Suivant <ArrowRight size={14} />
                 </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};