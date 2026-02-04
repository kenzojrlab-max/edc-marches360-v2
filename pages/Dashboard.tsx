import React from 'react';
import {
  TrendingUp, BarChart2, Activity, Briefcase, ChevronRight, Clock, AlertTriangle,
  Layers, DollarSign, FileStack, Gavel, Ban
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Legend, LineChart, Line
} from 'recharts';
import { useNavigate } from 'react-router-dom';

// Contextes
import { useMarkets } from '../contexts/MarketContext';
import { useProjects } from '../contexts/ProjectContext';
import { useTheme } from '../contexts/ThemeContext';

// Hooks personnalisés
import { useDashboardStats } from '../hooks/useDashboardStats';
import { useMarketFilter } from '../hooks/useMarketFilter'; 

import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { TruncatedText } from '../components/TruncatedText';

// Fonction de formatage exacte (pas d'arrondi)
const formatCurrency = (val: number) => {
  return val.toLocaleString('fr-FR') + ' FCFA';
};

export const Dashboard: React.FC = () => {
  const { markets } = useMarkets();
  const { projects } = useProjects();
  const { theme, themeType } = useTheme();
  const navigate = useNavigate();

  // --- Filtres (via Hook) ---
  const {
    selectedYear, setSelectedYear,
    selectedFinancement, setSelectedFinancement,
    selectedFonction, setSelectedFonction,
    yearOptions,
    financementOptions,
    fonctionOptions,
    filteredMarkets
  } = useMarketFilter(markets, projects);

  // --- Stats (via Hook) ---
  const {
    volumeStats, budgetStats, executionRateStats, delayStats, recoursStats, failureStats,
    alertsList, marchesSignesParExercice, tauxExecutionParExercice, executionPPMParFonction,
    tauxBudgetaireParFonction, COLORS
  } = useDashboardStats(filteredMarkets, markets, projects);

  // État pour l'analyseur dynamique
  const [analyseMetrique, setAnalyseMetrique] = React.useState<'volume' | 'budget' | 'delai' | 'taux'>('volume');
  const [analyseDimension, setAnalyseDimension] = React.useState<'fonction' | 'procedure' | 'financement'>('fonction');

  // Données dynamiques pour l'analyseur
  const dynamicAnalyseData = React.useMemo(() => {
    const groupKey = analyseDimension === 'fonction' ? 'fonction' :
                     analyseDimension === 'procedure' ? 'typeAO' : 'source_financement';

    const groups = new Map<string, { name: string; volume: number; budget: number; delai: number; taux: number; count: number }>();

    filteredMarkets.forEach(m => {
      const key = (m[groupKey as keyof typeof m] || 'Non défini').toString();
      if (!groups.has(key)) {
        groups.set(key, { name: key, volume: 0, budget: 0, delai: 0, taux: 0, count: 0 });
      }
      const g = groups.get(key)!;
      g.volume++;
      g.budget += m.montant_prevu || 0;
      g.count++;
      if (m.dates_realisees.signature_marche) {
        g.taux++;
      }
    });

    return Array.from(groups.values()).map(g => ({
      ...g,
      taux: g.count > 0 ? Math.round((g.taux / g.count) * 100) : 0
    }));
  }, [filteredMarkets, analyseDimension]);

  // --- Rendu ---
  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 relative">
      
      {/* 1. BARRE DE FILTRES */}
      <div className={`${theme.card} p-6 flex flex-wrap items-center gap-6 mb-8 relative z-30`}>
        <div className={`flex items-center gap-3 ${theme.textSecondary} border-r border-white/10 pr-6 hidden md:flex`}>
          <Layers size={20} strokeWidth={theme.iconStroke} className={theme.iconStyle} />
          <span className="text-xs font-black uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pilotage</span>
        </div>
        <div className="w-full md:w-40"><CustomBulleSelect label="Exercice" value={selectedYear} options={yearOptions} onChange={setSelectedYear} /></div>
        <div className="w-full md:w-64"><CustomBulleSelect label="Financement" value={selectedFinancement} options={financementOptions} onChange={setSelectedFinancement} /></div>
        <div className="w-full md:w-64"><CustomBulleSelect label="Fonction" value={selectedFonction} options={fonctionOptions} onChange={setSelectedFonction} /></div>
      </div>

      {/* 2. GRILLE DES KPIs (6 CARTES) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        
        {/* KPI 1 : Nombre de Marchés prévus au PPM */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Nombre de Marchés prévus au PPM</p>
              <FileStack size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textSecondary}`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{volumeStats.prevu}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Prévus</span>
              </div>
              <p className={`text-sm font-bold ${theme.textAccent} mt-2 flex items-center gap-1`}>
                 <span className="bg-primary/10 px-2 py-0.5 rounded">{volumeStats.realise}</span> consultations lancées
              </p>
           </div>
        </div>

        {/* KPI 2 : Volume total des marchés */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Volume total des marchés</p>
              <DollarSign size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-success`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 {/* Augmentation de la taille ici pour meilleure visibilité */}
                 <h3 className={`text-3xl font-black ${theme.textMain}`}>{formatCurrency(budgetStats.prevu)}</h3>
              </div>
              <p className={`text-xs font-bold ${theme.textSecondary} uppercase mt-1`}>Volume Prévu</p>
              <div className="mt-3 pt-3 border-t border-white/5">
                 <p className={`text-sm font-bold ${theme.textAccent}`}>
                    Réalisé : {formatCurrency(budgetStats.realise)}
                 </p>
              </div>
           </div>
        </div>

        {/* KPI 3 : Taux d’exécution du PPM */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Taux d’exécution du PPM</p>
              <Activity size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${theme.textAccent}`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{executionRateStats.realise}%</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Réalisé</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Objectif cible : <span className={theme.textMain}>{executionRateStats.prevu}%</span>
              </p>
           </div>
        </div>

        {/* KPI 4 : Délais moyen de Passation */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full ${delayStats.realise > delayStats.prevu ? 'border-danger/30' : ''}`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Délais moyen de Passation</p>
              <Clock size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} ${delayStats.realise > delayStats.prevu ? 'text-danger' : 'text-success'}`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain} ${delayStats.realise > delayStats.prevu ? 'text-danger' : ''}`}>{delayStats.realise}j</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Réalisé</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Délai règlementaire : {delayStats.prevu}j
              </p>
           </div>
        </div>

        {/* KPI 5 : Nombre (et %) de recours enregistré */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Nombre (et %) de recours</p>
              <Gavel size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-blue-500`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{recoursStats.realise}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Enregistrés</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Soit <span className="text-blue-500 font-black">{recoursStats.rate}%</span> des procédures
              </p>
           </div>
        </div>

        {/* KPI 6 : Nombre de procédures infructueuses ou annulées */}
        <div className={`${theme.card} p-8 flex flex-col justify-between hover:scale-[1.02] transition-transform h-full`}>
           <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-black uppercase tracking-widest ${theme.textSecondary}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Procédures infructueuses / annulées</p>
              <Ban size={24} strokeWidth={theme.iconStroke} className={`${theme.iconStyle} text-danger`} />
           </div>
           <div>
              <div className="flex items-baseline gap-2">
                 <h3 className={`text-4xl font-black ${theme.textMain}`}>{failureStats.realise}</h3>
                 <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Dossiers</span>
              </div>
              <p className={`text-sm font-bold ${theme.textSecondary} mt-2`}>
                 Objectif tolérance : {failureStats.prevu}
              </p>
           </div>
        </div>

      </div>

      {/* 3. ALERTES CRITIQUES */}
      <div className={`${theme.card} p-10 relative z-10`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-danger">
             <AlertTriangle size={24} />
             <h3 className={`text-xl font-black uppercase tracking-widest ${theme.textMain}`} style={{ fontFamily: "'Poppins', sans-serif" }}>Alertes Critiques</h3>
          </div>
          <p className={`text-sm font-bold ${theme.textSecondary}`}>Dossiers en retard sur le planning prévisionnel</p>
        </div>
        <div className="space-y-4 max-h-80 overflow-y-auto custom-scrollbar">
          {alertsList.map((m, i) => (
            <div key={i} onClick={() => navigate(`/ppm-view?id=${encodeURIComponent(m.id)}`)} className={`flex items-center justify-between p-6 ${theme.buttonShape} bg-black/5 border border-white/5 hover:border-danger/30 transition-all cursor-pointer group`}>
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 ${theme.card} flex items-center justify-center text-danger shadow-sm group-hover:scale-110 transition-transform`}><Clock size={20} /></div>
                <div>
                  <h4 className={`font-black ${theme.textMain} text-sm tracking-tight uppercase mb-1`}>{m.numDossier}</h4>
                  <TruncatedText text={m.objet} as="p" className={`text-xs font-bold ${theme.textSecondary} line-clamp-1`} />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-4 py-1.5 bg-danger/10 text-danger rounded-full text-xs font-black uppercase tracking-widest">Retard</span>
                <ChevronRight size={18} className={theme.textSecondary} />
              </div>
            </div>
          ))}
          {alertsList.length === 0 && <div className="p-10 text-center text-slate-400 font-black uppercase italic text-sm">Aucune alerte en cours</div>}
        </div>
      </div>

      {/* 4. ANALYSE OPÉRATIONNELLE */}
      <h2 className={`${theme.textMain} text-xl font-black uppercase tracking-tight pl-4 border-l-4 border-primary relative z-10`} style={{ fontFamily: "'Poppins', sans-serif" }}>
        Analyse Opérationnelle
      </h2>

      {/* Courbes: Marchés signés et Taux d'exécution PPM par exercice */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Courbe 1: Nombre de marchés signés par exercice */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <TrendingUp size={18} /> Marchés Signés par Exercice
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marchesSignesParExercice} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} />
                <Line type="monotone" dataKey="signes" name="Marchés signés" stroke={COLORS.success} strokeWidth={4} dot={{r: 6, strokeWidth:2, fill:'white'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Courbe 2: Taux d'exécution du PPM par exercice */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Activity size={18} /> Taux d'Exécution PPM par Exercice
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tauxExecutionParExercice} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize:11, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} formatter={(value: number) => [`${value}%`, 'Taux']} />
                <Line type="monotone" dataKey="tauxExecution" name="Taux d'exécution" stroke={COLORS.warning} strokeWidth={4} dot={{r: 6, strokeWidth:2, fill:'white'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Graphiques par fonction */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
        {/* Exécution du PPM par fonction analytique */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Briefcase size={18} /> Exécution PPM par Fonction Analytique
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionPPMParFonction} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="name" tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} axisLine={false} tickLine={false} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} />
                <Legend wrapperStyle={{fontSize:'11px', fontWeight:'bold', paddingTop:'20px'}} />
                <Bar dataKey="planifies" name="Programmés" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="lances" name="Lancés" fill={COLORS.primary} radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="signes" name="Signés" fill={COLORS.success} radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Taux d'exécution budgétaire par fonction */}
        <div className={`${theme.card} p-10`}>
          <h3 className={`${theme.textMain} text-lg font-black mb-6 flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <DollarSign size={18} /> Taux d'Exécution Budgétaire par Fonction
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tauxBudgetaireParFonction} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}} formatter={(value: number, name: string) => [name === 'tauxExecution' ? `${value}%` : formatCurrency(value), name === 'budgetProgramme' ? 'Budget Programmé' : name === 'budgetExecute' ? 'Budget Exécuté' : 'Taux']} />
                <Legend wrapperStyle={{fontSize:'11px', fontWeight:'bold', paddingTop:'20px'}} />
                <Bar dataKey="budgetProgramme" name="Budget Programmé" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={16} />
                <Bar dataKey="budgetExecute" name="Budget Exécuté" fill={COLORS.success} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Analyseur Dynamique */}
      <div className={`${theme.card} p-10 relative z-10`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <h3 className={`${theme.textMain} text-lg font-black flex items-center gap-2`} style={{ fontFamily: "'Poppins', sans-serif" }}>
            <BarChart2 size={18} /> Analyseur Dynamique
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Métrique:</span>
              <div className="flex gap-1">
                {[
                  { key: 'volume', label: 'Volume' },
                  { key: 'budget', label: 'Budget' },
                  { key: 'delai', label: 'Délai' },
                  { key: 'taux', label: 'Taux' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setAnalyseMetrique(opt.key as any)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                      analyseMetrique === opt.key
                        ? 'bg-primary text-white'
                        : `${theme.buttonShape} ${theme.textSecondary} hover:bg-white/10`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold ${theme.textSecondary} uppercase`}>Par:</span>
              <div className="flex gap-1">
                {[
                  { key: 'fonction', label: 'Fonction' },
                  { key: 'procedure', label: 'Procédure' },
                  { key: 'financement', label: 'Financement' }
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setAnalyseDimension(opt.key as any)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase rounded-lg transition-all ${
                      analyseDimension === opt.key
                        ? 'bg-accent text-white'
                        : `${theme.buttonShape} ${theme.textSecondary} hover:bg-white/10`
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dynamicAnalyseData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeType === 'glass' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{fontSize:10, fontWeight:'bold', fill: themeType === 'glass' || themeType === 'cyber' ? '#fff' : COLORS.slate}}
                angle={-25}
                textAnchor="end"
                height={60}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{borderRadius:'16px', background: '#0a1120', border:'none', color: '#fff'}}
                formatter={(value: number) => analyseMetrique === 'budget' ? formatCurrency(value) : analyseMetrique === 'taux' ? `${value}%` : value}
              />
              <Bar
                dataKey={analyseMetrique}
                fill={analyseMetrique === 'volume' ? COLORS.primary : analyseMetrique === 'budget' ? COLORS.success : analyseMetrique === 'delai' ? COLORS.warning : COLORS.danger}
                radius={[8, 8, 0, 0]}
                barSize={40}
              >
                {dynamicAnalyseData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={analyseMetrique === 'volume' ? COLORS.primary : analyseMetrique === 'budget' ? COLORS.success : analyseMetrique === 'delai' ? COLORS.warning : COLORS.danger}
                    fillOpacity={0.8 + (index * 0.02)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};