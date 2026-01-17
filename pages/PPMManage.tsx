import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useLogs } from '../contexts/LogsContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BulleInput } from '../components/BulleInput';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { Modal } from '../components/Modal';
import { FONCTIONS, JALONS_PPM_KEYS, JALONS_LABELS } from '../constants';
import { AOType, MarketType, Marche, StatutGlobal, SourceFinancement, Projet } from '../types';
import { ChevronLeft, FileSpreadsheet, Plus, Download, Upload, MousePointer2, Search, Layers, Trash2 } from 'lucide-react';
import { generateUUID } from '../utils/uid';
import * as XLSX from 'xlsx';

export const PPMManage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuth();
  const { theme, themeType } = useTheme();
  
  const { addMarkets, removeMarketsByProjectId } = useMarkets();
  
  const { projects, addProject, removeProject } = useProjects();
  const { addLog } = useLogs();
  
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importProjectId, setImportProjectId] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString())));
    return (years as string[]).sort((a, b) => b.localeCompare(a));
  }, [projects]);

  const yearOptions = [
    { value: '', label: 'Tous les exercices' },
    ...availableYears.map(y => ({ value: y, label: y }))
  ];

  const [newProject, setNewProject] = useState<Partial<Projet>>({
    libelle: '',
    sourceFinancement: SourceFinancement.BUDGET_EDC,
    nomBailleur: '',
    exercice: new Date().getFullYear()
  });

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchSearch = p.libelle.toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = !selectedYear || p.exercice.toString() === selectedYear;
      return matchSearch && matchYear;
    });
  }, [projects, searchTerm, selectedYear]);

  const downloadTemplate = () => {
    const selectedProject = projects.find(p => p.id === importProjectId);
    if (!selectedProject) {
      alert("Veuillez d'abord sélectionner un projet de destination.");
      return;
    }

    const EXCEL_COLUMNS = [
      "N°Dossier", "Objet Marché", "Fonction Analytique", "Activité", "Type AO", "Prestation", "Budget estimé FCFA", "Source de financement", "Imputation budgétaire",
      ...JALONS_PPM_KEYS.map(key => JALONS_LABELS[key] || key)
    ];
    
    const ws = XLSX.utils.aoa_to_sheet([EXCEL_COLUMNS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PPM");
    const fileName = `Template_PPM_${selectedProject.libelle.replace(/[^a-z0-9]/gi, '_')}_${selectedProject.exercice}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const excelDateToISO = (serial: any) => {
    if (!serial) return "";
    if (serial instanceof Date) return serial.toISOString().split('T')[0];
    if (typeof serial === 'string') return serial;
    try {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? "" : date.toISOString().split('T')[0];
    } catch (e) { return ""; }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!importProjectId) {
      alert("Veuillez d'abord sélectionner un projet dans la liste déroulante ci-dessus.");
      e.target.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        
        const dataRows = rows.slice(1).filter(r => r.some(cell => cell !== null && cell !== ''));
        const project = projects.find(p => p.id === importProjectId);
        const baseTime = new Date().getTime(); // Temps de base pour l'ordre

        // CORRECTION ICI : Ajout de l'index 'i' pour garantir l'ordre chronologique
        const newMarkets: Marche[] = dataRows.map((row, i) => {
          const dates_prevues: any = {};
          JALONS_PPM_KEYS.forEach((key, k) => {
            dates_prevues[key] = excelDateToISO(row[9 + k]);
          });

          return {
            id: generateUUID(),
            projet_id: importProjectId,
            numDossier: String(row[0] || "N/A").trim(),
            objet: String(row[1] || "Sans Objet").trim(),
            fonction: String(row[2] || FONCTIONS[0]).trim(),
            activite: String(row[3] || "").trim(),
            typeAO: (row[4] as AOType) || AOType.AON,
            typePrestation: (row[5] as MarketType) || MarketType.TRAVAUX,
            montant_prevu: parseFloat(String(row[6] || "0").replace(/\s/g, '').replace(',', '.')) || 0,
            imputation_budgetaire: String(row[8] || "").trim(),
            source_financement: project?.sourceFinancement || SourceFinancement.BUDGET_EDC,
            dates_prevues: dates_prevues,
            dates_realisees: {},
            comments: {},
            docs: {},
            statut_global: StatutGlobal.PLANIFIE,
            is_infructueux: false,
            is_annule: false,
            has_additif: false,
            has_recours: false,
            execution: { decomptes: [], avenants: [], has_avenant: false, is_resilie: false, resiliation_step: 0 },
            created_by: user?.id || 'system',
            // DATE CRÉATION INCRÉMENTALE : Garantit que row 1 est plus vieux que row 2
            date_creation: new Date(baseTime + (i * 10)).toISOString() 
          };
        });

        if (newMarkets.length > 0) {
           await addMarkets(newMarkets);
           setIsImporting(false);
           setShowImportModal(false);
           alert(`${newMarkets.length} marchés importés avec succès.`);
        } else {
           alert("Aucune donnée valide trouvée dans le fichier.");
           setIsImporting(false);
        }

      } catch (error) {
        console.error(error);
        alert("Erreur critique lors de l'importation. Vérifiez le format du fichier.");
        setIsImporting(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCreateProject = () => {
    if (!newProject.libelle) return;
    addProject({
      id: generateUUID(),
      libelle: newProject.libelle!,
      sourceFinancement: newProject.sourceFinancement!,
      nomBailleur: newProject.nomBailleur,
      exercice: newProject.exercice!,
      created_at: new Date().toISOString()
    });
    setShowProjectModal(false);
    setNewProject({ libelle: '', sourceFinancement: SourceFinancement.BUDGET_EDC, nomBailleur: '', exercice: new Date().getFullYear() });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-500 pb-40 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate(-1)} className={`p-4 ${theme.card} ${theme.buttonShape} hover:scale-105 transition-all text-slate-400`}><ChevronLeft size={20} /></button>
          <div>
            <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Gestion des Plans</h1>
            <p className={`${theme.textSecondary} font-medium text-sm italic`}>Administration des projets et importation PPM.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowProjectModal(true)} className={`${theme.buttonSecondary} px-6 py-3 ${theme.buttonShape} text-sm font-black flex items-center gap-3 transition-all`}><Plus size={18} /> Créer Projet</button>
          <button onClick={() => setShowImportModal(true)} className={`bg-success/10 text-success border border-success/20 px-6 py-3 ${theme.buttonShape} text-sm font-black hover:bg-success/20 transition-all flex items-center gap-3`}><FileSpreadsheet size={18} /> Import Excel</button>
        </div>
      </div>

      <div className={`${theme.card} p-4 flex flex-col md:flex-row items-center gap-6 relative z-[100]`}>
        <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden lg:flex`}>
          <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          <span className="text-[10px] font-black uppercase tracking-widest">Filtres</span>
        </div>
        <div className="w-full md:w-48">
          <CustomBulleSelect label="" value={selectedYear} options={yearOptions} onChange={setSelectedYear} placeholder="Exercice" />
        </div>
        <div className="relative flex-1 w-full">
          <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : 'text-slate-400'}`} size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un projet..." 
            className={`${theme.input} pl-12 pr-6 py-2.5 w-full font-black ${themeType === 'glass' ? 'text-white placeholder:text-white/40' : ''}`} 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {filteredProjects.map(p => (
          <div key={p.id} onDoubleClick={() => navigate(`/ppm-manage/${p.id}`)} className={`${theme.card} p-10 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-2 flex flex-col h-full group`}>
             <div className="flex items-center justify-between mb-6">
               <div className={`w-16 h-16 ${themeType === 'glass' ? 'bg-white/10 text-white' : 'bg-blue-edc-50 text-blue-edc-500'} ${theme.buttonShape} flex items-center justify-center font-black text-xl`}>{p.libelle.charAt(0)}</div>
               <span className={`px-4 py-1 ${themeType === 'glass' ? 'bg-white/5 text-white/50' : 'bg-slate-50 text-slate-400'} rounded-full text-[9px] font-black uppercase tracking-widest`}>{p.exercice}</span>
             </div>
             <div className="flex-1">
               <h3 className={`text-xl font-black ${theme.textMain} uppercase leading-tight mb-2 group-hover:text-primary transition-colors`}>{p.libelle}</h3>
               <p className={`text-[10px] font-black ${theme.textAccent} uppercase bg-primary/5 px-3 py-1 rounded-lg w-fit`}>Source : {p.nomBailleur || p.sourceFinancement}</p>
             </div>
             <div className="pt-6 border-t border-white/10 flex items-center justify-between mt-auto">
                <div className={`flex items-center gap-1 text-[8px] font-black ${theme.textSecondary} uppercase`}><MousePointer2 size={10} /> Double-clic : Gérer</div>
                
                <div className="flex items-center gap-3">
                   {isSuperAdmin && (
                     <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         if (window.confirm("Êtes-vous sûr de vouloir supprimer ce projet ? Cette action est irréversible.")) {
                           removeMarketsByProjectId(p.id);
                           removeProject(p.id);
                         }
                       }} 
                       className={`p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-lg transition-colors`}
                       title="Supprimer le projet"
                     >
                       <Trash2 size={16} />
                     </button>
                   )}
                   <button onClick={(e) => {e.stopPropagation(); navigate(`/ppm-view?projectId=${p.id}`)}} className={`text-[10px] font-black uppercase ${theme.textSecondary} hover:${theme.textAccent} transition-colors`}>Voir Suivi</button>
                </div>
             </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="Nouveau Projet">
         <div className="space-y-6">
            <BulleInput label="Libellé du Projet" value={newProject.libelle} onChange={e => setNewProject({...newProject, libelle: e.target.value})} />
            <CustomBulleSelect label="Source de Financement" value={newProject.sourceFinancement || ''} options={Object.values(SourceFinancement).map(v => ({ value: v, label: v }))} onChange={v => setNewProject({...newProject, sourceFinancement: v as SourceFinancement})} />
            {newProject.sourceFinancement === SourceFinancement.BAILLEUR && (
              <BulleInput label="Nom du Bailleur" value={newProject.nomBailleur || ''} onChange={e => setNewProject({...newProject, nomBailleur: e.target.value})} />
            )}
            <BulleInput label="Exercice" type="number" value={newProject.exercice} onChange={e => setNewProject({...newProject, exercice: Number(e.target.value)})} />
            <button onClick={handleCreateProject} className={`${theme.buttonPrimary} w-full py-4 ${theme.buttonShape} font-black uppercase tracking-widest`}>Enregistrer</button>
         </div>
      </Modal>

      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Importation Excel">
         <div className="space-y-6">
            <CustomBulleSelect label="Projet cible" options={projects.map(p => ({ value: p.id, label: p.libelle }))} value={importProjectId} onChange={setImportProjectId} />
            <div 
              onClick={() => { if(!importProjectId) alert("Veuillez sélectionner un projet cible avant de cliquer ici."); }}
              className={`p-10 border-4 border-dashed ${themeType === 'glass' ? 'border-white/10' : 'border-slate-100'} ${theme.buttonShape} text-center space-y-4 hover:border-accent transition-all cursor-pointer relative`}
            >
               <input 
                 type="file" 
                 className="absolute inset-0 opacity-0 cursor-pointer" 
                 accept=".xlsx" 
                 onChange={handleFileUpload} 
                 disabled={isImporting}
               />
               <Upload className="mx-auto text-slate-300" size={32} />
               <p className={`text-xs font-black uppercase ${theme.textSecondary}`}>
                 {isImporting ? "Chargement en cours..." : (importProjectId ? "Cliquez pour choisir un fichier" : "Sélectionnez un projet d'abord")}
               </p>
            </div>
            <button onClick={downloadTemplate} className={`w-full flex items-center justify-center gap-3 p-4 ${theme.buttonSecondary} ${theme.buttonShape} font-black uppercase tracking-widest text-[10px]`}>
               <Download size={18}/> Télécharger le template
            </button>
         </div>
      </Modal>
    </div>
  );
};