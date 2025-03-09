'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface AIChallengeProps {
  onGameOver: (score: number) => void;
  onStart: () => void;
  disabled?: boolean; // Indicates if the player has already played in this room
  isCreator?: boolean; // Indicates if the player created this room
}

// Import Google Generative AI library
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export default function AIChallenge({ onGameOver, onStart, disabled = false, isCreator = false }: AIChallengeProps) {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'gameOver'>('ready');
  const [targetWord, setTargetWord] = useState<string>('');
  const [userMessage, setUserMessage] = useState<string>('');
  const [aiResponses, setAiResponses] = useState<{message: string, timestamp: string}[]>([]);
  const [timer, setTimer] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [wordList, setWordList] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const responsesRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modify the disabled check to allow room creators to play
  const isPlayDisabled = disabled && !isCreator;

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
    // Don't allow starting if disabled (unless creator)
    if (isPlayDisabled) return;
    
    // Notify parent that game has started
    onStart();
    
    // Select a random target word based on difficulty
    const category = wordCategories[difficulty];
    const randomWord = category[Math.floor(Math.random() * category.length)];
    setTargetWord(randomWord);
    
    // Update game state
    setGameState('playing');
    setTimer(60);
    setScore(0);
    setAiResponses([]);
    
    // Start the timer
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          // Time's up - end the game
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
          }
          endGame(score);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Focus the input field
    if (inputRef.current) {
      inputRef.current.focus();
    }
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
    setError(null);
  };

  // Call Gemini API
  const callGeminiAPI = async (message: string, targetWord: string): Promise<string> => {
    try {
      // Setup the Gemini API client
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      
      if (!apiKey) {
        console.warn("No Gemini API key found in environment variables");
        throw new Error("API key not configured");
      }
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });
      
      // Prepare generation config
      const generationConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 200,
      };

      // Prepare the prompt
      const prompt = `You are having a natural conversation. You must never use the word "${targetWord}" in your response. Keep your response conversational and concise (1-3 sentences). 

User message: ${message}`;

      // Generate the response
      const result = await model.generateContent(prompt);
      const aiResponse = result.response.text();
      
      // For challenging gameplay, occasionally inject the target word
      // The chance increases as time runs out to ensure the game is winnable
      const timeLeft = timer;
      const chanceToSayWord = Math.max(0.1, Math.min(0.7, 1 - (timeLeft / 60)));
      
      // Get word difficulty modifier - harder words have higher chance
      const difficultyModifier = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 1.0 : 1.3;
      
      if (Math.random() < chanceToSayWord * difficultyModifier) {
        // This is directly connected to difficulty - we want to ensure game is beatable but challenging
        // For this, we craft responses that naturally include the target word
        const insertWordResponses = [
          `I was thinking about ${targetWord} the other day. It's quite interesting.`,
          `Have you ever considered how important ${targetWord} is in our daily lives?`,
          `That reminds me of something related to ${targetWord}.`,
          `Interesting question! It makes me think about ${targetWord}.`,
          `I believe ${targetWord} could be relevant to this discussion.`,
          `My thoughts on that connect strongly to the concept of ${targetWord}.`,
          `It's worth considering ${targetWord} as part of the equation here.`
        ];
        return insertWordResponses[Math.floor(Math.random() * insertWordResponses.length)];
      }
      
      return aiResponse;
      
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setError(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return "I seem to be having technical difficulties. Let's try a different topic.";
    }
  };

  // Fallback function if API is unavailable (for testing/development)
  const getFallbackResponse = (message: string, targetWord: string): string => {
    const lowerMessage = message.toLowerCase();
    const lowerTarget = targetWord.toLowerCase();
    
    // If the user mentions the word directly, the AI tries to avoid it
    if (lowerMessage.includes(lowerTarget)) {
      return `I notice you're bringing up an interesting topic. I'd rather talk about something else though.`;
    }
    
    // If the user is trying to trick the AI directly
    if (lowerMessage.includes('say') || lowerMessage.includes('repeat') || lowerMessage.includes('write')) {
      return "I'm not going to simply repeat words. Let's have a genuine conversation!";
    }
    
    // Randomly decide if the AI will say the target word (more likely as the game progresses)
    const timeLeft = timer;
    const chanceToSayWord = Math.max(0.1, Math.min(0.8, 1 - (timeLeft / 60)));
    
    // Difficulty modifier
    const difficultyModifier = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 1.0 : 1.3;
    
    if (Math.random() < chanceToSayWord * difficultyModifier) {
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
      // First check if the user is directly asking for the target word
      const lowerMessage = userMessage.toLowerCase();
      const lowerTarget = targetWord.toLowerCase();
      
      // If the user message contains the target word, immediately penalize
      if (lowerMessage.includes(lowerTarget)) {
        setAiResponses([
          ...newResponses, 
          { 
            message: `AI: I notice you used the word "${targetWord}" yourself! That's against the rules.`, 
            timestamp: new Date().toLocaleTimeString() 
          }
        ]);
      } else {
        // Call Gemini API (or fallback if API key is not set)
        let aiResponse;
        try {
          aiResponse = await callGeminiAPI(userMessage, targetWord);
        } catch (apiError) {
          console.warn("Using fallback due to API error:", apiError);
          aiResponse = getFallbackResponse(userMessage, targetWord);
        }
        
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
          // Calculate score based on remaining time and difficulty
          const timeBonus = Math.floor(timer * 1.5);
          const difficultyBonus = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 200;
          const finalScore = 100 + timeBonus + difficultyBonus;
          
          // Update score
          setScore(finalScore);
          
          // Wait a moment before ending the game so the user can see they succeeded
          setTimeout(() => {
            // End game with success
            endGame(finalScore);
          }, 1500);
        }
      }
      
      // Clear user message
      setUserMessage('');
      
    } catch (error) {
      console.error('Error in AI Challenge game:', error);
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
    <div className={`w-full max-w-3xl mx-auto ${isPlayDisabled ? 'opacity-70' : ''}`}>
      {/* Game header */}
      <div className="bg-black/50 rounded-t-lg border-t border-l border-r border-neon-blue p-4 mb-0">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-arcade text-neon-blue">AI CHALLENGE</h2>
          
          {gameState === 'playing' && (
            <div className={`px-3 py-1 rounded-full font-mono ${getTimeColor(timer)}`}>
              {formatTime(timer)}
            </div>
          )}
        </div>
        
        {gameState === 'playing' ? (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div>
              <span className="text-gray-400 text-sm">Target Word: </span>
              <span className={`font-bold ${getDifficultyColor(getWordDifficulty(targetWord))}`}>
                {targetWord}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">Score: </span>
              <span className="text-neon-green">{score}</span>
            </div>
          </div>
        ) : gameState === 'gameOver' ? (
          <div className="text-center">
            <div className="text-gray-300 text-sm">Game Over! Final Score: <span className="text-neon-green font-bold">{score}</span></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
            <div className="flex items-center">
              <span className="text-gray-400 text-sm mr-2">Difficulty:</span>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                disabled={isPlayDisabled}
                className="bg-black border border-neon-blue rounded px-2 py-1 text-white text-sm"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button 
              onClick={startGame}
              disabled={isPlayDisabled}
              className={`arcade-button-blue text-sm py-1 px-4 ${isPlayDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              START GAME
            </button>
          </div>
        )}
      </div>
      
      {/* Disabled overlay */}
      {isPlayDisabled && (
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-black/80 z-10 flex items-center justify-center rounded-lg border border-neon-pink">
            <div className="text-center p-4">
              <p className="text-neon-pink text-xl font-arcade mb-2">ALREADY PLAYED</p>
              <p className="text-white text-sm">You have already played in this room. Each player can only play once per room.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Rest of the component */}
      <div className="bg-black/60 border-2 border-neon-blue rounded-lg p-4 md:p-6 shadow-lg shadow-neon-blue/20">
        {/* Game content based on state */}
        {gameState === 'ready' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <h3 className="font-arcade text-2xl text-neon-pink mb-4">READY TO PLAY?</h3>
            <p className="text-gray-300 mb-6 max-w-lg mx-auto">
              Your challenge is to trick the AI into saying a specific word. You'll have 60 seconds to accomplish this task!
            </p>
            
            {error && (
              <div className="mt-4 text-red-400 text-sm">
                {error}
              </div>
            )}
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
        
        {error && gameState === 'playing' && (
          <div className="mt-4 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}