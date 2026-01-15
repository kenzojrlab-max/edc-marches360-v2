import React, { useRef, useEffect, useState } from 'react';
import { Send, User, Bot, Sparkles, Loader2, Eraser } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatViewProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
  onClear: () => void;
}

// Fonction utilitaire pour nettoyer le markdown simple
const stripMarkdown = (text: string) => {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/#{1,6}\s/g, '')        // Headers
    .replace(/`/g, '')               // Code blocks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/\n/g, '<br/>');        // Line breaks
};

export const AIChatView: React.FC<AIChatViewProps> = ({ messages, isLoading, onSend, onClear }) => {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 mt-10">
            <div className={`w-16 h-16 ${theme.card} rounded-2xl flex items-center justify-center mb-4`}>
              <Sparkles className="text-accent animate-pulse" size={32} />
            </div>
            <h3 className={`text-sm font-black ${theme.textMain} uppercase tracking-widest`}>Assistant Zen'ô</h3>
            <p className={`text-[10px] ${theme.textSecondary} mt-2 max-w-[200px]`}>
              Posez une question sur les marchés, les procédures ou les délais.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-accent/10 text-accent'}`}>
              {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`flex flex-col max-w-[80%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                m.role === 'user' 
                  ? `${theme.buttonPrimary} text-white` 
                  : `${theme.card} border border-white/10 ${theme.textMain}`
              }`}>
                {/* Utilisation de dangerouslySetInnerHTML pour les sauts de ligne */}
                <div dangerouslySetInnerHTML={{ __html: stripMarkdown(m.content) }} />
              </div>
              <span className={`text-[9px] font-bold ${theme.textSecondary} mt-1 px-1`}>
                {m.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Bot size={14} />
            </div>
            <div className={`${theme.card} p-4 rounded-2xl border border-white/10 flex items-center gap-3`}>
              <Loader2 size={16} className="animate-spin text-accent" />
              <span className={`text-xs font-bold ${theme.textSecondary}`}>Analyse en cours...</span>
            </div>
          </div>
        )}
      </div>

      {/* Zone de saisie */}
      <div className={`p-4 border-t border-white/5 ${theme.card}`}>
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          <button 
            type="button" 
            onClick={onClear} 
            className={`p-3 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-xl transition-all`}
            title="Effacer la conversation"
          >
            <Eraser size={18} />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className={`flex-1 ${theme.input} pr-12 py-3 font-medium text-xs`}
            disabled={isLoading}
          />
          
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className={`absolute right-2 p-2 ${input.trim() ? 'bg-accent text-white' : 'bg-slate-700 text-slate-500'} rounded-lg transition-all`}
          >
            <Send size={16} />
          </button>
        </form>
        <div className="mt-2 text-center">
          <p className={`text-[9px] ${theme.textSecondary} opacity-50`}>L'IA peut faire des erreurs. Vérifiez les données importantes.</p>
        </div>
      </div>
    </div>
  );
};