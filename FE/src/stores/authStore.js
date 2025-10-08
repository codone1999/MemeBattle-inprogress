import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const accessToken = ref(localStorage.getItem('accessToken') || null);
  const refreshToken = ref(localStorage.getItem('refreshToken') || null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);

  // Configure axios with access token
  const setAuthHeader = () => {
    if (accessToken.value) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken.value}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Refresh access token when expired
  async function refreshAccessToken() {
    if (!refreshToken.value) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: refreshToken.value
      });

      if (response.data.success) {
        accessToken.value = response.data.data.accessToken;
        localStorage.setItem('accessToken', accessToken.value);
        setAuthHeader();
        return true;
      }
      return false;
    } catch (error) {
      // Refresh token invalid or expired - logout
      await logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  async function register(username, password, email = '') {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('🔄 Attempting registration...');
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        password,
        email: email || undefined
      });

      console.log('✅ Registration response:', response.data);

      if (response.data.success) {
        accessToken.value = response.data.data.accessToken;
        refreshToken.value = response.data.data.refreshToken;
        user.value = response.data.data.user;
        
        localStorage.setItem('accessToken', accessToken.value);
        localStorage.setItem('refreshToken', refreshToken.value);
        setAuthHeader();
      }
      
      return response.data;
    } catch (err) {
      console.error('❌ Registration error:', err);
      
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.errors?.[0]?.message ||
                      err.message ||
                      'Registration failed';
      error.value = errorMsg;
      throw errorMsg;
    } finally {
      loading.value = false;
    }
  }

  async function login(username, password) {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('🔄 Attempting login...');
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        accessToken.value = response.data.data.accessToken;
        refreshToken.value = response.data.data.refreshToken;
        user.value = response.data.data.user;
        
        localStorage.setItem('accessToken', accessToken.value);
        localStorage.setItem('refreshToken', refreshToken.value);
        setAuthHeader();
      }
      
      return response.data;
    } catch (err) {
      console.error('❌ Login error:', err);
      
      const errorMsg = err.response?.data?.message || 
                      err.response?.data?.errors?.[0]?.message ||
                      err.message ||
                      'Login failed';
      error.value = errorMsg;
      throw errorMsg;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      if (accessToken.value) {
        await axios.post(`${API_URL}/auth/logout`);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
      accessToken.value = null;
      refreshToken.value = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setAuthHeader();
    }
  }

  async function verifyToken() {
    if (!accessToken.value) return false;

    try {
      setAuthHeader();
      const response = await axios.get(`${API_URL}/auth/verify`);
      
      if (response.data.success) {
        user.value = response.data.data.user;
        return true;
      }
      return false;
    } catch (err) {
      // Try to refresh token if access token expired
      if (err.response?.data?.code === 'TOKEN_EXPIRED' && refreshToken.value) {
        try {
          await refreshAccessToken();
          return await verifyToken(); // Retry verification with new token
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          await logout();
          return false;
        }
      }
      
      console.error('Token verification failed:', err);
      await logout();
      return false;
    }
  }

  // Initialize auth header on store creation
  setAuthHeader();

  // Setup axios interceptor for automatic token refresh
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 and we haven't tried to refresh yet
      if (error.response?.status === 401 && 
          error.response?.data?.code === 'TOKEN_EXPIRED' && 
          !originalRequest._retry) {
        
        originalRequest._retry = true;

        try {
          await refreshAccessToken();
          // Retry original request with new token
          originalRequest.headers['Authorization'] = `Bearer ${accessToken.value}`;
          return axios(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(error);
    }
  );

  return {
    user,
    accessToken,
    refreshToken,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    verifyToken,
    refreshAccessToken
  };
});