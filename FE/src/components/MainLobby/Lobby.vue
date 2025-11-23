<script setup>
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- State: Notification [NEW] ---
const notification = ref(null);
let notificationTimer = null;

// --- State: Matchmaking ---
const isMatchmaking = ref(false);
const matchmakingTime = ref(0);
let matchTimerInterval = null;

// --- State: Mock Data ---
const rooms = ref([
  { id: 101, name: "Noobs Only", host: "PepeSad", mode: "Casual", players: "1/2", status: "Waiting" },
  { id: 102, name: "Pro Rank Push", host: "Chad_Giga", mode: "Ranked", players: "1/2", status: "Waiting" },
  { id: 103, name: "Test Deck", host: "DogeMaster", mode: "Custom", players: "2/2", status: "Full" },
  { id: 104, name: "Come 1v1", host: "RickRoller", mode: "Casual", players: "1/2", status: "Waiting" },
]);

const chatMessages = ref([
  { id: 1, user: "System", text: "Welcome to the Battle Hall!", type: "system" },
  { id: 2, user: "DogeMaster", text: "Anyone up for a quick match?", type: "user" },
  { id: 3, user: "PepeSad", text: "My deck is too weak...", type: "user" },
]);

const chatInput = ref("");
const chatContainer = ref(null);

// --- Helper: Notification ---
const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// --- Functions ---

const goToMainMenu = () => {
  router.push('/');
};

// Start Matchmaking
const startMatchmaking = () => {
  if (isMatchmaking.value) return;
  
  isMatchmaking.value = true;
  matchmakingTime.value = 0;
  
  matchTimerInterval = setInterval(() => {
    matchmakingTime.value++;
    if (matchmakingTime.value > 5) {
        cancelMatchmaking();
        showNotification('success', 'Match Found! Entering arena...', 2000);
        // router.push('/game/123'); 
    }
  }, 1000);
};

// Cancel Matchmaking
const cancelMatchmaking = () => {
  isMatchmaking.value = false;
  clearInterval(matchTimerInterval);
  matchmakingTime.value = 0;
};

// Join Room
const joinRoom = (room) => {
  if (room.status === 'Full') {
      showNotification('error', 'This room is full!');
      return;
  }
  showNotification('success', `Joining room: ${room.name}...`);
};

// Create Room
const createRoom = () => {
    showNotification('warning', 'Create Room feature is coming soon!');
};

// Chat System
const sendMessage = () => {
  if (!chatInput.value.trim()) return;
  
  chatMessages.value.push({
    id: Date.now(),
    user: "Me",
    text: chatInput.value,
    type: "self"
  });
  
  chatInput.value = "";
  
  nextTick(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
    }
  });
};
</script>

