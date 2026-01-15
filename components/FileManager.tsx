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
    try {
      // 2. CORRECTION CRITIQUE : Appel direct à uploadFile
      // On n'utilise plus FileReader, on envoie le fichier direct
      const newDoc = await storage.uploadFile(file);
      
      setDoc(newDoc);
      onUpload(newDoc.id); // On renvoie l'ID au parent
      
    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload. Vérifiez les règles Firebase.");
    } finally {
      setLoading(false);
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
      setLoading(true);
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

  if (loading) return <RefreshCcw className="animate-spin text-accent" size={16} />;

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