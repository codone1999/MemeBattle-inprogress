<script setup>
// --- ไม่มีการเปลี่ยนแปลงในส่วนของ SCRIPT ---
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import mainMenuBg from '../../assets/Picture/Bg/mainmenu_bg.jpg';
import setting from './setting.vue';
import hoverSoundFile from '/sounds/se/hover.mp3';

const router = useRouter();
const currentPage = ref('MainMenu');
const seVolume = ref(100);
const masterVolume = ref(100);
const isAudioUnlocked = ref(false);
const hoverSound = new Audio(hoverSoundFile);
const showLogin = () => { router.push({ name: 'Login' }); };
const showSettings = () => { currentPage.value = 'Settings'; };
const goToMainMenu = () => { currentPage.value = 'MainMenu'; };
const exitGame = () => { window.close(); };
hoverSound.volume = (seVolume.value / 100) * (masterVolume.value / 100);
const unlockAudio = () => { isAudioUnlocked.value = true; };
const playHoverSound = () => {
  if (!isAudioUnlocked.value) return;
  hoverSound.currentTime = 0;
  hoverSound.play().catch(error => console.error("Audio play error:", error));
};
watch([seVolume, masterVolume], () => { hoverSound.volume = (seVolume.value / 100) * (masterVolume.value / 100); });
const updateSeVolume = (newVolume) => { seVolume.value = newVolume; };
const updateMasterVolume = (newVolume) => { masterVolume.value = newVolume; };
</script>

<template>
  <div v-if="currentPage === 'MainMenu'" @click="unlockAudio"
    class="main-container relative flex flex-col items-center justify-center min-h-screen bg-black overflow-hidden font-serif"
    :style="{ '--bg-image': `url(${mainMenuBg})` }">
    
    <div class="absolute inset-0 bg-black/40 backdrop-brightness-75 board-vignette"></div>

    <main class="relative z-10 flex flex-col items-center text-center p-6 bg-parchment-frame animate-float">

      <h1 class="text-6xl md:text-7xl font-bold uppercase tracking-wide text-parchment-dark-text text-board-glow animate-fade-in-down">
        <span class="text-red-700">Voyna</span> Of <span class="text-indigo-700">Meme</span>
      </h1>
      <p class="mt-4 text-xl text-parchment-light-text animate-fade-in-down" style="animation-delay: 200ms;">
        A Tactical Meme Warfare Board Game
      </p>

      <div class="mt-12 flex w-64 flex-col gap-6">
        <button 
          @click="showLogin" @mouseenter="playHoverSound" 
          class="board-button" 
          style="animation-delay: 400ms;">
          Play
        </button>
        <button 
          @click="showSettings" @mouseenter="playHoverSound" 
          class="board-button" 
          style="animation-delay: 600ms;">
          Settings
        </button>
        <button 
          @click="exitGame" @mouseenter="playHoverSound" 
          class="board-button" 
          style="animation-delay: 800ms;">
          Exit
        </button>
      </div>

    </main>
  </div>

  <setting v-if="currentPage === 'Settings'" @goToMainMenu="goToMainMenu" :seVolume="seVolume"
    @updateSeVolume="updateSeVolume" :masterVolume="masterVolume" @updateMasterVolume="updateMasterVolume" />
</template>

<style>
/* --- 🌟 NEW ANIMATIONS & CHANGES START HERE 🌟 --- */

/* 1. Background Animation (Ken Burns Effect) */
.main-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: var(--bg-image);
  background-size: cover;
  background-position: center;
  animation: kenburns 30s ease-in-out infinite alternate;
}

@keyframes kenburns {
  from {
    transform: scale(1) translate(0, 0);
  }
  to {
    transform: scale(1.08) translate(2%, -1%);
  }
}

/* 2. Floating UI Animation */
.animate-float {
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

/* 3. Pulsing Title Glow Animation */
.text-board-glow {
  text-shadow: 
    -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
    0 0 15px rgba(255, 255, 255, 0.4),
    0 0 25px rgba(255, 255, 255, 0.2);
  /* เพิ่ม animation เข้าไปที่ glow เดิม */
  animation: pulse-glow 4s ease-in-out infinite alternate;
}

@keyframes pulse-glow {
  from {
    text-shadow: 
      -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
      0 0 15px rgba(255, 255, 255, 0.4),
      0 0 25px rgba(255, 255, 255, 0.2);
  }
  to {
    text-shadow: 
      -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000,
      0 0 25px rgba(255, 255, 255, 0.7),
      0 0 40px rgba(255, 255, 255, 0.4);
  }
}

/* --- PREVIOUS STYLES (UNCHANGED) --- */
:root {
  --parchment-bg: #EED7B8;
  --parchment-frame-border: #8B4513;
  --parchment-dark-text: #4A2C2A;
  --parchment-light-text: #8C593C;
  --board-button-bg: #8B4513;
  --board-button-hover-bg: #A0522D;
  --board-button-border: #D2B48C;
}

.bg-parchment-frame {
  background-color: var(--parchment-bg);
  border: 8px solid var(--parchment-frame-border);
  border-radius: 12px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 0, 0, 0.3);
  position: relative;
  padding: 40px;
}

.text-parchment-dark-text { color: var(--parchment-dark-text); }
.text-parchment-light-text { color: var(--parchment-light-text); }

.board-button {
  background-color: var(--board-button-bg);
  border: 3px solid var(--board-button-border);
  border-radius: 8px;
  padding: 12px 32px;
  font-size: 1.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.6);
  transform: translateY(0);
  transition: all 0.2s ease-out;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2);
  opacity: 0; 
  animation: fade-in-up 0.8s ease-out forwards;
}
.board-button:hover {
    background-color: var(--board-button-hover-bg);
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 10px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3);
    cursor: pointer;
}
.board-button:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(210, 180, 140, 0.7), 0 6px 10px rgba(0, 0, 0, 0.4);
}

.board-vignette { box-shadow: inset 0 0 100px rgba(0,0,0,0.8); }

@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
.animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
</style>