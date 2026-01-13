import React from 'react';
import { useTheme, ThemeType } from '../contexts/ThemeContext';
import { Palette, Layers, Monitor, Zap, GlassWater } from 'lucide-react';

export const ThemeDock: React.FC = () => {
  const { themeType, setThemeType, theme } = useTheme();

  const options: { type: ThemeType; icon: any; label: string }[] = [
    { type: 'minimal', icon: Monitor, label: 'Minimal' },
    { type: 'cyber', icon: Zap, label: 'Cyber' },
    { type: 'clay', icon: Palette, label: 'Clay' },
    { type: 'retro', icon: Layers, label: 'Retro' },
    { type: 'glass', icon: GlassWater, label: 'Glass' }
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[3000]">
      <div className={`${theme.card} flex items-center gap-2 p-2 shadow-2xl backdrop-blur-2xl bg-white/5 border-white/10 ring-1 ring-black/5`}>
        {options.map((opt) => (
          <button
            key={opt.type}
            onClick={() => setThemeType(opt.type)}
            className={`
              relative group flex flex-col items-center justify-center w-12 h-12 transition-all
              ${theme.buttonShape}
              ${themeType === opt.type ? 'bg-primary text-white scale-110 shadow-lg' : 'text-slate-400 hover:bg-slate-100'}
            `}
            title={opt.label}
          >
            <opt.icon size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="absolute -top-10 scale-0 group-hover:scale-100 transition-all px-2 py-1 bg-black text-white text-[10px] rounded font-bold uppercase tracking-widest pointer-events-none">
              {opt.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};