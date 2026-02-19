import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, MessageSquare, FileText, Minimize2, Maximize2, Move } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { sendMessageToGemini, getGreetingByTime } from '../utils/aiAgent';
import { AIChatView } from './ai/AIChatView';
import { AIReportView } from './ai/AIReportView';

// Constantes
const Z_INDEX_WIDGET = 9999;
const WINDOW_HEIGHT = 440; // Hauteur restaurée

export const FloatingAIWidget: React.FC = () => {
  const { theme, themeType } = useTheme();
  const { markets } = useMarkets();
  const { projects } = useProjects();

  // --- ÉTATS DE POSITION & UI ---
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'REPORT'>('CHAT');

  // Positions indépendantes (Restauration)
  const [iconPos, setIconPos] = useState({ x: window.innerWidth - 100, y: window.innerHeight - 150 });
  const [windowPos, setWindowPos] = useState({ x: 0, y: 0 });
  
  const [isDraggingIcon, setIsDraggingIcon] = useState(false);
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const dragStartPos = useRef({ x: 0, y: 0 });
  const hasMoved = useRef(false);

  // --- ÉTATS CHAT & VOIX ---
  // CORRECTION : Message initial avec salutation dynamique
  const [messages, setMessages] = useState<any[]>([
    { id: '1', role: 'assistant', content: `${getGreetingByTime()}, je suis Zen'ô l'Assistant Virtuel pour l'application EDC Marchés360` }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Voice States (Restauration)
  const [isVoiceOn, setIsVoiceOn] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [language] = useState('fr-FR'); // Par défaut français

  // AJOUT : Référence pour stocker l'instance de reconnaissance vocale
  const recognitionRef = useRef<any>(null);

  // --- ÉTATS RAPPORT ---
  const [reportConfig, setReportConfig] = useState({ projectId: 'all', year: 'all', type: 'general' as const });
  const [generatedReport, setGeneratedReport] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);

  // --- LOGIQUE DE POSITIONNEMENT (Initialisation) ---
  useEffect(() => {
    if (isOpen) {
      const isMobile = window.innerWidth < 768;
      const w = isMobile ? window.innerWidth * 0.95 : 360; // Largeur fixe desktop
      const h = isMobile ? Math.min(window.innerHeight * 0.7, WINDOW_HEIGHT) : WINDOW_HEIGHT;
      
      let nx, ny;
      if (isMobile) {
        nx = (window.innerWidth - w) / 2;
        ny = (window.innerHeight - h) / 2;
      } else {
        // Position initiale par défaut : centré ou près de l'icône mais indépendant
        nx = Math.max(20, window.innerWidth - 400); 
        ny = Math.max(20, window.innerHeight - 500);
      }
      setWindowPos({ x: nx, y: ny });
    }
  }, [isOpen]);

  // AJOUT : Nettoyage automatique au démontage du composant
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // --- GESTION DU DRAG & DROP ---
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
        setWindowPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y
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

  // --- LOGIQUE VOCALE (Restauration) ---
  const stripMarkdown = (text: string) => {
    // Nettoyage agressif pour la synthèse vocale
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
    // CORRECTION ICI : Utilisation de webkitSpeechRecognition au lieu de webkitRecognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
      return;
    }
    
    // MODIFICATION : Utilisation de la ref pour arrêter proprement
    if (isListening) { 
      recognitionRef.current?.stop();
      setIsListening(false); 
      return; 
    }
    
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition; // Stockage dans la ref
    
    recognition.lang = language;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    // AUTO-ENVOI RESTAURÉ
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        handleSendMessage(transcript); // Envoi direct
      }
    };
    recognition.start();
  };

  // CORRECTION : Fonction dédiée pour activer/désactiver la voix
  const handleToggleVoice = () => {
    setIsVoiceOn(prev => !prev);
    // Si on désactive la voix, on arrête toute lecture en cours
    if (isVoiceOn) {
      window.speechSynthesis.cancel();
    }
  };

  // --- GESTIONNAIRES CHAT ---
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      // Construire l'historique de conversation (exclure le message d'accueil initial)
      const history = messages.slice(1).map(m => ({ role: m.role, content: m.content }));

      const response = await sendMessageToGemini(text, markets, projects, 'CHAT', history);
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      speak(response); // Lecture vocale de la réponse
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Désolé, une erreur est survenue.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    // CORRECTION : Message de réinitialisation avec salutation dynamique
    const resetMsg = `${getGreetingByTime()}, conversation réinitialisée. En quoi puis-je vous aider ?`;
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: resetMsg, timestamp: new Date() }]);
    speak(resetMsg);
  };

  // --- GESTIONNAIRES RAPPORT ---
  const handleGenerateReport = async () => {
    setIsReportLoading(true);
    setGeneratedReport('');
    
    // CORRECTION : Filtrage des marchés selon la configuration
    const filteredMarkets = markets.filter(m => {
      const p = projects.find(proj => proj.id === m.projet_id);
      const matchProject = reportConfig.projectId === 'all' || m.projet_id === reportConfig.projectId;
      const matchYear = reportConfig.year === 'all' || p?.exercice.toString() === reportConfig.year;
      return matchProject && matchYear;
    });

    // CORRECTION : Vérification si des marchés existent
    if (filteredMarkets.length === 0) {
      setGeneratedReport("❌ Aucun marché ne correspond aux critères sélectionnés. Veuillez modifier vos filtres.");
      setIsReportLoading(false);
      return;
    }

    // CORRECTION : Prompt détaillé avec informations sur les filtres
    const projectName = reportConfig.projectId === 'all' 
      ? 'TOUS LES PROJETS' 
      : projects.find(p => p.id === reportConfig.projectId)?.libelle || 'Projet inconnu';
    
    const yearText = reportConfig.year === 'all' ? 'TOUTES LES ANNÉES' : `ANNÉE ${reportConfig.year}`;
    
    const reportTypeText = reportConfig.type === 'general' 
      ? 'SYNTHÈSE GÉNÉRALE' 
      : reportConfig.type === 'execution' 
      ? 'SUIVI D\'EXÉCUTION' 
      : 'RAPPORT DES RISQUES';

    const prompt = `
      Génère un rapport professionnel de type : ${reportTypeText}
      
      PÉRIMÈTRE DU RAPPORT :
      - Projet : ${projectName}
      - Exercice : ${yearText}
      - Nombre de marchés à analyser : ${filteredMarkets.length}
      
      CONSIGNE : Analyse en détail TOUS les ${filteredMarkets.length} marchés fournis. 
      Ne te limite pas, produis un rapport complet et exhaustif.
    `;
    
    try {
      const response = await sendMessageToGemini(prompt, filteredMarkets, projects, 'REPORT');
      setGeneratedReport(response);
      if (isVoiceOn) speak("Le rapport a été généré avec succès.");
    } catch (error) {
      setGeneratedReport("Erreur lors de la génération du rapport.");
    } finally {
      setIsReportLoading(false);
    }
  };

  // Styles dynamiques pour la fenêtre
  const windowStyle: React.CSSProperties = {
    position: 'fixed',
    left: windowPos.x,
    top: windowPos.y,
    width: window.innerWidth < 768 ? '95vw' : '360px',
    height: isMinimized ? 'auto' : `${WINDOW_HEIGHT}px`, // Hauteur 440px
    zIndex: Z_INDEX_WIDGET
  };

  // --- RENDU ---
  return (
    <>
      {/* ICÔNE FLOTTANTE (Indépendante) */}
      {!isOpen && (
        <div
          onMouseDown={onIconMouseDown}
          onClick={() => !hasMoved.current && setIsOpen(true)}
          style={{ left: iconPos.x, top: iconPos.y, zIndex: Z_INDEX_WIDGET }}
          className={`fixed w-16 h-16 cursor-pointer hover:scale-110 transition-transform active:scale-95 ${theme.buttonShape} overflow-hidden shadow-2xl border-2 border-white/20 ring-2 ring-black/5 ${themeType === 'glass' ? 'bg-white/20 backdrop-blur-md' : theme.buttonPrimary} flex items-center justify-center`}
        >
          <Bot size={32} className="text-white" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>
      )}

      {/* FENÊTRE CHATBOT (Indépendante) */}
      {isOpen && (
        <div style={windowStyle} className={`${theme.card} rounded-[1.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden animate-in zoom-in-95 border border-white/10`}>
          
          {/* HEADER (Zone de Drag) */}
          <div 
            onMouseDown={onWindowMouseDown}
            className={`p-3 border-b border-white/5 flex items-center justify-between cursor-move bg-gradient-to-r from-blue-900/50 to-slate-900/50 backdrop-blur-md shrink-0`}
          >
            <div className="flex items-center gap-3 no-drag pointer-events-none">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white backdrop-blur-sm">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider" style={{ fontFamily: "'Poppins', sans-serif" }}>Zen'ô AI</h3>
                <p className="text-[8px] text-blue-200 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> Connecté
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 no-drag">
              {/* Indicateur de drag */}
              <div className="mr-2 text-white/20 cursor-move"><Move size={14}/></div>
              
              <button onClick={() => setIsMinimized(!isMinimized)} className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* TABS */}
              <div className="flex p-1.5 gap-1.5 bg-black/20 shrink-0 no-drag">
                <button 
                  onClick={() => setActiveTab('CHAT')}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'CHAT' ? `${theme.buttonPrimary} shadow-lg` : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <MessageSquare size={12} /> Chat
                </button>
                <button 
                  onClick={() => setActiveTab('REPORT')}
                  className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                    activeTab === 'REPORT' ? `${theme.buttonPrimary} shadow-lg` : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <FileText size={12} /> Rapport
                </button>
              </div>

              {/* CONTENU */}
              <div className="flex-1 overflow-hidden relative no-drag">
                {activeTab === 'CHAT' ? (
                  <AIChatView 
                    messages={messages} 
                    isLoading={isChatLoading} 
                    onSend={handleSendMessage}
                    onClear={handleClearChat}
                    isVoiceOn={isVoiceOn}
                    toggleVoice={handleToggleVoice}
                    isListening={isListening}
                    toggleListening={toggleListening}
                  />
                ) : (
                  <AIReportView 
                    config={reportConfig}
                    setConfig={setReportConfig}
                    isGenerating={isReportLoading}
                    generatedReport={generatedReport}
                    onGenerate={handleGenerateReport}
                    projects={projects}
                    markets={markets}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};