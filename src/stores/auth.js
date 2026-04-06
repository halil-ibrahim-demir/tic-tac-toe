import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)

  async function fetchUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (session) {
      user.value = session.user
      await fetchProfile(session.user.id)
    }
  }

  async function fetchProfile(userId) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (data) {
      profile.value = data
    }
  }

  async function signIn(username, password) {
    const safeUsername = username.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
    const email = `${safeUsername}@tictactoe.com`
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user

    await fetchProfile(data.user.id)
    if (!profile.value) {
      // Force create if it missed during signup
      const { data: pData } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, nickname: username })
        .select()
        .single()
      profile.value = pData
    }
  }

  async function signUp(username, password) {
    const safeUsername = username.toLowerCase().replace(/[^a-z0-9_.-]/g, '')
    const email = `${safeUsername}@tictactoe.com`
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          username: username,
        },
      },
    })
    if (error) throw error
    user.value = data.user

    // If auto-login worked and we have a session, create profile
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData?.session) {
      const { data: profileData } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, nickname: username })
        .select()
        .single()
      profile.value = profileData
    } else {
      // If we don't have a session, try logging in explicitly
      await signIn(username, password)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return { user, profile, fetchUser, fetchProfile, signIn, signUp, signOut }
})
