<script setup>
import { computed } from 'vue';

const props = defineProps({
  board: {
    type: Array,
    required: true
  },
  previewPawnLocations: {
    type: Array,
    default: () => []
  },
  previewAbilityLocations: {
    type: Array,
    default: () => []
  },
  selectedCardIndex: {
    type: Number,
    default: null
  }
});

const emit = defineEmits(['square-hover', 'square-click']);

const isPreviewPawn = (x, y) => {
  return props.previewPawnLocations.some(loc => loc.x === x && loc.y === y);
};

const isPreviewAbility = (x, y) => {
  return props.previewAbilityLocations.some(loc => loc.x === x && loc.y === y);
};

const getSquareClasses = (square, x, y) => {
  const classes = ['relative', 'aspect-square', 'border-2', 'rounded-lg', 'transition-all', 'cursor-pointer'];

  // Owner border colors
  if (square.owner === 'me') {
    classes.push('border-blue-500', 'bg-blue-900/20');
  } else if (square.owner === 'opponent') {
    classes.push('border-red-500', 'bg-red-900/20');
  } else {
    classes.push('border-stone-700', 'bg-stone-800/30');
  }

  // Preview highlights
  if (isPreviewPawn(x, y)) {
    classes.push('ring-4', 'ring-green-500', 'ring-opacity-50', 'animate-pulse');
  }

  if (isPreviewAbility(x, y)) {
    classes.push('ring-4', 'ring-blue-500', 'ring-opacity-50');
  }

  // Hover effect
  if (props.selectedCardIndex !== null) {
    classes.push('hover:scale-105', 'hover:shadow-xl');
  }

  return classes.join(' ');
};

const getPawnDisplay = (square) => {
  const pawns = square.pawns || {};
  const myPawns = pawns.me || 0;
  const opponentPawns = pawns.opponent || 0;

  return { myPawns, opponentPawns };
};

const getCardPowerDisplay = (card) => {
  if (!card) return 0;
  return card.power || 0;
};

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
</script>

<template>
  <div class="bg-stone-900/50 backdrop-blur rounded-xl border-2 border-stone-700 p-4 my-6">
    <div class="space-y-2">
      <!-- Row Labels -->
      <div class="flex justify-between items-center mb-2">
        <span class="text-xs text-stone-500 uppercase">Opponent's Side (Top)</span>
        <span class="text-xs text-stone-500 uppercase">Your Side (Bottom)</span>
      </div>

      <!-- Board Grid (3 rows x 10 columns) -->
      <div
        v-for="(row, rowIndex) in board"
        :key="rowIndex"
        class="grid grid-cols-10 gap-2"
      >
        <div
          v-for="(square, colIndex) in row"
          :key="`${rowIndex}-${colIndex}`"
          :class="getSquareClasses(square, square.x, square.y)"
          @mouseenter="emit('square-hover', square.x, square.y)"
          @mouseleave="emit('square-hover', null, null)"
          @click="emit('square-click', square.x, square.y)"
        >
          <!-- Special Square Indicator -->
          <div
            v-if="square.special"
            class="absolute top-0 right-0 text-xs bg-purple-600 text-white px-1 rounded-bl"
            :title="square.special.type"
          >
            ⭐
          </div>

          <!-- Card Display -->
          <div v-if="square.card" class="h-full flex flex-col items-center justify-center p-1">
            <!-- Card Power -->
            <div
              :class="[
                'text-2xl font-bold',
                getCardTypeColor(square.card.cardType)
              ]"
            >
              {{ getCardPowerDisplay(square.card) }}
            </div>

            <!-- Card Type Icon -->
            <div class="text-xs">
              <span v-if="square.card.cardType === 'buff'" title="Buff">📈</span>
              <span v-else-if="square.card.cardType === 'debuff'" title="Debuff">📉</span>
              <span v-else title="Standard">⚔️</span>
            </div>

            <!-- Card Name (truncated) -->
            <div class="text-[8px] text-stone-400 truncate w-full text-center mt-1">
              {{ square.card.name }}
            </div>
          </div>

          <!-- Empty Square with Pawns -->
          <div v-else class="h-full flex items-center justify-center">
            <div v-if="getPawnDisplay(square).myPawns > 0 || getPawnDisplay(square).opponentPawns > 0" class="text-center">
              <!-- My Pawns -->
              <div v-if="getPawnDisplay(square).myPawns > 0" class="text-blue-400 text-sm font-bold">
                🔵 {{ getPawnDisplay(square).myPawns }}
              </div>

              <!-- Opponent Pawns -->
              <div v-if="getPawnDisplay(square).opponentPawns > 0" class="text-red-400 text-sm font-bold">
                🔴 {{ getPawnDisplay(square).opponentPawns }}
              </div>
            </div>

            <!-- Completely empty -->
            <div v-else class="text-stone-700 text-xs">
              {{ square.x }},{{ square.y }}
            </div>
          </div>

          <!-- Preview Indicators -->
          <div v-if="isPreviewPawn(square.x, square.y)" class="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div class="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full animate-bounce">
              +Pawn
            </div>
          </div>

          <div v-if="isPreviewAbility(square.x, square.y)" class="absolute top-1 left-1/2 transform -translate-x-1/2">
            <div class="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
              Effect
            </div>
          </div>
        </div>
      </div>

      <!-- Row Score Display -->
      <div class="grid grid-cols-10 gap-2 mt-2">
        <div
          v-for="(row, rowIndex) in board"
          :key="`score-${rowIndex}`"
          class="col-span-10 flex justify-between items-center bg-stone-800/50 rounded px-2 py-1 text-xs"
        >
          <span class="text-stone-400">Row {{ rowIndex }}</span>
          <div class="flex gap-4">
            <span class="text-blue-400">You: 0</span>
            <span class="text-red-400">Opp: 0</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.aspect-square {
  aspect-ratio: 1 / 1;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}
</style>
