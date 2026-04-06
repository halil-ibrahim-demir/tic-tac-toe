<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../supabaseClient'

const scores = ref([])
const loading = ref(true)
const selectedTab = ref('easy')

async function fetchLeaderboard() {
  loading.value = true
  try {
    const diffColumn = `points_${selectedTab.value}`
    console.log(`Fetching data for ${selectedTab.value} from Supabase...`)

    const { data, error } = await supabase
      .from('profiles')
      .select(`username, ${diffColumn}`)
      .not('username', 'is', null)
      .gt(diffColumn, 0)
      .order(diffColumn, { ascending: false })
      .limit(10)

    if (error) {
      console.error('Supabase Error:', error.message)
      throw error
    }

    scores.value = data.map((d) => ({
      username: d.username,
      total_points: d[diffColumn],
    }))
  } catch (err) {
    console.error('Failed to fetch leaderboard:', err)
  } finally {
    loading.value = false
  }
}

watch(selectedTab, () => {
  fetchLeaderboard()
})

onMounted(() => {
  fetchLeaderboard()
})
</script>

<template>
  <div class="scoreboard-wrapper">
    <div class="glass-panel scoreboard-card">
      <div class="header">
        <h2 class="title neon-text">Global Leaderboard</h2>
        <p class="subtitle">Top 10 players with the highest total scores</p>
      </div>

      <div class="tabs-container">
        <button
          v-for="tab in ['easy', 'medium', 'hard']"
          :key="tab"
          class="tab-btn"
          :class="{ active: selectedTab === tab }"
          @click="selectedTab = tab"
        >
          {{ tab.charAt(0).toUpperCase() + tab.slice(1) }}
        </button>
      </div>

      <div v-if="loading" class="state-message">
        <div class="loader"></div>
        <p>Loading legends...</p>
      </div>

      <div v-else-if="scores.length === 0" class="state-message">
        <p>The arena is empty. Be the first to set a record!</p>
      </div>

      <div v-else class="table-container">
        <table class="score-table">
          <thead>
            <tr>
              <th width="20%">Rank</th>
              <th width="50%">Player</th>
              <th width="30%">Total Points</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(score, index) in scores" :key="index" class="score-row">
              <td class="rank">
                <span class="rank-badge" :class="'rank-' + (index + 1)">#{{ index + 1 }}</span>
              </td>
              <td class="player-name">{{ score.username || 'Anonymous' }}</td>
              <td class="streak-col">
                <span class="streak-value neon-text">{{ score.total_points || 0 }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scoreboard-wrapper {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 1rem 0;
}

.scoreboard-card {
  width: 100%;
  max-width: 600px;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  color: #fff;
}

.neon-text {
  text-shadow: 0 0 10px rgba(0, 242, 254, 0.5);
}

.subtitle {
  color: #a0a0b8;
  font-size: 0.95rem;
}

.state-message {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  color: #a0a0b8;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: #00f2fe;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.table-container {
  overflow-x: auto;
}

.score-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.5rem;
  text-align: left;
}

.score-table th {
  padding: 0 1rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: #6c6c8c;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.score-row td {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.03);
}

.score-row td:first-child {
  border-top-left-radius: 8px;
  border-bottom-left-radius: 8px;
}
.score-row td:last-child {
  border-top-right-radius: 8px;
  border-bottom-right-radius: 8px;
}

.rank-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.1);
  font-weight: 800;
}

.rank-1 {
  background: linear-gradient(135deg, #f6d365, #fda085);
  color: #000;
}
.rank-2 {
  background: linear-gradient(135deg, #e0c3fc, #8ec5fc);
  color: #000;
}
.rank-3 {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #000;
}

.player-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #fff;
}
.streak-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #00f2fe;
}
.tabs-container {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.tab-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.5rem;
  border-radius: 30px;
  color: #a0a0b8;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.tab-btn.active {
  background: linear-gradient(45deg, #00f2fe, #4facfe);
  color: white;
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(0, 242, 254, 0.3);
}
</style>
