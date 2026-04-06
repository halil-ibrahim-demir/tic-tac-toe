<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isLogin = ref(true)
const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const handleSubmit = async () => {
  errorMsg.value = ''
  isLoading.value = true
  try {
    if (isLogin.value) {
      await authStore.signIn(username.value, password.value)
    } else {
      await authStore.signUp(username.value, password.value)
    }
    router.push('/')
  } catch (error) {
    if (
      error.message.includes('User already registered') ||
      error.message.includes('Email already in use')
    ) {
      errorMsg.value = 'Username already taken.'
    } else if (error.message.includes('Invalid login credentials')) {
      errorMsg.value = 'Incorrect username or password.'
    } else {
      errorMsg.value = error.message
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="glass-panel auth-card">
      <h2 class="title">
        <span class="neon-text">{{ isLogin ? 'Welcome Back' : 'Join the Arena' }}</span>
      </h2>
      <p class="subtitle">
        {{ isLogin ? 'Login to continue your win streak' : 'Create an account to start playing' }}
      </p>

      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="errorMsg" class="error-box">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            stroke="currentColor"
            stroke-width="2"
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <span>{{ errorMsg }}</span>
        </div>

        <div class="input-group">
          <label>Username</label>
          <div class="input-icon-wrapper">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
              class="icon"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <input
              type="text"
              v-model="username"
              required
              minlength="3"
              maxlength="20"
              placeholder="Unique username"
            />
          </div>
        </div>

        <div class="input-group">
          <label>Password</label>
          <div class="input-icon-wrapper">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
              class="icon"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            <input
              type="password"
              v-model="password"
              required
              minlength="6"
              placeholder="At least 6 characters"
            />
          </div>
        </div>

        <button type="submit" class="gradient-btn submit-btn" :disabled="isLoading">
          <span v-if="isLoading" class="loader"></span>
          <span v-else>{{ isLogin ? 'Login' : 'Sign Up & Play' }}</span>
        </button>

        <p class="toggle-text">
          {{ isLogin ? "Don't have an account?" : 'Already a member?' }}
          <a href="#" @click.prevent="isLogin = !isLogin" class="toggle-link">
            {{ isLogin ? 'Sign up here' : 'Login instead' }}
          </a>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 3rem 2.5rem;
  text-align: center;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #a0a0b8;
  margin-bottom: 2.5rem;
  font-size: 0.95rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.error-box {
  background: rgba(255, 82, 82, 0.1);
  border: 1px solid rgba(255, 82, 82, 0.3);
  color: #ff5252;
  padding: 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  text-align: left;
}

.input-group {
  text-align: left;
}

.input-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #c8c8e0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon-wrapper .icon {
  position: absolute;
  left: 1rem;
  color: #6c6c8c;
}

input {
  width: 100%;
  padding: 0.9rem 1rem 0.9rem 3rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  transition: all 0.3s;
}

input:focus {
  outline: none;
  border-color: #00f2fe;
  background: rgba(0, 242, 254, 0.05);
  box-shadow: 0 0 0 3px rgba(0, 242, 254, 0.1);
}

input::placeholder {
  color: #5c5c7c;
}

.submit-btn {
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  letter-spacing: 1px;
  margin-top: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 52px;
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.toggle-text {
  margin-top: 1rem;
  font-size: 0.9rem;
  color: #a0a0b8;
}

.toggle-link {
  color: #00f2fe;
  text-decoration: none;
  font-weight: 600;
  margin-left: 0.25rem;
}

.toggle-link:hover {
  text-decoration: underline;
}

.loader {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
