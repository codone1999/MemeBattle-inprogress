<script setup>
import { computed } from 'vue';
import { useImageFallback } from '@/composables/useImageFallback';

const props = defineProps({
  card: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showGrid: {
    type: Boolean,
    default: true
  },
  size: {
    type: String,
    default: 'normal', // 'small', 'normal', 'large'
  }
});

const emit = defineEmits(['click']);

const handleClick = () => {
  if (!props.disabled) {
    emit('click', props.card);
  }
};

// Get card size classes - now includes both width and height
const cardSizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-40 h-[13.3rem]'; // 160px width, ~213px height (3:4 ratio)
    case 'large':
      return 'w-80 h-[26.7rem]'; // 320px width, ~427px height (3:4 ratio)
    default:
      return 'w-56 h-[18.7rem]'; // 224px width, ~299px height (3:4 ratio)
  }
});

// Get rarity gradient
const getRarityGradient = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'from-yellow-500 via-yellow-600 to-yellow-700';
    case 'epic':
      return 'from-purple-500 via-purple-600 to-purple-700';
    case 'rare':
      return 'from-blue-500 via-blue-600 to-blue-700';
    default:
      return 'from-stone-500 via-stone-600 to-stone-700';
  }
};

// Get rarity border color
const getRarityBorder = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'border-yellow-500';
    case 'epic':
      return 'border-purple-500';
    case 'rare':
      return 'border-blue-500';
    default:
      return 'border-stone-600';
  }
};

// Get card type color
const getCardTypeColor = (cardType) => {
  switch (cardType) {
    case 'buff':
      return 'text-green-400';
    case 'debuff':
      return 'text-red-400';
    default:
      return 'text-yellow-400';
  }
};

// Create 3x3 grid with pawn locations and place location
const gridData = computed(() => {
  const grid = Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({
    hasPawn: false,
    isPlaceLocation: false,
    pawnCount: 0
  })));

  // Mark center as place location (where card is placed)
  grid[1][1].isPlaceLocation = true;

  // Mark pawn locations relative to center
  if (props.card.pawnLocations && Array.isArray(props.card.pawnLocations)) {
    props.card.pawnLocations.forEach(loc => {
      const gridX = loc.relativeX + 1; // Convert relative to grid (0-2)
      const gridY = loc.relativeY + 1;

      if (gridX >= 0 && gridX < 3 && gridY >= 0 && gridY < 3) {
        grid[gridY][gridX].hasPawn = true;
        grid[gridY][gridX].pawnCount = loc.pawnCount || 1;
      }
    });
  }

  return grid;
});

// Use image fallback composable for card images
const { handleImageError } = useImageFallback('card');
</script>

<template>
  <div
    :class="[
      'relative bg-stone-900 rounded-xl border-4 overflow-hidden transition-all duration-200 flex flex-col',
      cardSizeClasses,
      getRarityBorder(card.rarity),
      {
        'cursor-pointer hover:scale-105 hover:shadow-2xl': !disabled,
        'ring-4 ring-yellow-400 scale-105 shadow-2xl': selected,
        'opacity-50 cursor-not-allowed': disabled
      }
    ]"
    @click="handleClick"
  >
    <!-- Rarity Gradient Top Border -->
    <div :class="['h-2 bg-gradient-to-r', getRarityGradient(card.rarity)]" />

    <!-- Card Main Content - Image as Background -->
    <div class="relative flex-1 bg-stone-900 overflow-hidden">
      <!-- Background Image -->
      <img
        v-if="card.cardImage"
        :src="card.cardImage"
        :alt="card.name"
        class="absolute inset-0 w-full h-full object-cover"
        @error="handleImageError"
      />
      <!-- Fallback - Only show if no cardImage provided -->
      <div v-if="!card.cardImage" class="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-stone-700 bg-stone-900">
        <div class="text-6xl opacity-20 mb-2">🃏</div>
        <div class="text-xs opacity-40">No picture yet</div>
      </div>

      <!-- Top Stats Overlay -->
      <div class="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-2 flex justify-between items-start">
        <!-- Power -->
        <div class="flex flex-col items-center bg-stone-900/80 backdrop-blur-sm rounded px-2 py-1">
          <span class="text-[8px] text-stone-400 uppercase">Power</span>
          <div :class="['text-xl font-black leading-none', getCardTypeColor(card.cardType)]">
            {{ card.power }}
          </div>
        </div>

        <!-- Rarity Badge -->
        <div class="bg-stone-900/80 backdrop-blur-sm px-2 py-1 rounded">
          <div class="text-[9px] font-bold uppercase tracking-wide" :class="{
            'text-yellow-400': card.rarity === 'legendary',
            'text-purple-400': card.rarity === 'epic',
            'text-blue-400': card.rarity === 'rare',
            'text-stone-400': card.rarity === 'common'
          }">
            {{ card.rarity }}
          </div>
        </div>

        <!-- Pawn Requirement -->
        <div class="flex flex-col items-center bg-stone-900/80 backdrop-blur-sm rounded px-2 py-1">
          <span class="text-[8px] text-stone-400 uppercase">Req</span>
          <div class="flex items-center gap-0.5">
            <span
              v-for="n in card.pawnRequirement"
              :key="n"
              class="text-blue-400 text-xs"
            >
              ●
            </span>
          </div>
        </div>
      </div>

      <!-- Bottom Info Overlay -->
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/90 to-transparent p-2 pt-8 space-y-1">
        <!-- Card Name -->
        <div class="text-center font-bold text-white text-sm drop-shadow-lg truncate" :title="card.name">
          {{ card.name }}
        </div>

        <!-- Ability -->
        <div v-if="card.ability && card.ability.abilityDescription" class="bg-black/60 backdrop-blur-sm rounded px-2 py-1 border border-purple-500/30">
          <div class="flex items-center gap-1">
            <span class="text-[9px] text-purple-400 font-bold">⚡</span>
            <span class="text-[8px] text-stone-200 leading-tight line-clamp-1">
              {{ card.ability.abilityDescription }}
            </span>
          </div>
        </div>

        <!-- Pawn Location Grid (3x3) -->
        <div v-if="showGrid" class="pt-0.5">
          <div class="text-[8px] text-stone-400 mb-1 text-center font-semibold">Pawn Locations</div>
          <div class="flex justify-center">
            <div class="inline-grid grid-cols-3 gap-0.5 bg-black/60 backdrop-blur-sm p-1 rounded border border-white/10">
              <template v-for="(row, y) in gridData" :key="y">
                <div
                  v-for="(cell, x) in row"
                  :key="`${y}-${x}`"
                  :class="[
                    'w-5 h-5 flex items-center justify-center text-[9px] font-bold rounded transition-all',
                    {
                      // Place location (center - where card is placed)
                      'bg-yellow-500 text-yellow-900 ring-1 ring-yellow-400 shadow-lg': cell.isPlaceLocation,
                      // Has pawn
                      'bg-blue-500 text-white shadow-md': cell.hasPawn && !cell.isPlaceLocation,
                      // Empty
                      'bg-stone-800/50 text-stone-600': !cell.hasPawn && !cell.isPlaceLocation
                    }
                  ]"
                >
                  <span v-if="cell.isPlaceLocation">★</span>
                  <span v-else-if="cell.hasPawn">+{{ cell.pawnCount }}</span>
                  <span v-else>·</span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Badge -->
    <div
      v-if="selected"
      class="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-stone-900 text-xs px-3 py-1 rounded-full font-bold shadow-lg"
    >
      SELECTED
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
