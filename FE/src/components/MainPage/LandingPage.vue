<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils'; 

const router = useRouter();

// --- State ---
const isLoggedIn = ref(false);
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);

// --- Notification State ---
const notification = ref(null); 
let notificationTimer = null;

// --- Lifecycle ---
onMounted(() => {
  // ตรวจสอบว่า User Login อยู่หรือไม่จาก localStorage
  isLoggedIn.value = localStorage.getItem('isLoggedIn') === 'true';
});

// --- Notification Helper ---
const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// --- Navigation Functions ---

// ฟังก์ชันปุ่ม PLAY (ตรวจสอบสถานะ Login)
const handlePlayClick = () => {
  if (isLoggedIn.value) {
    // ถ้า Login แล้ว -> ไปหน้า Inventory
    router.push('/inventory');
  } else {
    // ถ้ายังไม่ Login -> ไปหน้า Signin
    router.push('/signin');
  }
};

const openSettings = () => {
  router.push('/setting');
};

const openCredits = () => {
  router.push('/credits');
};

const openTosPolicy = () => {
  router.push('/tos-policy');
};

const openAbout = () => {
  router.push('/about');
};

// --- Logout Logic ---

// 1. เปิด Modal ยืนยัน
const handleLogoutClick = () => {
  showLogoutModal.value = true;
};

// 2. ยกเลิก (ปิด Modal)
const cancelLogout = () => {
  if (!isLoggingOut.value) {
    showLogoutModal.value = false;
  }
};

// 3. ยืนยันการ Logout
const confirmLogout = async () => {
  isLoggingOut.value = true; // เริ่ม Loading

  // จำลอง Delay 3 วินาทีเพื่อให้เห็น Loading
  setTimeout(async () => {
    try {
      // เรียก API Logout (เพื่อให้ Backend ล้าง Cookie)
      await fetchApi('/auth/logout', { method: 'POST' });
      
      showNotification('success', 'Logout successful! See you again.');
      
      // ล้างสถานะฝั่ง Client
      localStorage.removeItem('isLoggedIn');
      isLoggedIn.value = false;

    } catch (error) {
      console.error('Logout failed:', error);
      // กรณี API พัง ก็ยัง Force Logout ฝั่ง Client ได้ (เพื่อให้ User ไมติดค้าง)
      localStorage.removeItem('isLoggedIn');
      isLoggedIn.value = false;
      showNotification('error', error.message || 'Logout failed, but local session cleared.');
    } finally {
      // จบกระบวนการ ปิด Modal
      isLoggingOut.value = false;
      showLogoutModal.value = false;
    }
  }, 3000);
};

// --- Exit Logic ---
// const exitGame = () => {
//   // Browser ส่วนใหญ่ไม่อนุญาตให้สคริปต์ปิด Tab เองได้ เว้นแต่สคริปต์เป็นคนเปิด
//   if (confirm("Close the game tab?")) {
//     window.close();
//   }
// };
</script>

<template>
  <div id="landing-bg" class="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 overflow-hidden relative font-sans-custom">
    
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
      <div v-if="showLogoutModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        
        <div class="bg-stone-800 border-4 border-yellow-900 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden transform transition-all">
          
          <div v-if="isLoggingOut" class="py-8 flex flex-col items-center">
            <svg class="animate-spin h-14 w-14 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-yellow-100 text-xl font-bold animate-pulse font-['Creepster'] tracking-widest">LOGGING OUT...</p>
          </div>

          <div v-else>
            <h3 class="text-3xl font-bold text-yellow-100 mb-4 font-['Creepster'] tracking-wide text-shadow">LOGOUT?</h3>
            <p class="text-stone-300 mb-8 text-lg">Are you sure you want to retreat from the battlefield?</p>

            <div class="flex gap-4 justify-center">
              <button 
                @click="cancelLogout"
                class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                NO
              </button>
              <button 
                @click="confirmLogout"
                class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                YES
              </button>
            </div>
          </div>

          <div class="absolute top-2 left-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute top-2 right-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 left-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 right-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
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
          
          <button 
            @click="handlePlayClick" 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-green-700 hover:bg-green-600 text-white shadow-green-900/40 focus:ring-green-500"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> PLAY
          </button>
          
          <button 
            @click="openSettings" 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg> SETTINGS
          </button>
          
          <button 
            @click="openCredits" 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
            CREDIT
          </button>
        </div>
      </Transition>

      <div class="lg:col-span-1 flex items-center justify-center"></div>

      <Transition name="fade-in-right-menu" appear>
        <div class="flex flex-col space-y-4 lg:col-span-1">
          
          <button 
            @click="openAbout"
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 
                   bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm0-8h2V7h-2v2z"/></svg> ABOUT
          </button>
          
          <button 
            @click="openTosPolicy" 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 
                   bg-stone-600 hover:bg-stone-500 text-yellow-100 shadow-stone-900/40 focus:ring-stone-400"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            TERM OF SERVICE
          </button>

          <button 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-700 hover:bg-stone-600 text-yellow-200 shadow-stone-900/40 focus:ring-stone-500 opacity-60 cursor-not-allowed"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg> SHOP
          </button>
        </div>
      </Transition>

    </div>

    <Transition name="fade-in-bottom-right" appear>
      <div class="absolute z-30 bottom-4 right-4 md:bottom-8 md:right-8">
        
        <button 
          v-if="isLoggedIn"
          @click="handleLogoutClick"
          class="flex items-center justify-center bg-orange-700 hover:bg-orange-600 text-yellow-100 font-bold text-lg uppercase py-3 px-6 rounded-md shadow-lg shadow-orange-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-orange-500 border-b-4 border-r-4 border-orange-900 active:translate-y-px active:border-b-2 active:border-r-2"
        >
          LOGOUT
          <svg class="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
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
</style>