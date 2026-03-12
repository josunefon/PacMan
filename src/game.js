/**
 * Game — Core game loop and state machine.
 *
 * Architecture: Fixed-timestep update, variable-rate render.
 *  - update() runs at a consistent TICK_RATE (e.g., 60 Hz)
 *  - draw() runs every animationFrame (as fast as the monitor allows)
 *  - This prevents physics from depending on frame rate
 *
 * The Game class orchestrates everything but implements nothing:
 * it delegates to the maze, entities, renderer, and input modules.
 */
import {
  STATE, TICK_RATE, LIVES_START, SCORE_DOT, SCORE_POWER_PELLET,
  SCORE_GHOST, EXTRA_LIFE_SCORE, POWER_PELLET_DURATION, TILE,
  GHOST_SCATTER_DURATION, GHOST_CHASE_DURATION, GHOST_RELEASE_INTERVAL,
  GHOST_HOUSE_EXIT,
} from './config.js';
import { renderer } from './renderer.js';
import { input } from './input.js';
import { maze, LEVEL_1 } from './maze.js';
import { Pacman } from './entities/pacman.js';
import { Ghost } from './entities/ghost.js';
import { Hud } from './ui/hud.js';

class Game {
  constructor() {
    this._state = STATE.LOADING;
    this.onStateChange = null;
    this.onDraw = null;
    this.score = 0;
    this.lives = LIVES_START;
    this.level = 1;

    this.pacman = new Pacman();
    this.ghosts = [
      new Ghost('blinky', '#FF0000'),
      new Ghost('pinky',  '#FFB8FF'),
      new Ghost('inky',   '#00FFFF'),
      new Ghost('clyde',  '#FFB852'),
    ];

    this.hud = null;
    this._lastTime = 0;
    this._accumulator = 0;
    this._rafId = null;

    // Ghost mode cycling (scatter ↔ chase)
    this._modeTimer = 0;
    this._currentGhostMode = 'scatter';

    // Ghost releasing from house
    this._ghostReleaseTimer = 0;
    this._ghostsReleased = 1; // Blinky starts outside

    // Power pellet mode
    this._powerModeTimer = 0;
    this._powerModeActive = false;
    this._ghostEatChain = 0;

    // Extra life (awarded once per game)
    this._extraLifeAwarded = false;
  }

  get state() { return this._state; }

  set state(value) {
    const prev = this._state;
    this._state = value;
    if (this.onStateChange && prev !== value) {
      this.onStateChange(value, prev);
    }
  }

  /** Bootstrap the game: init systems, load level, start loop. */
  init(canvasEl) {
    renderer.init(canvasEl);
    this.hud = new Hud(renderer.ctx);
    input.bind();

    this._loadLevel();
    this.state = STATE.READY;

    // Show "READY!" briefly, then start playing
    setTimeout(() => {
      this.state = STATE.PLAYING;
    }, 2000);

    this._lastTime = performance.now();
    this._loop(this._lastTime);
  }

  /** Load level data, spawn entities, and reset timers. */
  _loadLevel() {
    maze.load(LEVEL_1);

    // Pac-Man spawn point (classic position: row 23, col 14)
    this.pacman.spawn(14, 23);

    // Ghost spawn points (in/near ghost house)
    this.ghosts[0].spawn(14, 11); // Blinky — above house
    this.ghosts[1].spawn(14, 14); // Pinky  — inside house
    this.ghosts[2].spawn(12, 14); // Inky   — inside house
    this.ghosts[3].spawn(16, 14); // Clyde  — inside house

    // Blinky starts outside; others in the ghost house
    this.ghosts[0].inGhostHouse = false;
    for (let i = 1; i < this.ghosts.length; i++) {
      this.ghosts[i].inGhostHouse = true;
    }

    // Reset timers and modes
    this._modeTimer = 0;
    this._currentGhostMode = 'scatter';
    this._ghostReleaseTimer = 0;
    this._ghostsReleased = 1;
    this._powerModeTimer = 0;
    this._powerModeActive = false;
    this._ghostEatChain = 0;

    for (const ghost of this.ghosts) {
      ghost.setMode('scatter');
    }
  }

