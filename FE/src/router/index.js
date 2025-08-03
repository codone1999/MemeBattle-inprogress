import { createRouter, createWebHistory } from "vue-router";
import MainMenu from "@/components/UI/mainMenu.vue";
import Login from "@/components/PlayerManager.vue";
import AddPlayerUser from "@/components/PlayerComponents/AddPlayerUser.vue";
import PageNotFound from "@/components/PageNotFound.vue";

import InventoryPage from "@/components/InventoryPage.vue";
import LobbyList from "@/components/Lobby/LobbyList.vue";
import GameManager from "@/components/GameManager.vue";

const routes = [
  { path: '/', name: 'MainMenu', component: MainMenu },
  { path: '/login', name: 'Login', component: Login },
  { path: '/inventory', name: 'Inventory', component: InventoryPage },
  { path: '/CreateAccount', name: 'AddUser', component: AddPlayerUser },
  { path: '/lobbies/:userid', name: 'LobbyList', component: LobbyList, props: true },
  {path: '/lobby/:lobbyId/:userid', name: 'LobbyPage',component: () => import('@/components/Lobby/LobbyPage.vue')},
  { path: '/game/:lobbyId', name: 'GameManager', component: GameManager, props: true },
  { path: '/:NotFound(.*)', name: 'NotFound', component: PageNotFound },
]



const router = createRouter({history: createWebHistory(), routes})
export default router
