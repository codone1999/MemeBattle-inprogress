<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';
import { getDefaultImageUrl } from '@/utils/imageUrl';
import socket from '@/utils/socket';

// --- State ---
const route = useRoute();
const router = useRouter();
const lobbyId = route.params.lobbyId;

const lobby = ref(null);
const currentUser = ref(null);
const userDecks = ref([]);
const userCharacters = ref([]);
const availableMaps = ref([]);
const isLoading = ref(true);
const isStarting = ref(false);

// Helper function to get player ID (handles both string and object _id)
const getPlayerId = (player) => {
    if (!player) return null;
    // Handle nested _id structure from populated userId
    if (player.userId) {
        if (typeof player.userId === 'object' && player.userId._id) {
            return player.userId._id;
        }
        return player.userId;
    }
    // Handle direct _id
    if (typeof player._id === 'object' && player._id._id) {
        return player._id._id;
    }
    return player._id;
};

// --- Computed Props ---
const isHost = computed(() => {
    const userId = currentUser.value?._id;
    return lobby.value && currentUser.value && lobby.value.host._id === userId;
});

const hostPlayer = computed(() => {
    if (!lobby.value) return null;
    const hostId = lobby.value.host._id;
    return lobby.value.players.find(p => getPlayerId(p) === hostId);
});

const guestPlayer = computed(() => {
    if (!lobby.value) return null;
    const hostId = lobby.value.host._id;
    return lobby.value.players.find(p => getPlayerId(p) !== hostId);
});

const isCurrentUserHost = computed(() => {
    const userId = currentUser.value?._id;
    return currentUser.value && hostPlayer.value && getPlayerId(hostPlayer.value) === userId;
});

const isCurrentUserGuest = computed(() => {
    const userId = currentUser.value?._id;
    return currentUser.value && guestPlayer.value && getPlayerId(guestPlayer.value) === userId;
});

const canStartGame = computed(() => {
    if (!lobby.value) return false;
    const allReady = lobby.value.players.every(p => p.deckId && p.characterId && p.isReady);
    return lobby.value.playerCount === 2 && allReady;
});


// Helper function to refetch lobby state
const fetchLobbyState = async () => {
    try {
        const lobbyRes = await fetchApi(`/lobbies/${lobbyId}`);
        if (lobbyRes.success) {
            lobby.value = lobbyRes.data;
        }
    } catch (err) {
        console.error("Failed to refetch lobby state:", err);
    }
};

// --- Socket Logic ---
const setupSocketListeners = () => {
    // Check if already connected
    if (socket.connected) {
        socket.emit('lobby:joined', {
            lobbyId,
            userId: currentUser.value?._id
        });
    }

    // Real-time lobby updates
    socket.on('lobby:state:update', (updatedLobby) => {
        lobby.value = updatedLobby;
    });

    // Handle reconnection
    socket.on('lobby:reconnected', () => {
        fetchLobbyState();
    });

    // Game started event
    socket.on('game:started', (data) => {
        router.push(`/game/${data.gameId}`);
    });

    // Kicked event
    socket.on('lobby:kicked', (data) => {
        alert(data.message || 'You have been kicked.');
        router.push('/lobby');
    });

    // Lobby closed event
    socket.on('lobby:closed', (data) => {
        alert(data.message || 'Lobby closed.');
        router.push('/lobby');
    });

    // Socket errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
        alert(error.message || 'Socket error occurred');
    });

    // Connect and join lobby room
    socket.connect();

    socket.on('connect', () => {
        socket.emit('lobby:joined', {
            lobbyId,
            userId: currentUser.value?._id
        });
    });
};

