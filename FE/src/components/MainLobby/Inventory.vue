<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';

const router = useRouter();

// --- State (Data) ---
const userInventory = ref([]);
const normalizedInventory = ref([]);
const allDecks = ref([]);
const activeDeck = ref(null);
const userProfile = ref(null);

const selectedDeckId = ref(null);
const currentDeckDetails = ref(null);
const deckTitle = ref("New Deck");

// --- State (UI) ---
const isLoading = ref(true);
const error = ref(null);
const saveStatus = ref(''); 

// --- State (Modals) ---
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);

const showDeleteModal = ref(false);
const isDeleting = ref(false);

// --- State (Notification Toast) ---
const notification = ref(null);
let notificationTimer = null;

// --- Helpers ---
const getCardId = (cardObj) => {
  if (!cardObj) return null;
  // Handle nested cardId object structure
  if (cardObj.cardId && typeof cardObj.cardId === 'object') {
    return cardObj.cardId._id;
  }
  // Return the actual ID value
  return cardObj.cardId || cardObj._id || null;
};

const getCardLocalId = (cardObj) => { 
    return cardObj._localId || getCardId(cardObj);
};

const getCardName = (cardObj) => {
    return cardObj?.cardId?.name || cardObj?.name || 'Unknown Card';
};

const getCardType = (cardObj) => {
    return cardObj?.cardId?.cardType || cardObj?.cardType || 'Card'; 
};

const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// Flattens the inventory list, duplicating cards based on inventoryQuantity 
// and assigning a unique _localId for FE tracking.
const normalizeInventory = (inventoryList) => { 
    const normalized = [];
    if (!Array.isArray(inventoryList)) return normalized;

    inventoryList.forEach(card => {
        const count = card.inventoryQuantity || 1;
        const apiId = getCardId(card);

        for (let i = 0; i < count; i++) {
            // Assign a unique local ID for tracking individual copies in the UI
            normalized.push({
                ...card,
                _localId: `${apiId}_${i}`, 
                _originalApiId: apiId, // Store the original API ID separately
                cardId: apiId, 
                name: getCardName(card), 
                cardType: getCardType(card),
            });
        }
    });
    return normalized;
};

// --- Data Fetching ---
const loadAllData = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const [inventoryRes, decksRes, activeDeckRes, userRes] = await Promise.all([
      fetchApi('/inventory'),
      fetchApi('/decks'), 
      fetchApi('/decks/active'),
      fetchApi('/auth/me')
    ]);

    // 1. User Profile
    userProfile.value = userRes.data?.user || {};

    // 2. Inventory (Handle various API response structures)
    const invData = inventoryRes.data;
    let rawInventory = [];
    if (Array.isArray(invData)) {
        rawInventory = invData;
    } else if (Array.isArray(invData?.inventory?.cards)) {
        rawInventory = invData.inventory.cards;
    } else if (Array.isArray(invData?.cards)) {
        rawInventory = invData.cards;
    } else if (Array.isArray(invData?.data)) { 
        rawInventory = invData.data;
    }
    userInventory.value = rawInventory;
    normalizedInventory.value = normalizeInventory(rawInventory); 

    // 3. Decks (List)
    const dData = decksRes.data; 
    let finalDecks = [];
    
    if (Array.isArray(dData)) {
        finalDecks = dData;
    } else if (dData?.decks && Array.isArray(dData.decks)) {
        finalDecks = dData.decks;
    } else if (dData?.data?.decks && Array.isArray(dData.data.decks)) {
        finalDecks = dData.data.decks;
    } else if (dData?.data && Array.isArray(dData.data)) {
        finalDecks = dData.data;
    }
    
    allDecks.value = finalDecks.map(deck => ({
        _id: deck.deckId || deck._id,
        title: deck.deckTitle || deck.title,
        isActive: deck.isActive,
        cardCount: deck.cardCount,
        createdAt: deck.createdAt
    }));

    // 4. Active Deck
    activeDeck.value = activeDeckRes.data || null;

    if (activeDeck.value && activeDeck.value._id) {
      selectedDeckId.value = activeDeck.value._id;
      await fetchDeckDetails(activeDeck.value._id);
    } else if (allDecks.value.length > 0) {
      selectedDeckId.value = allDecks.value[0]._id;
      await fetchDeckDetails(allDecks.value[0]._id);
    } else {
      createNewDeck();
    }

  } catch (err) {
    console.error('Init Error:', err);
    error.value = 'Failed to load data.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
    loadAllData();
});

