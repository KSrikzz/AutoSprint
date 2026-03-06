import React, { useEffect, useState } from 'react';
import { fetchPrioritizedTasks } from '../services/api';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const response = await fetchPrioritizedTasks();
        // Since api.js now uses an interceptor, 'response' IS the backend object
        setTasks(response.prioritized_tasks || []);
      } catch (err) {
        console.error("Failed to load tasks", err);
      }
    };
    loadTasks();
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Prioritized Execution Plan</h2>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className={`p-4 rounded-lg border-l-4 ${
            task.priority.includes('Critical') ? 'bg-red-50 border-red-500' : 'bg-slate-50 border-slate-300'
          }`}>
            <div className="flex justify-between items-start">
              <h3 className={`font-bold ${task.priority.includes('Critical') ? 'text-red-700' : 'text-slate-800'}`}>
                {task.title}
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                {task.priority}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Effort: {task.estimated_hours} hrs</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;