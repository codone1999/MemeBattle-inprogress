<script setup>
import PlayerUser from './PlayerComponents/PlayerUser.vue';
import PlayerInventory from './PlayerComponents/PlayerInventory.vue';
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useritem } from '@/stores/playerStore.js';
import { getItems } from '@/lib/fetchUtils';
import { useRouter } from 'vue-router';

const router = useRouter();
//const loginPageStatus = ref(true);
const loginUsername = ref('');
const loginPassword = ref('');
const loginError = ref('');

const {
  inventories, currentUser, userInventory, cards,
  decks, characters
} = storeToRefs(useritem());
const loginUser = async () => {
  try {
    const response = await fetch(`${import.meta.env.VITE_APP_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginUsername.value,
        password: loginPassword.value
      })
    });

    if (!response.ok) {
      loginError.value = 'Invalid username or password';
      return;
    }

    const user = await response.json();
    currentUser.value = user;
    router.push({ name: 'Inventory', query: { userId: user.id } });

  } catch (error) {
    loginError.value = 'Error connecting to server';
    console.error(error);
  }
};

const logoutUser = () => {
  currentUser.value = null;
  loginPageStatus.value = true;
  inventories.value = [];
  decks.value = [];
  cards.value = [];
  characters.value = [];
  useritem.resetState();
};
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 text-white">
    <div v-if="!currentUser" class="w-full max-w-md p-6 bg-white rounded-lg shadow-xl text-black">
      <h1 class="text-3xl font-bold mb-4 text-center text-blue-800">война(Voyna) Of Meme</h1>
      <h2 class="text-xl font-semibold mb-4 text-center">Login</h2>
      <div v-if="loginError" class="text-red-500 text-sm mb-2">{{ loginError }}</div>
      <form @submit.prevent="loginUser" class="space-y-4">
        <div>
          <label class="block text-sm font-medium">Username</label>
          <input v-model="loginUsername" type="text" class="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300" />
        </div>
        <div>
          <label class="block text-sm font-medium">Password</label>
          <input v-model="loginPassword" type="password" class="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-blue-300" />
        </div>
        <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">Login</button>
      </form>
      <div class="mt-4 text-center text-sm text-gray-600">
        <router-link :to="{ name: 'AddUser' }" class="text-blue-500 hover:underline">Need an account? Create one</router-link>
        <br />
        <router-link :to="{ name: 'MainMenu' }" class="text-blue-500 hover:underline">Back To Menu</router-link>
      </div>
    </div>

    <div v-if="currentUser" class="w-full">
      <div class="flex justify-between items-center bg-gray-800 text-white p-4">
        <PlayerUser :user="currentUser" />
        <button @click="logoutUser" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition">Logout</button>
      </div>
    </div>
  </div>
</template>
