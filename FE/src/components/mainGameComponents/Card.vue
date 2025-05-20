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
  if (cardProps.Ability === 'buff') {
    return 'bg-green-700';
  } else if (cardProps.Ability === 'debuff') {
    return 'bg-purple-700';
  } else {
    return 'bg-gray-700'; 
  }
});

</script>

<template>
  <div
    class="relative w-60 h-90 bg-gray-800 border-4 border-gray-600 shadow-lg transition-transform duration-150"
    :class="cardProps.size"
  >
    <div
      class="absolute top-2 left-2 bg-yellow-500 text-black text-4xl flex items-center justify-center rounded z-15"
    >
      <div v-for="n in parseInt(cardProps.pawnsRequired)" :key="n">
        ♙
      </div>
    </div>
    <div class="absolute top-1.5 right-1.5 flex flex-col items-center z-10">
      <div class="w-12 h-12 bg-gray-700 text-2xl text-yellow-500 font-bold flex items-center justify-center rounded-full">
        {{ cardProps.score }}
      </div>
      <div v-if="cardProps.Ability" :class="['text-1x1 font-semibold mt-1 w-12 h-12 flex items-center justify-center rounded-full', abilityColor]">
        {{ cardProps.Ability }}
      </div>
    </div>

    <div class="relative w-full h-full">
      <img
        :src="cardProps.imageUrl"
        alt="Card Image"
        class="absolute inset-0 w-full h-full z-0 rounded-lg"
      />

      <div class="absolute bottom-15 left-1/2 -translate-x-1/2 z-10">
        <div class="grid grid-cols-5 gap-1 bg-black p-1">
          <template v-for="i in 25" :key="i">
            <div
              class="w-3.5 h-3.5 bg-gray-600"
              :class="{
                'bg-yellow-400': cardProps.pawnLocations.includes(i),
                'bg-white': i === 13,
              }"
            ></div>
          </template>
        </div>
      </div>
    </div>

    <div class="absolute bottom-2 w-full text-center text-lg text-yellow-300 font-semibold">
      </div>
  </div>
</template>