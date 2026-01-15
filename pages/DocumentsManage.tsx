import React, { useState } from 'react';
import { useLibrary } from '../contexts/LibraryContext'; // NOUVEAU CONTEXTE
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { BulleInput } from '../components/BulleInput';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { Modal } from '../components/Modal';
import { ChevronLeft, Plus, Upload, Trash2, Library } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LibraryDocument } from '../types';

const CATEGORIES = ["Rapports d'Audits", "Gestion & Performance", "Réglementation & Manuels", "Modèles & Lettres Types"];

export const DocumentsManage: React.FC = () => {
  const navigate = useNavigate();
  
  // CORRECTION : Utilisation du contexte dédié Library
  const { addLibraryDoc, libraryDocs, removeLibraryDoc } = useLibrary();
  
  const { user } = useAuth();
  const { theme, themeType } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({ titre: '', categorie: '', description: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !formData.titre || !formData.categorie) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newDoc: LibraryDocument = {
        id: `DOC-${Date.now()}`,
        titre: formData.titre,
        categorie: formData.categorie,
        description: formData.description,
        format: file.name.split('.').pop()?.toUpperCase() || 'FILE',
        url: base64,
        taille: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        date_upload: new Date().toISOString().split('T')[0],
        auteur: user?.name || 'Inconnu',
        uploaded_by: user?.id || ''
      };
      addLibraryDoc(newDoc);
      setShowModal(false);
      setFile(null);
      setFormData({ titre: '', categorie: '', description: '' });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-right-4 duration-500 pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-5">
          <button onClick={() => navigate('/documents')} className={`p-4 ${theme.card} ${theme.buttonShape} hover:scale-105 transition-all text-slate-400`}><ChevronLeft size={20} /></button>
          <div>
            <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Gestion documentaire</h1>
            <p className={`${theme.textSecondary} font-medium`}>Administration des ressources partagées.</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className={`${theme.buttonPrimary} px-10 py-4 ${theme.buttonShape} text-sm font-black shadow-2xl transition-all flex items-center gap-3`}
        >
          <Plus size={20} /> Nouveau Document
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 px-2">
         <div className="lg:col-span-1 space-y-6">
            <div className={`${theme.card} p-10 space-y-6`}>
               <div className={`w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center ${theme.textAccent}`}>
                  <Library size={32} />
               </div>
               <div>
                  <h3 className={`font-black ${theme.textMain} uppercase text-xs tracking-widest`}>Statistiques</h3>
                  <p className={`text-3xl font-black ${theme.textAccent} mt-2`}>{libraryDocs.length}</p>
                  <p className={`text-[10px] font-bold ${theme.textSecondary} mt-1 uppercase`}>Documents indexés</p>
               </div>
            </div>
         </div>

         <div className="lg:col-span-3">
            <div className={`${theme.card} overflow-hidden shadow-sm`}>
               <table className="w-full text-left">
                  <thead>
                     <tr className={`bg-black/5 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest border-b border-white/5`}>
                        <th className="p-8">Titre / Catégorie</th>
                        <th className="p-8">Date</th>
                        <th className="p-8">Format</th>
                        <th className="p-8 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {libraryDocs.length > 0 ? libraryDocs.map(doc => (
                       <tr key={doc.id} className="hover:bg-white/5 transition-all">
                          <td className="p-8">
                             <p className={`text-sm font-black ${theme.textMain} uppercase tracking-tight`}>{doc.titre}</p>
                             <p className={`text-[10px] font-bold ${theme.textSecondary} uppercase mt-1`}>{doc.categorie}</p>
                          </td>
                          <td className={`p-8 text-xs font-bold ${theme.textSecondary}`}>{doc.date_upload}</td>
                          <td className="p-8">
                             <span className={`px-3 py-1 bg-black/10 ${theme.textSecondary} rounded-lg text-[10px] font-black uppercase tracking-widest`}>.{doc.format}</span>
                          </td>
                          <td className="p-8 text-right">
                             <button 
                               onClick={() => removeLibraryDoc(doc.id)}
                               className={`p-3 text-slate-400 hover:text-danger hover:bg-danger/10 ${theme.buttonShape} transition-all`}
                             >
                                <Trash2 size={20} />
                             </button>
                          </td>
                       </tr>
                     )) : (
                       <tr><td colSpan={4} className="p-20 text-center font-black text-slate-300 uppercase italic">Aucun document indexé</td></tr>
                     )}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Ajouter un Document" size="md">
         <form onSubmit={handleSubmit} className="space-y-6">
            <BulleInput 
              label="Titre du Document" 
              placeholder="Ex: Manuel de procédure v2" 
              value={formData.titre}
              onChange={e => setFormData({...formData, titre: e.target.value})}
              required
            />
            <CustomBulleSelect 
              label="Catégorie"
              value={formData.categorie}
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              onChange={v => setFormData({...formData, categorie: v})}
            />
            <BulleInput 
              textarea 
              label="Description (Optionnel)" 
              placeholder="Détail du contenu..." 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
            
            <div className={`p-10 border-4 border-dashed border-white/10 ${theme.buttonShape} text-center space-y-4 hover:border-accent transition-all cursor-pointer group relative`}>
               <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required />
               <Upload className={`mx-auto text-slate-300 group-hover:${theme.textAccent} transition-all`} size={32} />
               <div>
                  <p className={`text-sm font-black ${theme.textMain}`}>{file ? file.name : "Glissez votre fichier ici"}</p>
                  <p className={`text-[10px] font-bold ${theme.textSecondary} uppercase mt-1`}>PDF, Excel, Word (Max 50MB)</p>
               </div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
               <button type="button" onClick={() => setShowModal(false)} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase ${theme.textSecondary}`}>Annuler</button>
               <button type="submit" className={`${theme.buttonPrimary} px-10 py-3 ${theme.buttonShape} text-xs font-black uppercase shadow-lg shadow-primary/20`}>Publier</button>
            </div>
         </form>
      </Modal>
    </div>
  );
};