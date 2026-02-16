import { TetrominoType } from './types';

export const COLS = 10;
export const ROWS = 20;
export const BLOCK_SIZE = 30;

export const COLORS: Record<TetrominoType, string> = {
  [TetrominoType.I]: '#00f0f0', // Cyan
  [TetrominoType.O]: '#f0f000', // Yellow
  [TetrominoType.T]: '#a000f0', // Purple
  [TetrominoType.S]: '#00f000', // Green
  [TetrominoType.Z]: '#f00000', // Red
  [TetrominoType.J]: '#0000f0', // Blue
  [TetrominoType.L]: '#f0a000', // Orange
};

export const SHAPES: Record<TetrominoType, number[][]> = {
  [TetrominoType.I]: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [TetrominoType.J]: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.L]: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.O]: [
    [1, 1],
    [1, 1],
  ],
  [TetrominoType.S]: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [TetrominoType.T]: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [TetrominoType.Z]: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
};

// Map number in grid to color. 0 is empty.
// We use the Type Enum keys order for indexing if needed, but simple mapping is safer.
export const COLOR_PALETTE = [
  '#111111', // 0: Empty (Background)
  '#00f0f0', // 1: I
  '#0000f0', // 2: J
  '#f0a000', // 3: L
  '#f0f000', // 4: O
  '#00f000', // 5: S
  '#a000f0', // 6: T
  '#f00000', // 7: Z
];
