
import React, { useState, useEffect } from 'react';
import { Upload, Lock, FileCheck, RefreshCcw } from 'lucide-react';
import { PieceJointe } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../utils/storage';

interface Props {
  docId?: string;
  onUpload: (file: File) => void;
  disabled?: boolean;
}

export const DocCellInline: React.FC<Props> = ({ docId, onUpload, disabled }) => {
  const { can } = useAuth();
  const [doc, setDoc] = useState<PieceJointe | null>(null);
  const [loading, setLoading] = useState(false);
  const readOnly = !can('WRITE');

  useEffect(() => {
    if (docId) {
      storage.getDocById(docId).then(data => {
        if (data) setDoc(data as any);
      });
    } else {
      setDoc(null);
    }
  }, [docId]);

  if (disabled) {
    return (
      <div className="flex items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-100 opacity-40 select-none">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">N/A</span>
      </div>
    );
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!docId) return;
    const fullDoc = await storage.getDocById(docId);
    if (!fullDoc) return;
    const link = document.createElement('a');
    link.href = fullDoc.url || (fullDoc as any).data;
    link.download = fullDoc.nom || (fullDoc as any).name;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      onUpload(file);
      // Le composant se mettra à jour via useEffect quand l'ID changera dans le marché
      setTimeout(() => setLoading(false), 1000);
    }
  };

  if (loading) return <RefreshCcw className="animate-spin text-accent" size={12} />;

  return (
    <div className="flex items-center gap-1">
      {doc ? (
        <div className="flex items-center gap-1">
          <button 
            title="Télécharger la preuve"
            className="p-1.5 rounded-lg bg-success/10 text-success hover:bg-success/20 transition-all"
            onClick={handleDownload}
          >
            <FileCheck size={12} />
          </button>
          {!readOnly && (
            <label className="p-1.5 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 cursor-pointer transition-all">
              <Upload size={12} />
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {!readOnly ? (
            <label className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 cursor-pointer transition-all">
              <Upload size={12} />
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="p-1.5 rounded-lg bg-slate-100 text-slate-300">
              <Lock size={12} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
