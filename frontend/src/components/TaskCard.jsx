import React from 'react';
import { useAuth } from '../context/AuthContext';

const TaskCard = ({ task, isCritical, handleAction }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDone = task.status === "Done";
  const unsolvedDependencies = (task.dependencies || []).filter(dep => dep.status !== "Done");
  const isBlocked = unsolvedDependencies.length > 0 && !isDone;

  return (
    <div className={`p-4 rounded-lg border transition-colors ${
      isDone
        ? 'bg-slate-800/20 border-slate-800 opacity-50'
        : isCritical
        ? 'bg-amber-500/5 border-amber-500/30'
        : isBlocked
        ? 'bg-slate-800/30 border-slate-700 border-dashed'
        : 'bg-slate-800/30 border-slate-700 hover:border-slate-600'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
              isDone ? 'bg-slate-800 text-slate-500'
              : task.priority > 3 ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-slate-700/50 text-slate-400'
            }`}>
              {task.category || "General"}
            </span>
            {isCritical && !isDone && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Critical
              </span>
            )}
            {isBlocked && (
              <span
                title={`Blocked by: ${unsolvedDependencies.map(d => d.title).join(", ")}`}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-700/50 text-slate-500 cursor-help"
              >
                Blocked
              </span>
            )}
          </div>

          <h4 className={`text-sm font-semibold truncate ${isDone ? 'text-slate-500 line-through' : 'text-white'}`}>
            {task.title}
          </h4>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500 tabular-nums">{task.estimated_hours}h</span>

          <div className="flex gap-1">
            {!isDone && (
              <button
                onClick={() => !isBlocked && handleAction('complete', task.id)}
                disabled={isBlocked}
                className={`w-7 h-7 rounded-md flex items-center justify-center text-xs transition-colors ${
                  isBlocked
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-600/20'
                }`}
                title={isBlocked ? `Blocked by: ${unsolvedDependencies.map(d => d.title).join(", ")}` : "Complete"}
              >
                ✓
              </button>
            )}
            {isAdmin && (
              <button
                onClick={() => handleAction('delete', task.id)}
                className="w-7 h-7 rounded-md bg-slate-800/50 text-slate-500 hover:bg-red-500/10 hover:text-red-400 transition-colors flex items-center justify-center text-xs border border-slate-700/50"
                title="Delete"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;