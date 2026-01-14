
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useMarkets } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';
import { sendMessageToGemini } from '../utils/aiAgent';
import { CustomBulleSelect } from './CustomBulleSelect';
import { 
  Bot, Send, X, FileText, MessageSquare, Loader2, Download, 
  RefreshCcw, Mic, MicOff, MoreVertical, Volume2, VolumeX, Trash2, Languages, Minimize2
} from 'lucide-react';
import { jsPDF } from "jspdf";

const GREETING = "bonjour je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360";

export const FloatingAIWidget: React.FC = () => {
  const { markets, projects } = useMarkets();
  const { theme, themeType } = useTheme();
  
  const [isOpen, setIsOpen] = useState(false);
  
  // Positions
  const [iconPos, setIconPos] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
  const [windowPos, setWindowPos] = useState({ x: 0, y: 0 });
  
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  const [mode, setMode] = useState<'CHAT' | 'REPORT'>('CHAT');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: GREETING }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportText, setReportText] = useState('');

  // Filtres pour Rapport
  const [reportYear, setReportYear] = useState<string>('');
  const [reportProjectId, setReportProjectId] = useState<string>('');

  // Voice States
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [language, setLanguage] = useState('fr-FR');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Options de filtres
  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(projects.map(p => p.exercice.toString())));
    return [{ value: '', label: 'Toutes les années' }, ...years.sort().map(y => ({ value: y, label: y }))];
  }, [projects]);

  const projectOptions = useMemo(() => {
    const filtered = reportYear 
      ? projects.filter(p => p.exercice.toString() === reportYear)
      : projects;
    return [{ value: '', label: 'Tous les projets' }, ...filtered.map(p => ({ value: p.id, label: p.libelle }))];
  }, [projects, reportYear]);

  // Initialisation responsive
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 768;
      const w = isMobile ? window.innerWidth * 0.95 : 360;
      const h = isMobile ? Math.min(window.innerHeight * 0.7, 440) : 440; // Réduit à 440px
      
      let nx, ny;
      if (isMobile) {
        nx = (window.innerWidth - w) / 2;
        ny = (window.innerHeight - h) / 2;
      } else {
        nx = iconPos.x - w;
        ny = iconPos.y - h + 50;
      }
      
      nx = Math.max(10, Math.min(window.innerWidth - (isMobile ? w : 360) - 10, nx));
      ny = Math.max(10, Math.min(window.innerHeight - (isMobile ? h : 440) - 10, ny));
      setWindowPos({ x: nx, y: ny });
    }
  }, [isOpen]);

  const onIconMouseDown = (e: React.MouseEvent) => {
    setIsDraggingIcon(true);
    hasMoved.current = false;
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDragOffset({ x: e.clientX - iconPos.x, y: e.clientY - iconPos.y });
  };

  const onWindowMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return;
    setIsDraggingWindow(true);
    setDragOffset({ x: e.clientX - windowPos.x, y: e.clientY - windowPos.y });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingIcon) {
        if (Math.abs(e.clientX - dragStartPos.current.x) > 5) hasMoved.current = true;
        setIconPos({ 
          x: Math.max(0, Math.min(window.innerWidth - 70, e.clientX - dragOffset.x)), 
          y: Math.max(0, Math.min(window.innerHeight - 70, e.clientY - dragOffset.y)) 
        });
      }
      if (isDraggingWindow) {
        const isMobile = window.innerWidth < 768;
        const w = isMobile ? window.innerWidth * 0.95 : 360;
        const h = isMobile ? Math.min(window.innerHeight * 0.7, 440) : 440;
        setWindowPos({
          x: Math.max(0, Math.min(window.innerWidth - (isMobile ? w : 360), e.clientX - dragOffset.x)),
          y: Math.max(0, Math.min(window.innerHeight - (isMobile ? h : 440), e.clientY - dragOffset.y))
        });
      }
    };
    const handleMouseUp = () => {
      setIsDraggingIcon(false);
      setIsDraggingWindow(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingIcon, isDraggingWindow, dragOffset]);

  const stripMarkdown = (text: string) => {
    return text.replace(/[*#_~`]/g, '').replace(/\[.*?\]/g, '').replace(/\|/g, ' ').trim();
  };

  const speak = (text: string) => {
    if (!isVoiceOn) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdown(text));
    utterance.lang = language;
    window.speechSynthesis.speak(utterance);
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!SpeechRecognition) return;
    if (isListening) { setIsListening(false); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => handleSend(transcript), 600);
    };
    recognition.start();
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setLoading(true);
    const response = await sendMessageToGemini(textToSend, markets, projects, 'CHAT');
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
    speak(response);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    const filteredMarkets = markets.filter(m => {
      const proj = projects.find(p => p.id === m.projet_id);
      const matchYear = !reportYear || proj?.exercice.toString() === reportYear;
      const matchProj = !reportProjectId || m.projet_id === reportProjectId;
      return matchYear && matchProj;
    });

    const msg = reportProjectId 
      ? `Génère le rapport pour le projet ${projects.find(p => p.id === reportProjectId)?.libelle}`
      : `Génère le rapport annuel pour l'année ${reportYear || 'en cours'}`;

    const response = await sendMessageToGemini(msg, filteredMarkets, projects, 'REPORT');
    setReportText(response);
    setLoading(false);
    if (isVoiceOn) speak("Rapport généré.");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(stripMarkdown(reportText), 180);
    doc.setFontSize(14);
    doc.text("ZEN'Ô - RAPPORT EDC", 105, 20, { align: 'center' });
    doc.setFontSize(10);
    let y = 35;
    splitText.forEach((line: string) => {
      if (y > 280) { doc.addPage(); y = 20; }
      doc.text(line, 15, y);
      y += 6;
    });
    doc.save("ZenO_Rapport.pdf");
  };

  const getDialogStyle = () => {
    const isMobile = window.innerWidth < 768;
    const w = isMobile ? '90vw' : '360px';
    const h = isMobile ? 'min(440px, 70vh)' : '440px'; // Hauteur fixe 440px
    return { left: windowPos.x, top: windowPos.y, width: w, height: h };
  };

  return (
    <>
      <div
        onMouseDown={onIconMouseDown}
        onClick={() => !hasMoved.current && setIsOpen(!isOpen)}
        style={{ left: iconPos.x, top: iconPos.y, zIndex: 9999 }}
        className={`fixed cursor-move select-none transition-transform hover:scale-110 active:scale-95`}
      >
        {!isOpen && (
          <div className={`relative w-16 h-16 ${theme.buttonShape} overflow-hidden shadow-2xl border-2 border-white/20 ring-2 ring-black/5 ${themeType === 'glass' ? 'bg-white/20 backdrop-blur-md' : theme.buttonPrimary}`}>
            <div className="absolute inset-0 flex items-center justify-center">
               <Bot className="text-white w-9 h-9" />
            </div>
            <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className={`fixed z-[10000] ${theme.card} flex flex-col overflow-hidden animate-zoom-in border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]`} style={getDialogStyle()}>
          {/* Header */}
          <div onMouseDown={onWindowMouseDown} className={`p-4 flex items-center justify-between cursor-move text-white shrink-0 ${themeType === 'glass' ? 'bg-white/20' : theme.buttonPrimary} border-b border-white/10`}>
            <div className="flex items-center gap-3 no-drag">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30"><Bot size={22} /></div>
              <div>
                <h3 className="font-black text-[11px] uppercase tracking-wider leading-none">Zen'ô Assistant</h3>
                <p className="text-[7px] font-black uppercase tracking-widest mt-1 text-green-300 flex items-center gap-1">
                   <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> Connecté
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 no-drag relative" ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} className="hover:bg-white/20 p-2 rounded-full transition-all"><MoreVertical size={16} /></button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-all"><X size={16} /></button>
              {showMenu && (
                <div className="absolute top-full right-0 mt-2 w-52 bg-white shadow-2xl border border-slate-100 z-[101] py-2 rounded-xl animate-zoom-in text-slate-800">
                  <button onClick={() => setIsOpen(false)} className="w-full px-4 py-2 text-left text-[10px] font-black uppercase hover:bg-slate-50 flex items-center gap-3"><Minimize2 size={12} className="text-slate-400" /> Fermer</button>
                  <button onClick={() => { setIsVoiceOn(!isVoiceOn); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-[10px] font-black uppercase hover:bg-slate-50 flex items-center gap-3">
                    {isVoiceOn ? <VolumeX size={12} className="text-slate-400" /> : <Volume2 size={12} className="text-slate-400" />} {isVoiceOn ? 'Voix Off' : 'Voix On'}
                  </button>
                  <button onClick={() => { setMessages([{ role: 'assistant', content: GREETING }]); setShowMenu(false); }} className="w-full px-4 py-2 text-left text-[10px] font-black uppercase hover:bg-slate-50 flex items-center gap-3 text-red-500"><Trash2 size={12} /> Reset</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex p-2 bg-black/5 gap-2 shrink-0 no-drag">
            <button onClick={() => setMode('CHAT')} className={`flex-1 py-1.5 text-[9px] font-black uppercase ${theme.buttonShape} flex items-center justify-center gap-2 transition-all ${mode === 'CHAT' ? theme.buttonPrimary : 'text-slate-400 opacity-50'}`}><MessageSquare size={12}/> Chat</button>
            <button onClick={() => setMode('REPORT')} className={`flex-1 py-1.5 text-[9px] font-black uppercase ${theme.buttonShape} flex items-center justify-center gap-2 transition-all ${mode === 'REPORT' ? theme.buttonPrimary : 'text-slate-400 opacity-50'}`}><FileText size={12}/> Rapport</button>
          </div>

          <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar no-drag ${themeType === 'glass' ? 'bg-transparent' : 'bg-slate-50/10'}`}>
            {mode === 'CHAT' ? (
              <div className="space-y-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 ${theme.buttonShape} text-[10px] font-medium leading-relaxed shadow-sm ${m.role === 'user' ? (themeType === 'glass' ? 'bg-white/20 text-white' : 'bg-primary text-white') : 'bg-white border border-slate-100 text-slate-700'}`}>
                      {m.role === 'assistant' ? stripMarkdown(m.content) : m.content}
                    </div>
                  </div>
                ))}
                {loading && <div className="text-center text-[9px] text-slate-400 font-bold italic flex items-center justify-center gap-2 animate-pulse"><Loader2 size={10} className="animate-spin" /> Zen'ô réfléchit...</div>}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center">
                {!reportText ? (
                  <div className="w-full space-y-4 animate-in fade-in">
                    <div className="space-y-2">
                      <CustomBulleSelect label="Année" value={reportYear} options={yearOptions} onChange={setReportYear} />
                      <CustomBulleSelect label="Projet" value={reportProjectId} options={projectOptions} onChange={setReportProjectId} />
                    </div>
                    <div className="flex flex-col items-center gap-2 py-4">
                      <button onClick={handleGenerateReport} disabled={loading} className={`w-full py-3 ${theme.buttonPrimary} ${theme.buttonShape} text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2`}>
                        {loading ? <Loader2 className="animate-spin" size={12}/> : <RefreshCcw size={12}/>} Générer le rapport
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={`text-[9px] ${theme.textMain} whitespace-pre-wrap font-sans bg-white/5 p-4 ${theme.buttonShape} border border-white/5 h-full overflow-y-auto text-left leading-relaxed`}>
                    {reportText}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-slate-100 no-drag">
            {mode === 'CHAT' ? (
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-2">
                <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-medium outline-none" placeholder="Message..." value={input} onChange={e => setInput(e.target.value)} />
                <button type="button" onClick={toggleListening} className={`p-2 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'} rounded-xl`}>{isListening ? <MicOff size={14}/> : <Mic size={14}/>}</button>
                <button type="submit" disabled={loading || !input.trim()} className={`p-2 ${theme.buttonPrimary} rounded-xl shadow-lg disabled:opacity-50`}><Send size={14}/></button>
              </form>
            ) : (
              reportText && (
                <div className="flex gap-2">
                   <button onClick={() => setReportText('')} className="flex-1 py-2 text-[9px] text-slate-400 font-black uppercase">Filtres</button>
                   <button onClick={downloadPDF} className={`flex-[2] py-2 ${theme.buttonPrimary} rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2`}><Download size={12}/> PDF</button>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};
