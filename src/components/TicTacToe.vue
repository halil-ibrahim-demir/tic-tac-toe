<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabaseClient'

const board = ref(Array(9).fill(null))
const isGameActive = ref(true)
const winner = ref(null)
const currentPlayer = ref('X') // X: Oyuncu, O: Yapay Zeka
const difficulty = ref('Hard') // 'Easy', 'Medium', 'Hard'
const leaderboard = ref([])

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
]

// Supabase Entegrasyonu - Liderlik tablosu çekme
const fetchLeaderboard = async () => {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Liderlik tablosu çekilirken hata:', error)
  } else if (data) {
    leaderboard.value = data
  }
}

onMounted(() => {
  fetchLeaderboard()
})

// Supabase Entegrasyonu - Skor kaydetme
const saveScore = async (resultCode) => {
  let finalScore = 0
  if (resultCode === 'X') finalScore = 10
  else if (resultCode === 'O' || resultCode === 'Forfeit') finalScore = -10
  else if (resultCode === 'Draw') finalScore = 5

  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data?.user) {
    console.warn('Oturum açmış kullanıcı bulunamadı, skor kaydedilmiyor.')
    return
  }

  const user = data.user
  const uname = user.user_metadata?.username || user.email?.split('@')[0] || 'Oyuncu'

  const { error } = await supabase.from('leaderboard').insert([
    {
      user_id: user.id,
      username: uname,
      score: finalScore,
      difficulty: difficulty.value,
    },
  ])

  if (error) {
    console.error('Skor kaydedilirken hata:', error)
  } else {
    fetchLeaderboard() // Güncel tabloyu çek
  }
}

const checkWinner = (currentBoard = board.value) => {
  for (const [a, b, c] of winningCombinations) {
    if (
      currentBoard[a] &&
      currentBoard[a] === currentBoard[b] &&
      currentBoard[a] === currentBoard[c]
    ) {
      return currentBoard[a]
    }
  }
  if (!currentBoard.includes(null)) return 'Draw'
  return null
}

const triggerEndGame = (resultCode) => {
  winner.value = resultCode
  isGameActive.value = false
  saveScore(resultCode === 'Draw' ? 'Draw' : resultCode)
}

const forfeitGame = () => {
  if (isGameActive.value) {
    triggerEndGame('Forfeit')
  }
}

const resetGame = () => {
  board.value = Array(9).fill(null)
  isGameActive.value = true
  winner.value = null
  currentPlayer.value = 'X'
}

const getAvailableMoves = (currentBoard) => {
  return currentBoard.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null)
}

const getEasyMove = () => {
  const availableMoves = getAvailableMoves(board.value)
  const randomIndex = Math.floor(Math.random() * availableMoves.length)
  return availableMoves[randomIndex]
}

const getMediumMove = () => {
  const currentBoard = board.value
  const availableMoves = getAvailableMoves(currentBoard)

  for (let move of availableMoves) {
    currentBoard[move] = 'O'
    if (checkWinner(currentBoard) === 'O') {
      currentBoard[move] = null
      return move
    }
    currentBoard[move] = null
  }

  for (let move of availableMoves) {
    currentBoard[move] = 'X'
    if (checkWinner(currentBoard) === 'X') {
      currentBoard[move] = null
      return move
    }
    currentBoard[move] = null
  }

  return getEasyMove()
}

const minimax = (newBoard, player) => {
  const availSpots = getAvailableMoves(newBoard)
  const result = checkWinner(newBoard)

  if (result === 'X') return { score: -10 }
  if (result === 'O') return { score: 10 }
  if (availSpots.length === 0) return { score: 0 }

  const moves = []

  for (let i = 0; i < availSpots.length; i++) {
    const move = {}
    move.index = availSpots[i]
    newBoard[availSpots[i]] = player

    if (player === 'O') {
      const best = minimax(newBoard, 'X')
      move.score = best.score
    } else {
      const best = minimax(newBoard, 'O')
      move.score = best.score
    }

    newBoard[availSpots[i]] = null
    moves.push(move)
  }

  let bestMove
  if (player === 'O') {
    let bestScore = -Infinity
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score
        bestMove = i
      }
    }
  } else {
    let bestScore = Infinity
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score
        bestMove = i
      }
    }
  }

  return moves[bestMove]
}