// --- Lifecycle ---
onMounted(async () => {
    try {
        // 1. Get User Profile
        const userRes = await fetchApi('/auth/me');
        if (userRes.success) {
            currentUser.value = userRes.data.user;

            // Store userId for socket authentication
            if (currentUser.value._id) {
                localStorage.setItem('userId', currentUser.value._id);
            }
        }

        // 2. Fetch Initial Lobby State
        const lobbyRes = await fetchApi(`/lobbies/${lobbyId}`);
        if (lobbyRes.success) {
            lobby.value = lobbyRes.data;

            // Check if current user is in the lobby
            const isUserInLobby = lobby.value.players.some(player => {
                const playerId = getPlayerId(player);
                return playerId === currentUser.value._id;
            });

            // If user is not in lobby and not the host, try to join
            if (!isUserInLobby && lobby.value.host._id !== currentUser.value._id) {
                try {
                    const joinRes = await fetchApi(`/lobbies/${lobbyId}/join`, {
                        method: 'POST',
                        body: {}
                    });
                    if (joinRes.success) {
                        lobby.value = joinRes.data;
                    }
                } catch (joinErr) {
                    console.error('Failed to auto-join lobby:', joinErr);
                    alert(joinErr.message || 'Failed to join this lobby');
                    router.push('/lobby');
                    return;
                }
            }
        }

        // 3. Fetch User Decks
        const decksRes = await fetchApi('/decks');
        if (decksRes.success) {
            userDecks.value = decksRes.data.decks;
        }

        // 4. Fetch User Characters
        const charsRes = await fetchApi('/inventory');
        if (charsRes.success) {
            userCharacters.value = charsRes.data.characters || [];
        }

        // 5. Fetch Available Maps
        const mapsRes = await fetchApi('/maps');
        if (mapsRes.success) {
            availableMaps.value = mapsRes.data.maps || mapsRes.data || [];
        }

        // 6. Initialize Socket
        setupSocketListeners();

    } catch (err) {
        console.error("Lobby Load Error:", err);
    } finally {
        isLoading.value = false;
    }
});

onUnmounted(() => {
    if (socket.connected) {
        socket.emit('lobby:leave', { lobbyId });
        socket.off();
        socket.disconnect();
    }
});

// --- Actions ---
const handleDeckSelect = async (deckId) => {
    if (!deckId) return;
    try {
        socket.emit('lobby:select:deck', { deckId });
        await fetchApi(`/lobbies/${lobbyId}/deck`, {
            method: 'PUT',
            body: { deckId }
        });
    } catch (err) {
        console.error("Deck select error", err);
    }
};

const handleCharacterSelect = async (characterId) => {
    if (!characterId) return;
    try {
        socket.emit('lobby:select:character', { characterId });
        await fetchApi(`/lobbies/${lobbyId}/character`, {
            method: 'PUT',
            body: { characterId }
        });
    } catch (err) {
        console.error("Character select error", err);
    }
};

const handleMapSelect = async (mapId) => {
    if (!mapId || !isHost.value) return;
    try {
        socket.emit('lobby:update:settings', { mapId });
        await fetchApi(`/lobbies/${lobbyId}/settings`, {
            method: 'PUT',
            body: { mapId }
        });
    } catch (err) {
        console.error("Map select error", err);
    }
};

const toggleReady = () => {
    const currentPlayerData = isCurrentUserHost.value ? hostPlayer.value : guestPlayer.value;

    if (!currentPlayerData?.deckId) {
        alert("Please select a deck first!");
        return;
    }

    if (!currentPlayerData?.characterId) {
        alert("Please select a character first!");
        return;
    }

    const newStatus = !currentPlayerData.isReady;
    socket.emit('lobby:ready:toggle', { isReady: newStatus });
};

const handleStartGame = async () => {
    if (!isHost.value) return;
    isStarting.value = true;
    try {
        await fetchApi(`/lobbies/${lobbyId}/start`, { method: 'POST' });
        socket.emit('lobby:start:game', { lobbyId });
    } catch (err) {
        console.error("Start game error", err);
        isStarting.value = false;
        alert(err.response?.data?.message || "Failed to start game");
    }
};

