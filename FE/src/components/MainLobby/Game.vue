<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';
import socket from '@/utils/socket';
import DiceRoll from './DiceRoll.vue';
import GameBoard from './GameBoard.vue';
import PlayerHand from './PlayerHand.vue';
import GameEnd from './GameEnd.vue';

const route = useRoute();
const router = useRouter();
const gameId = route.params.gameId;

// --- State ---
const gameState = ref(null);
const isLoading = ref(true);
const selectedCardIndex = ref(null);
const hoveredSquare = ref(null);
const previewData = ref({ pawnLocations: [], abilityLocations: [] });
const errorMessage = ref('');
const isMyTurn = computed(() => {
  return gameState.value?.currentTurn === gameState.value?.me?.userId;
});

// --- Socket Handlers ---
const setupSocketListeners = () => {
  // Join game
  if (socket.connected) {
    socket.emit('game:join', { gameId });
  }

  // Initial game load
  socket.on('game:load', (state) => {
    console.log('Game loaded:', state);
    gameState.value = state;
    isLoading.value = false;
  });

  // Game state updates
  socket.on('game:state:update', (state) => {
    console.log('Game state updated:', state);
    gameState.value = state;
    selectedCardIndex.value = null; // Deselect card after action
    previewData.value = { pawnLocations: [], abilityLocations: [] };
  });

  // Dice roll events
  socket.on('game:dice_roll:start', ({ message }) => {
    console.log('Dice roll start:', message);
  });

  socket.on('game:dice_roll:wait', ({ myRoll, diceDetails, message }) => {
    console.log('Waiting for opponent:', myRoll, diceDetails);
  });

  socket.on('game:dice_roll:result', (result) => {
    console.log('Dice roll result:', result);
  });

  // Card preview
  socket.on('game:action:preview', (preview) => {
    if (preview.isValid) {
      previewData.value = {
        pawnLocations: preview.pawnLocations || [],
        abilityLocations: preview.abilityLocations || []
      };
    } else {
      errorMessage.value = preview.message;
      setTimeout(() => errorMessage.value = '', 2000);
    }
  });

  // Game end
  socket.on('game:end', (result) => {
    console.log('Game ended:', result);
    if (gameState.value) {
      gameState.value.phase = 'ended';
      gameState.value.endResult = result;
    }
  });

  // Errors
  socket.on('game:error', ({ message }) => {
    errorMessage.value = message;
    setTimeout(() => errorMessage.value = '', 3000);
  });

  // Connect
  socket.connect();

  socket.on('connect', () => {
    console.log('Socket connected, joining game:', gameId);
    socket.emit('game:join', { gameId });
  });
};

// --- Actions ---
const handleDiceRoll = () => {
  socket.emit('game:dice_roll:submit');
};

const handleCardSelect = (index) => {
  if (!isMyTurn.value) return;
  selectedCardIndex.value = selectedCardIndex.value === index ? null : index;
  previewData.value = { pawnLocations: [], abilityLocations: [] };
};

const handleSquareHover = (x, y) => {
  if (!isMyTurn.value || selectedCardIndex.value === null) {
    previewData.value = { pawnLocations: [], abilityLocations: [] };
    return;
  }

  const card = gameState.value.me.hand[selectedCardIndex.value];
  if (card) {
    socket.emit('game:action:hover', {
      cardId: card.cardId,
      x,
      y
    });
  }
};

const handleSquareClick = (x, y) => {
  if (!isMyTurn.value || selectedCardIndex.value === null) return;

  const card = gameState.value.me.hand[selectedCardIndex.value];
  if (card) {
    socket.emit('game:action:play_card', {
      cardId: card.cardId,
      handCardIndex: selectedCardIndex.value,
      x,
      y
    });
  }
};

const handleSkipTurn = () => {
  if (!isMyTurn.value) return;
  if (confirm('Skip your turn and draw 1 card?')) {
    socket.emit('game:action:skip_turn');
  }
};

const handleLeaveGame = () => {
  if (confirm('Leave the game? This will count as a forfeit.')) {
    socket.emit('game:leave', { gameId });
    router.push('/lobby');
  }
};

// --- Lifecycle ---
onMounted(() => {
  setupSocketListeners();
});

