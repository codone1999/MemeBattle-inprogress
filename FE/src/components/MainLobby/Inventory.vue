<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';

const router = useRouter();

// --- State ---
const userInventory = ref([]);
const allDecks = ref([]);
const activeDeck = ref(null);
const userProfile = ref(null);

const selectedDeckId = ref(null);
const currentDeckDetails = ref(null);
const deckTitle = ref("New Deck");

// UI State
const isLoading = ref(true);
const error = ref(null);
const saveStatus = ref('');

// --- State (Logout Modal) ---
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);

// --- Helper Functions ---
const getCardId = (cardObj) => {
  if (!cardObj) return null;
  if (cardObj.cardId && typeof cardObj.cardId === 'object') {
    return cardObj.cardId._id;
  }
  return cardObj.cardId || cardObj._id || null;
};

const getCardName = (cardObj) => {
    return cardObj?.cardId?.name || cardObj?.name || 'Unknown Card';
};

const getCardType = (cardObj) => {
    return cardObj?.cardId?.type || cardObj?.type || 'Card';
};

// --- Data Fetching ---
onMounted(async () => {
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

    // 2. Inventory (Safe Check)
    if (Array.isArray(inventoryRes.data)) {
        userInventory.value = inventoryRes.data;
    } else if (Array.isArray(inventoryRes.data?.inventory?.cards)) {
        userInventory.value = inventoryRes.data.inventory.cards;
    } else if (Array.isArray(inventoryRes.data?.cards)) {
        userInventory.value = inventoryRes.data.cards;
    } else {
        console.warn('Inventory cards not found/not an array, defaulting to empty.');
        userInventory.value = []; 
    }

    // 3. Decks
    const decksData = decksRes.data || [];
    allDecks.value = Array.isArray(decksData) ? decksData : (decksData.decks || []);

    // 4. Active Deck
    activeDeck.value = activeDeckRes.data || null;

    // Logic เลือก Deck
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
    error.value = 'Failed to load data. ' + err.message;
  } finally {
    isLoading.value = false;
  }
});

// --- Computed Properties ---

