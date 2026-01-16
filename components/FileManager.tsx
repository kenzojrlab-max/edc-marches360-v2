import React, { useState, useEffect } from 'react';
import { Upload, File, Lock, Trash2 } from 'lucide-react'; // RefreshCcw retiré car remplacé par la barre
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
  const [progress, setProgress] = useState(0); // NOUVEAU : État pour la progression

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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Vérification des droits
    if (!can('WRITE') || disabled) return;
    
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Fichier trop volumineux (Max 25 Mo)");
      return;
    }

    setLoading(true);
    setProgress(0); // Reset progression

    try {
      // 2. Appel à uploadFile avec le callback de progression
      const newDoc = await storage.uploadFile(
        file, 
        'marches_docs', 
        (pct) => setProgress(pct) // Mise à jour de la barre
      );
      
      setDoc(newDoc);
      onUpload(newDoc.id); 
      
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const download = () => {
    if (!doc || !can('DOWNLOAD')) return;
    window.open(doc.url, '_blank');
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!doc || !can('WRITE') || disabled) return;

    if (window.confirm("Supprimer ce fichier ?")) {
      setLoading(true); // Ici on garde un chargement simple sans progression
      try {
        await storage.deleteDoc(doc.id, doc.url);
        setDoc(null);
        onUpload(""); 
      } catch (error) {
        console.error("Erreur suppression", error);
        alert("Impossible de supprimer.");
      } finally {
        setLoading(false);
      }
    }
  };

  // AFFICHAGE : BARRE DE PROGRESSION PENDANT L'UPLOAD
  if (loading) {
    return (
      <div className="flex items-center gap-2 w-full max-w-[120px]">
        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-accent transition-all duration-200 ease-out"
            style={{ width: `${Math.max(5, progress)}%` }} // Min 5% pour voir qu'il y a quelque chose
          />
        </div>
        <span className="text-[9px] font-black text-accent w-6 text-right">{Math.round(progress)}%</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 max-w-full">
      {doc ? (
        <div className="flex items-center gap-2">
          <button
            onClick={download}
            disabled={!can('DOWNLOAD')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors max-w-full overflow-hidden ${
              can('DOWNLOAD') ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
            }`}
            title={doc.nom}
          >
            <div className="shrink-0">{can('DOWNLOAD') ? <File size={14} /> : <Lock size={14} />}</div>
            <span className="max-w-[80px] md:max-w-[120px] truncate">{doc.nom}</span>
          </button>
          {can('WRITE') && !disabled && (
             <button onClick={handleDelete} className="p-1.5 text-slate-400 hover:text-red-500 transition-colors">
               <Trash2 size={14} />
             </button>
          )}
        </div>
      ) : (
        <label className={`flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-xl text-xs font-medium cursor-pointer hover:bg-accent/20 transition-colors ${disabled || !can('WRITE') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
          <Upload size={14} />
          <span>Ajouter</span>
          <input type="file" className="hidden" onChange={handleFile} disabled={disabled || !can('WRITE')} />
        </label>
      )}
    </div>
  );
};