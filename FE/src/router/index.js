// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from '@/components/MainPage/LandingPage.vue';
import Register from '@/components/Accounting/Register.vue';
import VerifyEmail from '@/components/Accounting/VerifyEmail.vue';
import Login from '@/components/Accounting/Login.vue';
import PageNotFound from '@/components/MainPage/PageNotFound.vue';
import Credits from '@/components/MainPage/Credits.vue';
import CookiePolicy from '@/components/MainPage/CookiePolicy.vue';
import TosPolicy from '@/components/MainPage/TosPolicy.vue';
import RequestReset from '@/components/Accounting/RequestReset.vue';
import Inventory from '@/components/MainLobby/Inventory.vue'
import Settings from '@/components/MainPage/Settings.vue';
import About from '@/components/MainPage/About.vue';
import Shop from '@/components/MainPage/Shop.vue';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
    meta: { title: 'Welcome' }
  },
  {
    path: '/signup',
    name: 'Register',
    component: Register,
    meta: { title: 'Sign Up', guestOnly: true } 
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail,
    meta: { title: 'Verify Email', guestOnly: true }
  },
  {
    path: '/signin',
    name: 'Login',
    component: Login,
    meta: { title: 'Sign In', guestOnly: true }
  },
  { 
    path: '/request-reset',
    name: 'RequestReset', 
    component: RequestReset,
    meta: { title: 'Reset Password', guestOnly: true }
  },
  { 
    path: '/credits',
    name: 'Credits', 
    component: Credits,
    meta: { title: 'Credits' }
  },
  { 
    path: '/cookie-policy',
    name: 'CookiePolicy', 
    component: CookiePolicy,
    meta: { title: 'Cookie Policy' }
  },
  { 
    path: '/tos-policy',
    name: 'TermsOfService', 
    component: TosPolicy,
    meta: { title: 'Terms Of Service' }
  },
  { 
    path: '/:pathMatch(.*)*',
    name: 'NotFound', 
    component: PageNotFound,
    meta: { title: 'Page Not Found' } 
  },
  { 
    path: '/inventory',
    name: 'Inventory', 
    component: Inventory,
    meta: { title: 'Inventory', requiresAuth: true }
  },
  { 
    path: '/setting',
    name: 'Settings', 
    component: Settings,
    meta: { title: 'Settings' }
  },
  { 
    path: '/about',
    name: 'About', 
    component: About,
    meta: { title: 'About' }
  },
  { 
    path: '/shop',
    name: 'Shop', 
    component: Shop,
    meta: { title: 'Shop' }
  },
  // { 
  //   path: '/card/:cardId',
  //   name: 'CardDetail', 
  //   component: CardDetail,
  //   meta: { title: 'Card Detail', requiresAuth: true }
  // },
  // { 
  //   path: '/maps',
  //   name: 'MapSelection', 
  //   component: MapSelection,
  //   meta: { title: 'Map Selection', requiresAuth: true }
  // },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `MEME'S BLOOD - ${to.meta.title}`;
  }

  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true'

  if (to.meta.guestOnly && isAuthenticated) {
    return next({ name: 'Landing' }); 
  }

  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' });
  }

  next();
});

export default router;