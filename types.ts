export enum TetrominoType {
  I = 'I',
  J = 'J',
  L = 'L',
  O = 'O',
  S = 'S',
  T = 'T',
  Z = 'Z',
}

export type Grid = number[][]; // 0 = empty, 1-7 = color indices

export interface Position {
  x: number;
  y: number;
}

export interface Tetromino {
  type: TetrominoType;
  shape: number[][];
  pos: Position;
  color: string;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
}

export interface GameState {
  grid: Grid;
  activePiece: Tetromino | null;
  score: number;
  lines: number;
  level: number;
  status: GameStatus;
  nextPieceType: TetrominoType;
}

export interface AICommentary {
  text: string;
  mood: 'neutral' | 'sarcastic' | 'encouraging' | 'roasting';
}
