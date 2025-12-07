<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  gameState: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['roll']);

const isRolling = ref(false);
const showResult = ref(false);

const myPlayer = computed(() => props.gameState.me);
const opponentPlayer = computed(() => props.gameState.opponent);

const canRoll = computed(() => !myPlayer.value.hasRolled);

const handleRoll = () => {
  isRolling.value = true;
  emit('roll');

  setTimeout(() => {
    isRolling.value = false;
    showResult.value = true;
  }, 1500);
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 p-4">
    <div class="max-w-4xl w-full">

      <!-- Title -->
      <div class="text-center mb-12">
        <h1 class="text-6xl font-['Creepster'] text-yellow-500 mb-4 animate-pulse">
          Roll for Initiative
        </h1>
        <p class="text-xl text-stone-400">
          Roll 2 dice to determine who goes first!
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

        <!-- Your Roll -->
        <div class="bg-blue-900/20 border-4 border-blue-900 rounded-2xl p-8 text-center">
          <div class="flex items-center justify-center gap-4 mb-6">
            <img
              :src="myPlayer.profilePic || 'https://placehold.co/60'"
              class="w-16 h-16 rounded-full border-2 border-blue-500"
              alt="You"
            />
            <div class="text-left">
              <h3 class="text-2xl font-bold text-blue-300">{{ myPlayer.username }}</h3>
              <p class="text-sm text-stone-400">(You)</p>
            </div>
          </div>

          <!-- Dice Display -->
          <div v-if="myPlayer.hasRolled && myPlayer.diceDetails" class="my-8">
            <div class="flex justify-center gap-4 mb-4">
              <div class="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center text-6xl animate-bounce">
                🎲
              </div>
              <div class="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center text-6xl animate-bounce" style="animation-delay: 0.1s">
                🎲
              </div>
            </div>
            <div class="text-sm text-stone-400 mb-2">
              {{ myPlayer.diceDetails.dice1 }} + {{ myPlayer.diceDetails.dice2 }}
            </div>
            <div class="text-6xl font-bold text-blue-400">
              {{ myPlayer.diceRoll }}
            </div>
            <div v-if="!opponentPlayer.hasRolled" class="mt-4 text-yellow-400 animate-pulse">
              Waiting for opponent...
            </div>
          </div>

          <!-- Roll Button -->
          <button
            v-else-if="canRoll"
            @click="handleRoll"
            :disabled="isRolling"
            class="w-full py-6 bg-blue-600 hover:bg-blue-500 disabled:bg-stone-700 text-white text-2xl font-black uppercase rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.5)] border-b-8 border-blue-900 active:border-b-0 active:translate-y-2 transition-all"
          >
            {{ isRolling ? '🎲 Rolling...' : '🎲 Roll Dice!' }}
          </button>

          <!-- Waiting State -->
          <div v-else class="my-8 text-stone-500">
            <div class="text-4xl mb-2">⏳</div>
            <p>Ready to roll...</p>
          </div>
        </div>

        <!-- Opponent's Roll -->
        <div class="bg-red-900/20 border-4 border-red-900 rounded-2xl p-8 text-center">
          <div class="flex items-center justify-center gap-4 mb-6">
            <img
              :src="opponentPlayer.profilePic || 'https://placehold.co/60'"
              class="w-16 h-16 rounded-full border-2 border-red-500"
              alt="Opponent"
            />
            <div class="text-left">
              <h3 class="text-2xl font-bold text-red-300">{{ opponentPlayer.username }}</h3>
              <p class="text-sm text-stone-400">(Opponent)</p>
            </div>
          </div>

          <!-- Dice Display -->
          <div v-if="opponentPlayer.hasRolled && opponentPlayer.diceDetails" class="my-8">
            <div class="flex justify-center gap-4 mb-4">
              <div class="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center text-6xl animate-bounce">
                🎲
              </div>
              <div class="w-24 h-24 bg-white rounded-xl shadow-lg flex items-center justify-center text-6xl animate-bounce" style="animation-delay: 0.1s">
                🎲
              </div>
            </div>
            <div class="text-sm text-stone-400 mb-2">
              {{ opponentPlayer.diceDetails.dice1 }} + {{ opponentPlayer.diceDetails.dice2 }}
            </div>
            <div class="text-6xl font-bold text-red-400">
              {{ opponentPlayer.diceRoll }}
            </div>
          </div>

          <!-- Waiting State -->
          <div v-else class="my-8 text-stone-500">
            <div class="text-4xl mb-2 animate-pulse">🎲</div>
            <p>Waiting to roll...</p>
          </div>
        </div>
      </div>

      <!-- Result Display -->
      <div v-if="myPlayer.hasRolled && opponentPlayer.hasRolled" class="mt-12 text-center">
        <div class="bg-stone-800 border-2 border-yellow-500 rounded-2xl p-8">
          <div v-if="myPlayer.diceRoll > opponentPlayer.diceRoll" class="space-y-4">
            <div class="text-6xl">🎉</div>
            <h2 class="text-4xl font-bold text-green-400">You Go First!</h2>
            <p class="text-stone-400">You rolled higher and will make the first move</p>
          </div>

          <div v-else-if="opponentPlayer.diceRoll > myPlayer.diceRoll" class="space-y-4">
            <div class="text-6xl">🎲</div>
            <h2 class="text-4xl font-bold text-red-400">Opponent Goes First</h2>
            <p class="text-stone-400">Opponent rolled higher and will make the first move</p>
          </div>

          <div v-else class="space-y-4">
            <div class="text-6xl animate-bounce">🔄</div>
            <h2 class="text-4xl font-bold text-yellow-400">It's a Tie!</h2>
            <p class="text-stone-400">Rolling again in a moment...</p>
          </div>

          <div class="mt-6 text-sm text-stone-500">
            Game starting...
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-bounce {
  animation: bounce 1s ease-in-out infinite;
}
</style>
