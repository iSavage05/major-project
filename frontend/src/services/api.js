import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data) => api.post('/projects', data),
  getById: (id) => api.get(`/projects/${id}`),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  getMilestones: (id) => api.get(`/projects/${id}/milestones`),
  createMilestone: (id, data) => api.post(`/projects/${id}/milestones`, data),
};

export const designAPI = {
  generate: (formData) => {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    return api.post('/design/generate', formData, config);
  },
  getImage: (designId) => api.get(`/design/image/${designId}`),
  generateExecutionPlan: (designId) => api.post(`/design/${designId}/execution-plan`),
  getProjectDesigns: (projectId) => api.get(`/design/project/${projectId}`),
};

export const suppliersAPI = {
  getMaterials: () => api.get('/suppliers/materials'),
  createBid: (data) => api.post('/suppliers/bid', data),
  getMaterialBids: (materialId) => api.get(`/suppliers/bids/${materialId}`),
  acceptBid: (bidId) => api.post(`/suppliers/bid/${bidId}/accept`),
  addToCatalog: (data) => api.post('/suppliers/catalog', data),
  getCatalog: () => api.get('/suppliers/catalog'),
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getProjectDetails: (projectId) => api.get(`/dashboard/project/${projectId}/details`),
  getProjectProgress: (projectId) => api.get(`/dashboard/project/${projectId}/progress`),
};

export default api;
