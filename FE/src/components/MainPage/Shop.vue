<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchApi } from '@/utils/fetchUtils';

const router = useRouter();

// --- State ---
const userProfile = ref(null);
const isLoading = ref(true);
const notification = ref(null);
let notificationTimer = null;

// Mock สินค้า (เพราะยังไม่มี API Shop)
const shopItems = ref([
  { id: 1, name: 'Starter Pack', type: 'PACK', price: 100, currency: 'gold', image: '📦', desc: '5 Random Cards' },
  { id: 2, name: 'Elite Pack', type: 'PACK', price: 500, currency: 'gold', image: '🎁', desc: '5 Cards (1 Rare guaranteed)' },
  { id: 3, name: 'Legendary Chest', type: 'CHEST', price: 100, currency: 'gem', image: '💎', desc: '1 Legendary Card' },
  { id: 4, name: 'Energy Potion', type: 'ITEM', price: 50, currency: 'gold', image: '🧪', desc: 'Restore 10 Energy' },
  { id: 5, name: 'Card Back: Dragon', type: 'COSMETIC', price: 200, currency: 'gem', image: '🐉', desc: 'Exclusive Card Back' },
  { id: 6, name: 'Avatar: Pepe', type: 'COSMETIC', price: 150, currency: 'gem', image: '🐸', desc: 'Rare Avatar' },
]);

// --- Notification Helper ---
const showNotification = (type, message, duration = 3000) => {
  if (notificationTimer) clearTimeout(notificationTimer);
  notification.value = { type, message };
  notificationTimer = setTimeout(() => {
    notification.value = null;
  }, duration);
};

// --- Fetch Data ---
onMounted(async () => {
  isLoading.value = true;
  try {
    // ดึงข้อมูล User เพื่อโชว์เงิน (สมมติว่ามี field gold/gems)
    const res = await fetchApi('/auth/me');
    if (res.success) {
      userProfile.value = res.data.user;
      // Mock Balance ถ้าไม่มีใน DB
      if (!userProfile.value.gold) userProfile.value.gold = 1250;
      if (!userProfile.value.gems) userProfile.value.gems = 50;
    }
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
});

// --- Actions ---
const handleBuy = (item) => {
  // จำลองการซื้อ
  if (item.currency === 'gold' && userProfile.value.gold >= item.price) {
    userProfile.value.gold -= item.price;
    showNotification('success', `Purchased ${item.name}!`);
  } else if (item.currency === 'gem' && userProfile.value.gems >= item.price) {
    userProfile.value.gems -= item.price;
    showNotification('success', `Purchased ${item.name}!`);
  } else {
    showNotification('error', `Not enough ${item.currency}!`);
  }
};

const goToMainMenu = () => {
  router.push('/');
};
</script>

<template>
  <div id="shop-bg" class="min-h-screen p-4 md:p-8 overflow-hidden font-sans-custom relative">
    
    <Transition name="slide-down">
      <div v-if="notification" :class="['fixed top-5 left-1/2 -translate-x-1/2 z-[200] p-4 rounded-lg shadow-xl max-w-sm w-[90%]', notification.type === 'success' ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500', 'border border-white/20']">
        <div class="flex items-center text-white font-bold">
            <span v-if="notification.type==='success'">✅</span>
            <span v-else>❌</span>
            <span class="ml-2">{{ notification.message }}</span>
        </div>
      </div>
    </Transition>

    <div class="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
      
      <button 
        @click="goToMainMenu" 
        class="flex items-center justify-center bg-stone-700 hover:bg-stone-600 text-yellow-100 font-bold text-lg uppercase py-2 px-4 rounded-md shadow-lg shadow-stone-900/40 transition-all duration-300 border-b-4 border-r-4 border-stone-900 active:translate-y-px active:border-b-2 active:border-r-2"
      >
        <svg class="h-6 w-6 mr-2 rotate-180" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        MAIN MENU
      </button>

      <h1 class="text-5xl text-yellow-100 font-['Creepster'] tracking-wider drop-shadow-lg text-shadow-black">
        MERCHANT
      </h1>

      <div class="flex gap-4 bg-stone-900/80 p-3 rounded-lg border-2 border-stone-700 shadow-inner">
        
        <div class="flex items-center gap-2 px-3 border-r border-stone-600">
          <span class="text-2xl">🪙</span>
          <div class="flex flex-col leading-none">
             <span class="text-xs text-stone-400 uppercase font-bold">Gold</span>
             <span class="text-yellow-400 font-mono text-lg">{{ userProfile?.gold || 0 }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 px-3">
          <span class="text-2xl">💎</span>
          <div class="flex flex-col leading-none">
             <span class="text-xs text-stone-400 uppercase font-bold">Gems</span>
             <span class="text-cyan-400 font-mono text-lg">{{ userProfile?.gems || 0 }}</span>
          </div>
        </div>

      </div>
    </div>

    <div class="w-full max-w-7xl mx-auto">
      
      <div v-if="isLoading" class="flex justify-center py-20">
         <svg class="animate-spin h-16 w-16 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        <div 
          v-for="item in shopItems" 
          :key="item.id"
          class="bg-stone-800 border-4 border-stone-700 rounded-xl p-4 shadow-xl hover:scale-105 transition-transform duration-300 flex flex-col items-center text-center relative group"
        >
          <div class="absolute inset-0 bg-yellow-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

          <div class="w-full h-40 bg-stone-900/50 rounded-lg border-2 border-stone-600 mb-4 flex items-center justify-center text-6xl shadow-inner">
             {{ item.image }}
          </div>

          <h3 class="text-yellow-100 font-bold text-xl uppercase tracking-wide mb-1">{{ item.name }}</h3>
          <p class="text-stone-400 text-sm mb-4 flex-grow">{{ item.desc }}</p>

          <button 
            @click="handleBuy(item)"
            class="w-full py-2 rounded font-bold text-stone-900 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border-b-4 active:border-b-0 active:translate-y-1"
            :class="item.currency === 'gold' ? 'bg-yellow-600 hover:bg-yellow-500 border-yellow-800' : 'bg-cyan-600 hover:bg-cyan-500 border-cyan-800 text-white'"
          >
             <span>{{ item.price }}</span>
             <span v-if="item.currency === 'gold'">🪙</span>
             <span v-else>💎</span>
             BUY
          </button>

        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
#shop-bg {
  background-color: hsl(25, 30%, 15%); /* เข้มกว่า Landing นิดหน่อย */
  background-image: radial-gradient(circle at top, hsl(25, 30%, 25%) 0%, hsl(25, 30%, 15%) 60%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

.text-shadow-black {
  text-shadow: 2px 2px 0px #000;
}

/* Notification Slide */
.slide-down-enter-active, .slide-down-leave-active { transition: all 0.4s ease; }
.slide-down-enter-from, .slide-down-leave-to { opacity: 0; transform: translateY(-20px) translateX(-50%); }
</style>