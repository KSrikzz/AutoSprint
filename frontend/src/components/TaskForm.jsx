import React, { useState } from 'react';
import { createTask } from '../services/api';

const TaskForm = ({ onTaskAdded }) => {
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || loading) return;
    setLoading(true);
    try {
      await createTask({ title, description: context });
      setTitle('');
      setContext('');
      onTaskAdded();
    } catch (err) {
      console.error("Failed to create task:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4">Add Task</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
          <div className="flex-1 min-w-0">
            <label className="text-xs text-slate-500 mb-1 block">Title</label>
            <input
              type="text"
              required
              placeholder="What needs to be done?"
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-0">
            <label className="text-xs text-slate-500 mb-1 block">Context <span className="text-slate-600">(optional)</span></label>
            <input
              type="text"
              placeholder="Additional details..."
              className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !title}
            className={`h-[38px] px-5 rounded-lg text-sm font-medium transition-colors shrink-0 ${
              loading || !title
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </div>

        {/* AI thinking indicator */}
        {loading && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/10">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
            <span className="text-xs text-blue-400">AI is analyzing your task — estimating effort, priority & category...</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default TaskForm;