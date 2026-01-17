import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface LogsContextType {
  auditLogs: AuditLog[];
  addLog: (module: string, action: string, details: string) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // AJOUT : Écoute de l'état d'authentification
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribeAuth();
  }, []);

  // CORRECTION : On n'écoute les logs QUE si l'utilisateur est connecté
  useEffect(() => {
    // Si pas connecté, on ne fait rien
    if (!isAuthenticated) {
      setAuditLogs([]);
      return;
    }

    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(1000));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AuditLog));
      setAuditLogs(logs);
    }, (error) => {
      // Gestion silencieuse : si l'utilisateur n'est pas admin, il n'a pas accès aux logs (c'est normal)
      console.warn("Accès aux logs refusé (normal si vous n'êtes pas admin):", error.code);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addLog = async (module: string, action: string, details: string) => {
    try {
      const user = auth.currentUser;
      
      // AJOUT : On ne crée un log que si l'utilisateur est connecté
      if (!user) {
        console.warn("addLog ignoré : utilisateur non connecté");
        return;
      }
      
      const newLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userName: user?.displayName || user?.email || 'Système',
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