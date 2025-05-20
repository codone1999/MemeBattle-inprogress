import { defineStore, acceptHMRUpdate } from "pinia";
import { ref, computed } from "vue";

export const useritem = defineStore('Useritems', () => {
  const currentUser = ref(null)
  const inventories = ref([])
  const cards = ref([])
  const decks = ref([])
  const characters = ref([])

  const resetState = () => {
    currentUser.value = null
    inventories.value = []
    cards.value = []
    characters.value = []
  }

  const userInventory = computed(() => {
    if (!currentUser.value) return [];
    return inventories.value.filter(inv => inv.uid === currentUser.value.uid)
  })

  return {
    currentUser,
    inventories,
    userInventory,
    cards,decks,characters,
    resetState,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useritem, import.meta.hot));
}