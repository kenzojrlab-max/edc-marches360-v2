import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ChevronLeft, Trash2, Plus, PencilLine, Search, Activity, ArrowUpRight,
  Save, X, FileText, CreditCard, FileCheck, Download, Layers, Upload, MousePointer2, MessageSquare
} from 'lucide-react';
import { BulleInput } from '../components/BulleInput';
import { Modal } from '../components/Modal';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { FileManager } from '../components/FileManager';
import { Marche, StatutGlobal, AOType, MarketType, MarcheDates, SourceFinancement, Projet } from '../types';
import { FONCTIONS, JALONS_PPM_KEYS, JALONS_LABELS, JALONS_PPM_CONFIG } from '../constants';
import { formatDate } from '../utils/date';
import { Table } from 'antd';
import type { TableColumnsType } from 'antd';
import { createStyles } from 'antd-style';

// --- STYLES DÉFINIS COMME HOOKS (SANS PARENTHÈSES À LA FIN) ---

const useLightTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #3b82f6 #FDFEFE; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #FDFEFE; } .ant-table-body::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; } }
    .ant-table-thead > tr > th { background: #FDFEFE !important; color: #1a2333 !important; border-bottom: 2px solid #e5e7eb !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #1a2333 !important; }
    .ant-table-tbody > tr > td { background: #FDFEFE !important; color: #1a2333 !important; border-bottom: 1px solid #e5e7eb !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #f3f4f6 !important; }
    .ant-table-thead .ant-table-cell-fix-left, .ant-table-thead .ant-table-cell-fix-right { background: #FDFEFE !important; z-index: 4 !important; }
    .ant-table-tbody .ant-table-cell-fix-left, .ant-table-tbody .ant-table-cell-fix-right { background: #FDFEFE !important; z-index: 2 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #f3f4f6 !important; }
  `,
}));

const useDarkTableStyles = createStyles(({ css }) => ({
  customTable: css`
    .ant-table { background: transparent !important; font-family: 'DM Sans', sans-serif !important; }
    .ant-table-container { .ant-table-body, .ant-table-content { scrollbar-width: thin; scrollbar-color: #3b82f6 #1a2333; } .ant-table-body::-webkit-scrollbar { width: 8px; height: 8px; } .ant-table-body::-webkit-scrollbar-track { background: #1a2333; } .ant-table-body::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 4px; } }
    .ant-table-thead > tr > th { background: #0f172a !important; color: #ffffff !important; border-bottom: 2px solid rgba(255,255,255,0.1) !important; font-family: 'Poppins', sans-serif !important; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 14px 12px !important; }
    .ant-table-thead > tr > th span, .ant-table-thead > tr > th div { color: #ffffff !important; }
    .ant-table-tbody > tr > td { background: #1e293b !important; color: #ffffff !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; font-family: 'DM Sans', sans-serif !important; padding: 16px 12px !important; font-size: 12px !important; }
    .ant-table-tbody > tr:hover > td { background: #334155 !important; }
    .ant-table-thead .ant-table-cell-fix-left, .ant-table-thead .ant-table-cell-fix-right { background: #0f172a !important; z-index: 4 !important; }
    .ant-table-tbody .ant-table-cell-fix-left, .ant-table-tbody .ant-table-cell-fix-right { background: #1e293b !important; z-index: 2 !important; }
    .ant-table-tbody > tr:hover > .ant-table-cell-fix-left, .ant-table-tbody > tr:hover > .ant-table-cell-fix-right { background: #334155 !important; }
  `,
}));

export const ProjectPlanManage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { theme, themeType } = useTheme();
  
  const { markets, updateMarket, addMarket, removeMarket } = useMarkets();
  const { projects, updateProject } = useProjects();
  
  const { user, can } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Marche | null>(null);

  const [formData, setFormData] = useState<Partial<Marche>>({
    numDossier: '', objet: '', activite: '', fonction: FONCTIONS[0],
    typeAO: AOType.AON, typePrestation: MarketType.TRAVAUX, montant_prevu: 0,
    imputation_budgetaire: '', source_financement: SourceFinancement.BUDGET_EDC, nom_bailleur: '',
    dates_prevues: {} as MarcheDates, comments: {}, docs: {}, has_additif: false
  });

  const project = projects.find(p => p.id === projectId);
  const projectMarkets = markets.filter(m => m.projet_id === projectId);

  const filteredMarkets = projectMarkets.filter(m =>
    (m.numDossier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.objet || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Détection du mode sombre pour les styles du tableau
  const isDarkTheme = theme.mode === 'dark';

  // --- APPEL CORRECT DES HOOKS DE STYLE ---
  const { styles: lightStyles } = useLightTableStyles();
  const { styles: darkStyles } = useDarkTableStyles();

  // Sélection du bon style selon le thème
  const styles = isDarkTheme ? darkStyles : lightStyles;

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
        source_financement: SourceFinancement.BUDGET_EDC,
        nom_bailleur: '',
        dates_prevues: {} as MarcheDates,
        comments: {},
        docs: {},
        has_additif: false
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    // 1. Validation explicite
    if (!formData.numDossier || !formData.objet) {
      alert("Erreur : Le Numéro de Dossier et l'Objet sont obligatoires.");
      return;
    }

    try {
      if (editingMarket) {
        await updateMarket(editingMarket.id, formData); // Ajout de await par sécurité (même si le contexte gère)
      } else {
        await addMarket({
          ...(formData as Marche),
          id: crypto.randomUUID(),
          projet_id: projectId!,
          source_financement: formData.source_financement || SourceFinancement.BUDGET_EDC,
          nom_bailleur: formData.source_financement === SourceFinancement.BAILLEUR ? formData.nom_bailleur : undefined,
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
      // Feedback visuel optionnel si besoin, mais la fermeture de la modale suffit généralement
    } catch (error) {
      console.error("Erreur lors de l'enregistrement", error);
      alert("Une erreur est survenue lors de l'enregistrement.");
    }
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

  // Configuration des colonnes pour Ant Design Table
  const tableColumns: TableColumnsType<Marche> = [
    {
      title: 'Dossier & Objet',
      dataIndex: 'numDossier',
      key: 'dossier',
      fixed: 'left',
      width: 350,
      render: (_, m) => (
        <div className="flex flex-col">
          <span className={`text-[10px] font-black ${theme.textAccent} uppercase`}>{m.numDossier}</span>
          <span className={`text-xs font-bold ${theme.textMain} uppercase leading-tight line-clamp-2`}>{m.objet}</span>
        </div>
      ),
    },
    {
      title: 'Budget Estimé',
      dataIndex: 'montant_prevu',
      key: 'budget',
      width: 180,
      align: 'right',
      render: (value) => (
        <span className={`text-sm font-black ${theme.textMain}`}>{(value || 0).toLocaleString()}</span>
      ),
    },
    {
      title: 'Fonction Analytique',
      dataIndex: 'fonction',
      key: 'fonction',
      width: 150,
      render: (value) => (
        <span className={`text-[10px] font-black ${theme.textMain} uppercase`}>
          {value || '-'}
        </span>
      ),
    },
    {
      title: 'Activité',
      dataIndex: 'activite',
      key: 'activite',
      width: 150,
      render: (value) => (
        <span className={`text-[10px] font-bold ${theme.textSecondary} uppercase line-clamp-2`}>
          {value || '-'}
        </span>
      ),
    },
    {
      title: 'Financement',
      dataIndex: 'source_financement',
      key: 'financement',
      width: 150,
      render: (_: any, m: Marche) => {
        const label = m.source_financement === 'BUDGET_EDC'
          ? 'Budget EDC'
          : m.nom_bailleur || 'Bailleur';
        return (
          <span className={`text-[9px] font-black px-2 py-1 rounded ${m.source_financement === 'BUDGET_EDC' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'}`}>
            {label}
          </span>
        );
      },
    },
    // Colonnes des jalons (groupées avec Prévue/Réalisée)
    ...JALONS_PPM_CONFIG.map(jalon => ({
      title: jalon.label,
      key: jalon.key,
      children: [
        {
          title: 'Prévue',
          dataIndex: ['dates_prevues', jalon.key],
          key: `${jalon.key}_prevue`,
          width: 100,
          align: 'center' as const,
          render: (_: any, m: Marche) => (
            <span className={`text-[10px] font-black ${theme.textAccent}`}>
              {formatDate(m.dates_prevues[jalon.key as keyof typeof m.dates_prevues] || null)}
            </span>
          ),
        },
        {
          title: 'Réalisée',
          dataIndex: ['dates_realisees', jalon.key],
          key: `${jalon.key}_realisee`,
          width: 100,
          align: 'center' as const,
          render: (_: any, m: Marche) => (
            <span className={`text-[10px] font-black ${theme.textSecondary}`}>
              {formatDate(m.dates_realisees[jalon.key as keyof typeof m.dates_realisees] || null)}
            </span>
          ),
        },
      ],
    })),
    // Colonne Actions
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      align: 'center',
      render: (_: any, m: Marche) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => openModal(m)} className={`p-2.5 ${theme.buttonSecondary} ${theme.buttonShape} transition-all`}>
            <PencilLine size={16} />
          </button>
          <button onClick={() => removeMarket(m.id)} className={`p-2.5 ${theme.buttonDanger} ${theme.buttonShape} transition-all`}>
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  // Données du tableau avec key pour Ant Design
  const tableData = filteredMarkets.map(m => ({ ...m, key: m.id }));

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40 relative">
      {/* HEADER */}
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

      {/* Barre de Recherche */}
      <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 relative`}>
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
        <Table<Marche>
          className={styles.customTable}
          columns={tableColumns}
          dataSource={tableData}
          scroll={{ x: 'max-content', y: 55 * 10 }}
          pagination={false}
          bordered={false}
          size="middle"
          rowClassName="hover:bg-white/5 transition-all"
          locale={{ emptyText: <div className="p-20 text-center text-slate-400 font-black uppercase italic">Aucun marché trouvé</div> }}
        />
      </div>

      {/* MODAL D'ÉDITION */}
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
              <CustomBulleSelect
                label="Source de Financement"
                value={formData.source_financement || ''}
                options={[
                  { value: SourceFinancement.BUDGET_EDC, label: 'Budget EDC' },
                  { value: SourceFinancement.BAILLEUR, label: 'Financement Extérieur (Bailleur)' }
                ]}
                onChange={v => setFormData({...formData, source_financement: v as SourceFinancement, nom_bailleur: v === SourceFinancement.BUDGET_EDC ? '' : formData.nom_bailleur})}
              />
              {formData.source_financement === SourceFinancement.BAILLEUR && (
                <BulleInput
                  label="Nom du Bailleur"
                  value={formData.nom_bailleur || ''}
                  onChange={e => setFormData({...formData, nom_bailleur: e.target.value})}
                  placeholder="Ex: Banque Mondiale, BAD, IDA..."
                  required
                />
              )}
           </div>

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