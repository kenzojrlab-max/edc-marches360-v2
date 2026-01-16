import React, { createContext, useContext, useState, useEffect } from 'react';
import { Projet } from '../types';
import { useLogs } from './LogsContext';

interface ProjectContextType {
  projects: Projet[];
  addProject: (project: Projet) => void;
  updateProject: (id: string, updates: Partial<Projet>) => void;
  removeProject: (id: string) => void; // NOUVEAU
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Projet[]>([]);
  // Injection du contexte Logs pour tracer les actions
  const { addLog } = useLogs(); 

  useEffect(() => {
    setProjects(JSON.parse(localStorage.getItem('edc_projects') || '[]'));
  }, []);

  const addProject = (project: Projet) => {
    setProjects(prev => {
      const updated = [...prev, project];
      localStorage.setItem('edc_projects', JSON.stringify(updated));
      addLog('Projets', 'Création', `Nouveau projet : ${project.libelle}`);
      return updated;
    });
  };

  const updateProject = (id: string, updates: Partial<Projet>) => {
    setProjects(prev => {
      const updated = prev.map(p => p.id === id ? { ...p, ...updates } : p);
      localStorage.setItem('edc_projects', JSON.stringify(updated));
      return updated;
    });
  };

  // IMPLEMENTATION DE LA SUPPRESSION
  const removeProject = (id: string) => {
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      localStorage.setItem('edc_projects', JSON.stringify(updated));
      addLog('Projets', 'Suppression', `Projet ID ${id} supprimé.`);
      return updated;
    });
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