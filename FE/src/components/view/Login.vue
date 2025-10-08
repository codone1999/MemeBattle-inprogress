<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useritem } from '@/stores/playerStore';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const playerStore = useritem();

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const playHoverSound = () => {
  const audio = new Audio('/sounds/se/hover.mp3');
  audio.volume = 0.1;
  audio.play().catch(() => {});
};

const handleLogin = async () => {
  errorMessage.value = '';
  
  if (!username.value.trim() || !password.value) {
    errorMessage.value = 'Username and password are required';
    return;
  }

  isLoading.value = true;

  try {
    await authStore.login(username.value.trim(), password.value);
    
    console.log('✅ Login successful!');
    
    // Initialize player data
    await playerStore.initializeData();
    
    // Redirect to inventory page
    router.push({ name: 'Inventory' });
  } catch (error) {
    errorMessage.value = error;
    console.error('❌ Login failed:', error);
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push({ name: 'Register' });
};

const goToMainMenu = () => {
  router.push({ name: 'MainMenu' });
};
</script>

<template>
  <div class="bg-gray-900 min-h-screen w-full flex items-center justify-center p-8">
    <div class="w-full max-w-md">
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h1 class="text-4xl font-bold mb-8 text-center text-white">
          война (Voyna) Of Meme
        </h1>
        
        <h2 class="text-2xl font-semibold mb-4 text-center text-white">Login</h2>
        
        <!-- Error Message -->
        <div 
          v-if="errorMessage" 
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" 
          role="alert"
        >
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline ml-2">{{ errorMessage }}</span>
        </div>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label for="username" class="block text-gray-200 text-sm font-bold mb-2">
              Username:
            </label>
            <input 
              v-model="username" 
              type="text" 
              id="username" 
              placeholder="Enter username"
              :disabled="isLoading"
              class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600 disabled:opacity-50"
            >
          </div>

          <div>
            <label for="password" class="block text-gray-200 text-sm font-bold mb-2">
              Password:
            </label>
            <input 
              v-model="password" 
              type="password" 
              id="password" 
              placeholder="Enter password"
              :disabled="isLoading"
              @keyup.enter="handleLogin"
              class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600 disabled:opacity-50"
            >
          </div>

          <button 
            type="submit" 
            :disabled="isLoading"
            @mouseenter="playHoverSound"
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <!-- Test Credentials Info -->
        <div class="mt-4 p-3 bg-blue-900 border border-blue-700 rounded">
          <p class="text-blue-300 text-sm font-semibold mb-1">Test Account:</p>
          <p class="text-blue-200 text-xs">Username: test1</p>
          <p class="text-blue-200 text-xs">Password: test1</p>
        </div>

        <!-- Additional Links -->
        <div class="mt-4 text-center">
          <button 
            @click="goToRegister"
            @mouseenter="playHoverSound"
            type="button" 
            class="text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
          >
            Need an account? Create one
          </button>
        </div>

        <button 
          @click="goToMainMenu"
          @mouseenter="playHoverSound"
          class="mt-2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none block w-full text-center"
        >
          Back To Menu
        </button>
      </div>
    </div>
  </div>
</template>