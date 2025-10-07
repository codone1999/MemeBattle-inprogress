<script setup>
import { ref, watch, onMounted } from 'vue';
import PlayerManager from '../PlayerManager.vue';
import mainMenuBg from '../../assets/Picture/Bg/mainmenu_bg.jpg';
import setting from './setting.vue';
import hoverSoundFile from '/sounds/se/hover.mp3';

const currentPage = ref('MainMenu');
const seVolume = ref(100); // ค่าเริ่มต้นของ SE Volume
const masterVolume = ref(100);  // ค่าเริ่มต้นของ Master Volume
const isAudioUnlocked = ref(false);
const hoverSound = new Audio(hoverSoundFile); // โหลดเสียงล่วงหน้า

const showLogin = () => {
    currentPage.value='showlogin'
}

const showSettings = () => {
    currentPage.value='Settings'
}

const goToMainMenu = () => {
    currentPage.value='MainMenu'
}

const exitGame = () =>{
    window.close()
}

hoverSound.volume = (seVolume.value / 100) * (masterVolume.value / 100);

const unlockAudio = () => {
    isAudioUnlocked.value = true;
    //console.log("Audio unlocked!");
};

// ฟังก์ชันเล่นเสียง hover
const playHoverSound = () => {
    if (!isAudioUnlocked.value) 
    return

    hoverSound.currentTime = 0
    hoverSound.play().catch(error => console.error("Audio play error:", error));
};

watch([seVolume, masterVolume], () => {
    hoverSound.volume = (seVolume.value / 100) * (masterVolume.value / 100);
});

const updateSeVolume = (newVolume) => {
    seVolume.value = newVolume;
    //console.log('MainMenu updated seVolume:', newVolume);
};

const updateMasterVolume = (newVolume) => {
    masterVolume.value = newVolume;
    //console.log('MainMenu updated masterVolume:', newVolume);
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
            <!-- <button @click="showLogin" @mouseenter="playHoverSound"
                class="px-8 py-4 text-xl rounded-lg cursor-pointer bg-gray-700 text-white hover:bg-gray-500 transition duration-300">
                Play
            </button> -->
            <router-link 
                :to="{name: 'Login'}"
                class="px-8 py-4 text-xl rounded-lg cursor-pointer bg-gray-700 text-white hover:bg-gray-500 transition duration-300"
            >
                Play
            </router-link>
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
    <!-- <PlayerManager v-if="currentPage === 'showlogin'"/> -->
    <setting v-if="currentPage === 'Settings'" @goToMainMenu="goToMainMenu" :seVolume="seVolume" @updateSeVolume="updateSeVolume" :masterVolume="masterVolume" @updateMasterVolume="updateMasterVolume" />
</template>
