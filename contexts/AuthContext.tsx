import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../utils/storage';
import { generateUUID } from '../utils/uid';
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { auth } from "../firebase"; 

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>; 
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

  // --- CORRECTION MAJEURE ICI ---
  // On force la création/mise à jour de votre compte admin à chaque démarrage
  useEffect(() => {
    const adminEmail = 'juniorngassa@edc.cm';
    const existingUserIndex = users.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());

    const superAdminUser: User = {
      id: existingUserIndex >= 0 ? users[existingUserIndex].id : '1', // Garde l'ID s'il existe
      name: 'Junior Ngassa',
      email: adminEmail,
      role: UserRole.SUPER_ADMIN,
      statut: 'actif',
      password: 'password', // Mot de passe forcé
      created_at: new Date().toISOString()
    };

    let newUsersList = [...users];

    if (existingUserIndex >= 0) {
      // Si l'utilisateur existe, on met à jour son rôle et son mot de passe pour être sûr
      newUsersList[existingUserIndex] = superAdminUser;
    } else {
      // Sinon, on l'ajoute
      newUsersList.push(superAdminUser);
    }

    // On sauvegarde et on met à jour l'état
    // Note: On compare JSON.stringify pour éviter les boucles infinies de mise à jour
    if (JSON.stringify(newUsersList) !== JSON.stringify(users)) {
        setUsers(newUsersList);
        storage.saveUsers(newUsersList);
        console.log("✅ Compte Super Admin juniorngassa@edc.cm restauré/mis à jour.");
    }
  }, [users]); // Dépendance à users pour être sûr d'avoir la dernière liste

  const login = async (email: string, password: string): Promise<boolean> => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found && (found.password === password || (!found.password && password === 'password'))) {
      setUser(found);
      storage.setSession(found);
      return true;
    }
    return false;
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const fbUser = result.user;

      let appUser = users.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());

      if (!appUser) {
        const newUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Utilisateur Google',
          email: fbUser.email || '',
          role: UserRole.GUEST, 
          statut: 'actif',
          created_at: new Date().toISOString(),
          fonction: 'Non définie'
        };
        
        const newUsersList = [...users, newUser];
        setUsers(newUsersList);
        storage.saveUsers(newUsersList);
        appUser = newUser;
      }

      setUser(appUser);
      storage.setSession(appUser);

    } catch (error) {
      console.error("Erreur connexion Google:", error);
      alert("La connexion avec Google a échoué.");
    }
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

  const logout = async () => {
    await signOut(auth);
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
      user, users, login, loginWithGoogle, register, updateUserRole, deleteUser, logout,
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