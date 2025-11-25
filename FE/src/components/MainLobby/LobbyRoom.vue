<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';

const router = useRouter();
const route = useRoute();
const lobbyId = route.params.lobbyId;

const isLeaving = ref(false);

const handleLeaveLobby = async () => {
    if (!confirm("Are you sure you want to retreat from this lobby?")) return;

    isLeaving.value = true;
    try {
        await fetchApi(`/lobbies/${lobbyId}/leave`, { method: 'POST' });
    } catch (err) {
        console.error("Error leaving lobby:", err);
    } finally {
        router.push('/lobby');
    }
};
</script>

<template>
  <div class="min-h-screen bg-stone-900 text-yellow-100 flex flex-col items-center justify-center font-sans-custom p-8">
    <div class="text-center space-y-4">
      <div class="animate-pulse text-6xl mb-4">🏰</div>
      <h1 class="text-4xl font-bold text-yellow-500 font-['Creepster'] tracking-widest">ENTERING LOBBY</h1>
      <p class="text-stone-400 text-lg">Room ID: <span class="font-mono text-white">{{ lobbyId }}</span></p>
      
      <div class="mt-8 p-6 bg-stone-800 rounded-lg border border-stone-700 max-w-md mx-auto">
        <p class="text-stone-300">Connecting to secure channel...</p>
        <div class="w-full bg-stone-700 rounded-full h-2 mt-4 overflow-hidden">
            <div class="bg-green-500 h-2 rounded-full animate-width w-1/2"></div>
        </div>
      </div>

      <button 
        @click="handleLeaveLobby" 
        :disabled="isLeaving"
        class="mt-8 px-8 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
      >
        {{ isLeaving ? 'RETREATING...' : 'LEAVE LOBBY' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes width {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
}
.animate-width {
    animation: width 2s ease-in-out infinite;
}
</style>