// frontend/utils/apiClient.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            if (window.location.pathname !== '/login') {
              toast.error('Session expired. Please login again.');
              window.location.href = '/login';
            }
          }
          break;
          
        case 403:
          toast.error(data.message || 'Access denied');
          break;
          
        case 404:
          toast.error(data.message || 'Resource not found');
          break;
          
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
          
        case 500:
          toast.error('Server error. Please try again later.');
          break;
          
        default:
          toast.error(data.message || 'Something went wrong');
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS
// ============================================

export const authAPI = {
  // Signup
  signup: async (data) => {
    const response = await apiClient.post('/auth/signup', data);
    return response.data;
  },

  // Verify OTP
  verifyOTP: async (data) => {
    const response = await apiClient.post('/auth/verify-otp', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Resend OTP
  resendOTP: async (phone) => {
    const response = await apiClient.post('/auth/resend-otp', { phone });
    return response.data;
  },

  // Login
  login: async (data) => {
    const response = await apiClient.post('/auth/login', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    if (response.data.success) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  // Switch role
  switchRole: async (newRole) => {
    const response = await apiClient.post('/auth/switch-role', { new_role: newRole });
    if (response.data.success) {
      // Update user in localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      user.role = response.data.data.role;
      localStorage.setItem('user', JSON.stringify(user));
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// ============================================
// JOBS API CALLS
// ============================================

export const jobsAPI = {
  // Create job
  createJob: async (formData) => {
    const response = await apiClient.post('/jobs', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get all jobs
  getJobs: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/jobs?${params}`);
    return response.data;
  },

  // Get single job
  getJob: async (id) => {
    const response = await apiClient.get(`/jobs/${id}`);
    return response.data;
  },

  // Get my posted jobs
  getMyJobs: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    const response = await apiClient.get(`/jobs/my/posted?${params}`);
    return response.data;
  },

  // Update job
  updateJob: async (id, data) => {
    const response = await apiClient.put(`/jobs/${id}`, data);
    return response.data;
  },

  // Delete/Cancel job
  deleteJob: async (id) => {
    const response = await apiClient.delete(`/jobs/${id}`);
    return response.data;
  },
};

// ============================================
// CATEGORIES API CALLS
// ============================================

export const categoriesAPI = {
  // Get all categories
  getCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  // Get category by slug
  getCategory: async (slug) => {
    const response = await apiClient.get(`/categories/${slug}`);
    return response.data;
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get stored token
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Get stored user
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

export default apiClient;
// ============================================
// BIDS API CALLS
// ============================================

export const bidsAPI = {
  // Place a bid
  placeBid: async (data) => {
    const response = await apiClient.post('/bids', data);
    return response.data;
  },

  // Get all bids for a job (customer)
  getJobBids: async (jobId) => {
    const response = await apiClient.get(`/bids/job/${jobId}`);
    return response.data;
  },

  // Get my bids (worker)
  getMyBids: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get(`/bids/my${params}`);
    return response.data;
  },

  // Get single bid details
  getBid: async (bidId) => {
    const response = await apiClient.get(`/bids/${bidId}`);
    return response.data;
  },

  // Accept a bid (customer)
  acceptBid: async (bidId) => {
    const response = await apiClient.put(`/bids/${bidId}/accept`);
    return response.data;
  },

  // Reject a bid (customer)
  rejectBid: async (bidId) => {
    const response = await apiClient.put(`/bids/${bidId}/reject`);
    return response.data;
  },

  // Withdraw a bid (worker)
  withdrawBid: async (bidId) => {
    const response = await apiClient.delete(`/bids/${bidId}`);
    return response.data;
  },
};