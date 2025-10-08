<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useritem } from '@/stores/playerStore';
import { storeToRefs } from 'pinia';
import PlayerUser from '@/components/PlayerComponents/PlayerUser.vue';
import PlayerInventory from '@/components/PlayerComponents/PlayerInventory.vue';

const router = useRouter();
const authStore = useAuthStore();
const playerStore = useritem();

const { currentUser, loading } = storeToRefs(playerStore);

onMounted(async () => {
  // Initialize player data if not already loaded
  try {
    await playerStore.initializeData();
  } catch (error) {
    console.error('Failed to load inventory:', error);
  }
});

const handleLogout = async () => {
  await authStore.logout();
  playerStore.resetState();
  router.push({ name: 'MainMenu' });
};
</script>

<template>
  <div class="w-full min-h-screen bg-gray-900">
    <!-- Header with user info and logout -->
    <div class="flex justify-between items-center bg-gray-800 text-white p-4 shadow-lg">
      <PlayerUser v-if="currentUser" :user="currentUser" />
      <button 
        @click="handleLogout"
        class="bg-red-600 px-6 py-2 rounded hover:bg-red-700 transition font-bold"
      >
        Logout
      </button>
    </div>

    <!-- Inventory Component (no props needed - it uses the store directly) -->
    <PlayerInventory />
  </div>
</template>