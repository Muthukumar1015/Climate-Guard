import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints organized by module
export const heatwaveAPI = {
  getCurrent: (city) => api.get(`/heatwave/current/${city}`),
  getForecast: (city, days = 7) => api.get(`/heatwave/forecast/${city}`, { params: { days } }),
  getCoolingCenters: (city) => api.get(`/heatwave/cooling-centers/${city}`),
  getGuidelines: () => api.get('/heatwave/guidelines'),
  getAlertLevels: () => api.get('/heatwave/alert-levels')
};

export const floodAPI = {
  getCurrent: (city) => api.get(`/flood/current/${city}`),
  getRiskMap: (city) => api.get(`/flood/risk-map/${city}`),
  getForecast: (city, days = 7) => api.get(`/flood/forecast/${city}`, { params: { days } }),
  getSafeRoutes: (city, from, to) => api.get(`/flood/safe-routes/${city}`, { params: { from, to } }),
  reportWaterlogging: (data) => api.post('/flood/report-waterlogging', data),
  getEmergencyContacts: (city) => api.get(`/flood/emergency-contacts/${city}`),
  getGuidelines: () => api.get('/flood/guidelines')
};

export const airQualityAPI = {
  getCurrent: (city) => api.get(`/air-quality/current/${city}`),
  getPollutants: (city) => api.get(`/air-quality/pollutants/${city}`),
  getForecast: (city, days = 7) => api.get(`/air-quality/forecast/${city}`, { params: { days } }),
  getHealthRecommendations: (city) => api.get(`/air-quality/health-recommendations/${city}`),
  getCategories: () => api.get('/air-quality/categories'),
  getBioRemediation: (city) => api.get(`/air-quality/bio-remediation/${city}`),
  getPollutionSources: (city) => api.get(`/air-quality/pollution-sources/${city}`)
};

export const waterQualityAPI = {
  getCurrent: (city) => api.get(`/water-quality/current/${city}`),
  getTapWater: (city) => api.get(`/water-quality/tap-water/${city}`),
  getParameters: (city, waterBody) => api.get(`/water-quality/parameters/${city}/${waterBody}`),
  getStandards: () => api.get('/water-quality/standards'),
  getTreatmentFacilities: (city) => api.get(`/water-quality/treatment-facilities/${city}`),
  getBioRemediation: () => api.get('/water-quality/bio-remediation'),
  report: (data) => api.post('/water-quality/report', data),
  getReports: (city) => api.get(`/water-quality/reports/${city}`)
};

export const alertsAPI = {
  getActive: (city, type) => api.get(`/alerts/active/${city}`, { params: { type } }),
  getHistory: (city, params) => api.get(`/alerts/history/${city}`, { params }),
  getSummary: (city) => api.get(`/alerts/summary/${city}`),
  getById: (id) => api.get(`/alerts/${id}`)
};

export const reportsAPI = {
  create: (data) => api.post('/reports', data),
  getByCity: (city, params) => api.get(`/reports/city/${city}`, { params }),
  getNearby: (params) => api.get('/reports/nearby', { params }),
  getById: (id) => api.get(`/reports/${id}`),
  getMyReports: (params) => api.get('/reports/user/my-reports', { params }),
  upvote: (id) => api.post(`/reports/${id}/upvote`),
  addComment: (id, text) => api.post(`/reports/${id}/comments`, { text })
};

export const dashboardAPI = {
  getSummary: (city) => api.get(`/dashboard/${city}`)
};

export default api;
