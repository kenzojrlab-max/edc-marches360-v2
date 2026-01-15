import React, { createContext, useContext, useState, useEffect } from 'react';
import { LibraryDocument } from '../types';

interface LibraryContextType {
  libraryDocs: LibraryDocument[];
  addLibraryDoc: (doc: LibraryDocument) => void;
  removeLibraryDoc: (id: string) => void;
}

const LibraryContext = createContext<LibraryContextType | undefined>(undefined);

export const LibraryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [libraryDocs, setLibraryDocs] = useState<LibraryDocument[]>([]);

  useEffect(() => {
    setLibraryDocs(JSON.parse(localStorage.getItem('edc_library') || '[]'));
  }, []);

  const addLibraryDoc = (doc: LibraryDocument) => {
    setLibraryDocs(prev => {
      const updated = [...prev, doc];
      localStorage.setItem('edc_library', JSON.stringify(updated));
      return updated;
    });
  };

  const removeLibraryDoc = (id: string) => {
    setLibraryDocs(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('edc_library', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <LibraryContext.Provider value={{ libraryDocs, addLibraryDoc, removeLibraryDoc }}>
      {children}
    </LibraryContext.Provider>
  );
};

export const useLibrary = () => {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary must be used within LibraryProvider");
  return context;
};