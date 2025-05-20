<script setup>
import { ref, watch } from 'vue';

const props = defineProps(['seVolume', 'masterVolume', 'backToLobby']);

const emit = defineEmits(['updateSeVolume', 'updateMasterVolume', 'goToMainMenu'])
const masterVolume = ref(props.masterVolume !== undefined ? props.masterVolume : 100)
const bgmVolume = ref(100)
const seVolume = ref(props.seVolume !== undefined ? props.seVolume : 100);
const bgmRatio = ref(1)
const seRatio = ref(1)

watch(masterVolume, (newVal, oldVal) => {
    if (oldVal > 0) {
        bgmRatio.value = bgmVolume.value / oldVal
        seRatio.value = seVolume.value / oldVal
    }

    if (newVal === 0) {
        bgmVolume.value = 0
        seVolume.value = 0
    } else if (oldVal === 0 && newVal > 0) {
        bgmVolume.value = Math.round(newVal * bgmRatio.value)
        seVolume.value = Math.round(newVal * seRatio.value)
    }

    // ส่งค่า SE Volume และ Master Volume ที่ปรับ
    emit('updateSeVolume', seVolume.value);
    emit('updateMasterVolume', masterVolume.value);
})

// ป้องกันค่าVolumeเกิน 100
watch([bgmVolume, seVolume], ([newBgm, newSe]) => {
    bgmVolume.value = Math.min(100, Math.max(0, newBgm))
    seVolume.value = Math.min(100, Math.max(0, newSe))
    emit('updateSeVolume', seVolume.value);   // ส่งค่า SE Volume ที่ถูกปรับ
})

watch(seVolume, (newValue) => {
  emit('updateSeVolume', newValue)
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-8">
    <h2 class="text-3xl font-semibold mb-6">Settings</h2>

    <!-- Master Volume -->
    <div class="mb-4 w-72">
        <label class="block text-lg font-medium mb-2">Master Volume:</label>
        <input type="range" min="0" max="100" v-model="masterVolume"
            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500">
        <p class="text-center mt-1">{{ masterVolume }}%</p>
    </div>

    <!-- BGM Volume -->
    <!-- <div class="mb-4 w-72">
        <label class="block text-lg font-medium mb-2">BGM Volume:</label>
        <input type="range" min="0" max="100" v-model="bgmVolume"
            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-500">
        <p class="text-center mt-1">{{ bgmVolume }}%</p>
    </div> -->

    <!-- SE Volume -->
    <div class="mb-4 w-72">
        <label class="block text-lg font-medium mb-2">Button Volume:</label>
        <input type="range" min="0" max="100" v-model="seVolume"
            class="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500">
        <p class="text-center mt-1">{{ seVolume }}%</p>
    </div>

    <button @click="emit('goToMainMenu')"
        class="mt-6 px-6 py-3 text-lg rounded-lg bg-blue-500 text-white hover:bg-blue-700 transition">
    {{ props.backToLobby === 'GameLobby' ? 'Back to Lobby' : 'Back to Main Menu' }}
</button>
  </div>
</template>