<template>
  <div id="lobby-bg" class="min-h-screen p-4 md:p-8 overflow-hidden font-sans-custom relative">
    
    <Transition name="slide-down">
      <div 
        v-if="notification"
        :class="[
          'fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-lg shadow-xl max-w-sm w-[90%]',
          notification.type === 'success' ? 'bg-green-600 border border-green-500' : '',
          notification.type === 'error' ? 'bg-red-600 border border-red-500' : '',
          notification.type === 'warning' ? 'bg-yellow-600 border border-yellow-500' : ''
        ]"
      >
        <div class="flex items-center text-white font-bold">
          <span v-if="notification.type === 'success'" class="mr-2 text-lg">✅</span>
          <span v-else-if="notification.type === 'error'" class="mr-2 text-lg">⛔</span>
          <span v-else class="mr-2 text-lg">⚠️</span>
          <span class="text-sm">{{ notification.message }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade-modal">
      <div v-if="isMatchmaking" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div class="bg-stone-800 border-4 border-yellow-600 p-10 rounded-xl shadow-2xl text-center relative overflow-hidden max-w-md w-full">
          
          <div class="relative w-24 h-24 mx-auto mb-6">
             <svg class="animate-spin-slow w-full h-full text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
             <div class="absolute inset-0 flex items-center justify-center text-4xl">⚔️</div>
          </div>

          <h2 class="text-3xl font-bold text-yellow-100 font-['Creepster'] tracking-widest animate-pulse">FINDING OPPONENT...</h2>
          <p class="text-stone-400 mt-2 font-mono text-lg">{{ Math.floor(matchmakingTime / 60) }}:{{ (matchmakingTime % 60).toString().padStart(2, '0') }}</p>

          <button 
            @click="cancelMatchmaking"
            class="mt-8 px-8 py-2 bg-red-700 hover:bg-red-600 text-white font-bold rounded border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all"
          >
            CANCEL
          </button>

          <div class="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none"></div>
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
         SERVER: <span class="text-green-400">ONLINE</span> (Ping: 24ms)
      </div>
    </div>

    <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-120px)]">

      <aside class="lg:col-span-4 flex flex-col gap-4 h-full">
        <div class="bg-stone-800 border-4 border-stone-700 p-6 rounded-xl shadow-xl flex-grow flex flex-col">
          <h2 class="text-2xl font-bold text-yellow-100 mb-6 border-b border-stone-600 pb-2 text-center font-['Creepster'] tracking-wide">
            BATTLE MODES
          </h2>
          
          <div class="space-y-4 flex-grow">
            <label class="mode-card group cursor-pointer block">
               <input type="radio" name="mode" class="hidden" checked>
               <div class="p-4 bg-stone-700 rounded-lg border-2 border-stone-600 group-hover:border-yellow-500 transition-all flex items-center gap-4">
                  <div class="text-3xl">🏆</div>
                  <div>
                    <h3 class="text-yellow-100 font-bold">RANKED MATCH</h3>
                    <p class="text-xs text-stone-400">Compete for glory & LP</p>
                  </div>
               </div>
            </label>

            <label class="mode-card group cursor-pointer block">
               <input type="radio" name="mode" class="hidden">
               <div class="p-4 bg-stone-700 rounded-lg border-2 border-stone-600 group-hover:border-green-500 transition-all flex items-center gap-4">
                  <div class="text-3xl">🎲</div>
                  <div>
                    <h3 class="text-yellow-100 font-bold">CASUAL PLAY</h3>
                    <p class="text-xs text-stone-400">Practice without pressure</p>
                  </div>
               </div>
            </label>

             <label class="mode-card group cursor-pointer block" @click="createRoom">
               <input type="radio" name="mode" class="hidden">
               <div class="p-4 bg-stone-700 rounded-lg border-2 border-stone-600 group-hover:border-blue-500 transition-all flex items-center gap-4">
                  <div class="text-3xl">🔑</div>
                  <div>
                    <h3 class="text-yellow-100 font-bold">CREATE ROOM</h3>
                    <p class="text-xs text-stone-400">Play with friends</p>
                  </div>
               </div>
            </label>
          </div>

          <button 
            @click="startMatchmaking"
            class="w-full mt-6 py-4 bg-green-700 hover:bg-green-600 text-white text-2xl font-black uppercase rounded-lg border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all shadow-xl flex items-center justify-center gap-3 group"
          >
            <span>FIND MATCH</span>
            <svg class="w-8 h-8 group-hover:animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </button>
        </div>
      </aside>

      <main class="lg:col-span-8 flex flex-col gap-4 h-full">
        
        <div class="bg-stone-800 border-4 border-stone-700 rounded-xl shadow-xl flex flex-col h-1/2 overflow-hidden">
           <div class="p-3 bg-stone-900 border-b border-stone-700 flex justify-between items-center">
              <h3 class="text-yellow-500 font-bold">CUSTOM ROOMS</h3>
              <button class="text-xs text-stone-400 hover:text-white underline">Refresh</button>
           </div>
           
           <div class="flex-grow overflow-y-auto custom-scrollbar p-2">
              <table class="w-full text-left text-stone-300">
                 <thead class="text-xs text-stone-500 uppercase bg-stone-900/50 sticky top-0">
                    <tr>
                       <th class="px-4 py-2">Room Name</th>
                       <th class="px-4 py-2">Host</th>
                       <th class="px-4 py-2">Mode</th>
                       <th class="px-4 py-2">Status</th>
                       <th class="px-4 py-2 text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody class="divide-y divide-stone-700">
                    <tr v-for="room in rooms" :key="room.id" class="hover:bg-stone-700/50 transition-colors">
                       <td class="px-4 py-3 font-bold text-yellow-100">{{ room.name }}</td>
                       <td class="px-4 py-3">{{ room.host }}</td>
                       <td class="px-4 py-3 text-xs">
                         <span class="px-2 py-1 rounded bg-stone-600">{{ room.mode }}</span>
                       </td>
                       <td class="px-4 py-3">
                         <span :class="room.status === 'Full' ? 'text-red-400' : 'text-green-400'">{{ room.players }}</span>
                       </td>
                       <td class="px-4 py-3 text-right">
                          <button 
                            @click="joinRoom(room)"
                            :disabled="room.status === 'Full'"
                            :class="room.status === 'Full' ? 'bg-stone-600 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'"
                            class="px-3 py-1 text-xs text-white font-bold rounded border-b-2 border-black/30 active:border-b-0 active:translate-y-px"
                          >
                            JOIN
                          </button>
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

        <div class="bg-stone-800 border-4 border-stone-700 rounded-xl shadow-xl flex flex-col h-1/2 overflow-hidden">
           <div class="p-2 bg-stone-900 border-b border-stone-700">
              <h3 class="text-stone-400 text-xs font-bold uppercase tracking-wider">GLOBAL CHAT</h3>
           </div>

           <div ref="chatContainer" class="flex-grow overflow-y-auto custom-scrollbar p-4 space-y-2 bg-stone-900/30">
              <div v-for="msg in chatMessages" :key="msg.id" :class="['flex flex-col', msg.type === 'self' ? 'items-end' : 'items-start']">
                 <div :class="['max-w-[80%] px-3 py-2 rounded-lg text-sm', 
                    msg.type === 'system' ? 'bg-yellow-900/30 text-yellow-200 border border-yellow-800 w-full text-center' : 
                    msg.type === 'self' ? 'bg-green-700 text-white rounded-br-none' : 'bg-stone-700 text-stone-200 rounded-bl-none']">
                    <span v-if="msg.type !== 'self' && msg.type !== 'system'" class="block text-[10px] text-stone-400 font-bold mb-0.5">{{ msg.user }}</span>
                    {{ msg.text }}
                 </div>
              </div>
           </div>

           <div class="p-2 bg-stone-800 border-t border-stone-700 flex gap-2">
              <input 
                v-model="chatInput" 
                @keyup.enter="sendMessage"
                type="text" 
                placeholder="Type a message..." 
                class="flex-grow bg-stone-900 text-stone-200 px-3 py-2 rounded border border-stone-600 focus:outline-none focus:border-yellow-500 placeholder-stone-600"
              >
              <button 
                @click="sendMessage"
                class="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded font-bold transition-colors"
              >
                SEND
              </button>
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

/* Radio Button Selected State Logic (Without @apply) */
input[type="radio"]:checked + div {
  border-color: #eab308; /* yellow-500 */
  background-color: #57534e; /* stone-600 */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.animate-spin-slow {
  animation: spin 3s linear infinite;
}

/* Fade Modal */
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

/* Notification Slide */
.slide-down-enter-active { transition: all 0.4s ease-out; }
.slide-down-leave-active { transition: all 0.3s ease-in; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -5rem; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; top: 1.25rem; }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #57534e; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #78716c; }
</style>