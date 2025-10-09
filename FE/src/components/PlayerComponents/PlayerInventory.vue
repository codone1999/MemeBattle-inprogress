<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useritem } from '@/stores/playerStore.js';
import { useAuthStore } from '@/stores/authStore.js';
import { storeToRefs } from 'pinia';
import axios from 'axios';
import Modal from '../UI/Modal.vue';
import CharacterSelector from './CharacterSelector.vue';
import FriendList from './FriendList.vue';
import ShowCard from './ShowCard.vue';
import Card from '../mainGameComponents/Card.vue';
import ProfileEdit from './ProfileEdit.vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const router = useRouter();
const playerStore = useritem();
const authStore = useAuthStore();
const friendRequestCount = ref(0);
const activeLobby = ref(null);

const handleRequestCount = (count) => {
  friendRequestCount.value = count;
};

// Get reactive state from store
const { 
  currentUser, 
  inventory,
  userCards,
  userDecks,
  userCharacters,
  loading,
  error 
} = storeToRefs(playerStore);

// Local state
const selectedDeck = ref(null);
const selectedDeckCards = ref([]);
const selectedInventoryCards = ref([]);
const addCard = ref(false);
const removeCard = ref(false);
const maxDeckSize = 15;
const showCardDetails = ref(false);
const selectedCard = ref(null);
const showProfileModal = ref(false);
const showCharacterModal = ref(false);
const showFriendsModal = ref(false);
const selectedCharacterId = ref(null);
const activeTab = ref('decks');

// Sound effects
const hoverBtnSound = new Audio('/sounds/se/hover.mp3');
hoverBtnSound.volume = 0.1;

const hoverCardSound = new Audio('/sounds/se/cardhover.mp3');
hoverCardSound.volume = 0.5;

const playHoverButton = () => {
  hoverBtnSound.currentTime = 0;
  hoverBtnSound.play().catch(() => {});
};

const playHoverCard = () => {
  hoverCardSound.currentTime = 0;
  hoverCardSound.play().catch(() => {});
};

const handleProfileUpdated = async () => {
  // Refresh user data
  await authStore.verifyToken();
  await playerStore.fetchInventory();
};

