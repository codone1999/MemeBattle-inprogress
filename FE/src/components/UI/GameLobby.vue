<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import GameManager from '../GameManager.vue';
import setting from './setting.vue';
import { useritem } from '@/stores/playerStore.js';
import { storeToRefs } from 'pinia';

const props = defineProps({
    decks: {
        type: Array,
        required: true
    },
    characters: {
        type: Array,
        required: true
    }
})

let { characters } =storeToRefs(useritem())


const masterVolume = ref(100);
const seVolume = ref(100); 

const selectedDeckPlayer1 = ref(null)
const selectedDeckPlayer2 = ref(null)
const selectedCharPlayer1 = ref(null)
const selectedCharPlayer2 = ref(null)
const mainGamePagestatus = ref(false)
const currentPage = ref('GameLobby')
const selectedMap = ref(null)
const data = ref(null);


onMounted(async () => {
  try {
    const response = await fetch('/data/db.json');
    if (!response.ok) throw new Error("Failed to load data");
    data.value = await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
  }
});

const availableMaps = computed(() => {
  return data.value ? data.value.maps: [];
});


const availableDecksPlayer2 = computed(() => {
    if (selectedDeckPlayer1.value) {
        return props.decks.filter(deck => deck !== selectedDeckPlayer1.value);
    }
    return props.decks
})

const findCharacterName = (chId) => {
    const character = characters.value.find(character => character.idcharacter === chId);
    // console.log(selectedCharPlayer1.value)

    return character ? character.charatername : 'Unknown Character';
}

const setMainGamePage = () =>{
    if(!selectedCharPlayer1.value || !selectedCharPlayer2.value || !selectedDeckPlayer1.value || !selectedDeckPlayer2.value || !selectedMap.value) return;

    mainGamePagestatus.value = true
}
const showSettings = () => {
    currentPage.value='Settings'
}

const goToLobby = () =>{
    currentPage.value='GameLobby'
}

const hoverMapSound = '/sounds/se/cardhover.mp3';

const playHoverMap = () => {
    const mapsound = new Audio(hoverMapSound)
    mapsound.volume = 0.5
    mapsound.currentTime = 0
    mapsound.play()//.catch(error => console.log("Sound play error:", error))
}

const hoverBtnSound = new Audio('/sounds/se/hover.mp3');
hoverBtnSound.volume = 0.1

const playHoverButton = () => {
    hoverBtnSound.currentTime = 0
    hoverBtnSound.play()//.catch(error => console.log("Sound play error:", error))
}

watch(masterVolume, (newVal) => {
    // console.log('GameLobby sending masterVolume:', newVal);
});

watch(seVolume, (newVal) => {
    // console.log('GameLobby sending seVolume:', newVal);
});

const updateSeVolume = (value) => {
    seVolume.value = value;
};

const updateMasterVolume = (value) => {
    masterVolume.value = value;
};
</script>

