<script setup>
import { onMounted, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();
const sentEmail = ref('');
const countdown = ref(5);

onMounted(() => {
  const stateEmail = history.state.email;

  if (!stateEmail) {
     sentEmail.value = 'your email';
  } else {
     sentEmail.value = stateEmail;
  }

  // นับถอยหลังกลับไปหน้า Login
  const timer = setInterval(() => {
    countdown.value--;
    if (countdown.value === 0) {
      clearInterval(timer);
      router.push('/signin');
    }
  }, 1000);
});

const goToLogin = () => {
  router.push('/signin');
};
</script>

<template>
  <div id="reset-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      
      <div class="bg-stone-800 bg-opacity-80 backdrop-blur-sm border border-stone-700 p-12 rounded-2xl shadow-2xl shadow-stone-900/50 w-full max-w-md text-center">

        <div class="mb-6 flex justify-center">
          <div class="p-4 bg-stone-700 rounded-full border-2 border-yellow-600">
            <svg class="w-12 h-12 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
          </div>
        </div>

        <h2 class="text-3xl font-bold text-yellow-100 mb-4 tracking-tight">
          Check Your Email
        </h2>
        
        <p class="text-stone-300 mb-6 leading-relaxed">
          We have sent a password reset link to <br>
          <span class="font-bold text-yellow-500">{{ sentEmail }}</span>
        </p>
        
        <p class="text-stone-400 text-sm mb-8">
          Please check your inbox (and spam folder).
        </p>

        <button
          @click="goToLogin"
          class="w-full bg-stone-600 hover:bg-stone-500 text-yellow-100 font-bold py-3 px-4 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-stone-400"
        >
          Back to Sign In ({{ countdown }})
        </button>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* [THEME] Background Style */
#reset-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

.fade-card-enter-active { transition: all 0.5s ease-out; }
.fade-card-enter-from { opacity: 0; transform: translateY(20px); }
</style>