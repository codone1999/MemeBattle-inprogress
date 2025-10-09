<script setup>
import { computed } from 'vue';

const cardProps = defineProps({
  title: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: false,
  },
  score: {
    type: Number,
    required: true,
  },
  pawnsRequired: {
    type: String,
    required: true,
  },
  pawnLocations: {
    type: Array,
    required: true,
  },
  Ability: {
    type: String,
    required: true,
  }
});

const abilityColor = computed(() => {
  const colors = {
    'buff': 'bg-green-600/80',
    'debuff': 'bg-purple-600/80',
    'damage': 'bg-red-600/80',
    'control': 'bg-blue-600/80'
  };
  return colors[cardProps.Ability?.toLowerCase()] || 'bg-gray-700/80';
});
</script>

<template>
  <div
    class="relative w-full aspect-[3/4] bg-gray-900 border-2 border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden"
  >
    <!-- Card Image -->
    <div class="relative w-full h-full">
      <img
        :src="cardProps.imageUrl"
        :alt="cardProps.title"
        class="absolute inset-0 w-full h-full object-cover"
      />
      
      <!-- Gradient Overlay -->
      <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
    </div>

    <!-- Cost Badge (Top Left) -->
    <div class="absolute top-2 left-2 flex items-center gap-0.5 bg-yellow-500/90 backdrop-blur-sm px-2 py-1 rounded-full">
      <span v-for="n in parseInt(cardProps.pawnsRequired)" :key="n" class="text-gray-900 text-xs">♟</span>
    </div>

    <!-- Power & Ability (Top Right) -->
    <div class="absolute top-2 right-2 flex flex-col gap-1">
      <div class="w-10 h-10 bg-gray-900/90 backdrop-blur-sm border-2 border-yellow-500 text-yellow-400 font-bold flex items-center justify-center rounded-full text-lg">
        {{ cardProps.score }}
      </div>
      <div 
        v-if="cardProps.Ability" 
        :class="['text-xs font-semibold px-2 py-1 rounded-full text-white backdrop-blur-sm', abilityColor]"
      >
        {{ cardProps.Ability }}
      </div>
    </div>

    <!-- Pawn Grid (Bottom Center) -->
    <div class="absolute bottom-12 left-1/2 -translate-x-1/2">
      <div class="grid grid-cols-5 gap-0.5 bg-gray-900/90 backdrop-blur-sm p-1 rounded">
        <template v-for="i in 25" :key="i">
          <div
            class="w-2 h-2 rounded-sm transition-colors"
            :class="{
              'bg-yellow-400': cardProps.pawnLocations.includes(i),
              'bg-blue-400': i === 13,
              'bg-gray-700': !cardProps.pawnLocations.includes(i) && i !== 13
            }"
          ></div>
        </template>
      </div>
    </div>

    <!-- Card Name (Bottom) -->
    <div class="absolute bottom-2 left-2 right-2">
      <p class="text-white text-xs font-semibold text-center truncate px-1">
        {{ cardProps.title }}
      </p>
    </div>
  </div>
</template>