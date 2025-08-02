<script setup>
import { ref, onMounted, watch, computed, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getItems } from '@/lib/fetchUtils'
import { connectWS, subscribeWS, sendWS } from '@/lib/ws'

const route = useRoute()
const router = useRouter()
const lobbyId = ref(Number(route.params.lobbyId))
const userId = ref(Number(route.params.userid))

const lobbyInfo = ref(null)
const players = ref([])

// Separate states for Player 1 & 2 inventories
const player1Decks = ref([])
const player1Characters = ref([])
const player2Decks = ref([])
const player2Characters = ref([])

const maps = ref([])
const selectedMap = ref(null)

// Store selected decks/chars for both players
const selectedDeckP1 = ref(null)
const selectedDeckP2 = ref(null)
const selectedCharP1 = ref(null)
const selectedCharP2 = ref(null)

const fetchLobby = async () => {
  const data = await getItems(`${import.meta.env.VITE_APP_URL}/api/lobby/${lobbyId.value}`)
  lobbyInfo.value = data
  players.value = []

  if (data.player1Id) {
    const inv1 = await getItems(`${import.meta.env.VITE_APP_URL}/api/inventory/${data.player1Id}`)
    //console.log(inv1)
    players.value.push({ id: data.player1Id, username: inv1.username })
    player1Decks.value = inv1.deck 
    player1Characters.value = inv1.characters
    selectedDeckP1.value = data.player1DeckId || null
    selectedCharP1.value = data.player1CharacterId || null
    //console.log(player1Decks)
  } else {
    player1Decks.value = []
    player1Characters.value = []
    selectedDeckP1.value = null
    selectedCharP1.value = null
  }

  if (data.player2Id) {
    const inv2 = await getItems(`${import.meta.env.VITE_APP_URL}/api/inventory/${data.player2Id}`)
    //console.log(inv2)
    players.value.push({ id: data.player2Id, username: inv2.username })
    player2Decks.value = inv2.deck
    player2Characters.value = inv2.characters
    selectedDeckP2.value = data.player2DeckId || null
    selectedCharP2.value = data.player2CharacterId || null
    //console.log(player2Decks)
  } else {
    player2Decks.value = []
    player2Characters.value = []
    selectedDeckP2.value = null
    selectedCharP2.value = null
  }

  //maps.value = data.availableMaps || []
  //selectedMap.value = data.selectedMap || null
}

const fetchMaps = async () => {
  maps.value = await getItems(`${import.meta.env.VITE_APP_URL}/api/maps`)
  //console.log("Raw maps data:", data)
  //console.log("Maps fetched and assigned:", maps.value)

}


//const mapList = computed(() => maps.value)

onMounted(() => {
  fetchLobby()
  fetchMaps()

  connectWS(() => {
    subscribeWS(`/topic/lobby/${lobbyId.value}`, (data) => {
      if (!data) {
        router.push({ name: 'LobbyList', params: { userid: userId.value } })
        return
      }

      if (data.selectedMap !== undefined) selectedMap.value = Number(data.selectedMap)
      if (data.player1DeckId !== undefined) selectedDeckP1.value = data.player1DeckId
      if (data.player2DeckId !== undefined) selectedDeckP2.value = data.player2DeckId
      if (data.player1CharacterId !== undefined) selectedCharP1.value = data.player1CharacterId
      if (data.player2CharacterId !== undefined) selectedCharP2.value = data.player2CharacterId

      lobbyInfo.value = { ...lobbyInfo.value, ...data }
    })
  })
})

watch(selectedMap, (val) => {
  if (val != null && isHost.value) {
    sendWS("/app/lobby/updateMap", { 
      lobbyId: lobbyId.value, 
      userId: userId.value,  
      mapId: val 
    })
  }
})
// Auto-leave
const leaveLobbyAPI = async () => {
  await fetch(`${import.meta.env.VITE_APP_URL}/api/lobby/leave/${lobbyId.value}?userId=${userId.value}`, { method: 'POST' })
}

window.addEventListener('beforeunload', () => {
  navigator.sendBeacon(`${import.meta.env.VITE_APP_URL}/api/lobby/leave/${lobbyId.value}?userId=${userId.value}`)
})
onBeforeUnmount(() => leaveLobbyAPI())

// Send selection updates
watch(selectedDeckP1, (val) => {
  if (val != null && isHost.value) {
    sendWS("/app/lobby/updateSelection", { lobbyId: lobbyId.value, userId: userId.value, deckId: val })
  }
})
watch(selectedDeckP2, (val) => {
  if (val != null && !isHost.value) {
    sendWS("/app/lobby/updateSelection", { lobbyId: lobbyId.value, userId: userId.value, deckId: val })
  }
})
watch(selectedCharP1, (val) => {
  if (val != null && isHost.value) {
    sendWS("/app/lobby/updateSelection", { lobbyId: lobbyId.value, userId: userId.value, characterId: val })
  }
})
watch(selectedCharP2, (val) => {
  if (val != null && !isHost.value) {
    sendWS("/app/lobby/updateSelection", { lobbyId: lobbyId.value, userId: userId.value, characterId: val })
  }
})
watch(selectedMap, (val) => {
  if (val != null && isHost.value) {
    sendWS("/app/lobby/updateMap", { lobbyId: lobbyId.value, mapId: val })
  }
})

