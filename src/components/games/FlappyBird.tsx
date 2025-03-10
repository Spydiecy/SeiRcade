'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FlappyBirdProps {
  onGameOver: (score: number) => void;
  onStart: () => void;
  disabled?: boolean; // Indicates if the player has already played in this room
  isCreator?: boolean; // Indicates if the player created this room
}

export default function FlappyBird({ onGameOver, onStart, disabled = false, isCreator = false }: FlappyBirdProps) {
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
  const GRAVITY = 0.2;
  const FLAP_POWER = -5;
  const PIPE_SPEED = 1;
  const PIPE_SPAWN_INTERVAL = 3500;
  const PIPE_GAP = 230;
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

  // Modify the disabled check to allow room creators to play
  const isPlayDisabled = disabled && !isCreator;

  // Function to play sounds safely
  const playSoundEffect = (type: 'start' | 'score' | 'crash', volume = 0.5) => {
    try {
      const sound = audioRef.current[type];
      
      if (sound) {
        // Create a new promise for playing
        const playAttempt = async () => {
          try {
            // Reset the audio
            sound.currentTime = 0;
            sound.volume = volume;
            
            // Try to play the sound
            const playPromise = sound.play();
            if (playPromise !== undefined) {
              await playPromise;
              console.log(`${type} sound played successfully`);
            }
          } catch (error) {
            // Silently fail if sound can't be played
            console.warn(`Could not play ${type} sound:`, error);
          }
        };
        
        playAttempt();
      } else {
        // Sound not available, but game should continue
        console.log(`${type} sound not available, continuing without sound`);
      }
    } catch (error) {
      // Catch any unexpected errors
      console.warn('Error playing sound effect:', error);
    }
  };

  // Preload assets
  useEffect(() => {
    let resourceLoadTimeout: NodeJS.Timeout;
    
    // Set a maximum time to wait for resources
    const ensureGameReady = () => {
      resourceLoadTimeout = setTimeout(() => {
        if (!isReady) {
          console.warn("Resource loading timed out, starting game anyway");
          setIsReady(true);
          setLoadingError(null); // Clear any loading errors
        }
      }, 5000); // 5 second timeout
    };
    
    // Start resource loading
    const loadAudio = () => {
      try {
        // Create audio elements
        const startAudio = document.createElement('audio');
        const scoreAudio = document.createElement('audio');
        const crashAudio = document.createElement('audio');

        // Configure audio elements
        [startAudio, scoreAudio, crashAudio].forEach(audio => {
          audio.preload = 'auto';
          // Add crossOrigin for better error handling
          audio.crossOrigin = 'anonymous';
        });

        // Define audio paths
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const audioFiles = {
          start: `${origin}/sounds/start.wav`,
          score: `${origin}/sounds/score.wav`,
          crash: `${origin}/sounds/crash.wav`
        };

        // Log paths for debugging
        console.log('Audio file paths:', audioFiles);

        // Set sources with full paths
        startAudio.src = audioFiles.start;
        scoreAudio.src = audioFiles.score;
        crashAudio.src = audioFiles.crash;

        // Store references even before they're fully loaded
        audioRef.current = {
          start: startAudio,
          score: scoreAudio,
          crash: crashAudio
        };

        // Add load event listeners with better error handling
        const loadPromises = [startAudio, scoreAudio, crashAudio].map(
          (audio, index) => {
            return new Promise((resolve) => {
              const name = ['start', 'score', 'crash'][index];
              
              audio.addEventListener('canplaythrough', () => {
                console.log(`${name} sound loaded successfully from ${audio.src}`);
                resolve(audio);
              }, { once: true });

              audio.addEventListener('error', (e: Event) => {
                const error = e.target as HTMLAudioElement;
                console.error(`Error loading ${name} sound from ${audio.src}:`, {
                  error: error.error,
                  networkState: error.networkState,
                  readyState: error.readyState
                });
                // Resolve anyway to not block the game from starting
                console.warn(`Game will continue without ${name} sound effect`);
                resolve(null);
              });

              // Start loading with timeout
              const timeoutId = setTimeout(() => {
                console.warn(`Timeout loading ${name} sound, continuing without it`);
                resolve(null);
              }, 5000); // 5 second timeout

              audio.addEventListener('loadeddata', () => {
                clearTimeout(timeoutId);
              }, { once: true });

              audio.load();
            });
          }
        );

        // Wait for all audio to load or timeout
        Promise.all(loadPromises)
          .then(() => {
            console.log('All audio loaded successfully');
            setIsReady(true);
          })
          .catch(error => {
            console.warn('Some audio files failed to load:', error);
            // Continue with game initialization even if audio loading fails
            setIsReady(true);
          });

      } catch (error) {
        console.error('Failed to initialize audio:', error);
        // Continue anyway
        console.warn('Game will continue without sound');
        setIsReady(true);
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
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        // Load bird image
        const birdImg = new Image();
        birdImg.onload = checkAllLoaded;
        birdImg.onerror = (e) => {
          console.error("Failed to load bird image:", e);
          checkAllLoaded();
        };
        birdImg.src = `${origin}/images/games/flappy-bird.png`;
        imagesRef.current.bird = birdImg;
        
        // Load pipe top image
        const pipeTopImg = new Image();
        pipeTopImg.onload = checkAllLoaded;
        pipeTopImg.onerror = (e) => {
          console.error("Failed to load pipe top image:", e);
          checkAllLoaded();
        };
        pipeTopImg.src = `${origin}/images/games/pipe-top.png`;
        imagesRef.current.pipeTop = pipeTopImg;
        
        // Load pipe bottom image
        const pipeBottomImg = new Image();
        pipeBottomImg.onload = checkAllLoaded;
        pipeBottomImg.onerror = (e) => {
          console.error("Failed to load pipe bottom image:", e);
          checkAllLoaded();
        };
        pipeBottomImg.src = `${origin}/images/games/pipe-bottom.png`;
        imagesRef.current.pipeBottom = pipeBottomImg;
        
        // Load background image
        const backgroundImg = new Image();
        backgroundImg.onload = checkAllLoaded;
        backgroundImg.onerror = (e) => {
          console.error("Failed to load background image:", e);
          checkAllLoaded();
        };
        backgroundImg.src = `${origin}/images/games/flappy-background.png`;
        imagesRef.current.background = backgroundImg;
        
      } catch (error) {
        console.error("Error loading images:", error);
        setLoadingError("Failed to load game assets");
      }
    };
    
    // Load assets
    loadAudio();
    loadImages();
    ensureGameReady();
    
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
      
      if (resourceLoadTimeout) {
        clearTimeout(resourceLoadTimeout);
      }
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

  // Handle flapping (modified to respect disabled state)
  const handleFlap = () => {
    // Don't allow flapping if the game is disabled (unless creator)
    if (isPlayDisabled) return;
    
    // If game not yet started, start it
    if (!gameStateRef.current.gameStarted && !gameStateRef.current.gameOver) {
      startGame();
      return;
    }

    // Don't flap if game is over
    if (gameStateRef.current.gameOver) {
      resetGame();
      return;
    }

    // Add flap velocity
    birdRef.current.velocity = FLAP_POWER;
    
    // Play flap sound
    playSoundEffect('start', 0.2);
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
    // Don't allow starting if disabled (unless creator)
    if (isPlayDisabled) return;
    
    if (!gameStateRef.current.gameStarted) {
      // Notify parent component
      onStart();
      
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
      
      // Reset and start game
      birdRef.current.velocity = 0;
      pipesRef.current = [];
      scoreRef.current = 0;
      setScore(0);
      setGameStarted(true);
      setGameOver(false);
      gameStateRef.current = { gameStarted: true, gameOver: false };
      
      // Play start sound
      playSoundEffect('start');
      
      // Start game loop if not already running
      if (!requestIdRef.current) {
        lastTimestampRef.current = 0;
        requestIdRef.current = requestAnimationFrame(updateGame);
      }
      
      // Start pipe generation
      generatePipe();
    }
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
    ctx.fillText('Score: ' + scoreRef.current, 20, 40);
    
    // Draw high score
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.textAlign = 'left';
    ctx.fillText('Best: ' + highScore, 300, 40);
  };

  // Draw functions with fallbacks for missing images
  const drawBird = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const bird = imagesRef.current.bird;
    if (bird) {
      ctx.drawImage(bird, x, y, birdRef.current.width, birdRef.current.height);
    } else {
      // Fallback drawing if image is not loaded
      ctx.fillStyle = '#FFD700'; // Yellow color for bird
      ctx.fillRect(x, y, birdRef.current.width, birdRef.current.height);
    }
  };

  const drawPipe = (ctx: CanvasRenderingContext2D, x: number, topHeight: number, bottomY: number) => {
    const pipeTop = imagesRef.current.pipeTop;
    const pipeBottom = imagesRef.current.pipeBottom;
    
    if (pipeTop && pipeBottom) {
      ctx.drawImage(pipeTop, x, topHeight - 320, PIPE_WIDTH, 320);
      ctx.drawImage(pipeBottom, x, bottomY, PIPE_WIDTH, 320);
    } else {
      // Fallback drawing if images are not loaded
      ctx.fillStyle = '#00AA00'; // Green color for pipes
      ctx.fillRect(x, 0, PIPE_WIDTH, topHeight);
      ctx.fillRect(x, bottomY, PIPE_WIDTH, ctx.canvas.height - bottomY);
    }
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    const background = imagesRef.current.background;
    if (background) {
      ctx.drawImage(background, 0, 0, ctx.canvas.width, ctx.canvas.height);
    } else {
      // Fallback drawing if image is not loaded
      ctx.fillStyle = '#87CEEB'; // Sky blue color
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
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
    drawBackground(ctx);
    
    // Update bird
    const bird = birdRef.current;
    bird.velocity += GRAVITY;
    bird.y += bird.velocity;
    
    // Draw bird with rotation
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.04)));
    
    drawBird(ctx, -bird.width / 2, -bird.height / 2);
    
    ctx.restore();
    
    // Update and draw pipes
    for (let i = 0; i < pipesRef.current.length; i++) {
      const pipe = pipesRef.current[i];
      pipe.x -= PIPE_SPEED;
      
      // Draw top pipe
      drawPipe(ctx, pipe.x, pipe.topHeight, pipe.bottomY);
      
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
          className={`border-4 border-neon-blue rounded-lg shadow-lg shadow-neon-blue/20 max-w-full ${
            isPlayDisabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
          }`} 
          onClick={handleFlap}
        />
        
        {/* Loading indicator */}
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-neon-blue text-xl font-arcade animate-pulse">LOADING...</div>
          </div>
        )}
        
        {/* Disabled overlay */}
        {isPlayDisabled && isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
            <div className="text-center p-4">
              <p className="text-neon-pink text-2xl font-arcade mb-2">ALREADY PLAYED</p>
              <p className="text-white text-sm">You have already played in this room. Each player can only play once per room.</p>
            </div>
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