import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchSprints, fetchPrioritizedTasks, fetchCriticalPath } from '../services/api';
import BurndownChart from '../components/BurndownChart';
import CriticalPathGuide from '../components/CriticalPathGuide';
import RiskMap from '../components/RiskMap';
import { useAuth } from '../context/AuthContext';

const AnalyticsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'scrum_master';
  const { projectId } = useParams();
  
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [criticalPath, setCriticalPath] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load sprints first
  useEffect(() => {
    const loadSprintsData = async () => {
      try {
        const sprintsRes = await fetchSprints(projectId);
        setSprints(sprintsRes);
        if (sprintsRes.length > 0) {
          // Default to active sprint, or the first sprint
          const active = sprintsRes.find(s => s.status === 'active');
          const initialSprint = active || sprintsRes[0];
          setSelectedSprintId(initialSprint.id);
          setSelectedSprint(initialSprint);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load sprints', err);
        setLoading(false);
      }
    };
    loadSprintsData();
  }, [projectId]);

  // Load task and critical path data when selectedSprintId changes
  const loadSprintDetails = useCallback(async () => {
    if (!selectedSprintId) return;
    setLoading(true);
    try {
      const [tasksRes, criticalRes] = await Promise.all([
        fetchPrioritizedTasks(projectId),
        fetchCriticalPath(projectId, selectedSprintId)
      ]);
      setTasks(tasksRes);
      setCriticalPath(criticalRes);
    } catch (err) {
      console.error('Failed to load sprint details', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, selectedSprintId]);

  useEffect(() => {
    loadSprintDetails();
  }, [selectedSprintId, loadSprintDetails]);

  const handleSprintChange = (sprintId) => {
    setSelectedSprintId(sprintId);
    const sprint = sprints.find(s => String(s.id) === String(sprintId));
    setSelectedSprint(sprint);
  };

  if (loading && sprints.length === 0) {
    return <div className="p-8 text-center text-slate-400">Loading analytics...</div>;
  }

  // Filter tasks to only show tasks belonging to the currently selected sprint for the Risk Map
  const currentSprintTasks = tasks.filter(t => String(t.sprint_id) === String(selectedSprintId));

  const isDeveloper = user?.role === 'developer';
  
  const displayedCriticalPath = isDeveloper
    ? criticalPath.filter(t => t.assigned_to_id === user.id || (t.assignees && t.assignees.some(a => a.id === user.id)))
    : criticalPath;

  const displayedSprintTasks = isDeveloper
    ? currentSprintTasks.filter(t => t.assigned_to_id === user.id || (t.assignees && t.assignees.some(a => a.id === user.id)))
    : currentSprintTasks;

  return (
    <div className="p-6 space-y-6">
      {/* Target Sprint Selector Bar */}
      {sprints.length > 0 ? (
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
      ) : (
        <div className="card p-8 text-center text-slate-500">
          No sprints created yet. Create a sprint to view analytics.
        </div>
      )}

      {selectedSprintId && (
        <>
          {/* Bottlenecks section */}
          <div className="fade-in">
            <CriticalPathGuide criticalTasks={displayedCriticalPath} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Left: Burndown chart (7/12) */}
            <div className="xl:col-span-7 space-y-6">
              <div className="card p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <h3 className="text-sm font-semibold text-slate-300">Sprint Burndown Tracking ({selectedSprint?.name})</h3>
                </div>

                <BurndownChart sprintId={selectedSprintId} />
              </div>
            </div>

            {/* Right: Risk Map (5/12) */}
            <div className="xl:col-span-5">
              <RiskMap tasks={displayedSprintTasks} />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsPage;
