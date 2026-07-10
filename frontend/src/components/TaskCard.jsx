import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AIInsightsPanel from './AIInsightsPanel';

const TaskCard = ({ task, isCritical, handleAction, projectId, onSubtaskCreated }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'scrum_master';
  const canEdit = user?.role === 'scrum_master' || user?.role === 'developer';
  const isDone = task.status === "Done";
  const unsolvedDependencies = (task.dependencies || []).filter(dep => dep.status !== "Done");
  const isBlocked = unsolvedDependencies.length > 0 && !isDone;
  const [expanded, setExpanded] = useState(false);

  const riskFlags = task.risk_flags ? JSON.parse(task.risk_flags) : [];

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
            {riskFlags.length > 0 && !isDone && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
                ⚠ {riskFlags.length} risk{riskFlags.length > 1 ? 's' : ''}
              </span>
            )}
            {task.confidence_score != null && !isDone && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                task.confidence_score >= 0.8 ? 'bg-emerald-500/10 text-emerald-400' :
                task.confidence_score >= 0.5 ? 'bg-amber-500/10 text-amber-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {Math.round(task.confidence_score * 100)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h4
              className={`text-sm font-semibold truncate cursor-pointer ${isDone ? 'text-slate-500 line-through' : 'text-white hover:text-blue-300'}`}
              onClick={() => setExpanded(!expanded)}
            >
              {task.title}
            </h4>
          </div>
          {task.description && (
            <p className="text-xs text-slate-500 mt-0.5 truncate">{task.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500 tabular-nums">{task.estimated_hours}h</span>
          
          {task.assigned_to_id && (
            <div className="w-6 h-6 rounded-full bg-blue-600/30 border border-blue-600/50 flex items-center justify-center text-[10px] text-blue-400 font-bold" title="Assigned">
              U
            </div>
          )}

          <div className="flex gap-1">
            {!isDone && canEdit && (
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
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-md bg-slate-800/50 text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center text-xs border border-slate-700/50"
              title="AI Insights"
            >
              {expanded ? '▾' : '▸'}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable AI Insights */}
      {expanded && (
        <AIInsightsPanel
          task={task}
          projectId={projectId}
          onSubtaskCreated={onSubtaskCreated}
        />
      )}
    </div>
  );
};

export default TaskCard;