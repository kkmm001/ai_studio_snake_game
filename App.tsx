
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
    if (status === GameStatus.PLAYING) setStatus(GameStatus.PAUSED);
    else if (status === GameStatus.PAUSED) setStatus(GameStatus.PLAYING);
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
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
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
  }, [status, difficulty]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 selection:bg-[#0f172a] selection:text-white font-rajdhani">
      <header className="mb-10 text-center">
        <h1 className="text-6xl md:text-7xl font-orbitron font-bold tracking-tighter mb-2 text-[#0f172a] drop-shadow-sm">
          NEON SNAKE
        </h1>
        <div className="flex items-center justify-center gap-4 text-[11px] font-bold tracking-[0.4em] text-slate-500 uppercase">
          <span>Light Interface Active</span>
          <div className="w-2 h-2 bg-[#0891b2] rounded-sm"></div>
          <span>Refined Vector v5.0</span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-10 items-start justify-center max-w-7xl w-full">
        
        {/* Left Side - Stats & History */}
        <section className="flex flex-col gap-6 w-full lg:w-72 order-2 lg:order-1">
          <div className="p-6 glass-panel rounded-2xl border-l-8 border-l-[#0891b2]">
            <p className="text-slate-400 text-[10px] uppercase font-bold mb-1 tracking-[0.2em]">Matrix Record</p>
            <p className="text-4xl font-orbitron text-[#0f172a]">{highScore}</p>
          </div>

          <div className="p-6 glass-panel rounded-2xl overflow-hidden border-t-4 border-t-pink-500">
             <h3 className="text-xs uppercase font-bold text-pink-600 mb-5 tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-600"></span>
                Terminal Logs
             </h3>
             <div className="space-y-5 max-h-[350px] overflow-y-auto pr-3 scrollbar-custom">
               {scoreHistory.length > 0 ? scoreHistory.map(record => (
                 <div key={record.id} className="flex flex-col group border-b border-slate-200 pb-4">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-2xl font-orbitron text-[#0f172a] group-hover:text-[#0891b2] transition-colors">{record.score}</span>
                     <span className={`text-[9px] px-2 py-0.5 rounded font-black tracking-tight uppercase ${record.difficulty === Difficulty.HARD ? 'bg-red-600 text-white' : record.difficulty === Difficulty.SLOW ? 'bg-green-600 text-white' : 'bg-[#0891b2] text-white'}`}>
                        {record.difficulty}
                     </span>
                   </div>
                   <span className="text-[10px] text-slate-400 font-mono tracking-tight uppercase">
                     {new Date(record.timestamp).toLocaleTimeString()}
                   </span>
                 </div>
               )) : (
                 <p className="text-slate-400 text-[11px] font-mono italic uppercase tracking-widest text-center py-6">Mission logs empty...</p>
               )}
             </div>
          </div>
        </section>

        {/* Center - Game Canvas */}
        <section className="flex flex-col items-center gap-8 order-1 lg:order-2 flex-grow max-w-[460px]">
          <div className="relative w-full">
            <SnakeCanvas snake={snake} food={food} status={status} />
            
            {/* Overlay: Initial Difficulty Select */}
            {status === GameStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl z-20 rounded-xl p-10 border-4 border-[#0f172a]">
                <div className="mb-10 text-center">
                  <h2 className="text-3xl font-orbitron text-[#0f172a] mb-2 tracking-[0.3em] font-bold">BOOT_MENU</h2>
                  <p className="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Configure Simulation Velocity</p>
                </div>
                
                <div className="flex flex-col gap-3 mb-10 w-full">
                  <button 
                    onClick={() => setDifficulty(Difficulty.SLOW)}
                    className={`w-full py-4 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 rounded-lg ${difficulty === Difficulty.SLOW ? 'border-green-600 bg-green-50 text-green-700 font-bold' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                  >
                    ZEN_SLOW.DRV
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setDifficulty(Difficulty.EASY)}
                      className={`flex-1 py-4 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 rounded-lg ${difficulty === Difficulty.EASY ? 'border-[#0891b2] bg-cyan-50 text-[#0891b2] font-bold' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      EASY.DRV
                    </button>
                    <button 
                      onClick={() => setDifficulty(Difficulty.HARD)}
                      className={`flex-1 py-4 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 rounded-lg ${difficulty === Difficulty.HARD ? 'border-red-600 bg-red-50 text-red-600 font-bold' : 'border-slate-200 text-slate-400 hover:border-slate-300'}`}
                    >
                      HARD.DRV
                    </button>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-[#0f172a] text-white font-orbitron font-bold text-2xl hover:bg-[#0891b2] transition-all transform active:scale-95 rounded-xl shadow-xl"
                >
                  INITIALIZE
                </button>
              </div>
            )}

            {/* Overlay: Paused */}
            {status === GameStatus.PAUSED && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-md z-20 rounded-xl">
                <h2 className="text-4xl font-orbitron text-[#0f172a] mb-10 font-black">STASIS_MOD</h2>
                <button 
                  onClick={togglePause}
                  className="px-16 py-5 bg-[#0f172a] text-white font-bold uppercase hover:bg-[#0891b2] transition-all rounded-xl shadow-2xl"
                >
                  RESUME_FLOW
                </button>
              </div>
            )}

            {/* Overlay: Game Over */}
            {status === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 backdrop-blur-2xl z-20 rounded-xl p-10 border-4 border-red-600">
                <h2 className="text-4xl font-orbitron text-red-600 mb-2 font-black tracking-tight uppercase">ABORT_SYSTEM</h2>
                <div className="mb-8 text-center">
                  <p className="text-slate-500 text-[10px] uppercase mb-1 font-mono font-bold tracking-widest">Final Data Chunk</p>
                  <p className="text-7xl font-orbitron text-[#0f172a] font-bold">{score}</p>
                </div>

                <div className="w-full mb-10">
                  <p className="text-[11px] text-center text-slate-500 uppercase tracking-[0.3em] mb-4 font-bold">Modify Parameters</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setDifficulty(Difficulty.SLOW)}
                      className={`py-3 font-orbitron text-[9px] tracking-tighter transition-all border-2 rounded-md ${difficulty === Difficulty.SLOW ? 'border-green-600 text-green-600 bg-green-50' : 'border-slate-200 text-slate-400'}`}
                    >
                      SLOW
                    </button>
                    <button 
                      onClick={() => setDifficulty(Difficulty.EASY)}
                      className={`py-3 font-orbitron text-[9px] tracking-tighter transition-all border-2 rounded-md ${difficulty === Difficulty.EASY ? 'border-[#0891b2] text-[#0891b2] bg-cyan-50' : 'border-slate-200 text-slate-400'}`}
                    >
                      EASY
                    </button>
                    <button 
                      onClick={() => setDifficulty(Difficulty.HARD)}
                      className={`py-3 font-orbitron text-[9px] tracking-tighter transition-all border-2 rounded-md ${difficulty === Difficulty.HARD ? 'border-red-600 text-red-600 bg-red-50' : 'border-slate-200 text-slate-400'}`}
                    >
                      HARD
                    </button>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-red-600 text-white font-orbitron font-bold text-xl hover:bg-[#0f172a] transition-all rounded-xl shadow-lg"
                >
                  REBOOT.CMD
                </button>
              </div>
            )}
          </div>

          <div className="w-full space-y-6">
            {/* Control Strip */}
            {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
              <div className="flex gap-4">
                 <button 
                   onClick={togglePause}
                   className={`flex-1 py-4 font-orbitron text-sm tracking-[0.3em] transition-all duration-300 border-4 rounded-2xl flex items-center justify-center gap-3 font-bold ${status === GameStatus.PAUSED ? 'border-green-600 text-green-600 bg-green-50' : 'border-[#0f172a] text-[#0f172a] hover:bg-slate-100'}`}
                 >
                   <span className={`w-3 h-3 rounded-full ${status === GameStatus.PAUSED ? 'bg-green-600' : 'bg-[#0f172a]'}`}></span>
                   {status === GameStatus.PAUSED ? 'RESUME_STREAM' : 'SUSPEND_STREAM'}
                 </button>
              </div>
            )}

            <div className="flex gap-6">
              <div className="flex-1 p-5 glass-panel rounded-3xl flex flex-col items-center border-b-4 border-b-green-600">
                <span className="text-[11px] text-slate-400 uppercase font-black tracking-[0.3em] mb-1">Bytes_In</span>
                <span className="text-4xl font-orbitron text-[#0f172a]">{score}</span>
              </div>
              <div className="flex-1 p-5 glass-panel rounded-3xl flex flex-col items-center border-b-4 border-b-[#0891b2]">
                <span className="text-[11px] text-slate-400 uppercase font-black tracking-[0.3em] mb-1">Refresh_Rate</span>
                <span className="text-4xl font-orbitron text-[#0f172a]">{(1000/speed).toFixed(1)}Hz</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side - Oracle & Terminal Info */}
        <section className="flex flex-col gap-8 w-full lg:w-80 order-3">
          <div className="w-full">
            <OracleMessage comment={oracleComment} loading={oracleLoading} />
          </div>
          
          <div className="p-8 glass-panel rounded-3xl border-r-8 border-r-pink-500 shadow-xl">
             <h3 className="text-[13px] uppercase font-black text-[#0f172a] mb-6 tracking-[0.4em] border-b-2 border-slate-100 pb-4 flex justify-between">
                Directives
                <span className="text-slate-300">0x24</span>
             </h3>
             <ul className="space-y-6 font-mono text-xs text-slate-600">
               <li className="flex flex-col gap-2">
                 <span className="text-slate-400 uppercase text-[9px] font-bold tracking-[0.2em]">Navigational_Vectors</span>
                 <span className="text-[#0f172a] bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-bold shadow-inner">Arrows / WASD</span>
               </li>
               <li className="flex flex-col gap-2">
                 <span className="text-slate-400 uppercase text-[9px] font-bold tracking-[0.2em]">Flow_Interruption</span>
                 <span className="text-[#0f172a] bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-bold shadow-inner">Space_Bar</span>
               </li>
               <li className="flex flex-col gap-3 pt-4 border-t border-slate-100">
                 <div className="flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Bio-link</span>
                    <div className="w-4 h-4 bg-green-600 border-2 border-white shadow-md"></div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-slate-400 uppercase text-[10px] font-bold">Data-bit</span>
                    <div className="w-4 h-4 bg-pink-600 border-2 border-white shadow-md"></div>
                 </div>
               </li>
             </ul>
          </div>
          
          <div className="px-8 py-5 glass-panel rounded-3xl flex items-center gap-4 border-l-4 border-l-green-500">
             <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-sm"></div>
             <span className="text-[11px] text-slate-500 font-bold font-mono tracking-widest uppercase italic">AI_SECURE_LINK::OK</span>
          </div>
        </section>
      </main>

      <footer className="mt-auto py-10 text-slate-300 text-[11px] font-mono uppercase tracking-[0.6em] font-black">
        BRIGHT_VOID // CORE_KERNEL_5.0 // (C) 2025 DIGITAL_EVOLUTION
      </footer>
    </div>
  );
};

export default App;
