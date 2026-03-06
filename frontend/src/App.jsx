import React, { useState, useEffect, useCallback } from 'react';
import TaskList from './components/TaskList';
import RiskMap from './components/RiskMap';
import TaskForm from './components/TaskForm';
import DependencySelector from './components/DependencySelector';
import { fetchPrioritizedTasks, fetchCriticalPath } from './services/api';

function App() {
  const [data, setData] = useState({ tasks: [], criticalIds: [], totalHours: 0 });
  const refreshDashboard = useCallback(async () => {
    try {
      const [priorityRes, criticalRes] = await Promise.all([
        fetchPrioritizedTasks(),
        fetchCriticalPath()
      ]);
      
      setData({
        tasks: priorityRes?.prioritized_tasks || [],
        criticalIds: criticalRes?.critical_path_ids || [],
        totalHours: criticalRes?.total_sprint_hours || 0
      });
    } catch (err) {
      console.error("Dashboard Sync Error:", err);
    }
  }, []);

  useEffect(() => { refreshDashboard(); }, [refreshDashboard]);

  return (
    <div className="min-h-screen bg-slate-50 pb-12 font-sans text-slate-900">
      <header className="bg-slate-900 text-white p-6 shadow-md mb-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold uppercase tracking-tight">AutoSprint</h1>
          <p className="text-sm text-slate-400">Autonomous Execution Intelligence</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4">
        <TaskForm onTaskAdded={refreshDashboard} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            {/* TaskList now strictly receives data and triggers the refresh */}
            <TaskList 
              tasks={data.tasks} 
              criticalIds={data.criticalIds} 
              totalHours={data.totalHours} 
              onAction={refreshDashboard} 
            />
            <DependencySelector 
            tasks={data.tasks}
            onDependencyAdded={refreshDashboard} />
          </div>

          <div className="sticky top-8">
            {/* RiskMap automatically updates when data.tasks changes */}
            <RiskMap tasks={data.tasks} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;