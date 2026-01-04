
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

    // Clear canvas - Solid Light Foundation
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Subtle Grid
    ctx.strokeStyle = COLORS.grid;
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
      
      const padding = 1.5;
      const size = cellSize - padding * 2;
      
      ctx.fillRect(x + padding, y + padding, size, size);

      // Eye for the head
      if (index === 0) {
        ctx.fillStyle = '#ffffff';
        const eyeSize = 3;
        ctx.fillRect(x + cellSize/2 - eyeSize/2, y + cellSize/2 - eyeSize/2, eyeSize, eyeSize);
      }
    });

  }, [snake, food, status]);

  return (
    <div className="relative p-1 bg-slate-200 rounded-lg industrial-border scanlines group transition-all duration-300">
      <div className="scanline-bar"></div>
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="block max-w-full h-auto rounded-sm relative z-10"
      />
      
      {/* Heavy Duty Status Indicators */}
      <div className="absolute top-[-25px] left-4 bg-[#0f172a] text-white text-[9px] font-bold px-3 py-1 uppercase tracking-[0.2em] rounded-t-md border-x-2 border-t-2 border-[#0f172a]">
        Video_Feed::Live
      </div>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-[#0891b2] pointer-events-none z-20"></div>
      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-[#0891b2] pointer-events-none z-20"></div>
      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-[#0891b2] pointer-events-none z-20"></div>
      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-[#0891b2] pointer-events-none z-20"></div>
    </div>
  );
};

export default SnakeCanvas;
