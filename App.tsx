
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Direction, 
  Point, 
  GameStatus, 
  OracleComment,
  Difficulty,
  ScoreRecord
} from './types';
import { 
  GRID_SIZE, 
  SPEEDS, 
  SCORE_INCREMENT 
} from './constants';
import SnakeCanvas from './components/SnakeCanvas';
import OracleMessage from './components/OracleMessage';
import { getOracleCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('snake-high-score')) || 0);
  const [scoreHistory, setScoreHistory] = useState<ScoreRecord[]>(() => {
    const saved = localStorage.getItem('snake-score-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [speed, setSpeed] = useState(SPEEDS.EASY.START);
  const [oracleComment, setOracleComment] = useState<OracleComment | null>(null);
  const [oracleLoading, setOracleLoading] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const directionRef = useRef<Direction>(Direction.UP);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(part => part.x === newFood.x && part.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const saveToHistory = (finalScore: number) => {
    const newRecord: ScoreRecord = {
      id: Date.now().toString(),
      score: finalScore,
      difficulty: difficulty,
      timestamp: Date.now(),
    };
    const updatedHistory = [newRecord, ...scoreHistory].slice(0, 5);
    setScoreHistory(updatedHistory);
    localStorage.setItem('snake-score-history', JSON.stringify(updatedHistory));
  };

  const fetchOracle = async (event: 'death' | 'milestone' | 'start', currentScore: number) => {
    setOracleLoading(true);
    const comment = await getOracleCommentary(event, currentScore, highScore);
    setOracleComment(comment);
    setOracleLoading(false);
  };

  const gameOver = useCallback(() => {
    setStatus(GameStatus.GAME_OVER);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    
    saveToHistory(score);
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
    fetchOracle('death', score);
  }, [score, highScore, difficulty, scoreHistory]);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = { ...head };

      switch (directionRef.current) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        gameOver();
        return prevSnake;
      }

      if (prevSnake.some(part => part.x === newHead.x && part.y === newHead.y)) {
        gameOver();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => {
          const newScore = s + SCORE_INCREMENT;
          if (newScore % 100 === 0 && newScore > 0) {
            fetchOracle('milestone', newScore);
          }
          return newScore;
        });
        setFood(generateFood(newSnake));
        
        const config = SPEEDS[difficulty];
        setSpeed(prev => Math.max(config.MIN, prev - config.INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, generateFood, difficulty]);

  const startGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setDirection(Direction.UP);
    directionRef.current = Direction.UP;
    setScore(0);
    setStatus(GameStatus.PLAYING);
    setSpeed(SPEEDS[difficulty].START);
    setOracleComment(null);
    fetchOracle('start', 0);
  };

  const togglePause = () => {
    if (status === GameStatus.PLAYING) {
      setStatus(GameStatus.PAUSED);
    } else if (status === GameStatus.PAUSED) {
      setStatus(GameStatus.PLAYING);
    }
  };

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [status, speed, moveSnake]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          if (directionRef.current !== Direction.DOWN) {
            setDirection(Direction.UP);
            directionRef.current = Direction.UP;
          }
          break;
        case 'ArrowDown': case 's': case 'S':
          if (directionRef.current !== Direction.UP) {
            setDirection(Direction.DOWN);
            directionRef.current = Direction.DOWN;
          }
          break;
        case 'ArrowLeft': case 'a': case 'A':
          if (directionRef.current !== Direction.RIGHT) {
            setDirection(Direction.LEFT);
            directionRef.current = Direction.LEFT;
          }
          break;
        case 'ArrowRight': case 'd': case 'D':
          if (directionRef.current !== Direction.LEFT) {
            setDirection(Direction.RIGHT);
            directionRef.current = Direction.RIGHT;
          }
          break;
        case ' ':
          if (status === GameStatus.IDLE || status === GameStatus.GAME_OVER) startGame();
          else togglePause();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-[#00f3ff] selection:text-black">
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-6xl font-orbitron font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#39ff14] to-[#ff007f]">
          NEON SNAKE
        </h1>
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold tracking-[0.2em] text-[#00f3ff] opacity-60 uppercase">
          <span>AI Oracle Integrated</span>
          <div className="w-1 h-1 bg-[#00f3ff] rounded-full"></div>
          <span>Solid Vector v3.2</span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-6 items-start justify-center max-w-7xl w-full">
        {/* Left Side - Stats & History */}
        <section className="flex flex-col gap-4 w-full lg:w-64 order-2 lg:order-1">
          <div className="p-4 glass-panel rounded-xl">
            <p className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-widest">Global Best</p>
            <p className="text-2xl font-orbitron text-[#00f3ff]">{highScore}</p>
          </div>

          <div className="p-4 glass-panel rounded-xl overflow-hidden">
             <h3 className="text-xs uppercase font-bold text-[#ff007f] mb-3 tracking-widest">Session Log</h3>
             <div className="space-y-3 max-h-48 overflow-y-auto pr-2 text-left">
               {scoreHistory.length > 0 ? scoreHistory.map(record => (
                 <div key={record.id} className="flex flex-col border-b border-white/5 pb-2">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-lg font-orbitron text-white">{record.score}</span>
                     <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${record.difficulty === Difficulty.HARD ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                        {record.difficulty}
                     </span>
                   </div>
                   <span className="text-[9px] text-slate-500 uppercase">
                     {new Date(record.timestamp).toLocaleString()}
                   </span>
                 </div>
               )) : (
                 <p className="text-slate-600 text-[10px] italic">No data yet...</p>
               )}
             </div>
          </div>
        </section>

        {/* Center - Game Canvas */}
        <section className="flex flex-col items-center gap-6 order-1 lg:order-2">
          <div className="relative group">
            <SnakeCanvas snake={snake} food={food} status={status} />
            
            {status === GameStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-md z-10 transition-all duration-500 rounded-lg p-6">
                <h2 className="text-xl font-orbitron text-[#00f3ff] mb-8 tracking-[0.2em]">DIFFICULTY</h2>
                
                <div className="flex gap-4 mb-10 w-full">
                  <button 
                    onClick={() => setDifficulty(Difficulty.EASY)}
                    className={`flex-1 py-3 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 ${difficulty === Difficulty.EASY ? 'border-blue-400 bg-blue-400/20 text-blue-400' : 'border-slate-700 text-slate-500'}`}
                  >
                    EASY
                  </button>
                  <button 
                    onClick={() => setDifficulty(Difficulty.HARD)}
                    className={`flex-1 py-3 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 ${difficulty === Difficulty.HARD ? 'border-red-400 bg-red-400/20 text-red-400' : 'border-slate-700 text-slate-500'}`}
                  >
                    HARD
                  </button>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-[#39ff14] text-black font-orbitron font-bold text-lg hover:bg-white transition-all shadow-lg"
                >
                  START ENGINE
                </button>
              </div>
            )}

            {status === GameStatus.PAUSED && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10 rounded-lg">
                <h2 className="text-2xl font-orbitron text-[#00f3ff] mb-4">SUSPENDED</h2>
                <button 
                  onClick={togglePause}
                  className="px-10 py-3 bg-[#00f3ff] text-black font-bold uppercase hover:bg-white transition-all shadow-[0_0_15px_#00f3ff]"
                >
                  RESUME
                </button>
              </div>
            )}

            {status === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-10 rounded-lg p-6">
                <h2 className="text-2xl font-orbitron text-[#ff0055] mb-6 font-bold tracking-tighter uppercase">Connection Lost</h2>
                <div className="mb-8 text-center">
                  <p className="text-slate-400 text-[10px] uppercase mb-1">Captured Bits</p>
                  <p className="text-5xl font-orbitron text-white">{score}</p>
                </div>
                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-[#ff0055] text-white font-orbitron font-bold hover:bg-white hover:text-[#ff0055] transition-all"
                >
                  REBOOT
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col w-full gap-4">
            {/* Control Strip */}
            <div className="flex gap-4 w-full">
               {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
                 <button 
                   onClick={togglePause}
                   className={`flex-1 py-3 font-orbitron text-sm tracking-widest transition-all duration-300 border-2 rounded-lg ${status === GameStatus.PAUSED ? 'border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14] hover:text-black' : 'border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff] hover:text-black'}`}
                 >
                   {status === GameStatus.PAUSED ? 'RESUME SYSTEM' : 'PAUSE SYSTEM'}
                 </button>
               )}
            </div>

            <div className="flex gap-4">
              <div className="flex-1 flex flex-col items-center px-4 py-2 glass-panel rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Live Bits</span>
                <span className="text-2xl font-orbitron text-[#39ff14]">{score}</span>
              </div>
              <div className="flex-1 flex flex-col items-center px-4 py-2 glass-panel rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Rate</span>
                <span className="text-2xl font-orbitron text-white">{(1000/speed).toFixed(1)}Hz</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side - Oracle & Controls Info */}
        <section className="flex flex-col gap-6 w-full lg:w-80 order-3">
          <OracleMessage comment={oracleComment} loading={oracleLoading} />
          
          <div className="p-4 glass-panel rounded-xl">
             <h3 className="text-[10px] uppercase font-bold text-slate-400 mb-3 tracking-widest border-b border-white/5 pb-2">User Protocol</h3>
             <ul className="space-y-2 text-[13px] text-slate-300">
               <li className="flex justify-between">
                 <span className="text-slate-500">Navigation</span>
                 <span className="text-white font-medium italic">Arrows / WASD</span>
               </li>
               <li className="flex justify-between">
                 <span className="text-slate-500">Action Pause</span>
                 <span className="text-white font-medium italic">Space Bar</span>
               </li>
               <li className="flex justify-between pt-2">
                 <span className="text-slate-500 text-[10px]">Snake Color</span>
                 <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#39ff14]"></div>
                    <span className="text-[10px] uppercase">Solid Bio-link</span>
                 </div>
               </li>
               <li className="flex justify-between">
                 <span className="text-slate-500 text-[10px]">Point Color</span>
                 <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-[#ff007f]"></div>
                    <span className="text-[10px] uppercase">Solid Data-bit</span>
                 </div>
               </li>
             </ul>
          </div>
        </section>
      </main>

      <footer className="mt-auto py-6 text-slate-600 text-[9px] uppercase tracking-[0.4em]">
        SOLID STATE LOGIC &bull; BINARY CONSUMPTION ENGINE
      </footer>
    </div>
  );
};

export default App;
