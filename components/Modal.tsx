import React from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const { theme, themeType } = useTheme();

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] h-[90vh]'
  };

  return (
    // CORRECTION : z-[100] pour être supérieur à la Sidebar (z-50) et au Header (z-40)
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`
          relative w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col 
          ${theme.card} shadow-2xl animate-in zoom-in-95 duration-200
          ${themeType === 'glass' ? 'border border-white/20' : ''}
        `}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className={`${theme.textMain} text-xl font-bold uppercase tracking-tight`}>{title}</h2>
          <button 
            onClick={onClose}
            className={`p-2 hover:bg-white/10 ${theme.buttonShape} transition-colors ${theme.textSecondary} hover:text-white`}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};