<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useritem } from '@/stores/playerStore';
import { storeToRefs } from 'pinia';
import axios from 'axios';
import FriendInviteModal from '../PlayerComponents/FriendInviteModal.vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const router = useRouter();
const authStore = useAuthStore();
const playerStore = useritem();

const props = defineProps({
  lobbyId: {
    type: String,
    required: true
  }
});

const { userDecks, userCharacters } = storeToRefs(playerStore);

const lobby = ref(null);
const maps = ref([]);
const loading = ref(false);
const showInviteModal = ref(false);

// Host selections
const hostDeck = ref(null);
const hostCharacter = ref(null);
const selectedMap = ref(null);

// Guest selections
const guestDeck = ref(null);
const guestCharacter = ref(null);

const isHost = computed(() => {
  return lobby.value?.host_user_id === authStore.user?.uid;
});

const isGuest = computed(() => {
  return lobby.value?.guest_user_id === authStore.user?.uid;
});

const canStart = computed(() => {
  return isHost.value &&
    lobby.value?.guest_user_id &&
    hostDeck.value &&
    hostCharacter.value &&
    guestDeck.value &&
    guestCharacter.value &&
    selectedMap.value;
});

// Fetch lobby data
const fetchLobby = async () => {
  try {
    const response = await axios.get(`${API_URL}/lobby/${props.lobbyId}`);
    if (response.data.success) {
      const newLobby = response.data.data.lobby;
      
      // Check if lobby was deleted
      if (!newLobby) {
        alert('Lobby no longer exists');
        router.push({ name: 'LobbyList' });
        return;
      }
      
      lobby.value = newLobby;
      
      // Update local selections
      hostDeck.value = newLobby.host_deck_id;
      hostCharacter.value = newLobby.host_character_id;
      guestDeck.value = newLobby.guest_deck_id;
      guestCharacter.value = newLobby.guest_character_id;
      selectedMap.value = newLobby.selected_map;
    }
  } catch (error) {
    console.error('Failed to fetch lobby:', error);
  }
};

// Fetch maps
const fetchMaps = async () => {
  try {
    const response = await axios.get(`${API_URL}/user/maps`);
    if (response.data.success) {
      maps.value = response.data.data.maps;
    }
  } catch (error) {
    console.error('Failed to fetch maps:', error);
  }
};

// Update selection
const updateSelection = async (type, value) => {
  try {
    const payload = {
      lobbyId: props.lobbyId
    };
    
    if (type === 'deck') {
      payload.deckId = value;
      if (isHost.value) hostDeck.value = value;
      else guestDeck.value = value;
    } else if (type === 'character') {
      payload.characterId = value;
      if (isHost.value) hostCharacter.value = value;
      else guestCharacter.value = value;
    }

    await axios.post(`${API_URL}/lobby/update-selection`, payload);
  } catch (error) {
    console.error('Failed to update selection:', error);
  }
};

// Update map (host only)
const updateMap = async (mapId) => {
  if (!isHost.value) return;
  
  try {
    selectedMap.value = mapId;
    await axios.post(`${API_URL}/lobby/update-map`, {
      lobbyId: props.lobbyId,
      mapId
    });
  } catch (error) {
    console.error('Failed to update map:', error);
  }
};

const leaveLobby = async () => {
  try {
    await axios.post(`${API_URL}/lobby/leave/${props.lobbyId}`);
    console.log('✅ Left lobby successfully');
    router.push({ name: 'LobbyList' });
  } catch (error) {
    console.error('Failed to leave lobby:', error);
    router.push({ name: 'LobbyList' });
  }
};

// Start game (host only)
const startGame = async () => {
  if (!canStart.value) {
    alert('Please wait for all players to select their deck and character');
    return;
  }

  try {
    await axios.post(`${API_URL}/lobby/start/${props.lobbyId}`);
    router.push({ 
      name: 'GameManager', 
      params: { 
        lobbyId: props.lobbyId 
      } 
    });
  } catch (error) {
    alert('Failed to start game');
    console.error(error);
  }
};

