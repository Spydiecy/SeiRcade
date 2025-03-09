'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface FlappyBirdProps {
  onGameOver: (score: number) => void;
  onStart: () => void;
}

export default function FlappyBird({ onGameOver, onStart }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Game constants
  const GRAVITY = 0.6;
  const FLAP_POWER = -10;
  const PIPE_SPEED = 3;
  const PIPE_SPAWN_INTERVAL = 1500;
  const PIPE_GAP = 150;
  const PIPE_WIDTH = 80;

  useEffect(() => {
    // Check for high score in local storage
    const storedHighScore = localStorage.getItem('flappyHighScore');
    if (storedHighScore) {
      setHighScore(parseInt(storedHighScore));
    }

    // Set up the game
    const canvas = canvasRef.current;
    if (!canvas) {
      setLoadingError("Canvas element not found");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setLoadingError("Unable to get canvas context");
      return;
    }

    // Game state variables
    let bird = {
      x: canvas.width / 4,
      y: canvas.height / 2,
      velocity: 0,
      width: 40,
      height: 30
    };

    let pipes: {
      x: number;
      topHeight: number;
      bottomY: number;
      counted: boolean;
    }[] = [];

    let animationFrameId: number;
    let pipeSpawnTimerId: NodeJS.Timeout;
    let lastTimestamp = 0;
    let currentScore = 0;

    // Load images with error handling
    const birdImg = new Image();
    const pipeTopImg = new Image();
    const pipeBottomImg = new Image();
    const backgroundImg = new Image();

    birdImg.src = '/images/games/flappy-bird.png';
    pipeTopImg.src = '/images/games/pipe-top.png';
    pipeBottomImg.src = '/images/games/pipe-bottom.png';
    backgroundImg.src = '/images/games/flappy-background.png';

    // Set ready state when images are loaded
    let imagesLoaded = 0;
    const totalImages = 4;
    let failedImages = 0;

    const handleImageLoad = () => {
      imagesLoaded++;
      checkAllImagesLoaded();
    };

    const handleImageError = (e: ErrorEvent, imageName: string) => {
      failedImages++;
      console.error(`Failed to load image: ${imageName}`, e);
      checkAllImagesLoaded();
    };

    const checkAllImagesLoaded = () => {
      // Proceed if all images loaded or all attempts completed
      if (imagesLoaded + failedImages === totalImages) {
        if (failedImages > 0) {
          console.warn(`Some images failed to load (${failedImages}/${totalImages}), but proceeding with game`);
        }
        setIsReady(true);
      }
    };

    birdImg.onload = handleImageLoad;
    pipeTopImg.onload = handleImageLoad;
    pipeBottomImg.onload = handleImageLoad;
    backgroundImg.onload = handleImageLoad;

    birdImg.onerror = (e) => handleImageError(e as ErrorEvent, 'bird');
    pipeTopImg.onerror = (e) => handleImageError(e as ErrorEvent, 'pipeTop');
    pipeBottomImg.onerror = (e) => handleImageError(e as ErrorEvent, 'pipeBottom');
    backgroundImg.onerror = (e) => handleImageError(e as ErrorEvent, 'background');

    // Use fallback colors if images fail to load
    const renderImage = (img: HTMLImageElement, x: number, y: number, width: number, height: number, fallbackColor: string) => {
      if (img.complete && img.naturalHeight !== 0) {
        ctx.drawImage(img, x, y, width, height);
      } else {
        // Fallback rendering
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, width, height);
      }
    };

    // Handle user input
    const handleInput = () => {
      if (!gameStarted) {
        startGame();
      } else if (!gameOver) {
        bird.velocity = FLAP_POWER;
      } else {
        resetGame();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleInput();
      }
    };

    const handleTouch = (e: TouchEvent) => {
      e.preventDefault();
      handleInput();
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      handleInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('click', handleClick);

    // Game loop
    const update = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw background
      renderImage(backgroundImg, 0, 0, canvas.width, canvas.height, '#87CEEB');

      if (!gameStarted) {
        // Draw bird stationary
        renderImage(birdImg, bird.x - bird.width / 2, bird.y - bird.height / 2, bird.width, bird.height, '#FFD700');
        
        // Draw "Press Space to Start" text
        ctx.font = '24px "Press Start 2P", cursive';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText('TAP TO START', canvas.width / 2, canvas.height / 2 + 100);
        
        animationFrameId = requestAnimationFrame(update);
        return;
      }

      // Update bird position
      bird.velocity += GRAVITY;
      bird.y += bird.velocity;

      // Rotate bird based on velocity
      ctx.save();
      ctx.translate(bird.x, bird.y);
      ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.velocity * 0.04)));
      renderImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height, '#FFD700');
      ctx.restore();

      // Update pipes
      for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        pipe.x -= PIPE_SPEED;

        // Draw top pipe
        renderImage(pipeTopImg, pipe.x, 0, PIPE_WIDTH, pipe.topHeight, '#75B855');
        
        // Draw bottom pipe
        renderImage(pipeBottomImg, pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY, '#75B855');

        // Check if pipe is past the bird
        if (!pipe.counted && pipe.x + PIPE_WIDTH < bird.x) {
          currentScore++;
          setScore(currentScore);
          pipe.counted = true;

          // Add sound effect for scoring
          try {
            const scoreSound = new Audio('/sounds/score.wav');
            scoreSound.volume = 0.3;
            scoreSound.play().catch(err => console.warn('Could not play score sound', err));
          } catch (error) {
            console.warn('Error playing score sound', error);
          }
        }

        // Check for collisions
        if (
          bird.x + bird.width / 2 > pipe.x &&
          bird.x - bird.width / 2 < pipe.x + PIPE_WIDTH &&
          (bird.y - bird.height / 2 < pipe.topHeight || bird.y + bird.height / 2 > pipe.bottomY)
        ) {
          endGame();
        }
      }

      // Remove pipes that are off screen
      pipes = pipes.filter(pipe => pipe.x + PIPE_WIDTH > 0);

      // Check for collision with ground or ceiling
      if (bird.y - bird.height / 2 <= 0 || bird.y + bird.height / 2 >= canvas.height) {
        endGame();
      }

      // Draw score
      ctx.font = '30px "Press Start 2P", cursive';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(currentScore.toString(), canvas.width / 2, 50);

      if (gameOver) {
        // Draw game over screen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '40px "Press Start 2P", cursive';
        ctx.fillStyle = '#FF0000';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);
        
        ctx.font = '20px "Press Start 2P", cursive';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`Score: ${currentScore}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`High Score: ${Math.max(highScore, currentScore)}`, canvas.width / 2, canvas.height / 2 + 40);
        
        ctx.font = '16px "Press Start 2P", cursive';
        ctx.fillText('TAP TO RESTART', canvas.width / 2, canvas.height / 2 + 100);
      }

      animationFrameId = requestAnimationFrame(update);
    };

    // Generate pipes
    const generatePipe = () => {
      if (gameStarted && !gameOver) {
        const minHeight = 50;
        const maxHeight = canvas.height - PIPE_GAP - minHeight;
        const topHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
        
        pipes.push({
          x: canvas.width,
          topHeight,
          bottomY: topHeight + PIPE_GAP,
          counted: false
        });
        
        pipeSpawnTimerId = setTimeout(generatePipe, PIPE_SPAWN_INTERVAL);
      }
    };

    const startGame = () => {
      if (!gameStarted) {
        setGameStarted(true);
        setGameOver(false);
        onStart();
        
        // Reset game state
        bird = {
          x: canvas.width / 4,
          y: canvas.height / 2,
          velocity: 0,
          width: 40,
          height: 30
        };
        pipes = [];
        currentScore = 0;
        setScore(0);
        
        // Start generating pipes
        generatePipe();
        
        // Play start sound
        try {
          const startSound = new Audio('/sounds/start.wav');
          startSound.volume = 0.5;
          startSound.play().catch(err => console.warn('Could not play start sound', err));
        } catch (error) {
          console.warn('Error playing start sound', error);
        }
      }
    };

    const endGame = () => {
      if (!gameOver) {
        setGameOver(true);
        
        // Play crash sound
        try {
          const crashSound = new Audio('/sounds/crash.wav');
          crashSound.volume = 0.5;
          crashSound.play().catch(err => console.warn('Could not play crash sound', err));
        } catch (error) {
          console.warn('Error playing crash sound', error);
        }
        
        // Update high score
        if (currentScore > highScore) {
          setHighScore(currentScore);
          localStorage.setItem('flappyHighScore', currentScore.toString());
        }
        
        // Notify parent component
        onGameOver(currentScore);
        
        // Clear pipe generation interval
        clearTimeout(pipeSpawnTimerId);
      }
    };

    const resetGame = () => {
      setGameStarted(false);
      setGameOver(false);
      setScore(0);
      lastTimestamp = 0;
    };

    // Start animation loop
    animationFrameId = requestAnimationFrame(update);

    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animationFrameId);
      clearTimeout(pipeSpawnTimerId);
    };
  }, []);

  // Draw loading screen
  useEffect(() => {
    if (!isReady) {
      const canvas = canvasRef.current;
      if (!canvas) return;
  
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.font = '20px "Press Start 2P", cursive';
      ctx.fillStyle = '#00f3ff';
      ctx.textAlign = 'center';
      ctx.fillText(loadingError || 'LOADING...', canvas.width / 2, canvas.height / 2);
    }
  }, [isReady, loadingError]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} 
          className="border-4 border-neon-blue rounded-lg shadow-lg shadow-neon-blue/20 max-w-full" 
        />
        
        <div className="absolute top-0 left-0 m-4 flex gap-2 items-center">
          <div className="bg-black/70 text-neon-green font-arcade text-xs px-3 py-1 rounded-md">
            Score: {score}
          </div>
          <div className="bg-black/70 text-neon-pink font-arcade text-xs px-3 py-1 rounded-md">
            Best: {highScore}
          </div>
        </div>
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