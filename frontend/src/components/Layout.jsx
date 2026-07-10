import React, { useState, useEffect } from 'react';
import { Outlet, useParams, Link, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../context/AuthContext';
import { fetchProjects } from '../services/api';

const Layout = () => {
  const { user } = useAuth();
  const { projectId } = useParams();
  const location = useLocation();
  const [projectName, setProjectName] = useState('Project');

  useEffect(() => {
    const loadProjectName = async () => {
      if (!projectId) return;
      try {
        const projects = await fetchProjects();
        const active = projects.find(p => String(p.id) === String(projectId));
        if (active) {
          setProjectName(active.name);
        }
      } catch (err) {
        console.error('Failed to load project details for breadcrumbs', err);
      }
    };
    loadProjectName();
  }, [projectId]);

  // Determine active tab name for breadcrumbs
  const getActiveTabName = () => {
    if (location.pathname.endsWith('/sprint')) return 'Sprint';
    if (location.pathname.endsWith('/analytics')) return 'Analytics';
    
    // Check if we are inside a dashboard page and see if tab is selected via search/state or default
    return 'Dashboard';
  };

  const activeTabName = getActiveTabName();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 pb-16 md:pb-0">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-3 flex items-center justify-between shrink-0">
          {/* Left brand or mobile selector */}
          <div className="flex items-center gap-3">
            <span className="md:hidden text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center font-bold text-white text-xs">AS</div>
              AutoSprint
            </span>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div 
              className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400 text-xs shadow-inner cursor-pointer"
              title={user?.username}
            >
              {user?.username?.substring(0, 2).toUpperCase() || 'US'}
            </div>
          </div>
        </header>

        {/* Breadcrumb Navigation bar */}
        {projectId && (
          <div className="bg-slate-900/40 border-b border-slate-800/50 px-6 py-2 flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <span>&gt;</span>
            <Link to={`/projects/${projectId}`} className="hover:text-white transition-colors">{projectName}</Link>
            <span>&gt;</span>
            <span className="text-white font-medium">{activeTabName}</span>
          </div>
        )}

        {/* Sub-view Content Outlet */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
