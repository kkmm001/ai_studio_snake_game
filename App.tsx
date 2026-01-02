
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 selection:bg-[#00f3ff] selection:text-black font-rajdhani">
      <header className="mb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-orbitron font-bold tracking-tighter mb-2 text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#39ff14] to-[#ff007f] drop-shadow-[0_0_10px_rgba(0,243,255,0.3)]">
          NEON SNAKE
        </h1>
        <div className="flex items-center justify-center gap-4 text-[10px] font-bold tracking-[0.4em] text-[#00f3ff] opacity-80 uppercase">
          <span>Neural Engine Active</span>
          <div className="w-1.5 h-1.5 bg-[#39ff14] rounded-full animate-pulse"></div>
          <span>Refined Vector v4.0</span>
        </div>
      </header>

      <main className="flex flex-col lg:flex-row gap-8 items-start justify-center max-w-7xl w-full">
        
        {/* Left Side - Stats & History */}
        <section className="flex flex-col gap-6 w-full lg:w-72 order-2 lg:order-1">
          <div className="p-5 glass-panel rounded-2xl border-l-4 border-l-[#00f3ff]">
            <p className="text-[#00f3ff] text-[10px] uppercase font-bold mb-1 tracking-[0.2em]">Record Matrix</p>
            <p className="text-3xl font-orbitron text-white">{highScore}</p>
          </div>

          <div className="p-5 glass-panel rounded-2xl overflow-hidden border-t-2 border-t-[#ff007f]/30">
             <h3 className="text-xs uppercase font-bold text-[#ff007f] mb-4 tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#ff007f] rounded-full"></span>
                Session Log
             </h3>
             <div className="space-y-4 max-h-[320px] overflow-y-auto pr-3 scrollbar-custom">
               {scoreHistory.length > 0 ? scoreHistory.map(record => (
                 <div key={record.id} className="flex flex-col group border-b border-white/5 pb-3">
                   <div className="flex justify-between items-center mb-1">
                     <span className="text-xl font-orbitron text-white group-hover:text-[#39ff14] transition-colors">{record.score}</span>
                     <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold tracking-tighter ${record.difficulty === Difficulty.HARD ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                        {record.difficulty}
                     </span>
                   </div>
                   <span className="text-[10px] text-slate-500 font-mono tracking-tight uppercase">
                     {new Date(record.timestamp).toLocaleTimeString()} // ID:{record.id.slice(-4)}
                   </span>
                 </div>
               )) : (
                 <p className="text-slate-600 text-[11px] font-mono italic uppercase tracking-widest text-center py-4">Waiting for mission data...</p>
               )}
             </div>
          </div>
        </section>

        {/* Center - Game Canvas */}
        <section className="flex flex-col items-center gap-6 order-1 lg:order-2 flex-grow max-w-[440px]">
          <div className="relative w-full">
            <SnakeCanvas snake={snake} food={food} status={status} />
            
            {/* Overlay: Initial Difficulty Select */}
            {status === GameStatus.IDLE && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-xl z-20 rounded-xl p-8 border border-white/10">
                <div className="mb-10 text-center">
                  <h2 className="text-2xl font-orbitron text-[#00f3ff] mb-2 tracking-[0.2em]">BOOT PROTOCOL</h2>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Select operational difficulty</p>
                </div>
                
                <div className="flex gap-4 mb-10 w-full">
                  <button 
                    onClick={() => setDifficulty(Difficulty.EASY)}
                    className={`flex-1 py-4 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 rounded-lg ${difficulty === Difficulty.EASY ? 'border-blue-400 bg-blue-400/20 text-blue-400 shadow-[0_0_20px_rgba(96,165,250,0.3)]' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
                  >
                    EASY.DRV
                  </button>
                  <button 
                    onClick={() => setDifficulty(Difficulty.HARD)}
                    className={`flex-1 py-4 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 rounded-lg ${difficulty === Difficulty.HARD ? 'border-red-400 bg-red-400/20 text-red-400 shadow-[0_0_20px_rgba(248,113,113,0.3)]' : 'border-slate-800 text-slate-600 hover:border-slate-700'}`}
                  >
                    HARD.DRV
                  </button>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-5 bg-[#39ff14] text-black font-orbitron font-bold text-xl hover:bg-white transition-all transform active:scale-95 rounded-lg shadow-[0_0_30px_rgba(57,255,20,0.3)]"
                >
                  INITIALIZE
                </button>
              </div>
            )}

            {/* Overlay: Paused */}
            {status === GameStatus.PAUSED && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-md z-20 rounded-xl">
                <h2 className="text-3xl font-orbitron text-[#00f3ff] mb-8 animate-pulse">SUSPENDED</h2>
                <button 
                  onClick={togglePause}
                  className="px-12 py-4 bg-transparent border-2 border-[#00f3ff] text-[#00f3ff] font-bold uppercase hover:bg-[#00f3ff] hover:text-black transition-all rounded-lg"
                >
                  RESUME
                </button>
              </div>
            )}

            {/* Overlay: Game Over with Difficulty Switch */}
            {status === GameStatus.GAME_OVER && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl z-20 rounded-xl p-8">
                <h2 className="text-3xl font-orbitron text-[#ff0055] mb-2 font-bold tracking-tighter uppercase">LINK SEVERED</h2>
                <div className="mb-6 text-center">
                  <p className="text-slate-500 text-[10px] uppercase mb-1 font-mono">Final Score Record</p>
                  <p className="text-6xl font-orbitron text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{score}</p>
                </div>

                {/* Difficulty switch on Game Over screen */}
                <div className="w-full mb-8">
                  <p className="text-[10px] text-center text-slate-500 uppercase tracking-[0.2em] mb-3">Adjust Parameter For Next Run</p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setDifficulty(Difficulty.EASY)}
                      className={`flex-1 py-3 font-orbitron text-[10px] tracking-widest transition-all border-2 rounded-md ${difficulty === Difficulty.EASY ? 'border-blue-400 text-blue-400 bg-blue-400/10' : 'border-slate-800 text-slate-600'}`}
                    >
                      EASY
                    </button>
                    <button 
                      onClick={() => setDifficulty(Difficulty.HARD)}
                      className={`flex-1 py-3 font-orbitron text-[10px] tracking-widest transition-all border-2 rounded-md ${difficulty === Difficulty.HARD ? 'border-red-400 text-red-400 bg-red-400/10' : 'border-slate-800 text-slate-600'}`}
                    >
                      HARD
                    </button>
                  </div>
                </div>

                <button 
                  onClick={startGame}
                  className="w-full py-4 bg-[#ff0055] text-white font-orbitron font-bold text-lg hover:bg-white hover:text-[#ff0055] transition-all rounded-lg shadow-[0_0_20px_rgba(255,0,85,0.4)]"
                >
                  REBOOT.EXE
                </button>
              </div>
            )}
          </div>

          <div className="w-full space-y-4">
            {/* Control Strip */}
            {(status === GameStatus.PLAYING || status === GameStatus.PAUSED) && (
              <div className="flex gap-4">
                 <button 
                   onClick={togglePause}
                   className={`flex-1 py-3 font-orbitron text-xs tracking-widest transition-all duration-300 border-2 rounded-xl flex items-center justify-center gap-2 ${status === GameStatus.PAUSED ? 'border-[#39ff14] text-[#39ff14] hover:bg-[#39ff14]/10' : 'border-[#00f3ff] text-[#00f3ff] hover:bg-[#00f3ff]/10'}`}
                 >
                   <span className={`w-2 h-2 rounded-full ${status === GameStatus.PAUSED ? 'bg-[#39ff14]' : 'bg-[#00f3ff]'}`}></span>
                   {status === GameStatus.PAUSED ? 'RESUME STREAM' : 'PAUSE STREAM'}
                 </button>
              </div>
            )}

            <div className="flex gap-4">
              <div className="flex-1 p-4 glass-panel rounded-2xl flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">DATA FLOW</span>
                <span className="text-3xl font-orbitron text-[#39ff14]">{score}</span>
              </div>
              <div className="flex-1 p-4 glass-panel rounded-2xl flex flex-col items-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mb-1">SYNC RATE</span>
                <span className="text-3xl font-orbitron text-white">{(1000/speed).toFixed(1)}Hz</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side - Oracle & Terminal Info */}
        <section className="flex flex-col gap-6 w-full lg:w-80 order-3">
          <div className="w-full">
            <OracleMessage comment={oracleComment} loading={oracleLoading} />
          </div>
          
          <div className="p-6 glass-panel rounded-2xl border-r-4 border-r-[#ff007f]">
             <h3 className="text-[11px] uppercase font-bold text-slate-400 mb-5 tracking-[0.3em] border-b border-white/5 pb-3">Operational Directives</h3>
             <ul className="space-y-4 font-mono text-xs text-slate-400">
               <li className="flex flex-col gap-1">
                 <span className="text-slate-600 uppercase text-[9px] tracking-widest">Vector Steering</span>
                 <span className="text-white bg-white/5 px-2 py-1 rounded w-fit italic">Arrows / WASD Keys</span>
               </li>
               <li className="flex flex-col gap-1">
                 <span className="text-slate-600 uppercase text-[9px] tracking-widest">Process Control</span>
                 <span className="text-white bg-white/5 px-2 py-1 rounded w-fit italic">Space Bar</span>
               </li>
               <li className="flex flex-col gap-2 pt-2">
                 <div className="flex items-center justify-between">
                    <span className="text-slate-600 uppercase text-[9px] tracking-widest">Bio-link</span>
                    <div className="w-3 h-3 bg-[#39ff14] shadow-[0_0_8px_#39ff14]"></div>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-slate-600 uppercase text-[9px] tracking-widest">Data-bit</span>
                    <div className="w-3 h-3 bg-[#ff007f] shadow-[0_0_8px_#ff007f]"></div>
                 </div>
               </li>
             </ul>
          </div>
          
          <div className="px-6 py-4 glass-panel rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
             <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase italic">Secure AI Connection</span>
          </div>
        </section>
      </main>

      <footer className="mt-auto py-8 text-slate-600 text-[10px] font-mono uppercase tracking-[0.5em] opacity-40">
        NEON GENESIS // SYSTEM CORE v4.0.2 // (C) 2025 DIGITAL_VOID
      </footer>
    </div>
  );
};

export default App;
