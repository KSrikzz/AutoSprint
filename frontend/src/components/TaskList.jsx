import React from 'react';
import { deleteTask, completeTask } from '../services/api';

const TaskList = ({ tasks, criticalIds, totalHours, onAction }) => {
  const handleAction = async (action, id, title) => {
    const message = action === 'delete' 
      ? `🗑️ Permanent: Delete "${title}"?` 
      : `✅ Mark "${title}" as completed?`;
    
    if (!window.confirm(message)) return;

    try {
      action === 'delete' ? await deleteTask(id) : await completeTask(id);
      if (onAction) await onAction(); 
    } catch (err) {
      console.error("Action failed:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Execution Plan</h2>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining Effort</span>
          <p className="text-2xl font-black text-slate-900">{totalHours} hrs</p>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map(task => {
          const isCritical = criticalIds.includes(task.id);
          const isDone = task.status === "Done";
          return (
            <div key={task.id} className={`p-5 rounded-xl border-2 transition-all duration-300 flex justify-between items-center ${
              isDone ? 'opacity-40 bg-slate-50 border-slate-200 grayscale' : 
              isCritical ? 'border-orange-500 bg-orange-50 shadow-sm scale-[1.01]' : 
              'border-slate-100 bg-slate-50'
            }`}>
              <div className="flex-grow pr-4">
                <div className="flex items-center gap-2">
                  <h3 className={`font-bold text-lg ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</h3>
                  {isCritical && !isDone && <span className="bg-orange-500 text-white text-[9px] px-2 py-1 rounded font-bold uppercase tracking-tighter">Bottleneck</span>}
                </div>
                <div className="flex gap-2 mt-2">
                  {task.is_ready && !isDone && <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Ready</span>}
                  <span className="text-slate-500 text-[10px] font-bold uppercase">Work: {task.estimated_hours}h</span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {!isDone && (
                  <button onClick={() => handleAction('complete', task.id, task.title)} className="bg-white text-green-600 hover:bg-green-600 hover:text-white p-2.5 rounded-lg border border-green-200 transition-all shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  </button>
                )}
                <button onClick={() => handleAction('delete', task.id, task.title)} className="bg-white text-slate-400 hover:text-red-600 p-2.5 rounded-lg border border-slate-200 transition-all hover:border-red-200 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TaskList;    