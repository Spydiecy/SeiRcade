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
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    // Load images
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

    const handleImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === totalImages) {
        setIsReady(true);
      }
    };

    birdImg.onload = handleImageLoad;
    pipeTopImg.onload = handleImageLoad;
    pipeBottomImg.onload = handleImageLoad;
    backgroundImg.onload = handleImageLoad;

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
      ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);

      if (!gameStarted) {
        // Draw bird stationary
        ctx.drawImage(birdImg, bird.x - bird.width / 2, bird.y - bird.height / 2, bird.width, bird.height);
        
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
      ctx.drawImage(birdImg, -bird.width / 2, -bird.height / 2, bird.width, bird.height);
      ctx.restore();

      // Update pipes
      for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        pipe.x -= PIPE_SPEED;

        // Draw top pipe
        ctx.drawImage(pipeTopImg, pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        
        // Draw bottom pipe
        ctx.drawImage(pipeBottomImg, pipe.x, pipe.bottomY, PIPE_WIDTH, canvas.height - pipe.bottomY);

        // Check if pipe is past the bird
        if (!pipe.counted && pipe.x + PIPE_WIDTH < bird.x) {
          currentScore++;
          setScore(currentScore);
          pipe.counted = true;

          // Add sound effect for scoring
          const scoreSound = new Audio('/sounds/score.mp3');
          scoreSound.volume = 0.3;
          scoreSound.play().catch(() => {}); // Ignore errors from browsers that block autoplay
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
        const startSound = new Audio('/sounds/start.mp3');
        startSound.volume = 0.5;
        startSound.play().catch(() => {}); // Ignore errors from browsers that block autoplay
      }
    };

    const endGame = () => {
      if (!gameOver) {
        setGameOver(true);
        
        // Play crash sound
        const crashSound = new Audio('/sounds/crash.mp3');
        crashSound.volume = 0.5;
        crashSound.play().catch(() => {}); // Ignore errors from browsers that block autoplay
        
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
      ctx.fillText('LOADING...', canvas.width / 2, canvas.height / 2);
    }
  }, [isReady]);

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