// Update onMounted
onMounted(async () => {
  if (!inventory.value) {
    try {
      await playerStore.initializeData();
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }
  
  // Check active lobby
  await checkActiveLobby();
  
  // Set selected character from inventory
  if (inventory.value?.selected_character) {
    selectedCharacterId.value = inventory.value.selected_character;
  } else if (userCharacters.value.length > 0) {
    selectedCharacterId.value = userCharacters.value[0].idcharacter;
  }
});

// Computed: Available cards (filtered by selected deck)
const availableCards = computed(() => {
  if (!selectedDeck.value || selectedDeck.value === 'AddDeck') {
    return userCards.value;
  }
  
  const deckCardIds = selectedDeckCards.value.map(card => card.idcard);
  return userCards.value.filter(card => !deckCardIds.includes(card.idcard));
});

// Watch selected deck and fetch its cards
watch(selectedDeck, async (newDeck) => {
  selectedInventoryCards.value = [];
  setNormalState();
  
  if (newDeck && newDeck !== 'AddDeck') {
    try {
      selectedDeckCards.value = await playerStore.fetchDeckCards(newDeck);
    } catch (error) {
      console.error('Failed to fetch deck cards:', error);
      selectedDeckCards.value = [];
    }
  } else {
    selectedDeckCards.value = [];
  }
});

const addingDeck = async () => {
  if (selectedInventoryCards.value.length === 0) {
    alert('Please select at least one card to create a new deck.');
    return;
  }

  if (selectedInventoryCards.value.length > maxDeckSize) {
    alert(`Decks can have a maximum of ${maxDeckSize} cards.`);
    return;
  }

  try {
    const deckName = prompt('Enter deck name:') || `Deck ${Date.now()}`;
    const cardIds = selectedInventoryCards.value.map(card => card.idcard);
    
    console.log('🎯 Creating deck with cards:', cardIds);
    
    // Create the deck
    const newDeck = await playerStore.createDeck(deckName, cardIds);
    console.log('✅ Deck created:', newDeck);
    
    alert('Deck created successfully!');
    selectedInventoryCards.value = [];
    
    // IMPORTANT: Refresh in correct order
    // 1. First refresh inventory (to get updated deck IDs list)
    await playerStore.fetchInventory();
    console.log('✅ Inventory refreshed');
    
    // 2. Then refresh decks (now it will find all decks including new one)
    await playerStore.fetchDecks();
    console.log('✅ Decks refreshed. Total decks:', userDecks.value.length);
    console.log('📋 Deck IDs in store:', userDecks.value.map(d => d.deckid));
    
    // 3. Select the newly created deck
    selectedDeck.value = newDeck.deckid;
    
    // 4. Refresh cards list
    await playerStore.fetchCards();
    console.log('✅ Cards refreshed');
  } catch (error) {
    console.error('❌ Failed to create deck:', error);
    alert('Failed to create deck: ' + error);
  }
};
// Add this function
const checkActiveLobby = async () => {
  try {
    const response = await axios.get(`${API_URL}/lobby/user/active`);
    if (response.data.success && response.data.data.lobby) {
      activeLobby.value = response.data.data.lobby;
    } else {
      activeLobby.value = null;
    }
  } catch (error) {
    console.error('Failed to check active lobby:', error);
  }
};

const editingDeck = async () => {
  if (!selectedDeck.value || selectedInventoryCards.value.length === 0) {
    alert('Please select a deck and at least one card.');
    return;
  }

  if (selectedDeck.value === 'AddDeck') {
    await addingDeck();
    return;
  }

  const currentDeck = userDecks.value.find(d => d.deckid === selectedDeck.value);
  if (!currentDeck) {
    alert('Deck not found.');
    return;
  }

  try {
    if (addCard.value) {
      const newCardIds = selectedInventoryCards.value.map(c => c.idcard);
      const updatedCardIds = [...currentDeck.cardid, ...newCardIds];
      
      if (updatedCardIds.length > maxDeckSize) {
        alert(`Decks can have a maximum of ${maxDeckSize} cards.`);
        return;
      }
      
      await playerStore.updateDeck(
        selectedDeck.value,
        currentDeck.deck_name,
        updatedCardIds
      );
      
      alert('Cards added to deck successfully!');
    } 
    else if (removeCard.value) {
      const removeIds = selectedInventoryCards.value.map(c => c.idcard);
      const updatedCardIds = currentDeck.cardid.filter(id => !removeIds.includes(id));
      
      await playerStore.updateDeck(
        selectedDeck.value,
        currentDeck.deck_name,
        updatedCardIds
      );
      
      alert('Cards removed from deck successfully!');
    }
    
    selectedInventoryCards.value = [];
    setNormalState();
    
    // Refresh deck cards
    selectedDeckCards.value = await playerStore.fetchDeckCards(selectedDeck.value);
    // Refresh available cards
    await playerStore.fetchCards();
  } catch (error) {
    alert('Failed to update deck: ' + error);
  }
};

const removeSelectedDeck = async () => {
  if (!selectedDeck.value || selectedDeck.value === 'AddDeck') {
    alert('Please select a deck to remove.');
    return;
  }

  if (!confirm('Are you sure you want to delete this deck?')) {
    return;
  }

  try {
    await playerStore.deleteDeck(selectedDeck.value);
    alert('Deck deleted successfully!');
    selectedDeck.value = null;
    selectedDeckCards.value = [];
    
    // Refresh cards list
    await playerStore.fetchCards();
  } catch (error) {
    alert('Failed to delete deck: ' + error);
  }
};

// Card selection
const setAddCard = () => {
  addCard.value = true;
  removeCard.value = false;
  selectedInventoryCards.value = [];
};

const setRemoveCard = () => {
  removeCard.value = true;
  addCard.value = false;
  selectedInventoryCards.value = [];
};

const setNormalState = () => {
  addCard.value = false;
  removeCard.value = false;
  selectedInventoryCards.value = [];
};

const selectInventoryCardFunc = (card) => {
  const index = selectedInventoryCards.value.findIndex(
    selectedCard => selectedCard.idcard === card.idcard
  );
  
  if (removeCard.value) {
    const isInDeck = selectedDeckCards.value.some(
      deckCard => deckCard.idcard === card.idcard
    );
    
    if (!isInDeck) {
      alert('Please select a card from the deck to remove.');
      return;
    }
    
    if (index === -1) {
      selectedInventoryCards.value.push(card);
    } else {
      selectedInventoryCards.value.splice(index, 1);
    }
  } 
  else if (addCard.value || selectedDeck.value === 'AddDeck') {
    const isAvailable = availableCards.value.some(
      availCard => availCard.idcard === card.idcard
    );
    
    if (!isAvailable) {
      alert('This card is already in the deck or not available.');
      return;
    }
    
    if (index === -1) {
      selectedInventoryCards.value.push(card);
    } else {
      selectedInventoryCards.value.splice(index, 1);
    }
  } 
  else {
    handleCardClick(card);
  }
};

const handleCardClick = (card) => {
  if (!addCard.value && !removeCard.value) {
    selectedCard.value = card;
    showCardDetails.value = true;
  }
};

const closeCardDetails = () => {
  showCardDetails.value = false;
  selectedCard.value = null;
};

const handleCharacterSelect = async (characterId) => {
  try {
    const response = await axios.put(`${API_URL}/user/character`, {
      characterId
    });
    
    if (response.data.success) {
      selectedCharacterId.value = characterId;
      showCharacterModal.value = false;
      alert('Character updated successfully!');
      
      // Refresh inventory to get updated selected_character
      await playerStore.fetchInventory();
    }
  } catch (error) {
    alert('Failed to update character: ' + (error.response?.data?.message || error.message));
  }
};

const goToLobby = async () => {
  try {
    // First check if user is already in a lobby
    const response = await axios.get(`${API_URL}/lobby/user/active`);
    
    if (response.data.success && response.data.data.lobby) {
      // User is already in a lobby, go directly to it
      const activeLobby = response.data.data.lobby;
      console.log('✅ User already in lobby:', activeLobby.lobby_id);
      
      router.push({ 
        name: 'LobbyPage', 
        params: { lobbyId: activeLobby.lobby_id } 
      });
    } else {
      // No active lobby, go to lobby list
      router.push({ name: 'LobbyList' });
    }
  } catch (error) {
    console.error('Failed to check active lobby:', error);
    // On error, default to lobby list
    router.push({ name: 'LobbyList' });
  }
};

const handleLogout = async () => {
  if (confirm('Are you sure you want to logout?')) {
    await authStore.logout();
    playerStore.resetState();
    router.push({ name: 'MainMenu' });
  }
};
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <!-- Loading State -->
    <div v-if="loading && !inventory" class="flex items-center justify-center h-screen">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p class="text-gray-300 text-xl">Loading your collection...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-screen">
      <div class="bg-red-900/20 border border-red-500 rounded-lg p-8 text-center max-w-md">
        <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-red-400 text-lg">{{ error }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="container mx-auto px-4 py-6 max-w-[1920px]">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <!-- Left Sidebar - Profile -->
        <div class="lg:col-span-3 space-y-4">
          <!-- Profile Card -->
          <div class="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div class="bg-gray-800 p-4 border-b border-gray-700">
              <div class="flex items-center gap-3">
                <div class="w-16 h-16 rounded-full border-2 border-gray-700 overflow-hidden bg-gray-800">
                  <img
                    v-if="selectedCharacterId"
                    :src="`/characters/${selectedCharacterId}.png`"
                    :alt="currentUser?.username"
                    class="w-full h-full object-cover"
                    @error="$event.target.src = '/characters/default.png'"
                  />
                </div>
                <div class="flex-1">
                  <h2 class="text-lg font-bold text-white truncate">{{ currentUser?.username }}</h2>
                  <p class="text-gray-400 text-sm">ELO: {{ currentUser?.elo_rating || 1000 }}</p>
                </div>
              </div>
            </div>

            <div class="p-4 space-y-3">
              <!-- Stats -->
              <div class="grid grid-cols-3 gap-2 text-center text-sm">
                <div class="bg-gray-800 rounded p-2">
                  <p class="text-green-400 font-bold">{{ currentUser?.wins || 0 }}</p>
                  <p class="text-gray-500 text-xs">Wins</p>
                </div>
                <div class="bg-gray-800 rounded p-2">
                  <p class="text-red-400 font-bold">{{ currentUser?.losses || 0 }}</p>
                  <p class="text-gray-500 text-xs">Losses</p>
                </div>
                <div class="bg-gray-800 rounded p-2">
                  <p class="text-yellow-400 font-bold">{{ currentUser?.draws || 0 }}</p>
                  <p class="text-gray-500 text-xs">Draws</p>
                </div>
              </div>

              <!-- Action Buttons -->
              <button
                @click="showProfileModal = true"
                @mouseenter="playHoverButton"
                class="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition text-sm"
              >
                Edit Profile
              </button>

              <button
                @click="showCharacterModal = true"
                @mouseenter="playHoverButton"
                class="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition text-sm"
              >
                Change Character
              </button>

              <button
                @click="showFriendsModal = true"
                @mouseenter="playHoverButton"
                class="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition text-sm relative"
              >
                Friends
                <!-- Friend request badge will go here -->
              </button>

              <button
                @click="handleLogout"
                @mouseenter="playHoverButton"
                class="w-full bg-red-900/20 hover:bg-red-900/30 text-red-400 font-medium py-2 px-4 rounded transition text-sm border border-red-900/50"
              >
                Logout
              </button>
            </div>
          </div>

          <!-- Collection Stats -->
          <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <h3 class="text-sm font-bold text-white mb-3">Collection</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Cards</span>
                <span class="text-white font-semibold">{{ userCards.length }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Decks</span>
                <span class="text-white font-semibold">{{ userDecks.length }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-gray-400">Characters</span>
                <span class="text-white font-semibold">{{ userCharacters.length }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Area -->
        <div class="lg:col-span-9 space-y-4">
          <!-- Tabs -->
          <div class="bg-gray-900 border border-gray-800 rounded-lg p-1 flex gap-1">
            <button
              @click="activeTab = 'decks'"
              @mouseenter="playHoverButton"
              :class="[
                'flex-1 py-2 px-4 rounded font-medium transition text-sm',
                activeTab === 'decks'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              ]"
            >
              Deck Builder
            </button>
            <button
              @click="activeTab = 'cards'"
              @mouseenter="playHoverButton"
              :class="[
                'flex-1 py-2 px-4 rounded font-medium transition text-sm',
                activeTab === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              ]"
            >
              Card Collection
            </button>
          </div>

          <!-- Deck Builder -->
          <div v-if="activeTab === 'decks'" class="space-y-4">
            <!-- Deck Selector -->
            <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <label class="block text-gray-400 text-sm font-medium mb-2">Select Deck</label>
              <select 
                v-model="selectedDeck"
                class="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition"
              >
                <option :value="null">-- Select a Deck --</option>
                <option 
                  v-for="deck in userDecks" 
                  :key="deck.deckid" 
                  :value="deck.deckid"
                >
                  {{ deck.deck_name }} ({{ deck.cardid.length }}/{{ maxDeckSize }})
                </option>
                <option value="AddDeck">+ Create New Deck</option>
              </select>
            </div>

            <!-- Deck Cards -->
            <div v-if="selectedDeck && selectedDeck !== 'AddDeck' && selectedDeckCards.length > 0" class="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-bold text-white">
                  Deck ({{ selectedDeckCards.length }}/{{ maxDeckSize }})
                </h3>
                <button
                  @click="removeSelectedDeck"
                  @mouseenter="playHoverButton"
                  class="bg-red-900/20 hover:bg-red-900/30 text-red-400 font-medium py-1 px-3 rounded text-sm border border-red-900/50"
                >
                  Delete
                </button>
              </div>
              <p v-if="removeCard" class="text-red-400 text-xs mb-3">
                Click cards to remove them
              </p>
              <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                <div 
                  v-for="card in selectedDeckCards" 
                  :key="card.idcard"
                  @click="selectInventoryCardFunc(card)"
                  @mouseenter="playHoverCard"
                  :class="[
                    'cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105',
                    selectedInventoryCards.some(c => c.idcard === card.idcard)
                      ? 'border-red-500 shadow-lg shadow-red-500/30'
                      : 'border-gray-700 hover:border-gray-600'
                  ]"
                >
                  <Card
                    class="w-full"
                    :title="card.cardname"
                    :imageUrl="`/cards/${card.idcard}.png`"
                    :score="card.Power"
                    :pawnsRequired="card.pawnsRequired"
                    :pawnLocations="card.pawnLocations"
                    :Ability="card.abilityType"
                  />
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-2">
              <button 
                @mouseenter="playHoverButton" 
                @click="setAddCard"
                :disabled="!selectedDeck || selectedDeck === 'AddDeck'"
                class="flex-1 bg-green-900/20 hover:bg-green-900/30 disabled:bg-gray-800 disabled:cursor-not-allowed text-green-400 disabled:text-gray-600 font-medium py-2 px-4 rounded transition text-sm border border-green-900/50 disabled:border-gray-700"
              >
                {{ addCard ? '✓ Adding' : '+ Add Cards' }}
              </button>
              <button 
                @mouseenter="playHoverButton" 
                @click="setRemoveCard"
                :disabled="!selectedDeck || selectedDeck === 'AddDeck' || selectedDeckCards.length === 0"
                class="flex-1 bg-red-900/20 hover:bg-red-900/30 disabled:bg-gray-800 disabled:cursor-not-allowed text-red-400 disabled:text-gray-600 font-medium py-2 px-4 rounded transition text-sm border border-red-900/50 disabled:border-gray-700"
              >
                {{ removeCard ? '✓ Removing' : '− Remove Cards' }}
              </button>
              <button 
                @mouseenter="playHoverButton" 
                @click="setNormalState"
                class="px-6 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 rounded transition text-sm"
              >
                Cancel
              </button>
            </div>
          </div>

          <!-- Cards Section -->
          <div class="bg-gray-900 border border-gray-800 rounded-lg p-4">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-bold text-white">
                {{ activeTab === 'cards' ? 'All Cards' : 'Available Cards' }}
                ({{ activeTab === 'cards' ? userCards.length : availableCards.length }})
              </h3>
              <button 
                v-if="selectedDeck"
                @mouseenter="playHoverButton" 
                @click="editingDeck"
                :disabled="selectedInventoryCards.length === 0"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded transition text-sm"
              >
                {{ selectedDeck === 'AddDeck' ? 'Create Deck' : 'Save' }}
              </button>
            </div>
            <p v-if="addCard && selectedDeck === 'AddDeck'" class="text-green-400 text-xs mb-3">
              Select up to {{ maxDeckSize }} cards to create a new deck
            </p>
            <p v-else-if="addCard" class="text-green-400 text-xs mb-3">
              Click cards to add to deck
            </p>
            
            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              <div 
                v-for="card in (activeTab === 'cards' ? userCards : availableCards)" 
                :key="card.idcard"
                @mouseenter="playHoverCard"
                @click="selectInventoryCardFunc(card)"
                :class="[
                  'cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105',
                  selectedInventoryCards.some(c => c.idcard === card.idcard)
                    ? 'border-green-500 shadow-lg shadow-green-500/30'
                    : 'border-gray-700 hover:border-gray-600'
                ]"
              >
                <Card
                  class="w-full"
                  :title="card.cardname"
                  :imageUrl="`/cards/${card.idcard}.png`"
                  :score="card.Power"
                  :pawnsRequired="card.pawnsRequired"
                  :pawnLocations="card.pawnLocations"
                  :Ability="card.abilityType"
                />
              </div>
            </div>
          </div>
          <!-- Lobby Button -->
           <div class="flex flex-col items-center gap-3 pt-4">
            <!-- Active Lobby Indicator -->
             <div v-if="activeLobby" 
             class="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-center"
             >
             <p class="text-blue-400 text-sm mb-1">
              📍 You're in a lobby
            </p>
              <p class="text-white font-semibold">{{ activeLobby.lobby_name }}</p>
              <p class="text-gray-400 text-xs mt-1">
                {{ activeLobby.host_user_id === authStore.user?.uid ? 'You are the host' : 'Joined as guest' }}
              </p>
            </div>
          
            <button
              @click="goToLobby"
              @mouseenter="playHoverButton"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition shadow-lg"
            >
              {{ activeLobby ? 'Return to Lobby' : 'Enter Battle Lobby' }}
            </button>
        </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ShowCard 
      v-if="showCardDetails && selectedCard" 
      :card="selectedCard" 
      @close="closeCardDetails" 
    />

    <Modal :show="showProfileModal" title="Edit Profile" @close="showProfileModal = false">
      <ProfileEdit @close="showProfileModal = false" @updated="handleProfileUpdated" />
    </Modal>

    <Modal :show="showCharacterModal" title="Select Character" @close="showCharacterModal = false">
      <CharacterSelector
        :selectedCharacterId="selectedCharacterId"
        @select="handleCharacterSelect"
      />
    </Modal>

 <!-- Update the Friends button -->
  <button
    @click="showFriendsModal = true"
    @mouseenter="playHoverButton"
    class="w-full bg-gray-800 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition text-sm relative"
  >
    Friends
    <span 
      v-if="friendRequestCount > 0"
      class="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
    >
      {{ friendRequestCount }}
    </span>
  </button>

  <!-- Update the Modal -->
  <Modal :show="showFriendsModal" title="Friends" @close="showFriendsModal = false">
    <FriendList @requestCount="handleRequestCount" />
  </Modal>
  </div>
</template>

<style scoped>
@media (max-width: 640px) {
  .grid > div {
    min-height: 180px;
  }
}
</style>