<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';

const router = useRouter();

// --- State ---
const lobbies = ref([]);
const isLoading = ref(false);
const notification = ref(null);
let notificationTimer = null;

// --- Modals State ---
const showCreateModal = ref(false);
const showPasswordModal = ref(false);
const isSubmitting = ref(false);

// --- Forms Data ---
const createForm = reactive({
    lobbyName: '',
    isPrivate: false,
    password: '',
    turnTimeLimit: 60
});

const joinForm = reactive({
    lobbyId: null,
    password: ''
});

// --- Lifecycle ---
onMounted(async () => {
    await checkCurrentLobby();
    fetchLobbies();
});

// --- API Actions ---

const checkCurrentLobby = async () => {
    try {
        const res = await fetchApi('/lobbies/me/current');
        // Check if active lobby exists based on API structure
        if (res.data && res.data.success && res.data.data && res.data.data._id) {
            const activeLobbyId = res.data.data._id;
            console.log('Active lobby found, redirecting:', activeLobbyId);
            showNotification('success', 'Rejoining active lobby...');
            router.push(`/lobby/${activeLobbyId}`);
        }
    } catch (err) {
        // User is not in a lobby, stay on list
    }
};

const fetchLobbies = async () => {
    isLoading.value = true;
    try {
        const res = await fetchApi('/lobbies/public?status=waiting');       
        if (res.data && res.data.data && Array.isArray(res.data.data.lobbies)) {
            lobbies.value = res.data.data.lobbies;
        } else if (res.data && Array.isArray(res.data.lobbies)) {
             // Fallback for safety
            lobbies.value = res.data.lobbies;
        } else {
            lobbies.value = [];
        }
    } catch (err) {
        console.error("Fetch Lobbies Error:", err);
        showNotification('error', 'Failed to load lobbies');
    } finally {
        isLoading.value = false;
    }
};

const handleCreateLobby = async () => {
    if (!createForm.lobbyName) {
        showNotification('warning', 'Lobby Name is required');
        return;
    }
    if (createForm.isPrivate && !createForm.password) {
        showNotification('warning', 'Private lobbies require a password');
        return;
    }

    isSubmitting.value = true;
    try {
        const DEFAULT_MAP_ID = "507f1f77bcf86cd799439080"; 

        const payload = {
            lobbyName: createForm.lobbyName,
            mapId: DEFAULT_MAP_ID,
            isPrivate: createForm.isPrivate,
            password: createForm.isPrivate ? createForm.password : null,
            gameSettings: {
                turnTimeLimit: parseInt(createForm.turnTimeLimit),
                allowSpectators: true
            }
        };

        const res = await fetchApi('/lobbies', {
            method: 'POST',
            body: payload
        });
        showNotification('success', 'Lobby Created!');
        const newLobbyId = res.data.lobbyId || res.data._id;
        router.push(`/lobby/${newLobbyId}`);
    } catch (err) {
        const msg = err.response?.data?.message || 'Failed to create lobby';
        showNotification('error', msg);
    } finally {
        isSubmitting.value = false;
        showCreateModal.value = false;
    }
};

const initiateJoin = (lobby) => {
    const lobbyId = lobby.lobbyId || lobby._id;
    if (lobby.isPrivate) {
        joinForm.lobbyId = lobbyId;
        joinForm.password = '';
        showPasswordModal.value = true;
    } else {
        processJoin(lobbyId);
    }
};

const processJoin = async (lobbyId, password = null) => {
    isSubmitting.value = true;
    try {
        const payload = password ? { password } : {};
        const res = await fetchApi(`/lobbies/${lobbyId}/join`, {
            method: 'POST',
            body: payload
        });
        showNotification('success', 'Joining Lobby...');
        const targetId = res.data._id;
        router.push(`/lobby/${targetId}`);
    } catch (err) {
        const msg = err.response?.data?.message || 'Failed to join lobby';
        showNotification('error', msg);
    } finally {
        isSubmitting.value = false;
        showPasswordModal.value = false;
    }
};

// --- Helpers ---
const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

const goToMainMenu = () => router.push('/');

</script>

