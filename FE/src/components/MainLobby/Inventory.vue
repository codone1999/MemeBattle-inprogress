<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';
import CardDisplay from './CardDisplay.vue';

const router = useRouter();

// --- State (Data) ---
const userInventory = ref([]);
const normalizedInventory = ref([]);
const allDecks = ref([]);
const activeDeck = ref(null);
const userProfile = ref(null);
const userCharacters = ref([]) 

const selectedDeckId = ref(null);
const currentDeckDetails = ref(null);
const deckTitle = ref("New Deck");

const selectedCharacter = ref(null)

// --- State (UI) ---
const isLoading = ref(true);
const error = ref(null);
const saveStatus = ref('');
const imgErrors = ref({});
 

// --- State (Modals) ---
const showLogoutModal = ref(false);
const isLoggingOut = ref(false);

const showDeleteModal = ref(false);
const isDeleting = ref(false);

// --- State (Friend System) [UPDATED] ---
const showFriendList = ref(false);
const friendSidebarMode = ref('list'); // 'list', 'requests', 'add'
const friendList = ref([]); 
const pendingRequests = ref([]);
const searchResults = ref([]);
const friendSearchQuery = ref('');
const isSearchingFriends = ref(false);

// --- Friend List Logic [NEW] ---
const toggleFriendList = () => {
  showFriendList.value = !showFriendList.value;
  if (showFriendList.value) {
    loadFriendData(); // Refresh data when opening
  }
};

const switchFriendMode = (mode) => {
  friendSidebarMode.value = mode;
  if (mode === 'list' || mode === 'requests') {
    loadFriendData();
  }
};

const loadFriendData = async () => {
  try {
    const friendsRes = await fetchApi('/friends');
    
    // 🔍 DEBUG: Check the entire response structure
    console.log('Full Friends Response:', friendsRes);
    console.log('friendsRes.data:', friendsRes.data);
    console.log('Type of friendsRes.data:', typeof friendsRes.data);
    console.log('Is array?', Array.isArray(friendsRes.data));

    // Based on the console logs, adjust this:
    const friendsData = Array.isArray(friendsRes.data) 
      ? friendsRes.data 
      : friendsRes.data?.data || [];

    friendList.value = friendsData.map(f => ({
      _id: f.friendId,
      name: f.displayName || f.username,
      status: f.isOnline ? 'online' : 'offline',
      avatar: f.profilePic || '/avatars/default.png',
      username: f.username
    })).sort((a, b) => {
        if (a.status === 'online' && b.status !== 'online') return -1;
        if (a.status !== 'online' && b.status === 'online') return 1;
        return a.name.localeCompare(b.name);
    });

    // Load pending requests
    const requestsRes = await fetchApi('/friends/requests/pending');
    const reqData = requestsRes.data?.data || requestsRes.data || [];
    pendingRequests.value = Array.isArray(reqData) ? reqData : [];

  } catch (e) {
    console.error('Error loading friend data', e);
  }
};

// 2. Search Users (FIXED)
const searchUsers = async () => {
  if (!friendSearchQuery.value || friendSearchQuery.value.length < 3) {
    showNotification('warning', 'Type at least 3 characters');
    return;
  }
  isSearchingFriends.value = true;
  searchResults.value = []; // Clear previous results
  
  try {
    const res = await fetchApi(`/users/search?username=${friendSearchQuery.value}`);
    
    // DEBUG: Check console to see exactly what comes back
    console.log('Search Response:', res); 

    // ROBUST EXTRACTION:
    // 1. Try standard Axios path (res.data.data)
    // 2. Try if fetchApi returns body directly (res.data)
    // 3. Fallback to empty array
    let results = [];
    
    if (res.data && Array.isArray(res.data.data)) {
        results = res.data.data;
    } else if (res.data && Array.isArray(res.data)) {
         results = res.data;
    } else if (res.data && res.data.users && Array.isArray(res.data.users)) {
        results = res.data.users;
    } else if (Array.isArray(res)) {
        results = res;
    }

    // Filter and Map
    searchResults.value = results.map(u => ({
      _id: u._id,
      name: u.displayName || u.username,
      username: u.username,
      avatar: u.profilePic || '/avatars/default.png',
      isOnline: u.isOnline
    }));

  } catch (e) {
    console.error("Search Error:", e);
    showNotification('error', 'User not found or API error');
  } finally {
    isSearchingFriends.value = false;
  }
};

