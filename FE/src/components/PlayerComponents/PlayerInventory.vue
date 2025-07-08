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
const selectedDeck = ref()
const deckDetails = ref()
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

const fetchInventory = async () => {
  try {
    const url = `${import.meta.env.VITE_APP_URL}/api/inventory/${inventoryProp.userid}`;
    const data = await getItems(url);
    inventory.value = data;
    cards.value = data.cards || [];
    characters.value = data.characters || [];
    decks.value = data.deck || [];
  } catch (err) {
    alert('Failed to fetch inventory');
    console.error(err);
  }
};

onMounted(fetchInventory);
watch(() => inventoryProp.userid, fetchInventory, { immediate: true });

const inventoryDetails = computed(() => {
  return [{
    deckid: decks.value.map(d => d.deckid),
    card: cards.value.map(c => c.id),
    deck: decks.value.map(d => d.deckid),
    character: characters.value.map(c => c.id)
  }];
});

const uniqueDecks = computed(() => decks.value.map(deck => deck.deckid));

//watch(() => inventoryProp.inventory, (newInventory) => {
//    if (!inventoryProp.currentUser) return
//
//    const userInventory = newInventory.find(inv => inv.uid === inventoryProp.currentUser.uid)
//
//    if (userInventory && userInventory.deckid) {
//        uniqueDecks.value = inventoryProp.decks
//            .filter(deck => userInventory.deckid.includes(deck.deckid))
//            .map(deck => deck.deckid);
//    } else {
//        uniqueDecks.value = []
//    }
//}, { immediate: true, deep: true })

const getCardsInDeck = computed(() => {
  if (!selectedDeck.value || selectedDeck.value === 'AddDeck') return [];
  const foundDeck = decks.value.find(deck => deck.deckid === selectedDeck.value);
  if (!foundDeck?.cardid) return [];
  return foundDeck.cardid.map(id => cards.value.find(c => c.id === id)).filter(c => c);
});

const getCardsInInventory = computed(() => {
  const cardIdsInDeck = getCardsInDeck.value.map(c => c.id);
  return cards.value.filter(card => !cardIdsInDeck.includes(card.id));
});

const availableCharacters = computed(() => characters.value.map(c => c.id));

const editingDeck = async () =>{
    if(!selectedDeck.value || selectedInventoryCards.value.length === 0){
        alert('Please select a deck and at least one card from the inventory.')
        return
    }
    if(selectedDeck.value === 'AddDeck'){
        if (selectedInventoryCards.value.length > maxDeckSize) {
                alert(`Decks can have a maximum of ${maxDeckSize} cards.`)
                return
        } else {
            addingDeck()
        }
    }
    else{
        let deckToEdit = inventoryProp.decks.find(deck => deck.deckid === selectedDeck.value)
        if(addCard.value){
            if (deckToEdit.cardid.length + selectedInventoryCards.value.length > maxDeckSize) {
                alert(`Decks can have a maximum of ${maxDeckSize} cards.`)
                return
            }
            selectedInventoryCards.value.forEach(card => {
            if(!deckToEdit.cardid.includes(card.idcard)){
                deckToEdit.cardid.push(card.idcard)
            }})
            try{
            const editedDeck = await editItem(`${import.meta.env.VITE_APP_URL}/deck`, deckToEdit.id, deckToEdit)
            if (editedDeck) {
                alert('Deck updated successfully')
                setTimeout(() => {
                        selectedInventoryCards.value = []
                        setNormalState()
                    }, 300)
            }
            }catch (error) {
               alert('Failed to update deck:', error)
            }
        }
        if(removeCard.value){
            deckToEdit.cardid = deckToEdit.cardid.filter(
                cardId => !selectedInventoryCards.value.some(card => card.idcard === cardId)
            )
            try{
                const editedDeck = await editItem(`${import.meta.env.VITE_APP_URL}/deck`, deckToEdit.id, deckToEdit)
                if(editedDeck){
                    alert('Card(s) removed from deck successfully')
                    setTimeout(() => {
                        selectedInventoryCards.value = []
                        setNormalState()
                    }, 300)
                }
                }catch(error){
                   alert('Failed to remove cards from deck:', error)
                }
            }

            selectedInventoryCards.value = []
            setNormalState()
        }
    }