const isHost = computed(() => lobbyInfo.value && lobbyInfo.value.player1Id === userId.value)
const player1 = computed(() => lobbyInfo.value?.player1Id || null)
const player2 = computed(() => lobbyInfo.value?.player2Id || null)

const deleteLobby = async () => {
  await fetch(`${import.meta.env.VITE_APP_URL}/api/lobby/delete/${lobbyId.value}`, { method: 'DELETE' })
  router.push({ name: 'LobbyList', params: { userid: userId.value } })
}
const leaveLobby = async () => {
  await leaveLobbyAPI()
  router.push({ name: 'LobbyList', params: { userid: userId.value } })
}

</script>

<template>
  <div class="bg-gray-900 min-h-screen w-full py-6 px-4 text-white">
    <div class="container mx-auto max-w-5xl bg-gray-800 rounded-lg shadow-xl p-6 relative">

      <h2 class="text-2xl font-bold text-center mb-6">{{ lobbyInfo?.lobbyName }}</h2>

      <button v-if="isHost"
              @click="deleteLobby"
              class="absolute top-4 right-4 bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
        Delete Lobby
      </button>

      <!-- Players -->
      <div class="flex justify-between mb-6 gap-6">
        <!--Player 1 -->
        <div class="w-1/2 bg-gray-700 p-4 rounded">
          <h3 class="text-lg font-semibold mb-2">{{ player1 ? 'Player ' + player1 : 'Waiting...' }}</h3>

          <div v-if="player1">
            <label class="block mt-3">Deck:</label>
            <!-- Player 1 Deck -->
                <select v-model="selectedDeckP1"
                        :disabled="!isHost"
                        class="w-full p-2 bg-gray-600 rounded mt-1">
                  <option disabled value="">Select Deck</option>
                  <option v-for="deck in player1Decks" :value="deck.id" :key="deck.id">{{ deck.deckname }}</option>
                </select>

            <label class="block mt-3">Character:</label>
            <select v-model="selectedCharP1"
                    :disabled="!isHost"
                    class="w-full p-2 bg-gray-600 rounded mt-1">
              <option disabled value="">Select Character</option>
              <option v-for="ch in player1Characters" :value="ch.id" :key="ch.id">{{ ch.charactername }}</option>
            </select>

            <div v-if="selectedCharP1" class="mt-4">
              <img :src="`/assets/chars/${selectedCharP1}.png`" class="w-32 h-32 mx-auto rounded" />
            </div>

            <button v-if="isHost && userId === player1"
                    @click="leaveLobby"
                    class="mt-4 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">
              Leave Lobby
            </button>
          </div>
        </div>

        <!-- Player 2 -->
        <div class="w-1/2 bg-gray-700 p-4 rounded">
          <h3 class="text-lg font-semibold mb-2">{{ player2 ? 'Player ' + player2 : 'Waiting...' }}</h3>

          <div v-if="player2">
            <label class="block mt-3">Deck:</label>
          <select v-model="selectedDeckP2"
                    :disabled="isHost"
                    class="w-full p-2 bg-gray-600 rounded mt-1">
              <option disabled value="">Select Deck</option>
              <option v-for="deck in player2Decks" :value="deck.id" :key="deck.id">{{ deck.deckname }}</option>
            </select>

            <label class="block mt-3">Character:</label>
           <select v-model="selectedCharP2"
                    :disabled="isHost"
                    class="w-full p-2 bg-gray-600 rounded mt-1">
              <option disabled value="">Select Character</option>
              <option v-for="ch in player2Characters" :value="ch.id" :key="ch.id">{{ ch.charactername }}</option>
            </select>

            <div v-if="selectedCharP2" class="mt-4">
              <img :src="`/assets/chars/${selectedCharP2}.png`" class="w-32 h-32 mx-auto rounded" />
            </div>

            <button v-if="!isHost && userId === player2"
                    @click="leaveLobby"
                    class="mt-4 bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded">
              Leave Lobby
            </button>
          </div>
        </div>
      </div>
      <!-- Map Selection -->
      <div class="bg-gray-700 p-4 rounded mb-6 text-center">
        <h3 class="text-lg font-semibold mb-2">Map Selection</h3>
       <select v-model="selectedMap" :disabled="!isHost" class="w-1/2 p-2 bg-gray-600 rounded mt-1">
          <option disabled value="">Select Map</option>
          <option v-for="m in maps" :key="m.id" :value="m.id">
            {{ m.mapName }}
          </option>
        </select>

        <p v-if="!isHost" class="text-gray-400 text-sm mt-2">Only host can change map</p>
      </div>
      <div class="flex justify-center">
        <button class="bg-green-600 hover:bg-green-700 px-6 py-2 rounded">Ready</button>
      </div>
    </div>
  </div>
</template>
