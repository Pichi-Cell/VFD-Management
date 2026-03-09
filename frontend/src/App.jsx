import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import KanbanBoard from './pages/KanbanBoard';
import Login from './pages/Login';
import RepairDetail from './pages/RepairDetail';
import ReportView from './pages/ReportView';
import HistoryPage from './pages/History';
import Layout from './components/Layout';
import { Toaster } from 'sonner';
import './index.css';


const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

import Settings from './pages/Settings';
import Setup from './pages/Setup';
import { userService } from './services/dataService';
import { Loader2 } from 'lucide-react';

function App() {
  const { data: setupStatus, isLoading: isCheckingSetup } = useQuery({
    queryKey: ['setupStatus'],
    queryFn: userService.checkSetupStatus,
    retry: false
  });

  if (isCheckingSetup) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const isSetupRequired = setupStatus?.setupRequired;

  return (
    <>
      <Toaster position="top-right" richColors closeButton />
      <Router>
        <Routes>
          {isSetupRequired ? (
            <>
              <Route path="/setup" element={<Setup />} />
              <Route path="*" element={<Navigate to="/setup" />} />
            </>
          ) : (
            <>
              <Route path="/login" element={<Login />} />
              <Route path="/setup" element={<Navigate to="/login" />} />
              <Route path="/" element={
                <PrivateRoute>
                  <Layout>
                    <KanbanBoard />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/repair/:id" element={
                <PrivateRoute>
                  <Layout>
                    <RepairDetail />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/repair/:id/report" element={
                <PrivateRoute>
                  <Layout>
                    <ReportView />
                  </Layout>
                </PrivateRoute>
              } />
              <Route path="/history" element={
                <PrivateRoute>
                  <Layout>
                    <HistoryPage />
                  </Layout>
                </PrivateRoute>
              } />
            </>
          )}
        </Routes>
      </Router>
    </>
  );
}

export default App;
