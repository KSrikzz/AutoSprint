import React from 'react';

const RiskMap = ({ tasks }) => {
  const activeTasks = tasks.filter(t => t.status !== "Done");
  const high = activeTasks.filter(t => t.priority >= 4);
  const med = activeTasks.filter(t => t.priority === 3);
  const low = activeTasks.filter(t => t.priority <= 2);

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Risk Overview</h3>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className={`rounded-lg p-3 text-center border ${
          high.length > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-slate-800/30 border-slate-700'
        }`}>
          <div className={`text-2xl font-bold ${high.length > 0 ? 'text-red-400' : 'text-slate-600'}`}>{high.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">High</div>
        </div>
        <div className="rounded-lg p-3 text-center border bg-slate-800/30 border-slate-700">
          <div className="text-2xl font-bold text-amber-400">{med.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Medium</div>
        </div>
        <div className="rounded-lg p-3 text-center border bg-slate-800/30 border-slate-700">
          <div className="text-2xl font-bold text-emerald-400">{low.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Low</div>
        </div>
      </div>

      {high.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-slate-500 mb-2">High priority tasks</p>
          {high.map(task => (
            <div key={task.id} className="flex items-center justify-between p-2.5 rounded-lg border border-red-500/10 bg-red-500/5">
              <span className="text-xs text-red-400 truncate pr-3">{task.title}</span>
              <span className="text-[10px] text-red-500 shrink-0">Priority {task.priority}</span>
            </div>
          ))}
        </div>
      )}

      {high.length === 0 && (
        <p className="text-xs text-slate-600 text-center py-4">No high-risk tasks.</p>
      )}
    </div>
  );
};

export default RiskMap;