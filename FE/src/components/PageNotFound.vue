<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToMainMenu = () => {
  router.push('/');
};
</script>

<template>
  <div id="notfound-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      
      <div class="bg-stone-800 bg-opacity-80 backdrop-blur-sm border border-stone-700 p-12 rounded-2xl shadow-2xl shadow-stone-900/50 w-full max-w-md text-center">

        <h1 class="text-8xl md:text-9xl font-bold text-red-600 drop-shadow-lg font-['Creepster']">
          404
        </h1>
        
        <h2 class="text-3xl font-bold text-yellow-100 mt-4">
          Page Not Found
        </h2>
        
        <p class="text-stone-300 mt-4 mb-10">
          It seems you've wandered off the game board. Let's get you back to the main menu.
        </p>

        <button
          @click="goToMainMenu"
          type="button"
          class="w-full bg-green-700 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-300 ease-in-out 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-green-500
                 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-700/40"
        >
          GO TO MAIN MENU
        </button>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
#notfound-bg {
  background-color: hsl(25, 30%, 20%); /* Dark brown */
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
</style>