<script setup>
import { computed, ref, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useritem } from '@/stores/playerStore.js';
import { storeToRefs } from 'pinia';
import GameLobby from '../UI/GameLobby.vue';
import ShowCard from './ShowCard.vue';
import Card from '../mainGameComponents/Card.vue';

const router = useRouter();
const playerStore = useritem();

// Get reactive state from store
const { 
  currentUser, 
  userInventory, 
  cards, 
  decks, 
  characters,
  loading,
  error 
} = storeToRefs(playerStore);

// Local state
const selectedDeck = ref(null);
const selectedInventoryCards = ref([]);
const addCard = ref(false);
const removeCard = ref(false);
const lobbyPageStatus = ref(false);
const maxDeckSize = 15;
const showCardDetails = ref(false);
const selectedCard = ref(null);

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

// Initialize data on mount
onMounted(async () => {
  if (!userInventory.value) {
    try {
      await playerStore.initializeData();
    } catch (err) {
      console.error('Failed to load inventory:', err);
    }
  }
});

// Computed: Get user's deck IDs
const uniqueDecks = computed(() => {
  if (!userInventory.value || !userInventory.value.deckid) return [];
  
  return decks.value
    .filter(deck => userInventory.value.deckid.includes(deck.deckid))
    .map(deck => ({
      deckid: deck.deckid,
      name: deck.deck_name || `Deck ${deck.deckid}`,
      cardCount: deck.cardid ? deck.cardid.length : 0
    }));
});

// Computed: Get cards in selected deck
const getCardsInDeck = computed(() => {
  if (!selectedDeck.value || selectedDeck.value === 'AddDeck') return [];
  
  const foundDeck = decks.value.find(deck => deck.deckid === selectedDeck.value);
  if (!foundDeck || !foundDeck.cardid) return [];
  
  return foundDeck.cardid
    .map(cardId => cards.value.find(card => card.idcard === cardId))
    .filter(card => card !== undefined);
});

// Computed: Get cards in user's inventory (not in selected deck)
const getCardsInInventory = computed(() => {
  if (!userInventory.value || !userInventory.value.cardid) return [];
  
  const userCards = cards.value.filter(card => 
    userInventory.value.cardid.includes(card.idcard)
  );
  
  if (!selectedDeck.value || selectedDeck.value === 'AddDeck') {
    return userCards;
  }
  
  const cardInDeck = getCardsInDeck.value.map(card => card.idcard);
  return userCards.filter(card => !cardInDeck.includes(card.idcard));
});

// Computed: Get available characters
const availableCharacters = computed(() => {
  if (!userInventory.value || !userInventory.value.characterid) return [];
  
  return userInventory.value.characterid
    .map(id => characters.value.find(char => char.idcharacter === id))
    .filter(char => char !== undefined);
});

