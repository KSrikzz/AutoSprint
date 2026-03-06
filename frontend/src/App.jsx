import React, { useState } from 'react';
import TaskList from './components/TaskList';
import RiskMap from './components/RiskMap';
import TaskForm from './components/TaskForm';
import DependencySelector from './components/DependencySelector';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  // Increments the key to force sub-components to re-fetch data from the API
  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-slate-900 text-white p-6 shadow-md mb-8">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold uppercase tracking-tight">AutoSprint</h1>
          <p className="text-sm text-slate-400">Autonomous Execution Intelligence</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4">
        {/* Step 1: Add new tasks to the system */}
        <TaskForm onTaskAdded={handleRefresh} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-8">
            {/* Step 2: View prioritized tasks based on graph logic */}
            <TaskList key={`list-${refreshKey}`} />
            
            {/* Step 3: Link tasks together and trigger Cycle Detection */}
            <DependencySelector onDependencyAdded={handleRefresh} />
          </div>

          {/* Step 4: Visualize execution risk and bottleneck analysis */}
          <RiskMap key={`map-${refreshKey}`} />
        </div>
      </main>
    </div>
  );
}

export default App;