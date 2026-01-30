import React, { useCallback } from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Props extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  icon?: LucideIcon;
  textarea?: boolean;
}

// Fonction pour parser une date depuis différents formats (Excel, etc.)
const parseDateFromString = (str: string): string | null => {
  if (!str) return null;

  const cleaned = str.trim();

  // Format ISO déjà valide (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // Format DD/MM/YYYY ou DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const [, day, month, year] = dmyMatch;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  // Format MM/DD/YYYY (format US)
  const mdyMatch = cleaned.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (mdyMatch) {
    const [, first, second, year] = mdyMatch;
    // Si le premier nombre > 12, c'est forcément un jour (format DD/MM/YYYY)
    // Sinon on assume DD/MM/YYYY car c'est le format français
    const d = first.padStart(2, '0');
    const m = second.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  // Format YYYY/MM/DD
  const ymdMatch = cleaned.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const d = day.padStart(2, '0');
    const m = month.padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  // Format DD MMM YYYY ou DD MMMM YYYY (ex: 15 Jan 2024, 15 Janvier 2024)
  const monthNames: Record<string, string> = {
    'jan': '01', 'janvier': '01', 'january': '01',
    'fev': '02', 'feb': '02', 'février': '02', 'fevrier': '02', 'february': '02',
    'mar': '03', 'mars': '03', 'march': '03',
    'avr': '04', 'apr': '04', 'avril': '04', 'april': '04',
    'mai': '05', 'may': '05',
    'jun': '06', 'juin': '06', 'june': '06',
    'jul': '07', 'juillet': '07', 'juil': '07', 'july': '07',
    'aou': '08', 'aug': '08', 'août': '08', 'aout': '08', 'august': '08',
    'sep': '09', 'sept': '09', 'septembre': '09', 'september': '09',
    'oct': '10', 'octobre': '10', 'october': '10',
    'nov': '11', 'novembre': '11', 'november': '11',
    'dec': '12', 'déc': '12', 'décembre': '12', 'decembre': '12', 'december': '12'
  };

  const textMonthMatch = cleaned.toLowerCase().match(/^(\d{1,2})\s+([a-zéûô]+)\s+(\d{4})$/i);
  if (textMonthMatch) {
    const [, day, monthStr, year] = textMonthMatch;
    const month = monthNames[monthStr.toLowerCase()];
    if (month) {
      return `${year}-${month}-${day.padStart(2, '0')}`;
    }
  }

  // Essayer Date.parse en dernier recours
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    const date = new Date(parsed);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    // Vérifier que l'année est raisonnable (entre 1900 et 2100)
    if (year >= 1900 && year <= 2100) {
      return `${year}-${month}-${day}`;
    }
  }

  return null;
};

export const BulleInput: React.FC<Props> = ({
  label,
  icon: Icon,
  textarea,
  className = "",
  onChange,
  type,
  ...props
}) => {
  const { theme, themeType } = useTheme();
  const Component = textarea ? 'textarea' : 'input';
  const isDateInput = type === 'date';

  // Handler pour le collage de dates
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLInputElement>) => {
    if (!isDateInput || !onChange) return;

    const pastedText = e.clipboardData.getData('text');
    const parsedDate = parseDateFromString(pastedText);

    if (parsedDate) {
      e.preventDefault();
      // Créer un événement synthétique pour simuler un changement
      const syntheticEvent = {
        target: { value: parsedDate },
        currentTarget: { value: parsedDate }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  }, [isDateInput, onChange]);

  return (
    <div className="flex flex-col gap-1.5 w-full group">
      <div className="flex items-center gap-2 ml-1">
        <label className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
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
          type={type}
          className={`
            ${theme.input} w-full text-sm font-black transition-all
            ${(themeType === 'glass' || themeType === 'cyber') ? 'placeholder:text-white/30 text-white' : 'placeholder:opacity-30 text-slate-900'}
            ${Icon ? 'pl-12' : ''}
            ${textarea ? 'min-h-[100px] resize-none' : ''}
            ${className}
          `}
          onChange={onChange}
          onPaste={isDateInput ? handlePaste : undefined}
          {...(props as any)}
        />
      </div>
    </div>
  );
};
