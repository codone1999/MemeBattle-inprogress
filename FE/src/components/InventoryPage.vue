<script setup>
import { useRoute } from 'vue-router';
import PlayerUser from '@/components/PlayerComponents/PlayerUser.vue';
import PlayerInventory from '@/components/PlayerComponents/PlayerInventory.vue';
import { storeToRefs } from 'pinia';
import { useritem } from '@/stores/playerStore.js';

const route = useRoute();
const { currentUser } = storeToRefs(useritem());

const userId = route.query.userId || currentUser.value?.id;
</script>

<template>
  <div class="w-full">
    <div class="flex justify-between items-center bg-gray-800 text-white p-4">
      <PlayerUser :user="currentUser" />
      <router-link to="/login" class="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition">Logout</router-link>
    </div>
    <PlayerInventory :userid="userId" />
  </div>
</template>
