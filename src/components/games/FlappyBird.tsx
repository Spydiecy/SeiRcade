'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FlappyBirdProps {
  onGameOver: (score: number) => void;
  onStart: () => void;
  disabled?: boolean; // Indicates if the player has already played in this room
  isCreator?: boolean; // Indicates if the player created this room
  inRoom?: boolean; // Indicates if the game is being played in a room
}

export default function FlappyBird({ onGameOver, onStart, disabled = false, isCreator = false, inRoom = false }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestIdRef = useRef<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(1);
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

  const scoreRef = useRef(1);
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

  // Modify the disabled check to only apply when in a room
  const isPlayDisabled = inRoom && disabled && !isCreator;

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
    if (!isReady || gameStateRef.current.gameStarted) return;
    
    // Call the onStart callback
    onStart();
    
    // Reset game state
    setGameOver(false);
    gameStateRef.current.gameOver = false;
    setGameStarted(true);
    gameStateRef.current.gameStarted = true;
    
    // Reset score to 1 (instead of 0)
    scoreRef.current = 1;
    setScore(1);
    
    // Reset pipes
    pipesRef.current = [];
    
    // Reset bird position
    birdRef.current.y = 200;
    birdRef.current.velocity = 0;
    
    // Play start sound
    playSoundEffect('start');
    
    // Generate first pipe after a delay
    pipeSpawnTimerRef.current = setTimeout(generatePipe, PIPE_SPAWN_INTERVAL);
    
    // Start game loop
    if (requestIdRef.current === null) {
      requestIdRef.current = requestAnimationFrame(updateGame);
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
    setScore(1);
    scoreRef.current = 1;
    
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
    drawBackground(ctx);
    
    // Draw border
    ctx.strokeStyle = 'rgba(0, 225, 255, 0.8)'; // neon blue
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // Add arcade-style scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < canvas.height; i += 4) {
      ctx.fillRect(0, i, canvas.width, 2);
    }
    
    // Draw bird in center
    const birdX = canvas.width / 4;
    const birdY = canvas.height / 2;
    drawBird(ctx, birdX, birdY);
    
    // Add glowing effect with shadow
    ctx.shadowColor = 'rgba(0, 225, 255, 0.8)';
    ctx.shadowBlur = 10;
    
    // Draw score
    ctx.font = '24px "Press Start 2P", cursive';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';
    ctx.fillText('Score: 1', 20, 40);
    ctx.fillText('Best: ' + highScore, 300, 40);
    
    // Remove shadow for other elements
    ctx.shadowBlur = 0;
    
    // Draw title with arcade style
    ctx.textAlign = 'center';
    ctx.font = '40px "Press Start 2P", cursive';
    ctx.fillStyle = '#FFD700'; // Gold color
    ctx.fillText('FLAPPY BIRD', canvas.width / 2, canvas.height / 3 - 10);
    
    // Add subtitle
    ctx.font = '14px "Press Start 2P", cursive';
    ctx.fillStyle = '#FF00FF'; // Magenta
    ctx.fillText('ARCADE EDITION', canvas.width / 2, canvas.height / 3 + 20);
    
    // Draw instructions box with glow effect
    const boxWidth = 500;
    const boxHeight = 120;
    const boxX = (canvas.width - boxWidth) / 2;
    const boxY = canvas.height / 2 + 20;
    
    // Draw box with glow
    ctx.shadowColor = 'rgba(0, 225, 255, 0.5)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.shadowBlur = 0;
    
    // Draw border
    ctx.strokeStyle = '#FF00FF'; // Magenta border
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
    
    // Draw instructions
    ctx.font = '18px "Press Start 2P", cursive';
    ctx.fillStyle = 'white';
    
    if (isPlayDisabled) {
      // Show message if player has already played in this room
      ctx.fillText('You have already played in this room', canvas.width / 2, boxY + 40);
      ctx.fillText('Waiting for results...', canvas.width / 2, boxY + 80);
    } else if (inRoom && isCreator) {
      // Show special message for room creator
      ctx.fillText('You are the room creator', canvas.width / 2, boxY + 40);
      ctx.fillText('Click or press SPACE to set your score!', canvas.width / 2, boxY + 80);
    } else {
      // Normal play instructions
      ctx.fillText('Click or press SPACE to start', canvas.width / 2, boxY + 40);
      ctx.fillText('Avoid the pipes!', canvas.width / 2, boxY + 80);
    }
    
    // Draw pulsing "PRESS SPACE" text
    if (!isPlayDisabled) {
      const now = Date.now();
      // Pulsing effect
      const pulse = Math.sin(now / 300) * 0.2 + 0.8;
      
      ctx.font = '24px "Press Start 2P", cursive';
      ctx.fillStyle = `rgba(255, 255, 0, ${pulse})`; // Yellow with pulsing opacity
      ctx.fillText('PRESS SPACE', canvas.width / 2, canvas.height - 60);
    }
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
      // Draw game over screen with better styling
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add arcade scanlines
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      for (let i = 0; i < canvas.height; i += 4) {
        ctx.fillRect(0, i, canvas.width, 2);
      }
      
      // Draw game over text with glow
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(255, 0, 0, 0.8)';
      ctx.shadowBlur = 15;
      ctx.font = '40px "Press Start 2P", cursive';
      ctx.fillStyle = '#FF4444';
      ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 70);
      ctx.shadowBlur = 0;
      
      // Draw score box with glow
      const boxWidth = 350;
      const boxHeight = 180;
      const boxX = (canvas.width - boxWidth) / 2;
      const boxY = canvas.height / 2 - 30;
      
      // Draw box with glow
      ctx.shadowColor = 'rgba(0, 225, 255, 0.5)';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
      ctx.shadowBlur = 0;
      
      // Draw border
      ctx.strokeStyle = '#00FFFF'; // Cyan border
      ctx.lineWidth = 2;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
      
      // Show score
      ctx.font = '24px "Press Start 2P", cursive';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`FINAL SCORE: ${scoreRef.current}`, canvas.width / 2, boxY + 50);
      
      // Show high score with highlight if it's a new record
      if (scoreRef.current >= highScore) {
        ctx.fillStyle = '#FFFF00'; // Yellow for new high score
        ctx.fillText(`NEW HIGH SCORE!`, canvas.width / 2, boxY + 100);
      } else {
        ctx.fillStyle = '#00FF00'; // Green
        ctx.fillText(`HIGH SCORE: ${highScore}`, canvas.width / 2, boxY + 100);
      }
      
      // Show different messages based on playing in a room
      if (inRoom) {
        // Message for room play
        ctx.fillStyle = '#FFA500'; // Orange
        ctx.fillText('SCORE SUBMITTED', canvas.width / 2, canvas.height / 2 + 120);
      } else {
        // Pulsing restart message for normal play
        const now = Date.now();
        const pulse = Math.sin(now / 300) * 0.2 + 0.8;
        
        ctx.fillStyle = `rgba(0, 255, 255, ${pulse})`; // Cyan with pulsing opacity
        ctx.fillText('TAP TO RESTART', canvas.width / 2, canvas.height / 2 + 120);
      }
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