import React, { useState, useEffect } from 'react';
import { Upload, File, Lock, RefreshCcw, Trash2 } from 'lucide-react';
import { PieceJointe } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onUpload: (docId: string) => void;
  existingDocId?: string;
  disabled?: boolean;
}

export const FileManager: React.FC<Props> = ({ onUpload, existingDocId, disabled }) => {
  const { can } = useAuth();
  const [doc, setDoc] = useState<PieceJointe | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les infos du document si un ID existe déjà
  useEffect(() => {
    let isMounted = true;
    if (existingDocId) {
      storage.getDocById(existingDocId).then(data => {
        if (isMounted && data) setDoc(data);
      });
    } else {
      setDoc(null);
    }
    return () => { isMounted = false; };
  }, [existingDocId]);

  // Gérer l'upload vers Firebase
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Vérification des droits
    if (!can('WRITE') || disabled) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation simple de taille (ex: max 25 Mo)
    if (file.size > 25 * 1024 * 1024) {
      alert("Fichier trop volumineux (Max 25 Mo)");
      return;
    }

    setLoading(true);
    try {
      // --- CORRECTION ---
      // On envoie directement le fichier à la nouvelle fonction Firebase
      // Plus besoin de FileReader ni de Base64
      const newDoc = await storage.uploadFile(file);
      
      // Mise à jour de l'état local
      setDoc(newDoc);
      
      // Renvoi de l'ID au composant parent (le marché)
      onUpload(newDoc.id);
      
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'envoi. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  // Téléchargement via l'URL Firebase
  const download = () => {
    if (!doc || !can('DOWNLOAD')) return;
    // Ouvre le lien Firebase (https://...) dans un nouvel onglet
    window.open(doc.url, '_blank');
  };

  // Suppression du fichier
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doc || !can('WRITE') || disabled) return;

    if (window.confirm("Voulez-vous vraiment supprimer ce fichier ?")) {
      setLoading(true);
      try {
        await storage.deleteDoc(doc.id, doc.url);
        setDoc(null);
        onUpload(""); // On vide l'ID dans le parent
      } catch (error) {
        console.error("Erreur suppression", error);
        alert("Impossible de supprimer le fichier.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading) return <RefreshCcw className="animate-spin text-accent" size={16} />;

  return (
    <div className="flex items-center gap-2 max-w-full">
      {doc ? (
        <div className="flex items-center gap-2">
          <button
            onClick={download}
            disabled={!can('DOWNLOAD')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors max-w-full overflow-hidden ${
              can('DOWNLOAD') 
                ? 'bg-success/10 text-success hover:bg-success/20' 
                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            title={can('DOWNLOAD') ? doc.nom : 'Téléchargement restreint'}
          >
            <div className="shrink-0">
              {can('DOWNLOAD') ? <File size={14} /> : <Lock size={14} />}
            </div>
            <span className="max-w-[80px] md:max-w-[120px] truncate">{doc.nom}</span>
          </button>
          
          {can('WRITE') && !disabled && (
             <button 
               onClick={handleDelete}
               className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
               title="Supprimer le fichier"
             >
               <Trash2 size={14} />
             </button>
          )}
        </div>
      ) : (
        <label className={`flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-xl text-xs font-medium cursor-pointer hover:bg-accent/20 transition-colors shrink-0 ${disabled || !can('WRITE') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
          <Upload size={14} />
          <span>Ajouter</span>
          <input type="file" className="hidden" onChange={handleFile} disabled={disabled || !can('WRITE')} />
        </label>
      )}
    </div>
  );
};