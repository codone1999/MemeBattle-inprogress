<script setup>
import { computed } from 'vue';

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

// Get card size classes
const cardSizeClasses = computed(() => {
  switch (props.size) {
    case 'small':
      return 'w-32';
    case 'large':
      return 'w-64';
    default:
      return 'w-48';
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

// Handle image errors
const handleImageError = (event) => {
  event.target.src = '/cards/default-card.png';
};
</script>

<template>
  <div
    :class="[
      'relative bg-stone-800 rounded-xl border-4 overflow-hidden transition-all duration-200',
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
    <!-- Rarity Gradient Header -->
    <div :class="['h-2 bg-gradient-to-r', getRarityGradient(card.rarity)]" />

    <!-- Card Header: Power & Pawn Requirement -->
    <div class="px-2 py-0.5 bg-stone-900 flex justify-between items-center">
      <!-- Power -->
      <div class="flex items-center gap-0.5">
        <span class="text-[8px] text-stone-400">PWR</span>
        <div :class="['text-base font-black', getCardTypeColor(card.cardType)]">
          {{ card.power }}
        </div>
      </div>

      <!-- Pawn Requirement -->
      <div class="flex items-center gap-0.5">
        <span class="text-[8px] text-stone-400">REQ</span>
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

    <!-- Card Picture -->
    <div class="relative aspect-[2/3] bg-stone-900 overflow-hidden">
      <img
        v-if="card.cardImage"
        :src="card.cardImage"
        :alt="card.name"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-6xl opacity-30">
        🃏
      </div>

      <!-- Rarity Badge Overlay -->
      <div class="absolute top-1 right-1 bg-stone-900 bg-opacity-90 px-1.5 py-0.5 rounded">
        <div class="text-[8px] font-bold uppercase tracking-wide" :class="{
          'text-yellow-400': card.rarity === 'legendary',
          'text-purple-400': card.rarity === 'epic',
          'text-blue-400': card.rarity === 'rare',
          'text-stone-400': card.rarity === 'common'
        }">
          {{ card.rarity }}
        </div>
      </div>
    </div>

    <!-- Card Footer: Name, Ability, Grid -->
    <div class="bg-stone-900 p-1.5 space-y-0.5">
      <!-- Card Name -->
      <div class="text-center font-bold text-white text-[10px] truncate" :title="card.name">
        {{ card.name }}
      </div>

      <!-- Ability -->
      <div v-if="card.ability && card.ability.abilityDescription" class="bg-stone-800 rounded px-1 py-0.5">
        <div class="text-[8px] text-purple-400 font-bold">⚡</div>
        <div class="text-[7px] text-stone-300 leading-tight line-clamp-1">
          {{ card.ability.abilityDescription }}
        </div>
      </div>

      <!-- Pawn Location Grid (3x3) -->
      <div v-if="showGrid" class="pt-0.5">
        <div class="text-[7px] text-stone-500 mb-0.5 text-center">Pawns</div>
        <div class="flex justify-center">
          <div class="inline-grid grid-cols-3 gap-0.5 bg-stone-950 p-0.5 rounded">
            <template v-for="(row, y) in gridData" :key="y">
              <div
                v-for="(cell, x) in row"
                :key="`${y}-${x}`"
                :class="[
                  'w-4 h-4 flex items-center justify-center text-[8px] font-bold rounded transition-all',
                  {
                    // Place location (center - where card is placed)
                    'bg-yellow-600 text-yellow-900 ring-1 ring-yellow-400': cell.isPlaceLocation,
                    // Has pawn
                    'bg-blue-600 text-white': cell.hasPawn && !cell.isPlaceLocation,
                    // Empty
                    'bg-stone-700 text-stone-600': !cell.hasPawn && !cell.isPlaceLocation
                  }
                ]"
              >
                <span v-if="cell.isPlaceLocation">★</span>
                <span v-else-if="cell.hasPawn">+{{ cell.pawnCount }}</span>
                <span v-else></span>
              </div>
            </template>
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
