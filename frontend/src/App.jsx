import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KanbanBoard from './pages/KanbanBoard';
import Login from './pages/Login';
import RepairDetail from './pages/RepairDetail';
import ReportView from './pages/ReportView';
import HistoryPage from './pages/History';
import Layout from './components/Layout';
import { Toaster } from 'sonner';
import './index.css';

const queryClient = new QueryClient();

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

import Settings from './pages/Settings';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" richColors closeButton />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
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
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