const currentDeckCards = computed(() => {
  // [FIX] เช็คว่า cards มีอยู่จริงและเป็น Array
  if (!currentDeckDetails.value || !Array.isArray(currentDeckDetails.value.cards)) {
    return [];
  }
  
  try {
    return currentDeckDetails.value.cards
      .map(deckCard => {
        const targetId = typeof deckCard.cardId === 'object' ? deckCard.cardId._id : deckCard.cardId;
        const cardData = userInventory.value.find(invCard => getCardId(invCard) === targetId);
        return cardData ? { ...cardData, position: deckCard.position } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.position - b.position);
  } catch (e) {
    console.error('Error processing deck cards:', e);
    return [];
  }
});

const availableCollection = computed(() => {
  if (!Array.isArray(userInventory.value)) return []; // [FIX] เช็ค Array
  try {
    const deckCardIds = new Set(currentDeckCards.value.map(card => getCardId(card)));
    return userInventory.value.filter(invCard => {
        const id = getCardId(invCard);
        return id && !deckCardIds.has(id);
    });
  } catch (e) {
    console.error('Error processing collection:', e);
    return [];
  }
});

// --- Functions ---
const fetchDeckDetails = async (deckId) => {
  if (!deckId || deckId === 'new') return;
  try {
    const res = await fetchApi(`/decks/${deckId}`);
    // [FIX] บังคับให้ cards เป็น Array เสมอ (ถ้า API ส่งมาเป็น null)
    currentDeckDetails.value = {
        ...res.data,
        cards: Array.isArray(res.data.cards) ? res.data.cards : [] 
    };
    deckTitle.value = res.data.title || 'Untitled Deck';
    selectedDeckId.value = deckId;
  } catch (err) {
    console.error('Fetch Deck Error:', err);
    createNewDeck();
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
  currentDeckDetails.value = { _id: null, title: 'New Deck', cards: [], characterId: null };
  deckTitle.value = "New Deck";
};

const addCardToDeck = (inventoryCard) => {
  if (!currentDeckDetails.value) return;
  
  // [FIX] กันเหนียวถ้า cards หายไป
  if (!Array.isArray(currentDeckDetails.value.cards)) {
      currentDeckDetails.value.cards = [];
  }

  const id = getCardId(inventoryCard);
  if (!id) return;

  const newCardInDeck = {
    cardId: id,
    position: currentDeckDetails.value.cards.length
  };
  currentDeckDetails.value.cards.push(newCardInDeck);
};

const removeCardFromDeck = (deckCard) => {
  if (!currentDeckDetails.value || !Array.isArray(currentDeckDetails.value.cards)) return;

  const targetId = getCardId(deckCard);
  if (!targetId) return;
  
  currentDeckDetails.value.cards = currentDeckDetails.value.cards
    .filter(card => {
        const cId = typeof card.cardId === 'object' ? card.cardId._id : card.cardId;
        return cId !== targetId;
    })
    .map((card, index) => ({ ...card, position: index }));
};

const saveDeck = async () => {
  saveStatus.value = 'Saving...';
  
  // [FIX] ใช้ Optional Chaining (?.) เช็คความยาว
  const cardsCount = currentDeckDetails.value?.cards?.length || 0;

  if (cardsCount < 15) {
    saveStatus.value = 'Deck must have at least 15 cards.';
    setTimeout(() => { saveStatus.value = ''; }, 3000);
    return;
  }
  
  let characterId = currentDeckDetails.value.characterId;
  if (!characterId) {
      // ลองหา Character ตัวแรกใน Inventory
      const charCard = userInventory.value.find(c => getCardType(c) === 'CHARACTER');
      characterId = getCardId(charCard);
  }

  if (!characterId) {
      // Fallback ID ถ้าหาไม่เจอจริงๆ (ป้องกัน Error)
      characterId = "6912c42c390e293f229dc2a1"; 
  }

  const payload = {
    deckTitle: deckTitle.value,
    characterId: characterId,
    cards: currentDeckDetails.value.cards.map((card, index) => ({
      cardId: typeof card.cardId === 'object' ? card.cardId._id : card.cardId,
      position: index
    }))
  };

  try {
    let savedDeck;
    if (selectedDeckId.value === 'new') {
      const res = await fetchApi('/decks', { method: 'POST', body: payload });
      savedDeck = res.data;
      allDecks.value.push(savedDeck);
    } else {
      const res = await fetchApi(`/decks/${selectedDeckId.value}`, { method: 'PUT', body: payload });
      savedDeck = res.data;
      const idx = allDecks.value.findIndex(d => d._id === savedDeck._id);
      if (idx !== -1) allDecks.value[idx].title = savedDeck.title;
    }
    
    // Update State
    currentDeckDetails.value = {
        ...savedDeck,
        cards: Array.isArray(savedDeck.cards) ? savedDeck.cards : []
    };
    selectedDeckId.value = savedDeck._id;
    deckTitle.value = savedDeck.title;
    saveStatus.value = 'Deck Saved!';

  } catch (err) {
    console.error(err);
    saveStatus.value = `Error: ${err.message}`;
  } finally {
    setTimeout(() => { saveStatus.value = ''; }, 3000);
  }
};

const deleteDeck = async () => {
  const deckId = selectedDeckId.value;
  if (!deckId || deckId === 'new') {
    saveStatus.value = 'Cannot delete unsaved deck.';
    setTimeout(() => { saveStatus.value = ''; }, 3000);
    return;
  }
  
  if (!confirm(`Delete "${deckTitle.value}"?`)) return;

  saveStatus.value = 'Deleting...';
  try {
    await fetchApi(`/decks/${deckId}`, { method: 'DELETE' });
    saveStatus.value = 'Deck Deleted.';
    allDecks.value = allDecks.value.filter(d => d._id !== deckId);
    createNewDeck();
  } catch (err) {
    saveStatus.value = `Error: ${err.message}`;
  } finally {
    setTimeout(() => { saveStatus.value = ''; }, 3000);
  }
};

// --- Logout Logic ---
const handleLogoutClick = () => {
  showLogoutModal.value = true;
};

const cancelLogout = () => {
  if (!isLoggingOut.value) {
    showLogoutModal.value = false;
  }
};

const confirmLogout = async () => {
  isLoggingOut.value = true;
  setTimeout(async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch (e) { console.error(e); }
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
  <div id="inventory-bg" class="min-h-screen p-4 md:p-8 overflow-hidden font-sans-custom relative">
    
    <Transition name="fade-modal">
      <div v-if="showLogoutModal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
        
        <div class="bg-stone-800 border-4 border-yellow-900 p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden transform transition-all">
          
          <div v-if="isLoggingOut" class="py-8 flex flex-col items-center">
            <svg class="animate-spin h-14 w-14 text-yellow-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-yellow-100 text-xl font-bold animate-pulse font-['Creepster'] tracking-widest">LOGGING OUT...</p>
          </div>

          <div v-else>
            <h3 class="text-3xl font-bold text-yellow-100 mb-4 font-['Creepster'] tracking-wide text-shadow">LOGOUT?</h3>
            <p class="text-stone-300 mb-8 text-lg">Are you sure you want to retreat from the battlefield?</p>

            <div class="flex gap-4 justify-center">
              <button 
                @click="cancelLogout"
                class="flex-1 bg-stone-600 hover:bg-stone-500 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-stone-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                NO
              </button>
              <button 
                @click="confirmLogout"
                class="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg border-b-4 border-red-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg"
              >
                YES
              </button>
            </div>
          </div>

          <div class="absolute top-2 left-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute top-2 right-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 left-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
          <div class="absolute bottom-2 right-2 w-2 h-2 bg-yellow-700 rounded-full opacity-50"></div>
        </div>
      </div>
    </Transition>

    <div class="w-full max-w-7xl mx-auto flex justify-between items-center mb-6">
      
      <button 
        @click="goToMainMenu" 
        class="flex items-center justify-center bg-yellow-700 hover:bg-yellow-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-yellow-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-yellow-500 border-b-4 border-r-4 border-yellow-900 active:translate-y-px active:border-b-2 active:border-r-2"
      >
        <svg class="h-6 w-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        MAIN MENU
      </button>

      <button 
        @click="handleLogoutClick" 
        class="flex items-center justify-center bg-orange-700 hover:bg-orange-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-orange-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-orange-500 border-b-4 border-r-4 border-orange-900 active:translate-y-px active:border-b-2 active:border-r-2"
      >
        LOGOUT
        <svg class="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
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
                    <button @click="deleteDeck" class="p-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-md transition-colors" :disabled="selectedDeckId === 'new'">Delete</button>
                    <button @click="saveDeck" class="p-3 bg-green-700 hover:bg-green-600 text-white font-bold rounded-md transition-colors w-32">{{ saveStatus.startsWith('Saving') ? 'Saving...' : 'Save' }}</button>
                </div>
            </div>
            <p v-if="saveStatus && !saveStatus.startsWith('Saving')" class="text-center h-4 mb-2" :class="saveStatus.startsWith('Error') ? 'text-red-400' : 'text-green-400'">{{ saveStatus }}</p>

            <div class="min-h-[250px] bg-stone-900/50 border border-stone-700 rounded p-4 grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-3 overflow-y-auto custom-scrollbar">
                <div v-for="card in currentDeckCards" :key="getCardId(card)" @click="removeCardFromDeck(card)" class="h-40 bg-stone-700 rounded border-2 border-green-500 text-white p-2 cursor-pointer hover:border-red-500 flex flex-col justify-between" title="Click to Remove">
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
            <div v-for="card in availableCollection" :key="getCardId(card)" @click="addCardToDeck(card)" class="h-40 bg-stone-700 rounded border-2 border-stone-600 text-white p-2 cursor-pointer hover:border-green-500 flex flex-col justify-between" title="Click to Add">
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

/* Modal Animation */
.fade-modal-enter-active, .fade-modal-leave-active { transition: opacity 0.3s ease; }
.fade-modal-enter-from, .fade-modal-leave-to { opacity: 0; }

/* Scrollbar */
.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(39, 39, 42, 0.5); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #eab308; border-radius: 10px; border: 2px solid rgba(39, 39, 42, 0.5); }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #facc15; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #eab308 rgba(39, 39, 42, 0.5); }
</style>