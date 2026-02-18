import React, { useRef, useState, useEffect } from 'react';
import { FileText, Download, Play, AlertTriangle, FileCheck, ChevronDown, ChevronUp, Settings2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { CustomBulleSelect } from '../CustomBulleSelect';
import { Projet, Marche } from '../../types';

interface ReportConfig {
  projectId: string;
  year: string;
  type: 'general' | 'execution' | 'alertes';
}

interface AIReportViewProps {
  config: ReportConfig;
  setConfig: React.Dispatch<React.SetStateAction<ReportConfig>>;
  isGenerating: boolean;
  generatedReport: string;
  onGenerate: () => void;
  projects: Projet[];
  markets: Marche[];
}

export const AIReportView: React.FC<AIReportViewProps> = ({ 
  config, setConfig, isGenerating, generatedReport, onGenerate, projects, markets 
}) => {
  const { theme } = useTheme();
  const reportRef = useRef<HTMLDivElement>(null);
  
  // État pour gérer l'ouverture/fermeture du menu de configuration
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Auto-fermeture du menu quand un rapport est généré
  useEffect(() => {
    if (generatedReport) {
      setIsConfigOpen(false);
    }
  }, [generatedReport]);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    // @ts-ignore
    const html2pdf = (await import('html2pdf.js')).default;
    const element = reportRef.current;
    const opt = {
      margin: 10,
      filename: `Rapport_IA_${config.type}_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const projectOptions = [{ value: 'all', label: 'Tous les projets' }, ...projects.map(p => ({ value: p.id, label: p.libelle }))];
  const yearOptions = [{ value: 'all', label: 'Toutes années' }, ...Array.from(new Set(projects.map(p => p.exercice.toString()))).map(y => ({ value: y, label: y }))];
  const typeOptions = [
    { value: 'general', label: 'Synthèse Générale' },
    { value: 'execution', label: 'Suivi Exécution' },
    { value: 'alertes', label: 'Rapport des Risques' }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      
      {/* HEADER DE CONFIGURATION (Toujours visible, mais contenu repliable) */}
      <div className={`shrink-0 border-b border-white/5 ${theme.card} transition-all duration-300`}>
        {/* Barre de titre cliquable pour replier/déplier */}
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="w-full flex items-center justify-between p-3 bg-black/5 hover:bg-black/10 transition-colors"
        >
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent">
            <Settings2 size={14} />
            Configuration Rapport
          </div>
          {isConfigOpen ? <ChevronUp size={14} className={theme.textSecondary} /> : <ChevronDown size={14} className={theme.textSecondary} />}
        </button>

        {/* Formulaire (Visible uniquement si isConfigOpen est vrai) */}
        {isConfigOpen && (
          <div className="p-4 space-y-3 animate-in slide-in-from-top-2">
            <CustomBulleSelect 
              label="Type de Rapport" 
              value={config.type} 
              options={typeOptions} 
              onChange={(v) => setConfig({...config, type: v as any})} 
            />
            <div className="grid grid-cols-2 gap-3">
              <CustomBulleSelect 
                label="Projet Cible" 
                value={config.projectId} 
                options={projectOptions} 
                onChange={(v) => setConfig({...config, projectId: v})} 
              />
              <CustomBulleSelect 
                label="Exercice" 
                value={config.year} 
                options={yearOptions} 
                onChange={(v) => setConfig({...config, year: v})} 
              />
            </div>

            <button 
              onClick={onGenerate}
              disabled={isGenerating}
              className={`w-full py-2.5 mt-2 ${theme.buttonPrimary} ${theme.buttonShape} flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg`}
            >
              {isGenerating ? (
                <>Génération...</>
              ) : (
                <><Play size={12} fill="currentColor" /> Générer le document</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ZONE DE PRÉVISUALISATION DU RAPPORT (Prend tout l'espace restant) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-50/5 relative">
        {generatedReport ? (
          <div className="space-y-4">
            {/* Barre d'outils du rapport */}
            <div className="flex items-center justify-between sticky top-0 bg-slate-900/90 backdrop-blur-sm p-2 rounded-xl border border-white/10 z-10 shadow-lg">
              <div className="flex items-center gap-2 text-success">
                <FileCheck size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest">Prêt</span>
              </div>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-[9px] font-bold hover:bg-red-700 transition-colors shadow-md">
                <Download size={12} /> PDF
              </button>
            </div>

            {/* Contenu du rapport (Format Page A4 simulé) */}
            <div ref={reportRef} className="bg-white text-slate-800 p-6 rounded-sm shadow-xl min-h-[200mm] text-xs leading-relaxed">
              <div className="border-b-2 border-slate-800 pb-3 mb-4 flex justify-between items-end">
                <div>
                  <h1 className="text-xl font-bold uppercase text-slate-900 mb-1">Rapport de Synthèse</h1>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest">EDC Marchés360 • IA Generated</p>
                </div>
                <p className="text-[9px] font-bold text-slate-400">{new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="whitespace-pre-wrap font-serif text-justify">
                {generatedReport}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                <p className="text-[8px] text-slate-400 italic">Généré par Zen'ô Assistant.</p>
              </div>
            </div>
          </div>
        ) : (
          /* État vide */
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-6">
            <FileText size={40} className="mb-3 text-slate-400" />
            <p className={`text-[10px] font-bold ${theme.textMain} uppercase`}>En attente de génération</p>
            <p className={`text-[9px] ${theme.textSecondary} mt-1 max-w-[200px]`}>
              Configurez les paramètres ci-dessus et cliquez sur "Générer".
            </p>
          </div>
        )}
      </div>
    </div>
  );
};