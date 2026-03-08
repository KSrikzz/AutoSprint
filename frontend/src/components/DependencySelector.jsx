import React, { useState } from 'react';
import { createDependency } from '../services/api';

const DependencySelector = ({ tasks, onDependencyAdded }) => {
  const [targetId, setTargetId] = useState('');
  const [prereqId, setPrereqId] = useState('');

  const handleLink = async () => {
    if (!targetId || !prereqId) return;
    try {
      await createDependency(targetId, prereqId);
      setTargetId('');
      setPrereqId('');
      if (onDependencyAdded) onDependencyAdded();
    } catch (err) {
      alert("Error: Cycle detected or invalid dependency.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 uppercase tracking-tight">Establish Dependency</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Target Task</label>
          <select value={targetId} onChange={(e) => setTargetId(e.target.value)} className="w-full p-2 border rounded bg-slate-50 text-sm">
            <option value="">Select task...</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase">Prerequisite</label>
          <select value={prereqId} onChange={(e) => setPrereqId(e.target.value)} className="w-full p-2 border rounded bg-slate-50 text-sm">
            <option value="">Select prerequisite...</option>
            {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        </div>
      </div>
      <button onClick={handleLink} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-all uppercase tracking-tight">
        Link Tasks & Update Graph
      </button>
    </div>
  );
};

export default DependencySelector;