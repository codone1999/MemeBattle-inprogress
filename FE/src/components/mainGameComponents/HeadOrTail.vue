<script setup>
import { ref } from 'vue';

const coin = ['Head', 'Tail']
const resultCoin = ref(null)
const isVisible = ref(true)
const lock = ref(false)

const emits = defineEmits(["playerTurn"])

const flipCoin = () => {
  if (!lock.value) {
    lock.value = true; // ล็อกปุ่มทันทีที่กด

    const randomIndex = Math.floor(Math.random() * 2);
    resultCoin.value = coin[randomIndex];

    emits("playerTurn", resultCoin.value === 'Head' ? 1 : 2);

    setTimeout(() => {
      isVisible.value = false;
      lock.value = false; // ปลดล็อกหลังจาก 2 วินาที
    }, 2000);
  } //else {
    //console.log("You are clicking too fast.");
  //}
}

const hoverBtnSound = new Audio('/sounds/se/hover.mp3');
hoverBtnSound.volume = 0.1

const playHoverButton = () => {
    hoverBtnSound.currentTime = 0
    hoverBtnSound.play()//.catch(error => console.log("Sound play error:", error))
}
</script>

<template>
  <div 
    v-if="isVisible" 
    class="fixed inset-0 z-50 flex flex-col items-center justify-center min-h-screen bg-gray-800 bg-opacity-75 backdrop-blur-md"
  >
    <div class="text-center text-yellow-400 font-bold space-y-1 mb-4">
      <p class="text-xl drop-shadow-md">🔵 Head = Player1</p>
      <p class="text-xl drop-shadow-md">🔴 Tail = Player2</p>
    </div>

    <div 
      class="flex flex-col items-center bg-gray-900 border-4 border-gray-700 rounded-2xl shadow-2xl p-8 
             transition-all duration-300 transform scale-95 hover:scale-100"
    >
      <h2 class="text-3xl font-extrabold text-yellow-400 mb-4 tracking-widest">
        Head or Tail?
      </h2>
      
      <!-- Coin Flip Button -->
      <button 
        v-if="!resultCoin"
        @mouseenter="playHoverButton"
        @click="flipCoin"
        class="bg-gradient-to-r from-yellow-600 to-yellow-400 font-bold text-black text-lg px-6 py-3 rounded-xl shadow-lg
               hover:scale-105 active:scale-95 transition-all duration-200"
      >
        🎲 Flip the Coin
      </button>
  
      <!-- Result Section -->
      <div v-if="resultCoin" class="flex flex-col mt-5 gap-3 text-center font-bold transition-opacity duration-300 opacity-100">
        <p class="text-white text-4xl drop-shadow-lg">{{ resultCoin }}</p>
        <p class="text-2xl mt-2" :class="resultCoin === 'Head' ? 'text-blue-500': 'text-red-500'">
          {{ resultCoin === 'Head' ? 'Player1' : 'Player2' }} starts first!
        </p>
      </div>
    </div>
  </div>
</template>
