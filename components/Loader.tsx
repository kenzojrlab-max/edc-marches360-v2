import React from 'react';
import { Settings } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export const Loader: React.FC = () => {
  const { theme } = useTheme();

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center ${theme.bgPage} transition-colors duration-500`}>
      <div className="relative w-32 h-32 mb-8">
        {/* Grand engrenage bleu (#3b82f6) - Haut Gauche - Rotation positive */}
        <div className="absolute top-0 left-0 animate-[spin_4s_linear_infinite]">
          <Settings 
            size={80} 
            color="#3b82f6" 
            strokeWidth={1.5}
            className="drop-shadow-lg"
          />
        </div>

        {/* Petit engrenage gris (#64748b) - Bas Droite - Rotation négative (inverse) */}
        {/* Note: 'animation-direction: reverse' crée la rotation inverse */}
        <div className="absolute bottom-2 right-2 animate-[spin_3s_linear_infinite] [animation-direction:reverse]">
          <Settings 
            size={48} 
            color="#64748b" 
            strokeWidth={2}
            className="drop-shadow-md bg-transparent rounded-full" 
          />
        </div>
      </div>

      {/* Texte EDC Marchés 360 en bleu clair */}
      <h1 className="text-xl font-black uppercase tracking-[0.2em] text-blue-400 animate-pulse">
        EDC Marchés 360
      </h1>
      <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">
        Initialisation du système...
      </p>
    </div>
  );
};