import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../types';
import { storage } from '../utils/storage'; // Gardé pour getSession() qui reste en local pour l'instant
import { generateUUID } from '../utils/uid';
import { db } from '../firebase';
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
      const session = storage.getSession(); // L'utilisateur courant reste en localStorage pour l'instant
      const newLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userName: session?.name || 'Système',
        userRole: session?.role || UserRole.GUEST,
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