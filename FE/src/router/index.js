// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router';
import LandingPage from '@/components/LandingPage.vue';
import Register from '@/components/Accounting/Register.vue';
import VerifyEmail from '@/components/Accounting/VerifyEmail.vue';
import Login from '@/components/Accounting/Login.vue';
import PageNotFound from '@/components/PageNotFound.vue';
import Credits from '@/components/Credits.vue';
import CookiePolicy from '@/components/CookiePolicy.vue';
import TosPolicy from '@/components/TosPolicy.vue';

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
    meta: { title: 'Sign Up' }
  },
  {
    path: '/verify-email',
    name: 'VerifyEmail',
    component: VerifyEmail,
    meta: { title: 'Verify Email' }
  },
  {
    path: '/signin',
    name: 'Login',
    component: Login,
    meta: { title: 'Sign In' }
  },
  { 
    path: '/:pathMatch(.*)*',
    name: 'NotFound', 
    component: PageNotFound 
  },
  { 
    path: '/credits',
    name: 'Credits', 
    component: Credits 
  },
  { 
    path: '/cookie-policy',
    name: 'CookiePolicy', 
    component: CookiePolicy 
  },
  { 
    path: '/tos-policy',
    name: 'TermsOfService', 
    component: TosPolicy 
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;