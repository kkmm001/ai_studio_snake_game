
export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export interface Point {
  x: number;
  y: number;
}

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

export enum Difficulty {
  EASY = 'EASY',
  HARD = 'HARD'
}

export interface ScoreRecord {
  id: string;
  score: number;
  difficulty: Difficulty;
  timestamp: number;
}

export interface GameState {
  snake: Point[];
  food: Point;
  direction: Direction;
  status: GameStatus;
  score: number;
  highScore: number;
  speed: number;
}

export interface OracleComment {
  text: string;
  type: 'snarky' | 'encouraging' | 'philosophical';
}
