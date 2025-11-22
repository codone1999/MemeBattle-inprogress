<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils'; 

const router = useRouter();

// --- State ---
const isLoggedIn = ref(false);
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);

// --- Notification ---
const notification = ref(null); 
let notificationTimer = null;

// --- Friend List ---
const showFriendList = ref(false);
const friendList = ref([
  { id: 1, name: "DogeMaster", status: "online", avatar: "🐶" },
  { id: 2, name: "PepeSad", status: "in-match", avatar: "🐸" },
  { id: 3, name: "CatVibing", status: "afk", avatar: "🐱" },
  { id: 4, name: "RickRoller", status: "offline", avatar: "🕺" },
  { id: 5, name: "Chad_Giga", status: "online", avatar: "🗿" },
]);

// --- Lifecycle ---
onMounted(() => {
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true';
});

// --- Helper Functions ---
const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

const getStatusColor = (status) => {
  switch (status) {
    case 'online': return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]';
    case 'afk': return 'bg-yellow-500';
    case 'in-match': return 'bg-red-500';
    default: return 'bg-stone-500';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'online': return 'Online';
    case 'afk': return 'Away';
    case 'in-match': return 'In Match';
    default: return 'Offline';
  }
};

// --- Navigation ---
const handlePlayClick = () => {
  if (isLoggedIn.value) router.push('/inventory');
  else router.push('/signin');
};

const goToLogin = () => {
  router.push('/signin');
};

const openSettings = () => router.push('/setting');
const openCredits = () => router.push('/credits');
const openTosPolicy = () => router.push('/tos-policy');
const openAbout = () => router.push('/about');
const openShop = () => router.push('/shop');

const toggleFriendList = () => {
  showFriendList.value = !showFriendList.value;
};

// --- Logout Logic ---
const handleLogoutClick = () => { showLogoutModal.value = true; };
const cancelLogout = () => { if (!isLoggingOut.value) showLogoutModal.value = false; };
const confirmLogout = async () => {
  isLoggingOut.value = true;
  setTimeout(async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
      showNotification('success', 'Logout successful!');
      localStorage.removeItem('isLoggedIn');
      isLoggedIn.value = false;
      showFriendList.value = false;
    } catch (error) {
      localStorage.removeItem('isLoggedIn');
      isLoggedIn.value = false;
    } finally {
      isLoggingOut.value = false;
      showLogoutModal.value = false;
    }
  }, 3000);
};

</script>

