<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isBarVisible = ref(false); 

const COOKIE_CONSENT_KEY = 'cookie_consent_timestamp';
const ONE_DAY_MS = 24 * 60 * 60 * 1000; 

onMounted(() => {
  const consentTimestamp = localStorage.getItem(COOKIE_CONSENT_KEY);

  if (!consentTimestamp) {
    isBarVisible.value = true;
  } else {
    const now = new Date().getTime();
    const timePassed = now - parseInt(consentTimestamp, 10);

    if (timePassed > ONE_DAY_MS) {
      isBarVisible.value = true;
      localStorage.removeItem(COOKIE_CONSENT_KEY); 
    }
  }
});

const handleAccept = () => {
  localStorage.setItem(COOKIE_CONSENT_KEY, new Date().getTime().toString());
  isBarVisible.value = false;
};

const handleMoreInfo = () => {
  router.push('/cookie-policy');
};
</script>

<template>
  <Transition name="slide-up">
    <div 
      v-if="isBarVisible"
      class="
        fixed bottom-4 left-4 z-50 p-5 
        max-w-md w-[90%] 
        bg-stone-800 border-t-4 border-yellow-700 
        rounded-lg shadow-2xl shadow-stone-900/50
      "
    >
      <div class="flex flex-col gap-4">
        
        <h3 class="font-bold text-yellow-100 text-lg">Cookie Consent</h3>

        <p class="text-stone-200 text-sm">
          We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.
        </p>
        
        <div class="flex items-center gap-3 mt-2">
          
          <button
            @click="handleAccept"
            class="flex-1 bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
          >
            Accept
          </button>

          <button
            @click="handleMoreInfo"
            class="flex-1 bg-stone-600 hover:bg-stone-500 text-yellow-100 font-bold py-2 px-4 rounded-md transition-colors duration-200 text-sm"
          >
            More Info
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* Animation สำหรับเลื่อนขึ้น/ลง จากด้านล่าง */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100px); /* เพิ่มระยะทาง Y ให้ดูลอยขึ้นมาชัดๆ */
}

.slide-up-enter-to,
.slide-up-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>