// 3. Send Request
const sendFriendRequest = async (targetUserId) => {
  try {
    await fetchApi('/friends/requests', {
      method: 'POST',
      body: { toUserId: targetUserId }
    });
    showNotification('success', 'Friend request sent!');
    // Remove from search result to prevent double sending
    searchResults.value = searchResults.value.filter(u => u._id !== targetUserId);
  } catch (e) {
    const msg = e.response?.data?.message || 'Failed to send request';
    showNotification('error', msg);
  }
};

// 4. Accept/Decline Request
const respondToRequest = async (requestId, action) => {
  // action = 'accept' or 'decline'
  try {
    await fetchApi(`/friends/requests/${requestId}/${action}`, { method: 'POST' });
    
    showNotification('success', `Request ${action}ed`);
    
    // Remove from local list
    pendingRequests.value = pendingRequests.value.filter(r => r._id !== requestId);
    
    if (action === 'accept') loadFriendData(); // Refresh list to show new friend
  } catch (e) {
    showNotification('error', `Failed to ${action} request`);
  }
};

// 5. Remove Friend
const removeFriend = async (friendId) => {
  if(!confirm("Remove this friend?")) return;
  
  try {
    await fetchApi(`/friends/${friendId}`, { method: 'DELETE' });
    showNotification('success', 'Friend removed');
    friendList.value = friendList.value.filter(f => f._id !== friendId);
  } catch (e) {
    showNotification('error', 'Failed to remove friend');
  }
};

// --- Status Helpers (Preserved your existing style) ---
const getStatusColor = (status) => {
  // Map API boolean/string to your CSS
  if (status === true || status === 'online') return 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]';
  if (status === 'in-match') return 'bg-red-500';
  if (status === 'afk') return 'bg-yellow-500';
  return 'bg-stone-500'; // offline
};

const getStatusText = (status) => {
  if (status === true || status === 'online') return 'Online';
  if (status === 'in-match') return 'In Match';
  if (status === 'afk') return 'Away';
  return 'Offline';
};

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

