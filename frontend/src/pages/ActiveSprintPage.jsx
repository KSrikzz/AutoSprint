import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSprints, fetchSprintTasks } from '../services/api';
import KanbanBoard from '../components/KanbanBoard';
import { useAuth } from '../context/AuthContext';

const ActiveSprintPage = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'scrum_master' || user?.role === 'developer';

  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSprintsAndTasks = useCallback(async () => {
    try {
      const data = await fetchSprints(projectId);
      setSprints(data);

      if (data.length > 0) {
        // Determine initial sprint to show: active sprint first, otherwise the first sprint
        let initialSprint = data.find(s => s.status === 'active');
        if (!initialSprint) {
          initialSprint = data[0];
        }

        // Use already selected sprint if valid
        if (selectedSprintId) {
          const current = data.find(s => String(s.id) === String(selectedSprintId));
          if (current) initialSprint = current;
        }

        setSelectedSprintId(initialSprint.id);
        setSelectedSprint(initialSprint);
        
        const sprintTasks = await fetchSprintTasks(initialSprint.id);
        setTasks(sprintTasks);
      } else {
        setSelectedSprint(null);
        setSelectedSprintId('');
        setTasks([]);
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load sprints data', err);
      setLoading(false);
    }
  }, [projectId, selectedSprintId]);

  useEffect(() => {
    loadSprintsAndTasks();
  }, [projectId]);

  const handleSprintChange = async (sprintId) => {
    setSelectedSprintId(sprintId);
    const sprint = sprints.find(s => String(s.id) === String(sprintId));
    setSelectedSprint(sprint);
    setLoading(true);
    try {
      const sprintTasks = await fetchSprintTasks(sprintId);
      setTasks(sprintTasks);
    } catch (err) {
      console.error('Failed to load tasks for selected sprint', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && sprints.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading sprints board...</div>;
  }

  if (sprints.length === 0) {
    return (
      <div className="p-6">
        <div className="card p-12 text-center text-slate-500 flex flex-col items-center justify-center border-dashed min-h-[300px]">
          <svg className="w-12 h-12 text-slate-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-white">No Sprints Created</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6 leading-relaxed">
            {canEdit
              ? "There are no sprints for this project. Create a sprint in the Sprint Planning tab to get started."
              : "No sprints are running for this project. Check back once your team lead creates a sprint."}
          </p>
          {canEdit && (
            <button
              onClick={() => navigate(`/projects/${projectId}/planning`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              Go to Sprint Planning
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Target Sprint Selector Bar */}
      <div className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex-wrap">
        <span className="text-xs font-semibold text-slate-400">Target Sprint:</span>
        <select
          value={selectedSprintId}
          onChange={(e) => handleSprintChange(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
        >
          {sprints.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
          ))}
        </select>
        {selectedSprint && (
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            selectedSprint.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
            selectedSprint.status === 'completed' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
            'bg-slate-800 text-slate-400 border border-slate-700/50'
          }`}>
            {selectedSprint.status}
          </span>
        )}
      </div>

      {selectedSprint && (
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Sprint Tasks: {selectedSprint.name}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Duration {selectedSprint.start_date} to {selectedSprint.end_date} · Capacity {
                (user?.role === 'developer')
                  ? tasks.filter(t => t.assigned_to_id === user.id || (t.assignees && t.assignees.some(a => a.id === user.id))).reduce((acc, t) => acc + (Number(t.estimated_hours) || 0), 0)
                  : (selectedSprint.hours_used || 0)
              }/{selectedSprint.velocity}h
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-400 tabular-nums">{selectedSprint.completion_pct}% Done</span>
            </div>
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="fade-in">
        <KanbanBoard
          tasks={tasks}
          onAction={loadSprintsAndTasks}
        />
      </div>
    </div>
  );
};

export default ActiveSprintPage;
