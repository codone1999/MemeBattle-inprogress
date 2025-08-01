<script setup>
import { ref, onMounted } from 'vue'
import { getItems, addItem } from '@/lib/fetchUtils'
import { useRoute, useRouter } from 'vue-router'
import { connectWS, subscribeWS } from '@/lib/ws'

const route = useRoute()
const router = useRouter()
const userid = ref(Number(route.params.userid))

const lobbies = ref([])
const showCreateModal = ref(false)
const showPasswordModal = ref(false)
const lobbyPassword = ref('')
const joinLobbyId = ref(null)

const newLobby = ref({
  lobbyName: '',
  isPrivate: false,
  password: ''
})

const fetchLobbies = async () => {
  try {
    lobbies.value = await getItems(`${import.meta.env.VITE_APP_URL}/api/lobby/list`)
  } catch (err) {
    console.error('Failed to fetch lobbies:', err)
  }
}

onMounted(() => {
  fetchLobbies()

  connectWS(() => {
    console.log("WebSocket Connected")

    // Subscribe to lobby updates
    subscribeWS("/topic/lobbies", (data) => {
      console.log("📡 Lobby update received:", data)
      lobbies.value = data // Replace list with latest
    })
  })
})

const openCreateLobby = () => {
  newLobby.value = { lobbyName: '', isPrivate: false, password: '' }
  showCreateModal.value = true
}

// Create Lobby
const createLobby = async () => {
  try {
    const payload = {
      player1Uid: userid.value,          
      lobbyName: newLobby.value.lobbyName,
      password: newLobby.value.isPrivate ? newLobby.value.password : '',
      isPrivate: newLobby.value.isPrivate
    }
    await addItem(`${import.meta.env.VITE_APP_URL}/api/lobby/create`, payload)
    showCreateModal.value = false
  } catch (err) {
    alert('Failed to create lobby')
    console.error(err)
  }
}

// Join Lobby
const joinLobby = async (lobby) => {
  if (lobby.privateLobby) {
    joinLobbyId.value = lobby.id
    showPasswordModal.value = true
  } else {
    await sendJoinLobby(lobby.id, '')
  }
}

const sendJoinLobby = async (lobbyId, password) => {
  try {
    // ✅ 1. Check if user is already inside the lobby
    const lobby = await getItems(`${import.meta.env.VITE_APP_URL}/api/lobby/${lobbyId}`)
    if (lobby.player1Id === userid.value || lobby.player2Id === userid.value) {
      // ✅ Already in lobby → just redirect
      router.push({ name: 'LobbyPage', params: { lobbyId, userid: userid.value } })
      return
    }

    // ✅ 2. If not in lobby, send join request as player2
    const payload = { 
      lobbyId, 
      player2Uid: userid.value,
      password 
    }
    await addItem(`${import.meta.env.VITE_APP_URL}/api/lobby/join`, payload)

    router.push({ name: 'LobbyPage', params: { lobbyId, userid: userid.value } })
  } catch (err) {
    alert('Failed to join lobby: Invalid password or error')
    console.error(err)
  }
}

const confirmPasswordJoin = async () => {
  await sendJoinLobby(joinLobbyId.value, lobbyPassword.value)
}
</script>

<template>
  <div class="bg-gray-900 min-h-screen w-full py-8 px-4">
    <div class="container mx-auto max-w-4xl bg-gray-800 rounded-lg shadow-xl p-6">
      <header class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-semibold text-white">Lobby List</h2>
        <button @click="openCreateLobby"
          class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
          + Create Lobby
        </button>
      </header>

      <div v-if="lobbies.length === 0" class="text-gray-300">No lobbies available</div>
      <div v-for="lobby in lobbies" :key="lobby.id"
           class="bg-gray-700 rounded-lg p-4 mb-3 flex justify-between items-center">
        <div>
          <h3 class="text-lg font-bold text-white">{{ lobby.name }}</h3>
          <p class="text-gray-300">Host: {{ lobby.hostId }}</p>
          <p v-if="lobby.privateLobby" class="text-red-400 text-sm">🔒 Private Lobby</p>
        </div>
        <button @click="joinLobby(lobby)"
          class="bg-blue-500 hover:bg-blue-700 text-white px-3 py-1 rounded">
          Join
        </button>
      </div>
    </div>

    <!-- Create Lobby Modal -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 class="text-lg text-white mb-4">Create Lobby</h3>
        <input v-model="newLobby.name"
               class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 mb-3"
               placeholder="Lobby Name" />
        <label class="text-gray-300 flex items-center gap-2 mb-3">
          <input type="checkbox" v-model="newLobby.isPrivate" /> Private Lobby
        </label>

        <input v-if="newLobby.isPrivate"
          v-model="newLobby.password"
           type="password"
          class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 mb-3"
           placeholder="Password" />
        <div class="flex justify-end gap-3">
          <button @click="showCreateModal = false" class="bg-red-600 px-3 py-1 rounded text-white">Cancel</button>
          <button @click="createLobby" class="bg-green-600 px-3 py-1 rounded text-white">Create</button>
        </div>
      </div>
    </div>

    <!-- Password Join Modal -->
    <div v-if="showPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div class="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 class="text-lg text-white mb-4">Enter Lobby Password</h3>
        <input v-model="lobbyPassword" type="password"
               class="w-full p-2 rounded bg-gray-700 text-white border border-gray-600 mb-3"
               placeholder="Password" />
        <div class="flex justify-end gap-3">
          <button @click="showPasswordModal = false" class="bg-red-600 px-3 py-1 rounded text-white">Cancel</button>
          <button @click="confirmPasswordJoin" class="bg-green-600 px-3 py-1 rounded text-white">Join</button>
        </div>
      </div>
    </div>
  </div>
</template>
