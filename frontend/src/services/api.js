import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
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

export const loginUser = (credentials) => API.post('/auth/login', credentials);
export const registerUser = (userData) => API.post('/auth/register', userData);

export const fetchTasks = () => API.get('/tasks/');
export const createTask = (taskData) => API.post('/tasks/', taskData);
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);
export const completeTask = (taskId) => API.patch(`/tasks/${taskId}/complete`);

export const fetchPrioritizedTasks = () => API.get('/project/priorities');
export const fetchCriticalPath = () => API.get('/project/critical-path');

export const createDependency = (taskId, dependsOnId) => 
  API.post(`/dependencies/`, { 
    task_id: taskId, 
    depends_on_id: dependsOnId 
  });

export default API;