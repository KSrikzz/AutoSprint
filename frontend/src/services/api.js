import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  adapter: 'xhr'
});

API.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export const fetchTasks = () => API.get('/tasks/');
export const createTask = (taskData) => API.post('/tasks/', taskData);
export const deleteTask = (taskId) => API.delete(`/tasks/${taskId}`);
export const completeTask = (taskId) => API.patch(`/tasks/${taskId}/complete`);
export const fetchPrioritizedTasks = () => API.get('/project/priorities');
export const fetchCriticalPath = () => API.get('/project/critical-path');
export const createDependency = (taskId, prereqId) => 
  API.post(`/tasks/${taskId}/dependencies/${prereqId}`);

export default API;