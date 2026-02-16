import React, { useRef, useEffect } from 'react';
import { TetrominoType } from '../types';
import { SHAPES, COLORS, BLOCK_SIZE } from '../constants';

interface Props {
  type: TetrominoType;
}

const NextPiece: React.FC<Props> = ({ type }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const shape = SHAPES[type];
    const color = COLORS[type];
    
    // Center logic
    const shapeW = shape[0].length * 20; // smaller block size for preview
    const shapeH = shape.length * 20;
    const offsetX = (canvas.width - shapeW) / 2;
    const offsetY = (canvas.height - shapeH) / 2;

    ctx.fillStyle = color;
    shape.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (cell) {
          ctx.fillRect(offsetX + c * 20, offsetY + r * 20, 18, 18);
        }
      });
    });

  }, [type]);

  return (
    <div className="flex flex-col items-center">
      <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">Next</h3>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="rounded border border-gray-700 bg-gray-800"
      />
    </div>
  );
};

export default NextPiece;
