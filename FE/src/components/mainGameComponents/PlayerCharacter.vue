<script setup>
import { onMounted, ref, computed } from 'vue';

const props = defineProps(['selectId']);
const character = ref(null);

// Fetch character data on mount
onMounted(async () => {
    try {
        const response = await fetch('/data/db.json');
        const data = await response.json();
        character.value = data.character.find(cha => cha.idcharacter === props.selectId);
    } catch {
        alert('Failed to load character data');
    }
});

// Dynamic theme colors based on character
const theme = computed(() => {
    if (!character.value) return {};
    return {
        background: character.value.themeColor || 'bg-[#2e001f]',  // Dark purple/burgundy background
        border: character.value.borderColor || 'border-[#9e2a2f]',  // Crimson red border
        text: character.value.textColor || 'text-[#e3d5c1]',  // Pale gold text
        shadow: character.value.shadowColor || 'shadow-[#6f0047]'  // Dark purple shadow
    }
})
</script>

<template>
  <div 
    v-if="character" 
    :class="`relative w-50 h-72 ${theme.background} ${theme.border} border-4 rounded-lg flex flex-col items-center p-4
     ${theme.text} transition-all duration-200 ${theme.shadow} shadow-lg max-xl:scale-75 max-md:scale-60`"
  >
    <!-- Character Image (Increased Size) -->
    <div class="relative w-full h-full flex justify-center items-center">
      <slot name="image">
        <img 
          :src="`/Characters/${character.idcharacter}.png`" 
          :alt="character.charatername" 
          class="border-2 rounded-lg w-full h-full object-cover"
          :class="theme.border"
        />
      </slot>
    </div>
    
    <!-- Character Name -->
    <div class="text-lg font-bold mt-2 text-center">
      <slot name="name">{{ character.charatername }}</slot>
    </div>
  </div>

  <!-- Loading State -->
  <div v-else class="text-center text-white py-4 animate-pulse">
    Loading character...
  </div>
</template>
