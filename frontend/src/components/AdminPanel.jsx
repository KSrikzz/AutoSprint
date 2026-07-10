import React, { useState, useEffect } from 'react';
import { fetchUsers, fetchProjects, fetchProjectUsers, grantProjectAccess } from '../services/api';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectUsers, setProjectUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
      const projectsData = await fetchProjects();
      setProjects(projectsData);
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  const loadProjectUsers = async (projectId) => {
    setSelectedProjectId(projectId);
    try {
      const data = await fetchProjectUsers(projectId);
      setProjectUsers(data.map(u => u.id));
    } catch (err) {
      console.error('Error fetching project users', err);
    }
  };

  const handleGrantAccess = async (userId) => {
    if (!selectedProjectId) return;
    try {
      await grantProjectAccess(selectedProjectId, userId);
      // Reload project users
      loadProjectUsers(selectedProjectId);
    } catch (err) {
      console.error('Error granting access', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-2xl font-bold text-white mb-6">Admin Dashboard</h2>

      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'access' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
          onClick={() => setActiveTab('access')}
        >
          Project Access
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase">ID</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase">Username</th>
                <th className="px-6 py-3 text-xs font-medium text-slate-400 uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/80">
                  <td className="px-6 py-4 text-sm text-slate-300">{user.id}</td>
                  <td className="px-6 py-4 text-sm text-white font-medium">{user.username}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                      {user.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'access' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700">
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Select Project</h3>
            <div className="space-y-2">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => loadProjectUsers(project.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedProjectId === project.id ? 'bg-blue-900/40 border-blue-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'}`}
                >
                  {project.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-3">Manage Users</h3>
            {selectedProjectId ? (
              <div className="space-y-2">
                {users.map(user => {
                  const hasAccess = projectUsers.includes(user.id);
                  const isUserAdmin = user.role === 'admin';
                  const disabled = hasAccess || isUserAdmin;
                  return (
                    <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                      <div>
                        <span className="text-white font-medium">{user.username}</span>
                        {isUserAdmin && <span className="ml-2 text-xs text-amber-500">(Admin)</span>}
                      </div>
                      <button
                        onClick={() => handleGrantAccess(user.id)}
                        disabled={disabled}
                        className={`px-3 py-1 text-xs font-medium rounded ${
                          hasAccess ? 'bg-emerald-500/20 text-emerald-400 cursor-default' :
                          isUserAdmin ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                          'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                      >
                        {hasAccess || isUserAdmin ? 'Has Access' : 'Grant'}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500 py-8 text-center italic">
                Select a project first
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;
