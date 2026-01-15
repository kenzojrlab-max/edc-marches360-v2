import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// --- NOUVEAUX IMPORTS DES CONTEXTES DIVISÉS ---
import { LogsProvider } from './contexts/LogsContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { MarketProvider } from './contexts/MarketContext';
// ---------------------------------------------

import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PPMView } from './pages/PPMView';
import { Tracking } from './pages/Tracking';
import { PPMManage } from './pages/PPMManage';
import { ProjectPlanManage } from './pages/ProjectPlanManage';
import { Settings } from './pages/Settings';
import { Execution } from './pages/Execution';
import { Documents } from './pages/Documents';
import { DocumentsManage } from './pages/DocumentsManage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Imbrication des nouveaux providers pour gérer l'état global modulaire */}
        <LogsProvider>
          <ConfigProvider>
            <ProjectProvider>
              <LibraryProvider>
                <MarketProvider>
                  <HashRouter>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="ppm-view" element={<PPMView />} />
                        <Route path="ppm-manage" element={<PPMManage />} />
                        <Route path="ppm-manage/:projectId" element={<ProjectPlanManage />} />
                        <Route path="tracking" element={<Tracking />} />
                        <Route path="execution" element={<Execution />} />
                        <Route path="documents" element={<Documents />} />
                        <Route path="documents-manage" element={<DocumentsManage />} />
                        <Route path="settings" element={<Settings />} />
                      </Route>
                    </Routes>
                  </HashRouter>
                </MarketProvider>
              </LibraryProvider>
            </ProjectProvider>
          </ConfigProvider>
        </LogsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;