  /**
   * Main loop — called every frame via requestAnimationFrame.
   * Uses a fixed-timestep accumulator for deterministic updates.
   */
  _loop = (timestamp) => {
    this._rafId = requestAnimationFrame(this._loop);

    const delta = timestamp - this._lastTime;
    this._lastTime = timestamp;
    this._accumulator += delta;

    // Fixed-timestep updates
    while (this._accumulator >= TICK_RATE) {
      this._update();
      this._accumulator -= TICK_RATE;
    }

    // Render
    this._draw();
  };

  /** Fixed-timestep game logic update. */
  _update() {
    if (this.state !== STATE.PLAYING) return;

    // Feed input to Pac-Man
    if (input.desiredDirection) {
      this.pacman.nextDirection = input.desiredDirection;
    }

    // Update entities (pass pacman + blinky ref for ghost targeting)
    this.pacman.update();
    for (const ghost of this.ghosts) {
      ghost.update(this.pacman, this.ghosts[0]);
    }

    // Timers
    this._updateGhostRelease();
    this._updateGhostModeCycle();
    this._updatePowerMode();
    this._updateEatenGhosts();

    // Interactions
    this._checkDotEating();
    this._checkGhostCollisions();
    this._checkExtraLife();

    // Win condition
    if (maze.isCleared()) {
      this._advanceLevel();
    }
  }

  /** Release ghosts from the house one at a time on a timer. */
  _updateGhostRelease() {
    if (this._ghostsReleased >= this.ghosts.length) return;

    this._ghostReleaseTimer += TICK_RATE;
    if (this._ghostReleaseTimer >= GHOST_RELEASE_INTERVAL) {
      this._ghostReleaseTimer = 0;
      const ghost = this.ghosts[this._ghostsReleased];
      ghost.inGhostHouse = false;
      // Teleport to exit — ghost house tiles aren't walkable,
      // so we place the ghost directly above the house gate
      const exitPos = maze.tileToPixel(GHOST_HOUSE_EXIT.col, GHOST_HOUSE_EXIT.row);
      ghost.x = exitPos.x;
      ghost.y = exitPos.y;
      this._ghostsReleased++;
    }
  }

  /** Alternate between scatter and chase modes on a timer. */
  _updateGhostModeCycle() {
    if (this._powerModeActive) return;

    this._modeTimer += TICK_RATE;
    const duration = this._currentGhostMode === 'scatter'
      ? GHOST_SCATTER_DURATION
      : GHOST_CHASE_DURATION;

    if (this._modeTimer >= duration) {
      this._modeTimer = 0;
      this._currentGhostMode =
        this._currentGhostMode === 'scatter' ? 'chase' : 'scatter';

      for (const ghost of this.ghosts) {
        if (ghost.mode !== 'frightened' && ghost.mode !== 'eaten') {
          ghost.setMode(this._currentGhostMode);
        }
      }
    }
  }

  /** Count down power mode; revert ghosts when it expires. */
  _updatePowerMode() {
    if (!this._powerModeActive) return;

    this._powerModeTimer -= TICK_RATE;
    if (this._powerModeTimer <= 0) {
      this._powerModeActive = false;
      this._ghostEatChain = 0;

      for (const ghost of this.ghosts) {
        if (ghost.mode === 'frightened') {
          ghost.recover(this._currentGhostMode);
        }
      }
    }
  }

  /** Check if eaten ghosts have reached the ghost house and respawn them. */
  _updateEatenGhosts() {
    for (const ghost of this.ghosts) {
      if (ghost.mode !== 'eaten') continue;
      const tile = ghost.getCurrentTile();
      if (tile.col === GHOST_HOUSE_EXIT.col && tile.row === GHOST_HOUSE_EXIT.row) {
        // Snap to exit tile center and recover
        const exitPos = maze.tileToPixel(GHOST_HOUSE_EXIT.col, GHOST_HOUSE_EXIT.row);
        ghost.x = exitPos.x;
        ghost.y = exitPos.y;
        ghost.recover(this._currentGhostMode);
      }
    }
  }

  /** Check if Pac-Man is on a dot and eat it. */
  _checkDotEating() {
    const tile = this.pacman.getCurrentTile();
    const tileType = maze.getTile(tile.col, tile.row);

    if (tileType === TILE.DOT) {
      maze.setTile(tile.col, tile.row, TILE.EMPTY);
      maze.dotsEaten++;
      this.score += SCORE_DOT;
    } else if (tileType === TILE.POWER_PELLET) {
      maze.setTile(tile.col, tile.row, TILE.EMPTY);
      maze.dotsEaten++;
      this.score += SCORE_POWER_PELLET;
      this._activatePowerMode();
    }
  }

