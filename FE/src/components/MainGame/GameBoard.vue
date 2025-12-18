<script setup>
import { computed } from 'vue';

const props = defineProps({
  board: {
    type: Array,
    required: true
  },
  myRowScores: {
    type: Array,
    default: () => [0, 0, 0]
  },
  opponentRowScores: {
    type: Array,
    default: () => [0, 0, 0]
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
  },
  tifaBoostedRows: {
    type: Array,
    default: () => []
  },
  tifaCardCount: {
    type: Object,
    default: () => ({ 0: 0, 1: 0, 2: 0 })
  }
});

const emit = defineEmits(['square-hover', 'square-click', 'row-score-click']);

const isTifaBoostedRow = (rowIndex) => {
  return props.tifaBoostedRows.includes(rowIndex);
};

const getTifaBoostInfo = (rowIndex) => {
  if (!isTifaBoostedRow(rowIndex)) return null;
  const count = props.tifaCardCount[rowIndex] || 0;
  const remaining = Math.max(0, 3 - count);
  return { count, remaining };
};

const isPreviewPawn = (x, y) => {
  return props.previewPawnLocations.some(loc => loc.x === x && loc.y === y);
};

const isPreviewAbility = (x, y) => {
  return props.previewAbilityLocations.some(loc => loc.x === x && loc.y === y);
};

const getPreviewAbilityType = (x, y) => {
  const location = props.previewAbilityLocations.find(loc => loc.x === x && loc.y === y);
  return location?.effectType || null;
};

