'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AIChallengeProps {
  onGameOver: (score: number) => void;
  onStart: () => void;
}

export default function AIChallenge({ onGameOver, onStart }: AIChallengeProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready');
  const [targetWord, setTargetWord] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string>('');
  const [aiResponses, setAiResponses] = useState<{message: string, timestamp: string}[]>([]);
  const [timer, setTimer] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wordList, setWordList] = useState<string[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responsesRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Target word categories and difficulty levels
  const wordCategories = {
    easy: [
      'banana', 'apple', 'orange', 'pizza', 'music', 
      'happy', 'smile', 'party', 'dance', 'beach',
      'summer', 'winter', 'movie', 'cookie', 'dragon',
      'planet', 'forest', 'garden', 'castle', 'island'
    ],
    medium: [
      'elephant', 'symphony', 'detective', 'adventure', 'telescope',
      'carnival', 'waterfall', 'dinosaur', 'marathon', 'treasure',
      'journey', 'pyramid', 'volcano', 'symphony', 'orchestra',
      'diamond', 'mystery', 'festival', 'blossom', 'horizon'
    ],
    hard: [
      'algorithm', 'philosophy', 'serendipity', 'kaleidoscope', 'quintessential',
      'perpendicular', 'extraordinary', 'circumference', 'spontaneous', 'fluorescent',
      'juxtaposition', 'mathematical', 'ambidextrous', 'clandestine', 'photosynthesis',
      'chrysanthemum', 'hippopotamus', 'reconnaissance', 'phenomenon', 'hieroglyphics'
    ]
  };

  // Initialize the game
  useEffect(() => {
    // Combine all difficulty levels
    const allWords = [
      ...wordCategories.easy,
      ...wordCategories.medium,
      ...wordCategories.hard
    ];
    
    // Shuffle words
    const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);
    setWordList(shuffledWords);
    
    return () => {
      // Clean up timer on unmount
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Start a new game
  const startGame = () => {
    // Select a random word from the list
    const randomIndex = Math.floor(Math.random() * wordList.length);
    const newTargetWord = wordList[randomIndex];
    
    setTargetWord(newTargetWord);
    setAiResponses([]);
    setTimer(60);
    setScore(0);
    setGameState('playing');
    onStart();
    
    // Focus the input
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    // Start the timer
    timerIntervalRef.current = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          endGame(0);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
  };

  // End the game
  const endGame = (finalScore: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    
    setGameState('gameOver');
    onGameOver(finalScore);
  };

  // Reset the game
  const resetGame = () => {
    setGameState('ready');
    setUserMessage('');
    setAiResponses([]);
  };

  // Handle user message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userMessage.trim() || isLoading || gameState !== 'playing') return;
    
    setIsLoading(true);
    
    // Add user message to the conversation
    const newResponses = [
      ...aiResponses, 
      { 
        message: `You: ${userMessage}`, 
        timestamp: new Date().toLocaleTimeString() 
      }
    ];
    setAiResponses(newResponses);
    
    try {
      // Call Gemini API (using a simulated request for now)
      const aiResponse = await simulateGeminiAPI(userMessage, targetWord);
      
      // Add AI response to the conversation
      setAiResponses([
        ...newResponses, 
        { 
          message: `AI: ${aiResponse}`, 
          timestamp: new Date().toLocaleTimeString() 
        }
      ]);
      
      // Check if the AI said the target word
      if (containsTargetWord(aiResponse, targetWord)) {
        // Calculate score based on remaining time
        const timeBonus = Math.floor(timer * 1.5);
        const finalScore = 100 + timeBonus;
        
        // Update score
        setScore(finalScore);
        
        // End game with success
        endGame(finalScore);
      }
      
      // Clear user message
      setUserMessage('');
      
    } catch (error) {
      console.error('Error communicating with AI:', error);
      setAiResponses([
        ...newResponses, 
        { 
          message: 'AI: Sorry, I encountered an error. Please try again.', 
          timestamp: new Date().toLocaleTimeString() 
        }
      ]);
    } finally {
      setIsLoading(false);
      
      // Scroll to the bottom of the conversation
      if (responsesRef.current) {
        responsesRef.current.scrollTop = responsesRef.current.scrollHeight;
      }
      
      // Focus the input again
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Function to simulate Gemini API response (in production, this would call the actual API)
  const simulateGeminiAPI = async (message: string, targetWord: string): Promise<string> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Basic response logic - in a real implementation, this would call the Gemini API
    const lowerMessage = message.toLowerCase();
    const lowerTarget = targetWord.toLowerCase();
    
    // If the user mentions the word directly, the AI tries to avoid it
    if (lowerMessage.includes(lowerTarget)) {
      return `I notice you're mentioning "${targetWord}". I'd rather talk about something else.`;
    }
    
    // If the user is trying to trick the AI directly
    if (lowerMessage.includes('say') || lowerMessage.includes('repeat') || lowerMessage.includes('write')) {
      return "I'm not going to simply repeat words you ask me to say. Let's have a real conversation!";
    }
    
    // Randomly decide if the AI will say the target word (more likely as the game progresses)
    // This makes the game challenging but winnable
    const timeLeft = timer;
    const chanceToSayWord = Math.max(0.1, Math.min(0.8, 1 - (timeLeft / 60)));
    
    if (Math.random() < chanceToSayWord) {
      // Generate a response that naturally includes the target word
      const responses = [
        `I was thinking about ${targetWord} the other day. It's quite interesting.`,
        `Have you ever considered how important ${targetWord} is in our daily lives?`,
        `That reminds me of something related to ${targetWord}.`,
        `Interesting question! It makes me think about ${targetWord}.`,
        `I believe ${targetWord} could be relevant to this discussion.`
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Otherwise, give a normal response that avoids the target word
    const normalResponses = [
      "That's an interesting point. Can you tell me more?",
      "I'm not sure I understand what you're getting at. Could you elaborate?",
      "I find that topic quite fascinating. What else would you like to discuss?",
      "That's a good question. I'd need to think about it more.",
      "I appreciate your perspective on this matter. Let's continue our conversation.",
      "I'm enjoying our discussion. What else is on your mind?",
      "Could you share more of your thoughts on this subject?",
      "I'm curious to hear more about your viewpoint.",
      "Let's explore this topic further. What specific aspects interest you?",
      "That's a unique way of looking at things. I'd like to hear more."
    ];
    
    return normalResponses[Math.floor(Math.random() * normalResponses.length)];
  };

  // Check if the AI response contains the target word
  const containsTargetWord = (response: string, word: string): boolean => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(response);
  };

  // Format the timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine the difficulty of the target word
  const getWordDifficulty = (word: string): 'easy' | 'medium' | 'hard' => {
    if (wordCategories.easy.includes(word)) return 'easy';
    if (wordCategories.medium.includes(word)) return 'medium';
    return 'hard';
  };

  // Get color based on difficulty
  const getDifficultyColor = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    if (difficulty === 'easy') return 'text-neon-green';
    if (difficulty === 'medium') return 'text-neon-blue';
    return 'text-neon-pink';
  };

  // Get time color based on remaining time
  const getTimeColor = (time: number): string => {
    if (time > 30) return 'text-neon-green';
    if (time > 10) return 'text-neon-blue';
    return 'text-neon-pink';
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-black/60 border-2 border-neon-blue rounded-lg p-4 md:p-6 shadow-lg shadow-neon-blue/20">
        {/* Game header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-arcade text-xl text-neon-blue">AI CHALLENGE</h2>
          
          {gameState === 'playing' && (
            <div className="flex gap-4 items-center">
              <div className={`font-arcade ${getTimeColor(timer)} px-3 py-1 bg-black/80 rounded-md`}>
                TIME: {formatTime(timer)}
              </div>
              <div className="font-arcade text-neon-green px-3 py-1 bg-black/80 rounded-md">
                SCORE: {score}
              </div>
            </div>
          )}
        </div>
        
        {/* Game content based on state */}
        {gameState === 'ready' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <h3 className="font-arcade text-2xl text-neon-pink mb-4">READY TO PLAY?</h3>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Your challenge is to trick the AI into saying a specific word. You'll have 60 seconds to accomplish this task!
            </p>
            
            <button 
              onClick={startGame}
              className="arcade-button-glow-green"
            >
              START GAME
            </button>
          </motion.div>
        )}
        
        {gameState === 'playing' && (
          <div>
            <div className="bg-black/80 border border-neon-pink p-4 rounded-md mb-4 text-center">
              <p className="text-gray-300 mb-2">Your target word is:</p>
              <h3 className="font-arcade text-2xl mb-2">
                <span className={getDifficultyColor(getWordDifficulty(targetWord))}>
                  {targetWord.toUpperCase()}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Try to make the AI say this word without using it yourself
              </p>
            </div>
            
            <div 
              ref={responsesRef}
              className="bg-gray-900/50 rounded-md p-4 h-64 overflow-y-auto mb-4"
            >
              {aiResponses.length === 0 ? (
                <div className="text-center text-gray-500 h-full flex items-center justify-center">
                  <p>Begin the conversation to trick the AI!</p>
                </div>
              ) : (
                aiResponses.map((response, index) => (
                  <div key={index} className="mb-3">
                    <div className={`${
                      response.message.startsWith('You:') 
                        ? 'text-neon-green' 
                        : 'text-neon-blue'
                    } text-sm`}>
                      {response.message}
                    </div>
                    <div className="text-gray-500 text-xs">{response.timestamp}</div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="text-neon-blue text-sm">
                  AI is thinking<span className="typing-dots"></span>
                </div>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <textarea
                ref={inputRef}
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-grow bg-black border-2 border-neon-green text-white p-2 rounded-md focus:outline-none focus:border-neon-blue resize-none"
                rows={2}
                disabled={isLoading || gameState !== 'playing'}
              />
              <button 
                type="submit"
                className="arcade-button-green self-end"
                disabled={isLoading || !userMessage.trim() || gameState !== 'playing'}
              >
                SEND
              </button>
            </form>
          </div>
        )}
        
        {gameState === 'gameOver' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            {score > 0 ? (
              <>
                <h3 className="font-arcade text-2xl text-neon-green mb-4">SUCCESS!</h3>
                <p className="text-gray-300 mb-2">
                  You successfully tricked the AI into saying "{targetWord}"!
                </p>
                <p className="text-xl font-arcade text-neon-pink mb-8">
                  SCORE: {score}
                </p>
              </>
            ) : (
              <>
                <h3 className="font-arcade text-2xl text-neon-pink mb-4">TIME'S UP!</h3>
                <p className="text-gray-300 mb-8">
                  You couldn't trick the AI into saying "{targetWord}".
                </p>
              </>
            )}
            
            <button 
              onClick={resetGame}
              className="arcade-button-glow-blue"
            >
              PLAY AGAIN
            </button>
          </motion.div>
        )}
      </div>
      
      <div className="mt-6 text-center text-gray-300 max-w-md mx-auto">
        <h3 className="font-arcade text-neon-blue mb-2">HOW TO PLAY</h3>
        <p className="text-sm mb-2">
          Your goal is to trick the AI into saying the target word, without using the word yourself.
        </p>
        <p className="text-sm">
          Ask clever questions or make statements that might lead the AI to use that specific word in its response.
        </p>
      </div>
    </div>
  );
}