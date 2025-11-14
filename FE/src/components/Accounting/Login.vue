<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
// ปรับ path ให้ถูกต้อง
import { fetchApi } from '@/utils/fetchUtils';

// --- 1. State ---
const emailOrUsername = ref('');
const password = ref('');

// --- 2. UI State ---
const isLoading = ref(false);
const notification = ref(null); // { type, message }
const fieldError = ref(null); // Error message ใต้ช่อง input
let notificationTimer = null;

// --- 3. Router ---
const router = useRouter();

// --- 4. Notification Helper ---
const showNotification = (type, message, duration = 5000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// --- 5. Submit Handler ---
const handleLogin = async () => {
  isLoading.value = true;
  notification.value = null;
  fieldError.value = null;

  // 1. สร้าง Payload (รองรับทั้ง email และ username ในช่องเดียว)
  const payload = { password: password.value };
  const input = emailOrUsername.value;
  
  if (input.includes('@')) {
    payload.email = input;
  } else {
    payload.username = input;
  }

  // 2. เรียก API
  try {
    const data = await fetchApi('/auth/login', {
      method: 'POST',
      body: payload,
    });

    if (data.success) {
      // 3.1 ✅ Success (สีเขียว)
      showNotification('success', data.message || 'Login successful! Redirecting...');
      
      // (อนาคต: คุณต้องบันทึก data.data.refreshToken ไว้ที่นี่)
      // localStorage.setItem('refreshToken', data.data.refreshToken);

      // Redirect ไปหน้า Landing Page ใน 3 วินาที
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
    
  } catch (err) {
    // 3.2 ❌ Handle Errors (จาก fetchUtils ที่อัปเกรดแล้ว)
    
    if (err.status === 403) {
      // 3.3 ⚠️ Not Verified (สีเหลือง)
      showNotification('warning', err.message || 'Please verify your email before logging in.');
    } else if (err.status === 401) {
      // 3.4 ⛔ Invalid Credentials (สีแดง)
      showNotification('error', err.message || 'Invalid credentials.');
      fieldError.value = 'Invalid email/username or password.';
    } else {
      // 3.5 ⛔ Other Errors (สีแดง)
      showNotification('error', err.message || 'An unknown error occurred.');
    }
    
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <Transition name="slide-down">
    <div 
      v-if="notification"
      :class="[
        'fixed top-5 left-1/2 -translate-x-1/2 z-50 p-4 rounded-lg shadow-xl max-w-sm w-[90%]',
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
        <button @click="notification = null" class="ml-auto -mr-1 -mt-1 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  </Transition>

  <div id="login-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      <div class="bg-slate-900 bg-opacity-80 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl shadow-xl shadow-cyan-900/10 w-full max-w-md">
        
        <h2 class="text-3xl font-bold text-slate-100 text-center mb-1 tracking-tight">
          Welcome Back
        </h2>
        <p class="text-center text-slate-400 mb-6">Sign in to your account</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          
          <div>
            <label for="emailOrUsername" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
              Email or Username
            </label>
            <input
              type="text"
              id="emailOrUsername"
              v-model="emailOrUsername"
              required
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                fieldError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500'
              ]"
              placeholder="you@example.com or your_username"
            />
          </div>

          <div>
            <div class="flex justify-between items-baseline">
              <label for="password" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
                Password
              </label>
              <a href="#" class="text-xs font-medium text-cyan-500 hover:text-cyan-400 transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              id="password"
              v-model="password"
              required
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                fieldError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500'
              ]"
              placeholder="••••••••"
            />
            <Transition name="field-error">
              <div v-if="fieldError" class="text-red-400 text-xs mt-1.5 px-1">{{ fieldError }}</div>
            </Transition>
          </div>

          <div class="pt-2">
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 px-4 rounded-md transition-all duration-300 ease-in-out 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500
                     hover:-translate-y-0.5 hover:shadow-lg hover:shadow-cyan-500/40
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none
                     flex items-center justify-center"
            >
              <span v-if="isLoading">
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              <span v-else class="tracking-wider">SIGN IN</span>
            </button>
          </div>
        </form>

        <div class="text-center mt-6">
          <p class="text-sm text-slate-400">
            Don't have an account? 
            <router-link to="/signup" class="font-medium text-cyan-500 hover:text-cyan-400 transition-colors">
              Register now
            </router-link>
          </p>
        </div>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Background */
#login-bg {
  background-color: #0F172A; /* slate-950 */
  background-image: radial-gradient(ellipse at center, hsl(220, 40%, 15%) 0%, #0F172A 70%);
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
  top: 1.25rem; /* (top-5) */
}

/* Field-level error */
.field-error-enter-active,
.field-error-leave-active {
  transition: all 0.2s ease-out;
}
.field-error-enter-from,
.field-error-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>