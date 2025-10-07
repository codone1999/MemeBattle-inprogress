<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const confirmPassword = ref('');
const email = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const playHoverSound = () => {
  const audio = new Audio('/sounds/se/hover.mp3');
  audio.volume = 0.1;
  audio.play().catch(() => {});
};

const handleRegister = async () => {
  errorMessage.value = '';
  
  const trimmedUsername = username.value.trim();
  const trimmedPassword = password.value.trim();
  
  // Validation
  if (!trimmedUsername || !trimmedPassword) {
    errorMessage.value = 'Username and password are required';
    return;
  }

  if (trimmedUsername.length < 3) {
    errorMessage.value = 'Username must be at least 3 characters';
    return;
  }

  if (trimmedPassword.length < 4) {
    errorMessage.value = 'Password must be at least 4 characters';
    return;
  }

  if (trimmedPassword !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }

  isLoading.value = true;

  try {
    await authStore.register(trimmedUsername, trimmedPassword, email.value.trim());
    
    console.log('✅ Registration successful!');
    
    // Redirect to main menu or lobby
    router.push({ name: 'MainMenu' });
  } catch (error) {
    errorMessage.value = error;
    console.error('❌ Registration failed:', error);
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push({ name: 'Login' });
};

const goToMainMenu = () => {
  router.push({ name: 'MainMenu' });
};
</script>

<template>
  <div class="bg-gray-900 min-h-screen w-full flex items-center justify-center p-8">
    <div class="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
      <h2 class="text-2xl font-semibold text-white text-center mb-6">Create Account</h2>
      
      <!-- Error Message -->
      <div 
        v-if="errorMessage"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
        role="alert"
      >
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline ml-2">{{ errorMessage }}</span>
      </div>

      <!-- Register Form -->
      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="username" class="block text-gray-300 text-sm font-bold mb-2">
            Username: *
          </label>
          <input
            v-model="username"
            type="text"
            id="username"
            placeholder="Enter username (3-20 characters)"
            :disabled="isLoading"
            class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600 disabled:opacity-50"
          >
        </div>

        <div>
          <label for="email" class="block text-gray-300 text-sm font-bold mb-2">
            Email: (Optional)
          </label>
          <input
            v-model="email"
            type="email"
            id="email"
            placeholder="Enter email (optional)"
            :disabled="isLoading"
            class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600 disabled:opacity-50"
          >
        </div>

        <div>
          <label for="password" class="block text-gray-300 text-sm font-bold mb-2">
            Password: *
          </label>
          <input
            v-model="password"
            type="password"
            id="password"
            placeholder="Enter password (min 4 characters)"
            :disabled="isLoading"
            class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600 disabled:opacity-50"
          >
        </div>

        <div>
          <label for="confirmPassword" class="block text-gray-300 text-sm font-bold mb-2">
            Confirm Password: *
          </label>
          <input
            v-model="confirmPassword"
            type="password"
            id="confirmPassword"
            placeholder="Confirm password"
            :disabled="isLoading"
            @keyup.enter="handleRegister"
            class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600 disabled:opacity-50"
          >
        </div>

        <button 
          type="submit"
          :disabled="isLoading"
          @mouseenter="playHoverSound"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isLoading ? 'Creating Account...' : 'Create Account' }}
        </button>

        <div class="mt-4 text-center">
          <button 
            @click="goToLogin"
            @mouseenter="playHoverSound"
            type="button"
            class="text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
          >
            Already have an account? Login
          </button>
        </div>

        <button 
          @click="goToMainMenu"
          @mouseenter="playHoverSound"
          type="button"
          class="mt-2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none block w-full text-center"
        >
          Back To Menu
        </button>
      </form>
    </div>
  </div>
</template>