<template>
  <div id="landing-bg" class="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 overflow-hidden relative font-sans-custom">
    
    <Transition name="slide-down">
      <div v-if="notification" class="fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-lg shadow-xl max-w-sm w-[90%]" 
           :class="[notification.type === 'success' ? 'bg-green-600 border-green-500' : (notification.type === 'error' ? 'bg-red-600 border-red-500' : 'bg-yellow-600 border-yellow-500'), 'border']">
        <div class="flex items-center text-white font-bold">
          <span class="text-sm">{{ notification.message }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="slide-right">
        <div v-if="showFriendList" class="fixed inset-y-0 right-0 z-[150] w-80 bg-stone-900 border-l-4 border-yellow-900 shadow-2xl flex flex-col">
            
            <div class="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-800">
                <h3 class="text-yellow-100 font-bold text-xl font-['Creepster'] tracking-wide">FRIENDS</h3>
                <button @click="toggleFriendList" class="text-stone-400 hover:text-white transition-colors">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <div v-if="isLoggedIn" class="flex-grow flex flex-col overflow-hidden">
                <div class="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                    <div v-for="friend in friendList" :key="friend.id" class="flex items-center bg-stone-800 p-3 rounded-lg border border-stone-700 hover:border-yellow-600 transition-colors cursor-pointer group">
                        <div class="relative">
                            <div class="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center text-lg border-2 border-stone-600 group-hover:border-yellow-500 transition-colors">
                                {{ friend.avatar }}
                            </div>
                            <div :class="['absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-stone-800', getStatusColor(friend.status)]"></div>
                        </div>
                        <div class="ml-3 flex-grow">
                            <p class="text-yellow-100 font-bold text-sm">{{ friend.name }}</p>
                            <p class="text-xs text-stone-400 uppercase tracking-wider">{{ getStatusText(friend.status) }}</p>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-stone-700 bg-stone-800">
                    <button class="w-full py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded border border-stone-600 transition-colors text-sm font-bold flex items-center justify-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        ADD FRIEND
                    </button>
                </div>
            </div>

            <div v-else class="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div class="p-6 bg-stone-800 rounded-full border-2 border-stone-700 shadow-inner">
                    <svg class="w-16 h-16 text-stone-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                </div>
                <div>
                    <h4 class="text-yellow-100 text-xl font-bold mb-2">Connect with Friends</h4>
                    <p class="text-stone-400 text-sm">Login to see who's online, chat, and challenge your friends to a duel!</p>
                </div>
                <button 
                    @click="goToLogin"
                    class="w-full py-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-lg border-b-4 border-green-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
                >
                    LOGIN NOW
                </button>
            </div>

        </div>
    </Transition>
    
    <div class="absolute top-4 right-4 z-50 flex gap-3">
        <!-- <button 
            @click="toggleFriendList"
            class="p-2 bg-stone-800 hover:bg-stone-700 text-yellow-500 rounded-full border-2 border-yellow-900 shadow-lg transition-transform active:scale-95 relative group"
            title="Friends"
        >
            <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            
        </button> -->
        <button @click="toggleFriendList" class="flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-yellow-100 font-bold text-lg uppercase p-2 rounded-md shadow-lg shadow-stone-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-stone-500 border-b-4 border-r-4 border-stone-900 active:translate-y-px active:border-b-2 active:border-r-2" title="Friends">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span v-if="isLoggedIn" class="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full border-2 border-stone-900 animate-pulse"></span>
          </button>
    </div>

    <Transition name="fade-modal">
      <div v-if="showLogoutModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="bg-stone-800 border-4 border-yellow-900 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden transform transition-all">
          <div v-if="isLoggingOut" class="py-8 flex flex-col items-center">
            <svg class="animate-spin h-14 w-14 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-yellow-100 text-xl font-bold animate-pulse font-['Creepster'] tracking-widest">LOGGING OUT...</p>
          </div>
          <div v-else>
            <h3 class="text-3xl font-bold text-yellow-100 mb-4 font-['Creepster'] tracking-wide text-shadow">LOGOUT?</h3>
            <p class="text-stone-300 mb-8 text-lg">Are you sure you want to retreat from the battlefield?</p>
            <div class="flex gap-4 justify-center">
              <button @click="cancelLogout" class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">NO</button>
              <button @click="confirmLogout" class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">YES</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade-in-main-title" appear>
      <div class="relative z-10 my-10 md:my-16 flex justify-center items-center mt-12">
        <div class="relative p-6 md:p-8 border-4 border-yellow-900 rounded-lg shadow-xl shadow-stone-950/50 bg-stone-800 bg-opacity-70 text-center">
          <span class="text-4xl md:text-5xl text-yellow-100 uppercase tracking-widest font-['Creepster'] drop-shadow-lg shadow-black/70">
            MAIN MENU
          </span>
          <div class="absolute -inset-1 border-2 border-yellow-900 rounded-lg pointer-events-none transform -skew-x-6"></div>
          <div class="absolute -inset-1 border-2 border-yellow-700 rounded-lg pointer-events-none transform skew-x-6"></div>
        </div>
      </div>
    </Transition>

    <Transition name="fade-in-game-title" appear>
      <div class="relative z-10 w-full max-w-4xl text-center mb-8">
        <h1 class="text-6xl md:text-7xl text-yellow-100 tracking-wide uppercase font-['Creepster'] drop-shadow-lg shadow-black/70">
          MEME'S BLOOD
        </h1>
        <p class="text-xl md:text-2xl text-yellow-300 tracking-widest mt-2 font-['Press_Start_2P']">
          война(Voyna) OF MEME
        </p>
      </div>
    </Transition>

    <div class="relative z-10 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-7xl px-4 pb-12">
      <Transition name="fade-in-left-menu" appear>
        <div class="flex flex-col space-y-4 lg:col-span-1">
          <button @click="handlePlayClick" class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-green-700 hover:bg-green-600 text-white shadow-green-900/40 focus:ring-green-500">
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> PLAY
          </button>
          <button @click="openSettings" class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400">
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg> SETTINGS
          </button>
          <button @click="openCredits" class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400">
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg> CREDIT
          </button>
        </div>
      </Transition>

      <div class="lg:col-span-1 flex items-center justify-center"></div>

      <Transition name="fade-in-right-menu" appear>
        <div class="flex flex-col space-y-4 lg:col-span-1">
          <button @click="openAbout" class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400">
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm0-8h2V7h-2v2z"/></svg> ABOUT
          </button>
          <button @click="openTosPolicy" class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400">
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg> TERM OF SERVICE
          </button>
          <button @click="openShop" class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400">
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M20 7h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM10 4h4v3h-4V4zm10 15H4V9h16v10zm-9-8h2v-2h-2v2zm-4 0h2v-2H7v2zm8 0h2v-2h-2v2z"/></svg> SHOP
          </button>
        </div>
      </Transition>
    </div>

    <Transition name="fade-in-bottom-right" appear>
      <div class="absolute z-30 bottom-4 right-4 md:bottom-8 md:right-8">
        <button v-if="isLoggedIn" @click="handleLogoutClick" class="flex items-center justify-center bg-orange-700 hover:bg-orange-600 text-yellow-100 font-bold text-lg uppercase py-3 px-6 rounded-md shadow-lg shadow-orange-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-orange-500 border-b-4 border-r-4 border-orange-900 active:translate-y-px active:border-b-2 active:border-r-2">
          LOGOUT <svg class="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
        </button>
      </div>
    </Transition>

    <div class="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-stone-900 to-transparent pointer-events-none"></div>

  </div>
</template>

<style scoped>
.font-sans-custom {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}

#landing-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

/* Animations */
.fade-in-main-title-enter-active { transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.2s; }
.fade-in-main-title-enter-from { opacity: 0; transform: scale(0.8) translateY(-20px); }
.fade-in-main-title-enter-to { opacity: 1; transform: scale(1) translateY(0); }

.fade-in-game-title-enter-active { transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.4s; }
.fade-in-game-title-enter-from { opacity: 0; transform: translateY(-30px); }
.fade-in-game-title-enter-to { opacity: 1; transform: translateY(0); }

.fade-in-left-menu-enter-active { transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.6s; }
.fade-in-left-menu-enter-from { opacity: 0; transform: translateX(-50px); }
.fade-in-left-menu-enter-to { opacity: 1; transform: translateX(0); }

.fade-in-right-menu-enter-active { transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.8s; }
.fade-in-right-menu-enter-from { opacity: 0; transform: translateX(50px); }
.fade-in-right-menu-enter-to { opacity: 1; transform: translateX(0); }

.fade-in-bottom-right-enter-active { transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 1s; }
.fade-in-bottom-right-enter-from { opacity: 0; transform: translate(50px, 50px); }
.fade-in-bottom-right-enter-to { opacity: 1; transform: translate(0, 0); }

/* Notification Slide Down */
.slide-down-enter-active { transition: all 0.4s ease-out; }
.slide-down-leave-active { transition: all 0.3s ease-in; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -5rem; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; top: 1.25rem; }

/* Modal Fade */
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

/* [NEW] Slide Right (Friend List) */
.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.slide-right-enter-to, .slide-right-leave-from { transform: translateX(0); }

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #292524; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #44403c; border-radius: 3px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #57534e; }
</style>