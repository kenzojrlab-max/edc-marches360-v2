
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarkets } from '../contexts/MarketContext';
import { useAuth } from '../contexts/AuthContext';
import { JALONS_LABELS, JALONS_GROUPS } from '../constants';
import { BulleInput } from '../components/BulleInput';
import { FileManager } from '../components/FileManager';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { 
  ChevronLeft, 
  Info, 
  Save, 
  RefreshCcw, 
  Ban, 
  Gavel, 
  AlertCircle,
  FileCheck,
  Calendar,
  Lock,
  ArrowRight,
  Download,
  AlertTriangle,
  Activity,
  UserCheck,
  Banknote
} from 'lucide-react';
import { Marche, SourceFinancement } from '../types';

export const MarketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMarketById, updateMarket, updateJalon, updateMarketDoc } = useMarkets();
  const { isGuest, can } = useAuth();
  
  const market = getMarketById(id!);
  const [isSaving, setIsSaving] = useState(false);

  if (!market) return <div className="p-20 text-center font-black">Marché introuvable</div>;

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setIsSaving(false);
    alert("✅ Données du registre synchronisées.");
  };

  const isANODisabled = market.source_financement === SourceFinancement.BUDGET_EDC;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className="p-4 bg-white border border-slate-200 rounded-[1.5rem] hover:bg-slate-50 transition-all text-slate-400 shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest">{market.numDossier}</span>
              <span className="px-3 py-1 bg-accent/10 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest">{market.statut_global}</span>
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight mt-1 uppercase leading-tight">{market.objet}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {can('WRITE') && (
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-3 bg-primary text-white px-10 py-4 rounded-[1.5rem] text-sm font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
              {isSaving ? <RefreshCcw className="animate-spin" /> : <Save />}
              Enregistrer les données
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-10">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
             <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Registre Officiel de Suivi</h3>
                <span className="text-[10px] font-black text-slate-400 bg-white px-4 py-1.5 rounded-full border border-slate-200 uppercase tracking-widest">Points de Contrôle</span>
             </div>

             <div className="p-10 space-y-12">
               {JALONS_GROUPS.map(group => (
                 <div key={group.id} className="space-y-6">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-edc-500 bg-blue-edc-50 w-fit px-5 py-2 rounded-full">{group.label}</h4>
                    <div className="space-y-4">
                       {group.keys.map((key) => {
                         const isBlocked = isANODisabled && key.includes('ano');
                         
                         if (key === 'titulaire') {
                            return (
                              <div key={key} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-accent/30 transition-all">
                                 <div className="flex items-center gap-4 flex-1">
                                    <UserCheck className="text-primary" size={20} />
                                    <BulleInput label={JALONS_LABELS[key]} value={market.titulaire || ''} onChange={e => updateMarket(market.id, {titulaire: e.target.value})} />
                                 </div>
                              </div>
                            );
                         }

                         if (key === 'montant_ttc_reel') {
                            return (
                              <div key={key} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] border border-slate-100 bg-white hover:border-accent/30 transition-all">
                                 <div className="flex items-center gap-4 flex-1">
                                    <Banknote className="text-success" size={20} />
                                    <BulleInput label={JALONS_LABELS[key]} type="number" value={market.montant_ttc_reel || ''} onChange={e => updateMarket(market.id, {montant_ttc_reel: Number(e.target.value)})} />
                                 </div>
                              </div>
                            );
                         }

                         if (key === 'infructueux') {
                            return (
                              <div key={key} className="p-8 rounded-[2rem] bg-danger/5 border border-danger/10 space-y-4">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                      <RefreshCcw className="text-danger" size={20} />
                                      <p className="text-sm font-black text-slate-700 uppercase tracking-tighter">16. Dossier Infructueux ?</p>
                                   </div>
                                   <CustomBulleSelect label="" value={market.is_infructueux ? 'OUI' : 'NON'} options={[{value:'NON',label:'NON'}, {value:'OUI',label:'OUI'}]} onChange={v => updateMarket(market.id, {is_infructueux: v==='OUI'})} />
                                </div>
                                {market.is_infructueux && (
                                  <div className="flex items-center justify-between pl-10 animate-in slide-in-from-top-2">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase">Décision officielle d'infructuosité :</p>
                                     <FileManager 
                                      existingDocId={market.docs?.['infructueux_doc']} 
                                      onUpload={(docId) => updateMarketDoc(market.id, 'infructueux_doc', docId)} 
                                     />
                                  </div>
                                )}
                              </div>
                            );
                         }

                         if (key === 'annule') {
                            return (
                              <div key={key} className="p-8 rounded-[2rem] bg-slate-900 text-white space-y-6">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-4">
                                      <Ban className="text-danger" size={20} />
                                      <p className="text-sm font-black uppercase tracking-tighter">Annulation du dossier</p>
                                   </div>
                                   <select 
                                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-xs font-black outline-none"
                                    value={market.is_annule ? 'OUI' : 'NON'}
                                    onChange={e => updateMarket(market.id, {is_annule: e.target.value === 'OUI'})}
                                   >
                                      <option value="NON">NON</option>
                                      <option value="OUI">OUI (ANNULER)</option>
                                   </select>
                                </div>
                                {market.is_annule && (
                                  <div className="space-y-4 animate-in fade-in duration-300">
                                     <BulleInput label="Motif d'annulation" className="!bg-white/5 !text-white !border-white/10" value={market.motif_annulation} onChange={e => updateMarket(market.id, {motif_annulation: e.target.value})} />
                                     <div className="p-6 bg-danger/10 rounded-2xl border border-danger/20 flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase flex items-center gap-2"><AlertTriangle size={14}/> Accord du CA (Obligatoire)</p>
                                        <FileManager 
                                          existingDocId={market.docs?.['annule_doc']} 
                                          onUpload={(docId) => updateMarketDoc(market.id, 'annule_doc', docId)} 
                                        />
                                     </div>
                                  </div>
                                )}
                              </div>
                            );
                         }

                         return (
                           <div key={key} className={`flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-[2rem] border transition-all ${isBlocked ? 'bg-slate-50 grayscale opacity-40 select-none' : 'bg-white border-slate-100 hover:border-accent/30'}`}>
                              <div className="flex-1">
                                 <p className="text-sm font-bold text-slate-700">{JALONS_LABELS[key]} {isBlocked && <span className="text-[9px] font-black text-danger uppercase ml-2">(Pas de Bailleur: N/A)</span>}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <input 
                                  type="date"
                                  className={`bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black outline-none focus:ring-4 focus:ring-accent/10 ${isBlocked ? 'cursor-not-allowed opacity-50' : ''}`}
                                  value={market.dates_realisees[key as keyof typeof market.dates_realisees] || ''}
                                  onChange={e => updateJalon(market.id, 'realisees', key, e.target.value)}
                                  disabled={isGuest || isBlocked}
                                />
                                <FileManager 
                                  existingDocId={market.docs?.[key]} 
                                  onUpload={(docId) => updateMarketDoc(market.id, key, docId)} 
                                  disabled={isBlocked} 
                                />
                              </div>
                           </div>
                         );
                       })}
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8">
              <h4 className="font-black text-sm uppercase tracking-widest text-slate-800 flex items-center gap-3">
                 <Info size={20} className="text-accent" /> Identification
              </h4>
              <div className="space-y-6">
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Titulaire</p>
                    <BulleInput label="" value={market.titulaire || ''} onChange={e => updateMarket(market.id, {titulaire: e.target.value})} placeholder="Saisir titulaire..." />
                 </div>
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Montant TTC (FCFA)</p>
                    <BulleInput label="" type="number" value={market.montant_ttc_reel || ''} onChange={e => updateMarket(market.id, {montant_ttc_reel: Number(e.target.value)})} />
                 </div>
                 <div className="pt-6 border-t border-slate-50 space-y-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Source: <span className="font-black">{market.source_financement}</span></p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Imputation: <span className="font-black">{market.imputation_budgetaire}</span></p>
                 </div>
              </div>
           </div>

           <div className="bg-accent p-10 rounded-[3rem] text-white space-y-6 shadow-2xl shadow-accent/20">
              <Activity size={32} />
              <div>
                 <h4 className="text-xs font-black uppercase tracking-widest opacity-60">Action Requise</h4>
                 <p className="text-xl font-black mt-2 leading-tight">Prochaine étape : Lancement de l'Appel d'Offres</p>
              </div>
              <button onClick={() => navigate('/execution')} className="w-full bg-white text-accent py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2">
                 Vers Exécution <ArrowRight size={16} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};
