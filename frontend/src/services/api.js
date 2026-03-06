import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  adapter: 'xhr'
});

API.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const fetchPrioritizedTasks = () => API.get('/project/priorities');
export const fetchCriticalPath = () => API.get('/project/critical-path');
export const createTask = (taskData) => API.post('/tasks/', taskData);
export const addDependency = (taskId, prereqId) => 
  API.post(`/tasks/${taskId}/dependencies/${prereqId}`);

export default API;