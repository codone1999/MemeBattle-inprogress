<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';

const router = useRouter();

// --- State: UI & Settings ---
const activeTab = ref('audio'); 
const isSaving = ref(false);
const isLoggedIn = ref(false);
const userProfile = ref(null);
const isLoadingProfile = ref(false);

// --- State: Modal & Notification ---
const showResetModal = ref(false);
const notification = ref(null);
let notificationTimer = null;

// --- Default Settings ---
const defaultSettings = {
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 100,
  quality: 'medium',
  fullscreen: false,
  autoEndTurn: true
};

// Load default initially
const settings = ref({ ...defaultSettings });

// --- Helper: Notification ---
const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// --- Lifecycle ---
onMounted(async () => {
  // 1. Load Settings from LocalStorage
  const savedSettings = localStorage.getItem('gameSettings');
  if (savedSettings) {
    try {
      const parsed = JSON.parse(savedSettings);
      // Merge with default to prevent missing keys
      settings.value = { ...defaultSettings, ...parsed };
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  // 2. Sync Fullscreen State
  settings.value.fullscreen = !!document.fullscreenElement;
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // 3. Check Login & Fetch Profile
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn.value) {
    isLoadingProfile.value = true;
    try {
      const res = await fetchApi('/auth/me');
      if (res.success) {
        userProfile.value = res.data.user;
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Optional: Handle token expiry here
    } finally {
      isLoadingProfile.value = false;
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
});

// --- Auto-Save Logic ---
watch(settings, (newSettings) => {
  localStorage.setItem('gameSettings', JSON.stringify(newSettings));
  // Trigger saving indicator briefly
  isSaving.value = true;
  setTimeout(() => isSaving.value = false, 500);
}, { deep: true });

// --- Functions ---

const changeTab = (tab) => {
  activeTab.value = tab;
};

// Fullscreen Toggle
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch((err) => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// Sync toggle button when user presses Esc
const handleFullscreenChange = () => {
  settings.value.fullscreen = !!document.fullscreenElement;
};

// --- Reset Logic (with Modal) ---
const handleResetClick = () => {
  showResetModal.value = true;
};

const cancelReset = () => {
  showResetModal.value = false;
};

const confirmReset = () => {
  // Exit fullscreen if active
  if (document.fullscreenElement) document.exitFullscreen();
  
  // Reset values
  settings.value = { ...defaultSettings };
  
  showResetModal.value = false;
  showNotification('success', 'Settings have been reset to default.');
};

// --- Navigation ---
const goToMainMenu = () => {
  router.push('/');
};

const goToLogin = () => {
  router.push('/signin');
};

// const handleLogout = async () => {
//     try {
//         await fetchApi('/auth/logout', { method: 'POST' });
//     } catch (e) { console.error(e); }
    
//     localStorage.removeItem('isLoggedIn');
//     isLoggedIn.value = false;
//     userProfile.value = null;
//     showNotification('success', 'Logged out successfully.');
// };
</script>

<template>
  <div id="settings-bg" class="min-h-screen flex items-center justify-center p-4 font-sans-custom">
    
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
        <div class="flex items-center">
          <svg v-if="notification.type === 'success'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-if="notification.type === 'error'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
          <svg v-if="notification.type === 'warning'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15h.01" /></svg>
          <span class="text-white text-sm font-medium">{{ notification.message }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade-modal">
      <div v-if="showResetModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="bg-stone-800 border-4 border-yellow-900 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden transform transition-all">
          
          <h3 class="text-3xl font-bold text-yellow-100 mb-4 font-['Creepster'] tracking-wide text-shadow">RESET SETTINGS?</h3>
          <p class="text-stone-300 mb-8 text-lg">This will revert all audio and graphics configurations. Are you sure?</p>

          <div class="flex gap-4 justify-center">
            <button 
              @click="cancelReset"
              class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
            >
              NO
            </button>
            <button 
              @click="confirmReset"
              class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
            >
              YES
            </button>
          </div>

          <div class="absolute top-2 left-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute top-2 right-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 left-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 right-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
        </div>
      </div>
    </Transition>

    <Transition name="fade-card" appear>
      <div class="w-full max-w-4xl bg-stone-800 border-4 border-stone-700 rounded-2xl shadow-2xl shadow-stone-950/50 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        <aside class="w-full md:w-1/4 bg-stone-900/80 border-r border-stone-700 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible">
          <h2 class="hidden md:block text-2xl font-bold text-yellow-100 mb-6 text-center font-['Creepster'] tracking-widest">
            CONFIG
          </h2>

          <button 
            @click="changeTab('audio')"
            :class="[
              'flex items-center px-4 py-3 rounded-lg font-bold transition-all duration-200 border-l-4',
              activeTab === 'audio' 
                ? 'bg-stone-800 text-yellow-400 border-yellow-500 shadow-md' 
                : 'border-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200'
            ]"
          >
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path></svg> Audio
          </button>

          <button 
            @click="changeTab('game')"
            :class="[
              'flex items-center px-4 py-3 rounded-lg font-bold transition-all duration-200 border-l-4',
              activeTab === 'game' 
                ? 'bg-stone-800 text-yellow-400 border-yellow-500 shadow-md' 
                : 'border-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200'
            ]"
          >
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg> Graphics
          </button>

          <button 
            @click="changeTab('account')"
            :class="[
              'flex items-center px-4 py-3 rounded-lg font-bold transition-all duration-200 border-l-4',
              activeTab === 'account' 
                ? 'bg-stone-800 text-yellow-400 border-yellow-500 shadow-md' 
                : 'border-transparent text-stone-400 hover:bg-stone-800 hover:text-stone-200'
            ]"
          >
            <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg> Account
          </button>
          
          <div class="hidden md:flex flex-grow"></div>
          
          <button 
            @click="goToMainMenu" 
            class="hidden md:flex items-center px-4 py-3 rounded-lg font-bold transition-all duration-200 border-l-4 bg-red-900/50 hover:bg-red-800/50 text-red-200 border-red-800 mt-auto"
          >
            <svg class="w-6 h-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Back
          </button>
        </aside>

        <main class="flex-grow p-6 md:p-10 bg-stone-800 relative custom-scrollbar overflow-y-auto">
          
          <div class="md:hidden flex justify-between items-center mb-6">
             <h2 class="text-2xl font-bold text-yellow-100 font-['Creepster']">SETTINGS</h2>
             <button @click="goToMainMenu" class="text-stone-400 hover:text-white">
               <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
             </button>
          </div>

          <div v-if="activeTab === 'audio'" class="space-y-8 animate-fade-in">
            <h3 class="text-2xl font-bold text-yellow-500 border-b border-stone-600 pb-2">Audio Settings</h3>
            <div class="setting-item">
              <div class="flex justify-between mb-2">
                <label class="text-stone-200 font-bold">Master Volume</label>
                <span class="text-yellow-400">{{ settings.masterVolume }}%</span>
              </div>
              <input type="range" v-model="settings.masterVolume" class="slider" min="0" max="100">
            </div>
            <div class="setting-item">
              <div class="flex justify-between mb-2">
                <label class="text-stone-300">Music</label>
                <span class="text-stone-400">{{ settings.musicVolume }}%</span>
              </div>
              <input type="range" v-model="settings.musicVolume" class="slider" min="0" max="100">
            </div>
            <div class="setting-item">
              <div class="flex justify-between mb-2">
                <label class="text-stone-300">Sound Effects</label>
                <span class="text-stone-400">{{ settings.sfxVolume }}%</span>
              </div>
              <input type="range" v-model="settings.sfxVolume" class="slider" min="0" max="100">
            </div>
          </div>

          <div v-if="activeTab === 'game'" class="space-y-8 animate-fade-in">
            <h3 class="text-2xl font-bold text-yellow-500 border-b border-stone-600 pb-2">Graphics & Game</h3>
            <div class="flex items-center justify-between">
              <label class="text-stone-200 font-bold">Graphics Quality</label>
              <select v-model="settings.quality" class="bg-stone-900 border border-stone-600 text-yellow-100 rounded p-2 focus:ring-2 focus:ring-yellow-500 outline-none">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-stone-200 font-bold">Fullscreen Mode</label>
              <button @click="toggleFullscreen" :class="settings.fullscreen ? 'bg-green-600' : 'bg-stone-600'" class="w-12 h-6 rounded-full p-1 transition-colors duration-300 relative">
                <div :class="settings.fullscreen ? 'translate-x-6' : 'translate-x-0'" class="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300"></div>
              </button>
            </div>
            <div class="flex items-center justify-between">
              <label class="text-stone-200 font-bold">Auto End Turn</label>
              <button @click="settings.autoEndTurn = !settings.autoEndTurn" :class="settings.autoEndTurn ? 'bg-green-600' : 'bg-stone-600'" class="w-12 h-6 rounded-full p-1 transition-colors duration-300 relative">
                <div :class="settings.autoEndTurn ? 'translate-x-6' : 'translate-x-0'" class="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300"></div>
              </button>
            </div>
          </div>

          <div v-if="activeTab === 'account'" class="space-y-8 animate-fade-in">
            <h3 class="text-2xl font-bold text-yellow-500 border-b border-stone-600 pb-2">Account</h3>
            
            <div v-if="isLoggedIn">
                <div v-if="isLoadingProfile" class="py-10 flex justify-center">
                    <svg class="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                </div>
                <div v-else class="space-y-4">
                    <div class="bg-stone-900 p-4 rounded border border-stone-600">
                        <p class="text-stone-400 text-xs uppercase font-bold">Display Name</p>
                        <p class="text-yellow-100 font-bold text-xl mt-1">{{ userProfile?.displayName || '-' }}</p>
                    </div>
                    <div class="bg-stone-900 p-4 rounded border border-stone-600">
                        <p class="text-stone-400 text-xs uppercase font-bold">Username</p>
                        <p class="text-yellow-100 font-mono mt-1">@{{ userProfile?.username || '-' }}</p>
                    </div>
                    <div class="bg-stone-900 p-4 rounded border border-stone-600">
                        <p class="text-stone-400 text-xs uppercase font-bold">Email</p>
                        <p class="text-stone-200 mt-1">{{ userProfile?.email || '-' }}</p>
                    </div>
                    <div class="pt-4">
                        <button @click="" class="w-full py-3 px-4 bg-yellow-700 hover:bg-yellow-600 text-white font-bold rounded border-b-4 border-yellow-900 active:border-b-0 active:translate-y-1 transition-all">
                            EDIT PROFILE
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="py-10 flex flex-col items-center justify-center space-y-6 text-center">
                <div class="p-4 bg-stone-700/50 rounded-full">
                    <svg class="w-16 h-16 text-stone-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </div>
                <div>
                    <p class="text-yellow-100 text-lg font-bold">Guest Account</p>
                    <p class="text-stone-400 text-sm mt-2 max-w-xs mx-auto">Login to save your progress, access inventory, and battle online.</p>
                </div>
                <button @click="goToLogin" class="py-3 px-8 bg-green-700 hover:bg-green-600 text-white font-bold rounded border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">
                    LOGIN / REGISTER
                </button>
            </div>
          </div>

          <div class="absolute bottom-0 left-0 w-full p-6 bg-stone-800/90 border-t border-stone-700 flex justify-between items-center">
             <button @click="handleResetClick" class="text-stone-400 hover:text-white text-sm underline transition-colors">
               Reset Default
             </button>

             <span v-if="isSaving" class="text-green-400 text-sm font-bold animate-pulse">
                Saving...
             </span>
             <!-- <span v-else class="text-stone-500 text-xs">
                Changes saved automatically
             </span> -->
          </div>

        </main>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Theme Background */
#settings-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

/* Custom Range Slider */
.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: #44403c; /* stone-700 */
  outline: none;
  transition: opacity .2s;
}
.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #eab308; /* yellow-500 */
  cursor: pointer;
  box-shadow: 0 0 5px rgba(0,0,0,0.5);
  border: 2px solid #fef08a; /* yellow-200 */
}
.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #eab308;
  cursor: pointer;
  border: 2px solid #fef08a;
}

/* Animations */
.fade-card-enter-active { transition: all 0.5s ease-out; }
.fade-card-enter-from { opacity: 0; transform: translateY(20px); }

.animate-fade-in { animation: fadeIn 0.4s ease-out; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateX(10px); }
  to { opacity: 1; transform: translateX(0); }
}

.slide-down-enter-active { transition: all 0.4s ease-out; }
.slide-down-leave-active { transition: all 0.3s ease-in; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -5rem; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; top: 1.25rem; }

.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #57534e; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #78716c; }
</style>