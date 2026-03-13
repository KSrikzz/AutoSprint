import React, { useState } from 'react';
import { createDependency } from '../services/api';

const DependencySelector = ({ tasks, onDependencyAdded }) => {
  const [targetId, setTargetId] = useState('');
  const [prereqId, setPrereqId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!targetId || !prereqId) return;
    setLoading(true);
    try {
      await createDependency(targetId, prereqId);
      setTargetId('');
      setPrereqId('');
      if (onDependencyAdded) onDependencyAdded();
    } catch (err) {
      alert("Error: Cycle detected or invalid dependency.");
    } finally {
      setLoading(false);
    }
  };

  const activeTasks = tasks.filter(t => t.status !== "Done");

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Link Dependencies</h3>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
        <div className="flex-1 min-w-0">
          <label className="text-xs text-slate-500 mb-1 block">Task</label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select task...</option>
            {activeTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-0">
          <label className="text-xs text-slate-500 mb-1 block">Depends on</label>
          <select
            value={prereqId}
            onChange={(e) => setPrereqId(e.target.value)}
            className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
          >
            <option value="">Select prerequisite...</option>
            {activeTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <button
          onClick={handleLink}
          disabled={loading || !targetId || !prereqId}
          className={`h-[38px] px-5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
            loading || !targetId || !prereqId
              ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          {loading ? 'Linking...' : 'Link'}
        </button>
      </div>
    </div>
  );
};

export default DependencySelector;