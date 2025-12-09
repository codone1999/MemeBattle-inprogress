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

    // If opponent left/disconnected, redirect to lobby after showing end screen
    if (result.redirectToLobby) {
      setTimeout(() => {
        router.push('/lobby');
      }, 4000);
    }
  });

  // Force leave (when opponent leaves)
  socket.on('game:force_leave', ({ message }) => {
    console.log('Force leave:', message);
    router.push('/lobby');
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
  const confirmMessage = 'Are you sure you want to leave?\n\n⚠️ Leaving will:\n• Count as a forfeit\n• Give your opponent the win\n• End the game immediately\n\nDo you want to leave?';

  if (confirm(confirmMessage)) {
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
      <div v-else-if="gameState.phase === 'playing'" class="w-full min-h-screen p-4">

        <!-- Header -->
        <header class="flex justify-between items-center mb-4 bg-stone-800/50 backdrop-blur p-4 rounded-xl border border-stone-700">
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

        <!-- Main Game Area: Horizontal Layout -->
        <div class="w-full space-y-4">

          <!-- Three Column Layout: My Character | Board | Opponent Character -->
          <div class="flex gap-4 items-stretch">

            <!-- Left Column: My Character Banner (Full Height) -->
            <div
              class="flex-shrink-0 w-64 rounded-xl border-4 border-blue-500 shadow-2xl overflow-hidden relative"
              :style="{
                backgroundImage: `linear-gradient(to bottom, rgba(30, 58, 138, 0.85) 0%, rgba(30, 58, 138, 0.95) 100%), url('${gameState.me.character?.characterPic || '/characters/default-character.png'}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }"
            >
              <div class="relative z-10 p-4 flex flex-col justify-between h-full min-h-[600px]">
                <!-- Action Buttons (Top) -->
                <div class="w-full space-y-2">
                  <button class="w-full bg-blue-700/90 hover:bg-blue-600 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50 shadow-lg transition-all border-2 border-blue-400" disabled>
                    🎭 Character Skill
                  </button>
                  <button
                    @click="handleSkipTurn"
                    :disabled="!isMyTurn || gameState.me.consecutiveSkips >= 3"
                    class="w-full bg-stone-700/90 hover:bg-stone-600 disabled:bg-stone-900/90 disabled:text-stone-500 backdrop-blur-sm px-3 py-2 rounded-lg border-b-4 border-stone-900 disabled:border-stone-900 active:translate-y-1 active:border-b-0 transition-all uppercase font-bold text-xs shadow-lg border-2 border-stone-500"
                  >
                    {{ gameState.me.consecutiveSkips >= 3 ? '⛔ Skip Limit' : '⏭️ Skip Turn' }}
                  </button>
                </div>

                <!-- Player Info (Bottom) -->
                <div class="text-center space-y-2">
                  <!-- Character Name -->
                  <div class="bg-blue-800/70 backdrop-blur-sm rounded-lg p-2 border-2 border-blue-300">
                    <div class="text-[9px] text-blue-200 uppercase tracking-wide mb-0.5">Character</div>
                    <div class="text-sm font-bold text-blue-50">
                      {{ gameState.me.character?.name || 'Character' }}
                    </div>
                  </div>

                  <!-- Player Name -->
                  <div class="bg-blue-900/80 backdrop-blur-sm rounded-lg p-2 border-2 border-blue-400">
                    <h3 class="text-base font-bold text-blue-100">
                      {{ gameState.me.username }}
                    </h3>
                    <span class="block text-yellow-300 text-xs mt-0.5 font-semibold">(You)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Center Column: Game Board (Larger) -->
            <div class="flex-grow min-w-0">
              <GameBoard
                :board="gameState.board"
                :my-row-scores="gameState.me.rowScores"
                :opponent-row-scores="gameState.opponent.rowScores"
                :preview-pawn-locations="previewData.pawnLocations"
                :preview-ability-locations="previewData.abilityLocations"
                :selected-card-index="selectedCardIndex"
                @square-hover="handleSquareHover"
                @square-click="handleSquareClick"
              />
            </div>

            <!-- Right Column: Opponent Character Banner (Full Height) -->
            <div
              class="flex-shrink-0 w-64 rounded-xl border-4 border-red-500 shadow-2xl overflow-hidden relative"
              :style="{
                backgroundImage: `linear-gradient(to bottom, rgba(127, 29, 29, 0.85) 0%, rgba(127, 29, 29, 0.95) 100%), url('${gameState.opponent.character?.characterPic || '/characters/default-character.png'}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }"
            >
              <div class="relative z-10 p-4 flex flex-col justify-between h-full min-h-[600px]">
                <!-- Opponent Action Button (Top) -->
                <div class="w-full">
                  <button class="w-full bg-red-700/90 hover:bg-red-600 backdrop-blur-sm px-3 py-2 rounded-lg text-xs font-bold uppercase disabled:opacity-50 shadow-lg transition-all border-2 border-red-400" disabled>
                    🎭 Character Skill
                  </button>
                </div>

                <!-- Opponent Info (Bottom) -->
                <div class="text-center space-y-2">
                  <!-- Character Name -->
                  <div class="bg-red-800/70 backdrop-blur-sm rounded-lg p-2 border-2 border-red-300">
                    <div class="text-[9px] text-red-200 uppercase tracking-wide mb-0.5">Character</div>
                    <div class="text-sm font-bold text-red-50">
                      {{ gameState.opponent.character?.name || 'Character' }}
                    </div>
                  </div>

                  <!-- Opponent Name -->
                  <div class="bg-red-900/80 backdrop-blur-sm rounded-lg p-2 border-2 border-red-400">
                    <h3 class="text-base font-bold text-red-100">
                      {{ gameState.opponent.username }}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Player Hand Cards (Full Width Below) -->
          <div class="w-full bg-stone-800/50 backdrop-blur rounded-xl border border-stone-700 p-6">
            <h3 class="text-xl font-bold text-yellow-400 mb-4 text-center">Your Hand</h3>
            <PlayerHand
              :hand="gameState.me.hand"
              :selected-index="selectedCardIndex"
              :is-my-turn="isMyTurn"
              @card-select="handleCardSelect"
            />
          </div>

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
