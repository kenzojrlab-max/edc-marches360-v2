import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, Lock, Trash2 } from 'lucide-react';
import { PieceJointe } from '../types';
import { storage } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Props {
  onUpload: (docId: string) => void;
  existingDocId?: string;
  disabled?: boolean;
}

export const FileManager: React.FC<Props> = ({ onUpload, existingDocId, disabled }) => {
  const { can } = useAuth();
  const toast = useToast();
  const [doc, setDoc] = useState<PieceJointe | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0); // NOUVEAU : État pour la progression
  const [isUploading, setIsUploading] = useState(false); // Distingue upload de suppression
  const [downloading, setDownloading] = useState(false); // État pour l'animation de téléchargement
  const [downloadProgress, setDownloadProgress] = useState(0); // Progression du téléchargement
  const uploadParticlesRef = useRef<HTMLDivElement>(null); // Conteneur particules upload
  const downloadParticlesRef = useRef<HTMLDivElement>(null); // Conteneur particules download

  useEffect(() => {
    let isMounted = true;
    if (existingDocId) {
      storage.getDocById(existingDocId).then(data => {
        if (isMounted && data) setDoc(data);
      }).catch((error) => {
        console.error("Erreur chargement document:", error);
      });
    } else {
      setDoc(null);
    }
    return () => { isMounted = false; };
  }, [existingDocId]);

  // Génération de particules pendant l'upload (folder-in : particules descendantes)
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

  // Génération de particules pendant le téléchargement (folder-out : particules montantes)
  useEffect(() => {
    if (!downloading || !downloadParticlesRef.current) return;
    const container = downloadParticlesRef.current;
    const interval = setInterval(() => {
      if (Math.random() > 0.5) {
        const particle = document.createElement('span');
        particle.className = 'fm-particle fm-particle-out';
        particle.innerText = Math.random() > 0.5 ? '1' : '0';
        particle.style.left = `${Math.floor(Math.random() * 60) + 20}%`;
        particle.style.bottom = '10px';
        container.appendChild(particle);
        setTimeout(() => particle.remove(), 800);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [downloading]);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Vérification des droits
    if (!can('WRITE') || disabled) return;

    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (Max 25 Mo).");
      return;
    }

    setLoading(true);
    setIsUploading(true);
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
      toast.error("Erreur lors de l'upload. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
      setIsUploading(false);
      setProgress(0);
    }
  };

  const download = () => {
    if (!doc || !can('DOWNLOAD') || downloading) return;

    // Animation folder-out avant ouverture du fichier
    setDownloading(true);
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
          setDownloading(false);
          setDownloadProgress(0);
        }, 300);
      }
    }, speed);
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
        toast.error("Impossible de supprimer le fichier.");
      } finally {
        setLoading(false);
      }
    }
  };

  // AFFICHAGE : ANIMATION UPLOAD - Dossier avec particules descendantes (folder-in)
  if (loading && isUploading) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: '80px', height: '56px' }}>
        <div className="relative z-10 transition-colors duration-300" style={{ width: '40px', height: '40px' }}>
          {/* Partie arrière du dossier (transparente) */}
          <svg className="absolute bottom-0 left-0 w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" opacity="0.3"/>
          </svg>
          {/* Barre de remplissage verticale */}
          <div
            className={`absolute bottom-1 left-1 w-8 rounded-sm transition-all duration-100 ${progress >= 100 ? 'bg-green-500' : 'bg-accent'}`}
            style={{ height: `${Math.min(progress * 0.28, 28)}px` }}
          />
          {/* Partie avant du dossier (coupée pour effet poche) */}
          <svg className={`relative w-10 h-10 ${progress >= 100 ? 'text-green-400' : 'text-blue-300'}`} fill="currentColor" viewBox="0 0 24 24" style={{ clipPath: 'inset(40% 0 0 0)' }}>
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          {/* Pourcentage ou OK */}
          <span className={`absolute top-6 left-0 w-full text-center font-mono text-[9px] font-black drop-shadow-md ${progress >= 100 ? 'text-green-400' : 'text-accent'}`}>
            {progress >= 100 ? 'OK' : `${Math.round(progress)}%`}
          </span>
        </div>
        {/* Conteneur particules (décalé vers le haut pour l'effet de chute) */}
        <div ref={uploadParticlesRef} className="absolute inset-0 overflow-visible pointer-events-none" style={{ top: '-25px' }} />
      </div>
    );
  }

  // AFFICHAGE : INDICATEUR SIMPLE PENDANT LA SUPPRESSION
  if (loading && !isUploading) {
    return (
      <div className="flex items-center gap-2 w-full max-w-[120px]">
        <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-danger transition-all duration-200 ease-out animate-pulse"
            style={{ width: '100%' }}
          />
        </div>
        <span className="text-[9px] font-black text-danger w-12 text-right">Suppr...</span>
      </div>
    );
  }

  // AFFICHAGE : ANIMATION TÉLÉCHARGEMENT - Dossier avec particules montantes (folder-out)
  if (downloading) {
    return (
      <div className="relative flex items-center justify-center" style={{ width: '80px', height: '56px' }}>
        <div className="relative z-10 transition-colors duration-300" style={{ width: '40px', height: '40px' }}>
          <svg className={`w-10 h-10 ${downloadProgress >= 100 ? 'text-green-400' : 'text-blue-400'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
          </svg>
          {/* Pourcentage ou OK */}
          <span className={`absolute inset-0 flex items-center justify-center pt-1 font-mono text-[9px] font-black ${downloadProgress >= 100 ? 'text-green-800' : 'text-slate-800'}`}>
            {downloadProgress >= 100 ? 'OK' : `${Math.round(downloadProgress)}%`}
          </span>
        </div>
        {/* Conteneur particules */}
        <div ref={downloadParticlesRef} className="absolute inset-0 overflow-visible pointer-events-none" />
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
