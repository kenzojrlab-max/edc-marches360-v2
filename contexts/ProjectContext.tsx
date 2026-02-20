import React, { createContext, useContext, useState, useEffect } from 'react';
import { Projet } from '../types';
import { useLogs } from './LogsContext';
import { db, auth } from '../firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface ProjectContextType {
  projects: Projet[];
  addProject: (project: Projet) => void;
  updateProject: (id: string, updates: Partial<Projet>) => void;
  removeProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Projet[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { addLog } = useLogs(); 

  // AJOUT : Écoute de l'état d'authentification
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribeAuth();
  }, []);

  // CORRECTION : On n'écoute les projets QUE si l'utilisateur est connecté
  useEffect(() => {
    if (!isAuthenticated) {
      setProjects([]);
      return;
    }

    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Projet[];
      
      setProjects(projectsData);
    }, (error) => {
      console.warn("Accès aux projets refusé:", error.code);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const addProject = async (project: Projet) => {
    try {
      await setDoc(doc(db, "projects", project.id), project);
      addLog('Projets', 'Création', `Nouveau projet : ${project.libelle}`);
    } catch (error) {
      console.error("Erreur ajout projet:", error);
      throw error;
    }
  };

  const updateProject = async (id: string, updates: Partial<Projet>) => {
    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, updates);
    } catch (error) {
      console.error("Erreur mise à jour projet:", error);
      throw error;
    }
  };

  const removeProject = async (id: string) => {
    try {
      if (!id) throw new Error("ID du projet introuvable");
      await deleteDoc(doc(db, "projects", id));
      addLog('Projets', 'Suppression', `Projet ID ${id} supprimé.`);
    } catch (error) {
      console.error("Erreur suppression projet:", error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider value={{ projects, addProject, updateProject, removeProject }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error("useProjects must be used within ProjectProvider");
  return context;
};