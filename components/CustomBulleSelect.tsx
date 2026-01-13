import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const CustomBulleSelect: React.FC<Props> = ({ 
  label, 
  value, 
  options, 
  onChange, 
  placeholder = "Sélectionner...", 
  disabled 
}) => {
  const { theme, themeType } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getMenuBg = () => {
    if (themeType === 'glass') return 'bg-[#1a2333] border border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.9)]'; 
    if (themeType === 'cyber') return 'bg-[#0a1120] border border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.4)]';
    if (themeType === 'minimal') return 'bg-white border-2 border-black shadow-none';
    if (themeType === 'clay') return 'bg-[#f0f2f5] shadow-[10px_10px_30px_#ccd0d4]';
    if (themeType === 'retro') return 'bg-white border-[3px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]';
    return 'bg-white border border-slate-200 shadow-2xl';
  };

  return (
    <div 
      className={`flex flex-col gap-1.5 w-full relative transition-none ${isOpen ? 'z-[9999]' : 'z-[50]'}`} 
      ref={containerRef}
    >
      {label && (
        <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} ml-1`}>
          {label}
        </label>
      )}
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          ${theme.input} flex items-center justify-between w-full text-sm font-black transition-all
          ${isOpen ? `ring-4 ring-offset-0 ring-white/10` : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${(themeType === 'glass' || themeType === 'cyber') ? 'text-white border-white/20' : ''}
        `}
      >
        <span className={`truncate text-left flex-1 ${selectedOption ? (themeType === 'glass' ? 'text-white' : theme.textMain) : (themeType === 'glass' ? 'text-white/40' : theme.textSecondary)}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown size={18} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textSecondary} shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-[9999]">
          <div 
            className={`w-full ${getMenuBg()} p-2 animate-zoom-in ${theme.buttonShape}`}
            style={{ transformOrigin: 'top center' }}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 ${theme.buttonShape} text-xs font-black transition-all mb-1 text-left
                    ${value === option.value 
                      ? (themeType === 'glass' ? 'bg-white/20 text-white' : theme.buttonPrimary) 
                      : `hover:bg-white/10 ${themeType === 'glass' ? 'text-white' : theme.textMain}`}
                  `}
                >
                  <span className="truncate pr-4">{option.label}</span>
                  {value === option.value && <Check size={14} strokeWidth={theme.iconStroke} className={theme.iconStyle} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};