const handleLeave = async () => {
    if (confirm("Are you sure you want to leave?")) {
        try {
            await fetchApi(`/lobbies/${lobbyId}/leave`, { method: 'POST' });
            router.push('/lobby');
        } catch (e) {
            console.error('Leave error:', e);
            router.push('/lobby');
        }
    }
};
</script>

<template>
  <div class="min-h-screen bg-stone-900 text-yellow-100 font-sans-custom p-4 md:p-8 flex flex-col items-center">
    
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-full mt-20">
      <div class="animate-spin text-6xl mb-4">⚔️</div>
      <p class="text-xl animate-pulse">Establishing Secure Connection...</p>
    </div>

    <div v-else class="w-full max-w-6xl space-y-8">
      
      <header class="flex justify-between items-center bg-stone-800 p-6 rounded-xl border-4 border-stone-700 shadow-2xl">
        <div>
          <h1 class="text-4xl font-['Creepster'] text-yellow-500 tracking-wider">
            {{ lobby.lobbyName }}
          </h1>
          <div class="flex items-center gap-4 mt-2 text-stone-400">
             <span class="bg-stone-900 px-3 py-1 rounded text-sm font-mono">ID: {{ lobbyId }}</span>
             <span class="flex items-center gap-1">
               <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               {{ lobby.status }}
             </span>
             <span class="bg-blue-900 px-3 py-1 rounded text-sm">
               Players: {{ lobby.playerCount }}/{{ lobby.maxPlayers }}
             </span>
          </div>
        </div>
        
        <button 
          @click="handleLeave"
          class="bg-stone-700 hover:bg-stone-600 text-stone-300 font-bold py-2 px-6 rounded border-b-4 border-stone-900 active:translate-y-1 active:border-b-0 transition-all uppercase"
        >
          Retreat
        </button>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch min-h-[400px]">
        
        <!-- LEFT SIDE: HOST (BLUE) -->
        <div class="bg-stone-800/80 rounded-xl border-2 border-blue-900/50 p-6 flex flex-col relative overflow-hidden group">
          <div class="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>
          
          <div v-if="hostPlayer" class="animate-fade-in h-full flex flex-col">
            <div class="flex items-center gap-4 mb-6">
              <img :src="hostPlayer?.profilePic || getDefaultImageUrl('avatar')"
                   v-image-fallback:avatar
                   class="w-20 h-20 rounded-lg border-2 border-stone-500 object-cover" />
              <div>
                <h3 class="text-2xl font-bold">
                  {{ hostPlayer?.username }}
                  <span v-if="isCurrentUserHost" class="text-blue-400">(You)</span>
                </h3>
                <p class="text-blue-400 font-bold uppercase text-sm">Host</p>
              </div>
            </div>

            <!-- Controls if current user -->
            <div v-if="isCurrentUserHost" class="mt-auto space-y-4">
              <label class="block text-stone-400 text-xs font-bold uppercase">Select Your Deck</label>
              <select
                :value="hostPlayer?.deckId"
                @change="handleDeckSelect($event.target.value)"
                class="w-full bg-stone-900 border border-stone-600 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
              >
                <option value="" disabled>-- Choose a Deck --</option>
                <option v-for="deck in userDecks" :key="deck.deckId" :value="deck.deckId">
                  {{ deck.deckTitle }} ({{ deck.cardCount }} Cards)
                </option>
              </select>

              <label class="block text-stone-400 text-xs font-bold uppercase">Select Your Character</label>
              <select
                :value="hostPlayer?.characterId?._id || hostPlayer?.characterId"
                @change="handleCharacterSelect($event.target.value)"
                class="w-full bg-stone-900 border border-stone-600 rounded p-3 text-white focus:border-blue-500 outline-none transition-colors"
              >
                <option value="" disabled>-- Choose a Character --</option>
                <option v-for="char in userCharacters" :key="char._id" :value="char._id">
                  {{ char.name }} ({{ char.rarity }})
                </option>
              </select>

              <button
                @click="toggleReady"
                :class="[
                  'w-full py-3 font-black uppercase tracking-wider rounded border-b-4 transition-all',
                  hostPlayer?.isReady
                    ? 'bg-green-600 hover:bg-green-500 border-green-800 text-white'
                    : 'bg-stone-600 hover:bg-stone-500 border-stone-800 text-stone-300'
                ]"
              >
                {{ hostPlayer?.isReady ? 'READY!' : 'MARK AS READY' }}
              </button>
            </div>

            <!-- Status if not current user -->
            <div v-else class="mt-auto">
               <div class="bg-stone-900 p-4 rounded border border-stone-700 mb-2">
                 <p class="text-xs text-stone-500 uppercase">Deck Status</p>
                 <p :class="hostPlayer.deckId ? 'text-green-400' : 'text-stone-400'">
                   {{ hostPlayer.deckId ? 'Deck Selected' : 'Choosing Deck...' }}
                 </p>
               </div>

               <div class="bg-stone-900 p-4 rounded border border-stone-700 mb-4">
                 <p class="text-xs text-stone-500 uppercase">Character Status</p>
                 <p :class="hostPlayer.characterId ? 'text-green-400' : 'text-stone-400'">
                   {{ hostPlayer.characterId ? (hostPlayer.characterId.name || 'Character Selected') : 'Choosing Character...' }}
                 </p>
               </div>

               <div :class="[
                 'w-full py-3 text-center font-bold uppercase rounded border-2',
                 hostPlayer.isReady
                   ? 'bg-green-900/30 border-green-600 text-green-400'
                   : 'bg-stone-900/30 border-stone-600 text-stone-500'
               ]">
                 {{ hostPlayer.isReady ? 'READY' : 'NOT READY' }}
               </div>
            </div>
          </div>
        </div>

        <!-- CENTER: VS and Controls -->
        <div class="flex flex-col items-center justify-center text-center">
          <div class="text-6xl font-['Creepster'] text-red-600 drop-shadow-lg mb-4">VS</div>

          <!-- Map Selection (Host) or Display (Guest) -->
          <div class="bg-stone-800 p-4 rounded-lg border border-stone-700 w-full">
            <p class="text-stone-400 text-sm uppercase mb-2">Map</p>
            <select
              v-if="isHost"
              :value="lobby.mapId?._id || lobby.mapId"
              @change="handleMapSelect($event.target.value)"
              class="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white focus:border-yellow-500 outline-none transition-colors"
            >
              <option value="" disabled>-- Choose Map --</option>
              <option v-for="map in availableMaps" :key="map._id" :value="map._id">
                {{ map.name }} ({{ map.difficulty }})
              </option>
            </select>
            <p v-else class="text-yellow-100 font-bold text-lg">
              {{ lobby.mapId?.name || lobby.map?.name || 'No Map Selected' }}
            </p>
          </div>
          
          <div v-if="isHost" class="mt-8 w-full">
            <button 
              @click="handleStartGame"
              :disabled="!canStartGame || isStarting"
              class="w-full py-4 bg-yellow-600 hover:bg-yellow-500 disabled:bg-stone-700 disabled:text-stone-500 text-white text-xl font-black uppercase rounded shadow-[0_0_20px_rgba(234,179,8,0.3)] border-b-4 border-yellow-800 active:border-b-0 active:translate-y-1 transition-all"
            >
              {{ isStarting ? 'Launching...' : 'START BATTLE' }}
            </button>
            <p v-if="!canStartGame" class="text-xs text-red-400 mt-2">
              Waiting for players to be ready...
            </p>
          </div>
          <div v-else class="mt-8 text-stone-500 font-style-italic">
            Waiting for host to start...
          </div>
        </div>

        <!-- RIGHT SIDE: GUEST (RED) -->
        <div class="bg-stone-800/80 rounded-xl border-2 border-red-900/50 p-6 flex flex-col relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-2 bg-red-600"></div>

          <div v-if="guestPlayer" :key="guestPlayer.username" class="animate-fade-in h-full flex flex-col">
            <div class="flex items-center gap-4 mb-6">
              <img :src="guestPlayer.profilePic || getDefaultImageUrl('avatar')"
                   v-image-fallback:avatar
                   class="w-20 h-20 rounded-lg border-2 border-stone-500 object-cover" />
              <div>
                <h3 class="text-2xl font-bold">
                  {{ guestPlayer.username }}
                  <span v-if="isCurrentUserGuest" class="text-red-400">(You)</span>
                </h3>
                <p class="text-red-400 font-bold uppercase text-sm">Challenger</p>
              </div>
            </div>

            <!-- Controls if current user -->
            <div v-if="isCurrentUserGuest" class="mt-auto space-y-4">
              <label class="block text-stone-400 text-xs font-bold uppercase">Select Your Deck</label>
              <select
                :value="guestPlayer?.deckId"
                @change="handleDeckSelect($event.target.value)"
                class="w-full bg-stone-900 border border-stone-600 rounded p-3 text-white focus:border-red-500 outline-none transition-colors"
              >
                <option value="" disabled>-- Choose a Deck --</option>
                <option v-for="deck in userDecks" :key="deck.deckId" :value="deck.deckId">
                  {{ deck.deckTitle }} ({{ deck.cardCount }} Cards)
                </option>
              </select>

              <label class="block text-stone-400 text-xs font-bold uppercase">Select Your Character</label>
              <select
                :value="guestPlayer?.characterId?._id || guestPlayer?.characterId"
                @change="handleCharacterSelect($event.target.value)"
                class="w-full bg-stone-900 border border-stone-600 rounded p-3 text-white focus:border-red-500 outline-none transition-colors"
              >
                <option value="" disabled>-- Choose a Character --</option>
                <option v-for="char in userCharacters" :key="char._id" :value="char._id">
                  {{ char.name }} ({{ char.rarity }})
                </option>
              </select>

              <button
                @click="toggleReady"
                :class="[
                  'w-full py-3 font-black uppercase tracking-wider rounded border-b-4 transition-all',
                  guestPlayer?.isReady
                    ? 'bg-green-600 hover:bg-green-500 border-green-800 text-white'
                    : 'bg-stone-600 hover:bg-stone-500 border-stone-800 text-stone-300'
                ]"
              >
                {{ guestPlayer?.isReady ? 'READY!' : 'MARK AS READY' }}
              </button>
            </div>

            <!-- Status if not current user -->
            <div v-else class="mt-auto">
               <div class="bg-stone-900 p-4 rounded border border-stone-700 mb-2">
                 <p class="text-xs text-stone-500 uppercase">Deck Status</p>
                 <p :class="guestPlayer.deckId ? 'text-green-400' : 'text-stone-400'">
                   {{ guestPlayer.deckId ? 'Deck Selected' : 'Choosing Deck...' }}
                 </p>
               </div>

               <div class="bg-stone-900 p-4 rounded border border-stone-700 mb-4">
                 <p class="text-xs text-stone-500 uppercase">Character Status</p>
                 <p :class="guestPlayer.characterId ? 'text-green-400' : 'text-stone-400'">
                   {{ guestPlayer.characterId ? (guestPlayer.characterId.name || 'Character Selected') : 'Choosing Character...' }}
                 </p>
               </div>

               <div :class="[
                 'w-full py-3 text-center font-bold uppercase rounded border-2',
                 guestPlayer.isReady
                   ? 'bg-green-900/30 border-green-600 text-green-400'
                   : 'bg-stone-900/30 border-stone-600 text-stone-500'
               ]">
                 {{ guestPlayer.isReady ? 'READY' : 'NOT READY' }}
               </div>
            </div>
          </div>

          <!-- Empty state -->
          <div v-else class="h-full flex flex-col items-center justify-center text-stone-600 border-2 border-dashed border-stone-700 rounded-lg bg-stone-900/20">
            <div class="text-4xl mb-2 animate-bounce">?</div>
            <p class="uppercase font-bold tracking-widest">Waiting for Opponent</p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>