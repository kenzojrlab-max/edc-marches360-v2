import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { generateUUID } from '../utils/uid';
import { Loader } from '../components/Loader'; // AJOUT : Import du Loader
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  onSnapshot 
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase"; 

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<void>; 
  register: (userData: Omit<User, 'id' | 'created_at'>) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateUserProfile: (userId: string, data: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isGuest: boolean;
  can: (action: 'WRITE' | 'DOWNLOAD' | 'IMPORT' | 'MANAGE_USERS' | 'CONFIG_SYSTEM') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); // État de chargement réel

  // 1. Gestion de la session Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser(userSnap.data() as User);
        } else {
          // NETTOYAGE PROD : Console warn désactivé pour éviter le spam
          // console.warn("Utilisateur authentifié mais profil Firestore introuvable.");
        }
      } else {
        setUser(null);
      }
      setLoading(false); // Fin du chargement une fois l'auth vérifiée
    });

    return () => unsubscribe();
  }, []);

  // 2. Synchronisation de la liste des utilisateurs (CORRIGÉ : Sécurisé par rôle)
  useEffect(() => {
    // Si pas connecté ou pas admin, on ne charge rien !
    if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
      setUsers([]);
      return;
    }

    // Seuls les admins exécutent ce code
    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setUsers(usersData);
    });
    return () => unsubscribe();
  }, [user]); // Dépendance 'user' essentielle ici

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Erreur login:", error);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      
      const userRef = doc(db, "users", fbUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
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
        await setDoc(userRef, newUser);
        setUser(newUser);
      } else {
        await updateDoc(userRef, {
          photoURL: fbUser.photoURL || undefined,
        });
      }
    } catch (error) {
      console.error("Erreur connexion Google:", error);
      alert("La connexion avec Google a échoué.");
    }
  };

  const register = async (userData: Omit<User, 'id' | 'created_at'>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password || 'password123'); 
      const fbUser = userCredential.user;

      const newUser: User = {
        id: fbUser.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role || UserRole.GUEST,
        statut: 'actif',
        fonction: userData.fonction,
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, "users", fbUser.uid), newUser);

    } catch (error: any) {
      console.error("Erreur inscription:", error);
      throw new Error(error.message); 
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role });
    } catch (error) {
      console.error("Erreur updateUserRole:", error);
    }
  };

  const updateUserProfile = async (userId: string, data: Partial<User>) => {
    try {
      await updateDoc(doc(db, "users", userId), data);
    } catch (error) {
      console.error("Erreur updateUserProfile:", error);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await deleteDoc(doc(db, "users", userId));
    } catch (error) {
      console.error("Erreur deleteUser:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const can = (action: string): boolean => {
    if (!user) return false;
    if (user.statut !== 'actif') return false;

    switch (action) {
      case 'WRITE': return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
      case 'DOWNLOAD': return user.role !== UserRole.GUEST;
      case 'IMPORT': return [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(user.role);
      case 'MANAGE_USERS': return user.role === UserRole.SUPER_ADMIN;
      case 'CONFIG_SYSTEM': return user.role === UserRole.SUPER_ADMIN;
      default: return false;
    }
  };

  // Affichage du Loader tant que l'état d'auth n'est pas résolu
  if (loading) {
    return <Loader />;
  }

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