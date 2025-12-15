<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white p-8">
    <!-- Header -->
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <button
          @click="goBack"
          class="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-bold transition-all active:translate-y-1"
        >
          ← Back to Inventory
        </button>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 bg-yellow-600 px-6 py-3 rounded-lg shadow-lg">
            <span class="text-2xl">🪙</span>
            <span class="font-bold text-xl">{{ userCoins }}</span>
            <span class="text-sm opacity-80">Coins</span>
          </div>
        </div>
      </div>

      <!-- Pity Counter Display -->
      <div class="bg-gray-800 rounded-lg p-6 mb-8 shadow-xl">
        <h3 class="text-xl font-bold mb-4">Pull Progress</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-purple-900/30 p-4 rounded-lg border-2 border-purple-500">
            <div class="flex justify-between items-center mb-2">
              <span class="text-purple-300">Epic Guarantee</span>
              <span class="font-bold">{{ pityCounters.pullsSinceLastEpic }} / 10</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-3">
              <div
                class="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                :style="{ width: `${(pityCounters.pullsSinceLastEpic / 10) * 100}%` }"
              ></div>
            </div>
          </div>

          <div class="bg-yellow-900/30 p-4 rounded-lg border-2 border-yellow-500">
            <div class="flex justify-between items-center mb-2">
              <span class="text-yellow-300">Legendary Guarantee</span>
              <span class="font-bold">{{ pityCounters.pullsSinceLastLegendary }} / 180</span>
            </div>
            <div class="w-full bg-gray-700 rounded-full h-3">
              <div
                class="bg-gradient-to-r from-yellow-500 to-yellow-600 h-3 rounded-full transition-all duration-500"
                :style="{ width: `${(pityCounters.pullsSinceLastLegendary / 180) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
        <div class="mt-4 text-center text-sm text-gray-400">
          Total Pulls: {{ pityCounters.totalPulls }}
        </div>
      </div>

      <!-- Pull Buttons -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Single Pull -->
        <div class="bg-gradient-to-br from-blue-900 to-blue-800 p-8 rounded-xl shadow-2xl border-2 border-blue-500">
          <div class="text-center">
            <h2 class="text-3xl font-bold mb-4">Single Pull</h2>
            <div class="text-6xl mb-4">🎴</div>
            <div class="mb-6">
              <div class="text-4xl font-bold text-yellow-400 mb-2">1 🪙</div>
              <div class="text-sm text-gray-300">Pull 1 card</div>
              <div class="text-xs text-gray-400 mt-2">Epic: 10% | Legendary: 2%</div>
            </div>
            <button
              @click="doPull('single')"
              :disabled="isPulling || userCoins < 1"
              class="w-full px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-bold text-xl transition-all shadow-lg hover:shadow-xl active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPulling ? 'Pulling...' : 'Pull x1' }}
            </button>
          </div>
        </div>

        <!-- 10 Pull -->
        <div class="bg-gradient-to-br from-purple-900 to-purple-800 p-8 rounded-xl shadow-2xl border-2 border-purple-500 relative overflow-hidden">
          <div class="absolute top-2 right-2 bg-yellow-500 text-black px-3 py-1 rounded-full text-xs font-bold">
            GUARANTEED EPIC
          </div>
          <div class="text-center">
            <h2 class="text-3xl font-bold mb-4">10 Pull</h2>
            <div class="text-6xl mb-4">🎴✨</div>
            <div class="mb-6">
              <div class="text-4xl font-bold text-yellow-400 mb-2">10 🪙</div>
              <div class="text-sm text-gray-300">Pull 10 cards</div>
              <div class="text-xs text-yellow-300 mt-2 font-semibold">At least 1 Epic guaranteed!</div>
            </div>
            <button
              @click="doPull('multi')"
              :disabled="isPulling || userCoins < 10"
              class="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg font-bold text-xl transition-all shadow-lg hover:shadow-xl active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPulling ? 'Pulling...' : 'Pull x10' }}
            </button>
          </div>
        </div>

        <!-- Special Banner -->
        <div class="bg-gradient-to-br from-orange-900 to-red-800 p-8 rounded-xl shadow-2xl border-2 border-orange-500 relative overflow-hidden">
          <div class="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
            SPECIAL RATES
          </div>
          <div class="text-center">
            <h2 class="text-3xl font-bold mb-4">Special Banner</h2>
            <div class="text-6xl mb-4">⭐🎴⭐</div>
            <div class="mb-6">
              <div class="text-4xl font-bold text-yellow-400 mb-2">20 🪙</div>
              <div class="text-sm text-gray-300">Pull 1 premium card/character</div>
              <div class="text-xs text-orange-300 mt-2 font-semibold">Better rates! No pity needed!</div>
              <div class="text-xs text-gray-400 mt-1">Legendary: 15% | Epic: 25%</div>
            </div>
            <button
              @click="doPull('special')"
              :disabled="isPulling || userCoins < 20"
              class="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 rounded-lg font-bold text-xl transition-all shadow-lg hover:shadow-xl active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isPulling ? 'Pulling...' : 'Pull Special' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Drop Rates Info -->
      <div class="bg-gray-800 rounded-lg p-6 shadow-xl mb-6">
        <h3 class="text-xl font-bold mb-4">Standard Banner Rates</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-gray-700 rounded">
            <div class="text-yellow-500 font-bold text-lg">Legendary</div>
            <div class="text-2xl">2%</div>
          </div>
          <div class="text-center p-3 bg-gray-700 rounded">
            <div class="text-purple-500 font-bold text-lg">Epic</div>
            <div class="text-2xl">10%</div>
          </div>
          <div class="text-center p-3 bg-gray-700 rounded">
            <div class="text-blue-500 font-bold text-lg">Rare</div>
            <div class="text-2xl">28%</div>
          </div>
          <div class="text-center p-3 bg-gray-700 rounded">
            <div class="text-gray-400 font-bold text-lg">Common</div>
            <div class="text-2xl">60%</div>
          </div>
        </div>
      </div>

      <!-- Special Banner Rates -->
      <div class="bg-gradient-to-br from-orange-900/50 to-red-900/50 rounded-lg p-6 shadow-xl border-2 border-orange-500">
        <h3 class="text-xl font-bold mb-4 text-orange-300">⭐ Special Banner Rates ⭐</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 bg-gray-800 rounded border-2 border-yellow-500">
            <div class="text-yellow-500 font-bold text-lg">Legendary</div>
            <div class="text-3xl font-bold text-yellow-400">15%</div>
            <div class="text-xs text-green-400 mt-1">↑ +13%</div>
          </div>
          <div class="text-center p-3 bg-gray-800 rounded border-2 border-purple-500">
            <div class="text-purple-500 font-bold text-lg">Epic</div>
            <div class="text-3xl font-bold text-purple-400">25%</div>
            <div class="text-xs text-green-400 mt-1">↑ +15%</div>
          </div>
          <div class="text-center p-3 bg-gray-800 rounded border-2 border-blue-500">
            <div class="text-blue-500 font-bold text-lg">Rare</div>
            <div class="text-3xl font-bold text-blue-400">30%</div>
            <div class="text-xs text-green-400 mt-1">↑ +2%</div>
          </div>
          <div class="text-center p-3 bg-gray-800 rounded border-2 border-gray-500">
            <div class="text-gray-400 font-bold text-lg">Common</div>
            <div class="text-3xl font-bold text-gray-400">30%</div>
            <div class="text-xs text-red-400 mt-1">↓ -30%</div>
          </div>
        </div>
        <div class="mt-4 text-center text-sm text-orange-300 font-semibold">
          💎 Much better rates for premium cards! No pity system needed!
        </div>
      </div>
    </div>

    <!-- Card Reveal Animation Overlay -->
    <Transition name="fade-modal">
      <div
        v-if="showReveal"
        class="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        @click="handleRevealClick"
      >
        <div class="relative max-w-6xl w-full px-4">
          <!-- Animation Phase: Card Flip -->
          <div v-if="revealPhase === 'flipping'" class="text-center">
            <div class="text-4xl font-bold mb-8 animate-pulse">
              {{ pullResults.length > 1 ? 'Summoning...' : 'Summoning...' }}
            </div>
            <div class="flex justify-center gap-4 flex-wrap">
              <div
                v-for="(result, index) in pullResults"
                :key="index"
                class="card-flip"
                :style="{ animationDelay: `${index * 0.1}s` }"
              >
                <div class="w-32 h-48 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-2xl flex items-center justify-center border-4 border-white">
                  <span class="text-6xl">{{ result.type === 'character' ? '👤' : '🎴' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Reveal Phase: Show Cards/Characters -->
          <div v-else-if="revealPhase === 'revealing'" class="text-center">
            <div class="text-3xl font-bold mb-8">
              Click to reveal!
            </div>
            <div class="flex justify-center gap-4 flex-wrap">
              <div
                v-for="(result, index) in pullResults"
                :key="index"
                @click.stop="revealCard(index)"
                class="cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div
                  v-if="!result.revealed"
                  class="w-48 h-72 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg shadow-2xl flex items-center justify-center border-4 border-white hover:shadow-yellow-500/50 animate-pulse"
                >
                  <span class="text-8xl">{{ result.type === 'character' ? '👤' : '🎴' }}</span>
                </div>
                <div
                  v-else
                  class="card-reveal"
                  :class="getRevealEffectClass(result.rarity)"
                >
                  <!-- Display Card -->
                  <CardDisplay
                    v-if="result.type === 'card'"
                    :card="result.card"
                    size="large"
                    class="shadow-2xl"
                  />
                  <!-- Display Character -->
                  <div
                    v-else-if="result.type === 'character'"
                    class="w-48 h-72 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl border-4 overflow-hidden"
                    :class="getRarityBorderClass(result.rarity)"
                  >
                    <div class="h-48 overflow-hidden flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-800">
                      <img
                        v-if="result.character.characterPic"
                        :src="result.character.characterPic"
                        :alt="result.character.name"
                        class="w-full h-full object-cover"
                      />
                      <span v-else class="text-8xl">👤</span>
                    </div>
                    <div class="p-3 text-center">
                      <div class="font-bold text-xl mb-1 text-white">
                        {{ result.character.name }}
                      </div>
                      <div class="text-sm text-gray-400 capitalize">
                        {{ result.character.rarity }}
                      </div>
                    </div>
                  </div>
                  <div
                    class="text-center mt-2 font-bold text-xl"
                    :class="getRarityTextClass(result.rarity)"
                  >
                    {{ result.rarity.toUpperCase() }}
                    <span v-if="result.isPity" class="text-yellow-300 ml-2">⭐ PITY</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-8 text-gray-400 text-sm">
              {{ revealedCount }} / {{ pullResults.length }} revealed
            </div>
          </div>

          <!-- Complete Phase: Summary -->
          <div v-else-if="revealPhase === 'complete'" class="text-center">
            <div class="text-4xl font-bold mb-8 text-green-400">
              Summoning Complete! ✨
            </div>
            <div class="flex justify-center gap-4 flex-wrap mb-8">
              <div
                v-for="(result, index) in pullResults"
                :key="index"
                class="transform transition-all"
                :class="getRevealEffectClass(result.rarity)"
              >
                <!-- Display Card -->
                <CardDisplay
                  v-if="result.type === 'card'"
                  :card="result.card"
                  size="normal"
                  class="shadow-2xl"
                />
                <!-- Display Character -->
                <div
                  v-else-if="result.type === 'character'"
                  class="w-40 h-60 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg shadow-2xl border-4 overflow-hidden"
                  :class="getRarityBorderClass(result.rarity)"
                >
                  <div class="h-36 overflow-hidden flex items-center justify-center bg-gradient-to-b from-gray-700 to-gray-800">
                    <img
                      v-if="result.character.characterPic"
                      :src="result.character.characterPic"
                      :alt="result.character.name"
                      class="w-full h-full object-cover"
                    />
                    <span v-else class="text-6xl">👤</span>
                  </div>
                  <div class="p-2 text-center">
                    <div class="font-bold text-lg text-white">
                      {{ result.character.name }}
                    </div>
                    <div class="text-xs text-gray-400 capitalize">
                      {{ result.character.rarity }}
                    </div>
                  </div>
                </div>
                <div
                  class="text-center mt-2 font-bold"
                  :class="getRarityTextClass(result.rarity)"
                >
                  {{ result.rarity.toUpperCase() }}
                </div>
              </div>
            </div>
            <div class="mb-6 bg-gray-800 p-6 rounded-lg inline-block">
              <div class="text-lg mb-2">Summary</div>
              <div class="flex gap-6 text-sm">
                <div v-if="pullSummary.legendary > 0" class="text-yellow-500">
                  Legendary: {{ pullSummary.legendary }}
                </div>
                <div v-if="pullSummary.epic > 0" class="text-purple-500">
                  Epic: {{ pullSummary.epic }}
                </div>
                <div v-if="pullSummary.rare > 0" class="text-blue-500">
                  Rare: {{ pullSummary.rare }}
                </div>
                <div v-if="pullSummary.common > 0" class="text-gray-400">
                  Common: {{ pullSummary.common }}
                </div>
              </div>
            </div>
            <button
              @click="closeReveal"
              class="px-12 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-bold text-xl transition-all shadow-lg active:translate-y-1"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Notification Toast -->
    <Transition name="slide-down">
      <div
        v-if="notification.show"
        class="fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 max-w-md"
        :class="notification.type === 'error' ? 'bg-red-600' : 'bg-green-600'"
      >
        {{ notification.message }}
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';
import CardDisplay from '@/components/MainLobby/CardDisplay.vue';

const router = useRouter();

// State
const userCoins = ref(0);
const pityCounters = ref({
  totalPulls: 0,
  pullsSinceLastEpic: 0,
  pullsSinceLastLegendary: 0
});

// Initialize with default values to prevent undefined errors
if (!pityCounters.value) {
  pityCounters.value = {
    totalPulls: 0,
    pullsSinceLastEpic: 0,
    pullsSinceLastLegendary: 0
  };
}
const isPulling = ref(false);
const showReveal = ref(false);
const revealPhase = ref('flipping'); // 'flipping', 'revealing', 'complete'
const pullResults = ref([]);
const revealedCount = computed(() => pullResults.value.filter(r => r.revealed).length);

const notification = ref({
  show: false,
  message: '',
  type: 'success'
});

const pullSummary = computed(() => {
  const summary = {
    legendary: 0,
    epic: 0,
    rare: 0,
    common: 0
  };
  pullResults.value.forEach(result => {
    summary[result.rarity]++;
  });
  return summary;
});

// Methods
const goBack = () => {
  router.push('/inventory');
};

const showNotification = (message, type = 'success') => {
  notification.value = { show: true, message, type };
  setTimeout(() => {
    notification.value.show = false;
  }, 3000);
};

const loadGachaInfo = async () => {
  try {
    const response = await fetchApi('/gacha/info');

    // Handle different response structures
    const data = response.data || response;

    userCoins.value = data.coins || 0;
    pityCounters.value = data.pityCounters || {
      totalPulls: 0,
      pullsSinceLastEpic: 0,
      pullsSinceLastLegendary: 0
    };
  } catch (error) {
    console.error('Failed to load gacha info:', error);
    showNotification('Failed to load gacha information', 'error');

    // Set default values on error
    userCoins.value = 0;
    pityCounters.value = {
      totalPulls: 0,
      pullsSinceLastEpic: 0,
      pullsSinceLastLegendary: 0
    };
  }
};

// Helper function to sanitize card data
const sanitizeCard = (card) => {
  // Just return the card as-is, let CardDisplay handle image fallback logic
  return { ...card };
};

const doPull = async (type) => {
  if (isPulling.value) return;

  const cost = type === 'single' ? 1 : 10;
  if (userCoins.value < cost) {
    showNotification('Not enough coins!', 'error');
    return;
  }

  isPulling.value = true;

  try {
    let endpoint;
    if (type === 'single') {
      endpoint = '/gacha/pull/single';
    } else if (type === 'special') {
      endpoint = '/gacha/pull/special';
    } else {
      endpoint = '/gacha/pull/multi';
    }
    const response = await fetchApi(endpoint, { method: 'POST' });

    // Handle different response structures
    const data = response.data || response;

    // Update coins and pity
    userCoins.value = data.coinsRemaining || userCoins.value - cost;
    pityCounters.value = data.pityCounters || pityCounters.value;

    // Prepare results with sanitized cards/characters
    if (type === 'single' || type === 'special') {
      pullResults.value = [{
        type: data.type || 'card', // 'card' or 'character'
        card: data.card ? sanitizeCard(data.card) : null,
        character: data.character || null,
        rarity: data.rarity,
        isPity: data.isPity || false,
        revealed: false
      }];
    } else {
      pullResults.value = (data.cards || []).map(item => ({
        type: 'card',
        card: sanitizeCard(item.card),
        character: null,
        rarity: item.rarity,
        isPity: item.isPity || false,
        revealed: false
      }));
    }

    // Start animation sequence
    showReveal.value = true;
    revealPhase.value = 'flipping';

    // After flip animation, move to reveal phase
    setTimeout(() => {
      revealPhase.value = 'revealing';
    }, 2000);

  } catch (error) {
    console.error('Pull failed:', error);
    showNotification(error.message || 'Failed to pull cards', 'error');
  } finally {
    isPulling.value = false;
  }
};

const revealCard = (index) => {
  if (pullResults.value[index].revealed) return;

  pullResults.value[index].revealed = true;

  // Check if all cards revealed
  if (revealedCount.value === pullResults.value.length) {
    setTimeout(() => {
      revealPhase.value = 'complete';
    }, 500);
  }
};

const handleRevealClick = (event) => {
  // Only allow closing on complete phase by clicking background
  if (revealPhase.value === 'complete' && event.target === event.currentTarget) {
    closeReveal();
  }
};

const closeReveal = () => {
  showReveal.value = false;
  pullResults.value = [];
  revealPhase.value = 'flipping';
};

const getRevealEffectClass = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'legendary-glow';
    case 'epic':
      return 'epic-glow';
    case 'rare':
      return 'rare-glow';
    default:
      return '';
  }
};

