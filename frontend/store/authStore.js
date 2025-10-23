// frontend/store/authStore.js
import { create } from 'zustand';
import { authAPI } from '../utils/apiClient';

// Helper function to get user from localStorage
const getUserFromStorage = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  isAuthenticated: false,
  loading: false,

  // Initialize auth state from localStorage
  initAuth: () => {
    const user = getUserFromStorage();
    if (user) {
      set({ user, isAuthenticated: true });
    }
  },

  // Set user
  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },

  // Set loading
  setLoading: (loading) => {
    set({ loading });
  },

  // Signup
  signup: async (data) => {
    try {
      set({ loading: true });
      const response = await authAPI.signup(data);
      if (response.success) {
        set({ 
          user: response.data.user, 
          isAuthenticated: false // Not verified yet
        });
      }
      return response;
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Verify OTP
  verifyOTP: async (data) => {
    try {
      set({ loading: true });
      const response = await authAPI.verifyOTP(data);
      if (response.success) {
        set({ 
          user: response.data.user, 
          isAuthenticated: true 
        });
      }
      return response;
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Login
  login: async (data) => {
    try {
      set({ loading: true });
      const response = await authAPI.login(data);
      if (response.success) {
        set({ 
          user: response.data.user, 
          isAuthenticated: true 
        });
      }
      return response;
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Refresh user data
  refreshUser: async () => {
    try {
      const response = await authAPI.getMe();
      if (response.success) {
        set({ user: response.data.user });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  // Switch role
  switchRole: async (newRole) => {
    try {
      set({ loading: true });
      const response = await authAPI.switchRole(newRole);
      if (response.success) {
        // Update user role
        const updatedUser = { ...get().user, role: response.data.role };
        set({ user: updatedUser });
      }
      return response;
    } catch (error) {
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // Logout
  logout: () => {
    authAPI.logout();
    set({ user: null, isAuthenticated: false });
  },
}));

export default useAuthStore;