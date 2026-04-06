<script setup>
import { ref } from 'vue'
import { supabase } from '../supabaseClient'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const board = ref(Array(9).fill(null))
const isPlayerTurn = ref(true)
const winner = ref(null) // 'X', 'O', 'Draw', null
const winningLine = ref([])
const difficulty = ref('easy')
const streak = ref(0)
const isGameOver = ref(false)
const scoreSaved = ref(false)
const isSaving = ref(false)

const winPatterns = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diags
]

function checkWinner(squares) {
  for (let i = 0; i < winPatterns.length; i++) {
    const [a, b, c] = winPatterns[i]
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line: [a, b, c] }
    }
  }
  if (!squares.includes(null)) {
    return { winner: 'Draw', line: [] }
  }
  return null
}

function handleGameOver(result) {
  isGameOver.value = true
  if (result.winner === 'X') {
    streak.value++
  }
}

async function saveScore() {
  if (!authStore.user || streak.value === 0) return
  isSaving.value = true
  try {
    const currentPoints = authStore.profile?.total_points || 0
    const newTotal = currentPoints + streak.value

    const diffColumn = `points_${difficulty.value}`
    const currentDiffPoints = authStore.profile?.[diffColumn] || 0
    const newDiffTotal = currentDiffPoints + streak.value

    const { error } = await supabase
      .from('profiles')
      .update({ total_points: newTotal, [diffColumn]: newDiffTotal })
      .eq('id', authStore.user.id)

    if (error) throw error

    // Profil objemizi de güncelleyelim
    if (authStore.profile) {
      authStore.profile.total_points = newTotal
      authStore.profile[diffColumn] = newDiffTotal
    }

    scoreSaved.value = true
  } catch (error) {
    console.error('Error saving score:', error)
  } finally {
    isSaving.value = false
  }
}

function resetGame() {
  if (winner.value === 'O' || winner.value === 'Draw') {
    streak.value = 0
  }
  board.value = Array(9).fill(null)
  winner.value = null
  winningLine.value = []
  isGameOver.value = false
  isPlayerTurn.value = true
  scoreSaved.value = false
}

function resign() {
  if (isGameOver.value || board.value.every((v) => v === null)) return
  winner.value = 'O'
  winningLine.value = []
  handleGameOver({ winner: 'O', line: [] })
}

function makeMove(index) {
  if (board.value[index] || isGameOver.value || !isPlayerTurn.value) return

  board.value[index] = 'X'
  const result = checkWinner(board.value)
  if (result) {
    winner.value = result.winner
    winningLine.value = result.line
    handleGameOver(result)
    return
  }

  isPlayerTurn.value = false
  setTimeout(botMove, 500)
}

function getAvailableMoves(squares) {
  return squares.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null)
}

function randomMove(available) {
  return available[Math.floor(Math.random() * available.length)]
}

function getWinningMove(squares, player) {
  for (let i = 0; i < winPatterns.length; i++) {
    const [a, b, c] = winPatterns[i]
    const line = [squares[a], squares[b], squares[c]]
    const playerCount = line.filter((v) => v === player).length
    const emptyCount = line.filter((v) => v === null).length
    if (playerCount === 2 && emptyCount === 1) {
      return [a, b, c].find((idx) => squares[idx] === null)
    }
  }
  return null
}

function minimax(newBoard, player, depth = 0) {
  const availSpots = getAvailableMoves(newBoard)
  const result = checkWinner(newBoard)

  if (result?.winner === 'X') return { score: -10 + depth }
  if (result?.winner === 'O') return { score: 10 - depth }
  if (availSpots.length === 0) return { score: 0 }

  const moves = []
  for (let i = 0; i < availSpots.length; i++) {
    const move = {}
    move.index = availSpots[i]
    newBoard[availSpots[i]] = player

    if (player === 'O') {
      const g = minimax(newBoard, 'X', depth + 1)
      move.score = g.score
    } else {
      const g = minimax(newBoard, 'O', depth + 1)
      move.score = g.score
    }

    newBoard[availSpots[i]] = null
    moves.push(move)
  }

  let bestMove
  if (player === 'O') {
    let bestScore = -10000
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score > bestScore) {
        bestScore = moves[i].score
        bestMove = i
      }
    }
  } else {
    let bestScore = 10000
    for (let i = 0; i < moves.length; i++) {
      if (moves[i].score < bestScore) {
        bestScore = moves[i].score
        bestMove = i
      }
    }
  }
  return moves[bestMove]
}

function botMove() {
  if (isGameOver.value) return

  const available = getAvailableMoves(board.value)
  let moveIdx = -1

  if (difficulty.value === 'easy') {
    moveIdx = randomMove(available)
  } else if (difficulty.value === 'medium') {
    let winMove = getWinningMove(board.value, 'O')
    if (winMove !== null) {
      moveIdx = winMove
    } else {
      let blockMove = getWinningMove(board.value, 'X')
      if (blockMove !== null) {
        moveIdx = blockMove
      } else {
        moveIdx = randomMove(available)
      }
    }
  } else if (difficulty.value === 'hard') {
    if (available.length === 9) {
      const cornersAndCenter = [0, 2, 4, 6, 8]
      moveIdx = cornersAndCenter[Math.floor(Math.random() * cornersAndCenter.length)]
    } else {
      const best = minimax([...board.value], 'O')
      moveIdx = best.index
    }
  }

  if (moveIdx !== -1) {
    board.value[moveIdx] = 'O'
    const result = checkWinner(board.value)
    if (result) {
      winner.value = result.winner
      winningLine.value = result.line
      handleGameOver(result)
    } else {
      isPlayerTurn.value = true
    }
  }
}
</script>

