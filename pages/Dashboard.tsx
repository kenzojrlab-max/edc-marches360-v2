import React from 'react';
import { 
  TrendingUp, Filter, BarChart2, PieChart as PieChartIcon, 
  Activity, Briefcase, ChevronRight, Clock, AlertTriangle, 
  Layers, DollarSign
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Contextes
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useConfig } from '../contexts/ConfigContext';
import { useTheme } from '../contexts/ThemeContext';

// Hooks personnalisés
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMarketFilter } from '../hooks/useMarketFilter'; 

import { CustomBulleSelect } from '../components/CustomBulleSelect';

const formatCurrency = (val: number) => {
  if (val >= 1000000000) return (val / 1000000000).toFixed(1) + ' Mrd FCFA';
  if (val >= 1000000) return (val / 1000000).toFixed(0) + ' M FCFA';
  return val.toLocaleString();
};

export const Dashboard: React.FC = () => {
  const { markets } = useMarkets();
  const { projects } = useProjects();
  const { fonctions } = useConfig();
  const { theme, themeType } = useTheme();
  const navigate = useNavigate();

  // --- Filtres (via Hook) ---
  const {
    selectedYear, setSelectedYear,
    selectedProjectId, setSelectedProjectId,
    selectedFonction, setSelectedFonction,
    yearOptions,
    projectOptions,
    filteredMarkets
  } = useMarketFilter(markets, projects);

  // --- Stats (via Hook) - CORRECTION : On récupère les valeurs calculées ici ---
  const { 
    delayStats, funnelData, budgetStats, procedureData, functionStats, historicalData, COLORS,
    totalAvenants, ppmExecutionRate, alertsList 
  } = useDashboardStats(filteredMarkets, markets, projects);

  const yearsRange = React.useMemo(() => {
    const years = historicalData.map(d => parseInt(d.year));
    if (years.length === 0) return new Date().getFullYear().toString();
    return `${Math.min(...years)} - ${Math.max(...years)}`;
  }, [historicalData]);

  // --- Rendu ---
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 relative">
      
      {/* 1. BARRE DE FILTRES */}
      <div className={`${theme.card} p-6 flex flex-wrap items-center gap-6 mb-8 relative z-30`}>
        <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden md:flex`}>
          <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          <span className="text-xs font-black uppercase tracking-widest">Pilotage</span>
        </div>
        <div className="w-full md:w-40"><CustomBulleSelect label="Exercice" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
        <div className="w-full md:w-64"><CustomBulleSelect label="Projet" value={selectedProjectId} options={projectOptions} onChange={setSelectedProjectId} /></div>
        <div className="w-full md:w-64"><CustomBulleSelect label="Fonction" value={selectedFonction} options={fonctions.map(f=>({value:f, label:f}))} onChange={setSelectedFonction} placeholder="Toutes fonctions" /></div>
      </div>

      {/* 2. KPIs OPÉRATIONNELS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        <div className={`${theme.card} p-8 flex items-center justify-between hover:scale-[1.02] transition-transform`}>
           <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary} mb-2`}>Contractualisation</p>
              <h3 className={`text-3xl font-black ${theme.textMain}`}>{formatCurrency(budgetStats.signe)}</h3>
              <p className={`text-[10px] font-bold ${theme.textSecondary} mt-1`}>Sur <span className={theme.textAccent}>{formatCurrency(budgetStats.prevu)}</span> prévus</p>
           </div>
           <Activity size={32} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textAccent}`} />
        </div>

        <div className={`${theme.card} p-8 hover:scale-[1.02] transition-transform`}>
           <div className={`flex items-center gap-3 mb-2 text-warning`}>
              <AlertTriangle size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Qualité Études</p>
           </div>
           {/* CORRECTION : Affichage direct de la valeur calculée par le hook */}
           <h3 className={`text-3xl font-black ${theme.textMain}`}>
              {totalAvenants}
              <span className={`text-sm font-bold ${theme.textSecondary} ml-2`}>Avenants</span>
           </h3>
        </div>

        <div className={`${theme.card} p-8 hover:scale-[1.02] transition-transform`}>
           <div className={`flex items-center gap-3 mb-2 ${theme.textAccent}`}>
              <Activity size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Exécution PPM</p>
           </div>
           {/* CORRECTION : Affichage direct du pourcentage calculé par le hook */}
           <h3 className={`text-3xl font-black ${theme.textMain}`}>{ppmExecutionRate}%</h3>
        </div>

        <div className={`${theme.card} p-8 hover:scale-[1.02] transition-transform ${delayStats.real > delayStats.planned ? 'border-danger/50' : ''}`}>
           <div className={`flex items-center gap-3 mb-2`}>
              <Clock size={20} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${delayStats.real > delayStats.planned ? 'text-danger' : 'text-success'}`} />
              <p className={`text-[10px] font-black uppercase tracking-widest ${theme.textSecondary}`}>Délai Moyen</p>
           </div>
           <h3 className={`text-3xl font-black ${theme.textMain}`}>{delayStats.real}j</h3>
           <p className={`text-[10px] font-bold ${theme.textSecondary} mt-1`}>Objectif (Prévu) : {delayStats.planned}j</p>
        </div>
      </div>

      {/* 3. ANALYSE OPÉRATIONNELLE */}
      <h2 className={`${theme.textMain} text-xl font-black uppercase tracking-tight pl-4 border-l-4 border-primary relative z-10`}>
        Analyse Opérationnelle
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        <div className={`${theme.card} lg:col-span-2 p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`}><Filter size={18} /> Entonnoir de Conversion</h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:11, fontVariant:'small-caps', fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                   <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} />
                   <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                      {funnelData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                   </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className={`${theme.card} p-10`}>
           <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`}><PieChartIcon size={18} /> Santé des Procédures</h3>
           <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={procedureData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                       {procedureData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend iconType="circle" wrapperStyle={{fontSize:'11px', fontWeight:'bold', color: themeType === 'glass' ? '#fff' : '#000'}} />
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* 4. PERFORMANCE PAR FONCTION */}
      <h2 className={`${theme.textMain} text-xl font-black uppercase tracking-tight pl-4 border-l-4 border-accent relative z-10`}>
        Performance par Direction
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        <div className={`${theme.card} p-10`}>
           <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`}><Briefcase size={18} /> Exécution PPM par Fonction</h3>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={functionStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis dataKey="name" tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} axisLine={false} tickLine={false} dy={10} />
                    <YAxis hide />
                    <Tooltip />
                    <Legend wrapperStyle={{fontSize:'11px', fontWeight:'bold', paddingTop:'20px'}} />
                    <Bar dataKey="planifies" name="Programmés" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="lances" name="Lancés" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="signes" name="Signés" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={20} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className={`${theme.card} p-10`}>
           <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`}><DollarSign size={18} /> Poids Financier par Fonction</h3>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={functionStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="budgetPrevu" name="Prévu" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
                    <Bar dataKey="budgetSigne" name="Contracté" fill={COLORS.success} radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* 5. INTELLIGENCE STRATÉGIQUE */}
      <h2 className={`${theme.textMain} text-xl font-black uppercase tracking-tight pl-4 border-l-4 border-accent relative z-10`}>
        Intelligence Stratégique ({yearsRange})
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
         <div className={`${theme.card} p-10`}>
            <h3 className={`${theme.textMain} text-lg font-black mb-2 flex items-center gap-2`}><TrendingUp size={18} /> Évolution Performance PPM</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                     <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} unit="%" />
                     <Tooltip />
                     <Line type="monotone" dataKey="tauxExecution" stroke={COLORS.warning} strokeWidth={4} dot={{r: 6, strokeWidth:2, fill:'white'}} activeDot={{r: 8}} />
                  </LineChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className={`${theme.card} p-10`}>
            <h3 className={`${theme.textMain} text-lg font-black mb-2 flex items-center gap-2`}><BarChart2 size={18} /> Sources de Financement</h3>
            <div className="h-72">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historicalData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                     <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                     <YAxis hide />
                     <Tooltip formatter={(value: number) => formatCurrency(value)} />
                     <Bar dataKey="budgetEDC" name="EDC" stackId="a" fill={COLORS.primary} radius={[0, 0, 4, 4]} />
                     <Bar dataKey="budgetBailleur" name="Bailleurs" stackId="a" fill={COLORS.warning} radius={[10, 10, 0, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      {/* 6. ALERTES CRITIQUES */}
      <div className={`${theme.card} p-10 relative z-10`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-danger">
             <AlertTriangle size={24} />
             <h3 className={`text-lg font-black uppercase tracking-widest ${theme.textMain}`}>Alertes Critiques</h3>
          </div>
          <p className={`text-xs font-bold ${theme.textSecondary}`}>Dossiers en retard sur le planning prévisionnel</p>
        </div>
        <div className="space-y-4">
          {/* CORRECTION : Utilisation de la liste pré-filtrée par le hook */}
          {alertsList.map((m, i) => (
            <div key={i} onClick={() => navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`)} className={`flex items-center justify-between p-6 ${theme.buttonShape} bg-black/5 border border-white/5 hover:border-danger/30 transition-all cursor-pointer group`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 ${theme.card} flex items-center justify-center text-danger shadow-sm group-hover:scale-110 transition-transform`}><Clock size={20} /></div>
                <div>
                  <h4 className={`font-black ${theme.textMain} text-xs tracking-tight uppercase mb-1`}>{m.numDossier}</h4>
                  <p className={`text-[10px] font-bold ${theme.textSecondary} line-clamp-1`}>{m.objet}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-danger/10 text-danger rounded-full text-[9px] font-black uppercase tracking-widest">Retard</span>
                <ChevronRight size={18} className={theme.textSecondary} />
              </div>
            </div>
          ))}
          {alertsList.length === 0 && <div className="p-10 text-center text-slate-400 font-black uppercase italic text-xs">Aucune alerte en cours</div>}
        </div>
      </div>
    </div>
  );
};