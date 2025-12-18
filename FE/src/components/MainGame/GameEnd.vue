<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import socket from '@/utils/socket';

const props = defineProps({
  gameState: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['return-lobby', 'retry-game']);

const retryRequestData = ref(null);
const showRetryPopup = ref(false);
const retryRequestSent = ref(false);

const isWinner = computed(() => {
  const endResult = props.gameState.endResult;
  if (!endResult) return false;
  return endResult.winnerId === props.gameState.me.userId;
});

const isDraw = computed(() => {
  const endResult = props.gameState.endResult;
  if (!endResult) return false;
  return endResult.winnerId === null;
});

const coinsEarned = computed(() => {
  const endResult = props.gameState.endResult;
  return endResult?.coinsWon || 0;
});

const myScore = computed(() => props.gameState.me.totalScore);
const opponentScore = computed(() => props.gameState.opponent.totalScore);

// Handle retry request
const handleRetryRequest = () => {
  retryRequestSent.value = true;
  emit('retry-game');
};

// Handle retry response (accept/decline)
const handleRetryResponse = (accept) => {
  const response = accept ? 'accept' : 'decline';
  socket.emit('game:retry', {
    gameId: props.gameState.gameId,
    response
  });
  showRetryPopup.value = false;
  retryRequestData.value = null;
};

// Socket listeners
onMounted(() => {
  socket.on('game:retry_request', (data) => {
    console.log('Received retry request:', data);
    retryRequestData.value = data;
    showRetryPopup.value = true;
  });

  socket.on('game:retry_sent', (data) => {
    console.log('Retry request sent:', data);
    retryRequestSent.value = true;
  });

  socket.on('game:retry_declined', (data) => {
    console.log('Retry declined:', data);
    retryRequestSent.value = false;
    retryRequestData.value = null;
    showRetryPopup.value = false;
  });
});

onUnmounted(() => {
  socket.off('game:retry_request');
  socket.off('game:retry_sent');
  socket.off('game:retry_declined');
});
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 p-4">
    <div class="max-w-2xl w-full">

      <!-- Victory -->
      <div v-if="isWinner" class="text-center space-y-8 animate-fade-in">
        <div class="text-8xl animate-bounce">🏆</div>
        <h1 class="text-6xl font-['Creepster'] text-yellow-500">
          Victory!
        </h1>
        <p class="text-2xl text-green-400 font-bold">
          You are the Champion!
        </p>

        <!-- Score Display -->
        <div class="bg-stone-800 border-2 border-yellow-500 rounded-2xl p-8">
          <div class="grid grid-cols-2 gap-8 text-center">
            <div>
              <div class="text-4xl font-bold text-blue-400 mb-2">{{ myScore }}</div>
              <div class="text-sm text-stone-400">Your Score</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-red-400 mb-2">{{ opponentScore }}</div>
              <div class="text-sm text-stone-400">Opponent Score</div>
            </div>
          </div>

          <!-- Coins Earned -->
          <div class="mt-6 pt-6 border-t border-stone-700">
            <div class="text-5xl mb-2">🪙</div>
            <div class="text-3xl font-bold text-yellow-400">+{{ coinsEarned }} Coins</div>
            <div class="text-sm text-stone-400 mt-2">Added to your account</div>
          </div>
        </div>
      </div>

      <!-- Defeat -->
      <div v-else-if="!isDraw" class="text-center space-y-8 animate-fade-in">
        <div class="text-8xl">💔</div>
        <h1 class="text-6xl font-['Creepster'] text-red-500">
          Defeat
        </h1>
        <p class="text-2xl text-stone-400">
          Better luck next time!
        </p>

        <!-- Score Display -->
        <div class="bg-stone-800 border-2 border-red-500 rounded-2xl p-8">
          <div class="grid grid-cols-2 gap-8 text-center">
            <div>
              <div class="text-4xl font-bold text-blue-400 mb-2">{{ myScore }}</div>
              <div class="text-sm text-stone-400">Your Score</div>
            </div>
            <div>
              <div class="text-4xl font-bold text-red-400 mb-2">{{ opponentScore }}</div>
              <div class="text-sm text-stone-400">Opponent Score</div>
            </div>
          </div>

          <div class="mt-6 pt-6 border-t border-stone-700 text-stone-500">
            No coins awarded
          </div>
        </div>
      </div>

      <!-- Draw -->
      <div v-else class="text-center space-y-8 animate-fade-in">
        <div class="text-8xl">🤝</div>
        <h1 class="text-6xl font-['Creepster'] text-yellow-500">
          Draw!
        </h1>
        <p class="text-2xl text-stone-400">
          Evenly matched!
        </p>

        <!-- Score Display -->
        <div class="bg-stone-800 border-2 border-yellow-500 rounded-2xl p-8">
          <div class="text-center">
            <div class="text-5xl font-bold text-yellow-400 mb-2">{{ myScore }}</div>
            <div class="text-sm text-stone-400">Final Score (Both Players)</div>
          </div>

          <div class="mt-6 pt-6 border-t border-stone-700 text-stone-500">
            No coins awarded in a draw
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-8 space-y-4">
        <!-- Waiting for Opponent Status -->
        <div v-if="retryRequestSent" class="bg-stone-800 border-2 border-yellow-600 rounded-xl p-6 mb-4">
          <div class="text-center">
            <h3 class="text-lg font-bold text-yellow-400 mb-2">⏳ Waiting for opponent...</h3>
            <p class="text-sm text-stone-400">Your play again request has been sent</p>
            <div class="mt-4">
              <div class="text-5xl mb-2 animate-pulse">🎲</div>
            </div>
          </div>
        </div>

        <!-- Play Again Button -->
        <button
          v-if="!retryRequestSent"
          @click="handleRetryRequest"
          class="w-full py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-black uppercase rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all"
        >
          🎲 Play Again
        </button>

        <!-- Cancel Request Button -->
        <button
          v-else
          @click="handleRetryResponse(false)"
          class="w-full py-4 bg-stone-600 hover:bg-stone-500 text-white text-xl font-black uppercase rounded-xl border-b-8 border-stone-800 active:border-b-0 active:translate-y-2 transition-all"
        >
          ✗ Cancel Request
        </button>

        <button
          @click="$router.push('/inventory')"
          class="w-full py-3 bg-yellow-600 hover:bg-yellow-500 text-white font-bold uppercase rounded-xl border-b-4 border-yellow-900 active:border-b-0 active:translate-y-1 transition-all"
        >
          📦 Return to Inventory
        </button>

        <button
          @click="emit('return-lobby')"
          class="w-full py-3 bg-stone-700 hover:bg-stone-600 text-stone-300 font-bold uppercase rounded-xl border border-stone-600 transition-all"
        >
          Back to Lobby
        </button>
      </div>

      <!-- Play Again Request Popup -->
      <div
        v-if="showRetryPopup"
        class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        @click.self="handleRetryResponse(false)"
      >
        <div class="bg-gradient-to-br from-stone-800 to-stone-900 rounded-2xl border-4 border-green-500 p-8 max-w-md w-full shadow-2xl animate-fade-in">
          <div class="text-center">
            <div class="text-7xl mb-4 animate-bounce">🎲</div>
            <h2 class="text-3xl font-bold text-green-400 mb-3">Play Again?</h2>
            <p class="text-xl text-stone-300 mb-6">
              <strong class="text-yellow-400">{{ retryRequestData?.requesterName }}</strong> wants to play again!
            </p>

            <div class="space-y-3">
              <button
                @click="handleRetryResponse(true)"
                class="w-full py-4 bg-green-600 hover:bg-green-500 text-white text-xl font-black uppercase rounded-xl border-b-8 border-green-900 active:border-b-0 active:translate-y-2 transition-all shadow-[0_0_30px_rgba(34,197,94,0.3)]"
              >
                ✓ Accept
              </button>
              <button
                @click="handleRetryResponse(false)"
                class="w-full py-3 bg-stone-700 hover:bg-stone-600 text-stone-300 font-bold uppercase rounded-xl border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all"
              >
                ✗ Decline
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-30px);
  }
}

.animate-bounce {
  animation: bounce 1.5s ease-in-out infinite;
}
</style>