<template>
    <div 
        v-if="!mainGamePagestatus && currentPage === 'GameLobby'"
        class="flex flex-col lg:flex-row h-full w-full bg-gradient-to-b from-black to-gray-900 text-white relative overflow-auto"
    >
        <!-- Player 1 -->
        <div class="w-full lg:w-1/3 flex flex-col items-center justify-center p-4 lg:p-8 lg:border-r border-gray-700 order-2 lg:order-1">
            <h2 class="text-xl md:text-2xl font-bold text-blue-400 mb-4 tracking-widest">Player 1</h2>
            <select v-model="selectedDeckPlayer1"
                class="w-full max-w-xs bg-gray-800 text-white py-2 md:py-3 px-3 md:px-4 border border-blue-500 rounded-lg shadow-lg transition mb-4">
                <option>Select Your Deck</option>
                <option v-for="deck in decks" :key="deck" :value="deck">{{ deck }}</option>
            </select>
            <select v-model="selectedCharPlayer1"
                class="w-full max-w-xs bg-gray-800 text-white py-2 md:py-3 px-3 md:px-4 border border-blue-500 rounded-lg shadow-lg transition mb-4">
                <option>Select Your Character</option>
                <option v-for="character in characters" :key="character" :value="character">{{ character.charatername }}</option>
            </select>
            <div v-if="selectedCharPlayer1" class="flex flex-col items-center">
                <img :src="`/Characters/${selectedCharPlayer1.idcharacter}.png`" alt="Player 1 Character" 
                class="max-w-32 md:max-w-40 lg:max-w-48 h-auto rounded-lg shadow-md border-2 border-blue-500">
                <p class="mt-2 text-base md:text-lg text-gray-300">{{ findCharacterName(selectedCharPlayer1.idcharacter) }}</p>
            </div>
        </div>

        <!-- Map Selection -->
        <div class="lg:absolute lg:top-10 lg:left-1/2 lg:-translate-x-1/2 flex flex-col items-center p-4 order-3 lg:order-2">
            <h2 class="text-xl md:text-2xl font-bold text-yellow-400 tracking-widest mb-2">Choose a Map</h2>
            <!-- Map Grid Preview -->
            <div class="grid grid-cols-3 my-3 md:my-5 gap-2 md:gap-3 max-w-[250px] md:max-w-[300px]">
                <div v-for="map in availableMaps" :key="map.name"
                    @mouseenter="playHoverMap"
                    @click="selectedMap = map.image"
                    class="cursor-pointer transform hover:scale-110 transition border-2 rounded-lg"
                    :class="{'border-yellow-500 shadow-lg': selectedMap === map.image, 'border-gray-600': selectedMap !== map.image}">
                <img :src="map.image" :alt="map.name"
                    class="w-16 h-16 md:w-24 md:h-24 rounded-md object-cover">
                </div>
            </div>
            <!-- Selected Map Display -->
            <div v-if="selectedMap" class="mt-2 md:mt-4">
                <img :src="selectedMap" :alt="selectedMap"
                class="max-w-48 md:max-w-64 lg:max-w-80 h-auto rounded-lg shadow-md border-4 border-yellow-500">
            </div>
        </div>

        <!-- Play Button -->
        <div class="w-full lg:w-1/3 flex flex-col items-center justify-center lg:justify-end p-4 lg:mb-10 order-4 lg:order-3 mt-6 lg:mt-0">
            <button @mouseenter="playHoverButton" @click="setMainGamePage"
                class="bg-green-500 hover:bg-green-700 text-white font-bold py-3 md:py-4 px-8 md:px-12 rounded-xl text-lg md:text-xl shadow-2xl tracking-widest transition transform hover:scale-110">
                Play
            </button>
        </div>

        <!-- Player 2 -->
        <div class="w-full lg:w-1/3 flex flex-col items-center justify-center p-4 lg:p-8 lg:border-l border-gray-700 order-2 lg:order-3">
            <h2 class="text-xl md:text-2xl font-bold text-red-400 mb-4 tracking-widest">Player 2</h2>
            <select v-model="selectedDeckPlayer2"
                class="w-full max-w-xs bg-gray-800 text-white py-2 md:py-3 px-3 md:px-4 border border-red-500 rounded-lg shadow-lg transition mb-4">
                <option>Select Your Deck</option>
                <option v-for="deck in availableDecksPlayer2" :key="deck" :value="deck">{{ deck }}</option>
            </select>
            <select v-model="selectedCharPlayer2"
                class="w-full max-w-xs bg-gray-800 text-white py-2 md:py-3 px-3 md:px-4 border border-red-500 rounded-lg shadow-lg transition mb-4">
                <option>Select Your Character</option>
                <option v-for="character in characters" :key="character" :value="character">{{ character.charatername }}</option>
            </select>
            <div v-if="selectedCharPlayer2" class="flex flex-col items-center">
                <img :src="`/Characters/${selectedCharPlayer2.idcharacter}.png`" alt="Player 2 Character" 
                class="max-w-32 md:max-w-40 lg:max-w-48 h-auto rounded-lg shadow-md border-2 border-red-500">
                <p class="mt-2 text-base md:text-lg text-gray-300">{{ findCharacterName(selectedCharPlayer2.idcharacter) }}</p>
            </div>
        </div>

        <!-- Settings Button -->
        <button 
            @mouseenter="playHoverButton"
            @click="showSettings"
            class="fixed bottom-4 right-4 px-4 md:px-6 py-2 md:py-3 bg-gray-700 text-white text-base md:text-lg rounded-lg shadow-lg hover:bg-gray-500 transition z-10"
        >
            Settings
        </button>
    </div>

    <!-- Settings -->
    <setting v-if="currentPage === 'Settings'" backToLobby="GameLobby" @goToMainMenu="goToLobby" :seVolume="seVolume" @updateSeVolume="updateSeVolume"
    :masterVolume="masterVolume" @updateMasterVolume="updateMasterVolume" />

    <!-- Main Game -->
    <GameManager v-if="mainGamePagestatus"
        :player1Deck="selectedDeckPlayer1"
        :player2Deck="selectedDeckPlayer2"
        :playerCharacter1="selectedCharPlayer1.idcharacter"
        :playerCharacter2="selectedCharPlayer2.idcharacter"
        :selectedMap="selectedMap"
        :masterVolume="masterVolume" :seVolume="seVolume" />
</template>
