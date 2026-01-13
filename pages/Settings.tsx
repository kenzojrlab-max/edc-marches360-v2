import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMarkets } from '../contexts/MarketContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../types';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { 
  Users, 
  History, 
  Trash2, 
  Check,
  X,
  Activity,
  Search,
  Database,
  Layers,
  Plus
} from 'lucide-react';
import { formatDate } from '../utils/date';

export const Settings: React.FC = () => {
  const { users, updateUserRole, deleteUser, user: currentUser, can } = useAuth();
  const { 
    fonctions, addFonction, removeFonction, 
    aoTypes, addAOType, removeAOType,
    marketTypes, addMarketType, removeMarketType,
    markets, deletedMarkets, restoreMarket, permanentDeleteMarket, auditLogs, addLog
  } = useMarkets();
  const { theme, themeType } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'users' | 'structure' | 'logs' | 'trash' | 'config'>(can('MANAGE_USERS') ? 'users' : 'logs');
  
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
  const [newItemName, setNewItemName] = useState('');
  const [logSearch, setLogSearch] = useState('');

  const saveRole = (userId: string) => {
    const role = pendingRoles[userId];
    const target = users.find(u => u.id === userId);
    if (role) {
      updateUserRole(userId, role);
      addLog('Accès', 'Changement de rôle', `Rôle de ${target?.name} changé en ${role}.`);
      const next = { ...pendingRoles };
      delete next[userId];
      setPendingRoles(next);
    }
  };

  const handleRemoveUser = (userId: string) => {
    if(window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
       deleteUser(userId);
       addLog('Accès', 'Suppression Utilisateur', `ID: ${userId} supprimé.`);
    }
  };

  const handleAddItem = (type: 'fonction' | 'ao' | 'prestation') => {
    if (!newItemName.trim()) return;
    const name = newItemName.toUpperCase();
    if (type === 'fonction') addFonction(name);
    if (type === 'ao') addAOType(name);
    if (type === 'prestation') addMarketType(name);
    setNewItemName('');
  };

  const handleDeleteItem = (type: 'fonction' | 'ao' | 'prestation', label: string) => {
    const isUsed = markets.some(m => 
      (type === 'fonction' && m.fonction === label) ||
      (type === 'ao' && m.typeAO === label) ||
      (type === 'prestation' && m.typePrestation === label)
    );
    if (isUsed) {
      alert("❌ Suppression Impossible : Cet élément est utilisé par un ou plusieurs marchés actifs.");
      return;
    }
    if (type === 'fonction') removeFonction(label);
    if (type === 'ao') removeAOType(label);
    if (type === 'prestation') removeMarketType(label);
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [auditLogs, logSearch]);

  return (
    /* Suppression de l'animation globale pour stabiliser les changements d'état internes */
    <div className="space-y-10 max-w-7xl mx-auto pb-40">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`}>Paramètres Système</h1>
          <p className={`${theme.textSecondary} font-medium text-sm`}>Administration des accès et structure du registre.</p>
        </div>
        
        <div className={`${theme.card} p-1.5 flex flex-wrap items-center gap-2 w-fit shadow-sm`}>
          {can('MANAGE_USERS') && (
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none ${
                activeTab === 'users' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`
              }`}
            >
              <Users size={16} /> Accès
            </button>
          )}
          <button
            onClick={() => setActiveTab('structure')}
            className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none ${
              activeTab === 'structure' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`
            }`}
          >
            <Database size={16} /> Structure
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none ${
              activeTab === 'logs' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`
            }`}
          >
            <History size={16} /> Logs
          </button>
          <button
            onClick={() => setActiveTab('trash')}
            className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none ${
              activeTab === 'trash' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`
            }`}
          >
            <Trash2 size={16} /> Corbeille
          </button>
        </div>
      </div>

      {/* Conteneur de contenu avec une hauteur min stable pour éviter les tremblements visuels */}
      <div className="min-h-[400px]">
        {activeTab === 'users' && (
          <div className="space-y-8 px-2 animate-in fade-in duration-200">
            <div className={`${theme.card} overflow-hidden shadow-sm`}>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className="bg-black/5 border-b border-white/5">
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`}>Employé</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`}>Service</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`}>Inscription</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`}>Rôle</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {users.map(u => {
                      const hasPending = !!pendingRoles[u.id];
                      const displayedRole = pendingRoles[u.id] || u.role;
                      return (
                        <tr key={u.id} className="hover:bg-white/5 transition-all group">
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 ${theme.buttonShape} bg-black/5 border border-white/10 flex items-center justify-center font-black ${theme.textAccent} uppercase text-lg`}>
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <p className={`text-sm font-black ${theme.textMain} uppercase tracking-tight`}>{u.name}</p>
                                <p className={`text-[10px] ${theme.textSecondary} font-bold`}>{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-8">
                              <span className={`text-[10px] font-black ${theme.textMain} uppercase tracking-tighter`}>{u.fonction || '-'}</span>
                          </td>
                          <td className="p-8">
                              <span className={`text-[10px] font-bold ${theme.textSecondary}`}>{formatDate(u.created_at)}</span>
                          </td>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-44">
                                <CustomBulleSelect
                                  label=""
                                  value={displayedRole}
                                  options={Object.values(UserRole).map(r => ({ value: r, label: r }))}
                                  onChange={(val) => setPendingRoles(prev => ({ ...prev, [u.id]: val as UserRole }))}
                                  disabled={u.id === currentUser?.id}
                                />
                              </div>
                              {hasPending && (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                  <button onClick={() => saveRole(u.id)} className="p-2.5 bg-success text-white rounded-xl shadow-lg shadow-success/20 hover:scale-110 transition-transform"><Check size={14} /></button>
                                  <button onClick={() => setPendingRoles(prev => {const n={...prev}; delete n[u.id]; return n;})} className="p-2.5 bg-danger/10 text-danger rounded-xl hover:scale-110 transition-transform"><X size={14} /></button>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-8 text-right">
                            <button 
                              onClick={() => handleRemoveUser(u.id)}
                              disabled={u.id === currentUser?.id}
                              className={`p-3 text-slate-400 hover:text-danger hover:bg-danger/10 ${theme.buttonShape} transition-all disabled:opacity-30`}
                            >
                              <Trash2 size={20} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'structure' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 animate-in fade-in duration-200">
            {/* Section Fonctions */}
            <section className={`${theme.card} p-10 flex flex-col h-full`}>
              <div className="flex items-center gap-3 mb-8">
                <Activity size={20} className={theme.textAccent} />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMain}`}>Fonctions Analytiques</h3>
              </div>
              <div className="flex-1 space-y-2 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {fonctions.map(f => (
                  <div key={f} className={`group flex items-center justify-between p-4 bg-black/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all`}>
                    <span className={`text-[10px] font-bold ${theme.textMain} uppercase leading-tight pr-4`}>{f}</span>
                    <button onClick={() => handleDeleteItem('fonction', f)} className="p-2 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Nouvelle fonction..." 
                  className={`${theme.input} flex-1 text-[10px] font-bold ${themeType === 'glass' ? 'text-white' : ''}`}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                />
                <button onClick={() => handleAddItem('fonction')} className={`p-3 ${theme.buttonPrimary} rounded-xl shadow-lg shadow-primary/20`}><Plus size={18} /></button>
              </div>
            </section>

            {/* Section AO Types */}
            <section className={`${theme.card} p-10 flex flex-col h-full`}>
              <div className="flex items-center gap-3 mb-8">
                <Layers size={20} className={theme.textAccent} />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMain}`}>Types de Dossiers</h3>
              </div>
              <div className="flex-1 space-y-2 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {aoTypes.map(t => (
                  <div key={t} className={`group flex items-center justify-between p-4 bg-black/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all`}>
                    <span className={`text-[10px] font-bold ${theme.textMain} uppercase leading-tight pr-4`}>{t}</span>
                    <button onClick={() => handleDeleteItem('ao', t)} className="p-2 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: AON, AOI..." 
                  className={`${theme.input} flex-1 text-[10px] font-bold ${themeType === 'glass' ? 'text-white' : ''}`}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                />
                <button onClick={() => handleAddItem('ao')} className={`p-3 ${theme.buttonPrimary} rounded-xl shadow-lg shadow-primary/20`}><Plus size={18} /></button>
              </div>
            </section>

            {/* Section Market Types */}
            <section className={`${theme.card} p-10 flex flex-col h-full`}>
              <div className="flex items-center gap-3 mb-8">
                <Check size={20} className={theme.textAccent} />
                <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMain}`}>Prestations</h3>
              </div>
              <div className="flex-1 space-y-2 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {marketTypes.map(p => (
                  <div key={p} className={`group flex items-center justify-between p-4 bg-black/5 border border-white/5 rounded-2xl hover:border-primary/30 transition-all`}>
                    <span className={`text-[10px] font-bold ${theme.textMain} uppercase leading-tight pr-4`}>{p}</span>
                    <button onClick={() => handleDeleteItem('prestation', p)} className="p-2 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ex: Travaux..." 
                  className={`${theme.input} flex-1 text-[10px] font-bold ${themeType === 'glass' ? 'text-white' : ''}`}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                />
                <button onClick={() => handleAddItem('prestation')} className={`p-3 ${theme.buttonPrimary} rounded-xl shadow-lg shadow-primary/20`}><Plus size={18} /></button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-6 px-2 animate-in fade-in duration-200">
            <div className={`${theme.card} flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 shadow-sm`}>
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeType === 'glass' ? 'text-white' : 'text-slate-400'}`} size={18} />
                <input 
                  type="text" 
                  placeholder="Rechercher dans l'historique..." 
                  className={`${theme.input} w-full pl-12 pr-6 py-3 font-bold ${themeType === 'glass' ? 'text-white placeholder:text-white/40' : ''}`}
                  value={logSearch}
                  onChange={e => setLogSearch(e.target.value)}
                />
              </div>
              <div className={`px-4 py-2 bg-black/5 ${theme.textAccent} rounded-xl text-[10px] font-black uppercase tracking-widest`}>
                {filteredLogs.length} Actions tracées
              </div>
            </div>

            <div className={`${theme.card} overflow-hidden shadow-sm`}>
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className={`bg-black/5 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest border-b border-white/5`}>
                        <th className="p-8">Date & Heure</th>
                        <th className="p-8">Utilisateur</th>
                        <th className="p-8">Module</th>
                        <th className="p-8">Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                     {filteredLogs.map(log => (
                       <tr key={log.id} className="hover:bg-white/5 transition-all">
                          <td className="p-8">
                             <span className={`text-[11px] font-bold ${theme.textSecondary}`}>{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                          </td>
                          <td className="p-8">
                             <div>
                                <p className={`text-[11px] font-black ${theme.textMain} uppercase`}>{log.userName}</p>
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-lg bg-black/5 ${theme.textAccent}`}>{log.userRole}</span>
                             </div>
                          </td>
                          <td className="p-8">
                             <span className={`text-[10px] font-black ${theme.textAccent} uppercase tracking-widest`}>{log.module}</span>
                          </td>
                          <td className="p-8">
                             <div>
                                <p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none mb-1`}>{log.action}</p>
                                <p className={`text-[10px] font-medium ${theme.textSecondary} line-clamp-1`}>{log.details}</p>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'trash' && (
          <div className="px-2 animate-in fade-in duration-200">
             <div className={`${theme.card} p-10 space-y-8`}>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <Trash2 size={24} className={theme.textAccent} />
                      <div>
                         <h3 className={`text-lg font-black ${theme.textMain} uppercase tracking-tight`}>Registre de la Corbeille</h3>
                         <p className={`text-xs font-bold ${theme.textSecondary}`}>Restauration ou purge définitive des dossiers.</p>
                      </div>
                   </div>
                </div>

                <div className="overflow-hidden bg-black/5 rounded-[2rem] border border-white/5">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className={`bg-black/10 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`}>
                           <th className="p-6">Dossier</th>
                           <th className="p-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {deletedMarkets.length > 0 ? deletedMarkets.map(m => (
                          <tr key={m.id} className="hover:bg-white/5 transition-all">
                             <td className="p-6">
                                <div>
                                   <p className={`text-[11px] font-black ${theme.textAccent} uppercase tracking-tighter mb-1`}>{m.numDossier}</p>
                                   <p className={`text-xs font-bold ${theme.textMain} line-clamp-1`}>{m.objet}</p>
                                </div>
                             </td>
                             <td className="p-6 text-right">
                                <div className="flex items-center justify-end gap-3">
                                   <button onClick={() => restoreMarket(m.id)} className={`px-4 py-2 ${theme.buttonPrimary} rounded-xl text-[9px] font-black uppercase tracking-widest transition-all`}>Restaurer</button>
                                   <button onClick={() => permanentDeleteMarket(m.id)} className={`p-2.5 text-slate-400 hover:text-danger hover:bg-danger/10 ${theme.buttonShape} transition-all`}><Trash2 size={16} /></button>
                                </div>
                             </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={2} className="p-16 text-center font-black text-slate-300 uppercase italic">Corbeille vide</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};