<template>
  <div id="lobby-bg" class="min-h-screen p-4 md:p-8 overflow-hidden font-sans-custom relative">
    
    <Transition name="slide-down">
      <div 
        v-if="notification"
        :class="[
          'fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-lg shadow-xl max-w-sm w-[90%] border',
          notification.type === 'success' ? 'bg-green-600 border-green-400 text-white' : '',
          notification.type === 'error' ? 'bg-red-600 border-red-400 text-white' : '',
          notification.type === 'warning' ? 'bg-yellow-600 border-yellow-400 text-white' : ''
        ]"
      >
        <div class="flex items-center font-bold">
            <span class="mr-2 text-lg">{{ notification.type === 'success' ? '✅' : notification.type === 'error' ? '⛔' : '⚠️' }}</span>
            <span class="text-sm">{{ notification.message }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade-modal">
        <div v-if="showCreateModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div class="bg-stone-800 border-4 border-yellow-600 p-8 rounded-xl shadow-2xl max-w-md w-full relative">
                <h2 class="text-3xl font-bold text-yellow-100 font-['Creepster'] mb-6 text-center tracking-wide">CREATE WAR ROOM</h2>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-stone-400 text-xs font-bold uppercase mb-1">Room Name</label>
                        <input v-model="createForm.lobbyName" type="text" class="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white focus:border-yellow-500 focus:outline-none" placeholder="Enter room name...">
                    </div>

                    <div>
                        <label class="block text-stone-400 text-xs font-bold uppercase mb-1">Turn Timer (Seconds)</label>
                        <select v-model="createForm.turnTimeLimit" class="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white">
                            <option value="30">30 Seconds (Blitz)</option>
                            <option value="60">60 Seconds (Standard)</option>
                            <option value="90">90 Seconds (Relaxed)</option>
                        </select>
                    </div>

                    <div class="flex items-center gap-3 bg-stone-700/50 p-3 rounded border border-stone-600">
                        <input type="checkbox" id="isPrivate" v-model="createForm.isPrivate" class="w-5 h-5 accent-yellow-500">
                        <label for="isPrivate" class="text-stone-300 font-bold text-sm cursor-pointer select-none">Private Room</label>
                    </div>

                    <div v-if="createForm.isPrivate">
                        <label class="block text-stone-400 text-xs font-bold uppercase mb-1">Password</label>
                        <input v-model="createForm.password" type="password" class="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white focus:border-yellow-500 focus:outline-none" placeholder="Secret key...">
                    </div>
                </div>

                <div class="flex gap-4 mt-8">
                    <button @click="showCreateModal = false" class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 rounded border-b-4 border-stone-800 active:border-b-0 active:translate-y-1">CANCEL</button>
                    <button @click="handleCreateLobby" :disabled="isSubmitting" class="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 rounded border-b-4 border-green-900 active:border-b-0 active:translate-y-1 disabled:opacity-50">
                        {{ isSubmitting ? 'CREATING...' : 'CREATE' }}
                    </button>
                </div>
            </div>
        </div>
    </Transition>

    <Transition name="fade-modal">
        <div v-if="showPasswordModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div class="bg-stone-800 border-4 border-red-800 p-8 rounded-xl shadow-2xl max-w-sm w-full">
                <h3 class="text-xl font-bold text-red-500 font-['Creepster'] mb-4 text-center">RESTRICTED AREA</h3>
                <p class="text-stone-300 text-sm text-center mb-4">Enter the password to join this lobby.</p>
                
                <input v-model="joinForm.password" @keyup.enter="processJoin(joinForm.lobbyId, joinForm.password)" type="password" class="w-full bg-stone-900 border border-stone-600 rounded p-2 text-white focus:border-red-500 focus:outline-none mb-6" placeholder="Password..." autofocus>

                <div class="flex gap-4">
                    <button @click="showPasswordModal = false" class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-2 rounded">CANCEL</button>
                    <button @click="processJoin(joinForm.lobbyId, joinForm.password)" :disabled="isSubmitting" class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded">ENTER</button>
                </div>
            </div>
        </div>
    </Transition>

    <div class="w-full max-w-7xl mx-auto flex justify-between items-center mb-6">
      <button 
        @click="goToMainMenu" 
        class="flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-stone-200 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-stone-900/40 transition-all duration-300 border-b-4 border-r-4 border-stone-900 active:translate-y-px active:border-b-2 active:border-r-2"
      >
        <svg class="h-6 w-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        BACK
      </button>
      
      <div class="bg-stone-800 px-6 py-2 rounded-lg border-2 border-stone-600 text-yellow-100 font-bold shadow-inner">
         SERVER: <span class="text-green-400">ONLINE</span>
      </div>
    </div>

    <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">

      <aside class="lg:col-span-4 flex flex-col gap-4 h-full">
        <div class="bg-stone-800 border-4 border-stone-700 p-6 rounded-xl shadow-xl flex-grow flex flex-col">
          <h2 class="text-3xl font-bold text-yellow-100 mb-6 border-b border-stone-600 pb-2 text-center font-['Creepster'] tracking-wide">
            WAR ROOM
          </h2>
          
          <div class="space-y-4 flex-grow">
             <div class="p-4 bg-stone-700 rounded-lg border-2 border-stone-600 flex items-center gap-4 opacity-75">
                  <div class="text-3xl">🏆</div>
                  <div>
                    <h3 class="text-yellow-100 font-bold">RANKED MATCH</h3>
                    <p class="text-xs text-stone-400">Matchmaking (Coming Soon)</p>
                  </div>
             </div>

             <div class="p-4 bg-stone-700 rounded-lg border-2 border-stone-600 flex items-center gap-4 opacity-75">
                  <div class="text-3xl">🎲</div>
                  <div>
                    <h3 class="text-yellow-100 font-bold">CASUAL PLAY</h3>
                    <p class="text-xs text-stone-400">Quick Match (Coming Soon)</p>
                  </div>
             </div>
          </div>

          <button 
            @click="showCreateModal = true"
            class="w-full mt-6 py-4 bg-blue-700 hover:bg-blue-600 text-white text-2xl font-black uppercase rounded-lg border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex items-center justify-center gap-3 group"
          >
            <span>CREATE LOBBY</span>
            <svg class="w-8 h-8 group-hover:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
        </div>
      </aside>

      <main class="lg:col-span-8 flex flex-col gap-4 h-full">
        
        <div class="bg-stone-800 border-4 border-stone-700 rounded-xl shadow-xl flex flex-col h-full overflow-hidden">
           <div class="p-4 bg-stone-900 border-b border-stone-700 flex justify-between items-center">
              <h3 class="text-yellow-500 font-bold text-xl tracking-wider">ACTIVE LOBBIES</h3>
              <button @click="fetchLobbies" class="text-xs text-stone-400 hover:text-white underline flex items-center gap-1">
                 <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                 Refresh
              </button>
           </div>
           
           <div class="flex-grow overflow-y-auto custom-scrollbar p-2 relative">
              
              <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-stone-800/80 z-10">
                 <svg class="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              </div>

              <table class="w-full text-left text-stone-300">
                 <thead class="text-xs text-stone-500 uppercase bg-stone-900/50 sticky top-0 backdrop-blur-sm z-0">
                    <tr>
                       <th class="px-4 py-3 w-1/3">Room Name</th>
                       <th class="px-4 py-3 w-1/4">Host</th>
                       <th class="px-4 py-3 w-1/6">Status</th>
                       <th class="px-4 py-3 w-1/6 text-center">Players</th>
                       <th class="px-4 py-3 w-1/6 text-right"></th> </tr>
                 </thead>
 <tbody>
                    <tr 
                      v-for="lobby in lobbies" 
                      :key="lobby._id" 
                      class="border-b border-stone-700/40 hover:bg-stone-700/20 transition"
                    >
                       <td class="px-4 py-3 font-bold text-yellow-100">
                          {{ lobby.lobbyName || 'Unnamed Room' }}
                          <span v-if="lobby.isPrivate" class="ml-2 text-red-400 text-xs">🔒</span>
                       </td>

                       <td class="px-4 py-3">
                          {{ lobby.host?.username || 'Host' }}
                       </td>

                       <td class="px-4 py-3 capitalize text-green-400">
                          {{ lobby.status }}
                       </td>

                       <td class="px-4 py-3 text-center font-bold">
                          {{ lobby.playerCount }}/{{ lobby.maxPlayers || 2 }}
                       </td>

                       <td class="px-4 py-3 text-center">
                          <button
                             @click="initiateJoin(lobby)"
                             class="bg-blue-700 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded shadow border-b-4 border-blue-900 active:border-b-0 active:translate-y-px"
                          >
                             Join
                          </button>
                       </td>
                    </tr>

                    <tr v-if="lobbies.length === 0">
                       <td colspan="5" class="text-center text-stone-500 py-10">
                          No available lobbies right now.
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

      </main>

    </div>
  </div>
</template>

<style scoped>
#lobby-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

.slide-down-enter-active { transition: all 0.4s ease-out; }
.slide-down-leave-active { transition: all 0.3s ease-in; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -5rem; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; top: 1.25rem; }

.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #57534e; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #78716c; }
</style>