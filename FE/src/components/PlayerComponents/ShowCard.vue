
<script setup>
import { ref, watch, onUnmounted } from 'vue'
const props = defineProps({
  card: {
    type: Object,
    required: true
  }
})
const emit = defineEmits(["close"])

const audio = ref(null)

const playSound = () => {
  if (props.card.cardRarity === "Legend") {
    const audioPath = `/sounds/cardsounds/${props.card.idcard}.mp3`
    audio.value = new Audio(audioPath)
    audio.value.volume = 0.10
    audio.value.play()
  }
};

const stopSound = () => {
  if (audio.value) {
    audio.value.pause()
    audio.value.currentTime = 0
  }
}

const closeCard = () => {
  stopSound()
  emit("close")
}

// ตรวจสอบเมื่อเปิดการ์ดใหม่
watch(() => props.card, (newCard) => {
  stopSound()
  if (newCard.cardRarity === "Legend") {
    playSound()
  }
}, { immediate: true })

onUnmounted(() => {
  stopSound()
})
</script>

<template>
  <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 border-4 border-gray-700 rounded-lg shadow-xl p-6 w-96 z-50">
    <h3 class="text-xl font-semibold text-white mb-2">{{ card.cardname }}</h3>
    <img :src="`/cards/${card.idcard}.png`" class="w-full h-auto object-cover rounded-md mb-4">
    <div class="text-gray-300 text-sm mb-1">
        <p>Ability: {{ card.Ability ? 'Yes' : 'No' }}</p>
        <p v-if="card.Ability">Ability Type: {{ card.abilityType }}</p>
        <p>Info: {{ card.cardinfo }}</p>
        <p>Power: {{ card.Power }}</p>
        <p>Pawns Required: {{ card.pawnsRequired }}</p>
        <p>Rarity: {{ card.cardRarity }}</p>
    </div>
    <button @click="closeCard" class="mt-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-gray-500">
      Close
    </button>
  </div>
</template>

<style scoped>
</style>