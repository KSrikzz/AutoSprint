import React from 'react';
import { deleteTask, completeTask } from '../services/api';
import TaskCard from './TaskCard';

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
        <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Execution Plan</h2>
        <div className="text-right">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remaining Effort</span>
          <p className="text-2xl font-black text-slate-900">{totalHours} hrs</p>
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map(task => {
          const isTrueBottleneck = criticalIds.includes(task.id) && 
            tasks.some(t => t.prerequisites?.some(p => p.id === task.id));
          return (
          <TaskCard 
            key={task.id} 
            task={task} 
            isCritical={isTrueBottleneck} 
            handleAction={handleAction} 
          />
          );
        })}
        {tasks.length === 0 && (
          <div className="text-center py-10 text-slate-400 italic border-2 border-dashed border-slate-100 rounded-xl">
            No tasks found in sprint backlog.
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;