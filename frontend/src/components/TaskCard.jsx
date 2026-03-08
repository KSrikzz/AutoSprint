import React from 'react';

const TaskCard = ({ task, isCritical, handleAction }) => {
  const isHighRisk = task.priority >= 4;

  return (
    <div className={`p-5 rounded-xl border-2 transition-all duration-300 flex justify-between items-center 
      ${task.status === "Done" ? 'opacity-40 grayscale bg-slate-50' : 
        isHighRisk ? 'red-pulse border-red-200 bg-red-50' : 
        isCritical ? 'border-orange-500 bg-orange-50 shadow-sm scale-[1.01]' : 'border-slate-100 bg-slate-50'}`}>
      
      <div className="grow pr-4">
        <div className="flex items-center gap-2 mb-1">
          {/* AI Generated Category Badge */}
          <span className="bg-slate-900 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide">
            {task.category || 'General'}
          </span>
          <h3 className={`font-bold text-lg ${task.status === "Done" ? 'line-through text-slate-400' : 'text-slate-900'}`}>
            {task.title}
          </h3>
          {isCritical && task.status !== "Done" && (
            <span className="bg-orange-500 text-white text-[9px] px-2 py-1 rounded font-bold uppercase tracking-tighter">Bottleneck</span>
          )}
        </div>
        
        <div className="flex gap-3 text-[10px] font-bold uppercase tracking-tight text-slate-500">
          <span className={isHighRisk ? 'text-red-600' : ''}>PRIORITY {task.priority}</span>
          <span>EST. {task.estimated_hours}H</span>
        </div>
      </div>

      <div className="flex gap-2">
        {task.status !== "Done" && (
          <button onClick={() => handleAction('complete', task.id, task.title)} className="p-2 bg-white border border-green-200 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm">
            ✓
          </button>
        )}
        <button onClick={() => handleAction('delete', task.id, task.title)} className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-red-600 transition-all shadow-sm">
          ✕
        </button>
      </div>
    </div>
  );
};

export default TaskCard;