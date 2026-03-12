/**
 * Main — Entry point.
 *
 * Manages the start screen and game-over screen overlays.
 * The game doesn't auto-start — player presses Enter to begin.
 */
import { game } from './game.js';
import { STATE } from './config.js';

const canvas = document.getElementById('game-canvas');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const finalScoreEl = document.getElementById('final-score-value');

// Score panel elements
const panelScore = document.getElementById('panel-score');
const panelHighScore = document.getElementById('panel-high-score');
const panelLevel = document.getElementById('panel-level');
const panelLives = document.getElementById('panel-lives');
const panelDots = document.getElementById('panel-dots');

if (!canvas) {
  throw new Error('Canvas element #game-canvas not found');
}

let gameInitialized = false;

// Prevent arrow key / space scrolling globally
window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
});

// Update score panel on every render frame
game.onDraw = () => {
  if (panelScore) panelScore.textContent = game.score;
  if (panelHighScore) panelHighScore.textContent = game.hud?.highScore || 0;
  if (panelLevel) panelLevel.textContent = game.level;
  if (panelDots) panelDots.textContent = game.dotsRemaining;

  if (panelLives) {
    const livesToShow = Math.max(0, game.lives - 1);
    const currentIcons = panelLives.children.length;
    if (currentIcons !== livesToShow) {
      panelLives.innerHTML = '';
      for (let i = 0; i < livesToShow; i++) {
        const icon = document.createElement('span');
        icon.className = 'life-icon';
        panelLives.appendChild(icon);
      }
    }
  }
};

// Listen for state changes to show game-over overlay
game.onStateChange = (newState) => {
  if (newState === STATE.GAME_OVER) {
    finalScoreEl.textContent = game.score;
    gameOverScreen.classList.remove('hidden');
  }
};

// Handle Enter key for screen transitions
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  // Start screen → begin game
  if (startScreen && !startScreen.classList.contains('hidden')) {
    startScreen.classList.add('hidden');
    if (!gameInitialized) {
      game.init(canvas);
      gameInitialized = true;
    }
    return;
  }

  // Game over screen → restart
  if (gameOverScreen && !gameOverScreen.classList.contains('hidden')) {
    gameOverScreen.classList.add('hidden');
    game.restart();
  }
});
