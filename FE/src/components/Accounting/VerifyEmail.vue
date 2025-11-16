<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
// [BUG FIX] แก้ไข Path 
import { fetchApi } from '@/utils/fetchUtils.js';

// --- 1. State ---
const verificationStatus = ref('verifying');
const notification = ref(null); 
const countdown = ref(3);

// --- 2. Router & Route ---
const route = useRoute(); 
const router = useRouter(); 

let notificationTimer = null;
let redirectTimer = null;

// --- 3. Notification Helper ---
const showNotification = (type, message, duration = 5000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// --- 4. Redirect Logic ---
const startRedirect = (path) => {
  countdown.value = 3; 
  redirectTimer = setInterval(() => {
    countdown.value--;
    if (countdown.value === 0) {
      clearInterval(redirectTimer);
      router.push(path);
    }
  }, 1000); 
};

// --- 5. Main Logic (เมื่อหน้าโหลด) ---
onMounted(() => {
  const token = route.query.token;

  setTimeout(async () => {
    if (!token) {
      verificationStatus.value = 'error';
      showNotification('error', 'Invalid or missing verification token.');
      startRedirect('/signup'); 
      return;
    }

    try {
      await fetchApi(`/auth/verify-email?token=${token}`, {
        method: 'GET',
      });

      verificationStatus.value = 'success';
      showNotification('success', 'Email verified successfully! Redirecting...');
      // Path นี้ถูกต้อง (/signin)
      startRedirect('/signin'); 

    } catch (error) {
      verificationStatus.value = 'error';
      showNotification('error', error.message || 'Verification failed. Please try again.');
      startRedirect('/signup');
    }

  }, 3000);
});
</script>

<template>
  <Transition name="slide-down">
    <div 
      v-if="notification"
      :class="[
        'fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-xl max-w-sm w-[90%]',
        notification.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
      ]"
    >
      <div class="flex items-center">
        <svg v-if="notification.type === 'success'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <svg v-if="notification.type === 'error'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
        <span class="text-white text-sm font-medium">{{ notification.message }}</span>
        <button @click="notification = null" class="ml-auto -mr-1 -mt-1 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  </Transition>

  <div id="verify-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      
      <div class="bg-stone-800 bg-opacity-80 backdrop-blur-sm border border-stone-700 p-12 rounded-2xl shadow-2xl shadow-stone-900/50 w-full max-w-md text-center">

        <div v-if="verificationStatus === 'verifying'">
          <svg class="animate-spin h-12 w-12 text-yellow-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <h2 class="text-2xl font-bold text-yellow-100 mt-6">
            Verifying Email...
          </h2>
          <p class="text-stone-300 mt-2">Please wait a moment.</p>
        </div>

        <div v-if="verificationStatus === 'success'">
          <svg class="h-16 w-16 text-green-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 class="text-2xl font-bold text-green-400 mt-6">
            Verification Successful!
          </h2>
          <p class="text-stone-300 mt-2">
            Redirecting to Sign In in <span class="text-yellow-100 font-medium">{{ countdown }}</span>...
          </p>
        </div>

        <div v-if="verificationStatus === 'error'">
          <svg class="h-16 w-16 text-red-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15h.01" />
          </svg>
          <h2 class="text-2xl font-bold text-red-400 mt-6">
            Verification Failed
          </h2>
          <p class="text-stone-300 mt-2">
            Redirecting to Register in <span class="text-yellow-100 font-medium">{{ countdown }}</span>...
          </p>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
#verify-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

/* Card fade-in */
.fade-card-enter-active {
  transition: all 0.5s ease-out;
}
.fade-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Popup Slide-Down */
.slide-down-enter-active {
  transition: all 0.4s ease-out;
}
.slide-down-leave-active {
  transition: all 0.3s ease-in;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  top: -5rem; 
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  top: 1.25rem;
}
</style>