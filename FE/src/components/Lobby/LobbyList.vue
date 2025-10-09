<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';
import LobbyInviteNotifications from '@/components/PlayerComponents/LobbyInviteNotifications.vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const router = useRouter();
const authStore = useAuthStore();

const lobbies = ref([]);
const loading = ref(false);
const showCreateModal = ref(false);
const showPasswordModal = ref(false);
const joinLobbyData = ref(null);
const lobbyPassword = ref('');

const newLobby = ref({
  lobbyName: '',
  gameMode: 'normal',
  isPrivate: false,
  password: ''
});

const gameModes = [
  { value: 'normal', label: '⚔️ Normal', color: 'blue' },
  { value: 'ranked', label: '🏆 Ranked', color: 'yellow' },
  { value: 'custom', label: '🎲 Custom', color: 'purple' }
];

const fetchLobbies = async () => {
  loading.value = true;
  try {
    const response = await axios.get(`${API_URL}/lobby/list`);
    if (response.data.success) {
      lobbies.value = response.data.data.lobbies;
    }
  } catch (error) {
    console.error('Failed to fetch lobbies:', error);
  } finally {
    loading.value = false;
  }
};

const openCreateModal = () => {
  newLobby.value = {
    lobbyName: `${authStore.user.username}'s Lobby`,
    gameMode: 'normal',
    isPrivate: false,
    password: ''
  };
  showCreateModal.value = true;
};

const createLobby = async () => {
  if (!newLobby.value.lobbyName.trim()) {
    alert('Please enter a lobby name');
    return;
  }

  if (newLobby.value.isPrivate && !newLobby.value.password.trim()) {
    alert('Please enter a password for private lobby');
    return;
  }

  loading.value = true;
  try {
    // Check if user is already in a lobby
    const checkResponse = await axios.get(`${API_URL}/lobby/user/active`);
    
    if (checkResponse.data.success && checkResponse.data.data.lobby) {
      const activeLobby = checkResponse.data.data.lobby;
      
      // Ask user if they want to leave current lobby
      const shouldLeave = confirm(
        `You're already in "${activeLobby.lobby_name}". Do you want to leave it and create a new lobby?`
      );
      
      if (!shouldLeave) {
        showCreateModal.value = false;
        loading.value = false;
        // Go to their current lobby instead
        router.push({ 
          name: 'LobbyPage', 
          params: { lobbyId: activeLobby.lobby_id } 
        });
        return;
      }
      
      // Leave current lobby first
      await axios.post(`${API_URL}/lobby/leave/${activeLobby.lobby_id}`);
      console.log('✅ Left previous lobby');
    }

    // Create new lobby
    const response = await axios.post(`${API_URL}/lobby/create`, {
      lobbyName: newLobby.value.lobbyName,
      gameMode: newLobby.value.gameMode,
      isPrivate: newLobby.value.isPrivate,
      password: newLobby.value.password
    });

    if (response.data.success) {
      const lobbyId = response.data.data.lobby.lobby_id;
      showCreateModal.value = false;
      
      console.log('✅ Lobby created, entering automatically:', lobbyId);
      
      // Automatically enter the lobby
      router.push({ name: 'LobbyPage', params: { lobbyId } });
    }
  } catch (error) {
    console.error('Failed to create lobby:', error);
    alert(error.response?.data?.message || 'Failed to create lobby');
  } finally {
    loading.value = false;
  }
};

const joinLobby = async (lobby) => {
  if (lobby.is_full) {
    alert('Lobby is full');
    return;
  }

  try {
    // Check if user is already in a lobby
    const checkResponse = await axios.get(`${API_URL}/lobby/user/active`);
    
    if (checkResponse.data.success && checkResponse.data.data.lobby) {
      const activeLobby = checkResponse.data.data.lobby;
      
      // If already in this lobby, just go to it
      if (activeLobby.lobby_id === lobby.lobby_id) {
        console.log('✅ Already in this lobby, redirecting...');
        router.push({ 
          name: 'LobbyPage', 
          params: { lobbyId: lobby.lobby_id } 
        });
        return;
      }
      
      // Ask if they want to leave current lobby
      const shouldLeave = confirm(
        `You're already in "${activeLobby.lobby_name}". Do you want to leave it and join "${lobby.lobby_name}"?`
      );
      
      if (!shouldLeave) {
        return;
      }
      
      // Leave current lobby
      await axios.post(`${API_URL}/lobby/leave/${activeLobby.lobby_id}`);
      console.log('✅ Left previous lobby');
    }

    // Now join the lobby
    if (lobby.is_private) {
      joinLobbyData.value = lobby;
      showPasswordModal.value = true;
    } else {
      confirmJoin(lobby.lobby_id);
    }
  } catch (error) {
    console.error('Error checking active lobby:', error);
    // On error, proceed with join anyway
    if (lobby.is_private) {
      joinLobbyData.value = lobby;
      showPasswordModal.value = true;
    } else {
      confirmJoin(lobby.lobby_id);
    }
  }
};

