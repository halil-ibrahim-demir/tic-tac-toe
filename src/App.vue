<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="app-background">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <header class="glass-header">
      <div class="header-content">
        <div class="logo">
          <span class="neon-text">Tic</span>Tac<span class="neon-text">Toe</span>
        </div>
        <nav v-if="authStore.user">
          <RouterLink to="/" class="nav-link">Play Game</RouterLink>
          <RouterLink to="/scoreboard" class="nav-link">Scoreboard</RouterLink>
          <a href="#" @click.prevent="handleLogout" class="nav-link logout-btn"
            >Logout ({{ authStore.profile?.nickname }})</a
          >
        </nav>
      </div>
    </header>

    <main class="main-content">
      <transition name="fade" mode="out-in">
        <RouterView />
      </transition>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap');

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  font-family: 'Outfit', sans-serif;
}

body {
  background-color: #0f0c29;
  color: #ffffff;
  overflow-x: hidden;
}

/* Glassmorphism Classes */
.glass-panel {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.neon-text {
  background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(0, 242, 254, 0.4);
}

.gradient-btn {
  background: linear-gradient(45deg, #00f2fe, #4facfe);
  color: #fff;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 242, 254, 0.5);
}
</style>

<style scoped>
.app-background {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at bottom, #24243e, #302b63, #0f0c29);
}

/* Ambient glow blobs */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.5;
}

.blob-1 {
  top: -10%;
  left: -10%;
  width: 400px;
  height: 400px;
  background: #ff007f;
  animation: float 10s infinite ease-in-out alternate;
}

.blob-2 {
  bottom: -10%;
  right: -10%;
  width: 500px;
  height: 500px;
  background: #00f2fe;
  animation: float 12s infinite ease-in-out alternate-reverse;
}

@keyframes float {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(50px, 50px) scale(1.1);
  }
}

.glass-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(15, 12, 41, 0.6);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem 0;
}

.header-content {
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.logo {
  font-size: 1.8rem;
  font-weight: 800;
  letter-spacing: 1px;
}

nav {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link {
  color: #a0a0b8;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: -4px;
  left: 0;
  background: #00f2fe;
  transition: width 0.3s ease;
}

.nav-link:hover,
.router-link-exact-active {
  color: #fff;
}

.nav-link:hover::after,
.router-link-exact-active::after {
  width: 100%;
}

.logout-btn {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.5rem 1rem;
  border-radius: 8px;
}

.logout-btn::after {
  display: none;
}

.logout-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ff4b4b;
}

.main-content {
  position: relative;
  z-index: 1;
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  min-height: calc(100vh - 80px);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.4s ease,
    transform 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
