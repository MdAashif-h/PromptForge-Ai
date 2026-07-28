import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'sonner';
import { PromptProvider } from '@/context/PromptContext';
import { AuthProvider } from '@/context/AuthContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';

import DashboardLayout from '@/components/dashboard/DashboardLayout';

const LandingPage = lazy(() => import('@/pages/LandingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const PromptStudioPage = lazy(() => import('@/pages/PromptStudioPage'));
const ComparePage = lazy(() => import('@/pages/ComparePage'));
const LibraryPage = lazy(() => import('@/pages/LibraryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const KnowledgeBasePage = lazy(() => import('@/pages/KnowledgeBasePage'));
const MultiAgentStudioPage = lazy(() => import('@/pages/MultiAgentStudioPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const ArchitecturePage = lazy(() => import('@/pages/ArchitecturePage'));
const RAGEvaluationPage = lazy(() => import('@/pages/RAGEvaluationPage'));

const PageLoader = () => (
  <div className="min-h-screen bg-[#0B0C0E] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <PromptProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/multi-agent" element={<MultiAgentStudioPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/architecture" element={<ArchitecturePage />} />
                  <Route path="/rag-eval" element={<RAGEvaluationPage />} />
                  <Route path="/rag-evaluation" element={<RAGEvaluationPage />} />
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="multi-agent" element={<MultiAgentStudioPage />} />
                    <Route path="rag-eval" element={<RAGEvaluationPage />} />
                    <Route path="rag-evaluation" element={<RAGEvaluationPage />} />
                    <Route path="studio" element={<PromptStudioPage />} />
                    <Route path="compare" element={<ComparePage />} />
                    <Route path="library" element={<LibraryPage />} />
                    <Route path="knowledge-base" element={<KnowledgeBasePage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="architecture" element={<ArchitecturePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>
                </Routes>
              </AnimatePresence>
            </Suspense>
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#131519',
                  border: '1px solid #24272E',
                  color: '#F5F6F7',
                  fontSize: '0.875rem',
                },
              }}
              theme="dark"
            />
          </BrowserRouter>
        </WorkspaceProvider>
      </PromptProvider>
    </AuthProvider>
  );
}

export default App;
