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
  getExecutionPlan: (planId) => api.get(`/design/execution-plan/${planId}`),
  logExecutionProgress: (planId, data) => api.post(`/design/execution-plan/${planId}/progress`, data),
  getExecutionProgress: (planId) => api.get(`/design/execution-plan/${planId}/progress`),
};

export const suppliersAPI = {
  getMaterials: () => api.get('/suppliers/materials'),
  getAvailableDesigns: () => api.get('/suppliers/designs'),
  getDesignCategories: (designId) => api.get(`/suppliers/design/${designId}/categories`),
  createBid: (data) => api.post('/suppliers/bid', data),
  getMyBids: () => api.get('/suppliers/my-bids'),
  getMaterialBids: (materialId) => api.get(`/suppliers/bids/${materialId}`),
  acceptBid: (bidId) => api.post(`/suppliers/bid/${bidId}/accept`),
  rejectBid: (bidId) => api.post(`/suppliers/bid/${bidId}/reject`),
  addToCatalog: (data) => api.post('/suppliers/catalog', data),
  getCatalog: () => api.get('/suppliers/catalog'),
};

export const dashboardAPI = {
  getOverview: () => api.get('/dashboard/overview'),
  getProjectDetails: (projectId) => api.get(`/dashboard/project/${projectId}/details`),
  getProjectProgress: (projectId) => api.get(`/dashboard/project/${projectId}/progress`),
};

export default api;
