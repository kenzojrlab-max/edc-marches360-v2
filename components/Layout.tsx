import React, { useMemo, useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  PlayCircle, 
  Settings, 
  LogOut,
  Menu,
  Bell,
  Clock,
  CheckCircle,
  ChevronRight,
  Settings2,
  Library,
  Files,
  AlertTriangle,
  X,
  Palette,
  Zap,
  Monitor,
  Layers,
  GlassWater,
  User as UserIcon // Renommé pour éviter conflit avec le type User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useMarkets } from '../contexts/MarketContext';
import { useTheme, ThemeType } from '../contexts/ThemeContext';
import { JALONS_LABELS, JALONS_GROUPS } from '../constants';
import { calculateDaysBetween } from '../utils/date';
import { Marche, UserRole } from '../types';
import { FloatingAIWidget } from './FloatingAIWidget';

export const Layout: React.FC = () => {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const { markets } = useMarkets();
  const { theme, themeType, setThemeType } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const notificationRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

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
      if (m.is_annule || m.dates_realisees.notification) return;

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
    { type: 'clay', icon: Palette, label: 'Clay' },
    { type: 'retro', icon: Layers, label: 'Retro' },
    { type: 'glass', icon: GlassWater, label: 'Glass' }
  ];

  const getMenuBg = () => {
    if (themeType === 'glass') return 'bg-[#1a2333] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)]';
    if (themeType === 'cyber') return 'bg-[#0a1120] border border-cyan-500 shadow-[0_0_30px_rgba(6,182,212,0.2)]';
    return theme.card + ' shadow-2xl';
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', visible: true },
    { to: '/ppm-view', icon: FileText, label: 'Suivi Plan de Passation', visible: true },
    { to: '/documents', icon: Library, label: 'Documentation', visible: true },
    { to: '/ppm-manage', icon: Settings2, label: 'Gestion Plan de Passation', visible: isAdmin },
    { to: '/tracking', icon: Activity, label: 'Suivi des Marchés', visible: isAdmin },
    { to: '/execution', icon: PlayCircle, label: 'Exécution des Marchés', visible: isAdmin },
    { to: '/documents-manage', icon: Files, label: 'Gestion documentaire', visible: isSuperAdmin },
    { to: '/settings', icon: Settings, label: 'Paramètres', visible: isSuperAdmin },
    // NOUVEAU ITEM DE MENU
    { to: '/profile', icon: UserIcon, label: 'Mon Profil', visible: true },
  ].filter(item => item.visible);

  return (
    <div className={`flex h-screen overflow-hidden relative`}>
      {/* Sidebar - Z-INDEX CORRIGÉ: z-[1000] pour être au-dessus du Header et du contenu */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-[1000] transition-transform duration-300 transform
        lg:translate-x-0 lg:static lg:inset-auto
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 bg-white ${theme.buttonShape} flex items-center justify-center p-1 shadow-md overflow-hidden`}>
              <img 
                src="/logo.png" 
                alt="Logo EDC" 
                className="w-full h-full object-contain" 
              />
            </div>
            
            <div>
              <h1 className="text-lg font-bold leading-none text-white">EDC</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">Marchés 360</p>
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
              <span className="font-medium text-xs">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 ${theme.buttonShape} transition-all duration-200`}
          >
            <LogOut size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            <span className="font-medium text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Overlay Mobile - Z-INDEX CORRIGÉ: z-[999] */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header - Z-INDEX CORRIGÉ: z-[900] pour dépasser les filtres des pages (qui sont max z-[500]) */}
        <header className={`h-20 border-b border-white/10 flex items-center justify-between px-4 md:px-8 sticky top-0 z-[900] backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className={`p-2 ${theme.textSecondary} lg:hidden hover:bg-white/5 rounded-xl`}>
              <Menu size={24} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
            </button>
            <h2 className={`${theme.textMain} text-lg md:text-xl font-bold truncate uppercase tracking-tight`}>
              Bonjour, {user?.name?.split(' ')[0]}
            </h2>
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
                // Dropdown - Z-INDEX hérite du header (900) mais on met 60 pour stack context local
                <div className={`absolute top-full right-0 mt-2 w-52 ${getMenuBg()} z-[60] p-2 animate-zoom-in rounded-2xl`}>
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
                // Dropdown - Z-INDEX local
                <div className={`absolute top-full right-0 mt-2 w-80 md:w-96 ${getMenuBg()} z-[60] shadow-2xl animate-zoom-in p-2 rounded-2xl`}>
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
                        <p className={`${theme.textMain} text-[10px] font-bold line-clamp-1`}>{alert.market.objet}</p>
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
              onClick={() => navigate('/profile')} // Click rapide vers le profil
            >
              <div className="text-right hidden sm:block">
                <p className={`${theme.textMain} text-sm font-bold`}>{user?.name?.split(' ')[0]}</p>
                <p className={`${theme.textSecondary} text-[10px] uppercase font-bold tracking-tight`}>{user?.role?.replace('_', ' ')}</p>
              </div>
              <div className={`w-10 h-10 ${theme.buttonShape} overflow-hidden border-2 border-white/10 shadow-lg`}>
                {/* Utilisation de photoURL si dispo, sinon fallback vers picsum basé sur l'ID */}
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
          <Outlet />
        </section>

        {/* AJOUT DU WIDGET ASSISTANT IA - Z-INDEX 9999 (Doit rester au-dessus de tout) */}
        <FloatingAIWidget />

      </main>
    </div>
  );
};