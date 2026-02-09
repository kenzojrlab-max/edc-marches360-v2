import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, Lock, Trash2, Plus } from 'lucide-react';
import { PieceJointe } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  existingDocIds?: string | string[];
  onAdd: (docId: string) => void;
  onRemove: (docId: string) => void;
  disabled?: boolean;
  viewOnly?: boolean;
}

export const MultiFileManager: React.FC<Props> = ({ existingDocIds, onAdd, onRemove, disabled, viewOnly }) => {
  const { can } = useAuth();
  const [docs, setDocs] = useState<PieceJointe[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const uploadParticlesRef = useRef<HTMLDivElement>(null);

  // Normaliser les IDs en tableau
  const normalizeIds = (ids?: string | string[]): string[] => {
    if (!ids) return [];
    if (Array.isArray(ids)) return ids.filter(Boolean);
    return ids ? [ids] : [];
  };

  // Charger les documents existants
  useEffect(() => {
    let isMounted = true;
    const docIds = normalizeIds(existingDocIds);

    if (docIds.length > 0) {
      Promise.all(docIds.map(id => storage.getDocById(id)))
        .then(results => {
          if (isMounted) {
            setDocs(results.filter((d): d is PieceJointe => d !== null));
          }
        });
    } else {
      setDocs([]);
    }

    return () => { isMounted = false; };
  }, [existingDocIds]);

  // Génération de particules pendant l'upload
  useEffect(() => {
    if (!isUploading || !uploadParticlesRef.current) return;
    const container = uploadParticlesRef.current;
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        const particle = document.createElement('span');
        particle.className = 'fm-particle fm-particle-in';
        particle.innerText = Math.random() > 0.5 ? '1' : '0';
        particle.style.left = `${Math.floor(Math.random() * 60) + 20}%`;
        particle.style.top = '0px';
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isUploading]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!can('WRITE') || disabled || viewOnly) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("Fichier trop volumineux (Max 25 Mo)");
      return;
    }

    setLoading(true);
    setIsUploading(true);
    setProgress(0);

    try {
      const newDoc = await storage.uploadFile(
        file,
        'marches_docs',
        (pct) => setProgress(pct)
      );

      setDocs(prev => [...prev, newDoc]);
      onAdd(newDoc.id);

    } catch (error) {
      console.error("Erreur upload:", error);
      alert("Erreur lors de l'upload. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
      setIsUploading(false);
      setProgress(0);
      // Reset input
      e.target.value = '';
    }
  };

  const download = (doc: PieceJointe) => {
    if (!can('DOWNLOAD') || downloading) return;

    setDownloading(doc.id);
    setDownloadProgress(0);

    let prog = 0;
    const speed = Math.floor(Math.random() * 15) + 20;
    const interval = setInterval(() => {
      prog += 2;
      setDownloadProgress(prog);
      if (prog >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          window.open(doc.url, '_blank');
          setDownloading(null);
          setDownloadProgress(0);
        }, 300);
      }
    }, speed);
  };

  const handleDelete = async (docToDelete: PieceJointe, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!can('WRITE') || disabled || viewOnly) return;

    if (window.confirm(`Supprimer "${docToDelete.nom}" ?`)) {
      try {
        await storage.deleteDoc(docToDelete.id, docToDelete.url);
        setDocs(prev => prev.filter(d => d.id !== docToDelete.id));
        onRemove(docToDelete.id);
      } catch (error) {
        console.error("Erreur suppression", error);
        alert("Impossible de supprimer.");
      }
    }
  };

  // AFFICHAGE : ANIMATION UPLOAD
  if (loading && isUploading) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: '80px', height: '56px' }}>
        <div className="relative z-10 transition-colors duration-300" style={{ width: '40px', height: '40px' }}>
          <svg className="absolute bottom-0 left-0 w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" opacity="0.3"/>
          </svg>
          <div
            className={`absolute bottom-1 left-1 w-8 rounded-sm transition-all duration-100 ${progress >= 100 ? 'bg-green-500' : 'bg-accent'}`}
            style={{ height: `${Math.min(progress * 0.28, 28)}px` }}
          />
          <svg className={`relative w-10 h-10 ${progress >= 100 ? 'text-green-400' : 'text-blue-300'}`} fill="currentColor" viewBox="0 0 24 24" style={{ clipPath: 'inset(40% 0 0 0)' }}>
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          <span className={`absolute top-6 left-0 w-full text-center font-mono text-[9px] font-black drop-shadow-md ${progress >= 100 ? 'text-green-400' : 'text-accent'}`}>
            {progress >= 100 ? 'OK' : `${Math.round(progress)}%`}
          </span>
        </div>
        <div ref={uploadParticlesRef} className="absolute inset-0 overflow-visible pointer-events-none" style={{ top: '-25px' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Liste des documents existants */}
      {docs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {docs.map(doc => (
            <div key={doc.id} className="flex items-center gap-1">
              {downloading === doc.id ? (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-xl text-xs font-medium">
                  <File size={14} className="animate-pulse" />
                  <span>{downloadProgress}%</span>
                </div>
              ) : (
                <button
                  onClick={() => download(doc)}
                  disabled={!can('DOWNLOAD')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors max-w-full overflow-hidden ${
                    can('DOWNLOAD') ? 'bg-success/10 text-success hover:bg-success/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                  }`}
                  title={doc.nom}
                >
                  <div className="shrink-0">{can('DOWNLOAD') ? <File size={14} /> : <Lock size={14} />}</div>
                  <span className="max-w-[80px] md:max-w-[100px] truncate">{doc.nom}</span>
                </button>
              )}
              {can('WRITE') && !disabled && !viewOnly && (
                <button onClick={(e) => handleDelete(doc, e)} className="p-1 text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bouton Ajouter (seulement si pas en viewOnly) */}
      {!viewOnly && (
        <label className={`flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent rounded-xl text-xs font-medium cursor-pointer hover:bg-accent/20 transition-colors w-fit ${disabled || !can('WRITE') ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
          <Plus size={14} />
          <span>{docs.length > 0 ? 'Ajouter' : 'Ajouter un document'}</span>
          <input type="file" className="hidden" onChange={handleFile} disabled={disabled || !can('WRITE')} />
        </label>
      )}

      {/* Message si aucun document en mode viewOnly */}
      {viewOnly && docs.length === 0 && (
        <span className="text-[10px] text-slate-400 italic">Aucun document</span>
      )}
    </div>
  );
};
