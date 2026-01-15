import React, { useState, useEffect } from 'react';
import { Bot, X, MessageSquare, FileText, Minimize2, Maximize2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { sendMessageToGemini } from '../utils/aiAgent';
import { AIChatView } from './ai/AIChatView';
import { AIReportView } from './ai/AIReportView';

// Constantes Z-INDEX
const Z_INDEX_WIDGET = 'z-[9999]';

export const FloatingAIWidget: React.FC = () => {
  const { theme, themeType } = useTheme();
  const { markets } = useMarkets();
  const { projects } = useProjects();

  // États UI
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'CHAT' | 'REPORT'>('CHAT');

  // États Chat
  const [messages, setMessages] = useState<any[]>([
    { id: '1', role: 'assistant', content: "Bonjour, je suis Zen'ô, votre assistant virtuel. Comment puis-je vous aider dans l'analyse de vos marchés ?", timestamp: new Date() }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // États Rapport
  const [reportConfig, setReportConfig] = useState({ projectId: 'all', year: 'all', type: 'general' as const });
  const [generatedReport, setGeneratedReport] = useState('');
  const [isReportLoading, setIsReportLoading] = useState(false);

  // Gestionnaires CHAT
  const handleSendMessage = async (text: string) => {
    const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setIsChatLoading(true);

    try {
      const response = await sendMessageToGemini(text, markets, projects, 'CHAT');
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Désolé, une erreur est survenue.", timestamp: new Date() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([{ id: Date.now().toString(), role: 'assistant', content: "Conversation réinitialisée. En quoi puis-je vous aider ?", timestamp: new Date() }]);
  };

  // Gestionnaires RAPPORT
  const handleGenerateReport = async () => {
    setIsReportLoading(true);
    setGeneratedReport('');
    
    // Filtrage des données pour le rapport
    const filteredMarkets = markets.filter(m => {
      const p = projects.find(proj => proj.id === m.projet_id);
      const matchProject = reportConfig.projectId === 'all' || m.projet_id === reportConfig.projectId;
      const matchYear = reportConfig.year === 'all' || p?.exercice.toString() === reportConfig.year;
      return matchProject && matchYear;
    });

    const prompt = `Génère un rapport de type "${reportConfig.type}" pour ${filteredMarkets.length} marchés.`;
    
    try {
      const response = await sendMessageToGemini(prompt, filteredMarkets, projects, 'REPORT');
      setGeneratedReport(response);
    } catch (error) {
      setGeneratedReport("Erreur lors de la génération du rapport.");
    } finally {
      setIsReportLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-8 right-8 w-16 h-16 ${theme.buttonPrimary} rounded-full shadow-[0_0_40px_rgba(37,99,235,0.3)] flex items-center justify-center transition-all hover:scale-110 z-[100] animate-bounce-subtle`}
        title="Ouvrir l'Assistant IA"
      >
        <Bot size={32} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-8 right-8 w-[450px] ${isMinimized ? 'h-auto' : 'h-[700px]'} ${theme.card} rounded-[2rem] shadow-2xl border border-white/10 flex flex-col overflow-hidden transition-all duration-300 ${Z_INDEX_WIDGET} animate-in slide-in-from-bottom-10`}>
      {/* Header */}
      <div className={`p-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-blue-900/50 to-slate-900/50 backdrop-blur-md shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white backdrop-blur-sm">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Zen'ô AI</h3>
            <p className="text-[9px] text-blue-200 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"/> En ligne
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 text-white/60 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Navigation Tabs */}
          <div className="flex p-2 gap-2 bg-black/20 shrink-0">
            <button 
              onClick={() => setActiveTab('CHAT')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                activeTab === 'CHAT' ? `${theme.buttonPrimary} shadow-lg` : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <MessageSquare size={14} /> Assistant Chat
            </button>
            <button 
              onClick={() => setActiveTab('REPORT')}
              className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                activeTab === 'REPORT' ? `${theme.buttonPrimary} shadow-lg` : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <FileText size={14} /> Générateur
            </button>
          </div>

          {/* Contenu Principal */}
          <div className="flex-1 overflow-hidden relative">
            {activeTab === 'CHAT' ? (
              <AIChatView 
                messages={messages} 
                isLoading={isChatLoading} 
                onSend={handleSendMessage}
                onClear={handleClearChat}
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
  );
};