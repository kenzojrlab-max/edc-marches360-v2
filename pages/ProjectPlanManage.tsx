import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext'; // NOUVEAU
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  ChevronLeft, Trash2, Plus, PencilLine, Search, Activity, ArrowUpRight,
  Save, X, FileText, CreditCard, FileCheck, Download, Layers, Upload, MessageSquare
} from 'lucide-react';
import { BulleInput } from '../components/BulleInput';
import { Modal } from '../components/Modal';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { FileManager } from '../components/FileManager';
import { Marche, StatutGlobal, AOType, MarketType, MarcheDates, SourceFinancement, Projet } from '../types';
import { FONCTIONS, JALONS_PPM_KEYS, JALONS_LABELS, JALONS_PPM_CONFIG } from '../constants';
import { formatDate, getLateStatus } from '../utils/date';
import { storage } from '../utils/storage';

export const ProjectPlanManage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { theme, themeType } = useTheme();
  
  // CORRECTION : Éclatement des contextes
  const { markets, updateMarket, addMarket, removeMarket, updateComment } = useMarkets();
  const { projects, updateProject } = useProjects();
  
  const { user, can } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Marche | null>(null);

  const [formData, setFormData] = useState<Partial<Marche>>({
    numDossier: '', objet: '', activite: '', fonction: FONCTIONS[0],
    typeAO: AOType.AON, typePrestation: MarketType.TRAVAUX, montant_prevu: 0,
    imputation_budgetaire: '', dates_prevues: {} as MarcheDates, comments: {}, docs: {}, has_additif: false
  });

  const project = projects.find(p => p.id === projectId);
  const projectMarkets = markets.filter(m => m.projet_id === projectId);
  
  const filteredMarkets = projectMarkets.filter(m => 
    (m.numDossier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.objet || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!project) return <div className="p-20 text-center font-black">Projet introuvable</div>;

  const openModal = (market: Marche | null = null) => {
    if (market) {
      setEditingMarket(market);
      setFormData({ ...market });
    } else {
      setEditingMarket(null);
      setFormData({ 
        numDossier: '', 
        objet: '', 
        activite: '', 
        fonction: FONCTIONS[0], 
        typeAO: AOType.AON, 
        typePrestation: MarketType.TRAVAUX, 
        montant_prevu: 0, 
        imputation_budgetaire: '', 
        dates_prevues: {} as MarcheDates, 
        comments: {},
        docs: {}, 
        has_additif: false 
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.numDossier || !formData.objet) return;
    if (editingMarket) {
      updateMarket(editingMarket.id, formData);
    } else {
      addMarket({ 
        ...(formData as Marche), 
        id: crypto.randomUUID(), 
        projet_id: projectId!, 
        source_financement: project.sourceFinancement, 
        dates_realisees: {}, 
        comments: formData.comments || {},
        docs: formData.docs || {}, 
        statut_global: StatutGlobal.PLANIFIE, 
        is_infructueux: false, 
        is_annule: false, 
        execution: { 
          decomptes: [], 
          avenants: [], 
          has_avenant: false, 
          is_resilie: false, 
          resiliation_step: 0 
        }, 
        created_by: user?.id || 'system', 
        date_creation: new Date().toISOString() 
      });
    }
    setIsModalOpen(false);
  };

  const updateFormDataDate = (key: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      dates_prevues: {
        ...(prev.dates_prevues || {}),
        [key]: val
      }
    }));
  };

  const updateFormDataComment = (key: string, val: string) => {
    setFormData(prev => ({
      ...prev,
      comments: {
        ...(prev.comments || {}),
        [key]: val
      }
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">
      {/* HEADER AVEC BOUTON D'IMPORTATION PPM SIGNÉ RÉTABLI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/ppm-manage')} className={`p-4 ${theme.card} ${theme.buttonShape} hover:scale-105 transition-all text-slate-400`}><ChevronLeft size={20} /></button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className={`px-3 py-0.5 ${themeType === 'glass' ? 'bg-white/10' : 'bg-accent/10'} text-accent rounded-full text-[9px] font-black uppercase`}>{project.exercice}</span>
               <span className={`px-3 py-0.5 ${themeType === 'glass' ? 'bg-white/5' : 'bg-slate-100'} text-slate-400 rounded-full text-[9px] font-black uppercase`}>{project.nomBailleur || project.sourceFinancement}</span>
            </div>
            <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase leading-tight`}>{project.libelle}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* BOUTON D'IMPORTATION DU PPM SIGNÉ (RÉTABLI) */}
          <div className="flex flex-col items-end gap-1">
            <span className={`text-[8px] font-black uppercase tracking-widest ${theme.textSecondary} opacity-60 mr-2`}>PPM Officiel Signé</span>
            <FileManager 
              onUpload={(docId) => updateProject(project.id, { ppm_doc_id: docId })}
              existingDocId={project.ppm_doc_id}
              disabled={!can('WRITE')}
            />
          </div>
          
          <button onClick={() => openModal()} className={`${theme.buttonPrimary} px-8 py-3 ${theme.buttonShape} text-sm font-black shadow-2xl transition-all flex items-center gap-3`}><Plus size={20} /> Inscrire un Marché</button>
        </div>
      </div>

      {/* Barre de Recherche & Filtre harmonisée */}
      <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 relative z-[100]`}>
        <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
          <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          <span className="text-[10px] font-black uppercase tracking-widest">Recherche</span>
        </div>
        <div className="relative flex-1 w-full">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : 'text-slate-400'}`} size={18} />
          <input 
            type="text" 
            placeholder="Filtrer par N° ou objet..." 
            className={`${theme.input} pl-12 pr-6 py-2.5 w-full font-black ${themeType === 'glass' ? 'text-white placeholder:text-white/40' : ''}`} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      {/* Tableau Structurel */}
      <div className={`${theme.card} flex flex-col relative overflow-hidden`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[3200px]">
            <thead>
              <tr className={`${themeType === 'glass' ? 'bg-slate-900' : 'bg-slate-50'}`}>
                <th rowSpan={2} className={`p-8 border-b border-r border-white/10 text-[10px] font-black uppercase ${theme.textSecondary} sticky left-0 ${themeType === 'glass' ? 'bg-slate-900' : 'bg-slate-50'} z-20 w-[350px]`}>Dossier & Objet</th>
                <th rowSpan={2} className={`p-8 border-b border-r border-white/10 text-[10px] font-black uppercase ${theme.textSecondary} w-[180px] text-right`}>Budget Estimé</th>
                {JALONS_PPM_CONFIG.map(jalon => (
                  <th key={jalon.key} colSpan={2} className={`p-4 border-b border-r border-white/10 text-[10px] font-black uppercase ${theme.textSecondary} text-center`}>{jalon.label}</th>
                ))}
                <th rowSpan={2} className={`p-8 border-b border-white/10 text-[10px] font-black uppercase ${theme.textSecondary} text-center sticky right-0 ${themeType === 'glass' ? 'bg-slate-900' : 'bg-slate-50'} z-20`}>Actions</th>
              </tr>
              <tr className={`${themeType === 'glass' ? 'bg-slate-900/80' : 'bg-slate-50/80'}`}>
                {JALONS_PPM_CONFIG.map(jalon => (
                  <React.Fragment key={`${jalon.key}-sub`}>
                    <th className={`p-3 border-b border-r border-white/10 text-[9px] font-black ${theme.textAccent} text-center uppercase`}>Prévue</th>
                    <th className={`p-3 border-b border-r border-white/10 text-[9px] font-black ${theme.textSecondary} text-center uppercase`}>Réalisée</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMarkets.length > 0 ? filteredMarkets.map((m) => (
                <tr key={m.id} className="group hover:bg-white/5 transition-all">
                  <td className={`p-6 border-r border-white/10 sticky left-0 z-10 ${themeType === 'glass' ? 'bg-[#1a2333]' : 'bg-white'} transition-colors`}>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black ${theme.textAccent} uppercase`}>{m.numDossier}</span>
                      <span className={`text-xs font-bold ${theme.textMain} uppercase leading-tight line-clamp-2`}>{m.objet}</span>
                    </div>
                  </td>
                  <td className={`p-6 border-r border-white/10 text-sm font-black ${theme.textMain} text-right`}>{m.montant_prevu.toLocaleString()}</td>
                  {JALONS_PPM_CONFIG.map(jalon => (
                    <React.Fragment key={`${m.id}-${jalon.key}`}>
                      <td className={`p-3 border-r border-white/10 text-center text-[10px] font-black ${theme.textAccent}`}>
                        {formatDate(m.dates_prevues[jalon.key as keyof typeof m.dates_prevues] || null)}
                      </td>
                      <td className={`p-3 border-r border-white/10 text-center text-[10px] font-black ${theme.textSecondary}`}>
                        {formatDate(m.dates_realisees[jalon.key as keyof typeof m.dates_realisees] || null)}
                      </td>
                    </React.Fragment>
                  ))}
                  <td className={`p-6 text-center sticky right-0 z-10 ${themeType === 'glass' ? 'bg-[#1a2333]' : 'bg-white'}`}>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(m)} className={`p-2.5 ${theme.buttonSecondary} ${theme.buttonShape} transition-all`}><PencilLine size={16} /></button>
                      <button onClick={() => removeMarket(m.id)} className={`p-2.5 ${theme.buttonDanger} ${theme.buttonShape} transition-all`}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )) : (<tr><td colSpan={100} className="p-40 text-center text-slate-400 font-black uppercase italic">Aucun marché trouvé</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL D'ÉDITION / CRÉATION */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingMarket ? `Édition : ${editingMarket.numDossier}` : "Inscrire un nouveau Marché"}
        size="xl"
      >
        <div className="space-y-8">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <BulleInput label="N° Dossier" value={formData.numDossier} onChange={e => setFormData({...formData, numDossier: e.target.value})} placeholder="Ex: 001/AO/EDC/2025" required />
              <BulleInput label="Objet du Marché" value={formData.objet} onChange={e => setFormData({...formData, objet: e.target.value})} placeholder="Saisir l'objet complet..." required />
              <CustomBulleSelect label="Fonction Analytique" value={formData.fonction || ''} options={FONCTIONS.map(f => ({value: f, label: f}))} onChange={v => setFormData({...formData, fonction: v})} />
              <BulleInput label="Activité" value={formData.activite} onChange={e => setFormData({...formData, activite: e.target.value})} placeholder="Nom de l'activité..." />
              <CustomBulleSelect label="Type de Dossier (AO)" value={formData.typeAO || ''} options={Object.values(AOType).map(v => ({value: v, label: v}))} onChange={v => setFormData({...formData, typeAO: v})} />
              <CustomBulleSelect label="Prestation" value={formData.typePrestation || ''} options={Object.values(MarketType).map(v => ({value: v, label: v}))} onChange={v => setFormData({...formData, typePrestation: v})} />
              <BulleInput label="Budget Estimé (FCFA)" type="number" value={formData.montant_prevu} onChange={e => setFormData({...formData, montant_prevu: Number(e.target.value)})} />
              <BulleInput label="Imputation Budgétaire" value={formData.imputation_budgetaire} onChange={e => setFormData({...formData, imputation_budgetaire: e.target.value})} />
           </div>

           {/* NOUVEAU CHAMP : SITUATION GLOBALE POUR L'IA */}
           <div className="pt-8 border-t border-white/10">
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-4`}>Contextualisation pour rapports (Agent IA)</h3>
              <BulleInput 
                textarea 
                label="Situation / Blocage pour Rapport" 
                icon={Activity}
                placeholder="Décrivez ici la situation globale, les points bloquants ou l'état d'avancement pour la rédaction automatique des rapports par l'IA..." 
                value={formData.comments?.['situation_globale'] || ''} 
                onChange={e => updateFormDataComment('situation_globale', e.target.value)} 
              />
           </div>

           <div className="pt-8 border-t border-white/10">
              <h3 className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-6`}>Calendrier Prévisionnel & Observations (PPM)</h3>
              <div className="grid grid-cols-1 gap-6">
                 {JALONS_PPM_CONFIG.map(jalon => (
                   <div key={jalon.key} className="flex flex-col md:flex-row items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                      <div className="w-full md:w-64">
                         <BulleInput 
                          type="date" 
                          label={jalon.label} 
                          value={formData.dates_prevues?.[jalon.key as keyof MarcheDates] || ''} 
                          onChange={e => updateFormDataDate(jalon.key, e.target.value)} 
                         />
                      </div>
                      <div className="flex-1 w-full">
                         <BulleInput 
                          label="Observation / Justification du jalon" 
                          icon={MessageSquare}
                          placeholder="Pourquoi ce jalon n'est pas encore réalisé ?" 
                          value={formData.comments?.[jalon.key] || ''} 
                          onChange={e => updateFormDataComment(jalon.key, e.target.value)} 
                         />
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <button 
             onClick={handleSubmit} 
             className={`${theme.buttonPrimary} w-full py-4 ${theme.buttonShape} font-black uppercase tracking-widest shadow-xl transition-all hover:scale-[1.01]`}
           >
             {editingMarket ? "Mettre à jour le registre" : "Enregistrer dans le PPM"}
           </button>
        </div>
      </Modal>
    </div>
  );
};