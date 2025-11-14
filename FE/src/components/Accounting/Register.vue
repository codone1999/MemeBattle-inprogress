<script setup>
import { ref, computed, watch } from 'vue';
import { fetchApi } from '@/utils/fetchUtils'; // <-- ปรับ path ให้ถูกต้อง

// --- 1. Form State ---
const email = ref('');
const username = ref('');
const displayName = ref('');
const password = ref('');
const confirmPassword = ref('');

// --- 2. UI State (Notification) ---
const isLoading = ref(false);
const notification = ref(null); // { type: 'success' | 'error', message: '...' }
let notificationTimer = null; // สำหรับ clearTimeout

// --- 3. Field Validation State ---
const emailError = ref(null);
const usernameError = ref(null);
const displayNameError = ref(null);
const passwordError = ref(null);
const confirmPasswordError = ref(null);

const emailTouched = ref(false);
const usernameTouched = ref(false);
const displayNameTouched = ref(false);
const passwordTouched = ref(false);
const confirmPasswordTouched = ref(false);

// --- 4. Password Strength & Requirements ---
// (ส่วนนี้เหมือนเดิมทุกประการ)
const hasMinLength = computed(() => password.value.length >= 8);
const hasUppercase = computed(() => /[A-Z]/.test(password.value));
const hasLowercase = computed(() => /[a-z]/.test(password.value));
const hasNumber = computed(() => /[0-9]/.test(password.value));
const hasSpecialChar = computed(() => /[!@#$%^&*]/.test(password.value));
const allPasswordReqsMet = computed(() => 
  hasMinLength.value && 
  hasUppercase.value && 
  hasLowercase.value && 
  hasNumber.value && 
  hasSpecialChar.value
);

const passwordStrength = computed(() => {
  const len = password.value.length;
  if (len === 0) {
    return { level: 'none', width: '0%', color: 'bg-slate-700', text: '' };
  }
  if (len < 8) {
    return { level: 'invalid', width: '10%', color: 'bg-red-600', text: 'Too Short' };
  }
  if (len < 12) {
    return { level: 'weak', width: '33%', color: 'bg-red-500', text: 'Weak' };
  }
  if (len < 14) {
    return { level: 'medium', width: '66%', color: 'bg-yellow-500', text: 'Medium' };
  }
  return { level: 'strong', width: '100%', color: 'bg-green-500', text: 'Strong' };
});

// --- 5. Validation Logic ---
// (ส่วนนี้เหมือนเดิมทุกประการ)
const validateEmail = () => {
  emailTouched.value = true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) emailError.value = 'Email is required.';
  else if (!emailRegex.test(email.value)) emailError.value = 'Must be a valid email address.';
  else emailError.value = null;
};
const validateUsername = () => {
  usernameTouched.value = true;
  if (!username.value) usernameError.value = 'Username is required.';
  else if (username.value.length < 3) usernameError.value = 'Username must be at least 3 characters.';
  else usernameError.value = null;
};
const validateDisplayName = () => {
  displayNameTouched.value = true;
  if (!displayName.value) displayNameError.value = 'Display Name is required.';
  else displayNameError.value = null;
};
const validatePassword = () => {
  passwordTouched.value = true;
  if (!allPasswordReqsMet.value) passwordError.value = 'Password does not meet all requirements.';
  else passwordError.value = null;
};
const validateConfirmPassword = () => {
  confirmPasswordTouched.value = true;
  if (!confirmPassword.value) confirmPasswordError.value = 'Please confirm your password.';
  else if (password.value !== confirmPassword.value) confirmPasswordError.value = 'Passwords do not match.';
  else confirmPasswordError.value = null;
};

// --- 6. Real-time Validation Triggers ---
// (ส่วนนี้เหมือนเดิมทุกประการ)
const handlePasswordInput = () => {
  if (passwordTouched.value) validatePassword();
  if (confirmPasswordTouched.value) validateConfirmPassword();
};
const handleConfirmPasswordInput = () => {
  if (confirmPasswordTouched.value) validateConfirmPassword();
};
watch(password, () => {
  if (confirmPasswordTouched.value) validateConfirmPassword();
});


// --- 7. Notification Helper ---
const showNotification = (type, message, duration = 3000) => {
  // เคลียร์ timer เก่า (ถ้ามี)
  if (notificationTimer) clearTimeout(notificationTimer);

  notification.value = { type, message };

  // ตั้ง timer ใหม่เพื่อซ่อน
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};


// --- 8. Submit Handler ---
const handleRegister = async () => {
  isLoading.value = true;
  notification.value = null; // ปิด notification เก่า (ถ้ามี)

  validateEmail();
  validateUsername();
  validateDisplayName();
  validatePassword();
  validateConfirmPassword();

  if (emailError.value || usernameError.value || displayNameError.value || passwordError.value || confirmPasswordError.value) {
    isLoading.value = false;
    showNotification('error', 'Please correct the errors in the form.'); // <-- ใช้ showNotification
    return;
  }

  const payload = {
    email: email.value,
    username: username.value,
    password: password.value,
    displayName: displayName.value,
  };

  try {
    const data = await fetchApi('/auth/register', {
      method: 'POST',
      body: payload,
    });

    if (data.success) {
      showNotification('success', data.message || 'Registration successful! Please check your email to verify.'); // <-- ใช้ showNotification
      // ล้างฟอร์ม
      email.value = '';
      username.value = '';
      displayName.value = '';
      password.value = '';
      confirmPassword.value = '';
      // รีเซ็ต touched state
      emailTouched.value = false;
      usernameTouched.value = false;
      displayNameTouched.value = false;
      passwordTouched.value = false;
      confirmPasswordTouched.value = false;
    } else {
      showNotification('error', data.message || 'An unknown error occurred.'); // <-- ใช้ showNotification
    }
  } catch (err) {
    showNotification('error', err.message); // <-- ใช้ showNotification
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
        notification.type === 'success' ? 'bg-green-600 border border-green-500' : 'bg-red-600 border border-red-500'
      ]"
    >
      <div class="flex items-center">
        <svg v-if="notification.type === 'success'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-if="notification.type === 'error'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
        <span class="text-white text-sm font-medium">{{ notification.message }}</span>
        <button @click="notification = null" class="ml-auto -mr-1 -mt-1 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition-colors">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>

  <div id="register-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      <div class="bg-slate-900 bg-opacity-80 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl shadow-xl shadow-cyan-900/10 w-full max-w-md">
        
        <h2 class="text-3xl font-bold text-slate-100 text-center mb-1 tracking-tight">
          Join the Arena
        </h2>
        <p class="text-center text-slate-400 mb-6">Create your account</p>

        <form @submit.prevent="handleRegister" class="space-y-4">
          
          <div>
            <label for="email" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
              Email
            </label>
            <input
              type="email"
              id="email"
              v-model="email"
              @blur="validateEmail"
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                emailError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500',
                emailTouched && !emailError ? 'border-green-500 focus:ring-green-500' : ''
              ]"
              placeholder="you@example.com"
            />
            <Transition name="field-error">
              <div v-if="emailError" class="text-red-400 text-xs mt-1.5 px-1">{{ emailError }}</div>
            </Transition>
          </div>

          <div>
            <label for="username" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
              Username
            </label>
            <input
              type="text"
              id="username"
              v-model="username"
              @blur="validateUsername"
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                usernameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500',
                usernameTouched && !usernameError ? 'border-green-500 focus:ring-green-500' : ''
              ]"
              placeholder="your_username"
            />
            <Transition name="field-error">
              <div v-if="usernameError" class="text-red-400 text-xs mt-1.5 px-1">{{ usernameError }}</div>
            </Transition>
          </div>

          <div>
            <label for="displayName" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              id="displayName"
              v-model="displayName"
              @blur="validateDisplayName"
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                displayNameError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500',
                displayNameTouched && !displayNameError ? 'border-green-500 focus:ring-green-500' : ''
              ]"
              placeholder="In-Game Name"
            />
            <Transition name="field-error">
              <div v-if="displayNameError" class="text-red-400 text-xs mt-1.5 px-1">{{ displayNameError }}</div>
            </Transition>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
              Password
            </label>
            <input
              type="password"
              id="password"
              v-model="password"
              @blur="validatePassword"
              @input="handlePasswordInput"
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                passwordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500',
                passwordTouched && !passwordError ? 'border-green-500 focus:ring-green-500' : ''
              ]"
              placeholder="••••••••"
            />

            <div class="flex items-center space-x-2 mt-2">
              <div class="flex-1 bg-slate-700 rounded-full h-1.5">
                <div 
                  class="h-1.5 rounded-full transition-all duration-500 ease-out" 
                  :class="passwordStrength.color"
                  :style="{ width: passwordStrength.width }">
                </div>
              </div>
              <span class="text-xs font-medium w-14 text-right" :class="{
                'text-red-500': passwordStrength.level === 'weak' || passwordStrength.level === 'invalid',
                'text-yellow-500': passwordStrength.level === 'medium',
                'text-green-500': passwordStrength.level === 'strong',
                'text-slate-400': passwordStrength.level === 'none'
              }">
                {{ passwordStrength.text }}
              </span>
            </div>

            <div v-if="password.length > 0 || passwordTouched" class="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 text-xs px-1">
              <span class="flex items-center transition-colors duration-300" :class="hasMinLength ? 'text-green-400' : 'text-slate-400'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                At least 8 characters
              </span>
              <span class="flex items-center transition-colors duration-300" :class="hasUppercase ? 'text-green-400' : 'text-slate-400'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                One uppercase letter
              </span>
              <span class="flex items-center transition-colors duration-300" :class="hasLowercase ? 'text-green-400' : 'text-slate-400'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                One lowercase letter
              </span>
              <span class="flex items-center transition-colors duration-300" :class="hasNumber ? 'text-green-400' : 'text-slate-400'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                One number
              </span>
              <span class="flex items-center transition-colors duration-300" :class="hasSpecialChar ? 'text-green-400' : 'text-slate-400'">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                One special (!@#$%)
              </span>
            </div>
            
            <Transition name="field-error">
              <div v-if="passwordError" class="text-red-400 text-xs mt-1.5 px-1">{{ passwordError }}</div>
            </Transition>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-semibold text-slate-400 mb-1 tracking-wide">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              v-model="confirmPassword"
              @blur="validateConfirmPassword"
              @input="handleConfirmPasswordInput"
              :class="[
                'w-full p-3 bg-slate-800 border rounded-md text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300',
                confirmPasswordError ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 focus:ring-cyan-500 focus:border-cyan-500',
                confirmPasswordTouched && !confirmPasswordError && confirmPassword.length > 0 ? 'border-green-500 focus:ring-green-500' : ''
              ]"
              placeholder="••••••••"
            />
            <Transition name="field-error">
              <div v-if="confirmPasswordError" class="text-red-400 text-xs mt-1.5 px-1">{{ confirmPasswordError }}</div>
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
              <span v-else class="tracking-wider">REGISTER</span>
            </button>
          </div>
        </form>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Background Gradient */
#register-bg {
  background-color: #0F172A; /* slate-950 */
  background-image: radial-gradient(ellipse at center, hsl(220, 40%, 15%) 0%, #0F172A 70%);
}

/* Card fade-in and slide-up animation on page load */
.fade-card-enter-active {
  transition: all 0.5s ease-out;
}
.fade-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* --- NEW: Popup Slide-Down Animation --- */
.slide-down-enter-active {
  transition: all 0.4s ease-out;
}

.slide-down-leave-active {
  transition: all 0.3s ease-in;
}

/* เราจะ animate 'top' แทน 'transform: translateY'
  - top-5 ของ Tailwind คือ top: 1.25rem (นี่คือตำแหน่งสุดท้าย)
  - เราจะเริ่มจาก top: -5rem (หรือค่าลบอื่นๆ)
*/
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  top: -5rem; /* <-- เริ่มจากข้างบน (นอกจอ) */
}

.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  top: 1.25rem; /* <-- เลื่อนลงมาที่ 1.25rem (เท่ากับ top-5) */
}


/* Field-level error animation */
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