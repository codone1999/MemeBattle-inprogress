<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToMainMenu = () => {
  router.push('/'); // กลับไปหน้าแรก
};
</script>

<template>
  <div id="tos-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      
      <div class="bg-stone-800 bg-opacity-80 backdrop-blur-sm border border-stone-700 p-8 md:p-12 rounded-2xl shadow-2xl shadow-stone-900/50 w-full max-w-2xl text-left">

        <h1 class="text-4xl font-bold text-yellow-100 mb-6 font-['Creepster'] drop-shadow-lg text-center">
          TERMS OF SERVICE
        </h1>

        <div class="text-stone-300 space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          <p>
            Welcome to MEME'S BLOOD. These terms outline the rules and regulations for the use of our game. By accessing this game, we assume you accept these terms and conditions.
          </p>

          <h2 class="text-2xl font-bold text-yellow-500 pt-2">1. Accounts</h2>
          <p>
            You are responsible for safeguarding your account and for any activities or actions under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
          </p>

          <h2 class="text-2xl font-bold text-yellow-500 pt-2">2. Purchases & Payments</h2>
          <p>
            The game may offer virtual currency (e.g., "Gems", "Gold") or virtual items (e.g., "Card Packs", "Skins") for purchase with real money ("Purchases").
          </p>
          <ul class="list-disc list-inside pl-4 space-y-2">
            <li>
              <strong>ALL PURCHASES ARE FINAL.</strong> You acknowledge that MEME'S BLOOD is not required to provide a refund for any reason. All virtual items and currency are forfeited if your account is terminated or suspended.
            </li>
            <li>
              Virtual currency and items have no monetary value in the real world and cannot be redeemed or exchanged for real money.
            </li>
            <li>
              Prices and availability of virtual items are subject to change without notice. We are not responsible for any issues related to payment processing by third-party providers (e.g., Google Play, Apple App Store).
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-yellow-500 pt-2">3. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>
        </div>

        <button
          @click="goToMainMenu"
          type="button"
          class="w-full mt-10 bg-green-700 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-md transition-all duration-300 ease-in-out 
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-stone-800 focus:ring-green-500
                 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-700/40"
        >
          BACK TO MAIN MENU
        </button>

      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* (อย่าลืม Import ฟอนต์ Creepster) */

#tos-bg {
  background-color: hsl(25, 30%, 20%);
  background-image: radial-gradient(ellipse at center, hsl(25, 30%, 30%) 0%, hsl(25, 30%, 20%) 70%), 
                    url('https://www.transparenttextures.com/patterns/dark-wood.png');
  background-size: cover;
  background-blend-mode: overlay;
  background-attachment: fixed;
}

.fade-card-enter-active {
  transition: all 0.5s ease-out;
}
.fade-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

/* Custom Scrollbar (เหมือนหน้า Credit) */
.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(39, 39, 42, 0.5); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #eab308; border-radius: 10px; border: 2px solid rgba(39, 39, 42, 0.5); }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #facc15; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #eab308 rgba(39, 39, 42, 0.5); }
</style>