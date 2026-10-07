import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Module-level token getter — injected by AuthContext via setClerkTokenGetter()
// This is the correct pattern for using Clerk tokens in axios interceptors
// because React hooks (useAuth) cannot be called inside axios interceptors directly.
let _clerkGetToken = null;
export const setClerkTokenGetter = (getter) => {
  _clerkGetToken = getter;
};

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: attach Clerk JWT Bearer token on every request
apiClient.interceptors.request.use(
  async (config) => {
    if (_clerkGetToken) {
      try {
        const token = await _clerkGetToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('Could not retrieve Clerk token:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error unwrapping
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'An unexpected server error occurred';
    return Promise.reject(new Error(message));
  }
);

// Auth APIs
export const authApi = {
  getMe: () => apiClient.get('/auth/me'),
  setupRole: (data) => apiClient.post('/auth/setup-role', data),
};

// Dashboard APIs
export const dashboardApi = {
  getStats: () => apiClient.get('/dashboard/stats'),
};

// Members APIs
export const memberApi = {
  getAll: (params) => apiClient.get('/members', { params }),
  getMyProfile: () => apiClient.get('/members/me'),
  getById: (id) => apiClient.get(`/members/${id}`),
  create: (data) => apiClient.post('/members', data),
  update: (id, data) => apiClient.put(`/members/${id}`, data),
  delete: (id) => apiClient.delete(`/members/${id}`),
};

// Trainers APIs
export const trainerApi = {
  getAll: (params) => apiClient.get('/trainers', { params }),
  getMyProfile: () => apiClient.get('/trainers/me'),
  getMyMembers: () => apiClient.get('/trainers/my-members'),
  getById: (id) => apiClient.get(`/trainers/${id}`),
  create: (data) => apiClient.post('/trainers', data),
  update: (id, data) => apiClient.put(`/trainers/${id}`, data),
  delete: (id) => apiClient.delete(`/trainers/${id}`),
};


// Membership Plans APIs
export const membershipApi = {
  getAll: (params) => apiClient.get('/memberships', { params }),
  getById: (id) => apiClient.get(`/memberships/${id}`),
  create: (data) => apiClient.post('/memberships', data),
  update: (id, data) => apiClient.put(`/memberships/${id}`, data),
  delete: (id) => apiClient.delete(`/memberships/${id}`),
};

// Attendance APIs
export const attendanceApi = {
  getAll: (params) => apiClient.get('/attendance', { params }),
  getStats: () => apiClient.get('/attendance/stats'),
  checkIn: (data) => apiClient.post('/attendance/check-in', data),
  checkOut: (data) => apiClient.post('/attendance/check-out', data),
};

// Payments APIs
export const paymentApi = {
  getAll: (params) => apiClient.get('/payments', { params }),
  getStats: () => apiClient.get('/payments/stats'),
  getById: (id) => apiClient.get(`/payments/${id}`),
  create: (data) => apiClient.post('/payments', data),
  updateStatus: (id, data) => apiClient.put(`/payments/${id}/status`, data),
};

// Workouts APIs
export const workoutApi = {
  getAll: (params) => apiClient.get('/workouts', { params }),
  getById: (id) => apiClient.get(`/workouts/${id}`),
  create: (data) => apiClient.post('/workouts', data),
  update: (id, data) => apiClient.put(`/workouts/${id}`, data),
  delete: (id) => apiClient.delete(`/workouts/${id}`),
  logCompletion: (data) => apiClient.post('/workouts/completions', data),
  getCompletions: () => apiClient.get('/workouts/completions'),
};

// Equipment APIs
export const equipmentApi = {
  getAll: (params) => apiClient.get('/equipment', { params }),
  getById: (id) => apiClient.get(`/equipment/${id}`),
  create: (data) => apiClient.post('/equipment', data),
  update: (id, data) => apiClient.put(`/equipment/${id}`, data),
  delete: (id) => apiClient.delete(`/equipment/${id}`),
};

// AI Features APIs (Strictly structured JSON via backend Groq)
export const aiApi = {
  getDailyPlan: (data) => apiClient.post('/ai/daily-plan', data),
  askAssistant: (data) => apiClient.post('/ai/assistant', data),
  logNutrition: (data) => apiClient.post('/ai/nutrition', data),
  getNutrition: (params) => apiClient.get('/ai/nutrition', { params }),
};

export default apiClient;
