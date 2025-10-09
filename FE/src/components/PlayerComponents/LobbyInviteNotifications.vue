<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const router = useRouter();
const invites = ref([]);

const fetchInvites = async () => {
  try {
    const response = await axios.get(`${API_URL}/lobby/invites`);
    if (response.data.success) {
      invites.value = response.data.data.invites;
    }
  } catch (error) {
    console.error('Failed to fetch invites:', error);
  }
};

const acceptInvite = async (invite) => {
  try {
    // First accept the invite
    const response = await axios.post(`${API_URL}/lobby/invites/${invite.id}/accept`);
    
    if (response.data.success) {
      const lobbyId = response.data.data.lobbyId;
      
      // Check if we're in a lobby already
      const checkResponse = await axios.get(`${API_URL}/lobby/user/active`);
      
      if (checkResponse.data.success && checkResponse.data.data.lobby) {
        const activeLobby = checkResponse.data.data.lobby;
        
        // If we're in a different lobby, ask to leave
        if (activeLobby.lobby_id !== lobbyId) {
          const shouldLeave = confirm(
            `You're currently in "${activeLobby.lobby_name}". Leave it to join this invite?`
          );
          
          if (!shouldLeave) {
            return;
          }
          
          // Leave current lobby
          await axios.post(`${API_URL}/lobby/leave/${activeLobby.lobby_id}`);
        }
      }
      
      // Join the invited lobby
      await axios.post(`${API_URL}/lobby/join`, { lobbyId });
      
      // Remove invite from list
      invites.value = invites.value.filter(inv => inv.id !== invite.id);
      
      // Navigate to lobby
      router.push({ name: 'LobbyPage', params: { lobbyId } });
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to accept invite');
  }
};

const declineInvite = async (inviteId) => {
  try {
    await axios.post(`${API_URL}/lobby/invites/${inviteId}/decline`);
    invites.value = invites.value.filter(inv => inv.id !== inviteId);
  } catch (error) {
    console.error('Failed to decline invite:', error);
  }
};

let pollInterval;

onMounted(() => {
  fetchInvites();
  // Poll every 5 seconds
  pollInterval = setInterval(fetchInvites, 5000);
});

onBeforeUnmount(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
    <TransitionGroup name="slide">
      <div
        v-for="invite in invites"
        :key="invite.id"
        class="bg-gray-900 border-2 border-blue-500 rounded-lg p-4 shadow-2xl"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white flex-shrink-0">
            🎮
          </div>
          <div class="flex-1">
            <p class="text-white font-semibold text-sm mb-1">Lobby Invite</p>
            <p class="text-gray-300 text-xs mb-2">
              <span class="text-blue-400 font-semibold">{{ invite.from_username }}</span>
              invited you to
              <span class="text-blue-400 font-semibold">{{ invite.lobby_name }}</span>
            </p>
            <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
              <span class="px-2 py-0.5 rounded bg-gray-800">{{ invite.game_mode }}</span>
            </div>
            <div class="flex gap-2">
              <button
                @click="acceptInvite(invite)"
                class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs transition"
              >
                Accept
              </button>
              <button
                @click="declineInvite(invite.id)"
                class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded text-xs transition"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>