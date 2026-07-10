import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import TaskList from './TaskList';
import KanbanBoard from './KanbanBoard';
import TaskGraph from './TaskGraph';
import RiskMap from './RiskMap';
import CriticalPathGuide from './CriticalPathGuide';
import SprintManager from './SprintManager';
import BurndownChart from './BurndownChart';
import TaskForm from './TaskForm';
import DependencySelector from './DependencySelector';
import { useAuth } from '../context/AuthContext';
import { fetchPrioritizedTasks, fetchCriticalPath } from '../services/api';

const DashboardPage = () => {
  const { projectId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'scrum_master' || user?.role === 'developer';

  const [activeTab, setActiveTab] = useState('tasks'); // tasks, kanban, sprint, analytics
  const [data, setData] = useState({ tasks: [], criticalPath: [], criticalIds: [], totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [activeSprint, setActiveSprint] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Sync tab state with URL path
  useEffect(() => {
    if (location.pathname.endsWith('/sprint')) {
      setActiveTab('sprint');
    } else if (location.pathname.endsWith('/analytics')) {
      setActiveTab('analytics');
    } else if (location.pathname.endsWith('/kanban')) {
      setActiveTab('kanban');
    } else {
      setActiveTab('tasks');
    }
  }, [location.pathname]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'sprint') {
      navigate(`/projects/${projectId}/sprint`);
    } else if (tabId === 'analytics') {
      navigate(`/projects/${projectId}/analytics`);
    } else if (tabId === 'kanban') {
      navigate(`/projects/${projectId}/kanban`);
    } else {
      navigate(`/projects/${projectId}`);
    }
  };

  const refreshDashboard = useCallback(async () => {
    if (!projectId) return;
    try {
      const [tasksRes, criticalRes] = await Promise.all([
        fetchPrioritizedTasks(projectId),
        fetchCriticalPath(projectId)
      ]);

      const tasks = Array.isArray(tasksRes) ? tasksRes : [];
      const criticalPath = Array.isArray(criticalRes) ? criticalRes : [];
      const activeTasks = tasks.filter(t => t.status !== "Done");

      setData({
        tasks,
        criticalPath,
        criticalIds: criticalPath.map(t => t.id),
        totalHours: activeTasks.reduce((acc, t) => acc + (Number(t.estimated_hours) || 0), 0)
      });
      setLoading(false);
    } catch (err) {
      console.error("Dashboard refresh failed:", err);
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading dashboard...</div>;
  }

  const tabs = [
    { id: 'tasks', label: 'Tasks' },
    { id: 'kanban', label: 'Kanban' },
    { id: 'sprint', label: 'Sprint' },
    { id: 'analytics', label: 'Analytics' }
  ];

  return (
    <div className="relative min-h-[calc(100vh-100px)] p-6">
      {/* Notion-style tab sub-navigation row */}
      <div className="flex border-b border-slate-800 mb-6 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="fade-in">
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {canEdit && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in" style={{ animationDelay: '0.05s' }}>
                <TaskForm onTaskAdded={refreshDashboard} projectId={projectId} />
                <DependencySelector tasks={data.tasks} onDependencyAdded={refreshDashboard} />
              </div>
            )}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Left: Task List (7/12) */}
              <div className="xl:col-span-7">
                <TaskList
                  tasks={data.tasks}
                  criticalIds={data.criticalIds}
                  totalHours={data.totalHours}
                  onAction={refreshDashboard}
                  projectId={projectId}
                />
              </div>
              {/* Right: Dependency Graph (5/12) */}
              <div className="xl:col-span-5 space-y-6">
                <TaskGraph tasks={data.tasks} criticalIds={data.criticalIds} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kanban' && (
          <div className="w-full">
            <KanbanBoard
              tasks={data.tasks}
              onAction={refreshDashboard}
            />
          </div>
        )}

        {activeTab === 'sprint' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            <div className="xl:col-span-5">
              <SprintManager
                projectId={projectId}
                activeSprint={activeSprint}
                onSelectSprint={setActiveSprint}
              />
            </div>
            <div className="xl:col-span-7">
              {activeSprint ? (
                <BurndownChart sprintId={activeSprint.id} />
              ) : (
                <div className="card p-5 flex items-center justify-center min-h-[220px]">
                  <p className="text-xs text-slate-500">Select a sprint on the left to view progress.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <CriticalPathGuide criticalTasks={data.criticalPath} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RiskMap tasks={data.tasks} />
              <div className="card p-5 flex flex-col justify-center min-h-[200px]">
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Metrics Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Remaining Effort:</span>
                    <span className="text-white font-bold">{data.totalHours} hours</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Bottlenecks Detected:</span>
                    <span className="text-amber-500 font-bold">{data.criticalPath.length} critical tasks</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Task Backlog:</span>
                    <span className="text-blue-400 font-bold">{data.tasks.length} total</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer Panel for TaskForm & DependencySelector */}
      {isDrawerOpen && canEdit && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-slate-800 border-l border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between shrink-0">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add & Link Tasks</h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <TaskForm
                onTaskAdded={() => { refreshDashboard(); setIsDrawerOpen(false); }}
                projectId={projectId}
              />
              <DependencySelector
                tasks={data.tasks}
                onDependencyAdded={refreshDashboard}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) (Admin/Developer Only) */}
      {canEdit && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-600/25 transition-transform hover:scale-110 active:scale-95"
          title="Add Task"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default DashboardPage;
