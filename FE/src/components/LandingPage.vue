<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToLogin = () => {
  router.push('/signin');
};

const openSettings = () => {
  alert('Settings panel is not implemented yet.');
};

const openCredits = () => {
  router.push('/credits');
};

// ฟังก์ชันนี้ยังคงอยู่ เพื่อใช้กับปุ่มใหม่
const exitGame = () => {
  window.close();
};
</script>

<template>
  <div id="landing-bg" class="min-h-screen flex flex-col items-center justify-start p-4 md:p-8 overflow-hidden relative font-sans-custom">
    
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
            @click="goToLogin" 
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

      <div class="lg:col-span-1 flex items-center justify-center">
        </div>

      <Transition name="fade-in-right-menu" appear>
        <div class="flex flex-col space-y-4 lg:col-span-1">
          
          <button 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-700 hover:bg-stone-600 text-yellow-200 shadow-stone-900/40 focus:ring-stone-500 opacity-60 cursor-not-allowed"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v-6h-2v6zm0-8h2V7h-2v2z"/></svg> ABOUT
          </button>
          <button 
            class="relative flex items-center justify-start w-full font-bold text-xl uppercase py-4 px-6 rounded-md transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-offset-4 focus:ring-offset-stone-900 hover:-translate-y-1 hover:shadow-xl tracking-wide drop-shadow-lg shadow-black/50 border-b-4 border-r-4 border-black/30 shadow-lg shadow-black/40 active:translate-y-0 active:border-b-2 active:border-r-2 active:shadow-md active:shadow-black/50 bg-stone-700 hover:bg-stone-600 text-yellow-200 shadow-stone-900/40 focus:ring-stone-500 opacity-60 cursor-not-allowed"
          >
            <svg class="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M22 8H2V6h20v2zm-4 3H6v2h12v-2zm2 5H4v2h16v-2z"/></svg> LEVELS
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
          @click="exitGame"
          class="flex items-center justify-center bg-red-700 hover:bg-red-600 text-yellow-100 font-bold text-lg uppercase py-3 px-6 rounded-md shadow-lg shadow-red-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-red-500 border-b-4 border-r-4 border-red-900 active:translate-y-px active:border-b-2 active:border-r-2"
        >
          EXIT
          <svg class="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
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

/* Background */
#landing-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

/* Animations (Main Title, Game Title, Left/Right Menus) */
.fade-in-main-title-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.2s;
}
.fade-in-main-title-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}
.fade-in-main-title-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.fade-in-game-title-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.4s;
}
.fade-in-game-title-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}
.fade-in-game-title-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.fade-in-left-menu-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.6s;
}
.fade-in-left-menu-enter-from {
  opacity: 0;
  transform: translateX(-50px);
}
.fade-in-left-menu-enter-to {
  opacity: 1;
  transform: translateX(0);
}

.fade-in-right-menu-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 0.8s;
}
.fade-in-right-menu-enter-from {
  opacity: 0;
  transform: translateX(50px);
}
.fade-in-right-menu-enter-to {
  opacity: 1;
  transform: translateX(0);
}

/* Animation ใหม่สำหรับปุ่ม EXIT ขวาล่าง */
.fade-in-bottom-right-enter-active {
  transition: all 0.7s cubic-bezier(0.25, 0.8, 0.25, 1) 1s;
}
.fade-in-bottom-right-enter-from {
  opacity: 0;
  transform: translate(50px, 50px);
}
.fade-in-bottom-right-enter-to {
  opacity: 1;
  transform: translate(0, 0);
}
</style>