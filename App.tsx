import React, { useState, useCallback } from 'react';
import { Scenario, GameState, GameHistoryEntry } from './types';
import {
  HORROR_PROMPT,
  THRILLER_PROMPT,
  ROMANCE_PROMPT,
  GAME_PROGRESS_PROMPT,
} from './constants';
import { generateGameResponse, generateImage } from './services/geminiService';
import ScenarioSelection from './components/ScenarioSelection';
import GameScreen from './components/GameScreen';

const App: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [gameHistory, setGameHistory] = useState<{ role: string, parts: { text: string }[] }[]>([]);
  const [displayHistory, setDisplayHistory] = useState<GameHistoryEntry[]>([]);
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
    setDisplayHistory([]);

    try {
      const initialPrompt = getInitialPrompt(selectedScenario);
      const newHistory: { role: string, parts: { text: string }[] }[] = [];
      
      // 1단계: 스토리 생성
      console.log('📝 스토리 생성 중...');
      const responseState = await generateGameResponse(newHistory, initialPrompt, selectedScenario);
      
      // 2단계: 로딩 이미지로 먼저 화면 표시 (사용자는 바로 스토리를 읽을 수 있음)
      const loadingImageUrl = `https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=450&fit=crop&q=80`;
      setCurrentGameState({
        ...responseState,
        imageUrl: loadingImageUrl
      });
      setDisplayHistory([{ playerAction: '게임 시작', gameState: { ...responseState, imageUrl: loadingImageUrl } }]);
      
      setIsLoading(false); // 로딩 종료 - 사용자가 스토리를 읽을 수 있음
      
      // 3단계: 백그라운드에서 실제 AI 이미지 생성
      console.log('🎨 이미지 생성 시작 (백그라운드)...');
      
      // 1.5초 딜레이 (API 과부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const imageUrl = await generateImage(responseState.image_prompt);
        
        // 이미지 생성 완료 후 업데이트
        setCurrentGameState((prev: GameState | null) => {
          if (prev && prev.narrative === responseState.narrative) {
            return { ...prev, imageUrl };
          }
          return prev;
        });
        
        setDisplayHistory((prev: GameHistoryEntry[]) => {
          if (prev.length > 0 && prev[prev.length - 1].gameState.narrative === responseState.narrative) {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = {
              ...newHistory[newHistory.length - 1],
              gameState: { ...newHistory[newHistory.length - 1].gameState, imageUrl }
            };
            return newHistory;
          }
          return prev;
        });
        
        console.log('✅ 이미지 생성 완료!');
      } catch (imageError) {
        console.warn('⚠️ 이미지 생성 실패, placeholder 유지:', imageError);
      }

      const newHistoryWithInitialResponse = [
        ...newHistory,
        { role: 'user' as const, parts: [{ text: initialPrompt }] },
        { role: 'model' as const, parts: [{ text: JSON.stringify(responseState) }] }
      ];
      setGameHistory(newHistoryWithInitialResponse);

    } catch (e) {
      let errorMessage = 'An unknown error occurred';
      
      if (e instanceof Error) {
        if (e.message.includes('overloaded') || e.message.includes('503') || e.message.includes('과부하')) {
          errorMessage = '🔄 AI 서버가 현재 바쁩니다. 잠시 후 다시 시도해주세요. (추천: 한국 낮 시간대 이용)';
        } else if (e.message.includes('quota') || e.message.includes('limit')) {
          errorMessage = '⚠️ API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
        } else if (e.message.includes('API') || e.message.includes('GEMINI_API_KEY')) {
          errorMessage = '🔑 ' + e.message;
        } else {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
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

      // 1단계: 스토리 생성
      console.log('📝 다음 스토리 생성 중...');
      const responseState = await generateGameResponse(gameHistory, userPrompt, scenario);
      
      // 2단계: 로딩 이미지로 먼저 화면 표시
      const loadingImageUrl = `https://images.unsplash.com/photo-${Date.now() % 10000000}?w=800&h=450&fit=crop&q=80`;
      setCurrentGameState({
        ...responseState,
        imageUrl: loadingImageUrl
      });
      setDisplayHistory((prev: GameHistoryEntry[]) => [...prev, { 
        playerAction: action, 
        gameState: { ...responseState, imageUrl: loadingImageUrl } 
      }]);
      
      setIsLoading(false); // 로딩 종료
      
      // 3단계: 백그라운드에서 실제 AI 이미지 생성
      console.log('🎨 이미지 생성 시작 (백그라운드)...');
      
      // 1.5초 딜레이
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      try {
        const imageUrl = await generateImage(responseState.image_prompt);
        
        // 이미지 생성 완료 후 업데이트
        setCurrentGameState((prev: GameState | null) => {
          if (prev && prev.narrative === responseState.narrative) {
            return { ...prev, imageUrl };
          }
          return prev;
        });
        
        setDisplayHistory((prev: GameHistoryEntry[]) => {
          if (prev.length > 0 && prev[prev.length - 1].gameState.narrative === responseState.narrative) {
            const newHistory = [...prev];
            newHistory[newHistory.length - 1] = {
              ...newHistory[newHistory.length - 1],
              gameState: { ...newHistory[newHistory.length - 1].gameState, imageUrl }
            };
            return newHistory;
          }
          return prev;
        });
        
        console.log('✅ 이미지 생성 완료!');
      } catch (imageError) {
        console.warn('⚠️ 이미지 생성 실패, placeholder 유지:', imageError);
      }

      const newHistory = [
          ...gameHistory,
          { role: 'user' as const, parts: [{ text: userPrompt }] },
          { role: 'model' as const, parts: [{ text: JSON.stringify(responseState) }] }
      ];
      setGameHistory(newHistory);
    } catch (e) {
      let errorMessage = 'An unknown error occurred';
      
      if (e instanceof Error) {
        if (e.message.includes('overloaded') || e.message.includes('503') || e.message.includes('과부하')) {
          errorMessage = '🔄 AI 서버가 현재 바쁩니다. 잠시 후 다시 시도해주세요.';
        } else if (e.message.includes('quota') || e.message.includes('limit')) {
          errorMessage = '⚠️ API 사용량 한도에 도달했습니다. 잠시 후 다시 시도해주세요.';
        } else {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [gameHistory, currentGameState, scenario]);

  const handleRestart = () => {
    setScenario(null);
    setCurrentGameState(null);
    setGameHistory([]);
    setDisplayHistory([]);
    setError(null);
  };

  return (
    <div className="min-h-screen font-sans antialiased bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-gray-100">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-5 md:px-10 py-10 max-w-7xl">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 mb-4 drop-shadow-2xl">
            Textify: AI Story Weaver
          </h1>
          <p className="text-purple-200/80 text-lg mt-3 font-light tracking-wide">당신의 선택이 이야기를 만듭니다.</p>
          <div className="h-1 w-32 mx-auto mt-4 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full"></div>
        </header>
        <main>
          {!scenario ? (
            <ScenarioSelection onSelectScenario={handleSelectScenario} />
          ) : (
            <GameScreen
              gameState={currentGameState}
              history={displayHistory}
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
};

export default App;
