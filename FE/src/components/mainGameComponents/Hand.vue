<script setup>
import { defineProps, defineEmits } from "vue";
import Card from "./Card.vue";

//Receive from GameManager
const handProps = defineProps({
  player: {
    type: Number,
    required: true
  },
  currentTurn: {
    type: Number,
    required: true
  },
  hand: {
    type: Array,
    required: true
  }
});

const emits = defineEmits(["selectCard"]);

// Select a Card (give to GameManager.vue)
const selectCard = (card) => {
  if (handProps.player === handProps.currentTurn) {
    emits("selectCard", card);
  }
};

const hoverCardSound = '/sounds/se/cardhover.mp3';

const playHoverCard = () => {
    const cardsound = new Audio(hoverCardSound)
    cardsound.volume = 0.3
    cardsound.currentTime = 0
    cardsound.play()//.catch(error => console.log("Sound play error:", error))
}
</script>

<template>
  <div class="scale-75 max-w-210 flex p-3 gap-3 -mx-25 bg-gray-900 border-t border-gray-700 rounded-lg overflow-x-auto max-xl:scale-60 max-md:scale-50">
    <div
      v-for="(card, index) in hand"
      :key="index"
      @mouseenter="playHoverCard"
      @click="selectCard(card)"
      class="cursor-pointer transition-full duration-100 hover:scale-90 active:scale-90"
      :class="{
        'border-4 border-blue-500 shadow-lg': player === 1 && currentTurn === 1,
        'border-4 border-red-500 shadow-lg': player === 2 && currentTurn === 2,
      }"
    >
      <Card
        :title="card.cardname"
        :imageUrl="`/cards/${card.idcard}.png`"
        :score="card.Power"
        :pawnsRequired="card.pawnsRequired"
        :pawnLocations="card.pawnLocations"
        :Ability="card.abilityType"
      />
    </div>
  </div>
</template>