const getHardMove = () => {
  const bestSpot = minimax([...board.value], 'O')
  return bestSpot.index
}

const makeAiMove = () => {
  if (!isGameActive.value) return

  let moveIndex
  if (difficulty.value === 'Easy') {
    moveIndex = getEasyMove()
  } else if (difficulty.value === 'Medium') {
    moveIndex = getMediumMove()
  } else {
    moveIndex = getHardMove()
  }

  if (moveIndex !== null && moveIndex !== undefined) {
    board.value[moveIndex] = 'O'
    const gameResult = checkWinner()

    if (gameResult) {
      triggerEndGame(gameResult)
    } else {
      currentPlayer.value = 'X'
    }
  }
}

const makeMove = (index) => {
  if (!isGameActive.value || board.value[index] !== null || currentPlayer.value !== 'X') return

  board.value[index] = 'X'
  let gameResult = checkWinner()

  if (gameResult) {
    triggerEndGame(gameResult)
    return
  }

  currentPlayer.value = 'O'

  setTimeout(() => {
    makeAiMove()
  }, 200)
}
</script>

<template>
  <div class="tic-tac-toe-container">
    <div class="tic-tac-toe">
      <h2>Tic-Tac-Toe</h2>

      <div class="controls">
        <label for="difficulty">Zorluk Seviyesi:</label>
        <select id="difficulty" v-model="difficulty" @change="resetGame">
          <option value="Easy">Kolay (Easy)</option>
          <option value="Medium">Orta (Medium)</option>
          <option value="Hard">Zor (Hard - Minimax)</option>
        </select>
        <button
          v-if="isGameActive && board.some((x) => x !== null)"
          @click="forfeitGame"
          class="forfeit-btn"
        >
          Çekil (Forfeit)
        </button>
      </div>

      <div class="board">
        <div
          v-for="(cell, index) in board"
          :key="index"
          class="cell"
          :class="{ x: cell === 'X', o: cell === 'O' }"
          @click="makeMove(index)"
        >
          {{ cell }}
        </div>
      </div>

      <div class="status">
        <p v-if="winner && winner !== 'Draw' && winner !== 'Forfeit'">Kazanan: {{ winner }}!</p>
        <p v-else-if="winner === 'Draw'">Beraberlik!</p>
        <p v-else-if="winner === 'Forfeit'">Çekildiniz. Yenildiniz!</p>
        <p v-else>Sıra: {{ currentPlayer }}</p>

        <button @click="resetGame" class="restart-btn">Yeniden Başlat</button>
      </div>
    </div>

    <div class="leaderboard-section">
      <h3>👑 Liderlik Tablosu (Top 10)</h3>
      <table v-if="leaderboard.length" class="leaderboard-table">
        <thead>
          <tr>
            <th>Oyuncu</th>
            <th>Zorluk</th>
            <th>Skor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="entry in leaderboard" :key="entry.id">
            <td>{{ entry.username }}</td>
            <td>{{ entry.difficulty }}</td>
            <td>{{ entry.score }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else>Henüz skor kaydedilmedi.</p>
    </div>
  </div>
</template>

<style scoped>
.tic-tac-toe-container {
  display: flex;
  gap: 50px;
  justify-content: center;
  align-items: flex-start;
  margin-top: 50px;
  font-family: Arial, sans-serif;
}

.tic-tac-toe {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.controls {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}

select {
  padding: 5px;
  font-size: 1rem;
}

.forfeit-btn {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 100px);
  grid-auto-rows: 100px;
  gap: 5px;
  background-color: #333;
  padding: 5px;
  border-radius: 5px;
}

.cell {
  background-color: #fff;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 3rem;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
}

.cell:hover {
  background-color: #f0f0f0;
}

.cell.x {
  color: #e74c3c;
}

.cell.o {
  color: #3498db;
}

.status {
  margin-top: 20px;
  text-align: center;
  height: 80px;
}

.status p {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 10px 0;
}

.restart-btn {
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 5px;
}

.leaderboard-section {
  background: #f9f9f9;
  padding: 20px;
  border-radius: 10px;
  min-width: 300px;
}

.leaderboard-table {
  width: 100%;
  border-collapse: collapse;
}

.leaderboard-table th,
.leaderboard-table td {
  padding: 8px;
  border-bottom: 1px solid #ddd;
  text-align: left;
}
</style>
