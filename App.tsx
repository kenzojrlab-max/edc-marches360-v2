import React, { Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// --- CONTEXTES ---
import { LogsProvider } from './contexts/LogsContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { MarketProvider } from './contexts/MarketContext';
import { LibraryProvider } from './contexts/LibraryContext';
import { ToastProvider } from './contexts/ToastContext';
// -----------------

import { Loader } from './components/Loader';

// --- LAZY LOADING : Chaque page est chargée uniquement quand on y accède ---
const Layout = React.lazy(() => import('./components/Layout').then(m => ({ default: m.Layout })));
const Login = React.lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Dashboard = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PPMView = React.lazy(() => import('./pages/PPMView').then(m => ({ default: m.PPMView })));
const Tracking = React.lazy(() => import('./pages/Tracking').then(m => ({ default: m.Tracking })));
const PPMManage = React.lazy(() => import('./pages/PPMManage').then(m => ({ default: m.PPMManage })));
const ProjectPlanManage = React.lazy(() => import('./pages/ProjectPlanManage').then(m => ({ default: m.ProjectPlanManage })));
const Settings = React.lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Execution = React.lazy(() => import('./pages/Execution').then(m => ({ default: m.Execution })));
const ExecutionTracking = React.lazy(() => import('./pages/ExecutionTracking').then(m => ({ default: m.ExecutionTracking })));
const Documents = React.lazy(() => import('./pages/Documents').then(m => ({ default: m.Documents })));
const DocumentsManage = React.lazy(() => import('./pages/DocumentsManage').then(m => ({ default: m.DocumentsManage })));
const Profile = React.lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));

// --- V2 : NOUVELLES PAGES ---
const ExecutionV2 = React.lazy(() => import('./pages/ExecutionV2').then(m => ({ default: m.ExecutionV2 })));
const ExecutionTrackingV2 = React.lazy(() => import('./pages/ExecutionTrackingV2').then(m => ({ default: m.ExecutionTrackingV2 })));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

// CORRECTION : Création d'un composant wrapper pour les Providers (Provider Composition)
// Cela isole la logique des données de la logique d'affichage (Routes) et évite les re-rendus intempestifs.
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <LogsProvider>
        <ConfigProvider>
          <ProjectProvider>
            <LibraryProvider>
              <MarketProvider>
                {children}
              </MarketProvider>
            </LibraryProvider>
          </ProjectProvider>
        </ConfigProvider>
      </LogsProvider>
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  return (
    <AppProviders>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Suspense fallback={<Loader />}><Login /></Suspense>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="ppm-view" element={<PPMView />} />
            <Route path="ppm-manage" element={<PPMManage />} />
            <Route path="ppm-manage/:projectId" element={<ProjectPlanManage />} />
            <Route path="tracking" element={<Tracking />} />
            {/* V1 : Inchangé */}
            <Route path="execution" element={<Execution />} />
            <Route path="execution-tracking" element={<ExecutionTracking />} />

            {/* V2 : Nouvelles pages */}
            <Route path="execution-v2" element={<ExecutionV2 />} />
            <Route path="execution-tracking-v2" element={<ExecutionTrackingV2 />} />

            <Route path="documents" element={<Documents />} />
            <Route path="documents-manage" element={<DocumentsManage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProviders>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
