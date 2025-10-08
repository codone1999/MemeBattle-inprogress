<script setup>
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useritem } from '@/stores/playerStore';

const playerStore = useritem();
const { userCharacters, inventory } = storeToRefs(playerStore);

const props = defineProps({
  selectedCharacterId: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['select']);

const availableCharacters = computed(() => {
  // Use userCharacters from store instead of filtering manually
  return userCharacters.value || [];
});

const selectCharacter = (characterId) => {
  emit('select', characterId);
};
</script>

<template>
  <div v-if="availableCharacters.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4">
    <div
      v-for="character in availableCharacters"
      :key="character.idcharacter"
      @click="selectCharacter(character.idcharacter)"
      :class="[
        'relative cursor-pointer rounded-lg overflow-hidden border-3 transition-all duration-300 transform hover:scale-105',
        selectedCharacterId === character.idcharacter
          ? 'border-blue-400 shadow-lg shadow-blue-400/50 ring-2 ring-blue-400/30'
          : 'border-gray-700 hover:border-gray-500'
      ]"
    >
      <!-- Character Image -->
      <div class="aspect-square bg-gray-900 relative">
        <img
          :src="`/characters/${character.idcharacter}.png`"
          :alt="character.charatername"
          class="w-full h-full object-cover"
          @error="$event.target.src = '/characters/default.png'"
        />
        
        <!-- Selected Badge -->
        <div
          v-if="selectedCharacterId === character.idcharacter"
          class="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold"
        >
          ✓
        </div>
      </div>

      <!-- Character Name -->
      <div class="px-3 py-2 text-center font-semibold text-sm bg-gray-800">
        <p class="text-white">{{ character.charatername }}</p>
      </div>
    </div>
  </div>
  <div v-else class="text-center text-gray-400 py-8">
    <p>No characters available</p>
  </div>
</template>