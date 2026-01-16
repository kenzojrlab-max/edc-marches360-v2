import React, { useRef, useEffect, useState } from 'react';
import { Send, User, Bot, Sparkles, Loader2, Eraser, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
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
  
  // Nouveaux props pour la voix
  isVoiceOn: boolean;
  toggleVoice: () => void;
  isListening: boolean;
  toggleListening: () => void;
}

// Fonction de nettoyage visuel stricte (comme demandé)
const stripMarkdownVisual = (text: string) => {
  return text
    .replace(/[*#_~`]/g, '') // Enlève les symboles markdown
    .replace(/\[.*?\]/g, '') // Enlève les liens
    .replace(/\|/g, ' ')     // Enlève les barres de tableau
    .trim();
};

export const AIChatView: React.FC<AIChatViewProps> = ({ 
  messages, isLoading, onSend, onClear,
  isVoiceOn, toggleVoice, isListening, toggleListening
}) => {
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
    <div className="flex flex-col h-full bg-slate-50/5">
      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
            <Sparkles className="text-accent mb-2" size={24} />
            <p className={`text-[10px] ${theme.textSecondary}`}>Zen'ô est prêt.</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-white' : 'bg-accent/10 text-accent'}`}>
              {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={`flex flex-col max-w-[85%] ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`p-3 rounded-2xl text-[10px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                m.role === 'user' 
                  ? `${theme.buttonPrimary} text-white` 
                  : `${theme.card} border border-white/10 ${theme.textMain}`
              }`}>
                {/* Application du nettoyage visuel */}
                {m.role === 'assistant' ? stripMarkdownVisual(m.content) : m.content}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-6 h-6 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0">
              <Bot size={12} />
            </div>
            <div className={`${theme.card} p-3 rounded-2xl border border-white/10 flex items-center gap-2`}>
              <Loader2 size={12} className="animate-spin text-accent" />
              <span className={`text-[10px] font-bold ${theme.textSecondary}`}>Réflexion...</span>
            </div>
          </div>
        )}
      </div>

      {/* Barre d'outils (Switch Voix + Clear) */}
      <div className="px-4 py-1 flex items-center justify-between border-t border-white/5 bg-black/5">
         <button onClick={toggleVoice} className="flex items-center gap-2 text-[9px] font-bold text-slate-400 hover:text-accent transition-colors">
            {isVoiceOn ? <Volume2 size={12}/> : <VolumeX size={12}/>}
            {isVoiceOn ? 'Lecture Auto' : 'Silencieux'}
         </button>
         <button onClick={onClear} className="flex items-center gap-2 text-[9px] font-bold text-slate-400 hover:text-red-400 transition-colors">
            <Eraser size={12}/> Vider
         </button>
      </div>

      {/* Zone de saisie */}
      <div className={`p-3 border-t border-white/5 ${theme.card}`}>
        <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
          {/* Bouton Micro */}
          <button 
            type="button" 
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-accent'}`}
            title="Dictée vocale"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className={`flex-1 ${theme.input} py-2.5 px-4 font-medium text-xs rounded-xl`}
            disabled={isLoading || isListening}
          />
          
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className={`p-2.5 ${input.trim() ? 'bg-accent text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-400'} rounded-xl transition-all`}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};