<script setup>
import PlayerUser from './PlayerComponents/PlayerUser.vue';
import PlayerInventory from './PlayerComponents/PlayerInventory.vue';
import { ref, computed ,onMounted } from 'vue';
import { getItems } from '@/lib/fetchUtils';
import { storeToRefs } from 'pinia';
import { useritem } from '@/stores/playerStore.js';

// const userAccount = ref([])
const loginPageStatus = ref(true)
const loginUsername = ref('')
const loginPassword = ref('')
const loginError = ref('')

let { inventories,currentUser,userInventory,cards,
    decks,characters
 } =storeToRefs(useritem())

// onMounted(async () => {
//     try{
//         userAccount.value = await getItems(`${import.meta.env.VITE_APP_URL}/users`)
//         //console.log('Get user complete')
//     }
//     catch{
//         alert('Error cannot get users in player manager')
//     }

// })

// const loginUser = async() => {
//     //login script
//     const user = userAccount.value.find(user => user.username === loginUsername.value &&
//         user.password === loginPassword.value)
//     if(user){
//         currentUser.value = user
//         loginUsername.value = ''
//         loginPassword.value = ''
//         await loadInventoryData()
//         //console.log(currentUser.value)
//     }
//     else{
//         loginError.value = 'Invalid username or password'
//     }
// }

const loginUser = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_APP_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginUsername.value,
        password: loginPassword.value
      })
    })

    if (!response.ok) {
      const message = await response.text()
      loginError.value = message || 'Invalid username or password'
      return
    }

    const user = await response.json()
    currentUser.value = user
    loginUsername.value = ''
    loginPassword.value = ''
    loginError.value = ''
    await loadInventoryData()
  } catch (error) {
    loginError.value = 'Error connecting to server'
    console.error(error)
  }
}


const logoutUser = () =>{
    currentUser.value = null
    loginPageStatus.value = true
    inventories.value = []
    decks.value = []
    cards.value = []
    characters.value = []
    useritem.resetState()
}
//Inventory
const loadInventoryData = async() => {
    try {
        inventories.value = await getItems(`${import.meta.env.VITE_APP_URL}/inventory`)
        cards.value = await getItems(`${import.meta.env.VITE_APP_URL}/card`)
        decks.value = await getItems(`${import.meta.env.VITE_APP_URL}/deck`)
        characters.value = await getItems(`${import.meta.env.VITE_APP_URL}/character`)
        loginPageStatus.value = false
        //console.log('Game data loaded successfully')
    } catch{
        alert('Error loading game data')
    }
}

const handleDeckAdded = async () =>{
    try{
        decks.value = await getItems(`${import.meta.env.VITE_APP_URL}/deck`)
        //console.log('Decks data updated after adding a new deck.');
    }catch
        {
        alert('Error loading deck data')
    }
}

</script>

<template>
    <div class="player-manager-container bg-gray-900 text-white min-h-screen w-full flex flex-col items-center justify-center p-8" v-if="loginPageStatus">

        <PlayerUser v-if="currentUser" :user="currentUser" />

        <div v-if="!currentUser" class="auth-container w-full max-w-md">

            <div class="login-section bg-gray-800 p-6 rounded-lg shadow-lg mb-6">
                <h1 class="text-4xl font-bold mb-8 text-center">
                        война(Voyna) Of Meme
                </h1>
              <h2  class="text-2xl font-semibold mb-4 text-center text-white">Login</h2>
              <div v-if="loginError" class="bg-red-100 border border-red-400
                 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong class="font-bold">Login Error!</strong>
                <span class="block sm:inline">{{ loginError }}</span>
              </div>
              <form @submit.prevent="loginUser()" class="space-y-4">
                <div>
                  <label for="login-username-manager" class="block text-gray-200 text-sm font-bold mb-2">Username:</label>
                  <input  v-model="loginUsername" type="text" id="login-username-manager" placeholder="Enter username"
                    class="shadow appearance-none border rounded w-full py-2 px-3 leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600">
                </div>
                <div>
                  <label for="login-password-manager" class="block text-gray-200 text-sm font-bold mb-2">Password:</label>
                  <input  v-model="loginPassword" type="password" id="login-password-manager" placeholder="Enter password"
                    class="shadow appearance-none border rounded w-full py-2 px-3  leading-tight focus:outline-none focus:shadow-outline bg-gray-700 text-white border-gray-600">
                </div>

                <button type="submit" class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full">
                  Login
                </button>
                
              </form>
              <div class="mt-4 text-center">
                <router-link 
                    :to="{name: 'AddUser'}"
                    type="button" class="text-sm text-blue-400 hover:text-blue-300 focus:outline-none"
                    >
                    Need an account? Create one
                </router-link>
              </div>
              <router-link 
                :to="{name: 'MainMenu'}"
                class="mt-2 text-sm text-blue-400 hover:text-blue-300 focus:outline-none block w-full text-center"
                >
                Back To Menu
              </router-link>
            </div>

        </div>
     </div>
     <div v-if="currentUser" class="game-logged-in-container w-full h-screen flex flex-col bg-gray-900 text-white">
         <div class="user-info-bar flex justify-between items-center p-4 border-b border-gray-800">
             <PlayerUser :user="currentUser" />
             <button
                 @click="logoutUser"
                 class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline text-sm">
                 Logout
             </button>
         </div>
         <PlayerInventory
             :inventory="userInventory"
             :cards="cards"
             :decks="decks"
             :characters="characters"
             :currentUser="currentUser"
             @deckAdded="handleDeckAdded"
             class="flex-1 overflow-y-auto"/>
     </div>

</template>

<style scoped></style>

