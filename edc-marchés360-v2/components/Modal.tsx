import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = 'md' 
}) => {
  const { theme } = useTheme();
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-2 md:p-4 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-[4px] animate-in fade-in duration-200" 
        onClick={onClose}
      ></div>
      
      <div className={`
        relative w-full ${sizes[size]} max-h-[98vh] md:max-h-[92vh] 
        ${theme.card} 
        flex flex-col animate-zoom-in overflow-hidden
      `}>
        {/* Header fixé */}
        <div className={`px-6 md:px-8 py-4 md:py-6 border-b border-white/5 flex items-center justify-between shrink-0`}>
          <h2 className={`text-lg md:text-xl font-black ${theme.textMain} line-clamp-1 uppercase tracking-tight`}>
            {title}
          </h2>
          <button 
            onClick={onClose}
            className={`p-2 md:p-3 transition-all ${theme.textSecondary} hover:${theme.textAccent}`}
          >
            <X size={24} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          </button>
        </div>

        {/* Body scrollable */}
        <div className={`px-6 md:px-12 py-6 md:py-8 overflow-y-auto custom-scrollbar flex-1 pb-10`}>
          {children}
        </div>

        {/* Footer fixé */}
        {footer && (
          <div className={`px-6 md:px-8 py-4 md:py-6 bg-black/5 border-t border-white/5 flex items-center justify-end gap-4 shrink-0`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};