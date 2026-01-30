import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMarkets } from '../contexts/MarketContext';
import { useConfig } from '../contexts/ConfigContext';
import { useLogs } from '../contexts/LogsContext';
import { useTheme } from '../contexts/ThemeContext';
import { UserRole } from '../types';
import { CustomBulleSelect } from '../components/CustomBulleSelect';
import { 
  Users, History, Trash2, Check, X, Activity, Search, Database, Layers, Plus,
  AlertTriangle, RefreshCcw, CheckSquare, Square
} from 'lucide-react';
import { formatDate } from '../utils/date';
import { TruncatedText } from '../components/TruncatedText';

export const Settings: React.FC = () => {
  const { users, updateUserRole, deleteUser, user: currentUser, can } = useAuth();
  const { markets, deletedMarkets, restoreMarket, permanentDeleteMarket } = useMarkets();
  const { fonctions, addFonction, removeFonction, aoTypes, addAOType, removeAOType, marketTypes, addMarketType, removeMarketType } = useConfig();
  const { auditLogs, addLog } = useLogs();
  
  const { theme, themeType } = useTheme(); // On récupère le thème et son mode

  // --- LOGIQUE D'AFFICHAGE ADAPTATIVE ---
  // Si le thème est clair (Clay, Minimal), on utilise des bordures grises visibles
  // Sinon (Glass, Cyber), on garde les bordures blanches transparentes
  const isLight = theme.mode === 'light';
  
  const borderColor = isLight ? 'border-slate-200' : 'border-white/10';
  const divideColor = isLight ? 'divide-slate-200' : 'divide-white/10';
  const tableHeaderBg = isLight ? 'bg-slate-100' : 'bg-black/10';
  const rowHoverBg = isLight ? 'hover:bg-slate-50' : 'hover:bg-white/5';
  // --------------------------------------

  const [activeTab, setActiveTab] = useState<'users' | 'structure' | 'logs' | 'trash' | 'maintenance'>(can('MANAGE_USERS') ? 'users' : 'logs');
  const [pendingRoles, setPendingRoles] = useState<Record<string, UserRole>>({});
  const [newItemName, setNewItemName] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [selectedTrashIds, setSelectedTrashIds] = useState<string[]>([]);

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

  const handlePurgeData = () => {
    if (window.confirm("⚠️ ATTENTION : Vous allez supprimer TOUS les Projets, Marchés et Documents liés.\n\nCette action est irréversible et permet de repartir sur une base propre.\n\nVoulez-vous continuer ?")) {
      localStorage.removeItem('edc_projects');
      localStorage.removeItem('edc_markets');
      localStorage.removeItem('edc_deleted_markets');
      localStorage.removeItem('edc_library');
      window.location.reload();
    }
  };

  const handleFactoryReset = () => {
    if (window.confirm("⛔ DANGER : RÉINITIALISATION D'USINE\n\nTout sera effacé : Utilisateurs, Configuration, Logs, Données.\nVous serez déconnecté.\n\nConfirmer ?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const toggleSelectAllTrash = () => {
    if (selectedTrashIds.length === deletedMarkets.length) setSelectedTrashIds([]);
    else setSelectedTrashIds(deletedMarkets.map(m => m.id));
  };

  const toggleSelectTrash = (id: string) => {
    setSelectedTrashIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkRestore = () => {
    if (window.confirm(`Voulez-vous vraiment restaurer ces ${selectedTrashIds.length} éléments ?`)) {
      selectedTrashIds.forEach(id => restoreMarket(id));
      setSelectedTrashIds([]);
      addLog('Corbeille', 'Restauration en masse', `${selectedTrashIds.length} éléments restaurés.`);
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`ATTENTION : Suppression définitive de ${selectedTrashIds.length} éléments.\nCette action est irréversible.\n\nContinuer ?`)) {
      selectedTrashIds.forEach(id => permanentDeleteMarket(id));
      setSelectedTrashIds([]);
      addLog('Corbeille', 'Suppression en masse', `${selectedTrashIds.length} éléments supprimés définitivement.`);
    }
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => 
      log.userName.toLowerCase().includes(logSearch.toLowerCase()) || 
      log.action.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [auditLogs, logSearch]);

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-40">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className={`text-3xl font-black ${theme.textMain} tracking-tight uppercase`} style={{ fontFamily: "'Poppins', sans-serif" }}>Paramètres Système</h1>
          <p className={`${theme.textSecondary} font-medium text-sm`}>Administration des accès et structure du registre.</p>
        </div>
        
        <div className={`${theme.card} p-1.5 flex flex-nowrap items-center gap-2 w-full md:w-fit shadow-sm overflow-x-auto`}>
          {can('MANAGE_USERS') && (
            <button onClick={() => setActiveTab('users')} className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'users' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`}`}><Users size={16} /> Accès</button>
          )}
          <button onClick={() => setActiveTab('structure')} className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'structure' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`}`}><Database size={16} /> Structure</button>
          <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'logs' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`}`}><History size={16} /> Logs</button>
          <button onClick={() => setActiveTab('trash')} className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'trash' ? theme.buttonPrimary : `${theme.textSecondary} hover:bg-black/5`}`}><Trash2 size={16} /> Corbeille</button>
          <button onClick={() => setActiveTab('maintenance')} className={`flex items-center gap-2 px-6 py-2.5 ${theme.buttonShape} text-xs font-black uppercase tracking-widest transition-none whitespace-nowrap ${activeTab === 'maintenance' ? 'bg-red-500 text-white' : `${theme.textSecondary} hover:bg-red-500/10 hover:text-red-500`}`}><Activity size={16} /> Maintenance</button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-8 px-2 animate-in fade-in duration-200">
            <div className={`${theme.card} overflow-visible shadow-sm`}>
              <div className="overflow-x-auto custom-scrollbar pb-40">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  <thead>
                    <tr className={`${tableHeaderBg} border-b ${borderColor}`}>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Employé</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Service</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Inscription</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Rôle</th>
                      <th className={`p-8 text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest text-right`} style={{ fontFamily: "'DM Sans', sans-serif" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${divideColor}`}>
                    {users.map((u, index) => {
                      const hasPending = !!pendingRoles[u.id];
                      const displayedRole = pendingRoles[u.id] || u.role;
                      const isLastItem = index === users.length - 1;
                      return (
                        <tr key={`${u.id}-${index}`} className={`${rowHoverBg} transition-all group`}>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className={`w-14 h-14 ${theme.buttonShape} bg-black/5 border ${borderColor} flex items-center justify-center font-black ${theme.textAccent} uppercase text-lg`}>{u.name.charAt(0)}</div>
                              <div><p className={`text-sm font-black ${theme.textMain} uppercase tracking-tight`}>{u.name}</p><p className={`text-[10px] ${theme.textSecondary} font-bold`}>{u.email}</p></div>
                            </div>
                          </td>
                          <td className="p-8"><span className={`text-[10px] font-black ${theme.textMain} uppercase tracking-tighter`}>{u.fonction || '-'}</span></td>
                          <td className="p-8"><span className={`text-[10px] font-bold ${theme.textSecondary}`}>{formatDate(u.created_at)}</span></td>
                          <td className="p-8">
                            <div className="flex items-center gap-4">
                              <div className="w-44"><CustomBulleSelect label="" value={displayedRole} options={Object.values(UserRole).map(r => ({ value: r, label: r }))} onChange={(val) => setPendingRoles(prev => ({ ...prev, [u.id]: val as UserRole }))} disabled={u.id === currentUser?.id} direction={isLastItem ? 'up' : 'down'} /></div>
                              {hasPending && (<div className="flex gap-2 animate-in fade-in slide-in-from-left-2"><button onClick={() => saveRole(u.id)} className="p-2.5 bg-success text-white rounded-xl shadow-lg shadow-success/20 hover:scale-110 transition-transform"><Check size={14} /></button><button onClick={() => setPendingRoles(prev => {const n={...prev}; delete n[u.id]; return n;})} className="p-2.5 bg-danger/10 text-danger rounded-xl hover:scale-110 transition-transform"><X size={14} /></button></div>)}
                            </div>
                          </td>
                          <td className="p-8 text-right"><button onClick={() => handleRemoveUser(u.id)} disabled={u.id === currentUser?.id} className={`p-3 text-slate-400 hover:text-danger hover:bg-danger/10 ${theme.buttonShape} transition-all disabled:opacity-30`}><Trash2 size={20} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STRUCTURE TAB */}
        {activeTab === 'structure' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 animate-in fade-in duration-200">
             {[
               { id: 'fonction', title: 'Fonctions Analytiques', icon: <Activity size={20}/>, items: fonctions, remove: removeFonction, add: addFonction },
               { id: 'ao', title: 'Types de Dossiers', icon: <Layers size={20}/>, items: aoTypes, remove: removeAOType, add: addAOType },
               { id: 'prestation', title: 'Prestations', icon: <Check size={20}/>, items: marketTypes, remove: removeMarketType, add: addMarketType }
             ].map((section: any) => (
                <section key={section.id} className={`${theme.card} p-10 flex flex-col h-full`}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className={theme.textAccent}>{section.icon}</div>
                    <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.textMain}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>{section.title}</h3>
                  </div>
                  <div className="flex-1 space-y-2 mb-8 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {section.items.map((item: string) => (
                      <div key={item} className={`group flex items-center justify-between p-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/5 border-white/5'} border rounded-2xl hover:border-primary/30 transition-all`}>
                        <span className={`text-[10px] font-bold ${theme.textMain} uppercase leading-tight pr-4`}>{item}</span>
                        <button onClick={() => handleDeleteItem(section.id, item)} className="p-2 text-slate-400 hover:text-danger opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input type="text" placeholder="Ajouter..." className={`${theme.input} flex-1 text-[10px] font-bold`} value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                    <button onClick={() => handleAddItem(section.id)} className={`p-3 ${theme.buttonPrimary} rounded-xl shadow-lg shadow-primary/20`}><Plus size={18} /></button>
                  </div>
                </section>
             ))}
          </div>
        )}

        {/* LOGS TAB */}
        {activeTab === 'logs' && (
          <div className="space-y-6 px-2 animate-in fade-in duration-200">
            <div className={`${theme.card} flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 shadow-sm`}>
              <div className="relative flex-1 max-w-md">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${isLight ? 'text-slate-400' : 'text-white/50'}`} size={18} />
                <input type="text" placeholder="Rechercher dans l'historique..." className={`${theme.input} w-full pl-12 pr-6 py-3 font-bold`} value={logSearch} onChange={e => setLogSearch(e.target.value)} />
              </div>
              <div className={`px-4 py-2 bg-black/5 ${theme.textAccent} rounded-xl text-[10px] font-black uppercase tracking-widest`}>{filteredLogs.length} Actions tracées</div>
            </div>
            <div className={`${theme.card} overflow-hidden shadow-sm`}>
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className={`${tableHeaderBg} text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest border-b ${borderColor}`}>
                        <th className="p-8">Date & Heure</th><th className="p-8">Utilisateur</th><th className="p-8">Module</th><th className="p-8">Action</th>
                     </tr>
                  </thead>
                  <tbody className={`divide-y ${divideColor}`}>
                     {filteredLogs.map(log => (
                       <tr key={log.id} className={`${rowHoverBg} transition-all`}>
                          <td className="p-8"><span className={`text-[11px] font-bold ${theme.textSecondary}`}>{new Date(log.timestamp).toLocaleString('fr-FR')}</span></td>
                          <td className="p-8"><div><p className={`text-[11px] font-black ${theme.textMain} uppercase`}>{log.userName}</p><span className={`text-[8px] font-black px-2 py-0.5 rounded-lg bg-black/5 ${theme.textAccent}`}>{log.userRole}</span></div></td>
                          <td className="p-8"><span className={`text-[10px] font-black ${theme.textAccent} uppercase tracking-widest`}>{log.module}</span></td>
                          <td className="p-8"><div><p className={`text-[11px] font-black ${theme.textMain} uppercase leading-none mb-1`}>{log.action}</p><TruncatedText text={log.details} as="p" className={`text-[10px] font-medium ${theme.textSecondary} line-clamp-1`} /></div></td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {/* TRASH TAB */}
        {activeTab === 'trash' && (
          <div className="px-2 animate-in fade-in duration-200">
             <div className={`${theme.card} p-10 space-y-8`}>
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3"><Trash2 size={24} className={theme.textAccent} /><div><h3 className={`text-lg font-black ${theme.textMain} uppercase tracking-tight`}>Registre de la Corbeille</h3><p className={`text-xs font-bold ${theme.textSecondary}`}>Restauration ou purge définitive des dossiers.</p></div></div>
                   {selectedTrashIds.length > 0 && (<div className="flex items-center gap-2 animate-in slide-in-from-right-4 fade-in"><button onClick={handleBulkRestore} className={`px-4 py-2.5 bg-success text-white ${theme.buttonShape} text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all flex items-center gap-2`}><RefreshCcw size={14} /> Restaurer ({selectedTrashIds.length})</button><button onClick={handleBulkDelete} className={`px-4 py-2.5 bg-danger text-white ${theme.buttonShape} text-[10px] font-black uppercase shadow-lg hover:scale-105 transition-all flex items-center gap-2`}><Trash2 size={14} /> Supprimer ({selectedTrashIds.length})</button></div>)}
                </div>
                <div className={`overflow-hidden ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/5 border-white/5'} rounded-[2rem] border`}>
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className={`${tableHeaderBg} text-[10px] font-black uppercase ${theme.textSecondary} tracking-widest border-b ${borderColor}`}>
                           <th className="p-6 w-16 text-center"><button onClick={toggleSelectAllTrash} className={`transition-transform hover:scale-110 ${selectedTrashIds.length === deletedMarkets.length && deletedMarkets.length > 0 ? theme.textAccent : 'text-slate-400'}`}>{selectedTrashIds.length === deletedMarkets.length && deletedMarkets.length > 0 ? <CheckSquare size={20} /> : <Square size={20} />}</button></th>
                           <th className="p-6">Dossier</th><th className="p-6 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className={`divide-y ${divideColor}`}>
                        {deletedMarkets.length > 0 ? deletedMarkets.map(m => {
                          const isSelected = selectedTrashIds.includes(m.id);
                          return (
                            <tr key={m.id} className={`transition-all ${rowHoverBg} ${isSelected ? 'bg-primary/5' : ''}`}>
                               <td className="p-6 text-center"><button onClick={() => toggleSelectTrash(m.id)} className={`transition-transform hover:scale-110 ${isSelected ? theme.textAccent : 'text-slate-400'}`}>{isSelected ? <CheckSquare size={18} /> : <Square size={18} />}</button></td>
                               <td className="p-6"><div onClick={() => toggleSelectTrash(m.id)} className="cursor-pointer"><p className={`text-[11px] font-black ${theme.textAccent} uppercase tracking-tighter mb-1`}>{m.numDossier}</p><TruncatedText text={m.objet} as="p" className={`text-xs font-bold ${theme.textMain} line-clamp-1`} /></div></td>
                               <td className="p-6 text-right"><div className="flex items-center justify-end gap-3"><button onClick={() => restoreMarket(m.id)} className={`px-4 py-2 ${theme.buttonPrimary} rounded-xl text-[9px] font-black uppercase tracking-widest transition-all`}>Restaurer</button><button onClick={() => permanentDeleteMarket(m.id)} className={`p-2.5 text-slate-400 hover:text-danger hover:bg-danger/10 ${theme.buttonShape} transition-all`}><Trash2 size={16} /></button></div></td>
                            </tr>
                          );
                        }) : (<tr><td colSpan={3} className="p-16 text-center font-black text-slate-300 uppercase italic">Corbeille vide</td></tr>)}
                     </tbody>
                  </table>
               </div>
             </div>
          </div>
        )}

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
          <div className="px-2 animate-in fade-in duration-200">
             <div className={`${theme.card} p-12 border-red-500/10`}>
                <div className="flex items-center gap-4 mb-8 text-red-500"><AlertTriangle size={32} /><div><h3 className="text-xl font-black uppercase tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>Zone de Maintenance</h3><p className={`text-xs font-bold ${theme.textSecondary}`}>Actions destructives irréversibles.</p></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className={`p-8 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/5 border-white/5'} rounded-[2rem] border flex flex-col items-start gap-4`}>
                      <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-slate-300"><Database size={24}/></div>
                      <div><h4 className={`text-sm font-black ${theme.textMain} uppercase`}>Purger les Données</h4><p className={`text-[10px] ${theme.textSecondary} mt-2 leading-relaxed`}>Supprime tous les <strong>Projets</strong>, <strong>Marchés</strong> et <strong>Documents</strong>.<br/>Conserve vos utilisateurs et la configuration.</p></div>
                      <button onClick={handlePurgeData} className="mt-auto w-full py-3 bg-white text-black font-black text-xs uppercase rounded-xl hover:bg-slate-200 transition-colors">Nettoyer la base</button>
                   </div>
                   <div className="p-8 bg-red-500/5 rounded-[2rem] border border-red-500/20 flex flex-col items-start gap-4">
                      <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500"><RefreshCcw size={24}/></div>
                      <div><h4 className="text-sm font-black text-red-500 uppercase">Réinitialisation Totale</h4><p className={`text-[10px] ${theme.textSecondary} mt-2 leading-relaxed`}>Supprime <strong>ABSOLUMENT TOUT</strong> (Utilisateurs, Logs, Config...).<br/>L'application reviendra à son état initial.</p></div>
                      <button onClick={handleFactoryReset} className="mt-auto w-full py-3 bg-red-500 text-white font-black text-xs uppercase rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Reset Usine</button>
                   </div>
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};