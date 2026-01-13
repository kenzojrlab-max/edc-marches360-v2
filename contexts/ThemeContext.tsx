import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'minimal' | 'cyber' | 'clay' | 'retro' | 'glass';

interface ThemeStyles {
  name: string;
  card: string;
  buttonShape: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonDanger: string;
  input: string;
  textMain: string;
  textSecondary: string;
  textAccent: string;
  iconStroke: number;
  iconStyle: string;
  bgPage: string;
}

const themes: Record<ThemeType, ThemeStyles> = {
  minimal: {
    name: 'Luxe Minimal',
    card: 'bg-white border border-black shadow-none rounded-none',
    buttonShape: 'rounded-none',
    buttonPrimary: 'bg-black text-white hover:bg-slate-800 transition-colors',
    buttonSecondary: 'bg-white border border-black text-black hover:bg-slate-50',
    buttonDanger: 'bg-white border border-red-600 text-red-600 hover:bg-red-50',
    input: 'bg-white border border-black rounded-none px-4 py-2 focus:ring-0',
    textMain: 'text-black',
    textSecondary: 'text-slate-500',
    textAccent: 'text-black font-black',
    iconStroke: 1,
    iconStyle: 'transition-all',
    bgPage: 'bg-[#fafafa]'
  },
  cyber: {
    name: 'Neon Cyber',
    card: 'bg-[#050b1a] border border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)] rounded-sm',
    buttonShape: 'rounded-sm',
    buttonPrimary: 'bg-cyan-500 text-black font-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]',
    buttonSecondary: 'bg-transparent border border-cyan-500 text-cyan-500 hover:bg-cyan-500/10',
    buttonDanger: 'bg-transparent border border-pink-500 text-pink-500 hover:bg-pink-500/10',
    input: 'bg-[#0a1120] border border-cyan-900 text-cyan-400 rounded-sm px-4 py-2 focus:border-cyan-500',
    textMain: 'text-white',
    textSecondary: 'text-cyan-400/60',
    textAccent: 'text-cyan-400',
    iconStroke: 1.5,
    iconStyle: 'drop-shadow-[0_0_3px_rgba(6,182,212,0.5)]',
    bgPage: 'bg-[#020617]'
  },
  clay: {
    name: 'Soft Clay',
    card: 'bg-[#f0f2f5] border-none shadow-[10px_10px_20px_#ccd0d4,-10px_-10px_20px_#ffffff] rounded-[3rem]',
    buttonShape: 'rounded-[2rem]',
    buttonPrimary: 'bg-[#1e3a8a] text-white shadow-[5px_5px_10px_rgba(0,0,0,0.1)] hover:scale-105',
    buttonSecondary: 'bg-[#f0f2f5] text-slate-600 shadow-[5px_5px_10px_#ccd0d4,-5px_-5px_10px_#ffffff] hover:shadow-inner',
    buttonDanger: 'bg-red-50 text-red-600 shadow-[5px_5px_10px_#ccd0d4,-5px_-5px_10px_#ffffff]',
    input: 'bg-[#f0f2f5] border-none shadow-inner rounded-2xl px-5 py-3',
    textMain: 'text-slate-800',
    textSecondary: 'text-slate-500',
    textAccent: 'text-[#1e3a8a]',
    iconStroke: 2,
    iconStyle: 'opacity-80',
    bgPage: 'bg-[#f0f2f5]'
  },
  retro: {
    name: 'Retro Pop',
    card: 'bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-none',
    buttonShape: 'rounded-none',
    buttonPrimary: 'bg-[#ffff00] border-[3px] border-black text-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none',
    buttonSecondary: 'bg-[#a855f7] border-[3px] border-black text-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    buttonDanger: 'bg-[#ff4444] border-[3px] border-black text-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    input: 'bg-white border-[3px] border-black rounded-none px-4 py-2 font-bold',
    textMain: 'text-black',
    textSecondary: 'text-slate-600 font-bold',
    textAccent: 'text-blue-600 underline decoration-4',
    iconStroke: 2.5,
    iconStyle: 'stroke-black',
    bgPage: 'bg-[#fde047]'
  },
  glass: {
    name: 'Glass Frost',
    card: 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl rounded-[2.5rem]',
    buttonShape: 'rounded-2xl',
    buttonPrimary: 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/30',
    buttonSecondary: 'bg-black/10 hover:bg-black/20 text-white border border-white/10',
    buttonDanger: 'bg-red-500/20 text-red-100 border border-red-500/30',
    input: 'bg-white/5 border border-white/10 text-white placeholder:text-white/30 rounded-2xl px-4 py-2 backdrop-blur-sm',
    textMain: 'text-white',
    textSecondary: 'text-white/60',
    textAccent: 'text-cyan-200',
    iconStroke: 1.5,
    iconStyle: 'opacity-90',
    bgPage: 'bg-gradient-to-br from-indigo-900 via-slate-900 to-black'
  }
};

interface ThemeContextType {
  theme: ThemeStyles;
  themeType: ThemeType;
  setThemeType: (type: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeType, setThemeType] = useState<ThemeType>(() => {
    return (localStorage.getItem('edc_theme') as ThemeType) || 'minimal';
  });

  useEffect(() => {
    localStorage.setItem('edc_theme', themeType);
  }, [themeType]);

  return (
    <ThemeContext.Provider value={{ theme: themes[themeType], themeType, setThemeType }}>
      <div className={`${themes[themeType].bgPage} min-h-screen transition-colors duration-500`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};