const getSquareClasses = (square, x, y) => {
  const classes = [
    'relative',
    'board-square',  // Custom class for card-sized squares
    'border-2',
    'rounded-lg',
    'transition-all',
    'cursor-pointer',
    'min-h-[120px]'  // Minimum height to accommodate cards
  ];

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
    classes.push('ring-4', 'ring-blue-500', 'ring-opacity-50', 'animate-pulse');
  }

  if (isPreviewAbility(x, y)) {
    const abilityType = getPreviewAbilityType(x, y);
    if (abilityType === 'buff') {
      classes.push('ring-4', 'ring-green-500', 'ring-opacity-50');
    } else if (abilityType === 'debuff') {
      classes.push('ring-4', 'ring-purple-500', 'ring-opacity-50');
    } else {
      // Fallback to purple if no type specified
      classes.push('ring-4', 'ring-purple-500', 'ring-opacity-50');
    }
  }

  // Hover effect when card is selected
  if (props.selectedCardIndex !== null) {
    classes.push('hover:scale-105', 'hover:shadow-xl', 'hover:ring-2', 'hover:ring-yellow-500');
  }

  // Active effect highlighting (buff/debuff)
  if (square.activeEffects && square.activeEffects.length > 0) {
    if (square.activeEffects.includes('buff') && square.activeEffects.includes('debuff')) {
      // Both buff and debuff - use mixed gradient
      classes.push('bg-gradient-to-br', 'from-green-900/40', 'via-stone-800/30', 'to-purple-900/40');
      classes.push('ring-2', 'ring-green-500/50', 'shadow-lg', 'shadow-green-500/20');
    } else if (square.activeEffects.includes('buff')) {
      // Buff only - green highlight
      classes.push('bg-green-900/30', 'ring-2', 'ring-green-500/50', 'shadow-lg', 'shadow-green-500/20');
    } else if (square.activeEffects.includes('debuff')) {
      // Debuff only - purple highlight
      classes.push('bg-purple-900/30', 'ring-2', 'ring-purple-500/50', 'shadow-lg', 'shadow-purple-500/20');
    }
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
  <div class="bg-stone-900/50 backdrop-blur rounded-xl border-2 border-stone-700 p-4">
    <div class="space-y-3">
      <!-- Board Header -->
      <div class="text-center mb-4">
        <h2 class="text-xl font-bold text-yellow-400 mb-1">Battle Board</h2>
        <div class="flex justify-around text-xs text-stone-500">
          <span>🔵 Your Pawn Start (Col 1) → Advance Right →</span>
          <span>← Advance Left ← 🔴 Opponent's Pawn Start (Col 6)</span>
        </div>
      </div>

      <!-- Board Grid with Score Columns on Both Sides -->
      <div
        v-for="(row, rowIndex) in board"
        :key="rowIndex"
        class="flex items-center gap-3"
      >
        <!-- Left Score Column (My Score) -->
        <div
          @click="emit('row-score-click', rowIndex)"
          :class="[
            'flex-shrink-0 w-24 rounded-lg p-2.5 cursor-pointer transition-all duration-200',
            isTifaBoostedRow(rowIndex)
              ? 'bg-gradient-to-r from-red-900/40 to-red-800/30 border-2 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:border-red-400 hover:bg-red-800/50'
              : 'bg-gradient-to-r from-blue-900/30 to-blue-800/20 border-2 border-blue-700 hover:border-orange-500 hover:bg-blue-800/40'
          ]"
        >
          <div class="text-center">
            <!-- Tifa Boost Indicator -->
            <div v-if="isTifaBoostedRow(rowIndex)" class="text-[9px] text-red-400 font-bold uppercase mb-1 animate-pulse">
              🥊 Tifa Boost
            </div>
            <div :class="['text-[10px] uppercase mb-1', isTifaBoostedRow(rowIndex) ? 'text-red-300' : 'text-blue-400']">
              Row {{ rowIndex + 1 }}
            </div>
            <div :class="['text-2xl font-bold mb-1', isTifaBoostedRow(rowIndex) ? 'text-red-200' : 'text-blue-300']">
              {{ myRowScores[rowIndex] }}
            </div>
            <!-- Card Count for Tifa Boost -->
            <div v-if="isTifaBoostedRow(rowIndex)" class="text-[9px] text-red-300 font-bold">
              {{ Math.min(tifaCardCount[rowIndex] || 0, 3) }}/3 Boosted
            </div>
            <div v-else class="text-[9px] text-stone-400">Your Score</div>
          </div>
        </div>

        <!-- Board Row (6 columns) -->
        <div class="grid grid-cols-6">
          <div
            v-for="(square, colIndex) in row"
            :key="`${rowIndex}-${colIndex}`"
            :class="getSquareClasses(square, square.x, square.y)"
            @mouseenter="emit('square-hover', square.x, square.y)"
            @mouseleave="emit('square-hover', null, null)"
            @click="emit('square-click', square.x, square.y)"
            :title="`Position: (${square.x}, ${square.y})`"
          >
            <!-- Special Square Indicator -->
            <div
              v-if="square.special"
              class="absolute top-0 right-0 text-xs bg-purple-600 text-white px-1 rounded-bl z-10"
              :title="square.special.type"
            >
              ⭐
            </div>

            <!-- Buff/Debuff Effect Indicator -->
            <div v-if="square.activeEffects && square.activeEffects.length > 0" class="absolute top-0 left-0 z-10 flex gap-0.5">
              <div
                v-if="square.activeEffects.includes('buff')"
                class="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded-br font-bold shadow-lg"
                title="Buff Effect Active"
              >
                ↑
              </div>
              <div
                v-if="square.activeEffects.includes('debuff')"
                class="text-[10px] bg-purple-600 text-white px-1.5 py-0.5 rounded-br font-bold shadow-lg"
                title="Debuff Effect Active"
              >
                ↓
              </div>
            </div>

            <!-- Card Display -->
            <div v-if="square.card" class="h-full flex flex-col items-center justify-between p-2 bg-gradient-to-br from-stone-800 to-stone-900 rounded-md relative">
              <!-- Card Header (Type Badge) -->
              <div class="w-full flex justify-between items-center">
                <div class="text-xs font-bold px-1.5 py-0.5 rounded" :class="{
                  'bg-green-600 text-white': square.card.cardType === 'buff',
                  'bg-red-600 text-white': square.card.cardType === 'debuff',
                  'bg-yellow-600 text-white': square.card.cardType === 'standard'
                }">
                  <span v-if="square.card.cardType === 'buff'">↑</span>
                  <span v-else-if="square.card.cardType === 'debuff'">↓</span>
                  <span v-else>⚔</span>
                </div>

                <!-- Raw Power Badge (Top Right) -->
                <div
                  v-if="square.card.rawPower !== undefined && square.card.modifiedPower !== undefined && square.card.rawPower !== square.card.modifiedPower"
                  class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-700 text-stone-300 border border-stone-500"
                  :title="`Base Power: ${square.card.rawPower}`"
                >
                  {{ square.card.rawPower }}
                </div>
              </div>

              <!-- Card Power (Center) - Shows Modified Power -->
              <div class="flex flex-col items-center">
                <div
                  :class="[
                    'text-4xl font-bold drop-shadow-lg',
                    getCardTypeColor(square.card.cardType),
                    // Highlight if power changed
                    square.card.rawPower !== undefined && square.card.modifiedPower !== undefined && square.card.rawPower !== square.card.modifiedPower
                      ? (square.card.modifiedPower > square.card.rawPower ? 'text-green-400' : 'text-red-400')
                      : ''
                  ]"
                >
                  {{ square.card.modifiedPower !== undefined ? square.card.modifiedPower : getCardPowerDisplay(square.card) }}
                </div>

                <!-- Power Change Indicator -->
                <div
                  v-if="square.card.rawPower !== undefined && square.card.modifiedPower !== undefined && square.card.rawPower !== square.card.modifiedPower"
                  class="text-[9px] font-bold mt-0.5"
                  :class="square.card.modifiedPower > square.card.rawPower ? 'text-green-400' : 'text-red-400'"
                >
                  {{ square.card.modifiedPower > square.card.rawPower ? '+' : '' }}{{ square.card.modifiedPower - square.card.rawPower }}
                </div>
              </div>

              <!-- Card Name (Footer) -->
              <div class="w-full bg-black/30 rounded px-1 py-0.5">
                <div class="text-[10px] text-stone-300 truncate text-center font-medium">
                  {{ square.card.name }}
                </div>
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

              <!-- Completely empty - show column number -->
              <div v-else class="text-stone-600 text-[10px] font-mono">
                {{ colIndex + 1 }}
              </div>
            </div>

            <!-- Preview Indicators -->
            <div v-if="isPreviewPawn(square.x, square.y)" class="absolute bottom-1 left-1/2 transform -translate-x-1/2 z-20">
              <div class="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-bounce shadow-lg">
                +Pawn
              </div>
            </div>

            <div v-if="isPreviewAbility(square.x, square.y)" class="absolute top-1 left-1/2 transform -translate-x-1/2 z-20">
              <div
                v-if="getPreviewAbilityType(square.x, square.y) === 'buff'"
                class="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg"
              >
                +Buff
              </div>
              <div
                v-else-if="getPreviewAbilityType(square.x, square.y) === 'debuff'"
                class="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg"
              >
                -Debuff
              </div>
              <div
                v-else
                class="bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-lg"
              >
                Effect
              </div>
            </div>
          </div>
        </div>

        <!-- Right Score Column (Opponent Score) -->
        <div class="flex-shrink-0 w-24 bg-gradient-to-r from-red-800/20 to-red-900/30 border-2 border-red-700 rounded-lg p-2.5">
          <div class="text-center">
            <div class="text-[10px] text-red-400 uppercase mb-1">Row {{ rowIndex + 1 }}</div>
            <div class="text-2xl font-bold text-red-300 mb-1">{{ opponentRowScores[rowIndex] }}</div>
            <div class="text-[9px] text-stone-400">Opp Score</div>
          </div>
        </div>
      </div>

      <!-- Instruction Text -->
      <div v-if="selectedCardIndex !== null" class="text-center text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-700 rounded-lg py-2 px-4 animate-pulse">
        <strong>📍 Click once</strong> to preview card placement | <strong>🎯 Click again</strong> to place the card
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Board square sizing - optimized for card display */
.board-square {
  /* Match standard card aspect ratio (roughly 1.4:1 height:width) */
  aspect-ratio: 1 / 1.4;
  width: 100%;
  max-width: 180px;
  min-width: 140px;
}

/* Responsive scaling for different screen sizes */
@media (min-width: 1536px) {
  .board-square {
    max-width: 180px;
    min-height: 180px;
  }
}

@media (max-width: 1280px) {
  .board-square {
    max-width: 160px;
    min-height: 160px;
  }
}

@media (max-width: 1024px) {
  .board-square {
    max-width: 140px;
    min-height: 140px;
  }
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
