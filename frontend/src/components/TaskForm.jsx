import React, { useState } from 'react';
import { createTask } from '../services/api';

const TaskForm = ({ onTaskAdded }) => {
  const [title, setTitle] = useState('');
  const [hours, setHours] = useState(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createTask({ 
        title, 
        estimated_hours: parseFloat(hours),
        status: "Todo" 
      });
      setTitle('');
      setHours(1);
      if (onTaskAdded) onTaskAdded(); 
    } catch (err) {
      console.error("Failed to add task:", err);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h2 className="text-xl font-bold mb-4 text-slate-800">Quick Add Task</h2>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="What needs to be done?"
          className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-slate-900 outline-none"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hours:</label>
          <input
            type="number"
            min="1"
            className="w-20 p-2 border rounded-md"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="bg-slate-900 text-white px-6 py-2 rounded-md hover:bg-slate-800 transition-colors"
        >
          Add to Sprint
        </button>
      </form>
    </div>
  );
};

export default TaskForm;