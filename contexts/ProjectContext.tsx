import React, { createContext, useContext, useState, useEffect } from 'react';
import { Projet } from '../types';
import { useLogs } from './LogsContext';
import { db } from '../firebase'; // Import Firebase
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface ProjectContextType {
  projects: Projet[];
  addProject: (project: Projet) => void;
  updateProject: (id: string, updates: Partial<Projet>) => void;
  removeProject: (id: string) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Projet[]>([]);
  const { addLog } = useLogs(); 

  // Synchronisation temps réel avec Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      // CORRECTION ICI : On fusionne doc.data() avec l'ID du document (doc.id)
      // Cela garantit que p.id n'est jamais undefined
      const projectsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Projet[];
      
      setProjects(projectsData);
    }, (error) => {
      console.error("Erreur lecture projets:", error);
    });

    return () => unsubscribe();
  }, []);

  const addProject = async (project: Projet) => {
    try {
      await setDoc(doc(db, "projects", project.id), project);
      addLog('Projets', 'Création', `Nouveau projet : ${project.libelle}`);
    } catch (error) {
      console.error("Erreur ajout projet:", error);
    }
  };

  const updateProject = async (id: string, updates: Partial<Projet>) => {
    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, updates);
    } catch (error) {
      console.error("Erreur mise à jour projet:", error);
    }
  };

  const removeProject = async (id: string) => {
    try {
      if (!id) throw new Error("ID du projet introuvable");
      await deleteDoc(doc(db, "projects", id));
      addLog('Projets', 'Suppression', `Projet ID ${id} supprimé.`);
    } catch (error) {
      console.error("Erreur suppression projet:", error);
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