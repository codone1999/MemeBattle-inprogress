<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const props = defineProps({
  lobbyId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['close']);

const friends = ref([]);
const friendLobbyStatus = ref({});
const loading = ref(false);
const sending = ref(false);

// Computed: Only show friends who are online and NOT in a lobby
const availableFriends = computed(() => {
  return friends.value.filter(friend => {
    return friend.is_online && !friendLobbyStatus.value[friend.uid];
  });
});

const fetchFriends = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_URL}/user/friends`);
    if (response.data.success) {
      friends.value = response.data.data.friends;
      
      // Check which friends are in lobbies
      await checkFriendLobbyStatus();
    }
  } catch (error) {
    console.error('Failed to fetch friends:', error);
  } finally {
    loading.value = false;
  }
};

const checkFriendLobbyStatus = async () => {
  try {
    // Check each friend's active lobby status
    const checks = friends.value.map(async (friend) => {
      try {
        const response = await axios.get(`${API_URL}/lobby/user/${friend.uid}/active`);
        if (response.data.success && response.data.data.lobby) {
          friendLobbyStatus.value[friend.uid] = response.data.data.lobby;
        }
      } catch (error) {
        // Friend not in lobby or error - that's ok
      }
    });
    
    await Promise.all(checks);
  } catch (error) {
    console.error('Failed to check friend lobby status:', error);
  }
};

const sendInvite = async (friendUid) => {
  sending.value = true;
  try {
    await axios.post(`${API_URL}/lobby/invite`, {
      lobbyId: props.lobbyId,
      toUserId: friendUid
    });
    
    alert('Invite sent successfully!');
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to send invite');
  } finally {
    sending.value = false;
  }
};

onMounted(() => {
  fetchFriends();
});
</script>

<template>
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-2xl font-bold text-white">Invite Friends</h3>
        <button
          @click="emit('close')"
          class="text-gray-400 hover:text-white transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p class="text-gray-400 text-sm">Loading friends...</p>
      </div>

      <div v-else-if="availableFriends.length === 0" class="text-center py-8">
        <p class="text-gray-400">No available friends to invite</p>
        <p class="text-gray-500 text-sm mt-2">
          {{ friends.length === 0 ? 'Add friends first to invite them' : 'Your friends are offline or in other lobbies' }}
        </p>
      </div>

      <div v-else class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="friend in availableFriends"
          :key="friend.uid"
          class="flex items-center justify-between bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition"
        >
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-green-400">
              <img
                v-if="friend.selected_character"
                :src="`/characters/${friend.selected_character}.png`"
                :alt="friend.username"
                class="w-full h-full object-cover"
              />
            </div>
            <div>
              <p class="text-white font-semibold text-sm">{{ friend.username }}</p>
              <p class="text-green-400 text-xs">● Online & Available</p>
            </div>
          </div>
          
          <button
            @click="sendInvite(friend.uid)"
            :disabled="sending"
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-1 px-4 rounded text-sm transition"
          >
            {{ sending ? 'Sending...' : 'Invite' }}
          </button>
        </div>
      </div>

      <!-- Friends in lobbies (informational) -->
      <div v-if="friends.filter(f => friendLobbyStatus[f.uid]).length > 0" class="mt-4 pt-4 border-t border-gray-800">
        <p class="text-gray-400 text-xs mb-2">Friends in other lobbies:</p>
        <div class="space-y-1">
          <div
            v-for="friend in friends.filter(f => friendLobbyStatus[f.uid])"
            :key="'busy-' + friend.uid"
            class="flex items-center gap-2 text-xs text-gray-500"
          >
            <span>{{ friend.username }}</span>
            <span class="text-gray-600">→</span>
            <span class="text-yellow-600">{{ friendLobbyStatus[friend.uid]?.lobby_name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>