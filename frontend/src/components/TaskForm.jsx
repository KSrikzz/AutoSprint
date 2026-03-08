import React, { useState } from 'react';
import { createTask } from '../services/api';

const TaskForm = ({ onTaskAdded }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsAnalyzing(true);
    try {
      await createTask({ 
        title, 
        description,
        status: "Todo" 
      });
      setTitle('');
      setDescription('');
      if (onTaskAdded) onTaskAdded(); 
    } catch (err) {
      console.error("AI Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
      <h2 className="text-xl font-black mb-4 text-slate-900 uppercase tracking-tight">
        {isAnalyzing ? '✨ AI is Categorizing...' : 'Identify New Task'}
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Task Title (e.g., Fix Memory Leak)"
            className="p-3 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-slate-50"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            disabled={isAnalyzing}
          />
          <input
            type="text"
            placeholder="Add context for AI Risk Assessment..."
            className="p-3 border rounded-xl focus:ring-2 focus:ring-slate-900 outline-none bg-slate-50"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isAnalyzing}
          />
        </div>
        <button
          type="submit"
          disabled={isAnalyzing}
          className={`w-full md:w-max self-end px-8 py-3 rounded-xl font-bold transition-all ${
            isAnalyzing ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg'
          }`}
        >
          {isAnalyzing ? 'Analyzing Risks...' : 'Generate AI Ticket'}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;