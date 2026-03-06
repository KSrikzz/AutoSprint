import React, { useState, useEffect } from 'react';
import { fetchPrioritizedTasks, createDependency } from '../services/api';

const DependencySelector = ({ onDependencyAdded }) => {
  const [tasks, setTasks] = useState([]);
  const [taskId, setTaskId] = useState('');
  const [prereqId, setPrereqId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTasks = async () => {
      const response = await fetchPrioritizedTasks();
      setTasks(response.prioritized_tasks || []);
    };
    loadTasks();
  }, []);

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    
    if (taskId === prereqId) {
      setError("A task cannot depend on itself.");
      return;
    }

    try {
      await addDependency(taskId, prereqId);
      setTaskId('');
      setPrereqId('');
      if (onDependencyAdded) onDependencyAdded();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to link tasks.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mt-8">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Establish Dependency</h2>
      <form onSubmit={handleLink} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Task</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              required
            >
              <option value="">Select task...</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prerequisite</label>
            <select 
              className="w-full p-2 border rounded-md"
              value={prereqId}
              onChange={(e) => setPrereqId(e.target.value)}
              required
            >
              <option value="">Select prerequisite...</option>
              {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm italic">{error}</p>}

        <button 
          type="submit"
          className="w-full bg-slate-100 text-slate-800 font-bold py-2 rounded-md hover:bg-slate-200 transition-colors"
        >
          Link Tasks & Check for Cycles
        </button>
      </form>
    </div>
  );
};

export default DependencySelector;