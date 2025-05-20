<script setup>

</script>

<template>
    <div class="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 text-center">
    <h1 class="text-6xl font-bold">404</h1>
    <p class="text-4xl mt-4">Sorry Page Not Found.</p>
    <router-link 
        :to="{name: 'MainMenu'}"
        class="text-2xl mt-6 px-5 py-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
        Back To Menu
    </router-link>
  </div>
</template>
