import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './services/GameEngine';
import TetrisCanvas from './components/TetrisCanvas';
import AIHeckler from './components/AIHeckler';
import NextPiece from './components/NextPiece';
import { GameStatus, AICommentary } from './types';
import { getAICommentary } from './services/geminiService';

const App: React.FC = () => {
  // Use a ref for the game engine to keep it mutable without unnecessary re-renders
  // We only trigger re-renders via lastUpdate when we want to draw a frame or update UI
  const engineRef = useRef<GameEngine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lastUpdate, setLastUpdate] = useState(0);
  const [gameState, setGameState] = useState({
    score: 0,
    lines: 0,
    level: 1,
    status: GameStatus.IDLE,
    nextPiece: 'I' as any
  });

  // Persistent High Score
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('gemini_tetris_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [aiCommentary, setAiCommentary] = useState<AICommentary | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const lastAiTimeRef = useRef(0);

  // Initialize Engine
  useEffect(() => {
    engineRef.current = new GameEngine((event, payload) => {
      handleGameEvent(event, payload);
    });
    // Force initial render
    setLastUpdate(Date.now());
  }, []);

  // Update High Score Effect
  useEffect(() => {
    if (gameState.score > highScore) {
      setHighScore(gameState.score);
      localStorage.setItem('gemini_tetris_highscore', gameState.score.toString());
    }
  }, [gameState.score, highScore]);

  const handleGameEvent = useCallback(async (event: string, payload?: any) => {
    if (!engineRef.current) return;
    
    // Sync state for UI
    setGameState({
      score: engineRef.current.score,
      lines: engineRef.current.lines,
      level: engineRef.current.level,
      status: engineRef.current.status,
      nextPiece: engineRef.current.nextPieceType,
    });

    // AI Trigger Logic
    const now = Date.now();
    const isMajorEvent = event === 'GAME_OVER' || event === 'TETRIS';
    const isInterval = (now - lastAiTimeRef.current) > 30000 && engineRef.current.status === GameStatus.PLAYING;

    if (isMajorEvent || isInterval) {
      lastAiTimeRef.current = now;
      setAiLoading(true);
      
      const snapshot = engineRef.current.getBoardSnapshot();
      const commentary = await getAICommentary(
        event, 
        snapshot, 
        engineRef.current.score, 
        engineRef.current.lines
      );
      
      setAiCommentary(commentary);
      setAiLoading(false);
    }
  }, []);

  // Game Loop
  useEffect(() => {
    let animationId: number;
    let lastTime = 0;
    let dropCounter = 0;

    const update = (time: number) => {
      if (!lastTime) lastTime = time;
      const deltaTime = time - lastTime;
      lastTime = time;

      if (engineRef.current && engineRef.current.status === GameStatus.PLAYING) {
        // Drop speed based on level
        const dropInterval = Math.max(100, 1000 - (engineRef.current.level - 1) * 100);
        
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
          engineRef.current.move(0, 1);
          dropCounter = 0;
          // Sync UI state
           setGameState(prev => ({
             ...prev,
             score: engineRef.current!.score,
             lines: engineRef.current!.lines,
             level: engineRef.current!.level,
             status: engineRef.current!.status,
             nextPiece: engineRef.current!.nextPieceType
           }));
        }
      }
      
      setLastUpdate(time); // Trigger Canvas Re-render
      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, []);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current || engineRef.current.status !== GameStatus.PLAYING) return;

      let changed = false;
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
          changed = engineRef.current.move(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
          changed = engineRef.current.move(1, 0);
          break;
        case 'ArrowDown':
        case 's':
          changed = engineRef.current.move(0, 1);
          break;
        case 'ArrowUp':
        case 'w':
          engineRef.current.rotate();
          changed = true;
          break;
        case ' ':
          engineRef.current.hardDrop();
          changed = true;
          // Trigger immediate update after hard drop to clear lines visually asap
           setGameState(prev => ({
             ...prev,
             score: engineRef.current!.score,
             lines: engineRef.current!.lines,
             level: engineRef.current!.level,
             status: engineRef.current!.status,
             nextPiece: engineRef.current!.nextPieceType
           }));
          break;
      }
      
      if (changed) setLastUpdate(Date.now());
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.start();
      setGameState({
        score: 0,
        lines: 0,
        level: 1,
        status: GameStatus.PLAYING,
        nextPiece: engineRef.current.nextPieceType
      });
      setAiCommentary({ text: "Let's see if you're better than the last one...", mood: 'neutral' });
    }
  };

  const togglePause = () => {
     if (engineRef.current) {
        if (gameState.status === GameStatus.PLAYING) {
           engineRef.current.status = GameStatus.PAUSED;
        } else if (gameState.status === GameStatus.PAUSED) {
           engineRef.current.status = GameStatus.PLAYING;
        }
        setGameState(prev => ({ ...prev, status: engineRef.current!.status }));
     }
  };

  // --- Save/Load Logic ---
  const saveGame = () => {
    if (!engineRef.current) return;
    const state = engineRef.current.getState();
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tetris-save-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setAiCommentary({ text: "Saving your progress? Afraid to lose?", mood: 'sarcastic' });
  };

  const triggerLoad = () => {
    fileInputRef.current?.click();
  };

  const loadGame = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !engineRef.current) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string);
        engineRef.current?.restoreState(state);
        setGameState({ ...state, status: GameStatus.PAUSED });
        setLastUpdate(Date.now());
        setAiCommentary({ text: "Time travel initiated. Don't mess it up this time.", mood: 'neutral' });
      } catch (err) {
        console.error("Failed to load save", err);
        setAiCommentary({ text: "Corrupted save file. Just like your skills.", mood: 'roasting' });
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-4">
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold pixel-font text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          GEMINI TETRIS
        </h1>
        <p className="text-gray-400 mt-2 font-mono text-sm">Powered by Google GenAI</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8 items-start max-w-6xl w-full">
        
        {/* Left Column: Stats & Next Piece */}
        <div className="flex flex-col gap-4 w-full md:w-48 order-2 md:order-1">
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-yellow-500 text-xs uppercase font-bold mb-1">High Score</h2>
            <p className="text-2xl font-mono text-yellow-100">{highScore.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-gray-500 text-xs uppercase font-bold mb-1">Score</h2>
            <p className="text-2xl font-mono text-white">{gameState.score.toLocaleString()}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-lg">
            <h2 className="text-gray-500 text-xs uppercase font-bold mb-1">Level</h2>
            <p className="text-2xl font-mono text-cyan-400">{gameState.level}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg shadow-lg">
             <h2 className="text-gray-500 text-xs uppercase font-bold mb-1">Lines</h2>
             <p className="text-2xl font-mono text-purple-400">{gameState.lines}</p>
          </div>
          <div className="hidden md:block">
             <NextPiece type={gameState.nextPiece} />
          </div>
        </div>

        {/* Center: Game Board */}
        <div className="relative order-1 md:order-2 flex justify-center">
          {engineRef.current && (
            <TetrisCanvas gameEngine={engineRef.current} lastUpdate={lastUpdate} />
          )}
          
          {gameState.status !== GameStatus.PLAYING && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-sm z-10 backdrop-blur-sm">
              <h2 className="text-3xl font-bold mb-6 pixel-font text-white">
                {gameState.status === GameStatus.GAME_OVER ? 'GAME OVER' : gameState.status === GameStatus.PAUSED ? 'PAUSED' : 'READY?'}
              </h2>
              <button 
                onClick={startGame}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded shadow-lg transform hover:scale-105 transition-all"
              >
                {gameState.status === GameStatus.IDLE || gameState.status === GameStatus.GAME_OVER ? 'START GAME' : 'RESTART'}
              </button>
              {gameState.status === GameStatus.PAUSED && (
                 <button onClick={togglePause} className="mt-4 text-gray-400 hover:text-white underline">Resume</button>
              )}
            </div>
          )}
        </div>

        {/* Right Column: AI & Controls */}
        <div className="flex flex-col gap-6 w-full md:w-80 order-3 md:order-3">
           <AIHeckler commentary={aiCommentary} loading={aiLoading} />
           
           <div className="bg-gray-900 border border-gray-800 p-4 rounded-lg text-sm text-gray-400">
             <h3 className="font-bold text-gray-200 mb-2">Controls</h3>
             <ul className="space-y-1 font-mono text-xs mb-4">
               <li className="flex justify-between"><span>Rotate</span> <kbd className="bg-gray-800 px-1 rounded">↑ / W</kbd></li>
               <li className="flex justify-between"><span>Left</span> <kbd className="bg-gray-800 px-1 rounded">← / A</kbd></li>
               <li className="flex justify-between"><span>Right</span> <kbd className="bg-gray-800 px-1 rounded">→ / D</kbd></li>
               <li className="flex justify-between"><span>Soft Drop</span> <kbd className="bg-gray-800 px-1 rounded">↓ / S</kbd></li>
               <li className="flex justify-between"><span>Hard Drop</span> <kbd className="bg-gray-800 px-1 rounded">Space</kbd></li>
             </ul>
             <button 
                onClick={togglePause}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs uppercase font-bold tracking-wider mb-2"
             >
                {gameState.status === GameStatus.PAUSED ? 'Resume' : 'Pause'}
             </button>

             {/* Save/Load System */}
             <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-800">
               <button 
                 onClick={saveGame}
                 className="flex items-center justify-center gap-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs uppercase font-bold tracking-wider text-green-400"
                 title="Download Save File"
               >
                 <span>💾 Save</span>
               </button>
               <button 
                 onClick={triggerLoad}
                 className="flex items-center justify-center gap-1 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs uppercase font-bold tracking-wider text-blue-400"
                 title="Upload Save File"
               >
                 <span>📂 Load</span>
               </button>
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={loadGame} 
                  accept=".json" 
                  className="hidden" 
               />
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;