const confirmJoin = async (lobbyId, password = '') => {
  loading.value = true;
  try {
    const response = await axios.post(`${API_URL}/lobby/join`, {
      lobbyId,
      password
    });

    if (response.data.success) {
      showPasswordModal.value = false;
      router.push({ name: 'LobbyPage', params: { lobbyId } });
    }
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to join lobby');
  } finally {
    loading.value = false;
  }
};

const getGameModeColor = (mode) => {
  const gameMode = gameModes.find(gm => gm.value === mode);
  return gameMode ? gameMode.color : 'gray';
};

onMounted(() => {
  fetchLobbies();
  
  // Poll for updates every 3 seconds
  setInterval(fetchLobbies, 3000);
});
</script>

<template>
  
  <div class="min-h-screen bg-gray-950 py-8 px-4">
    <div class="container mx-auto max-w-6xl">
      <!-- Header -->
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <!-- Add Lobby Invite Notifications -->
           <LobbyInviteNotifications/>
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Game Lobbies</h1>
            <p class="text-gray-400 text-sm">Join a lobby or create your own</p>
          </div>
          <button
            @click="openCreateModal"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg"
          >
            + Create Lobby
          </button>
        </div>
      </div>

      <!-- Lobby List -->
      <div class="space-y-3">
        <div v-if="loading && lobbies.length === 0" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p class="text-gray-400">Loading lobbies...</p>
        </div>

        <div v-else-if="lobbies.length === 0" class="text-center py-12 bg-gray-900 border border-gray-800 rounded-lg">
          <p class="text-gray-400 mb-4">No lobbies available</p>
          <button
            @click="openCreateModal"
            class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Create First Lobby
          </button>
        </div>

        <div
          v-for="lobby in lobbies"
          :key="lobby.lobby_id"
          class="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition"
        >
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-bold text-white">{{ lobby.lobby_name }}</h3>
                
                <!-- Game Mode Badge -->
                <span
                  :class="[
                    'px-2 py-1 rounded text-xs font-semibold',
                    getGameModeColor(lobby.game_mode) === 'blue' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                    getGameModeColor(lobby.game_mode) === 'yellow' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
                    'bg-purple-900/30 text-purple-400 border border-purple-800'
                  ]"
                >
                  {{ gameModes.find(gm => gm.value === lobby.game_mode)?.label || lobby.game_mode }}
                </span>

                <!-- Private Badge -->
                <span v-if="lobby.is_private" class="px-2 py-1 rounded text-xs font-semibold bg-red-900/30 text-red-400 border border-red-800">
                  🔒 Private
                </span>
              </div>

              <div class="flex items-center gap-4 text-sm text-gray-400">
                <span>Host: {{ lobby.host_username }}</span>
                <span>Players: {{ lobby.player_count }}/{{ lobby.max_players }}</span>
              </div>
            </div>

            <button
              @click="joinLobby(lobby)"
              :disabled="lobby.is_full"
              :class="[
                'font-bold py-2 px-6 rounded-lg transition',
                lobby.is_full
                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              ]"
            >
              {{ lobby.is_full ? 'Full' : 'Join' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Lobby Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-md p-6">
        <h3 class="text-2xl font-bold text-white mb-6">Create Lobby</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-gray-400 text-sm font-medium mb-2">Lobby Name</label>
            <input
              v-model="newLobby.lobbyName"
              type="text"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter lobby name"
            />
          </div>

          <div>
            <label class="block text-gray-400 text-sm font-medium mb-2">Game Mode</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="mode in gameModes"
                :key="mode.value"
                @click="newLobby.gameMode = mode.value"
                :class="[
                  'py-3 px-2 rounded-lg font-semibold text-sm transition border-2',
                  newLobby.gameMode === mode.value
                    ? mode.color === 'blue' ? 'bg-blue-600 border-blue-500 text-white' :
                      mode.color === 'yellow' ? 'bg-yellow-600 border-yellow-500 text-white' :
                      'bg-purple-600 border-purple-500 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                ]"
              >
                {{ mode.label }}
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="newLobby.isPrivate"
              type="checkbox"
              id="private"
              class="w-4 h-4"
            />
            <label for="private" class="text-gray-300 text-sm">Private Lobby (requires password)</label>
          </div>

          <div v-if="newLobby.isPrivate">
            <label class="block text-gray-400 text-sm font-medium mb-2">Password</label>
            <input
              v-model="newLobby.password"
              type="password"
              class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter password"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="showCreateModal = false"
            class="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            @click="createLobby"
            :disabled="loading"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            {{ loading ? 'Creating...' : 'Create' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div class="bg-gray-900 border border-gray-800 rounded-lg w-full max-w-sm p-6">
        <h3 class="text-xl font-bold text-white mb-4">Enter Password</h3>

        <input
          v-model="lobbyPassword"
          type="password"
          class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 mb-4"
          placeholder="Enter lobby password"
          @keyup.enter="confirmJoin(joinLobbyData.lobby_id, lobbyPassword)"
        />

        <div class="flex gap-3">
          <button
            @click="showPasswordModal = false"
            class="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            @click="confirmJoin(joinLobbyData.lobby_id, lobbyPassword)"
            :disabled="loading"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50"
          >
            Join
          </button>
        </div>
      </div>
    </div>
  </div>
</template>