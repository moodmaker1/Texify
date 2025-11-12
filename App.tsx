import React, { useState, useCallback } from 'react';
import { Scenario, GameState } from './types';
import {
  HORROR_PROMPT,
  THRILLER_PROMPT,
  ROMANCE_PROMPT,
  GAME_PROGRESS_PROMPT,
} from './constants';
import { generateGameResponse, generateImage, enhanceImagePrompt } from './services/geminiService';
import ScenarioSelection from './components/ScenarioSelection';
import GameScreen from './components/GameScreen';

function App() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [gameHistory, setGameHistory] = useState<{ role: string, parts: { text: string }[] }[]>([]);
  const [currentGameState, setCurrentGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitialPrompt = (selectedScenario: Scenario): string => {
    switch (selectedScenario) {
      case Scenario.Horror:
        return HORROR_PROMPT;
      case Scenario.Thriller:
        return THRILLER_PROMPT;
      case Scenario.Romance:
        return ROMANCE_PROMPT;
      default:
        throw new Error('Invalid scenario selected');
    }
  };

  const handleSelectScenario = useCallback(async (selectedScenario: Scenario) => {
    setIsLoading(true);
    setError(null);
    setScenario(selectedScenario);
    setCurrentGameState(null);
    setGameHistory([]);

    try {
      const initialPrompt = getInitialPrompt(selectedScenario);
      const newHistory: { role: string, parts: { text: string }[] }[] = [];
      
      const responseState = await generateGameResponse(newHistory, initialPrompt, selectedScenario);
      
      const enhancedPrompt = await enhanceImagePrompt(responseState.narrative, responseState.image_prompt, selectedScenario);
      responseState.image_prompt = enhancedPrompt;
      
      const imageUrl = await generateImage(enhancedPrompt);
      responseState.imageUrl = imageUrl;
      
      setCurrentGameState(responseState);

      const newHistoryWithInitialResponse = [
        ...newHistory,
        { role: 'user' as const, parts: [{ text: initialPrompt }] },
        { role: 'model' as const, parts: [{ text: JSON.stringify(responseState) }] }
      ];
      setGameHistory(newHistoryWithInitialResponse);

    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePlayerAction = useCallback(async (action: string) => {
    if (!action.trim() || !currentGameState || !scenario) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const statsString = Object.entries(currentGameState.stats)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      const userPrompt = GAME_PROGRESS_PROMPT
        .replace('{NARRATIVE}', currentGameState.narrative)
        .replace('{STATS}', statsString)
        .replace('{PLAYER_ACTION}', action);

      const responseState = await generateGameResponse(gameHistory, userPrompt, scenario);
      
      const enhancedPrompt = await enhanceImagePrompt(responseState.narrative, responseState.image_prompt, scenario);
      responseState.image_prompt = enhancedPrompt;
      
      const imageUrl = await generateImage(enhancedPrompt);
      responseState.imageUrl = imageUrl;
      
      setCurrentGameState(responseState);

      const newHistory = [
          ...gameHistory,
          { role: 'user' as const, parts: [{ text: userPrompt }] },
          { role: 'model' as const, parts: [{ text: JSON.stringify(responseState) }] }
      ];
      setGameHistory(newHistory);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unknown error occurred');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [gameHistory, currentGameState, scenario]);

  const handleRestart = () => {
    setScenario(null);
    setCurrentGameState(null);
    setGameHistory([]);
    setError(null);
  };

  return (
    <div className="text-gray-800 min-h-screen font-sans antialiased">
      <div className="container mx-auto px-5 md:px-10 py-10 max-w-7xl">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-800 to-slate-900">
            Textify: AI Story Weaver
          </h1>
          <p className="text-gray-600 mt-2">당신의 선택이 이야기를 만듭니다.</p>
        </header>
        <main>
          {!scenario ? (
            <ScenarioSelection onSelectScenario={handleSelectScenario} />
          ) : (
            <GameScreen
              gameState={currentGameState}
              isLoading={isLoading}
              onPlayerAction={handlePlayerAction}
              onRestart={handleRestart}
              error={error}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;