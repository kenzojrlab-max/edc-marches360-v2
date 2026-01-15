import React, { useState, useEffect } from 'react';
import { Upload, File, Lock, RefreshCcw } from 'lucide-react';
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
    if (existingDocId) {
      storage.getDocById(existingDocId).then(data => {
        // Correction : Suppression du 'as any', data est déjà typé correctement
        if (data) setDoc(data);
      });
    } else {
      setDoc(null);
    }
  }, [existingDocId]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!can('WRITE')) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      
      // Correction : Typage strict avec PieceJointe au lieu de any
      const newDoc: PieceJointe = {
        id: crypto.randomUUID(),
        nom: file.name,
        type: file.type,
        size: file.size,
        url: base64,
        date_upload: new Date().toISOString()
      };
      
      await storage.saveDoc(newDoc);
      onUpload(newDoc.id);
      setDoc(newDoc);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const download = () => {
    if (!doc || !can('DOWNLOAD')) return;
    const link = document.createElement('a');
    // Correction : Utilisation des propriétés directes de l'interface
    link.href = doc.url;
    link.download = doc.nom;
    link.click();
  };

  if (loading) return <RefreshCcw className="animate-spin text-accent" size={16} />;

  return (
    <div className="flex items-center gap-2 max-w-full">
      {doc ? (
        <button
          onClick={download}
          disabled={!can('DOWNLOAD')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors max-w-full overflow-hidden ${
            can('DOWNLOAD') 
              ? 'bg-success/10 text-success hover:bg-success/20' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
          }`}
          // Correction : Suppression des accès via 'as any'
          title={can('DOWNLOAD') ? doc.nom : 'Téléchargement restreint (GUEST)'}
        >
          <div className="shrink-0">
            {can('DOWNLOAD') ? <File size={14} /> : <Lock size={14} />}
          </div>
          {/* Correction : Affichage propre de la propriété nom */}
          <span className="max-w-[80px] md:max-w-[100px] truncate">{doc.nom}</span>
        </button>
      ) : (
        <label className={`flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-xl text-xs font-medium cursor-pointer hover:bg-accent/20 transition-colors shrink-0 ${disabled || !can('WRITE') ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Upload size={14} />
          <span>Upload</span>
          {can('WRITE') && <input type="file" className="hidden" onChange={handleFile} disabled={disabled} />}
        </label>
      )}
    </div>
  );
};