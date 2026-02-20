import React, { Suspense, useMemo, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Activity, PlayCircle, Settings, LogOut,
  Menu, Bell, Clock, CheckCircle, ChevronRight, Settings2, Library,
  Files, AlertTriangle, X, Palette, Zap, Monitor, Layers, GlassWater,
  User as UserIcon, Hammer, ClipboardCheck, Rocket, BarChart3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMarkets } from '../contexts/MarketContext';
import { useTheme, ThemeType } from '../contexts/ThemeContext';
import { JALONS_LABELS, JALONS_GROUPS } from '../constants';
import { calculateDaysBetween } from '../utils/date';
import { Marche } from '../types';
import { FloatingAIWidget } from './FloatingAIWidget';
import { TruncatedText } from './TruncatedText';
import { OfflineBanner } from './OfflineBanner';
import { useToast } from '../contexts/ToastContext';

export const Layout: React.FC = () => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { markets } = useMarkets();
  const { theme, themeType, setThemeType } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const notificationRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      toast.error("Erreur lors de la déconnexion.");
    }
    navigate('/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // ============================================================
  // CORRECTION : Logique des alertes identique au tableau du Dashboard
  // On exclut maintenant : Annulé, Infructueux, Résilié, et Signé
  // ============================================================
  const alerts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const activeAlerts: Array<{
      market: Marche,
      jalonLabel: string,
      jalonKey: string,
      delay: number
    }> = [];

    const jalonsKeys = JALONS_GROUPS.flatMap(g => g.keys);

    markets.forEach(m => {
      // ============================================================
      // AVANT (incomplet) :
      // if (m.is_annule || m.dates_realisees.notification) return;
      //
      // APRÈS (correction) :
      // On exclut les marchés qui sont :
      // - Annulés (is_annule)
      // - Infructueux (is_infructueux)
      // - Résiliés (execution?.is_resilie)
      // - Déjà signés (dates_realisees.signature_marche)
      // ============================================================
      if (m.is_annule || m.is_infructueux || m.execution?.is_resilie || m.dates_realisees.signature_marche) {
        return; // On ignore ce marché, pas d'alerte
      }

      jalonsKeys.forEach(key => {
        const prevue = m.dates_prevues[key as keyof typeof m.dates_prevues];
        const realisee = m.dates_realisees[key as keyof typeof m.dates_realisees];

        if (prevue && !realisee && today > prevue) {
           const delay = calculateDaysBetween(prevue, today);
           activeAlerts.push({
             market: m,
             jalonLabel: JALONS_LABELS[key] || key,
             jalonKey: key,
             delay: delay
           });
        }
      });
    });

    return activeAlerts.sort((a, b) => b.delay - a.delay);
  }, [markets]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowThemePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { type: ThemeType; icon: any; label: string }[] = [
    { type: 'minimal', icon: Monitor, label: 'Minimal' },
    { type: 'cyber', icon: Zap, label: 'Cyber' },
    { type: 'retro', icon: Layers, label: 'Retro' },
    { type: 'glass', icon: GlassWater, label: 'Glass' },
    { type: 'metal', icon: Hammer, label: 'Metal' }
  ];

  const getMenuBg = () => {
    if (themeType === 'glass') return 'bg-[#1a2333] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)]';
    if (themeType === 'cyber') return 'bg-[#0a1120] border border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]';
    if (themeType === 'metal') return 'bg-gradient-to-b from-[#636e72] to-[#2d3436] border border-slate-600 shadow-[5px_5px_15px_rgba(0,0,0,0.8)]';
    return theme.card + ' shadow-2xl';
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', visible: true },
    { to: '/ppm-view', icon: FileText, label: 'Suivi Plan de Passation', visible: true },
    { to: '/execution-tracking', icon: ClipboardCheck, label: 'Suivi Exécution Marchés', visible: true },
    { to: '/execution-tracking-v2', icon: BarChart3, label: 'Suivi Exécution V2', visible: true },
    { to: '/documents', icon: Library, label: 'Documentation', visible: true },
    { to: '/ppm-manage', icon: Settings2, label: 'Gestion Plan de Passation', visible: isAdmin },
    { to: '/tracking', icon: Activity, label: 'Suivi des Marchés', visible: isAdmin },
    { to: '/execution', icon: PlayCircle, label: 'Exécution des Marchés', visible: isAdmin },
    { to: '/execution-v2', icon: Rocket, label: 'Saisie Exécution V2', visible: isAdmin },
    { to: '/documents-manage', icon: Files, label: 'Gestion documentaire', visible: isSuperAdmin },
    { to: '/settings', icon: Settings, label: 'Paramètres', visible: isSuperAdmin },
    { to: '/profile', icon: UserIcon, label: 'Mon Profil', visible: true },
  ].filter(item => item.visible);

  return (
    <div className={`flex h-screen overflow-hidden relative`}>
      <OfflineBanner />
      {/* Effet d'arrière-plan pour le thème Metal */}
      {themeType === 'metal' && (
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800/50 via-slate-700/30 to-slate-900/50"></div>
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-600/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-slate-500/10 via-transparent to-transparent"></div>
        </div>
      )}

      {/* Sidebar - Z-Index 50 pour être au-dessus du Header (40) mais sous la Modale (60+) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-50 transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-white ${theme.buttonShape} flex items-center justify-center p-1 shadow-md overflow-hidden`}>
              <img src="/logo.png" alt="Logo EDC" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>EDC</h1>
              <p className="text-xs text-slate-400 font-semibold tracking-widest uppercase" style={{ fontFamily: "'DM Sans', sans-serif" }}>Marchés 360</p>
            </div>
          </div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-white">
            <X size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 ${theme.buttonShape} transition-all duration-200 group ${
                  isActive ? `${theme.buttonPrimary} shadow-lg` : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
              <span className="font-semibold text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 ${theme.buttonShape} transition-all duration-200`}
          >
            <LogOut size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="font-semibold text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay Mobile - Z-Index 45 (Sous la sidebar mais sur le reste) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Z-Index 40 */}
        <header className={`h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40 backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 ${theme.textSecondary} lg:hidden hover:bg-white/5 rounded-xl`}>
              <Menu size={24} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            </button>
            <div className="flex flex-col justify-center">
              <h2 className={`${theme.textMain} text-lg md:text-xl font-bold uppercase tracking-tight leading-none`} style={{ fontFamily: "'Poppins', sans-serif" }}>
                Bonjour, {user?.name?.split(' ')[0]}
              </h2>
              <p className={`${theme.textSecondary} text-xs font-bold uppercase tracking-widest mt-0.5 animate-in fade-in`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
                {user?.fonction || ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            {/* Theme Picker */}
            <div className="relative" ref={themeRef}>
              <button 
                onClick={() => setShowThemePicker(!showThemePicker)} 
                className={`p-2.5 hover:bg-white/5 ${theme.buttonShape} transition-all flex items-center gap-2 ${theme.textSecondary}`}
              >
                <Palette size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Thème</span>
              </button>
              {showThemePicker && (
                <div className={`absolute top-full right-0 mt-2 w-52 ${getMenuBg()} z-[200] p-2 animate-zoom-in rounded-2xl`}>
                   {themeOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => { setThemeType(opt.type); setShowThemePicker(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-1 ${
                        themeType === opt.type 
                          ? (themeType === 'glass' ? 'bg-white/20 text-white' : theme.buttonPrimary) 
                          : `hover:bg-white/10 ${themeType === 'glass' ? 'text-white' : theme.textMain}`
                      }`}
                    >
                      <opt.icon size={16} strokeWidth={theme.iconStroke} />
                      {opt.label}
                    </button>
                   ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button onClick={() => setShowNotifications(!showNotifications)} className={`relative p-2.5 hover:bg-white/5 ${theme.buttonShape} transition-all`}>
                <Bell size={20} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textSecondary}`} />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full ring-2 ring-slate-900">
                    {alerts.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className={`absolute top-full right-0 mt-2 w-80 md:w-96 ${getMenuBg()} z-[200] shadow-2xl animate-zoom-in p-2 rounded-2xl`}>
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className={`${theme.textMain} font-black text-[10px] uppercase tracking-widest`}>Alertes PPM ({alerts.length})</h3>
                    <AlertTriangle size={14} className="text-red-500" />
                  </div>
                  <div className="max-h-96 overflow-y-auto custom-scrollbar p-1">
                    {alerts.length > 0 ? alerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          navigate(`/ppm-view?id=${encodeURIComponent(alert.market.id)}`);
                          setShowNotifications(false);
                        }}
                        className={`p-3 mb-1 rounded-xl hover:bg-white/10 cursor-pointer border border-transparent transition-all`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-[9px] font-black text-red-500 uppercase">{alert.market.numDossier}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase">{alert.delay}j retard</span>
                        </div>
                        <TruncatedText text={alert.market.objet} as="p" className={`${theme.textMain} text-[10px] font-bold line-clamp-1`} />
                        <p className={`${theme.textSecondary} text-[9px] mt-1`}>Jalon : {alert.jalonLabel}</p>
                      </div>
                    )) : (
                      <div className="py-8 text-center">
                        <CheckCircle size={24} className="mx-auto text-success/30 mb-2" />
                        <p className={`${theme.textSecondary} text-[10px] font-black uppercase tracking-widest`}>Aucune alerte</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div 
              className={`flex items-center gap-3 border-l border-white/10 pl-4 cursor-pointer`}
              onClick={() => navigate('/profile')} 
            >
              <div className="text-right hidden sm:block">
                <p className={`${theme.textMain} text-sm font-bold`} style={{ fontFamily: "'Poppins', sans-serif" }}>{user?.name?.split(' ')[0]}</p>
                <p className={`${theme.textSecondary} text-xs uppercase font-bold tracking-tight`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className={`w-10 h-10 ${theme.buttonShape} overflow-hidden border-2 border-white/10 shadow-lg`}>
                <img 
                  src={user?.photoURL || `https://picsum.photos/seed/${user?.id}/100`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Suspense fallback={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-blue-500" />
            </div>
          }>
            <Outlet />
          </Suspense>
        </section>

        {/* Widget IA - Z-Index 100 (Très haut mais sous les modales) */}
        <FloatingAIWidget />

      </main>
    </div>
  );
};