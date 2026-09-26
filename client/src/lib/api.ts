import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name?: string; avatar?: string }) =>
    api.put('/auth/profile', data),
};

// ─── Projects ────────────────────────────────────────────────────────────────
export const projectsAPI = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string; tags?: string[] }) =>
    api.post('/projects', data),
  importSQL: (data: { name: string; description?: string; sqlContent: string }) =>
    api.post('/projects/import-sql', data),
  update: (id: string, data: object) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  generateSchema: (id: string, prompt: string) =>
    api.post(`/projects/${id}/ai-schema`, { prompt }),
  preview: (id: string) => api.post(`/projects/${id}/preview`),
};

// ─── Generator ───────────────────────────────────────────────────────────────
export const generatorAPI = {
  start: (projectId: string) => api.post('/generator/start', { projectId }),
  listJobs: () => api.get('/generator/jobs'),
  getJob: (id: string) => api.get(`/generator/jobs/${id}`),
  cancelJob: (id: string) => api.delete(`/generator/jobs/${id}`),
};

// ─── Marketplace ──────────────────────────────────────────────────────────────
export const marketplaceAPI = {
  list: () => api.get('/marketplace'),
  get: (id: string) => api.get(`/marketplace/${id}`),
};

// ─── Assistant ────────────────────────────────────────────────────────────────
export const assistantAPI = {
  chat: (message: string, history: Array<{ role: string; content: string }>) =>
    api.post('/assistant/chat', { message, history }),
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminAPI = {
  stats: () => api.get('/admin/stats'),
  users: () => api.get('/admin/users'),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  jobs: () => api.get('/admin/jobs'),
  analytics: () => api.get('/admin/analytics'),
  addTemplate: (data: object) => api.post('/admin/templates', data),
  deleteTemplate: (id: string) => api.delete(`/admin/templates/${id}`),
};
