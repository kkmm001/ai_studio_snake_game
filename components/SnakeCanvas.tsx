
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

    // Clear canvas - Solid Background
    ctx.fillStyle = '#1e2030';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
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

    // Draw Food - Solid Circle
    ctx.shadowBlur = 0; // Removing blur for solid look
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(
      food.x * cellSize + cellSize / 2,
      food.y * cellSize + cellSize / 2,
      cellSize / 2.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw Snake - Solid Blocks
    snake.forEach((part, index) => {
      ctx.fillStyle = index === 0 ? COLORS.snakeHead : COLORS.snakeBody;
      const x = part.x * cellSize;
      const y = part.y * cellSize;
      
      // Rectangles for solid snake parts
      ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

      // Eye for the head to show direction clearly
      if (index === 0) {
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + cellSize/2, y + cellSize/2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Game Over Overlay
    if (status === GameStatus.GAME_OVER) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = 'bold 24px Orbitron';
      ctx.fillStyle = '#ff0055';
      ctx.textAlign = 'center';
      ctx.fillText('CONNECTION LOST', canvas.width / 2, canvas.height / 2);
    }
  }, [snake, food, status]);

  return (
    <div className="relative p-2 bg-[#252839] rounded-lg shadow-xl border-4 border-[#2d3045]">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="block max-w-full h-auto rounded-sm"
      />
    </div>
  );
};

export default SnakeCanvas;
