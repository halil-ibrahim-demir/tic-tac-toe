import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import GameView from '../views/GameView.vue'
import ScoreboardView from '../views/ScoreboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      name: 'game',
      component: GameView,
      meta: { requiresAuth: true },
    },
    {
      path: '/scoreboard',
      name: 'scoreboard',
      component: ScoreboardView,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()
  if (!auth.user && auth.fetchUser) {
    await auth.fetchUser()
  }

  const isAuthenticated = !!auth.user

  if (to.meta.requiresAuth && !isAuthenticated) {
    return '/login'
  }

  // Prevent logged in users from going to login
  if (to.path === '/login' && isAuthenticated) {
    return '/'
  }
})

export default router
