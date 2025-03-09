'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FlappyBirdProps {
  onGameOver: (score: number) => void;
  onStart: () => void;
}

export default function FlappyBird({ onGameOver, onStart }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const gameStateRef = useRef({ gameStarted: false, gameOver: false });

  // Audio management
  const audioRef = useRef<{
    start: HTMLAudioElement | null;
    score: HTMLAudioElement | null;
    crash: HTMLAudioElement | null;
  }>({
    start: null,
    score: null,
    crash: null
  });

  // Game constants
  const GRAVITY = 0.35;
  const FLAP_POWER = -6.5;
  const PIPE_SPEED = 1.5;
  const PIPE_SPAWN_INTERVAL = 2500;
  const PIPE_GAP = 180;
  const PIPE_WIDTH = 80;

  // Game variables
  const birdRef = useRef({
    x: 0,
    y: 0,
    velocity: 0,
    width: 40,
    height: 30
  });

  const pipesRef = useRef<{
    x: number;
    topHeight: number;
    bottomY: number;
    counted: boolean;
  }[]>([]);

  const scoreRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const pipeSpawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Preload images
  const imagesRef = useRef<{
    bird: HTMLImageElement | null;
    pipeTop: HTMLImageElement | null;
    pipeBottom: HTMLImageElement | null;
    background: HTMLImageElement | null;
  }>({
    bird: null,
    pipeTop: null,
    pipeBottom: null,
    background: null
  });

  // Function to play sounds safely
  const playSoundEffect = (type: 'start' | 'score' | 'crash', volume = 0.5) => {
    try {
      const sound = audioRef.current[type];
      
      if (sound) {
        // Reset the audio to the beginning
        sound.pause();
        sound.currentTime = 0;
        sound.volume = volume;
        
        // Play the sound with error handling
        const playPromise = sound.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log(`${type} sound played`))
            .catch(err => console.warn(`Error playing ${type} sound:`, err));
        }
      } else {
        console.warn(`Sound ${type} not loaded, cannot play`);
      }
    } catch (error) {
      console.warn(`Error playing ${type} sound:`, error);
    }
  };

  // Preload assets
  useEffect(() => {
    // Load audio files
    const loadAudio = () => {
      try {
        audioRef.current = {
          start: new Audio('/sounds/start.wav'),
          score: new Audio('/sounds/score.wav'),
          crash: new Audio('/sounds/crash.wav')
        };
        
        // Set volume
        Object.values(audioRef.current).forEach(audio => {
          if (audio) audio.volume = 0.5;
        });
        
        console.log("Audio loaded successfully");
      } catch (error) {
        console.error("Failed to load audio:", error);
      }
    };

    // Load images
    const loadImages = () => {
      let loadedCount = 0;
      const totalImages = 4;
      
      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          console.log("All images loaded");
          setIsReady(true);
        }
      };
      
      try {
        // Load bird image
        const birdImg = new Image();
        birdImg.onload = checkAllLoaded;
        birdImg.onerror = (e) => {
          console.error("Failed to load bird image:", e);
          checkAllLoaded();
        };
        birdImg.src = '/images/games/flappy-bird.png';
        imagesRef.current.bird = birdImg;
        
        // Load pipe top image
        const pipeTopImg = new Image();
        pipeTopImg.onload = checkAllLoaded;
        pipeTopImg.onerror = (e) => {
          console.error("Failed to load pipe top image:", e);
          checkAllLoaded();
        };
        pipeTopImg.src = '/images/games/pipe-top.png';
        imagesRef.current.pipeTop = pipeTopImg;
        
        // Load pipe bottom image
        const pipeBottomImg = new Image();
        pipeBottomImg.onload = checkAllLoaded;
        pipeBottomImg.onerror = (e) => {
          console.error("Failed to load pipe bottom image:", e);
          checkAllLoaded();
        };
        pipeBottomImg.src = '/images/games/pipe-bottom.png';
        imagesRef.current.pipeBottom = pipeBottomImg;
        
        // Load background image
        const backgroundImg = new Image();
        backgroundImg.onload = checkAllLoaded;
        backgroundImg.onerror = (e) => {
          console.error("Failed to load background image:", e);
          checkAllLoaded();
        };
        backgroundImg.src = '/images/games/flappy-background.png';
        imagesRef.current.background = backgroundImg;
        
      } catch (error) {
        console.error("Error loading images:", error);
        setLoadingError("Failed to load game assets");
      }
    };
    
    // Load assets
    loadAudio();
    loadImages();
    
    // Load high score from localStorage
    const storedHighScore = localStorage.getItem('flappyHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }
    
    // Cleanup function
    return () => {
      // Cancel animation frame
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
        requestIdRef.current = null;
      }
      
      // Clear pipe generation timer
      if (pipeSpawnTimerRef.current) {
        clearTimeout(pipeSpawnTimerRef.current);
        pipeSpawnTimerRef.current = null;
      }
      
      // Clean up audio
      Object.values(audioRef.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  // Draw loading screen
  useEffect(() => {
    if (!isReady) {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#008B8B'; // Teal background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#3CB371'; // Green ground
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
      
      // Draw loading text
      ctx.font = '24px "Press Start 2P", cursive';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText('LOADING...', canvas.width / 2, canvas.height / 2);
    }
  }, [isReady]);

  // Handle game input
  const handleFlap = () => {
    if (gameStateRef.current.gameOver) {
      resetGame();
      return;
    }
    
    if (!gameStateRef.current.gameStarted) {
      startGame();
      return;
    }
    
    // Flap the bird
    birdRef.current.velocity = FLAP_POWER;
  };

  // Update game state and handle input
  useEffect(() => {
    // Keep gameStateRef in sync with state
    gameStateRef.current = { gameStarted, gameOver };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleFlap();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver]);

  // Start the game
  const startGame = () => {
    console.log("Starting game!");
    
    // Initialize bird position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    birdRef.current = {
      x: canvas.width / 4,
      y: canvas.height / 2,
      velocity: 0,
      width: 40,
      height: 30
    };
    
    // Clear pipes
    pipesRef.current = [];
    
    // Reset score
    scoreRef.current = 0;
    setScore(0);
    
    // Update game state
    setGameStarted(true);
    setGameOver(false);
    gameStateRef.current = { gameStarted: true, gameOver: false };
    
    // Start pipe generation
    generatePipe();
    
    // Start game loop if not already running
    if (!requestIdRef.current) {
      lastTimestampRef.current = 0;
      requestIdRef.current = requestAnimationFrame(updateGame);
    }
    
    // Play start sound
    playSoundEffect('start');
    
    // Notify parent component
    onStart();
  };

  // Generate pipe
  const generatePipe = () => {
    if (!gameStateRef.current.gameStarted || gameStateRef.current.gameOver) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const minHeight = 50;
    const maxHeight = canvas.height - PIPE_GAP - minHeight - 100; // Account for ground
    const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    
    pipesRef.current.push({
      x: canvas.width,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      counted: false
    });
    
    // Schedule next pipe
    pipeSpawnTimerRef.current = setTimeout(generatePipe, PIPE_SPAWN_INTERVAL);
  };

  // End game
  const endGame = () => {
    if (gameStateRef.current.gameOver) return;
    
    setGameOver(true);
    gameStateRef.current.gameOver = true;
    
    // Check for high score
    if (scoreRef.current > highScore) {
      setHighScore(scoreRef.current);
      localStorage.setItem('flappyHighScore', scoreRef.current.toString());
    }
    
    // Clear pipe generation timer
    if (pipeSpawnTimerRef.current) {
      clearTimeout(pipeSpawnTimerRef.current);
      pipeSpawnTimerRef.current = null;
    }
    
    // Play crash sound
    playSoundEffect('crash');
    
    // Notify parent component
    onGameOver(scoreRef.current);
  };

  // Reset game
  const resetGame = () => {
    // Cancel animation frame
    if (requestIdRef.current) {
      cancelAnimationFrame(requestIdRef.current);
      requestIdRef.current = null;
    }
    
    // Reset game state
    setGameStarted(false);
    setGameOver(false);
    gameStateRef.current = { gameStarted: false, gameOver: false };
    setScore(0);
    scoreRef.current = 0;
    
    // Redraw initial screen
    drawInitialScreen();
  };

  // Draw initial screen
  const drawInitialScreen = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (imagesRef.current.background?.complete) {
      ctx.drawImage(imagesRef.current.background, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback background
      ctx.fillStyle = '#008B8B'; // Teal background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw ground
      ctx.fillStyle = '#3CB371'; // Green ground
      ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    }
    
    // Draw bird
    const bird = birdRef.current;
    if (imagesRef.current.bird?.complete) {
      ctx.drawImage(
        imagesRef.current.bird,
        canvas.width / 4 - bird.width / 2,
        canvas.height / 2 - bird.height / 2,
        bird.width,
        bird.height
      );
    } else {
      // Fallback bird
      ctx.fillStyle = '#FF6347'; // Tomato color
      ctx.beginPath();
      ctx.arc(canvas.width / 4, canvas.height / 2, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw "Tap to Start" text
    ctx.font = '36px "Press Start 2P", cursive';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('TAP TO START', canvas.width / 2, canvas.height / 2 + 150);
    
    // Draw score
    ctx.font = '20px "Press Start 2P", cursive';
    ctx.fillStyle = '#00FF00'; // Green
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + score, 20, 40);
    
    // Draw high score
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.textAlign = 'left';
    ctx.fillText('Best: ' + highScore, 300, 40);
  };

  // Game update loop
  const updateGame = (timestamp: number) => {
    if (!gameStateRef.current.gameStarted) {
      requestIdRef.current = requestAnimationFrame(updateGame);
      return;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Calculate delta time
    if (!lastTimestampRef.current) lastTimestampRef.current = timestamp;
    const deltaTime = timestamp - lastTimestampRef.current;
    lastTimestampRef.current = timestamp;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    if (imagesRef.current.background?.complete) {
      ctx.drawImage(imagesRef.current.background, 0, 0, canvas.width, canvas.height);
    } else {
      // Fallback background
      ctx.fillStyle = '#008B8B'; // Teal background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    // Update bird
    const bird = birdRef.current;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Draw bird with rotation
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.04)));
    
    if (imagesRef.current.bird?.complete) {
      ctx.drawImage(
        imagesRef.current.bird,
        -bird.width / 2,
        -bird.height / 2,
        bird.width,
        bird.height
      );
    } else {
      // Fallback bird
      ctx.fillStyle = '#FF6347'; // Tomato color
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    
    // Update and draw pipes
    for (let i = 0; i < pipesRef.current.length; i++) {
      const pipe = pipesRef.current[i];
      pipe.x -= PIPE_SPEED;
      
      // Draw top pipe
      if (imagesRef.current.pipeTop?.complete) {
        ctx.drawImage(
          imagesRef.current.pipeTop,
          pipe.x,
          0,
          PIPE_WIDTH,
          pipe.topHeight
        );
      } else {
        // Fallback pipe
        ctx.fillStyle = '#75B855'; // Green pipe
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      }
      
      // Draw bottom pipe
      if (imagesRef.current.pipeBottom?.complete) {
        ctx.drawImage(
          imagesRef.current.pipeBottom,
          pipe.x,
          pipe.bottomY,
          PIPE_WIDTH,
          canvas.height - pipe.bottomY
        );
      } else {
        // Fallback pipe
        ctx.fillStyle = '#75B855'; // Green pipe
        ctx.fillRect(pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);
      }
      
      // Check if bird passed pipe
      if (!pipe.counted && pipe.x + PIPE_WIDTH < bird.x) {
        pipe.counted = true;
        scoreRef.current++;
        setScore(scoreRef.current);
        
        // Play score sound
        playSoundEffect('score', 0.3);
      }
      
      // Check for collision
      if (
        bird.x + bird.width / 2 > pipe.x &&
        bird.x - bird.width / 2 < pipe.x + PIPE_WIDTH &&
        (bird.y - bird.height / 2 < pipe.topHeight || bird.y + bird.height / 2 > pipe.bottomY)
      ) {
        endGame();
      }
    }
    
    // Remove pipes that are off screen
    pipesRef.current = pipesRef.current.filter(pipe => pipe.x + PIPE_WIDTH > 0);
    
    // Draw ground
    ctx.fillStyle = '#3CB371'; // Green ground
    ctx.fillRect(0, canvas.height - 100, canvas.width, 100);
    
    // Check for collision with ground
    if (bird.y + bird.height / 2 > canvas.height - 100) {
      endGame();
    }
    
    // Check for collision with ceiling
    if (bird.y - bird.height / 2 < 0) {
      endGame();
    }
    
    // Draw score
    ctx.font = '20px "Press Start 2P", cursive';
    ctx.fillStyle = '#00FF00'; // Green
    ctx.textAlign = 'left';
    ctx.fillText('Score: ' + scoreRef.current, 20, 40);
    
    // Draw high score
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.textAlign = 'left';
    ctx.fillText('Best: ' + highScore, 300, 40);
    
    // Game over screen
    if (gameStateRef.current.gameOver) {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Game over text
      ctx.font = '48px "Press Start 2P", cursive';
      ctx.fillStyle = '#FF0000';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
      
      // Score
      ctx.font = '24px "Press Start 2P", cursive';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`Score: ${scoreRef.current}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText(`High Score: ${Math.max(highScore, scoreRef.current)}`, canvas.width / 2, canvas.height / 2 + 60);
      
      // Tap to restart
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillText('TAP TO RESTART', canvas.width / 2, canvas.height / 2 + 120);
    }
    
    // Continue the game loop
    requestIdRef.current = requestAnimationFrame(updateGame);
  };

  // Initialize game on component mount
  useEffect(() => {
    if (isReady) {
      // Initialize bird position
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      birdRef.current = {
        x: canvas.width / 4,
        y: canvas.height / 2,
        velocity: 0,
        width: 40,
        height: 30
      };
      
      // Draw initial screen
      drawInitialScreen();
    }
  }, [isReady]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="border-4 border-neon-blue rounded-lg shadow-lg shadow-neon-blue/20 max-w-full cursor-pointer" 
          onClick={handleFlap}
        />
        
        {/* Loading indicator */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-neon-blue text-xl font-arcade animate-pulse">LOADING...</div>
          </div>
        )}
        
        {/* Game state debug overlay (hidden in production) */}
        {false && (
          <div className="absolute top-0 right-0 bg-black/70 p-2 text-white text-xs">
            <div>Game Started: {gameStarted ? 'Yes' : 'No'}</div>
            <div>Game Over: {gameOver ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
      
      <div className="mt-6 text-center text-gray-300 max-w-md">
        <h3 className="font-arcade text-neon-blue mb-2">CONTROLS</h3>
        <p className="text-sm">
          <span className="text-white">Desktop:</span> Press SPACE or UP ARROW to flap
        </p>
        <p className="text-sm">
          <span className="text-white">Mobile:</span> Tap the screen to flap
        </p>
      </div>
    </div>
  );
}