const getRarityTextClass = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'text-yellow-400';
    case 'epic':
      return 'text-purple-400';
    case 'rare':
      return 'text-blue-400';
    default:
      return 'text-gray-400';
  }
};

const getRarityBorderClass = (rarity) => {
  switch (rarity) {
    case 'legendary':
      return 'border-yellow-500';
    case 'epic':
      return 'border-purple-500';
    case 'rare':
      return 'border-blue-500';
    default:
      return 'border-gray-500';
  }
};

onMounted(() => {
  loadGachaInfo();
});
</script>

<style scoped>
/* Fade modal transition */
.fade-modal-enter-active,
.fade-modal-leave-active {
  transition: opacity 0.3s ease;
}

.fade-modal-enter-from,
.fade-modal-leave-to {
  opacity: 0;
}

/* Slide down notification */
.slide-down-enter-active {
  transition: all 0.4s ease-out;
}

.slide-down-leave-active {
  transition: all 0.3s ease-in;
}

.slide-down-enter-from {
  transform: translateY(-100px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100px);
  opacity: 0;
}

/* Card flip animation */
@keyframes cardFlip {
  0% {
    transform: rotateY(0deg) scale(1);
  }
  50% {
    transform: rotateY(180deg) scale(1.1);
  }
  100% {
    transform: rotateY(360deg) scale(1);
  }
}