// --- Computed Properties ---
const currentDeckCards = computed(() => {
  if (!currentDeckDetails.value || !Array.isArray(currentDeckDetails.value.cards)) {
    return [];
  }
  
  try {
    return currentDeckDetails.value.cards
      .map(deckCard => {
           const localId = getCardLocalId(deckCard);
           const apiId = getCardId(deckCard);
           const inventoryCard = normalizedInventory.value.find(inv => getCardId(inv) === apiId);

           return {
               ...inventoryCard, 
               ...deckCard,      
               _localId: localId, 
               _originalApiId: apiId, // Preserve original API ID
               cardId: apiId, 
           };
       })
      .sort((a, b) => a.position - b.position);
  } catch (e) {
    console.error('Error processing deck cards:', e);
    return [];
  }
});

// *** FIX: Show all available cards including duplicates ***
const availableCollection = computed(() => {
  if (!Array.isArray(normalizedInventory.value)) return [];
  if (!currentDeckDetails.value?.cards) return normalizedInventory.value;

  try {
    // Use _localId to track which specific card copies are in the deck
    const deckCardLocalIds = new Set(currentDeckCards.value.map(card => getCardLocalId(card)));
    
    // Filter: Only exclude cards whose specific _localId is in the deck
    return normalizedInventory.value.filter(invCard => {
        const localId = getCardLocalId(invCard);
        return localId && !deckCardLocalIds.has(localId); 
    });
  } catch (e) {
    console.error('Error processing collection:', e);
    return [];
  }
});

// --- Functions ---
const fetchDeckDetails = async (deckId) => {
  if (!deckId || deckId === 'new') return;

  isLoading.value = true;
  try {
    const res = await fetchApi(`/decks/${deckId}`);
    const deckData = res.data?.data?.deck || res.data?.deck || res.data || {};

    // Ensure each card in the loaded deck has a unique _localId
    const cardsWithLocalIds = Array.isArray(deckData.cards) 
      ? deckData.cards.map((card, idx) => ({
          ...card,
          _localId: card._localId || `${getCardId(card)}_deck_${idx}` // Generate unique ID if missing
        }))
      : [];

    currentDeckDetails.value = {
        ...deckData,
        cards: cardsWithLocalIds
    };

    deckTitle.value = deckData.deckTitle || deckData.title || 'Untitled Deck';
    selectedDeckId.value = deckData.deckId || deckData._id || deckId;

  } catch (err) {
    console.error('Fetch Deck Error:', err);
    createNewDeck();
  } finally {
    isLoading.value = false;
  }
};

const handleDeckSelect = (event) => {
  const newDeckId = event.target.value;
  if (newDeckId === 'new') {
    createNewDeck();
  } else {
    fetchDeckDetails(newDeckId);
  }
};

const createNewDeck = () => {
  selectedDeckId.value = 'new';
  currentDeckDetails.value = { _id: null, title: 'New Deck', cards: [] };
  deckTitle.value = "New Deck";
};

