<script setup>
import { ref, onMounted } from 'vue'
import { getItems, addItem } from '@/lib/fetchUtils'
import { useRoute } from 'vue-router'

const route = useRoute()
const userid = ref(Number(route.params.userid)) // get userid from router params

const lobbies = ref([])
const showCreateModal = ref(false)
const showPasswordModal = ref(false)
const lobbyPassword = ref('')
const joinLobbyId = ref(null)

const newLobby = ref({
  name: '',
  privateLobby: false,
  password: ''
})

const fetchLobbies = async () => {
  try {
    lobbies.value = await getItems(`${import.meta.env.VITE_APP_URL}/lobby/list`)
  } catch (err) {
    console.error('Failed to fetch lobbies:', err)
  }
}

onMounted(fetchLobbies)

const openCreateLobby = () => {
  newLobby.value = { name: '', privateLobby: false, password: '' }
  showCreateModal.value = true
}

const createLobby = async () => {
  try {
    const payload = {
      name: newLobby.value.name,
      hostId: userid.value,
      privateLobby: newLobby.value.privateLobby,
      password: newLobby.value.privateLobby ? newLobby.value.password : ''
    }
    const created = await addItem(`${import.meta.env.VITE_APP_URL}/lobby/create`, payload)
    lobbies.value.push(created)
    showCreateModal.value = false
    alert('Lobby created successfully!')
  } catch (err) {
    alert('Failed to create lobby')
    console.error(err)
  }
}

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
    const payload = { lobbyId, userId: userid.value, password }
    await addItem(`${import.meta.env.VITE_APP_URL}/lobby/join`, payload)
    alert('Joined lobby!')
    showPasswordModal.value = false
  } catch (err) {
    alert('Failed to join lobby')
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
          <p v-if="lobby.privateLobby" class="text-red-400 text-sm">Private Lobby</p>
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
          <input type="checkbox" v-model="newLobby.privateLobby" /> Private Lobby
        </label>
        <input v-if="newLobby.privateLobby"
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
