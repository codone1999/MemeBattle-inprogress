<script setup>
import { editItem,addItem,deleteItemById,getItems } from '@/lib/fetchUtils';
import { computed, ref, watch, watchEffect, onMounted } from 'vue'
import GameLobby from '../UI/GameLobby.vue';
import ShowCard from './ShowCard.vue';
import Card from '../mainGameComponents/Card.vue';

const inventoryProp = defineProps({
    userid:{
        type: Number,
        required: true
    }
})
const emit = defineEmits(['deckAdded'])
//const deckDetails = ref()
const selectedInventoryCards = ref([]);
const addCard = ref(false)
const removeCard = ref(false)
const lobbyPageStatus = ref(false)
const maxDeckSize = 15
const showCardDetails = ref(false)
const selectedCard = ref(null)


const inventory = ref(null); // entire inventory object
const decks = ref([]);
const cards = ref([]);
const characters = ref([]);
const selectedDeckCards = ref([])
const selectedDeck = ref()

const fetchInventory = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_URL}/inventory/${inventoryProp.userid}`;
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
      const url = `${import.meta.env.VITE_APP_URL}/deck/${selectedDeck.value}`
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
//const getCardsInInventory = computed(() => {
//  const cardIdsInDeck = selectedDeckCards.value.map(c => c.id);
//  return cards.value.filter(card => !cardIdsInDeck.includes(card.id));
//});

const availableCharacters = computed(() => characters.value.map(c => c.id));
const editingDeck = async () => {
  if (selectedDeck.value === 'AddDeck') {
    await addingDeck();
    return;
  }

  if (!selectedDeck.value || selectedInventoryCards.value.length === 0) {
    alert('Please select a deck and at least one card from the inventory.');
    return;
  }

  // Find the deck object by id
  const deckToEdit = decks.value.find(deck => deck.id === selectedDeck.value);
  if (!deckToEdit) {
    alert('Deck not found.');
    return;
  }

  // ✅ FIX: get current cards from selectedDeckCards
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
    deckid: deckToEdit.id,
    deckname: deckToEdit.deckname,
    cardIds: updatedCardIds
  };
  console.log(editPayload)

  try {
    const editedDeck = await editItem(`${import.meta.env.VITE_APP_URL}/deck/edit`, deckToEdit.id, editPayload);
    if (editedDeck) {
      // Optional: update selectedDeckCards or deck object locally
      selectedInventoryCards.value = [];
      await fetchDeckDetails(); // Refresh card list in deck
      setNormalState();
      alert('Deck updated successfully');
    }
  } catch (error) {
    alert('Failed to update deck');
    console.error(error);
  }
};

const addingDeck = async () => {
  if (selectedInventoryCards.value.length === 0) {
    alert('Please select at least one card to create a new deck.');
    return;
  }

  const newDeck = {
    userid: inventoryProp.userid,
    deckName: `Deck-${Math.floor(1000 + Math.random() * 9000)}`,
    cardIds: selectedInventoryCards.value.map(card => card.id)
  };

  try {
    const addedDeck = await addItem(`${import.meta.env.VITE_APP_URL}/deck/create`, newDeck);
    if (addedDeck) {
      decks.value.push(addedDeck);
      selectedDeck.value = addedDeck.id;  // select newly created deck by id
      selectedInventoryCards.value = [];
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
const selectInventoryCardFunc = (card) => {
  const index = selectedInventoryCards.value.findIndex(c => c.id === card.id);

  if (removeCard.value) {
    // Only allow selecting cards that are actually in the deck
    const isInDeck = selectedDeckCards.value.some(deckCard => deckCard && deckCard.id === card.id);
    if (!isInDeck) {
      alert('Please select a card from the deck to remove.');
      return;
    }
    // Toggle selection in selectedInventoryCards
    if (index === -1) {
      selectedInventoryCards.value.push(card);
    } else {
      selectedInventoryCards.value.splice(index, 1);
    }
  } 
  else if (addCard.value) {
    // Only allow selecting cards that are in inventory (cards.value)
    const isInInventory = cards.value.some(invCard => invCard.id === card.id);
    if (!isInInventory) {
      alert('Please select a card from the inventory to add.');
      return;
    }
    // Toggle selection in selectedInventoryCards
    if (index === -1) {
      selectedInventoryCards.value.push(card);
    } else {
      selectedInventoryCards.value.splice(index, 1);
    }
  }
  else if (selectedDeck.value === 'AddDeck') {
    // When creating new deck, select cards from inventory
    const isInInventory = cards.value.some(invCard => invCard.id === card.id);
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
    // Normal click: show card details
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
    await deleteItemById(`${import.meta.env.VITE_APP_URL}/deck/delete`, selectedDeck.value);
    decks.value = decks.value.filter(deck => deck.deckid !== selectedDeck.value);
    selectedDeck.value = decks.value.length ? decks.value[0].deckid : null;
    alert('Deck deleted successfully');
  } catch (err) {
    alert('Failed to delete deck');
    console.error(err);
  }
};
const setLobbyPage = () => {
    //console.log("Switching to Lobby Page");
    lobbyPageStatus.value = true;
}

//atch(selectedDeck, (newDeck) => {
// if (newDeck && newDeck !== "AddDeck") {
//   deckDetails.value = decks.value.find(deck => deck.deckid === newDeck)
// }
//)


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

                <div class="flex gap-4 mb-4">
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
                </div>
            </section>

            <section class="p-6 border-t border-gray-600 flex-grow">
                <h3 class="text-lg font-semibold text-gray-300 mb-4">Inventory Cards</h3>
                <p v-if="addCard && selectedDeck === 'AddDeck'" class="text-green-400 text-sm mb-2">Select cards to create a new deck.</p>
                <p v-else-if="addCard" class="text-green-400 text-sm mb-2">Select cards to add to the selected deck.</p>
                <div class="flex flex-wrap gap-4">
                  <!-- Cards in inventory -->
                        <div v-for="card in cards" :key="card.id"
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
    <GameLobby
        :decks="uniqueDecks"
        :characters="availableCharacters"
        v-if="lobbyPageStatus" />
</template>

<style scoped></style>