const addCardToDeck = (inventoryCard) => {
  if (!currentDeckDetails.value) return;
  if (!Array.isArray(currentDeckDetails.value.cards)) {
      currentDeckDetails.value.cards = [];
  }
  // Prevent adding if deck is full (max 30 cards)
  if (currentDeckCards.value.length >= 30) {
      showNotification('warning', 'Deck is full (Max 30 cards).');
      return;
  }
  
  const apiId = inventoryCard._originalApiId || getCardId(inventoryCard);
  const localId = getCardLocalId(inventoryCard);

  if (!apiId) {
    console.error('Cannot add card without valid API ID:', inventoryCard);
    showNotification('error', 'Invalid card data');
    return;
  }

  const newCardInDeck = {
    _localId: localId, 
    _originalApiId: apiId, // Store original API ID
    cardId: apiId, // This is what the backend needs
    name: getCardName(inventoryCard),
    cardType: getCardType(inventoryCard),
    power: inventoryCard.power,
    position: currentDeckDetails.value.cards.length
  };
  
  currentDeckDetails.value.cards.push(newCardInDeck);
};

const removeCardFromDeck = (deckCard) => {
  if (!currentDeckDetails.value?.cards) return;

  const targetLocalId = getCardLocalId(deckCard);
  if (!targetLocalId) return;
  
  currentDeckDetails.value.cards = currentDeckDetails.value.cards
    .filter(card => getCardLocalId(card) !== targetLocalId)
    .map((card, index) => ({ ...card, position: index }));
};

// --- Save Deck (Fixed to use correct cardId) ---
const saveDeck = async () => {
  saveStatus.value = 'Saving...';
  
  const cardsCount = currentDeckCards.value?.length || 0;
  if (cardsCount < 15) {
    saveStatus.value = '';
    showNotification('warning', 'Deck must have at least 15 cards.');
    return;
  }
  
  // Get character ID
  let characterId = currentDeckDetails.value?.characterId;
  if (!characterId) {
      const characters = userInventory.value.filter(c => getCardType(c) === 'character');
      if (characters.length > 0) {
          characterId = getCardId(characters[0]);
      }
  }
  if (!characterId) characterId = "691d2a801c9558afb39dc29d"; // Fallback to Strategist Knight from your data

  // *** FIX: Use _originalApiId for the payload ***
  const payload = {
    deckTitle: deckTitle.value,
    characterId: characterId,
    cards: currentDeckCards.value.map((card, index) => {
      const cardId = card._originalApiId || getCardId(card);
      if (!cardId) {
        console.error('Card missing valid ID:', card);
      }
      return { 
        cardId: cardId, // Send the actual MongoDB ObjectId
        position: index
      };
    })
  };

  console.log('Save Payload:', JSON.stringify(payload, null, 2)); // Debug log

  try {
    let savedDeckData;

    if (selectedDeckId.value === 'new') {
      const res = await fetchApi('/decks', { method: 'POST', body: payload });
      savedDeckData = res.data?.data?.deck || res.data?.data || res.data;
      
      const newDeckId = savedDeckData.deckId || savedDeckData._id;

      const newDeckForList = {
        _id: newDeckId,
        title: savedDeckData.deckTitle || savedDeckData.title || deckTitle.value,
        isActive: savedDeckData.isActive || false,
        cardCount: savedDeckData.cardCount || cardsCount,
        createdAt: savedDeckData.createdAt || new Date().toISOString()
      };

      allDecks.value.push(newDeckForList);
      selectedDeckId.value = newDeckId; 

    } else {
      const res = await fetchApi(`/decks/${selectedDeckId.value}`, { method: 'PUT', body: payload });
      savedDeckData = res.data?.data?.deck || res.data?.data || res.data;

      const idx = allDecks.value.findIndex(d => d._id === selectedDeckId.value);
      if (idx !== -1) {
          allDecks.value[idx].title = savedDeckData.deckTitle || savedDeckData.title || deckTitle.value;
          allDecks.value[idx].cardCount = savedDeckData.cardCount || cardsCount;
      }
    }
    
    // Update current deck details with proper _localId
    const cardsWithLocalIds = Array.isArray(savedDeckData.cards)
      ? savedDeckData.cards.map((card, idx) => ({
          ...card,
          _localId: `${getCardId(card)}_saved_${idx}`
        }))
      : currentDeckDetails.value.cards;

    currentDeckDetails.value = {
        ...savedDeckData,
        cards: cardsWithLocalIds
    };
    
    deckTitle.value = savedDeckData.deckTitle || savedDeckData.title || deckTitle.value;
    
    saveStatus.value = 'Deck Saved!';
    showNotification('success', 'Deck saved successfully!');

  } catch (err) {
    console.error('Save Error:', err);
    const msg = err.response?.data?.message || err.message || 'Unknown error during save.';
    saveStatus.value = 'Error';
    showNotification('error', msg);
  } finally {
    setTimeout(() => { saveStatus.value = ''; }, 3000);
  }
};

