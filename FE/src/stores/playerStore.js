import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useritem = defineStore('useritem', () => {
  const authStore = useAuthStore();

  const inventories = ref([]);
  const cards = ref([]);
  const decks = ref([]);
  const characters = ref([]);
  const maps = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const currentUser = computed(() => authStore.user);
  
  const userInventory = computed(() => {
    if (!currentUser.value) return null;
    return inventories.value.find(inv => inv.uid === currentUser.value.uid) || null;
  });

  // Fetch user inventory
  async function fetchInventory() {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/inventory`);
      
      if (response.data.success) {
        const inventory = response.data.data.inventory;
        inventories.value = [inventory];
        return inventory;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch inventory';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch user decks
  async function fetchDecks() {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/decks`);
      
      if (response.data.success) {
        decks.value = response.data.data.decks;
        return decks.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch decks';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Create new deck
  async function createDeck(deckName, cardIds) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post(`${API_URL}/user/decks`, {
        deckName,
        cardIds
      });
      
      if (response.data.success) {
        await fetchDecks();
        await fetchInventory();
        return response.data.data.deck;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to create deck';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Update deck
  async function updateDeck(deckid, deckName, cardIds) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put(`${API_URL}/user/decks/${deckid}`, {
        deckName,
        cardIds
      });
      
      if (response.data.success) {
        await fetchDecks();
        return response.data.data.deck;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update deck';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Delete deck
  async function deleteDeck(deckid) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.delete(`${API_URL}/user/decks/${deckid}`);
      
      if (response.data.success) {
        await fetchDecks();
        await fetchInventory();
        return true;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete deck';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all cards
  async function fetchCards() {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/cards`);
      
      if (response.data.success) {
        cards.value = response.data.data.cards;
        return cards.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch cards';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all characters
  async function fetchCharacters() {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/characters`);
      
      if (response.data.success) {
        characters.value = response.data.data.characters;
        return characters.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch characters';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch all maps
  async function fetchMaps() {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/maps`);
      
      if (response.data.success) {
        maps.value = response.data.data.maps;
        return maps.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch maps';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Update inventory (e.g., after gacha)
  async function updateInventory(newCards, newCharacters) {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put(`${API_URL}/user/inventory`, {
        cardid: newCards,
        characterid: newCharacters
      });
      
      if (response.data.success) {
        await fetchInventory();
        return response.data.data.inventory;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update inventory';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Initialize all data
  async function initializeData() {
    if (!authStore.isAuthenticated) return;

    try {
      await Promise.all([
        fetchInventory(),
        fetchDecks(),
        fetchCards(),
        fetchCharacters(),
        fetchMaps()
      ]);
      console.log('✅ Player data initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize data:', err);
      throw err;
    }
  }

  // Reset state
  function resetState() {
    inventories.value = [];
    cards.value = [];
    decks.value = [];
    characters.value = [];
    maps.value = [];
    error.value = null;
  }

  return {
    // State
    inventories,
    cards,
    decks,
    characters,
    maps,
    loading,
    error,
    
    // Computed
    currentUser,
    userInventory,
    
    // Actions
    fetchInventory,
    fetchDecks,
    createDeck,
    updateDeck,
    deleteDeck,
    fetchCards,
    fetchCharacters,
    fetchMaps,
    updateInventory,
    initializeData,
    resetState
  };
});