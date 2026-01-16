import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  updateUserProfile: (userId: string, data: Partial<User>) => void; // NOUVEAU
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
  
  // CORRECTION : useRef pour s'assurer que l'initialisation ne s'exécute qu'une seule fois
  const isInitialized = useRef(false);

  // CORRECTION : useEffect avec tableau de dépendances VIDE []
  // S'exécute une seule fois au montage du composant
  useEffect(() => {
    // Éviter la double exécution en mode strict de React
    if (isInitialized.current) return;
    isInitialized.current = true;

    const adminEmail = 'juniorngassa@edc.cm';
    const currentUsers = storage.getUsers(); // Lire directement depuis le storage
    const existingUserIndex = currentUsers.findIndex(u => u.email.toLowerCase() === adminEmail.toLowerCase());

    const superAdminUser: User = {
      id: existingUserIndex >= 0 ? currentUsers[existingUserIndex].id : '1',
      name: 'Junior Ngassa',
      email: adminEmail,
      role: UserRole.SUPER_ADMIN,
      statut: 'actif',
      password: 'password',
      created_at: new Date().toISOString()
    };

    let newUsersList = [...currentUsers];
    let needsUpdate = false;

    if (existingUserIndex >= 0) {
      // Vérifier si une mise à jour est vraiment nécessaire
      const existingUser = currentUsers[existingUserIndex];
      if (existingUser.role !== UserRole.SUPER_ADMIN || existingUser.password !== 'password') {
        newUsersList[existingUserIndex] = superAdminUser;
        needsUpdate = true;
      }
    } else {
      // L'utilisateur n'existe pas, on l'ajoute
      newUsersList.push(superAdminUser);
      needsUpdate = true;
    }

    // Seulement mettre à jour si nécessaire
    if (needsUpdate) {
      setUsers(newUsersList);
      storage.saveUsers(newUsersList);
      console.log("✅ Compte Super Admin juniorngassa@edc.cm restauré/mis à jour.");
    }
  }, []); // TABLEAU VIDE = exécution unique au montage

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
          fonction: 'Non définie',
          photoURL: fbUser.photoURL || undefined
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

  // NOUVELLE FONCTION : Mise à jour du profil utilisateur (Nom, Fonction, Avatar)
  const updateUserProfile = (userId: string, data: Partial<User>) => {
    const updated = users.map(u => u.id === userId ? { ...u, ...data } : u);
    setUsers(updated);
    storage.saveUsers(updated);
    
    // Mise à jour de la session courante si c'est l'utilisateur connecté
    if (user?.id === userId) {
      const newUser = { ...user, ...data };
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
      user, users, login, loginWithGoogle, register, updateUserRole, updateUserProfile, deleteUser, logout,
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