// --- Delete Logic ---
const handleDeleteClick = () => {
  const deckId = selectedDeckId.value;
  if (!deckId || deckId === 'new') {
    showNotification('warning', 'Cannot delete an unsaved deck.');
    return;
  }
  showDeleteModal.value = true;
};

const cancelDelete = () => {
  if (!isDeleting.value) showDeleteModal.value = false;
};

const confirmDelete = async () => {
  isDeleting.value = true; 
  const deckId = selectedDeckId.value;

  try {
    await fetchApi(`/decks/${deckId}`, { method: 'DELETE' });
    
    showNotification('success', 'Deck deleted successfully.');
    
    allDecks.value = allDecks.value.filter(d => d._id !== deckId);
    
    createNewDeck();

  } catch (err) {
    console.error(err);
    showNotification('error', err.message || 'Failed to delete deck.');
  } finally {
    isDeleting.value = false;
    showDeleteModal.value = false;
  }
};

// --- Logout ---
const handleLogoutClick = () => { showLogoutModal.value = true; };
const cancelLogout = () => { if (!isLoggingOut.value) showLogoutModal.value = false; };
const confirmLogout = async () => {
  isLoggingOut.value = true;
  setTimeout(async () => {
    try { await fetchApi('/auth/logout', { method: 'POST' }); } 
    catch (e) { console.error(e); }
    finally {
      localStorage.removeItem('isLoggedIn');
      isLoggingOut.value = false;
      showLogoutModal.value = false;
      router.push('/');
    }
  }, 3000);
};

const goToMainMenu = () => router.push('/');
</script>

