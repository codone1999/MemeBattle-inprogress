<script setup>
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

const showLogin = () => {
  router.push({ name: 'Login' });
};

const showSettings = () => {
  currentPage.value = 'Settings';
};

const goToMainMenu = () => {
  currentPage.value = 'MainMenu';
};

const exitGame = () => {
  window.close();
};

hoverSound.volume = (seVolume.value / 100) * (masterVolume.value / 100);

const unlockAudio = () => {
  isAudioUnlocked.value = true;
};

const playHoverSound = () => {
  if (!isAudioUnlocked.value) return;
  hoverSound.currentTime = 0;
  hoverSound.play().catch(error => console.error("Audio play error:", error));
};

watch([seVolume, masterVolume], () => {
  hoverSound.volume = (seVolume.value / 100) * (masterVolume.value / 100);
});

const updateSeVolume = (newVolume) => {
  seVolume.value = newVolume;
};

const updateMasterVolume = (newVolume) => {
  masterVolume.value = newVolume;
};
</script>

<template>
  <div @click="unlockAudio" v-if="currentPage === 'MainMenu'"
    class="flex flex-col items-center justify-center min-w-screen min-h-screen bg-cover bg-center"
    :style="{ backgroundImage: `url(${mainMenuBg})` }">
    <h1 class="text-4xl font-bold mb-8 text-center text-white">
      война(Voyna) Of Meme
    </h1>
    <div class="flex flex-col gap-5 text-center">
      <button @click="showLogin" @mouseenter="playHoverSound"
        class="px-8 py-4 text-xl rounded-lg cursor-pointer bg-gray-700 text-white hover:bg-gray-500 transition duration-300">
        Play
      </button>
      <button @click="showSettings" @mouseenter="playHoverSound"
        class="px-8 py-4 text-xl rounded-lg cursor-pointer bg-gray-700 text-white hover:bg-gray-500 transition duration-300">
        Settings
      </button>
      <button @click="exitGame" @mouseenter="playHoverSound"
        class="px-8 py-4 text-xl rounded-lg cursor-pointer bg-gray-700 text-white hover:bg-gray-500 transition duration-300">
        Exit Game
      </button>
    </div>
  </div>
  
  <setting v-if="currentPage === 'Settings'" 
    @goToMainMenu="goToMainMenu" 
    :seVolume="seVolume" 
    @updateSeVolume="updateSeVolume" 
    :masterVolume="masterVolume" 
    @updateMasterVolume="updateMasterVolume" 
  />
</template>