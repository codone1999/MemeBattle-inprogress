<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goToMainMenu = () => {
  router.push('/');
};
</script>

<template>
  <div id="policy-bg" class="min-h-screen flex items-center justify-center p-4">
    <Transition name="fade-card" appear>
      
      <div class="bg-stone-800 bg-opacity-80 backdrop-blur-sm border border-stone-700 p-8 md:p-12 rounded-2xl shadow-2xl shadow-stone-900/50 w-full max-w-2xl text-left">

        <h1 class="text-4xl font-bold text-yellow-100 mb-6 font-['Creepster'] drop-shadow-lg text-center">
          COOKIE POLICY
        </h1>

        <div class="text-stone-300 space-y-4 max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          <p>
            Welcome to MEME'S BLOOD. This Cookie Policy explains how we use cookies and similar technologies to recognize you when you visit our website.
          </p>

          <h2 class="text-2xl font-bold text-yellow-500 pt-2">What Are Cookies?</h2>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>

          <h2 class="text-2xl font-bold text-yellow-500 pt-2">How We Use Cookies</h2>
          <p>
            We use first-party cookies for several reasons. The only cookie we currently use is for:
          </p>
          <ul class="list-disc list-inside pl-4">
            <li>
              <strong>Essential Website Cookies:</strong> This cookie is strictly necessary to remember your cookie consent choice. When you click "Accept", we store a timestamp to hide the bar for 1 day.
            </li>
          </ul>

          <h2 class="text-2xl font-bold text-yellow-500 pt-2">Your Choices</h2>
          <p>
            By clicking "Accept" on the cookie bar, you consent to our use of this essential cookie. If you click "More Info", you are brought to this page, and the cookie bar will remain until you make a choice.
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

#policy-bg {
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

.custom-scrollbar::-webkit-scrollbar { width: 10px; }
.custom-scrollbar::-webkit-scrollbar-track { background: rgba(39, 39, 42, 0.5); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #eab308; border-radius: 10px; border: 2px solid rgba(39, 39, 42, 0.5); }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #facc15; }
.custom-scrollbar { scrollbar-width: thin; scrollbar-color: #eab308 rgba(39, 39, 42, 0.5); }
</style>