
import React, { useRef, useEffect } from 'react';
import { Point, GameStatus } from '../types';
import { GRID_SIZE, COLORS } from '../constants';

interface SnakeCanvasProps {
  snake: Point[];
  food: Point;
  status: GameStatus;
}

const SnakeCanvas: React.FC<SnakeCanvasProps> = ({ snake, food, status }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear canvas - Solid Dark Foundation
    ctx.fillStyle = '#0d0e15';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Subtle Grid
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw Food - Solid Crisp Magenta
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 3,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw Snake - Crisp Solid Blocks
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      const x = part.x * cellSize;
      const y = part.y * cellSize;
      
      // Rectangles for solid snake parts - slightly rounded for tech feel
      const padding = 1.5;
      const size = cellSize - padding * 2;
      
      // Use fillRect for the "solid" look requested
      ctx.fillRect(x + padding, y + padding, size, size);

      // Eye for the head
      if (index === 0) {
        ctx.fillStyle = '#000';
        const eyeSize = 2;
        ctx.fillRect(x + cellSize/2 - eyeSize/2, y + cellSize/2 - eyeSize/2, eyeSize, eyeSize);
      }
    });

  }, [snake, food, status]);

  return (
    <div className="relative p-3 bg-[#161824] rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 scanlines group">
      <div className="scanline-bar"></div>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="block max-w-full h-auto rounded-md relative z-10"
      />
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00f3ff]/40 rounded-tl-xl pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00f3ff]/40 rounded-tr-xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00f3ff]/40 rounded-bl-xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00f3ff]/40 rounded-br-xl pointer-events-none"></div>
    </div>
  );
};

export default SnakeCanvas;
