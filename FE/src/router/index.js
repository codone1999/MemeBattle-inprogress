import { createRouter, createWebHistory } from "vue-router";
import MainMenu from "@/components/UI/mainMenu.vue";
import Login from "@/components/view/Login.vue";
import Register from "@/components/view/Register.vue";
import LobbyList from "@/components/view/LobbyList.vue";
import PageNotFound from "@/components/PageNotFound.vue";
import { useAuthStore } from "@/stores/authStore";

const routes = [
  {
    path: '/',
    name: 'MainMenu',
    component: MainMenu
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { requiresGuest: true }
  },
  {
    path: '/lobbies',
    name: 'LobbyList',
    component: LobbyList,
    meta: { requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: PageNotFound
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Try to restore session if token exists
  if (!authStore.isAuthenticated && authStore.token) {
    try {
      await authStore.verifyToken();
    } catch (error) {
      authStore.logout();
    }
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } });
  }
  // Check if route requires guest (already logged in)
  else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next({ name: 'LobbyList' });
  }
  else {
    next();
  }
});

export default router;