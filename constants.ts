
export const GRID_SIZE = 20;

export const SPEEDS = {
  SLOW: {
    START: 400,
    MIN: 250,
    INCREMENT: 0.5
  },
  EASY: {
    START: 200,
    MIN: 100,
    INCREMENT: 1
  },
  HARD: {
    START: 85,
    MIN: 40,
    INCREMENT: 2
  }
};

export const SCORE_INCREMENT = 10;

export const COLORS = {
  snakeHead: '#22c55e', // Bold green
  snakeBody: '#16a34a', // Darker green
  food: '#db2777',      // Bold pink/magenta
  grid: 'rgba(15, 23, 42, 0.05)',
  neon: '#0891b2',      // Deep cyan for light mode
};
