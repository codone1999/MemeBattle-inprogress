<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const authStore = useAuthStore();

const emit = defineEmits(['close', 'updated']);

const newUsername = ref(authStore.user?.username || '');
const profilePictureUrl = ref('');
const loading = ref(false);
const error = ref('');

const handleSubmit = async () => {
  error.value = '';
  
  if (!newUsername.value.trim()) {
    error.value = 'Username cannot be empty';
    return;
  }

  if (newUsername.value.length < 3) {
    error.value = 'Username must be at least 3 characters';
    return;
  }

  loading.value = true;

  try {
    const response = await axios.put(`${API_URL}/user/profile`, {
      username: newUsername.value.trim(),
      profilePicture: profilePictureUrl.value.trim() || null
    });

    if (response.data.success) {
      // Update auth store with new user data
      authStore.user = response.data.data.user;
      alert('Profile updated successfully!');
      emit('updated');
      emit('close');
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to update profile';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="space-y-4">
    <div v-if="error" class="bg-red-900/50 border border-red-500 rounded-lg p-3">
      <p class="text-red-300 text-sm">{{ error }}</p>
    </div>

    <div>
      <label class="block text-gray-300 text-sm font-bold mb-2">Username</label>
      <input
        v-model="newUsername"
        type="text"
        :disabled="loading"
        class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
        placeholder="Enter new username"
      />
      <p class="text-gray-400 text-xs mt-1">Must be 3-20 characters</p>
    </div>

    <div>
      <label class="block text-gray-300 text-sm font-bold mb-2">Profile Picture URL (Optional)</label>
      <input
        v-model="profilePictureUrl"
        type="url"
        :disabled="loading"
        class="w-full bg-gray-700 border-2 border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
        placeholder="https://example.com/image.png"
      />
      <p class="text-gray-400 text-xs mt-1">Leave empty to use character image</p>
    </div>

    <div class="flex gap-3">
      <button
        @click="handleSubmit"
        :disabled="loading"
        class="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-3 rounded-lg transition disabled:cursor-not-allowed"
      >
        {{ loading ? 'Saving...' : 'Save Changes' }}
      </button>
      <button
        @click="$emit('close')"
        :disabled="loading"
        class="px-6 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white font-bold py-3 rounded-lg transition disabled:cursor-not-allowed"
      >
        Cancel
      </button>
    </div>
  </div>
</template>