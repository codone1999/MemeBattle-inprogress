<script setup>
import CardDisplay from './CardDisplay.vue';

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

    <div v-else class="flex gap-4 pb-2 px-2">
      <CardDisplay
        v-for="(card, index) in hand"
        :key="`${card.cardId}-${index}`"
        :card="card"
        :selected="selectedIndex === index"
        :disabled="!isMyTurn"
        :show-grid="true"
        size="normal"
        @click="handleCardClick(index)"
      />
    </div>
  </div>
</template>

