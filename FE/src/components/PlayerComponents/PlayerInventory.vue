<script setup>
import { editItem,addItem,deleteItemById,getItems } from '@/lib/fetchUtils';
import { computed, ref, watch, watchEffect, onMounted } from 'vue'
import ShowCard from './ShowCard.vue';
import Card from '../mainGameComponents/Card.vue';

const inventoryProp = defineProps({
    userid:{
        type: Number,
        required: true
    }
})
const emit = defineEmits(['deckAdded'])
const selectedInventoryCards = ref([]);
const addCard = ref(false)
const removeCard = ref(false)
const maxDeckSize = 15
const showCardDetails = ref(false)
const selectedCard = ref(null)


const editingDeckName = ref(false);
const tempDeckName = ref('');
const inventory = ref(null); // entire inventory object
const decks = ref([]);
const cards = ref([]);
const characters = ref([]);
const selectedDeckCards = ref([])
const selectedDeck = ref()
const showDeckNameModal = ref(false);
const newDeckName = ref('');


const fetchInventory = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_URL}/api/inventory/${inventoryProp.userid}`;
    console.log('userid:', inventoryProp.userid)
    const data = await getItems(url);
    inventory.value = data;

    // Extract cards, characters, and decks
    cards.value = data.cards || [];
    characters.value = data.characters || [];
    decks.value = data.deck || [];
    console.log(decks)
  } catch (err) {
    alert('Failed to fetch inventory');
    console.error(err);
  }
};


onMounted(fetchInventory);
watch(() => inventoryProp.userid, fetchInventory, { immediate: true });
const uniqueDecks = computed(() => decks.value.map(deck => deck.deckid));

const fetchDeckDetails = async () => {
  try{
      const url = `${import.meta.env.VITE_APP_URL}/api/deck/${selectedDeck.value}`
     selectedDeckCards.value = await getItems(url);
      //console.log('Fetched deck data:', selectedDeckCards);
  }catch(error){
     //console.error('Failed to load cards in deck:', error);
  }
}

watch(selectedDeck, async (newDeckId) => {
  if (!newDeckId || newDeckId === 'AddDeck') {
    selectedDeckCards.value = [];
    return;
  }

  await fetchDeckDetails(); // updates selectedDeckCards
  //console.log(selectedDeckCards)
});
const availableCharacters = computed(() => characters.value.map(c => c.id));
const editingDeck = async () => {
  if (selectedDeck.value === 'AddDeck') {
    showDeckNameModal.value = true;
    return;
  }

  if (!selectedDeck.value || selectedInventoryCards.value.length === 0) {
    alert('Please select a deck and at least one card from the inventory.');
    return;
  }

  const deckToEdit = decks.value.find(deck => deck.id === selectedDeck.value);
  if (!deckToEdit) {
    alert('Deck not found.');
    return;
  }

  let updatedCardIds = selectedDeckCards.value?.cards?.map(c => c.id) || [];

  if (addCard.value) {
    if (updatedCardIds.length + selectedInventoryCards.value.length > maxDeckSize) {
      alert(`Decks can have a maximum of ${maxDeckSize} cards.`);
      return;
    }
    selectedInventoryCards.value.forEach(card => {
      if (!updatedCardIds.includes(card.id)) {
        updatedCardIds.push(card.id);
      }
    });
  }

  if (removeCard.value) {
    updatedCardIds = updatedCardIds.filter(
      id => !selectedInventoryCards.value.some(card => card.id === id)
    );
  }

  const editPayload = {
    deckname: deckToEdit.deckname,
    cardIds: updatedCardIds
  };

  try {
    const editedDeck = await editItem(
      `${import.meta.env.VITE_APP_URL}/api/deck/edit`,deckToEdit.id,editPayload
    );

    if (editedDeck) {
      selectedInventoryCards.value = [];
      await fetchDeckDetails();
      setNormalState();
      alert('Deck updated successfully');
    }
  } catch (error) {
    alert('Failed to update deck');
    console.error(error);
  }
};

const confirmDeckCreation = async () => {
  const name = newDeckName.value.trim();
  const deckName = name !== '' ? name : `Deck-${Math.floor(1000 + Math.random() * 9000)}`;

  if (selectedInventoryCards.value.length === 0) {
    alert('Please select at least one card to create a new deck.');
    return;
  }

  const newDeck = {
    userid: inventoryProp.userid,
    deckName,
    cardIds: selectedInventoryCards.value.map(card => card.id)
  };

  try {
    const addedDeck = await addItem(`${import.meta.env.VITE_APP_URL}/api/deck/create`, newDeck);
    if (addedDeck) {
      decks.value.push(addedDeck);
      selectedDeck.value = addedDeck.id;
      selectedInventoryCards.value = [];
      newDeckName.value = '';
      showDeckNameModal.value = false;
      emit('deckAdded');
    }
  } catch (error) {
    alert('Failed to add new deck');
    console.error(error);
  }
};


const setAddCard = () =>{
    addCard.value = true
    removeCard.value = false
}

const setRemoveCard = () =>{
    removeCard.value = true
    addCard.value = false
}
const setNormalState = () =>{
    addCard.value = false
    removeCard.value = false
}

const filteredInventoryCards = computed(() => {
  const deckCardIds = new Set(selectedDeckCards.value.cards?.map(card => card.id));
  return cards.value.filter(card => !deckCardIds.has(card.id));
});

const selectInventoryCardFunc = (card) => {
  const index = selectedInventoryCards.value.findIndex(c => c.id === card.id);

  if (removeCard.value) {
    if (index === -1) {
      selectedInventoryCards.value.push(card);
    } else {
      selectedInventoryCards.value.splice(index, 1);
    }
  } 
  else if (addCard.value || selectedDeck.value === 'AddDeck') {
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

const removeSelectedDeck = async () => {
  if (!selectedDeck.value || selectedDeck.value === 'AddDeck') {
    alert('Please select a deck to remove.');
    return;
  }

  const confirmed = confirm("Are you sure you want to delete this deck?");
  if (!confirmed) return;

  try {
    await deleteItemById(`${import.meta.env.VITE_APP_URL}/api/deck/delete`, selectedDeck.value);
    decks.value = decks.value.filter(deck => deck.deckid !== selectedDeck.value);
    selectedDeck.value = decks.value.length ? decks.value[0].deckid : null;
    alert('Deck deleted successfully');
  } catch (err) {
    alert('Failed to delete deck');
    console.error(err);
  }
};
watch(uniqueDecks, (newDecks) => {
    if (newDecks.length > 0) {
        selectedDeck.value = null; // ให้ default เป็น null เสมอ
    }
}, { immediate: true })

const handleCardClick = (card) => {
if (!addCard.value && !removeCard.value) {
  selectedCard.value = card
  showCardDetails.value = true
    }
}

const closeCardDetails = () => {
  showCardDetails.value = false
  selectedCard.value = null
}

const hoverBtnSound = new Audio('/sounds/se/hover.mp3');
hoverBtnSound.volume = 0.1

const playHoverButton = () => {
    hoverBtnSound.currentTime = 0
    hoverBtnSound.play()//.catch(error => console.log("Sound play error:", error))
}

const hoverCardSound = '/sounds/se/cardhover.mp3';

const playHoverCard = () => {
    const cardsound = new Audio(hoverCardSound)
    cardsound.volume = 0.5
    cardsound.currentTime = 0
    cardsound.play()//.catch(error => console.log("Sound play error:", error))
}
const saveDeckName = async () => {
  const deckToEdit = decks.value.find(deck => deck.id === selectedDeck.value);
  if (!deckToEdit) return;

  try {
    const updated = await editItem(
      `${import.meta.env.VITE_APP_URL}/api/deck/edit`,
      deckToEdit.id,
      {
        deckname: tempDeckName.value,
        cardIds: selectedDeckCards.value.cards.map(c => c.id)
      }
    );

    if (updated) {
      deckToEdit.deckname = tempDeckName.value; 
      editingDeckName.value = false;
      alert('Deck name updated');
    }
  } catch (err) {
    alert('Failed to update deck name');
    console.error(err);
  }
};

</script>

<template>
    <div class="bg-gray-900 min-h-screen w-full py-8 px-4 overflow-y-auto" v-if="!lobbyPageStatus">
        <div class="container mx-auto max-w-7xl bg-gray-800 rounded-lg shadow-xl overflow-hidden flex flex-col">
            <header class="bg-gray-700 py-4 px-6 border-b border-gray-600">
                <h2 class="text-2xl font-semibold text-white text-center">Player Inventory</h2>
            </header>

            <section class="p-6 flex-grow">
                <h3 class="text-lg font-semibold text-gray-300 mb-4">Deck Management</h3>

                <div class="mb-4">
                    <label for="selectedDeck" class="block text-gray-400 text-sm font-bold mb-2">Select Deck:</label>
                    <select v-model="selectedDeck" id="selectedDeck" :key="decks.length"
                        class="shadow border rounded w-full py-2 px-3 bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option v-for="deck in decks" :key="deck.id" :value="deck.id">{{ deck.deckname }}</option>
                        <option value="AddDeck"> Add Deck </option>
                    </select>
                </div>

                <div v-if="selectedDeck && selectedDeckCards && selectedDeckCards.cards && selectedDeckCards.cards.length > 0" class="mb-6">
                    <h4 class="text-md font-semibold text-gray-300 mb-2">Cards in Selected Deck:</h4>
                    <p v-if="removeCard" class="text-red-400 text-sm mb-2">Select cards to remove from the deck.</p>
                    <div class="flex flex-wrap gap-4">
                        <!-- Cards in selected deck -->
                            <div v-for="card in selectedDeckCards.cards" :key="card.id"
                              @click="selectInventoryCardFunc(card)"
                              :class="[
                                'cursor-pointer relative w-36 h-54 bg-gray-800 border-4 border-gray-600 rounded-lg hover:scale-105 transition-transform',
                                selectedInventoryCards.some(selectedCard => selectedCard.id === card.id) ? 'shadow-lg border-purple-500' : '',
                                addCard.value && selectedInventoryCards.some(selectedCard => selectedCard.id === card.id) ? 'bg-green-700 border-green-500' : '',
                                removeCard.value && selectedInventoryCards.some(selectedCard => selectedCard.id === card.id) ? 'bg-red-700 border-red-500' : ''
                              ]"
                            >
                              <Card
                                class="scale-59 right-8/21 bottom-9/25 object-cover rounded-lg"
                                :title="card.cardname || card.cardName"
                                :imageUrl="`/cards/${card.id}.png`"
                                :score="card.power"
                                :pawnsRequired="card.pawnsRequired"
                                :pawnLocations="card.pawnLocations"
                                :Ability="card.abilityType"
                              />
                            </div>
                    </div>
                    <button
                        v-if="selectedDeck && selectedDeck !== 'AddDeck'"
                        @click="removeSelectedDeck"
                        class="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:ring-2 focus:ring-red-500">
                        Remove Deck
                    </button>
                </div>
                <div class="flex gap-4 mb-4 items-center">
                  <button @mouseenter="playHoverButton" @click="setAddCard"
                    class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-green-500">
                    {{ addCard ? 'Adding Card...' : 'Add Card to Deck' }}
                  </button>

                  <button @mouseenter="playHoverButton" @click="setRemoveCard"
                    class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-red-500">
                    {{ removeCard ? 'Removing Card...' : 'Remove Card from Deck' }}
                  </button>
                
                  <button @mouseenter="playHoverButton" @click="setNormalState"
                    class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500">
                    Cancel
                  </button>

                  <!-- Edit Deck Name Button -->
                  <button v-if="selectedDeck && selectedDeck !== 'AddDeck'" 
                    @click="() => { editingDeckName = true; tempDeckName = decks.find(d => d.id === selectedDeck)?.deckname || '' }"
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Edit Deck Name
                  </button>
                </div>

<!-- Inline Deck Name Editor -->
<div v-if="editingDeckName" class="flex gap-2 mt-2 items-center">
  <input v-model="tempDeckName"
    class="bg-gray-700 text-white rounded px-2 py-1 border border-gray-500 focus:outline-none"
    placeholder="Enter new deck name" />

  <button @click="saveDeckName"
    class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded">
    Save
  </button>
  <button @click="editingDeckName = false"
    class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">
    Cancel
  </button>
</div>

            </section>

            <section class="p-6 border-t border-gray-600 flex-grow">
                <h3 class="text-lg font-semibold text-gray-300 mb-4">Inventory Cards</h3>
                <p v-if="addCard && selectedDeck === 'AddDeck'" class="text-green-400 text-sm mb-2">Select cards to create a new deck.</p>
                <p v-else-if="addCard" class="text-green-400 text-sm mb-2">Select cards to add to the selected deck.</p>
                <div class="flex flex-wrap gap-4">
                  <!-- Cards in inventory -->
                        <div v-for="card in filteredInventoryCards" :key="card.id"
                          @mouseenter="playHoverCard"
                          @click="selectInventoryCardFunc(card)"
                          :class="[
                            'cursor-pointer relative w-36 h-54 bg-gray-800 border-4 border-gray-600 rounded-lg hover:scale-105 transition-transform',
                            selectedInventoryCards.some(selectedCard => selectedCard.id === card.id) ? 'shadow-lg border-purple-500' : '',
                            addCard.value && selectedInventoryCards.some(selectedCard => selectedCard.id === card.id) ? 'bg-green-700 border-green-500' : '',
                            removeCard.value && selectedInventoryCards.some(selectedCard => selectedCard.id === card.id) ? 'bg-red-700 border-red-500' : ''
                          ]"
                        >
                          <Card
                            class="scale-59 right-8/21 bottom-9/25 object-cover rounded-lg"
                            :title="card.cardname"
                            :imageUrl="`/cards/${card.id}.png`"
                            :score="card.power"
                            :pawnsRequired="card.pawnsRequired"
                            :pawnLocations="card.pawnLocations"
                            :Ability="card.abilityType"
                          />
                        </div>

                </div>
                <button @mouseenter="playHoverButton" @click="editingDeck"
                    class="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded mt-4 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {{ selectedDeck === 'AddDeck' ? 'Create Deck' : 'Save Changes' }}
                </button>
            </section>

            <footer class="bg-gray-700 py-4 px-6 border-t border-gray-600 text-right">
                <button @mouseenter="playHoverButton" @click="setLobbyPage"
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
                    Go to Lobby
                </button>
            </footer>
        </div>
        <ShowCard v-if="showCardDetails && selectedCard" :card="selectedCard" @close="closeCardDetails" />
    </div>
    <!-- Deck Name Modal -->
<div v-if="showDeckNameModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
  <div class="bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
    <h3 class="text-lg font-semibold text-white mb-4">Enter Deck Name</h3>
    <input
      v-model="newDeckName"
      type="text"
      placeholder="Enter deck name (optional)"
      class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 mb-4"
    />
    <div class="flex justify-end space-x-4">
      <button
        @click="showDeckNameModal = false"
        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
        Cancel
      </button>
      <button
        @click="confirmDeckCreation"
        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
        Create
      </button>
    </div>
  </div>
</div>
<button @click="$router.push({ name: 'LobbyList', params: { userid: inventoryProp.userid } })"
  class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Go to Lobby
</button>
</template>

<style scoped></style>