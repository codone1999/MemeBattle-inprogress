import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from '@/utils/axios'; // Use our configured axios

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null);
  const token = ref(localStorage.getItem('token') || null);
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  async function register(username, password, email = '') {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('🔄 Attempting registration...');
      console.log('API URL:', `${API_URL}/auth/register`);
      
      const response = await axios.post(`${API_URL}/auth/register`, {
        username,
        password,
        email: email || undefined
      });

      console.log('✅ Registration response:', response.data);

      if (response.data.success) {
        token.value = response.data.data.token;
        user.value = response.data.data.user;
        
        localStorage.setItem('token', token.value);
      }
      
      return response.data;
    } catch (err) {
      console.error('❌ Registration error:', err);
      console.error('Error response:', err.response?.data);
      
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
      console.log('API URL:', `${API_URL}/auth/login`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password
      });

      console.log('✅ Login response:', response.data);

      if (response.data.success) {
        token.value = response.data.data.token;
        user.value = response.data.data.user;
        
        localStorage.setItem('token', token.value);
      }
      
      return response.data;
    } catch (err) {
      console.error('❌ Login error:', err);
      console.error('Error response:', err.response?.data);
      
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
      if (token.value) {
        await axios.post(`${API_URL}/auth/logout`);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      user.value = null;
      token.value = null;
      localStorage.removeItem('token');
    }
  }

  async function verifyToken() {
    if (!token.value) return false;

    try {
      const response = await axios.get(`${API_URL}/auth/verify`);
      
      if (response.data.success) {
        user.value = response.data.data.user;
        return true;
      }
      return false;
    } catch (err) {
      console.error('Token verification failed:', err);
      logout();
      return false;
    }
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    verifyToken
  };
});