const addingDeck = async () =>{
    if (selectedInventoryCards.value.length === 0) {
        alert('Please select at least one card to create a new deck.')
        return
    }

    const newDeckId =  Math.floor(1000 + Math.random() * 9000)
        const newDeck = {
        deckid: newDeckId,
        cardid: selectedInventoryCards.value.map(card => card.idcard),
    }

    try {
        const addedDeck = await addItem(`${import.meta.env.VITE_APP_URL}/deck`, newDeck);
        if (addedDeck) {
            //console.log(`Deck ${newDeckId} added successfully.`);
            inventoryProp.decks.push(newDeck);
 
            if (inventoryProp.inventory.length > 0 && inventoryProp.currentUser) {
                const userInventoryItem = inventory.value
                if (userInventoryItem) {
                    userInventoryItem.deckid = [...(userInventoryItem.deckid || []), newDeckId];

                    try {
                        await editItem(`${import.meta.env.VITE_APP_URL}/inventory`, userInventoryItem.id, userInventoryItem)
                        //console.log(`Deck ID ${newDeckId} added to inventory.`)
                    } catch {
                        alert('Failed to update inventory with the new deck ID.');
                        //console.log("Error updating inventory:", error); // Log the error for debugging
                    }
                }
            }

            selectedDeck.value = newDeckId
            selectedInventoryCards.value = []
        }
    }catch{
        alert('Failed to add new deck'); // Log the error for debugging
    }
}
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
    const index = selectedInventoryCards.value.findIndex(selectedCard => selectedCard.idcard === card.idcard)
    const isInInventory = getCardsInInventory.value.some(invCard => invCard.idcard === card.idcard)
    if(removeCard.value){
        const isInDeck = getCardsInDeck.value.some(deckCard => deckCard && deckCard.idcard === card.idcard)
        if(isInDeck){
            if(index === -1){
                selectedInventoryCards.value.push(card)
            } else {
                selectedInventoryCards.value.splice(index, 1)
            }
        
        } else{
            alert('Please select a card from the deck to remove.')
            return
        }
    } 
    else if(addCard.value){
        if(isInInventory){
            if(index === -1){
                selectedInventoryCards.value.push(card)
            } else{
                selectedInventoryCards.value.splice(index,1)
            }
        } else {
            alert('Please select a card from the inventory to add.')
            return
        }
    }   
    else if (selectedDeck.value === 'AddDeck') {
        if (isInInventory) {
            if (index === -1) {
                selectedInventoryCards.value.push(card);
            } else {
                selectedInventoryCards.value.splice(index, 1);
            }
        } else {
            alert('Please select a card from the inventory to add.')
            return;
        }
    }
    else{
        handleCardClick(card)
    }
}
const removeSelectedDeck = async () =>{
    if(!selectedDeck.value || selectedDeck.value === 'AddDeck'){
        alert('Please select a deck to remove.');
        return
    }

    const deckIndex = inventoryProp.decks.findIndex(deck => deck.deckid === selectedDeck.value);
    if (deckIndex === -1) {
        alert('Deck not found.');
        return;
    }

    const deckToDelete = inventoryProp.decks[deckIndex];

    try {
        await deleteItemById(`${import.meta.env.VITE_APP_URL}/deck`, deckToDelete.id);
        //console.log(`Deck ID ${selectedDeck.value} removed successfully.`);

        if (inventoryProp.inventory.length > 0 && inventoryProp.currentUser) {
            const userInventoryItem = inventoryProp.inventory.find(inv => inv.uid === inventoryProp.currentUser.uid)//ดึงข้อมูลinvก่อนหน้านั้น
            if (userInventoryItem) {
                userInventoryItem.deckid = userInventoryItem.deckid.filter(id => id !== selectedDeck.value);

                try {
                    await editItem(`${import.meta.env.VITE_APP_URL}/inventory`, userInventoryItem.id, userInventoryItem)
                    //console.log(`Deck ID ${selectedDeck.value} removed from inventory.`)
                } catch {
                    alert('Failed to update inventory after removing the deck.')
                    //console.log('Error updating inventory:', error)
                }
            }
        }

        inventoryProp.decks.splice(deckIndex, 1);

        if (inventoryProp.decks.length > 0) {
            selectedDeck.value = inventoryProp.decks[Math.max(0, deckIndex - 1)].deckid;
        } else {
            selectedDeck.value = null;
        }

    } catch {
        alert('Error removing deck');
    }
};

