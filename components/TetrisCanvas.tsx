import React, { useRef, useEffect } from 'react';
import { GameEngine } from '../services/GameEngine';
import { BLOCK_SIZE, COLS, ROWS, COLOR_PALETTE } from '../constants';
import { Tetromino } from '../types';

interface Props {
  gameEngine: GameEngine;
  lastUpdate: number; // Prop to force re-render
}

const TetrisCanvas: React.FC<Props> = ({ gameEngine, lastUpdate }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid
    gameEngine.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell > 0) {
          drawBlock(ctx, x, y, COLOR_PALETTE[cell]);
        }
      });
    });

    // Draw Active Piece
    const p = gameEngine.activePiece;
    if (p) {
      drawGhostPiece(ctx, gameEngine, p);
      p.shape.forEach((row, r) => {
        row.forEach((cell, c) => {
          if (cell !== 0) {
            drawBlock(ctx, p.pos.x + c, p.pos.y + r, p.color);
          }
        });
      });
    }

    // Draw Grid Lines (Subtle)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * BLOCK_SIZE, 0);
      ctx.lineTo(i * BLOCK_SIZE, ROWS * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * BLOCK_SIZE);
      ctx.lineTo(COLS * BLOCK_SIZE, i * BLOCK_SIZE);
      ctx.stroke();
    }

  }, [gameEngine, lastUpdate]);

  const drawBlock = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
    
    // Bevel effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, BLOCK_SIZE - 2, 4);
    ctx.fillRect(x * BLOCK_SIZE + 1, y * BLOCK_SIZE + 1, 4, BLOCK_SIZE - 2);
  };

  const drawGhostPiece = (ctx: CanvasRenderingContext2D, engine: GameEngine, piece: Tetromino) => {
    // Clone piece position
    let ghostY = piece.pos.y;
    while (true) {
      // Check collision if we move down 1
      let collision = false;
      for (let r = 0; r < piece.shape.length; r++) {
        for (let c = 0; c < piece.shape[r].length; c++) {
          if (piece.shape[r][c] !== 0) {
             const bx = piece.pos.x + c;
             const by = ghostY + r + 1;
             if (by >= ROWS || (by >= 0 && engine.grid[by][bx] !== 0)) {
               collision = true;
             }
          }
        }
      }
      if (collision) break;
      ghostY++;
    }

    // Draw Ghost
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    piece.shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell !== 0) {
           ctx.fillRect((piece.pos.x + c) * BLOCK_SIZE + 1, (ghostY + r) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
           ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
           ctx.strokeRect((piece.pos.x + c) * BLOCK_SIZE + 1, (ghostY + r) * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
        }
      });
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={COLS * BLOCK_SIZE}
      height={ROWS * BLOCK_SIZE}
      className="border-4 border-gray-700 bg-gray-900 shadow-2xl rounded-sm"
    />
  );
};

export default TetrisCanvas;
