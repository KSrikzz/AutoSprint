import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ProjectsPage from './components/ProjectsPage';
import DashboardPage from './components/DashboardPage';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Application Layout Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Root Redirects */}
            <Route index element={<Navigate to="/projects" replace />} />

            {/* General Workspace Routes */}
            <Route path="projects" element={<ProjectsPage />} />

            {/* Project Specific Workspaces */}
            <Route path="projects/:projectId" element={<DashboardPage />} />
            <Route path="projects/:projectId/kanban" element={<DashboardPage />} />
            <Route path="projects/:projectId/sprint" element={<DashboardPage />} />
            <Route path="projects/:projectId/analytics" element={<DashboardPage />} />

            {/* Admin-only Panel */}
            <Route
              path="admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Wildcard Catchall -> Home */}
          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
