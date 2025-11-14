<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
  // ไปยังหน้า Register ตามที่คุณขอ
  router.push('/signin');
};

const openSettings = () => {
  // ฟังก์ชันชั่วคราวสำหรับปุ่ม Settings
  alert('Settings panel is not implemented yet.');
};

const exitGame = () => {
  window.close();
};
</script>

<template>
  <div id="landing-bg" class="min-h-screen flex items-center justify-center p-4 overflow-hidden">
    
    <Transition name="fade-menu" appear>
      <div class="flex flex-col items-center text-center">
        
        <h1 class="text-6xl md:text-7xl font-extrabold text-slate-100 tracking-wide">
          MEME'S BLOOD
        </h1>
        
        <p class="text-lg md:text-xl text-cyan-400 font-medium tracking-widest mb-16 mt-2">
          война(Voyna) OF MEME
        </p>

        <div class="flex flex-col space-y-5 w-full max-w-xs">
          
          <button
            @click="goToLogin"
            class="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-lg py-4 px-4 rounded-lg transition-all duration-300 ease-in-out 
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500
                   hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/40
                   tracking-widest shadow-md"
          >
            PLAY
          </button>

          <button
            @click="openSettings"
            class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-3 px-4 rounded-lg 
                   transition-all duration-300 ease-in-out
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-600
                   hover:shadow-md hover:shadow-slate-800/50
                   tracking-wider"
          >
            SETTINGS
          </button>

          <button
            @click="exitGame"
            class="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-slate-300 font-medium py-3 px-4 rounded-lg 
                   transition-all duration-300 ease-in-out
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-slate-600
                   hover:shadow-md hover:shadow-slate-800/50
                   tracking-wider"
          >
            EXIT
          </button>
        </div>
        
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 3. Background (ควรจะเหมือนกับใน Register.vue) */
#landing-bg {
  background-color: #0F172A; /* slate-950 */
  background-image: radial-gradient(ellipse at center, hsl(220, 40%, 15%) 0%, #0F172A 70%);
}

/* 4. Menu fade-in และ slide-up animation */
.fade-menu-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1); /* ease-out-quad */
}
.fade-menu-enter-from {
  opacity: 0;
  transform: translateY(30px);
}
.fade-menu-enter-to {
  opacity: 1;
  transform: translateY(0);
}
</style>