.card-flip {
  animation: cardFlip 1.5s ease-in-out;
}

/* Card reveal animation */
@keyframes cardReveal {
  0% {
    transform: scale(0.8) rotateY(180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotateY(0deg);
    opacity: 1;
  }
}

.card-reveal {
  animation: cardReveal 0.6s ease-out;
}

/* Legendary glow effect */
@keyframes legendaryGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(250, 204, 21, 0.5), 0 0 40px rgba(250, 204, 21, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(250, 204, 21, 0.8), 0 0 60px rgba(250, 204, 21, 0.5);
  }
}

.legendary-glow {
  animation: legendaryGlow 2s ease-in-out infinite;
  border-radius: 0.5rem;
}

/* Epic glow effect */
@keyframes epicGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5), 0 0 40px rgba(168, 85, 247, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(168, 85, 247, 0.8), 0 0 60px rgba(168, 85, 247, 0.5);
  }
}

.epic-glow {
  animation: epicGlow 2s ease-in-out infinite;
  border-radius: 0.5rem;
}

/* Rare glow effect */
@keyframes rareGlow {
  0%, 100% {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.4), 0 0 30px rgba(59, 130, 246, 0.2);
  }
  50% {
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 45px rgba(59, 130, 246, 0.4);
  }
}

.rare-glow {
  animation: rareGlow 2s ease-in-out infinite;
  border-radius: 0.5rem;
}
</style>
