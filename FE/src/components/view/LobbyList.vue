<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const handleLogout = async () => {
  await authStore.logout();
  router.push({ name: 'MainMenu' });
};
</script>

<template>
  <div class="bg-gray-900 min-h-screen w-full p-8">
    <div class="container mx-auto max-w-4xl">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-white">Lobby List</h1>
        <div class="flex items-center gap-4">
          <span class="text-gray-300">Welcome, {{ authStore.user?.username }}!</span>
          <button 
            @click="handleLogout"
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
      
      <div class="bg-gray-800 p-6 rounded-lg">
        <p class="text-gray-300 text-center">Lobby system coming soon...</p>
        <p class="text-gray-500 text-center mt-2 text-sm">
          (This is a placeholder page to test authentication)
        </p>
      </div>
    </div>
  </div>
</template>