import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8009',
  adapter: 'xhr'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const registerUser = (userData) => API.post('/auth/register', userData);

// Projects
export const fetchProjects = () => API.get('/projects/');
export const createProject = (projectData) => API.post('/projects/', projectData);
export const deleteProject = (projectId) => API.delete(`/projects/${projectId}`);

// Users & Access (Admin)
export const fetchUsers = () => API.get('/users/');
export const deleteUser = (userId) => API.delete(`/users/${userId}`);
export const fetchProjectUsers = (projectId) => API.get(`/projects/${projectId}/users`);
export const grantProjectAccess = (projectId, userId) => API.post(`/projects/${projectId}/access`, { user_id: userId, project_id: projectId });
export const revokeProjectAccess = (projectId, userId) => API.delete(`/projects/${projectId}/access/${userId}`);

// Tasks
export const fetchTasks = (projectId) => API.get('/tasks/', { params: { project_id: projectId } });
export const createTask = (taskData) => API.post('/tasks/', taskData);
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);
export const completeTask = (taskId) => API.patch(`/tasks/${taskId}/complete`);
export const updateTaskStatus = (taskId, status) => API.patch(`/tasks/${taskId}/status`, { status });
export const assignTask = (taskId, userIds) => {
  if (Array.isArray(userIds)) {
    return API.patch(`/tasks/${taskId}/assign`, { user_ids: userIds });
  }
  return API.patch(`/tasks/${taskId}/assign`, { user_id: userIds });
};
export const updateTaskSprint = (taskId, sprintId) => API.patch(`/tasks/${taskId}/sprint`, { sprint_id: sprintId });
export const fetchTaskActivity = (taskId) => API.get(`/tasks/${taskId}/activity`);

// Project Intelligence
export const fetchPrioritizedTasks = (projectId) => API.get('/project/priorities', { params: { project_id: projectId } });
export const fetchCriticalPath = (projectId, sprintId) => API.get('/project/critical-path', { params: { project_id: projectId, sprint_id: sprintId } });
export const createDependency = (taskId, dependsOnId) => 
  API.post(`/dependencies/`, { 
    task_id: taskId, 
    depends_on_id: dependsOnId 
  });

// Sprints
export const fetchSprints = (projectId) => API.get('/sprints/', { params: { project_id: projectId } });
export const createSprint = (sprintData) => API.post('/sprints/', sprintData);
export const getSprint = (sprintId) => API.get(`/sprints/${sprintId}`);
export const updateSprint = (sprintId, data) => API.patch(`/sprints/${sprintId}`, data);
export const deleteSprint = (sprintId) => API.delete(`/sprints/${sprintId}`);
export const autoAssignSprint = (sprintId) => API.post(`/sprints/${sprintId}/auto-assign`);
export const fetchSprintTasks = (sprintId) => API.get(`/sprints/${sprintId}/tasks`);
export const fetchBurndown = (sprintId) => API.get(`/sprints/${sprintId}/burndown`);

// Notifications
export const fetchNotifications = () => API.get('/notifications/');
export const markNotificationRead = (notifId) => API.patch(`/notifications/${notifId}/read`);
export const markAllNotificationsRead = () => API.patch('/notifications/read-all');

// Reports
export const exportSprintPDF = async (sprintId) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8009'}/reports/sprint/${sprintId}/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to export report');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sprint_${sprintId}_report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// SSE Notification stream
export const createNotificationStream = (onMessage) => {
  const token = localStorage.getItem('token');
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:8009'}/notifications/stream?token=${token}`;
  const eventSource = new EventSource(url);
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.error('SSE parse error:', e);
    }
  };
  
  eventSource.onerror = () => {
    // Reconnect after a delay
    eventSource.close();
    setTimeout(() => createNotificationStream(onMessage), 5000);
  };
  
  return eventSource;
};

export default API;