const setLobbyPage = () => {
    //console.log("Switching to Lobby Page");
    lobbyPageStatus.value = true;
}

watch(selectedDeck, (newDeck) => {
  if (newDeck && newDeck !== "AddDeck") {
    deckDetails.value = inventoryProp.decks.find(deck => deck.deckid === newDeck);
  }
});

watch(uniqueDecks, (newDecks) => {
    if (newDecks.length > 0) {
        selectedDeck.value = null; // ให้ default เป็น null เสมอ
    }
}, { immediate: true })

//watchEffect(() => {
//    if (inventoryProp.inventory.length > 0 && inventoryProp.decks.length > 0) {
//        //console.log("Inventory and Decks Loaded:", inventoryProp.inventory, inventoryProp.decks);
//    }
//})

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
                    <select v-model="selectedDeck" id="selectedDeck" :key="uniqueDecks.length"
                        class="shadow border rounded w-full py-2 px-3 bg-gray-700 text-white border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option v-for="deck in uniqueDecks" :key="deck" :value="deck">{{ deck }}</option>
                        <option value="AddDeck"> Add Deck </option>
                    </select>
                </div>

                <div v-if="selectedDeck && getCardsInDeck && getCardsInDeck.length > 0" class="mb-6">
                    <h4 class="text-md font-semibold text-gray-300 mb-2">Cards in Selected Deck:</h4>
                    <p v-if="removeCard" class="text-red-400 text-sm mb-2">Select cards to remove from the deck.</p>
                    <div class="flex flex-wrap gap-4">
                        <div v-for="card in getCardsInDeck" :key="card.idcard"
                            @click="selectInventoryCardFunc(card)"
                            :class="[ 'cursor-pointer relative w-36 h-54 bg-gray-800 border-4 border-gray-600 rounded-lg hover:scale-105 transition-transform',
                                        selectedInventoryCards.some(selectedCard => selectedCard.idcard === card.idcard) ? 'shadow-lg border-purple-500' : '',
                                        addCard && selectedInventoryCards.some(selectedCard => selectedCard.idcard === card.idcard) ? 'bg-green-700 border-green-500' : '',
                                        removeCard && selectedInventoryCards.some(selectedCard => selectedCard.idcard === card.idcard) ? 'bg-red-700 border-red-500' : '']">
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
                    <div v-for="card in getCardsInInventory" :key="card.idcard"
                        @mouseenter="playHoverCard"
                        @click="selectInventoryCardFunc(card)"
                        :class="[ 'cursor-pointer relative w-36 h-54 bg-gray-800 border-4 border-gray-600 rounded-lg hover:scale-105 transition-transform',
                                    selectedInventoryCards.some(selectedCard => selectedCard.idcard === card.idcard) ? 'shadow-lg border-purple-500' : '',
                                    addCard && selectedInventoryCards.some(selectedCard => selectedCard.idcard === card.idcard) ? 'bg-green-700 border-green-500' : '',
                                    removeCard && selectedInventoryCards.some(selectedCard => selectedCard.idcard === card.idcard) ? 'bg-red-700 border-red-500' : '' ]">
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