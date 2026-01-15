import React, { useRef } from 'react';
import { FileText, Download, Play, AlertTriangle, FileCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { CustomBulleSelect } from '../CustomBulleSelect';
import { Projet, Marche } from '../../types';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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

  const handleExportPDF = () => {
    if (!reportRef.current) return;
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* Configuration */}
      <div className={`p-6 border-b border-white/5 space-y-4 shrink-0 ${theme.card}`}>
        <h3 className={`text-xs font-black uppercase tracking-widest ${theme.textMain} flex items-center gap-2`}>
          <FileText size={16} className="text-accent"/> Configuration du Rapport
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          <CustomBulleSelect 
            label="Type de Rapport" 
            value={config.type} 
            options={typeOptions} 
            onChange={(v) => setConfig({...config, type: v as any})} 
          />
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        <button 
          onClick={onGenerate}
          disabled={isGenerating}
          className={`w-full py-3 ${theme.buttonPrimary} ${theme.buttonShape} flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-lg`}
        >
          {isGenerating ? (
            <>Génération en cours...</>
          ) : (
            <><Play size={16} fill="currentColor" /> Générer le document</>
          )}
        </button>
      </div>

      {/* Prévisualisation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50/5 relative">
        {generatedReport ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-success">
                <FileCheck size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest">Rapport prêt</span>
              </div>
              <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-[10px] font-bold hover:bg-red-700 transition-colors">
                <Download size={14} /> Export PDF
              </button>
            </div>

            <div ref={reportRef} className="bg-white text-slate-800 p-8 rounded-none shadow-xl min-h-[297mm] text-sm leading-relaxed prose max-w-none">
              {/* En-tête PDF simulé */}
              <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
                <div>
                  <h1 className="text-2xl font-bold uppercase text-slate-900 mb-1">Rapport de Synthèse</h1>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">EDC Marchés360 • IA Generated</p>
                </div>
                <p className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString()}</p>
              </div>
              
              {/* Contenu Markdown brut rendu (simplifié pour l'exemple, idéalement utiliser react-markdown) */}
              <div className="whitespace-pre-wrap font-serif">
                {generatedReport}
              </div>

              {/* Pied de page PDF */}
              <div className="mt-10 pt-4 border-t border-slate-200 text-center">
                <p className="text-[10px] text-slate-400 italic">Document généré automatiquement par l'Assistant IA EDC. Vérification humaine requise.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-40 text-center p-10">
            <FileText size={48} className="mb-4 text-slate-400" />
            <p className={`text-xs font-bold ${theme.textMain} uppercase`}>Aucun rapport généré</p>
            <p className={`text-[10px] ${theme.textSecondary} mt-2`}>Configurez les paramètres ci-dessus et lancez la génération.</p>
          </div>
        )}
      </div>
    </div>
  );
};