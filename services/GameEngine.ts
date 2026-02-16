import { COLS, ROWS, SHAPES, COLORS } from '../constants';
import { GameStatus, Grid, Tetromino, TetrominoType } from '../types';

export class GameEngine {
  grid: Grid;
  activePiece: Tetromino | null = null;
  nextPieceType: TetrominoType;
  score: number = 0;
  lines: number = 0;
  level: number = 1;
  status: GameStatus = GameStatus.IDLE;
  
  private _eventCallback: (event: string, payload?: any) => void;

  constructor(eventCallback: (event: string, payload?: any) => void) {
    this._eventCallback = eventCallback;
    this.grid = this.createEmptyGrid();
    this.nextPieceType = this.randomType();
  }

  private createEmptyGrid(): Grid {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  }

  private randomType(): TetrominoType {
    const types = Object.values(TetrominoType);
    return types[Math.floor(Math.random() * types.length)];
  }

  start() {
    this.grid = this.createEmptyGrid();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.status = GameStatus.PLAYING;
    this.spawnPiece();
  }

  spawnPiece() {
    const type = this.nextPieceType;
    this.nextPieceType = this.randomType();
    
    this.activePiece = {
      type,
      shape: SHAPES[type],
      pos: { x: Math.floor(COLS / 2) - Math.ceil(SHAPES[type][0].length / 2), y: 0 },
      color: COLORS[type],
    };

    // Immediate collision check (Game Over)
    if (this.checkCollision(this.activePiece.pos.x, this.activePiece.pos.y, this.activePiece.shape)) {
      this.status = GameStatus.GAME_OVER;
      this._eventCallback('GAME_OVER');
    }
  }

  move(dx: number, dy: number): boolean {
    if (!this.activePiece || this.status !== GameStatus.PLAYING) return false;

    const newX = this.activePiece.pos.x + dx;
    const newY = this.activePiece.pos.y + dy;

    if (!this.checkCollision(newX, newY, this.activePiece.shape)) {
      this.activePiece.pos.x = newX;
      this.activePiece.pos.y = newY;
      return true;
    }

    // If moving down failed, lock piece
    if (dy > 0) {
      this.lockPiece();
    }
    return false;
  }

  rotate() {
    if (!this.activePiece || this.status !== GameStatus.PLAYING) return;

    const originalShape = this.activePiece.shape;
    const N = originalShape.length;
    const rotated = originalShape[0].map((val, index) => originalShape.map(row => row[index]).reverse());

    // Basic Wall Kick (Center -> Left -> Right)
    const kicks = [0, -1, 1, -2, 2];
    
    for (const kick of kicks) {
      if (!this.checkCollision(this.activePiece.pos.x + kick, this.activePiece.pos.y, rotated)) {
        this.activePiece.pos.x += kick;
        this.activePiece.shape = rotated;
        return;
      }
    }
  }

  hardDrop() {
    if (!this.activePiece || this.status !== GameStatus.PLAYING) return;
    while (this.move(0, 1)) {
      this.score += 2; // Hard drop bonus
    }
  }

  private checkCollision(x: number, y: number, shape: number[][]): boolean {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const boardX = x + col;
          const boardY = y + row;

          // Boundaries
          if (boardX < 0 || boardX >= COLS || boardY >= ROWS) return true;
          
          // Existing Blocks (grid contains numbers > 0 for occupied)
          // boardY < 0 means it's above the board, which is allowed for spawning usually, but we check valid y
          if (boardY >= 0 && this.grid[boardY][boardX] !== 0) return true;
        }
      }
    }
    return false;
  }

  private lockPiece() {
    if (!this.activePiece) return;

    // Map TetrominoType to an integer ID (1-7)
    const typeIndex = Object.values(TetrominoType).indexOf(this.activePiece.type) + 1;

    for (let row = 0; row < this.activePiece.shape.length; row++) {
      for (let col = 0; col < this.activePiece.shape[row].length; col++) {
        if (this.activePiece.shape[row][col] !== 0) {
          const boardY = this.activePiece.pos.y + row;
          const boardX = this.activePiece.pos.x + col;
          if (boardY >= 0 && boardY < ROWS) {
            this.grid[boardY][boardX] = typeIndex;
          }
        }
      }
    }

    this.clearLines();
    this.spawnPiece();
  }

  private clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
      if (this.grid[row].every(cell => cell !== 0)) {
        this.grid.splice(row, 1);
        this.grid.unshift(Array(COLS).fill(0));
        linesCleared++;
        row++; // Check same row index again as lines shifted down
      }
    }

    if (linesCleared > 0) {
      this.lines += linesCleared;
      
      // Classic Scoring
      const points = [0, 40, 100, 300, 1200];
      this.score += points[linesCleared] * this.level;
      
      this.level = Math.floor(this.lines / 10) + 1;

      // Event for AI
      if (linesCleared >= 4) {
        this._eventCallback('TETRIS');
      } else {
        this._eventCallback('LINE_CLEAR', { count: linesCleared });
      }
    }
  }

  // Simplified snapshot for AI
  getBoardSnapshot(): string {
    return this.grid.map(row => row.map(cell => (cell > 0 ? 'X' : '.')).join('')).join('\n');
  }
}
