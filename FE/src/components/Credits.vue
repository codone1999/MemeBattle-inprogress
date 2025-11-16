<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToMainMenu = () => {
  router.push('/');
};
</script>

<template>
  <div id="credits-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      
      <div class="bg-stone-800 bg-opacity-80 backdrop-blur-sm border border-stone-700 p-8 md:p-12 rounded-2xl shadow-2xl shadow-stone-900/50 w-full max-w-lg text-center">

        <h1 class="text-5xl font-bold text-yellow-100 mb-8 font-['Creepster'] drop-shadow-lg">
          CREDITS
        </h1>

        <div class="text-left space-y-6 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
          
          <div>
            <h2 class="text-2xl font-bold text-yellow-500 mb-2">Game Director</h2>
            <p class="text-lg text-stone-200">Your Name Here</p>
          </div>

          <div>
            <h2 class="text-2xl font-bold text-yellow-500 mb-2">Lead Programmer</h2>
            <p class="text-lg text-stone-200">Your Name Here</p>
          </div>

          <div>
            <h2 class="text-2xl font-bold text-yellow-500 mb-2">Artwork & UI Design</h2>
            <p class="text-lg text-stone-300">Gemini</p>
            <p class="text-lg text-stone-300">Awesome Asset Pack</p>
          </div>

          <div>
            <h2 class="text-2xl font-bold text-yellow-500 mb-2">Special Thanks</h2>
            <p class="text-lg text-stone-300">Vue.js Team</p>
            <p class="text-lg text-stone-300">Tailwind CSS Team</p>
            <p class="text-lg text-stone-300">A Friend's Name</p>
          </div>
          
          </div>

        <button
          @click="goToMainMenu"
          type="button"
          class="w-full mt-10 bg-green-700 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-300 ease-in-out 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-green-500
                 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-700/40"
        >
          BACK TO MAIN MENU
        </button>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
#credits-bg {
  background-color: hsl(25, 30%, 20%); /* น้ำตาลเข้ม */
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

.fade-card-enter-active {
  transition: all 0.5s ease-out;
}
.fade-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 10px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(39, 39, 42, 0.5);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #eab308;
  border-radius: 10px;
  border: 2px solid rgba(39, 39, 42, 0.5);
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: #facc15;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #eab308 rgba(39, 39, 42, 0.5);
}
</style>