import React, { useState, useEffect, useCallback } from 'react';
import RiskMap from './components/RiskMap';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import DependencySelector from './components/DependencySelector';
import CriticalPathGuide from './components/CriticalPathGuide';
import TaskGraph from './components/TaskGraph';
import Login from './components/Login';
import Register from './components/Register';
import { AuthProvider, useAuth } from './context/AuthContext';
import { fetchPrioritizedTasks, fetchCriticalPath } from './services/api';

function Dashboard() {
  const { user, logout } = useAuth();
  const [data, setData] = useState({ tasks: [], criticalPath: [], criticalIds: [], totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const isAdmin = user?.role === 'admin';

  const refreshDashboard = useCallback(async () => {
    try {
      const [tasksRes, criticalRes] = await Promise.all([
        fetchPrioritizedTasks(),
        fetchCriticalPath()
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
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  return (
    <div className="min-h-screen pb-8">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AS</span>
              </div>
              <span className="text-base font-semibold text-white tracking-tight">AutoSprint</span>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-full border border-slate-700/50">
              <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-blue-400'}`}></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.role}</span>
              <span className="text-[11px] text-slate-500 font-medium">|</span>
              <span className="text-[11px] text-slate-300 font-semibold">{user?.username}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              {data.totalHours}h estimated
            </span>
            <button 
              onClick={logout}
              className="text-xs font-semibold text-slate-500 hover:text-white transition-colors"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-4 space-y-3">
        {/* Critical Path Banner */}
        <div className="fade-in">
          <CriticalPathGuide criticalTasks={data.criticalPath} />
        </div>

        {/* Forms Row (Admin Only) */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 fade-in" style={{ animationDelay: '0.05s' }}>
            <TaskForm onTaskAdded={refreshDashboard} />
            <DependencySelector
              tasks={data.tasks}
              onDependencyAdded={refreshDashboard}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-start fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Left: Task List */}
          <div className="xl:col-span-7">
            <TaskList
              tasks={data.tasks}
              criticalIds={data.criticalIds}
              totalHours={data.totalHours}
              onAction={refreshDashboard}
            />
          </div>

          {/* Right: Graph + Risk */}
          <div className="xl:col-span-5 space-y-3 xl:sticky xl:top-16">
            <TaskGraph tasks={data.tasks} criticalIds={data.criticalIds} />
            <RiskMap tasks={data.tasks} />
          </div>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'

  if (!user) {
    if (authView === 'register') {
      return (
        <Register 
          onSwitchToLogin={() => setAuthView('login')} 
          onRegisterSuccess={() => setAuthView('login')}
        />
      );
    }
    return <Login onSwitchToRegister={() => setAuthView('register')} />;
  }

  return <Dashboard />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
