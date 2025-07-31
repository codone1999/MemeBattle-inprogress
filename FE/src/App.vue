<script setup>
import GameManager from './components/GameManager.vue'
import HeadOrTail from './components/mainGameComponents/HeadOrTail.vue';
import PlayerManager from './components/PlayerManager.vue';
import mainMenu from './components/UI/mainMenu.vue';
import Gacha from './components/Gacha.vue';
import { RouterView } from 'vue-router';
</script>

<template>
    <div>
      <router-view />
    </div>
</template>

<style scoped>

</style>
