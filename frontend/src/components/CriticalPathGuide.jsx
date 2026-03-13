import React from 'react';

const CriticalPathGuide = ({ criticalTasks }) => {
  if (!criticalTasks || criticalTasks.length === 0) return null;

  const nextTask = criticalTasks.find(t => t.status !== "Done");

  return (
    <div className="card px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
        <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Critical Path</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {criticalTasks.map((task, idx) => (
          <React.Fragment key={task.id}>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md border ${
              task.status === "Done"
                ? 'bg-slate-800/50 border-slate-700 text-slate-500 line-through'
                : task.id === nextTask?.id
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold'
                : 'bg-slate-800/50 border-slate-700 text-slate-400'
            }`}>
              {task.title}
            </span>
            {idx < criticalTasks.length - 1 && (
              <span className="text-slate-600 text-xs">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {nextTask && (
        <div className="sm:ml-auto text-xs text-slate-400 shrink-0">
          Next: <span className="text-amber-400 font-medium">{nextTask.title}</span>
        </div>
      )}
    </div>
  );
};

export default CriticalPathGuide;