<template>
  <!-- Template remains exactly the same -->
  <div id="inventory-bg" class="min-h-screen p-4 md:p-8 overflow-hidden font-sans-custom relative">
    
    <Transition name="slide-down">
      <div 
        v-if="notification"
        :class="[
          'fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-lg shadow-xl max-w-sm w-[90%]',
          notification.type === 'success' ? 'bg-green-600 border border-green-500' : '',
          notification.type === 'error' ? 'bg-red-600 border border-red-500' : '',
          notification.type === 'warning' ? 'bg-yellow-600 border border-yellow-500' : ''
        ]"
      >
        <div class="flex items-center">
          <svg v-if="notification.type === 'success'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <svg v-if="notification.type === 'error'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" /></svg>
          <svg v-if="notification.type === 'warning'" class="h-6 w-6 text-white mr-3 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15h.01" /></svg>
          
          <span class="text-white text-sm font-medium">{{ notification.message }}</span>
        </div>
      </div>
    </Transition>

    <Transition name="fade-modal">
      <div v-if="showLogoutModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="bg-stone-800 border-4 border-yellow-900 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden transform transition-all">
          <div v-if="isLoggingOut" class="py-8 flex flex-col items-center">
            <svg class="animate-spin h-14 w-14 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-yellow-100 text-xl font-bold animate-pulse font-['Creepster'] tracking-widest">LOGGING OUT...</p>
          </div>
          <div v-else>
            <h3 class="text-3xl font-bold text-yellow-100 mb-4 font-['Creepster'] tracking-wide text-shadow">LOGOUT?</h3>
            <p class="text-stone-300 mb-8 text-lg">Are you sure you want to retreat from the battlefield?</p>
            <div class="flex gap-4 justify-center">
              <button @click="cancelLogout" class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">NO</button>
              <button @click="confirmLogout" class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">YES</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade-modal">
      <div v-if="showDeleteModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        <div class="bg-stone-800 border-4 border-red-900 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden transform transition-all">
          
          <div v-if="isDeleting" class="py-8 flex flex-col items-center">
            <svg class="animate-spin h-14 w-14 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-red-100 text-xl font-bold animate-pulse font-['Creepster'] tracking-widest">DELETING...</p>
          </div>
          
          <div v-else>
            <h3 class="text-3xl font-bold text-red-500 mb-4 font-['Creepster'] tracking-wide text-shadow">DELETE DECK?</h3>
            <p class="text-stone-300 mb-2 text-lg">You are about to delete:</p>
            <p class="text-yellow-400 text-xl font-bold mb-8">"{{ deckTitle }}"</p>
            
            <div class="flex gap-4 justify-center">
              <button @click="cancelDelete" class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">CANCEL</button>
              <button @click="confirmDelete" class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg">DELETE</button>
            </div>
          </div>

          <div class="absolute top-2 left-2 w-2 h-2 bg-red-800 rounded-full opacity-50"></div>
          <div class="absolute top-2 right-2 w-2 h-2 bg-red-800 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 left-2 w-2 h-2 bg-red-800 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 right-2 w-2 h-2 bg-red-800 rounded-full opacity-50"></div>
        </div>
      </div>
    </Transition>

    <div class="w-full max-w-7xl mx-auto flex justify-between items-center mb-6">
      <button @click="goToMainMenu" class="flex items-center justify-center bg-yellow-700 hover:bg-yellow-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-yellow-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-yellow-500 border-b-4 border-r-4 border-yellow-900 active:translate-y-px active:border-b-2 active:border-r-2">
        <svg class="h-6 w-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> MAIN MENU
      </button>
      <button @click="handleLogoutClick" class="flex items-center justify-center bg-orange-700 hover:bg-orange-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-orange-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-orange-500 border-b-4 border-r-4 border-orange-900 active:translate-y-px active:border-b-2 active:border-r-2">
        LOGOUT <svg class="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
      </button>
    </div>

    <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-stone-800 border border-stone-700 p-6 rounded-lg shadow-xl text-center">
          <h2 class="text-2xl font-bold text-yellow-100 mb-4">Profile</h2>
          <div class="w-full h-48 bg-stone-900 rounded border border-stone-600 flex items-center justify-center overflow-hidden mb-4">
            <img v-if="userProfile?.profilePic && userProfile.profilePic !== '/avatars/default.png'" :src="userProfile.profilePic" alt="Profile" class="w-full h-full object-cover" />
            <div v-else class="flex flex-col items-center text-stone-500">
               <svg class="h-16 w-16 mb-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
               <span>No Avatar</span>
            </div>
          </div>
          <p class="text-xl text-yellow-500 font-bold break-words">{{ userProfile?.displayName || 'Unknown Warrior' }}</p>
          
          <div v-if="userProfile?.stats" class="grid grid-cols-2 gap-2 mt-4 text-sm text-stone-300">
             <div class="bg-stone-900 p-2 rounded border border-stone-700">Wins: <span class="text-green-400">{{ userProfile.stats.wins || 0 }}</span></div>
             <div class="bg-stone-900 p-2 rounded border border-stone-700">Losses: <span class="text-red-400">{{ userProfile.stats.losses || 0 }}</span></div>
           </div>
        </div>

        <div class="bg-stone-800 border border-stone-700 p-6 rounded-lg shadow-xl space-y-4">
          <h2 class="text-2xl font-bold text-yellow-100 mb-4">Decks</h2>
          <select v-model="selectedDeckId" @change="handleDeckSelect" class="w-full p-3 bg-stone-900 border border-stone-700 rounded-md text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500">
            <option value="new">-- Create New Deck --</option>
            <option v-for="deck in allDecks" :key="deck._id" :value="deck._id">{{ deck.title }}</option>
          </select>
          <button @click="createNewDeck" class="w-full p-3 bg-stone-600 hover:bg-stone-500 text-yellow-100 font-bold rounded-md transition-colors">New Deck</button>
        </div>
      </aside>

      <main class="lg:col-span-3 space-y-6">
        
        <div class="bg-stone-800 border border-stone-700 p-6 rounded-lg shadow-xl">
            <div class="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-4">
                <input type="text" v-model="deckTitle" class="flex-grow p-3 bg-stone-900 border border-stone-700 rounded-md text-yellow-100 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Deck Title" />
                <div class="flex gap-2">
                    <button @click="handleDeleteClick" class="p-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-md transition-colors" :disabled="selectedDeckId === 'new'">Delete</button>
                    <button @click="saveDeck" class="p-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors w-32">{{ saveStatus.startsWith('Saving') ? 'Saving...' : 'Save' }}</button>
                </div>
            </div>
            <p v-if="saveStatus && !saveStatus.startsWith('Saving')" class="text-center h-4 mb-2" :class="saveStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'">{{ saveStatus }}</p>

            <div class="min-h-[250px] bg-stone-900/50 border border-stone-700 rounded p-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3 overflow-y-auto custom-scrollbar">
                <div v-for="card in currentDeckCards" :key="getCardLocalId(card)" @click="removeCardFromDeck(card)" class="h-40 bg-stone-700 rounded border-2 border-green-500 text-white p-2 cursor-pointer hover:border-red-500 flex flex-col justify-between" title="Click to Remove">
                    <p class="font-bold text-sm truncate">{{ getCardName(card) }}</p>
                    <p class="text-xs text-stone-400">{{ getCardType(card) }}</p>
                </div>
                <div v-if="currentDeckCards.length === 0" class="col-span-full flex items-center justify-center h-40">
                    <p class="text-stone-500">Click cards from your collection below to add them here.</p>
                </div>
            </div>
            <p class="text-right text-lg font-bold text-yellow-100 mt-2">Cards: {{ currentDeckCards.length }} / 30</p>
        </div>

        <div class="bg-stone-800 border border-stone-700 p-6 rounded-lg shadow-xl">
          <h2 class="text-2xl font-bold text-yellow-100 mb-4">Collection ({{ availableCollection.length }})</h2>
          
          <div class="min-h-[300px] max-h-[60vh] bg-stone-900/50 border border-stone-700 rounded p-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3 overflow-y-auto custom-scrollbar">
            <div v-for="card in availableCollection" :key="getCardLocalId(card)" @click="addCardToDeck(card)" class="h-40 bg-stone-700 rounded border-2 border-stone-600 text-white p-2 cursor-pointer hover:border-green-500 flex flex-col justify-between" title="Click to Add">
              <p class="font-bold text-sm truncate">{{ getCardName(card) }}</p>
              <p class="text-xs text-stone-400">{{ getCardType(card) }}</p>
            </div>

            <div v-if="isLoading" class="col-span-full flex items-center justify-center h-40">
              <svg class="animate-spin h-10 w-10 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div v-if="error" class="col-span-full flex items-center justify-center h-40">
              <p class="text-red-400">{{ error }}</p>
            </div>
          </div>
        </div>
      </main>

    </div>
  </div>
</template>

<style scoped>
#inventory-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

/* Modal & Notification Animations */
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

.slide-down-enter-active { transition: all 0.4s ease-out; }
.slide-down-leave-active { transition: all 0.3s ease-in; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; top: -5rem; }
.slide-down-enter-to, .slide-down-leave-from { opacity: 1; top: 1.25rem; }

.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(39, 39, 42, 0.5); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #eab308; border-radius: 10px; border: 2px solid rgba(39, 39, 42, 0.5); }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #facc15; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #eab308 rgba(39, 39, 42, 0.5); }
</style>