<template>
  <div class="game-wrapper">
    <div class="glass-panel game-card">
      <div class="game-header">
        <div class="difficulty-selector">
          <label>Difficulty</label>
          <select v-model="difficulty" :disabled="streak > 0 && !isGameOver" class="custom-select">
            <option value="easy">Easy (Random)</option>
            <option value="medium">Medium (Blocker)</option>
            <option value="hard">Hard (Unbeatable)</option>
          </select>
        </div>

        <div class="streak-box">
          <span class="streak-label">Win Streak</span>
          <span class="streak-value neon-text">{{ streak }}</span>
        </div>
      </div>

      <div class="board-container">
        <div class="board">
          <div
            v-for="(cell, idx) in board"
            :key="idx"
            class="cell"
            :class="{
              'x-mark': cell === 'X',
              'o-mark': cell === 'O',
              'winning-cell': winningLine.includes(idx),
            }"
            @click="makeMove(idx)"
          >
            {{ cell }}
          </div>
        </div>

        <div class="action-buttons" v-if="!isGameOver && board.some((c) => c !== null)">
          <button @click="resign" class="resign-btn">Çekil (Resign)</button>
        </div>

        <!-- Game Over Overlay -->
        <transition name="fade">
          <div class="game-over-overlay glass-panel" v-if="isGameOver">
            <div class="result-content">
              <h2 v-if="winner === 'X'" class="win-text neon-text">VICTORY</h2>
              <h2 v-else-if="winner === 'O'" class="loss-text">DEFEAT</h2>
              <h2 v-else class="draw-text">DRAW</h2>

              <p v-if="winner === 'X'" class="result-sub">Streak continues!</p>
              <p v-else-if="streak > 0" class="result-sub">
                Final Streak: {{ streak }}. Ready to save?
              </p>
              <p v-else class="result-sub">Better luck next time!</p>

              <div class="btn-group">
                <!-- If Won: just next round -->
                <button v-if="winner === 'X'" @click="resetGame" class="gradient-btn play-again">
                  Next Round
                </button>

                <!-- If Lost/Tie: Show save button & Play again -->
                <template v-else>
                  <button
                    v-if="streak > 0 && !scoreSaved"
                    @click="saveScore"
                    class="gradient-btn save-btn"
                    :disabled="isSaving"
                  >
                    {{ isSaving ? 'Kaydediliyor...' : 'Skoru Kaydet' }}
                  </button>
                  <div v-else-if="scoreSaved" class="success-text">🏆 Skor Kaydedildi!</div>

                  <button @click="resetGame" class="gradient-btn play-again">Play Again</button>
                </template>
              </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
}

.game-card {
  width: 100%;
  max-width: 500px;
  padding: 2.5rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.difficulty-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.difficulty-selector label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #c8c8e0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.custom-select {
  padding: 0.8rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #fff;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  appearance: none;
}

.custom-select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.custom-select option {
  background: #1a1a2e;
  color: #fff;
}

.streak-box {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.streak-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #c8c8e0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.streak-value {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.board-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px;
  border-radius: 12px;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.cell {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 4rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.cell:hover:empty {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.winning-cell {
  background: rgba(0, 242, 254, 0.15) !important;
  border-color: #00f2fe !important;
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.3) !important;
}

.x-mark {
  color: #00f2fe;
  text-shadow: 0 0 20px rgba(0, 242, 254, 0.5);
}

.o-mark {
  color: #ff007f;
  text-shadow: 0 0 20px rgba(255, 0, 127, 0.5);
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  background: rgba(15, 12, 41, 0.85) !important;
  box-shadow: none;
}

.result-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.result-content h2 {
  font-size: 3rem;
  font-weight: 800;
  letter-spacing: 2px;
}

.loss-text {
  color: #ff4b4b;
  text-shadow: 0 0 20px rgba(255, 75, 75, 0.5);
}

.draw-text {
  color: #f1c40f;
  text-shadow: 0 0 20px rgba(241, 196, 15, 0.5);
}

.result-sub {
  font-size: 1.1rem;
  color: #c8c8e0;
  margin-bottom: 0.5rem;
}

.btn-group {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1rem;
}

.play-again {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.save-btn {
  background: linear-gradient(45deg, #ff007f, #ff8c00);
  box-shadow: 0 4px 15px rgba(255, 0, 127, 0.3);
  padding: 1rem 2rem;
  font-size: 1.1rem;
  border-radius: 30px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 0, 127, 0.5);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.success-text {
  color: #4caf50;
  font-weight: bold;
  font-size: 1.1rem;
  text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
}

.action-buttons {
  position: absolute;
  bottom: -60px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
}

.resign-btn {
  background: rgba(255, 75, 75, 0.1);
  color: #ff4b4b;
  border: 1px solid rgba(255, 75, 75, 0.3);
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.resign-btn:hover {
  background: rgba(255, 75, 75, 0.3);
  box-shadow: 0 0 15px rgba(255, 75, 75, 0.4);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 500px) {
  .cell {
    font-size: 3rem;
  }
}
</style>