// Add/Edit/Remove deck functions
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
    
    await playerStore.createDeck(deckName, cardIds);
    
    alert('Deck created successfully!');
    selectedInventoryCards.value = [];
    selectedDeck.value = null;
  } catch (error) {
    alert('Failed to create deck: ' + error);
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

  const currentDeck = decks.value.find(d => d.deckid === selectedDeck.value);
  if (!currentDeck) {
    alert('Deck not found.');
    return;
  }

  try {
    if (addCard.value) {
      // Add cards to deck
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
      // Remove cards from deck
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
    // Can only select cards from deck
    const isInDeck = getCardsInDeck.value.some(
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
    // Can only select cards from inventory
    const isInInventory = getCardsInInventory.value.some(
      invCard => invCard.idcard === card.idcard
    );
    
    if (!isInInventory) {
      alert('Please select a card from the inventory to add.');
      return;
    }
    
    if (index === -1) {
      selectedInventoryCards.value.push(card);
    } else {
      selectedInventoryCards.value.splice(index, 1);
    }
  } 
  else {
    // View card details
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

const setLobbyPage = () => {
  lobbyPageStatus.value = true;
};

// Reset selected cards when deck changes
watch(selectedDeck, () => {
  selectedInventoryCards.value = [];
  setNormalState();
});
</script>

<template>
  <div class="bg-gray-900 min-h-screen w-full py-8 px-4 overflow-y-auto" v-if="!lobbyPageStatus">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center h-screen">
      <div class="text-white text-xl">Loading inventory...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="flex items-center justify-center h-screen">
      <div class="text-red-500 text-xl">Error: {{ error }}</div>
    </div>

    <!-- Main Content -->
    <div v-else class="container mx-auto max-w-7xl bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
      <header class="bg-gray-700 py-4 px-6 border-b border-gray-600">
        <h2 class="text-2xl font-semibold text-white text-center">Player Inventory</h2>
        <p class="text-gray-400 text-center text-sm mt-1">
          Cards: {{ userInventory?.cardid?.length || 0 }} | 
          Decks: {{ uniqueDecks.length }} | 
          Characters: {{ userInventory?.characterid?.length || 0 }}
        </p>
      </header>

      <!-- Deck Management Section -->
      <section class="p-6 flex-grow">
        <h3 class="text-lg font-semibold text-gray-300 mb-4">Deck Management</h3>

        <div class="mb-4">
          <label for="selectedDeck" class="block text-gray-400 text-sm font-bold mb-2">
            Select Deck:
          </label>
          <select 
            v-model="selectedDeck" 
            id="selectedDeck"
            class="shadow border rounded w-full py-2 px-3 bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option :value="null">-- Select a Deck --</option>
            <option 
              v-for="deck in uniqueDecks" 
              :key="deck.deckid" 
              :value="deck.deckid"
            >
              {{ deck.name }} ({{ deck.cardCount }} cards)
            </option>
            <option value="AddDeck">+ Create New Deck</option>
          </select>
        </div>

        <!-- Cards in Selected Deck -->
        <div v-if="selectedDeck && selectedDeck !== 'AddDeck' && getCardsInDeck.length > 0" class="mb-6">
          <h4 class="text-md font-semibold text-gray-300 mb-2">
            Cards in Selected Deck ({{ getCardsInDeck.length }}/{{ maxDeckSize }}):
          </h4>
          <p v-if="removeCard" class="text-red-400 text-sm mb-2">
            Select cards to remove from the deck.
          </p>
          <div class="flex flex-wrap gap-4">
            <div 
              v-for="card in getCardsInDeck" 
              :key="card.idcard"
              @click="selectInventoryCardFunc(card)"
              @mouseenter="playHoverCard"
              :class="[
                'cursor-pointer relative w-36 h-54 bg-gray-800 border-4 border-gray-600 rounded-lg hover:scale-105 transition-transform',
                selectedInventoryCards.some(c => c.idcard === card.idcard) ? 'border-purple-500 shadow-lg' : '',
                removeCard && selectedInventoryCards.some(c => c.idcard === card.idcard) ? 'bg-red-700 border-red-500' : ''
              ]"
            >
              <Card
                class="scale-59 right-8/21 bottom-9/25 object-cover rounded-lg"
                :title="card.cardname"
                :imageUrl="`/cards/${card.idcard}.png`"
                :score="card.Power"
                :pawnsRequired="card.pawnsRequired"
                :pawnLocations="card.pawnLocations"
                :Ability="card.abilityType"
              />
            </div>
          </div>
          <button
            @click="removeSelectedDeck"
            @mouseenter="playHoverButton"
            class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Delete This Deck
          </button>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4 mb-4">
          <button 
            @mouseenter="playHoverButton" 
            @click="setAddCard"
            :disabled="!selectedDeck || selectedDeck === 'AddDeck'"
            class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ addCard ? 'Adding Card...' : 'Add Card to Deck' }}
          </button>
          <button 
            @mouseenter="playHoverButton" 
            @click="setRemoveCard"
            :disabled="!selectedDeck || selectedDeck === 'AddDeck' || getCardsInDeck.length === 0"
            class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ removeCard ? 'Removing Card...' : 'Remove Card from Deck' }}
          </button>
          <button 
            @mouseenter="playHoverButton" 
            @click="setNormalState"
            class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            Cancel
          </button>
        </div>
      </section>

      <!-- Inventory Cards Section -->
      <section class="p-6 border-t border-gray-600 flex-grow">
        <h3 class="text-lg font-semibold text-gray-300 mb-4">
          Your Cards ({{ getCardsInInventory.length }})
        </h3>
        <p v-if="addCard && selectedDeck === 'AddDeck'" class="text-green-400 text-sm mb-2">
          Select cards to create a new deck.
        </p>
        <p v-else-if="addCard" class="text-green-400 text-sm mb-2">
          Select cards to add to the selected deck.
        </p>
        
        <div class="flex flex-wrap gap-4">
          <div 
            v-for="card in getCardsInInventory" 
            :key="card.idcard"
            @mouseenter="playHoverCard"
            @click="selectInventoryCardFunc(card)"
            :class="[
              'cursor-pointer relative w-36 h-54 bg-gray-800 border-4 border-gray-600 rounded-lg hover:scale-105 transition-transform',
              selectedInventoryCards.some(c => c.idcard === card.idcard) ? 'border-purple-500 shadow-lg' : '',
              (addCard || selectedDeck === 'AddDeck') && selectedInventoryCards.some(c => c.idcard === card.idcard) ? 'bg-green-700 border-green-500' : ''
            ]"
          >
            <Card
              class="scale-59 right-8/21 bottom-9/25 object-cover rounded-lg"
              :title="card.cardname"
              :imageUrl="`/cards/${card.idcard}.png`"
              :score="card.Power"
              :pawnsRequired="card.pawnsRequired"
              :pawnLocations="card.pawnLocations"
              :Ability="card.abilityType"
            />
          </div>
        </div>
        
        <button 
          @mouseenter="playHoverButton" 
          @click="editingDeck"
          :disabled="!selectedDeck || selectedInventoryCards.length === 0"
          class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ selectedDeck === 'AddDeck' ? 'Create Deck' : 'Save Changes' }}
        </button>
      </section>

      <!-- Footer -->
      <footer class="bg-gray-700 py-4 px-6 border-t border-gray-600 text-right">
        <button 
          @mouseenter="playHoverButton" 
          @click="setLobbyPage"
          class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Go to Lobby
        </button>
      </footer>
    </div>

    <!-- Card Details Modal -->
    <ShowCard 
      v-if="showCardDetails && selectedCard" 
      :card="selectedCard" 
      @close="closeCardDetails" 
    />
  </div>

  <!-- Lobby Page -->
  <GameLobby
    v-if="lobbyPageStatus"
    :decks="uniqueDecks.map(d => d.deckid)"
    :characters="availableCharacters.map(c => c.idcharacter)"
  />
</template>

<style scoped>
.scale-59 {
  transform: scale(0.59);
}

.right-8\/21 {
  right: 38.095%;
}

.bottom-9\/25 {
  bottom: 36%;
}
</style>