// Watch for selections
watch(hostDeck, (val) => {
  if (val && isHost.value) updateSelection('deck', val);
});

watch(hostCharacter, (val) => {
  if (val && isHost.value) updateSelection('character', val);
});

watch(guestDeck, (val) => {
  if (val && isGuest.value) updateSelection('deck', val);
});

watch(guestCharacter, (val) => {
  if (val && isGuest.value) updateSelection('character', val);
});

watch(selectedMap, (val) => {
  if (val && isHost.value) updateMap(val);
});

onBeforeUnmount(async () => {
  if (pollInterval) clearInterval(pollInterval);
  const nextRoute = router.currentRoute.value.path;
  if (!nextRoute.includes('lobby')) {
    try {
      await axios.post(`${API_URL}/lobby/leave/${props.lobbyId}`);
      console.log('✅ Left lobby on unmount');
    } catch (error) {
      console.error('Error leaving lobby on unmount:', error);
    }
  }
});

// Polling for updates
let pollInterval;

onMounted(async () => {
  await playerStore.initializeData();
  await fetchLobby();
  await fetchMaps();
  
  // Poll every 2 seconds
  pollInterval = setInterval(fetchLobby, 2000);
});

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval);
  leaveLobby();
});
</script>

<template>
  <div class="min-h-screen bg-gray-950 py-8 px-4">
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p class="text-gray-300 text-xl">Loading lobby...</p>
      </div>
    </div>

    <div v-else-if="lobby" class="container mx-auto max-w-6xl">
      <!-- Header -->
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">{{ lobby.lobby_name }}</h1>
            <div class="flex items-center gap-3">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-xs font-semibold',
                  lobby.game_mode === 'normal' ? 'bg-blue-900/30 text-blue-400 border border-blue-800' :
                  lobby.game_mode === 'ranked' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-800' :
                  'bg-purple-900/30 text-purple-400 border border-purple-800'
                ]"
              >
                {{ lobby.game_mode.toUpperCase() }}
              </span>
              <span v-if="lobby.is_private" class="px-3 py-1 rounded-full text-xs font-semibold bg-red-900/30 text-red-400 border border-red-800">
                🔒 PRIVATE
              </span>
            </div>
          </div>
          <div class="flex gap-3">
            <button
              v-if="isHost"
              @click="showInviteModal = true"
              class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Invite Friends
            </button>
            <button
              @click="leaveLobby"
              class="bg-red-900/30 hover:bg-red-900/50 text-red-400 font-medium py-2 px-4 rounded-lg transition border border-red-900/50"
            >
              Leave Lobby
            </button>
          </div>
        </div>
      </div>

      <!-- Players Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Host Player -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              👑
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">{{ lobby.host_username }}</h3>
              <p class="text-gray-400 text-sm">Host</p>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-gray-400 text-sm font-medium mb-2">Deck</label>
              <select
                v-model="hostDeck"
                :disabled="!isHost"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option :value="null">Select Deck</option>
                <option
                  v-for="deck in userDecks"
                  :key="deck.deckid"
                  :value="deck.deckid"
                >
                  {{ deck.deck_name }} ({{ deck.cardid.length }} cards)
                </option>
              </select>
            </div>

            <div>
              <label class="block text-gray-400 text-sm font-medium mb-2">Character</label>
              <select
                v-model="hostCharacter"
                :disabled="!isHost"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option :value="null">Select Character</option>
                <option
                  v-for="char in userCharacters"
                  :key="char.idcharacter"
                  :value="char.idcharacter"
                >
                  {{ char.charatername }}
                </option>
              </select>
            </div>

            <div v-if="hostCharacter" class="flex justify-center mt-4">
              <div class="w-32 h-32 rounded-lg border-2 border-blue-500 overflow-hidden bg-gray-800">
                <img
                  :src="`/characters/${hostCharacter}.png`"
                  :alt="'Character'"
                  class="w-full h-full object-cover"
                  @error="$event.target.src = '/characters/default.png'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Guest Player -->
        <div class="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <div v-if="lobby.guest_user_id" class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-bold">
              ⚔️
            </div>
            <div>
              <h3 class="text-xl font-bold text-white">{{ lobby.guest_username }}</h3>
              <p class="text-gray-400 text-sm">Player 2</p>
            </div>
          </div>
          
          <div v-else class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-gray-800 border-2 border-dashed border-gray-700 mx-auto mb-4 flex items-center justify-center">
              <span class="text-3xl">👤</span>
            </div>
            <p class="text-gray-400 mb-2">Waiting for player...</p>
            <p class="text-gray-500 text-sm">{{ lobby.is_private ? 'Send invite to friends' : 'Another player will join soon' }}</p>
          </div>

          <div v-if="lobby.guest_user_id" class="space-y-4">
            <div>
              <label class="block text-gray-400 text-sm font-medium mb-2">Deck</label>
              <select
                v-model="guestDeck"
                :disabled="!isGuest"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option :value="null">Select Deck</option>
                <option
                  v-for="deck in userDecks"
                  :key="deck.deckid"
                  :value="deck.deckid"
                >
                  {{ deck.deck_name }} ({{ deck.cardid.length }} cards)
                </option>
              </select>
            </div>

            <div>
              <label class="block text-gray-400 text-sm font-medium mb-2">Character</label>
              <select
                v-model="guestCharacter"
                :disabled="!isGuest"
                class="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option :value="null">Select Character</option>
                <option
                  v-for="char in userCharacters"
                  :key="char.idcharacter"
                  :value="char.idcharacter"
                >
                  {{ char.charatername }}
                </option>
              </select>
            </div>

            <div v-if="guestCharacter" class="flex justify-center mt-4">
              <div class="w-32 h-32 rounded-lg border-2 border-green-500 overflow-hidden bg-gray-800">
                <img
                  :src="`/characters/${guestCharacter}.png`"
                  :alt="'Character'"
                  class="w-full h-full object-cover"
                  @error="$event.target.src = '/characters/default.png'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Map Selection -->
      <div class="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-bold text-white mb-4">Map Selection</h3>
        <p v-if="!isHost" class="text-gray-400 text-sm mb-4">Only host can select the map</p>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="map in maps"
            :key="map.id"
            @click="isHost && updateMap(map.mapid)"
            :class="[
              'relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
              selectedMap === map.mapid
                ? 'border-blue-500 shadow-lg shadow-blue-500/30 ring-2 ring-blue-500/30'
                : 'border-gray-700 hover:border-gray-600',
              !isHost && 'cursor-not-allowed opacity-60'
            ]"
          >
            <div class="aspect-video bg-gray-800">
              <img
                :src="`/maps/${map.image}`"
                :alt="map.name"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end">
              <p class="text-white font-semibold text-sm p-2">{{ map.name }}</p>
            </div>
            <div
              v-if="selectedMap === map.mapid"
              class="absolute top-2 right-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
            >
              ✓
            </div>
          </div>
        </div>
      </div>

      <!-- Start Game Button -->
      <div class="text-center">
        <button
          v-if="isHost"
          @click="startGame"
          :disabled="!canStart"
          :class="[
            'font-bold py-4 px-12 rounded-lg transition shadow-lg text-lg',
            canStart
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          ]"
        >
          {{ canStart ? '🎮 Start Game' : 'Waiting for players...' }}
        </button>
        
        <div v-else class="bg-blue-900/20 border border-blue-800 rounded-lg p-4 inline-block">
          <p class="text-blue-400 font-medium">
            {{ !lobby.guest_user_id ? '⏳ Waiting for another player to join...' : 
               !guestDeck || !guestCharacter ? '⚙️ Select your deck and character' :
               '✓ Ready! Waiting for host to start the game...' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Friend Invite Modal -->
    <FriendInviteModal
      v-if="showInviteModal"
      :lobbyId="props.lobbyId"
      @close="showInviteModal = false"
    />
  </div>
</template>