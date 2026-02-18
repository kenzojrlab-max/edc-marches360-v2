import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface LogsContextType {
  auditLogs: AuditLog[];
  addLog: (module: string, action: string, details: string) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const { user, isAdmin } = useAuth();

  // OPTIMISATION : On n'écoute les logs QUE si l'utilisateur est admin
  // Supprime le listener onAuthStateChanged redondant ET évite une requête Firestore inutile pour les non-admins
  useEffect(() => {
    if (!user || !isAdmin) {
      setAuditLogs([]);
      return;
    }

    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"), limit(200));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as AuditLog));
      setAuditLogs(logs);
    }, (error) => {
      console.warn("Accès aux logs refusé:", error.code);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

  const addLog = async (module: string, action: string, details: string) => {
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        console.warn("addLog ignoré : utilisateur non connecté");
        return;
      }

      // Utiliser le rôle du contexte Auth si disponible, sinon fallback Firestore
      let userRole: UserRole = user?.role || UserRole.GUEST;
      if (!user) {
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            userRole = userDoc.data().role || UserRole.GUEST;
          }
        } catch {
          // Si on ne peut pas lire le profil, on garde GUEST par sécurité
        }
      }

      const newLog: Omit<AuditLog, 'id'> = {
        timestamp: new Date().toISOString(),
        userName: firebaseUser.displayName || firebaseUser.email || 'Système',
        userRole,
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