onUnmounted(() => {
  if (socket.connected) {
    socket.emit('game:leave', { gameId });
    socket.off();
    socket.disconnect();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-stone-900 text-yellow-100 font-sans-custom">

    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center h-screen">
      <div class="animate-spin text-6xl mb-4">⚔️</div>
      <p class="text-xl animate-pulse">Entering the Arena...</p>
    </div>

    <!-- Game Content -->
    <div v-else-if="gameState" class="relative">

      <!-- Error Toast -->
      <div v-if="errorMessage" class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-bounce">
        ⚠️ {{ errorMessage }}
      </div>

      <!-- Dice Roll Phase -->
      <DiceRoll
        v-if="gameState.phase === 'dice_roll'"
        :game-state="gameState"
        @roll="handleDiceRoll"
      />

      <!-- Playing Phase -->
      <div v-else-if="gameState.phase === 'playing'" class="container mx-auto px-4 py-6 max-w-7xl">

        <!-- Header -->
        <header class="flex justify-between items-center mb-6 bg-stone-800/50 backdrop-blur p-4 rounded-xl border border-stone-700">
          <div class="flex items-center gap-4">
            <h1 class="text-2xl font-['Creepster'] text-yellow-500">Queen's Blood</h1>
            <span class="text-sm text-stone-400">Turn {{ gameState.turnNumber }}</span>
          </div>

          <div class="flex items-center gap-4">
            <div :class="[
              'px-4 py-2 rounded-lg font-bold uppercase text-sm border-2',
              isMyTurn
                ? 'bg-green-900 border-green-500 text-green-300 animate-pulse'
                : 'bg-stone-900 border-stone-600 text-stone-400'
            ]">
              {{ isMyTurn ? '🎯 Your Turn' : '⏳ Opponent\'s Turn' }}
            </div>

            <button
              @click="handleLeaveGame"
              class="bg-stone-700 hover:bg-stone-600 px-4 py-2 rounded border border-stone-600 text-stone-300 text-sm uppercase"
            >
              Leave
            </button>
          </div>
        </header>

        <!-- Opponent Info (Top) -->
        <div class="bg-red-900/20 border-2 border-red-900 rounded-xl p-4 mb-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <img
                :src="gameState.opponent.profilePic || 'https://placehold.co/60'"
                class="w-12 h-12 rounded-full border-2 border-red-500"
                alt="Opponent"
              />
              <div>
                <h3 class="text-lg font-bold text-red-300">{{ gameState.opponent.username }}</h3>
                <div class="flex gap-2 text-xs text-stone-400">
                  <span>🃏 Hand: {{ gameState.opponent.handCount }}</span>
                  <span>📦 Deck: {{ gameState.opponent.deckCount }}</span>
                </div>
              </div>
            </div>

            <!-- Opponent Score -->
            <div class="text-right">
              <div class="text-3xl font-bold text-red-400">{{ gameState.opponent.totalScore }}</div>
              <div class="text-xs text-stone-400">Total Score</div>
              <div class="flex gap-1 mt-1">
                <div
                  v-for="(score, idx) in gameState.opponent.rowScores"
                  :key="idx"
                  class="bg-stone-800 px-2 py-1 rounded text-xs"
                >
                  R{{ idx }}: {{ score }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Game Board -->
        <GameBoard
          :board="gameState.board"
          :preview-pawn-locations="previewData.pawnLocations"
          :preview-ability-locations="previewData.abilityLocations"
          :selected-card-index="selectedCardIndex"
          @square-hover="handleSquareHover"
          @square-click="handleSquareClick"
        />

        <!-- Player Info (Bottom) -->
        <div class="bg-blue-900/20 border-2 border-blue-900 rounded-xl p-4 mt-4 mb-4">
          <div class="flex justify-between items-center">
            <div class="flex items-center gap-4">
              <img
                :src="gameState.me.profilePic || 'https://placehold.co/60'"
                class="w-12 h-12 rounded-full border-2 border-blue-500"
                alt="You"
              />
              <div>
                <h3 class="text-lg font-bold text-blue-300">{{ gameState.me.username }} (You)</h3>
                <div class="flex gap-2 text-xs text-stone-400">
                  <span>🃏 Hand: {{ gameState.me.hand.length }}</span>
                  <span>📦 Deck: {{ gameState.me.deckCount }}</span>
                  <span>🚫 Skips: {{ gameState.me.consecutiveSkips }}/3</span>
                </div>
              </div>
            </div>

            <!-- Player Score -->
            <div class="text-right">
              <div class="text-3xl font-bold text-blue-400">{{ gameState.me.totalScore }}</div>
              <div class="text-xs text-stone-400">Total Score</div>
              <div class="flex gap-1 mt-1">
                <div
                  v-for="(score, idx) in gameState.me.rowScores"
                  :key="idx"
                  class="bg-stone-800 px-2 py-1 rounded text-xs"
                >
                  R{{ idx }}: {{ score }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Player Hand & Actions -->
        <div class="bg-stone-800/50 backdrop-blur rounded-xl border border-stone-700 p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-bold text-yellow-400">Your Hand</h3>
            <button
              @click="handleSkipTurn"
              :disabled="!isMyTurn || gameState.me.consecutiveSkips >= 3"
              class="bg-stone-700 hover:bg-stone-600 disabled:bg-stone-800 disabled:text-stone-600 px-6 py-2 rounded border-b-4 border-stone-900 disabled:border-stone-900 active:translate-y-1 active:border-b-0 transition-all uppercase font-bold text-sm"
            >
              {{ gameState.me.consecutiveSkips >= 3 ? 'Skip Limit Reached' : 'Skip Turn (Draw Card)' }}
            </button>
          </div>

          <PlayerHand
            :hand="gameState.me.hand"
            :selected-index="selectedCardIndex"
            :is-my-turn="isMyTurn"
            @card-select="handleCardSelect"
          />
        </div>
      </div>

      <!-- Game End Phase -->
      <GameEnd
        v-else-if="gameState.phase === 'ended'"
        :game-state="gameState"
        @return-lobby="router.push('/lobby')"
      />
    </div>
  </div>
</template>

<style scoped>
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
