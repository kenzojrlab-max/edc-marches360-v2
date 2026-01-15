import React, { useState } from 'react';
import { useLibrary } from '../contexts/LibraryContext'; // NOUVEAU CONTEXTE
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Search, 
  FileCode, 
  FileSpreadsheet, 
  FileText, 
  Presentation, 
  File, 
  Download, 
  Lock, 
  Plus, 
  Filter,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = ["Tous les documents", "Rapports d'Audits", "Gestion & Performance", "Réglementation & Manuels", "Modèles & Lettres Types"];

export const Documents: React.FC = () => {
  // CORRECTION : Utilisation du contexte dédié Library
  const { libraryDocs, removeLibraryDoc } = useLibrary();
  
  const { isAdmin, can } = useAuth();
  const { theme, themeType } = useTheme();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('Tous les documents');

  const getFileIcon = (format: string) => {
    const ext = format.toUpperCase();
    if (ext.includes('PDF')) return { icon: FileCode, color: 'text-red-500', bg: 'bg-red-500/10' };
    if (ext.includes('XLS') || ext.includes('SHEET')) return { icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (ext.includes('DOC') || ext.includes('WORD')) return { icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    if (ext.includes('PPT') || ext.includes('POWER')) return { icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-500/10' };
    return { icon: File, color: theme.textSecondary, bg: 'bg-white/5' };
  };

  const filtered = libraryDocs.filter(d => {
    const matchesSearch = d.titre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          d.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCat === 'Tous les documents' || d.categorie === selectedCat;
    return matchesSearch && matchesCat;
  });

  const handleDownload = (doc: any) => {
    if (!can('DOWNLOAD')) return;
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.titre + '.' + doc.format.toLowerCase();
    link.click();
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Documentation</h1>
          <p className={`${theme.textSecondary} font-medium text-sm italic`}>Consultez et téléchargez les ressources officielles d'EDC S.A.</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative w-full md:w-80">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : 'text-slate-400'}`} size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..."
                className={`${theme.input} pl-12 pr-6 py-3 w-full shadow-sm font-black ${themeType === 'glass' ? 'text-white placeholder:text-white/40' : ''}`}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           {isAdmin && (
             <button 
              onClick={() => navigate('/documents-manage')}
              className={`${theme.buttonSecondary} ${theme.buttonShape} px-8 py-3 text-sm font-black flex items-center gap-3 transition-all`}
             >
               Gestion
             </button>
           )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 px-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-6 py-2.5 ${theme.buttonShape} text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedCat === cat ? theme.buttonPrimary : `${theme.card} ${theme.textSecondary} border-white/10 hover:border-primary`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
        {filtered.length > 0 ? filtered.map(doc => {
          const { icon: Icon, color, bg } = getFileIcon(doc.format);
          return (
            <div key={doc.id} className={`${theme.card} p-8 flex flex-col hover:shadow-2xl transition-all duration-500 group relative overflow-hidden`}>
               <div className="flex items-center justify-between mb-6">
                  <div className={`w-14 h-14 rounded-2xl ${bg} ${color} flex items-center justify-center shadow-inner`}>
                    <Icon size={24} strokeWidth={theme.iconStroke} />
                  </div>
                  <span className={`px-3 py-1 bg-black/5 ${theme.textSecondary} rounded-xl text-[9px] font-black uppercase tracking-widest`}>.{doc.format}</span>
               </div>
               
               <div className="flex-1 space-y-3">
                  <h3 className={`text-lg font-black ${theme.textMain} uppercase leading-tight line-clamp-2`}>{doc.titre}</h3>
                  <p className={`text-xs font-medium ${theme.textSecondary} line-clamp-3 leading-relaxed`}>
                    {doc.description || "Aucune description fournie pour ce document."}
                  </p>
               </div>

               <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className={`text-[9px] font-black ${theme.textSecondary} uppercase tracking-widest`}>{doc.date_upload}</p>
                    <p className={`text-[10px] font-bold ${theme.textSecondary}`}>{doc.taille} • {doc.auteur}</p>
                  </div>
                  <button 
                    onClick={() => handleDownload(doc)}
                    disabled={!can('DOWNLOAD')}
                    className={`p-3 ${theme.buttonShape} transition-all ${
                      can('DOWNLOAD') 
                      ? `${theme.buttonPrimary} hover:scale-110` 
                      : 'bg-black/5 text-slate-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {can('DOWNLOAD') ? <Download size={20} /> : <Lock size={20} />}
                  </button>
               </div>
            </div>
          );
        }) : (
          <div className={`col-span-full py-32 flex flex-col items-center gap-6 ${theme.card} border-dashed`}>
             <div className="w-20 h-20 bg-black/5 rounded-full flex items-center justify-center text-slate-200">
                <File size={40} />
             </div>
             <p className={`${theme.textSecondary} font-black uppercase tracking-widest`}>Aucun document disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};