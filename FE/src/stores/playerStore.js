import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import { useAuthStore } from './authStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const useritem = defineStore('useritem', () => {
  const authStore = useAuthStore();

  // Simplified state - backend handles filtering
  const inventory = ref(null);
  const userCards = ref([]);
  const userDecks = ref([]);
  const userCharacters = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const currentUser = computed(() => authStore.user);

  // Fetch user inventory
  async function fetchInventory() {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/inventory`);
      
      if (response.data.success) {
        inventory.value = response.data.data.inventory;
        return inventory.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch inventory';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch user's decks (backend filtered)
  async function fetchDecks() {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/decks`);
      
      if (response.data.success) {
        userDecks.value = response.data.data.decks;
        return userDecks.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch decks';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch cards (optionally filtered by deck)
  async function fetchCards(deckid = null) {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const params = deckid ? { deckid } : {};
      const response = await axios.get(`${API_URL}/user/cards`, { params });
      
      if (response.data.success) {
        userCards.value = response.data.data.cards;
        return userCards.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch cards';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch cards in specific deck
  async function fetchDeckCards(deckid) {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/decks/${deckid}/cards`);
      
      if (response.data.success) {
        return response.data.data.cards;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch deck cards';
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  // Fetch user's characters (backend filtered)
  async function fetchCharacters() {
    if (!authStore.isAuthenticated) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${API_URL}/user/characters`);
      
      if (response.data.success) {
        userCharacters.value = response.data.data.characters;
        return userCharacters.value;
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch characters';
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

  // Initialize all data
  async function initializeData() {
    if (!authStore.isAuthenticated) return;

    try {
      await Promise.all([
        fetchInventory(),
        fetchDecks(),
        fetchCards(),
        fetchCharacters()
      ]);
      console.log('✅ Player data initialized successfully');
    } catch (err) {
      console.error('❌ Failed to initialize data:', err);
      throw err;
    }
  }

  // Reset state
  function resetState() {
    inventory.value = null;
    userCards.value = [];
    userDecks.value = [];
    userCharacters.value = [];
    error.value = null;
  }

  return {
    // State
    inventory,
    userCards,
    userDecks,
    userCharacters,
    loading,
    error,
    
    // Computed
    currentUser,
    
    // Actions
    fetchInventory,
    fetchDecks,
    fetchCards,
    fetchDeckCards,
    fetchCharacters,
    createDeck,
    updateDeck,
    deleteDeck,
    initializeData,
    resetState
  };
});