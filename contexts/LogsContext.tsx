import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../types';
// On n'utilise plus storage ici car on passe à Firebase Auth
// import { storage } from '../utils/storage'; 
import { db, auth } from '../firebase'; // Ajout de 'auth'
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface LogsContextType {
  auditLogs: AuditLog[];
  addLog: (module: string, action: string, details: string) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Chargement des logs depuis Firestore (Derniers 1000 logs)
  useEffect(() => {
    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(1000));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AuditLog));
      setAuditLogs(logs);
    });
    return () => unsubscribe();
  }, []);

  const addLog = async (module: string, action: string, details: string) => {
    try {
      // MODIFICATION : On récupère l'utilisateur depuis Firebase Auth
      const user = auth.currentUser;
      
      const newLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        // On utilise le nom ou l'email Firebase, sinon 'Système'
        userName: user?.displayName || user?.email || 'Système',
        // Pour le rôle, on met GUEST par défaut temporairement. 
        // (La gestion fine des rôles se fera via les Custom Claims ou le profil Firestore plus tard)
        userRole: UserRole.GUEST, 
        module,
        action,
        details
      };
      
      await addDoc(collection(db, "audit_logs"), newLog);
    } catch (error) {
      console.error("Erreur addLog:", error);
    }
  };

  return (
    <LogsContext.Provider value={{ auditLogs, addLog }}>
      {children}
    </LogsContext.Provider>
  );
};

export const useLogs = () => {
  const context = useContext(LogsContext);
  if (!context) throw new Error("useLogs must be used within LogsProvider");
  return context;
};