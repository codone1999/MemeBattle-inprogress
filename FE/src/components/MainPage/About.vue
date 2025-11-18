<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// --- State ---
const showTutorialModal = ref(false);
const currentStep = ref(0);

const tutorialSteps = [
  {
    title: "1. Assemble Your Deck",
    description: "Choose your favorite Meme characters and support cards. You need at least 15 cards to enter the battlefield.",
    icon: "🎴"
  },
  {
    title: "2. Turn-Based Combat",
    description: "Each turn, you draw cards and spend Energy to summon memes or cast spells. Manage your resources wisely!",
    icon: "⚔️"
  },
  {
    title: "3. Attack & Defend",
    description: "Target enemy units or go directly for their Life Points. Use Guard cards to protect your valuable memes.",
    icon: "🛡️"
  },
  {
    title: "4. Victory Condition",
    description: "Deplete the opponent's HP to zero to claim victory and earn rewards to unlock new memes!",
    icon: "🏆"
  }
];

// --- Functions ---
const goToMainMenu = () => {
  router.push('/');
};

const openTutorial = () => {
  currentStep.value = 0;
  showTutorialModal.value = true;
};

const closeTutorial = () => {
  showTutorialModal.value = false;
};

const nextStep = () => {
  if (currentStep.value < tutorialSteps.length - 1) {
    currentStep.value++;
  } else {
    closeTutorial();
  }
};

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
};
</script>

<template>
  <div id="about-bg" class="min-h-screen flex items-center justify-center p-4 font-sans-custom">
    
    <Transition name="fade-modal">
      <div v-if="showTutorialModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        
        <div class="bg-stone-800 border-4 border-yellow-900 p-6 md:p-10 rounded-2xl shadow-2xl max-w-lg w-full relative overflow-hidden flex flex-col min-h-[400px]">
          
          <button @click="closeTutorial" class="absolute top-4 right-4 text-stone-500 hover:text-red-500 transition-colors">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>

          <div class="w-full bg-stone-900 h-2 rounded-full mb-6 mt-2">
             <div 
               class="bg-yellow-500 h-2 rounded-full transition-all duration-300 ease-out"
               :style="{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }"
             ></div>
          </div>

          <div class="flex-grow flex flex-col items-center justify-center text-center space-y-6">
            <div class="text-8xl animate-bounce-slow">{{ tutorialSteps[currentStep].icon }}</div>
            
            <h3 class="text-3xl font-bold text-yellow-100 font-['Creepster'] tracking-wide text-shadow">
              {{ tutorialSteps[currentStep].title }}
            </h3>
            
            <p class="text-stone-300 text-lg leading-relaxed px-4">
              {{ tutorialSteps[currentStep].description }}
            </p>
          </div>

          <div class="flex justify-between items-center mt-8 pt-4 border-t border-stone-700">
            
            <button 
              @click="prevStep" 
              :disabled="currentStep === 0"
              :class="['flex items-center font-bold px-4 py-2 rounded transition-colors', currentStep === 0 ? 'text-stone-600 cursor-not-allowed' : 'text-stone-400 hover:text-white']"
            >
              <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              PREV
            </button>

            <span class="text-stone-500 text-sm font-mono">
              {{ currentStep + 1 }} / {{ tutorialSteps.length }}
            </span>

            <button 
              @click="nextStep"
              class="flex items-center font-bold px-6 py-2 rounded bg-yellow-700 hover:bg-yellow-600 text-stone-900 transition-all shadow-lg active:scale-95"
            >
              <span v-if="currentStep < tutorialSteps.length - 1">NEXT</span>
              <span v-else>FINISH</span>
              <svg v-if="currentStep < tutorialSteps.length - 1" class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              <svg v-else class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
            </button>

          </div>

          <div class="absolute top-2 left-2 w-3 h-3 bg-yellow-800 rounded-full opacity-50"></div>
          <div class="absolute top-2 right-2 w-3 h-3 bg-yellow-800 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 left-2 w-3 h-3 bg-yellow-800 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 right-2 w-3 h-3 bg-yellow-800 rounded-full opacity-50"></div>

        </div>
      </div>
    </Transition>

    <Transition name="fade-card" appear>
      <div class="w-full max-w-4xl bg-stone-800 border-4 border-stone-700 rounded-2xl shadow-2xl shadow-stone-950/50 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        <div class="w-full md:w-2/5 bg-stone-900 flex items-center justify-center p-8 border-b md:border-b-0 md:border-r border-stone-700 relative">
           <div class="text-center">
             <div class="w-40 h-40 bg-stone-800 rounded-full border-4 border-yellow-700 flex items-center justify-center mb-4 mx-auto shadow-xl">
               <span class="text-6xl">🦀</span>
             </div>
             <h1 class="text-4xl font-bold text-yellow-100 font-['Creepster'] tracking-widest drop-shadow-md">
               MEME'S<br>BLOOD
             </h1>
             <p class="text-stone-500 text-sm mt-2 font-mono">Version 1.0.0</p>
           </div>
           
           <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10 pointer-events-none"></div>
        </div>

        <div class="w-full md:w-3/5 p-8 md:p-12 flex flex-col relative">
          
          <h2 class="text-3xl font-bold text-yellow-500 mb-6 border-b border-stone-600 pb-2">ABOUT THE GAME</h2>
          
          <div class="space-y-4 text-stone-300 leading-relaxed flex-grow overflow-y-auto custom-scrollbar pr-2">
            <p>
              In a world where internet culture clashes, only the strongest memes survive. <strong class="text-yellow-200">Meme's Blood</strong> is a strategic card battler where you assemble a deck of legendary memes to duel for supremacy.
            </p>
            <p>
              Will you choose the path of the <em>Doge</em>, rely on the chaotic energy of <em>Pepe</em>, or harness the ancient power of the <em>Crab</em>?
            </p>
            <p>
              Build your deck, challenge your friends, and climb the ranks to become the ultimate Meme Lord.
            </p>
          </div>

          <div class="mt-8 flex flex-col sm:flex-row gap-4">
            
            <button 
              @click="openTutorial"
              class="flex-1 bg-blue-700 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-blue-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center"
            >
              <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
              HOW TO PLAY
            </button>

            <button 
              @click="goToMainMenu"
              class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center"
            >
              <svg class="w-6 h-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              BACK
            </button>

          </div>

        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Theme Background (เหมือนเดิม) */
#about-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

/* Animations */
.fade-card-enter-active { transition: all 0.5s ease-out; }
.fade-card-enter-from { opacity: 0; transform: translateY(20px); }

.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

.animate-bounce-slow {
  animation: bounce 2s infinite;
}

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #57534e; border-radius: 4px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #78716c; }
</style>