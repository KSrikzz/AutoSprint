import React, { useState } from 'react';
import { createDependency } from '../services/api';

const DependencySelector = ({ tasks = [], onDependencyAdded }) => {
  const [targetId, setTargetId] = useState('');
  const [prereqId, setPrereqId] = useState('');
  const [error, setError] = useState('');

  const handleLink = async (e) => {
    e.preventDefault();
    setError('');
    
    if (targetId === prereqId) {
      setError("A task cannot depend on itself.");
      return;
    }

    try {
      await createDependency(targetId, prereqId);
      
      setTargetId('');
      setPrereqId('');
      
      if (onDependencyAdded) onDependencyAdded();
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid dependency: Check for cycles.");
    }
  };
  
  const activeTasks = tasks.filter(t => t.status !== "Done");

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Establish Dependency</h2>
      <form onSubmit={handleLink} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target Task</label>
            <select 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 outline-none"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              required
            >
              <option value="">Select task...</option>
              {activeTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Prerequisite</label>
            <select 
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:ring-2 focus:ring-slate-900 outline-none"
              value={prereqId}
              onChange={(e) => setPrereqId(e.target.value)}
              required
            >
              <option value="">Select prerequisite...</option>
              {activeTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-xs font-bold italic bg-red-50 p-2 rounded-md border border-red-100">{error}</p>}

        <button 
          type="submit"
          className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-[0.98]"
        >
          Link Tasks & Update Graph
        </button>
      </form>
    </div>
  );
};

export default DependencySelector;