// --- Image Error Handler ---
const handleImgError = (id) => {
    imgErrors.value[id] = true;
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
    let rawCharacters = [];

    
    if (Array.isArray(invData)) {
        rawInventory = invData;
    } else if (Array.isArray(invData?.inventory?.cards)) {
        rawInventory = invData.inventory.cards;
    } else if (Array.isArray(invData?.cards)) {
        rawInventory = invData.cards;
    } else if (Array.isArray(invData?.data)) { 
        rawInventory = invData.data;
    }
    // Handle characters
    if (Array.isArray(invData?.characters)) rawCharacters = invData.characters;
    else if (Array.isArray(invData?.data?.characters)) rawCharacters = invData.data.characters;

    userInventory.value = rawInventory;
    normalizedInventory.value = normalizeInventory(rawInventory); 
    // Setup Characters
    userCharacters.value = rawCharacters;
    if (userCharacters.value.length > 0) {
        selectedCharacter.value = userCharacters.value[0];
    }

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

// *** FIXED: Properly filter out all cards that are in the deck ***
const availableCollection = computed(() => {
  if (!Array.isArray(normalizedInventory.value)) return [];
  if (!currentDeckDetails.value?.cards) return normalizedInventory.value;

  try {
    // Create a map to count how many of each card API ID are in the deck
    const deckCardCounts = new Map();
    currentDeckCards.value.forEach(card => {
      const apiId = card._originalApiId || getCardId(card);
      if (apiId) {
        deckCardCounts.set(apiId, (deckCardCounts.get(apiId) || 0) + 1);
      }
    });

    // Filter inventory: for each card type, only show copies not in deck
    const usedLocalIds = new Set();
    
    return normalizedInventory.value.filter(invCard => {
      const apiId = invCard._originalApiId || getCardId(invCard);
      const localId = getCardLocalId(invCard);
      
      if (!apiId) return false;
      
      // Get count of this card type in deck
      const inDeckCount = deckCardCounts.get(apiId) || 0;
      
      // Count how many of this card type we've already allowed through
      const alreadyShown = Array.from(usedLocalIds).filter(id => 
        id.startsWith(apiId)
      ).length;
      
      // Get total quantity from inventory
      const totalQuantity = userInventory.value.find(
        inv => getCardId(inv) === apiId
      )?.inventoryQuantity || 1;
      
      // Available = total - in deck - already shown
      const available = totalQuantity - inDeckCount - alreadyShown;
      
      if (available > 0) {
        usedLocalIds.add(localId);
        return true;
      }
      
      return false;
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

// --- Save Deck (FIXED: Removed characterId requirement) ---
const saveDeck = async () => {
  saveStatus.value = 'Saving...';
  
  const cardsCount = currentDeckCards.value?.length || 0;
  if (cardsCount < 15) {
    saveStatus.value = '';
    showNotification('warning', 'Deck must have at least 15 cards.');
    return;
  }

  // *** FIXED: Removed characterId - not needed for deck creation ***
  const payload = {
    deckTitle: deckTitle.value,
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

// --- Character Selection ---
const selectCharacter = (char) => {
    selectedCharacter.value = char;
};

// --- New Navigation Functions ---
const goToGacha = () => {
    router.push('/gacha');
};

const goToLobby = async () => {
    isLoading.value = true;
    try {
        // 1. Check if user is already in a lobby
        const res = await fetchApi('/lobbies/me/current');
        //console.log("Lobby check response:", res); // Debug log
        const lobbyData = res.data;

        if (lobbyData) {
            let activeLobbyId = lobbyData._id;
            if (activeLobbyId) {
                //console.log('Rejoining active lobby:', activeLobbyId);
                router.push(`/lobby/${activeLobbyId}`);
                return; 
            }
        }
        // 2. If no active lobby, go to main lobby list
        //console.log("No active lobby found, going to lobby list.");
        router.push('/lobby');

    } catch (err) {
        console.error("Lobby Check Error:", err);
        // Fallback to lobby list on error
        router.push('/lobby');
    } finally {
        isLoading.value = false;
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
      // Clear all authentication data
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
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

<Transition name="slide-right">
       <div v-if="showFriendList" class="fixed inset-y-0 right-0 z-[150] w-80 bg-stone-900 border-l-4 border-yellow-900 shadow-2xl flex flex-col font-sans-custom">
           
           <div class="bg-stone-800 p-2 border-b border-stone-700">
               <div class="flex justify-between items-center mb-2 px-2">
                   <h3 class="text-yellow-100 font-bold text-xl font-['Creepster'] tracking-wide">SOCIAL</h3>
                   <button @click="toggleFriendList" class="text-stone-400 hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
               </div>
               
               <div class="flex gap-1">
                   <button 
                       @click="switchFriendMode('list')"
                       :class="['flex-1 py-1 text-xs font-bold uppercase rounded border-b-2 transition-colors', friendSidebarMode === 'list' ? 'bg-stone-700 text-yellow-400 border-yellow-500' : 'bg-stone-900 text-stone-500 border-stone-800 hover:bg-stone-800']"
                   >Friends ({{ friendList.length }})</button>
                   <button 
                       @click="switchFriendMode('requests')"
                       :class="['flex-1 py-1 text-xs font-bold uppercase rounded border-b-2 transition-colors relative', friendSidebarMode === 'requests' ? 'bg-stone-700 text-yellow-400 border-yellow-500' : 'bg-stone-900 text-stone-500 border-stone-800 hover:bg-stone-800']"
                   >
                       Reqs
                       <span v-if="pendingRequests.length > 0" class="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white">{{ pendingRequests.length }}</span>
                   </button>
                   <button 
                       @click="switchFriendMode('add')"
                       :class="['flex-1 py-1 text-xs font-bold uppercase rounded border-b-2 transition-colors', friendSidebarMode === 'add' ? 'bg-stone-700 text-yellow-400 border-yellow-500' : 'bg-stone-900 text-stone-500 border-stone-800 hover:bg-stone-800']"
                   >Add +</button>
               </div>
           </div>

           <div v-if="friendSidebarMode === 'list'" class="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
              <div v-if="friendList.length === 0" class="text-stone-500 text-center mt-10 italic">No friends added yet.</div>
               
               <div v-for="friend in friendList" :key="friend._id" class="flex items-center bg-stone-800 p-2 rounded-lg border border-stone-700 hover:border-yellow-600 transition-colors group relative">
                   <div class="relative">
                       <div class="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-stone-600 group-hover:border-yellow-500">
                           <img v-if="friend.avatar && friend.avatar !== '/avatars/default.png'" :src="friend.avatar" class="w-full h-full object-cover">
                           <span v-else>👤</span>
                       </div>
                       <div :class="['absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-stone-800', getStatusColor(friend.status)]"></div>
                   </div>
                   <div class="ml-3 flex-grow min-w-0">
                       <p class="text-yellow-100 font-bold text-sm truncate">{{ friend.name }}</p>
                       <p class="text-xs text-stone-400 uppercase tracking-wider">{{ getStatusText(friend.status) }}</p>
                   </div>
                   <button @click="removeFriend(friend._id)" class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-300 p-1 transition-opacity" title="Remove Friend">
                       <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
               </div>
           </div>

            <div v-if="friendSidebarMode === 'requests'" class="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <div v-if="pendingRequests.length === 0" class="text-stone-500 text-center mt-10 italic">No pending requests.</div>
            
                <div v-for="req in pendingRequests" :key="req._id" class="bg-stone-800 p-3 rounded-lg border border-stone-700">
                    <div class="flex items-center mb-2">
                        <div class="w-8 h-8 bg-stone-700 rounded-full flex items-center justify-center border border-stone-600 mr-2 overflow-hidden">
                            <img v-if="req.fromUser?.profilePic && req.fromUser.profilePic !== '/avatars/default.png'" 
                                 :src="req.fromUser.profilePic" 
                                 class="w-full h-full object-cover"
                                 alt="Profile">
                            <span v-else class="text-xs">📩</span>
                        </div>
                        <div class="flex-grow">
                            <p class="text-yellow-100 font-bold text-sm">{{ req.fromUser?.displayName || req.fromUser?.username || 'Unknown' }}</p>
                            <p class="text-[10px] text-stone-400">@{{ req.fromUser?.username || 'unknown' }}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button @click="respondToRequest(req._id, 'accept')" class="flex-1 bg-green-700 hover:bg-green-600 text-white text-xs font-bold py-1 px-2 rounded border-b-2 border-green-900 active:border-b-0 active:translate-y-px">ACCEPT</button>
                        <button @click="respondToRequest(req._id, 'decline')" class="flex-1 bg-red-700 hover:bg-red-600 text-white text-xs font-bold py-1 px-2 rounded border-b-2 border-red-900 active:border-b-0 active:translate-y-px">DECLINE</button>
                    </div>
                </div>
            </div>

           <div v-if="friendSidebarMode === 'add'" class="flex-grow flex flex-col overflow-hidden">
               <div class="p-4 border-b border-stone-700 bg-stone-800/50">
                   <p class="text-stone-300 text-xs mb-2">Search by username:</p>
                   <div class="flex gap-2">
                       <input 
                           v-model="friendSearchQuery" 
                           @keyup.enter="searchUsers"
                           type="text" 
                           class="flex-grow bg-stone-900 border border-stone-600 text-white text-sm rounded px-2 py-1 focus:border-yellow-500 focus:outline-none" 
                           placeholder="Username..."
                       >
                       <button @click="searchUsers" class="bg-yellow-700 hover:bg-yellow-600 text-white px-3 rounded border-b-2 border-yellow-900 active:border-b-0 active:translate-y-px">
                           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                       </button>
                   </div>
               </div>

               <div class="flex-grow overflow-y-auto p-4 space-y-3 custom-scrollbar">
                   <div v-if="isSearchingFriends" class="text-center py-4"><svg class="animate-spin h-6 w-6 text-yellow-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                   
                   <div v-else-if="searchResults.length === 0 && friendSearchQuery.length > 0" class="text-stone-500 text-center text-sm italic">
                       No warriors found.
                   </div>

                   <div v-for="user in searchResults" :key="user._id" class="flex flex-col bg-stone-800 p-3 rounded-lg border border-stone-700">
                       <div class="flex items-center mb-3">
                           <div class="w-10 h-10 bg-stone-700 rounded-full flex items-center justify-center overflow-hidden border border-stone-600">
                               <img v-if="user.avatar && user.avatar !== '/avatars/default.png'" :src="user.avatar" class="w-full h-full object-cover">
                               <span v-else>👤</span>
                           </div>
                           <div class="ml-3">
                               <p class="text-yellow-100 font-bold text-sm">{{ user.name }}</p>
                               <p class="text-xs text-stone-400">@{{ user.username }}</p>
                           </div>
                       </div>
                       <button @click="sendFriendRequest(user._id)" class="w-full py-1 bg-stone-700 hover:bg-stone-600 text-stone-300 hover:text-white rounded border border-stone-600 transition-colors text-xs font-bold uppercase flex items-center justify-center gap-1">
                           <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                           Send Request
                       </button>
                   </div>
               </div>
           </div>
           
           <div v-if="friendSidebarMode === 'list'" class="p-4 border-t border-stone-700 bg-stone-800">
               <button @click="switchFriendMode('add')" class="w-full py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded border border-stone-600 transition-colors text-sm font-bold">ADD FRIEND</button>
           </div>
       </div>
    </Transition>

    <div class="w-full max-w-7xl mx-auto flex justify-between items-center mb-6">
      <div class="flex items-center gap-4">
          <button @click="goToMainMenu" class="flex items-center justify-center bg-yellow-700 hover:bg-yellow-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-yellow-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-yellow-500 border-b-4 border-r-4 border-yellow-900 active:translate-y-px active:border-b-2 active:border-r-2">
            <svg class="h-6 w-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> MAIN MENU
          </button>

          <button @click="toggleFriendList" class="flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-yellow-100 font-bold text-lg uppercase p-2 rounded-md shadow-lg shadow-stone-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-stone-500 border-b-4 border-r-4 border-stone-900 active:translate-y-px active:border-b-2 active:border-r-2" title="Friends">
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9-2V7H4v3H1v2h3v3h2v-3h3v-2H6zm9 4c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          </button>
      </div>
      <button @click="handleLogoutClick" class="flex items-center justify-center bg-orange-700 hover:bg-orange-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-orange-900/40 transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-900 focus:ring-orange-500 border-b-4 border-r-4 border-orange-900 active:translate-y-px active:border-b-2 active:border-r-2">
        LOGOUT <svg class="h-6 w-6 ml-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>
      </button>
    </div>

    <div class="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

      <aside class="lg:col-span-1 space-y-6">
        <div class="bg-stone-800 border border-stone-700 p-4 rounded-lg shadow-xl flex flex-row items-center gap-4">
           <div class="w-20 h-20 flex-shrink-0 bg-stone-900 rounded-full border-2 border-yellow-600 overflow-hidden">
             <img v-if="userProfile?.profilePic && userProfile.profilePic !== '/avatars/default.png'" :src="userProfile.profilePic" alt="Profile" class="w-full h-full object-cover" />
             <div v-else class="w-full h-full flex items-center justify-center text-stone-500">
               <svg class="h-10 w-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
             </div>
           </div>
           <div class="flex-grow min-w-0">
             <p class="text-lg text-yellow-500 font-bold truncate mb-1">{{ userProfile?.displayName || 'Warrior' }}</p>
             <div class="text-xs text-stone-300 flex gap-2">
               <span class="bg-stone-900 px-2 py-1 rounded border border-stone-700 text-green-400">W: {{ userProfile?.stats?.wins || 0 }}</span>
               <span class="bg-stone-900 px-2 py-1 rounded border border-stone-700 text-red-400">L: {{ userProfile?.stats?.losses || 0 }}</span>
             </div>
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

        <div class="bg-stone-800 border border-stone-700 p-6 rounded-lg shadow-xl flex flex-col items-center">
           <h2 class="text-xl font-bold text-yellow-100 mb-4 border-b border-stone-600 w-full text-center pb-2">
             {{ selectedCharacter?.name || 'No Character' }}
           </h2>

           <div class="w-full aspect-[3/4] bg-stone-900 rounded-lg border border-stone-600 mb-4 flex items-center justify-center overflow-hidden relative group">
              <img v-if="selectedCharacter?.characterPic" :src="selectedCharacter.characterPic" class="w-full h-full object-cover" alt="Character Big">
              <div v-else class="text-stone-500">Select a Character</div>
              <div v-if="selectedCharacter?.rarity" class="absolute top-2 right-2 bg-black/60 text-yellow-400 text-xs px-2 py-1 rounded uppercase font-bold">
                 {{ selectedCharacter.rarity }}
              </div>
           </div>

           <div class="w-full grid grid-cols-4 gap-2">
              <div 
                v-for="char in userCharacters" 
                :key="char._id"
                @click="selectCharacter(char)"
                :class="[
                   'aspect-square bg-stone-900 rounded border cursor-pointer hover:border-yellow-500 transition-all overflow-hidden flex items-center justify-center p-1',
                   selectedCharacter?._id === char._id ? 'border-yellow-500 ring-2 ring-yellow-500/50' : 'border-stone-600'
                ]"
              >
                 <img 
                    v-if="!imgErrors[char._id] && char.characterPic" 
                    :src="char.characterPic" 
                    class="w-full h-full object-cover" 
                    @error="handleImgError(char._id)"
                 >
                 <div v-else class="text-[10px] text-stone-300 text-center leading-tight break-words w-full">
                    {{ char.name || 'Char' }}
                 </div>
              </div>
              <div v-for="i in Math.max(0, 4 - userCharacters.length)" :key="`empty-${i}`" class="aspect-square bg-stone-900/50 rounded border border-stone-700 opacity-50"></div>
           </div>
        </div>

        <button @click="goToGacha" class="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold text-xl uppercase py-4 px-4 rounded-lg border-b-4 border-purple-900 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
           SUMMON HEROES
        </button>
        <button @click="goToLobby" class="w-full bg-green-600 hover:bg-green-500 text-white font-black text-2xl uppercase py-4 rounded-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all shadow-lg flex items-center justify-center gap-2 group">
                <span>BATTLE</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
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

            <div class="min-h-[250px] bg-stone-900/50 border border-stone-700 rounded p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar">
                <CardDisplay
                  v-for="card in currentDeckCards"
                  :key="getCardLocalId(card)"
                  :card="{
                    name: getCardName(card),
                    power: card.power || card.cardId?.power || 0,
                    rarity: card.rarity || card.cardId?.rarity || 'common',
                    cardType: getCardType(card),
                    pawnRequirement: card.pawnRequirement || card.cardId?.pawnRequirement || 1,
                    pawnLocations: card.pawnLocations || card.cardId?.pawnLocations || [],
                    ability: card.ability || card.cardId?.ability || null,
                    cardInfo: card.cardInfo || card.cardId?.cardInfo || '',
                    cardImage: card.cardImage || card.cardId?.cardImage || ''
                  }"
                  :show-grid="true"
                  size="small"
                  @click="removeCardFromDeck(card)"
                  class="ring-2 ring-green-500 hover:ring-red-500 transition-all"
                  title="Click to Remove"
                />
                <div v-if="currentDeckCards.length === 0" class="col-span-full flex items-center justify-center h-40">
                    <p class="text-stone-500">Click cards from your collection below to add them here.</p>
                </div>
            </div>
            <p class="text-right text-lg font-bold text-yellow-100 mt-2">Cards: {{ currentDeckCards.length }} / 30</p>
        </div>

        <div class="bg-stone-800 border border-stone-700 p-6 rounded-lg shadow-xl">
          <h2 class="text-2xl font-bold text-yellow-100 mb-4">Collection ({{ availableCollection.length }})</h2>
          
          <div class="min-h-[300px] max-h-[60vh] bg-stone-900/50 border border-stone-700 rounded p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto custom-scrollbar">
            <CardDisplay
              v-for="card in availableCollection"
              :key="getCardLocalId(card)"
              :card="{
                name: getCardName(card),
                power: card.power || card.cardId?.power || 0,
                rarity: card.rarity || card.cardId?.rarity || 'common',
                cardType: getCardType(card),
                pawnRequirement: card.pawnRequirement || card.cardId?.pawnRequirement || 1,
                pawnLocations: card.pawnLocations || card.cardId?.pawnLocations || [],
                ability: card.ability || card.cardId?.ability || null,
                cardInfo: card.cardInfo || card.cardId?.cardInfo || '',
                cardImage: card.cardImage || card.cardId?.cardImage || ''
              }"
              :show-grid="true"
              size="small"
              @click="addCardToDeck(card)"
              class="hover:ring-2 hover:ring-green-500 transition-all"
              title="Click to Add"
            />

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

.slide-right-enter-active, .slide-right-leave-active { transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1); }
.slide-right-enter-from, .slide-right-leave-to { transform: translateX(100%); }
.slide-right-enter-to, .slide-right-leave-from { transform: translateX(0); }

.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(39, 39, 42, 0.5); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #eab308; border-radius: 10px; border: 2px solid rgba(39, 39, 42, 0.5); }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #facc15; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #eab308 rgba(39, 39, 42, 0.5); }
</style>