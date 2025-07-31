<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const newUser = ref({ username: '', password: '' });
const createUserError = ref('');
const createUserSuccess = ref('');

const CreateUser = async () => {
  createUserError.value = '';
  createUserSuccess.value = '';

  const trimmedUsername = newUser.value.username.trim();
  const trimmedPassword = newUser.value.password.trim();

  if (!trimmedUsername || !trimmedPassword) {
    createUserError.value = 'Username and password are required';
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_APP_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: trimmedUsername,
        password: trimmedPassword
      })
    });

    if (!response.ok) {
      const message = await response.text();
      createUserError.value = message || 'Failed to create user';
      return;
    }

    createUserSuccess.value = 'User created successfully';
    newUser.value = { username: '', password: '' };
    router.push({ name: 'Login' });
  } catch (err) {
    console.error(err);
    createUserError.value = 'Server error while creating user';
  }
};
</script>

<template>
  <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-900 to-gray-900 text-white">
    <div class="w-full max-w-md p-6 bg-white rounded-lg shadow-lg text-black">
      <h2 class="text-2xl font-bold text-center text-green-800 mb-4">Create Account</h2>
      <div v-if="createUserError" class="text-red-600 text-sm mb-2">{{ createUserError }}</div>
      <div v-if="createUserSuccess" class="text-green-600 text-sm mb-2">{{ createUserSuccess }}</div>

      <form @submit.prevent="CreateUser" class="space-y-4">
        <div>
          <label class="block text-sm font-medium">Username</label>
          <input v-model="newUser.username" type="text" class="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-300" />
        </div>
        <div>
          <label class="block text-sm font-medium">Password</label>
          <input v-model="newUser.password" type="password" class="w-full mt-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring focus:border-green-300" />
        </div>
        <button type="submit" class="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition">Create Account</button>
      </form>

      <div class="mt-4 text-center text-sm text-gray-600">
        <router-link :to="{ name: 'MainMenu' }" class="text-green-500 hover:underline">Back To Menu</router-link>
      </div>
    </div>
  </div>
</template>
