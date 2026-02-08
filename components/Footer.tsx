// Fichier : src/components/Footer.tsx
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-white/10 mt-20 py-8 bg-black/5 backdrop-blur-sm">
      <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-emerald-900/20">
            E
          </div>
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
            EDC Marchés 360
          </span>
        </div>
        
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          © {new Date().getFullYear()} - Service Passation des Marchés et Gestion des contrats Projet
        </p>
      </div>
    </footer>
  );
};

export default Footer;