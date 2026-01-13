import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Props extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  icon?: LucideIcon;
  textarea?: boolean;
}

export const BulleInput: React.FC<Props> = ({ 
  label, 
  icon: Icon, 
  textarea, 
  className = "", 
  ...props 
}) => {
  const { theme, themeType } = useTheme();
  const Component = textarea ? 'textarea' : 'input';
  
  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <div className="flex items-center gap-2 ml-1">
        <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>
          {label}
        </label>
        {props.required && <span className="text-red-500 text-xs">*</span>}
      </div>
      
      <div className="relative">
        {Icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textSecondary} group-focus-within:${theme.textAccent} transition-colors`}>
            <Icon size={18} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          </div>
        )}
        
        <Component
          className={`
            ${theme.input} w-full text-sm font-black transition-all
            ${(themeType === 'glass' || themeType === 'cyber') ? 'placeholder:text-white/30 text-white' : 'placeholder:opacity-30 text-slate-900'}
            ${Icon ? 'pl-12' : ''}
            ${textarea ? 'min-h-[100px] resize-none' : ''}
            ${className}
          `}
          {...(props as any)}
        />
      </div>
    </div>
  );
};