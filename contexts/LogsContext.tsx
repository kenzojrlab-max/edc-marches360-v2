import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuditLog, UserRole } from '../types';
import { storage } from '../utils/storage';
import { generateUUID } from '../utils/uid';

interface LogsContextType {
  auditLogs: AuditLog[];
  addLog: (module: string, action: string, details: string) => void;
}

const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const LogsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setAuditLogs(JSON.parse(localStorage.getItem('edc_audit_logs') || '[]'));
  }, []);

  const addLog = (module: string, action: string, details: string) => {
    const session = storage.getSession();
    const newLog: AuditLog = {
      id: generateUUID(),
      timestamp: new Date().toISOString(),
      userName: session?.name || 'Système',
      userRole: session?.role || UserRole.GUEST,
      module, action, details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 1000);
      localStorage.setItem('edc_audit_logs', JSON.stringify(updated));
      return updated;
    });
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