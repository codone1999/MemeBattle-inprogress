<script setup>
import { computed } from 'vue';

const props = defineProps({
  hand: {
    type: Array,
    default: () => []
  },
  selectedIndex: {
    type: Number,
    default: null
  },
  isMyTurn: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['card-select']);

const getCardClasses = (index) => {
  const classes = [
    'relative', 'bg-stone-700', 'rounded-lg', 'border-2', 'p-3',
    'transition-all', 'duration-200', 'cursor-pointer', 'flex-shrink-0', 'w-32'
  ];

  if (!props.isMyTurn) {
    classes.push('opacity-50', 'cursor-not-allowed');
  } else if (props.selectedIndex === index) {
    classes.push('border-yellow-500', 'ring-4', 'ring-yellow-500', 'ring-opacity-50', 'transform', 'scale-110', '-translate-y-2', 'shadow-2xl', 'bg-stone-600');
  } else {
    classes.push('border-stone-600', 'hover:border-yellow-400', 'hover:-translate-y-1', 'hover:shadow-xl');
  }

  return classes.join(' ');
};

const getRarityColor = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'from-yellow-600 to-yellow-800';
    case 'epic':
      return 'from-purple-600 to-purple-800';
    case 'rare':
      return 'from-blue-600 to-blue-800';
    default:
      return 'from-stone-600 to-stone-800';
  }
};

const getCardTypeIcon = (cardType) => {
  switch (cardType) {
    case 'buff':
      return '📈';
    case 'debuff':
      return '📉';
    default:
      return '⚔️';
  }
};

const handleCardClick = (index) => {
  if (props.isMyTurn) {
    emit('card-select', index);
  }
};
</script>

<template>
  <div class="overflow-x-auto">
    <div v-if="hand.length === 0" class="text-center py-12 text-stone-500">
      <div class="text-4xl mb-2">🃏</div>
      <p>No cards in hand</p>
    </div>

    <div v-else class="flex gap-3 pb-2">
      <div
        v-for="(card, index) in hand"
        :key="`${card.cardId}-${index}`"
        :class="getCardClasses(index)"
        @click="handleCardClick(index)"
      >
        <!-- Rarity Banner -->
        <div
          :class="[
            'absolute top-0 left-0 right-0 h-1 rounded-t-lg bg-gradient-to-r',
            getRarityColor(card.rarity)
          ]"
        />

        <!-- Card Content -->
        <div class="space-y-2">
          <!-- Power & Type -->
          <div class="flex justify-between items-start">
            <div class="text-3xl font-bold text-yellow-400">
              {{ card.power }}
            </div>
            <div class="text-2xl" :title="card.cardType">
              {{ getCardTypeIcon(card.cardType) }}
            </div>
          </div>

          <!-- Card Name -->
          <div class="text-sm font-bold text-white truncate" :title="card.name">
            {{ card.name }}
          </div>

          <!-- Pawn Requirement -->
          <div class="flex items-center gap-1 text-xs">
            <span class="text-stone-400">Req:</span>
            <div class="flex gap-0.5">
              <span
                v-for="n in card.pawnRequirement"
                :key="n"
                class="text-blue-400"
              >
                ●
              </span>
            </div>
          </div>

          <!-- Rarity Badge -->
          <div class="text-xs text-stone-400 capitalize">
            {{ card.rarity }}
          </div>

          <!-- Ability Badge -->
          <div v-if="card.ability" class="mt-2">
            <div class="bg-stone-900 rounded px-2 py-1 text-xs">
              <div class="text-purple-400 font-bold mb-1">Ability</div>
              <div class="text-stone-400 text-[10px] line-clamp-2">
                {{ card.ability.abilityDescription }}
              </div>
            </div>
          </div>

          <!-- Pawn Locations Preview -->
          <div class="text-xs text-stone-500">
            {{ card.pawnLocations?.length || 0 }} pawn slots
          </div>
        </div>

        <!-- Selected Indicator -->
        <div
          v-if="selectedIndex === index"
          class="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-stone-900 text-xs px-2 py-0.5 rounded-full font-bold animate-bounce"
        >
          Selected
        </div>
      </div>
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

@keyframes bounce {
  0%, 100% {
    transform: translate(-50%, 0);
  }
  50% {
    transform: translate(-50%, -5px);
  }
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}
</style>