  /** Power pellet eaten — frighten all non-eaten ghosts and start timer. */
  _activatePowerMode() {
    this._powerModeActive = true;
    this._powerModeTimer = POWER_PELLET_DURATION;
    this._ghostEatChain = 0;

    for (const ghost of this.ghosts) {
      if (ghost.mode !== 'eaten') {
        ghost.frighten();
      }
    }
  }

  /** Tile-based Pac-Man vs ghost collision check. */
  _checkGhostCollisions() {
    const pacTile = this.pacman.getCurrentTile();

    for (const ghost of this.ghosts) {
      if (ghost.mode === 'eaten') continue;

      const ghostTile = ghost.getCurrentTile();
      if (pacTile.col !== ghostTile.col || pacTile.row !== ghostTile.row) {
        continue;
      }

      if (ghost.mode === 'frightened') {
        ghost.eat();
        this._ghostEatChain++;
        this.score += SCORE_GHOST * Math.pow(2, this._ghostEatChain - 1);
      } else {
        this._pacmanDeath();
        return;
      }
    }
  }

  /** Handle Pac-Man death: lose a life or game over. */
  _pacmanDeath() {
    this.lives--;

    if (this.lives > 0) {
      this.state = STATE.DYING;

      setTimeout(() => {
        // Re-spawn all entities at starting positions
        this.pacman.spawn(14, 23);
        this.ghosts[0].spawn(14, 11);
        this.ghosts[1].spawn(14, 14);
        this.ghosts[2].spawn(12, 14);
        this.ghosts[3].spawn(16, 14);

        this.ghosts[0].inGhostHouse = false;
        for (let i = 1; i < this.ghosts.length; i++) {
          this.ghosts[i].inGhostHouse = true;
        }

        this._ghostsReleased = 1;
        this._ghostReleaseTimer = 0;
        this._modeTimer = 0;
        this._currentGhostMode = 'scatter';
        this._powerModeActive = false;
        this._powerModeTimer = 0;
        this._ghostEatChain = 0;

        for (const ghost of this.ghosts) {
          ghost.setMode('scatter');
        }

        this.state = STATE.READY;
        setTimeout(() => { this.state = STATE.PLAYING; }, 2000);
      }, 1500);
    } else {
      this.state = STATE.GAME_OVER;
    }
  }

  /** Award an extra life when score crosses the threshold (once per game). */
  _checkExtraLife() {
    if (!this._extraLifeAwarded && this.score >= EXTRA_LIFE_SCORE) {
      this._extraLifeAwarded = true;
      this.lives++;
    }
  }

  /** Level cleared — advance to next level after a brief pause. */
  _advanceLevel() {
    this.level++;
    this.state = STATE.WIN;

    setTimeout(() => {
      this._loadLevel();
      this.state = STATE.READY;
      setTimeout(() => { this.state = STATE.PLAYING; }, 2000);
    }, 2000);
  }

  /** Render the current frame. */
  _draw() {
    renderer.draw({
      pacman: this.pacman,
      ghosts: this.ghosts,
      powerModeTimer: this._powerModeTimer,
    });

    // HUD overlays
    this.hud.draw(this.score, this.lives, this.level);

    if (this.state === STATE.READY) {
      this.hud.drawReady();
    } else if (this.state === STATE.GAME_OVER) {
      this.hud.drawGameOver();
    }

    if (this.onDraw) this.onDraw();
  }

  /** Number of dots remaining in the current level. */
  get dotsRemaining() {
    return maze.totalDots - maze.dotsEaten;
  }

  /** Stop the game loop. */
  stop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }
    input.unbind();
  }

  /** Restart the game (called from game-over screen). */
  restart() {
    this.score = 0;
    this.lives = LIVES_START;
    this.level = 1;
    this._accumulator = 0;
    this._extraLifeAwarded = false;
    this._loadLevel();
    this.state = STATE.READY;
    setTimeout(() => { this.state = STATE.PLAYING; }, 2000);
    this._lastTime = performance.now();
  }
}

export const game = new Game();
