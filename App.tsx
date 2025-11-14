import React, { useState, useCallback, useEffect } from 'react';
import { Scenario, GameState, GameHistoryEntry, SuggestedAction, StatChangeInfo, EndingCollectionItem, EndingType } from './types';
import {
  HORROR_PROMPT,
  THRILLER_PROMPT,
  ROMANCE_PROMPT,
  GAME_PROGRESS_PROMPT,
  TIMER_DURATION,
  TIMEOUT_ENDINGS,
  TOTAL_STAGES,
  STAGE_TITLES,
  STAT_THRESHOLDS,
  INSTANT_DEATH_ENDINGS,
  PASSIVITY_ENDINGS,
  TRUTH_FRAGMENTS,
  TRUE_ENDING_CONDITIONS,
  EXTREME_STAT_ENDINGS,
  HIDDEN_ENDINGS,
} from './constants';
import { generateGameResponse, generateImage } from './services/geminiService';
import { soundManager } from './services/soundManager';
import ScenarioSelection from './components/ScenarioSelection';
import GameScreen from './components/GameScreen';
import TimerIntroModal from './components/TimerIntroModal';
import TruthFragmentDiscoveryModal from './components/TruthFragmentDiscoveryModal';
import IntroVideoModal from './components/IntroVideoModal';
import SoundControl from './components/SoundControl';
import StatGuideModal from './components/StatGuideModal';

const App: React.FC = () => {
  const [scenario, setScenario] = useState<Scenario | null>(null);

  // 시나리오별 placeholder 이미지 반환
  const getPlaceholderImage = (selectedScenario: Scenario): string => {
    switch (selectedScenario) {
      case Scenario.Horror:
        return '/horror-thumbnail.png';
      case Scenario.Thriller:
        return '/thriller-thumbnail.png';
      case Scenario.Romance:
        return '/romance-thumbnail.png';
      default:
        return '/horror-thumbnail.png';
    }
  };
  const [gameHistory, setGameHistory] = useState<{ role: string, parts: { text: string }[] }[]>([]);
  const [displayHistory, setDisplayHistory] = useState<GameHistoryEntry[]>([]);
  const [currentGameState, setCurrentGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 🆕 턴 수 추적
  const [turnCount, setTurnCount] = useState(0);
  
  // 스탯 변화 추적 (한 번만 표시되도록 가드)
  const [recentStatChanges, setRecentStatChanges] = useState<StatChangeInfo | null>(null);
  const [isShowingStatChange, setIsShowingStatChange] = useState(false);
  
  // 타이머 상태
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showTimerIntro, setShowTimerIntro] = useState(false);
  
  // 인트로 동영상 상태
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  
  // 🆕 엔딩 컬렉션 상태
  const [endingCollection, setEndingCollection] = useState<EndingCollectionItem[]>([]);
  
  // 🆕 모달 상태
  const [showStatGuide, setShowStatGuide] = useState(false);
  const [pendingScenario, setPendingScenario] = useState<Scenario | null>(null);
  
  // 🆕 진실 조각 발견 모달 상태
  const [showTruthFragmentModal, setShowTruthFragmentModal] = useState(false);
  const [discoveredFragment, setDiscoveredFragment] = useState<{
    name: string;
    description: string;
    count: number;
    total: number;
  } | null>(null);
  
  // 🆕 엔딩 컬렉션 로컬 스토리지 키
  const ENDING_COLLECTION_KEY = 'textify_ending_collection';
  
  // 🆕 엔딩 컬렉션 초기화 (앱 시작 시)
  useEffect(() => {
    const loadEndingCollection = () => {
      try {
        const saved = localStorage.getItem(ENDING_COLLECTION_KEY);
        if (saved) {
          setEndingCollection(JSON.parse(saved));
        } else {
          // 초기 컬렉션 생성
          const initialCollection = initializeEndingCollection();
          setEndingCollection(initialCollection);
          localStorage.setItem(ENDING_COLLECTION_KEY, JSON.stringify(initialCollection));
        }
      } catch (error) {
        console.error('엔딩 컬렉션 로드 실패:', error);
      }
    };
    
    loadEndingCollection();
  }, []);
  
  // 🆕 초기 엔딩 컬렉션 생성
  const initializeEndingCollection = (): EndingCollectionItem[] => {
    const collection: EndingCollectionItem[] = [];
    
    // 각 시나리오별로 모든 엔딩 추가
    Object.values(Scenario).forEach(scenario => {
      // 즉사 엔딩들 (INSTANT_DEATH_ENDINGS는 시나리오별로 구분되지 않음)
      const instantDeathEndings = Object.entries(INSTANT_DEATH_ENDINGS)
        .filter(([key]) => {
          // 시나리오별로 필터링
          if (scenario === Scenario.Horror) {
            return ['광기 엔딩', '탈진 엔딩', '심장마비 엔딩', '무감각 엔딩'].includes(key);
          } else if (scenario === Scenario.Thriller) {
            return ['정신붕괴 엔딩', '과로사 엔딩', '심장마비 엔딩', '무기력 엔딩'].includes(key);
          } else if (scenario === Scenario.Romance) {
            return ['용기상실 엔딩', '호감도 바닥 엔딩', '오만 엔딩', '소심 엔딩'].includes(key);
          }
          return false;
        })
        .map(([key, ending]) => ({
          id: `${scenario}_death_${key}`,
          title: ending.title,
          type: EndingType.BAD,
          scenario,
          unlocked: false,
          description: ending.description,
          imagePrompt: ending.imagePrompt
        }));
      
      // 소극성 엔딩
      const passivityEnding: EndingCollectionItem = {
        id: `${scenario}_passivity`,
        title: PASSIVITY_ENDINGS[scenario].title,
        type: EndingType.BAD,
        scenario,
        unlocked: false,
        description: PASSIVITY_ENDINGS[scenario].description,
        imagePrompt: PASSIVITY_ENDINGS[scenario].imagePrompt
      };
      
      // TRUE 엔딩
      const trueEnding: EndingCollectionItem = {
        id: `${scenario}_true`,
        title: TRUE_ENDING_CONDITIONS[scenario].ending_info.title,
        type: EndingType.TRUE,
        scenario,
        unlocked: false,
        description: TRUE_ENDING_CONDITIONS[scenario].ending_info.description,
        imagePrompt: TRUE_ENDING_CONDITIONS[scenario].ending_info.imagePrompt
      };
      
      // 극한 스탯 엔딩들
      const extremeEndings = EXTREME_STAT_ENDINGS[scenario].map(ending => ({
        id: `${scenario}_extreme_${ending.id}`,
        title: ending.title,
        type: EndingType.GOOD,
        scenario,
        unlocked: false,
        description: ending.description,
        imagePrompt: ending.imagePrompt
      }));
      
      // 히든 엔딩들
      const hiddenEndings = HIDDEN_ENDINGS[scenario].map(ending => ({
        id: `${scenario}_hidden_${ending.id}`,
        title: ending.title,
        type: EndingType.HIDDEN,
        scenario,
        unlocked: false,
        description: ending.description,
        imagePrompt: ending.imagePrompt
      }));
      
      collection.push(...instantDeathEndings, passivityEnding, trueEnding, ...extremeEndings, ...hiddenEndings);
    });
    
    return collection;
  };
  
  // 🆕 엔딩 해금 함수
  const unlockEnding = useCallback((endingId: string, endingTitle: string) => {
    setEndingCollection(prev => {
      const updated = prev.map(item => {
        if (item.id === endingId || item.title === endingTitle) {
          if (!item.unlocked) {
            console.log(`🎉 새로운 엔딩 해금: ${item.title}`);
            return {
              ...item,
              unlocked: true,
              unlockedAt: new Date().toISOString()
            };
          }
        }
        return item;
      });
      
      // 로컬 스토리지에 저장
      localStorage.setItem(ENDING_COLLECTION_KEY, JSON.stringify(updated));
      return updated;
    });
  }, [ENDING_COLLECTION_KEY]);

  // 🆕 1단계: 인트로 동영상 완료 → 필독 모달 표시
  const handleIntroVideoComplete = useCallback(() => {
    setShowIntroVideo(false);
    // 동영상 종료 후 필독 모달 표시
    setShowStatGuide(true);
  }, []);

  // 🆕 2단계: 필독 모달 닫기 → 타이머 안내 모달 표시
  const handleCloseStatGuide = useCallback(() => {
    setShowStatGuide(false);
    // 필독 모달 후 타이머 안내 표시
    setShowTimerIntro(true);
  }, []);

  // 🆕 3단계: 타이머 안내 모달 닫기 → 게임 시작
  const handleCloseTimerIntro = useCallback(() => {
    setShowTimerIntro(false);
    // 타이머 안내 후 게임 시작
    resetTimer();
    setIsTimerActive(true);
  }, []);

  // 타임아웃 처리
  const handleTimeout = useCallback(() => {
    if (!scenario) return;
    
    // 현재 시나리오를 로컬 변수로 캡처
    const currentScenario = scenario;
    
    setIsTimerActive(false);
    soundManager.playSFX('timer_timeout');
    
    // 타임아웃 시 스탯 변화 표시 안 함
    setRecentStatChanges(null);
    setIsShowingStatChange(false);
    
    const timeoutEnding = TIMEOUT_ENDINGS[currentScenario];
    
    const timeoutState: GameState = {
      narrative: timeoutEnding.description,
      image_prompt: 'timeout ending scene',
      stats: currentGameState?.stats || {},
      analysis: {
        player_action: '시간 초과',
        emotion_detected: '망설임',
      },
      ending_check: timeoutEnding.title,
      imageUrl: getPlaceholderImage(currentScenario),
    };

    setCurrentGameState(timeoutState);
    setDisplayHistory((prev) => [
      ...prev,
      {
        playerAction: '⏱️ 시간 초과 (60초)',
        gameState: timeoutState,
      },
    ]);
  }, [scenario, currentGameState]);

  // 🆕 홈 화면 BGM 자동 재생
  useEffect(() => {
    // 홈 화면일 때 BGM 재생 (첫 로드 또는 handleRestart 후)
    // handleRestart에서 이미 playBGM('front')를 호출하지만, 
    // 첫 로드 시에는 이 useEffect가 필요함
    if (scenario === null) {
      // 약간의 딜레이를 주어 soundManager가 준비될 시간 확보
      const timer = setTimeout(() => {
        soundManager.playBGM('front');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [scenario]);

  // 타이머 로직
  useEffect(() => {
    if (!isTimerActive || isLoading || !scenario) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerActive, isLoading, scenario, handleTimeout]);

  // 타이머 리셋
  const resetTimer = () => {
    setTimeRemaining(TIMER_DURATION);
  };

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
    // 모든 상태를 즉시 초기화 (이전 시나리오 데이터 완전 삭제)
    setCurrentGameState(null);
    setGameHistory([]);
    setDisplayHistory([]);
    setRecentStatChanges(null);
    setIsShowingStatChange(false);
    setError(null);
    setTurnCount(0); // 🆕 턴 카운트 초기화
    
    // 🆕 BGM 전환: 홈 BGM 정지 후 시나리오 BGM 재생
    soundManager.stopBGMImmediate();
    soundManager.playBGM(selectedScenario);
    
    // 시나리오 설정
    setScenario(selectedScenario);
    setPendingScenario(selectedScenario);
    
    // 🆕 1단계: 인트로 동영상 먼저 표시
    setShowIntroVideo(true);
    setIsLoading(true);

    // 백그라운드에서 게임 초기화 시작
    try {
      const initialPrompt = getInitialPrompt(selectedScenario);
      const newHistory: { role: string, parts: { text: string }[] }[] = [];
      
      console.log(`🎮 [${selectedScenario}] 스토리 생성 시작...`);
      
      // 1단계: 스토리 생성
      const responseState = await generateGameResponse(newHistory, initialPrompt, selectedScenario);
      
      console.log(`✅ [${selectedScenario}] 스토리 생성 완료`);
      
      // 🆕 AI가 stage_progress를 반환하지 않으면 기본값 설정
      if (!responseState.story_stage) {
        responseState.story_stage = 1;
      }
      if (!responseState.stage_progress) {
        responseState.stage_progress = {
          current_stage: responseState.story_stage,
          stage_title: STAGE_TITLES[selectedScenario][responseState.story_stage - 1] || '진행 중',
          objectives_completed: 0,
          objectives_total: 3,
          key_events: [],
          can_advance: false,
        };
      }
      
      // 🎮 초기 스탯 범위 제한: 0~100
      Object.keys(responseState.stats).forEach(statName => {
        const originalValue = responseState.stats[statName];
        responseState.stats[statName] = Math.max(0, Math.min(100, originalValue));
        
        if (originalValue !== responseState.stats[statName]) {
          console.log(`📊 초기 스탯 범위 제한: ${statName} ${originalValue} → ${responseState.stats[statName]}`);
        }
      });
      
      // 2단계: Placeholder 이미지로 먼저 화면 표시 (사용자는 바로 스토리를 읽을 수 있음)
      const placeholderImageUrl = getPlaceholderImage(selectedScenario);
      const totalFragments = TRUTH_FRAGMENTS[selectedScenario].length;
      const initialGameState = {
        ...responseState,
        imageUrl: placeholderImageUrl, // 🔥 Placeholder 먼저 설정
        // 🆕 소극성 추적 초기화
        passivity_score: 0,
        action_diversity: { safe: 0, risky: 0, extreme: 0 },
        // 🆕 진실 조각 초기화
        truth_fragments: {
          discovered: [],
          total: totalFragments
        }
      };
      
      setCurrentGameState(initialGameState);
      setDisplayHistory([{ 
        playerAction: '게임 시작', 
        gameState: initialGameState,
        suggestedActions: responseState.suggested_actions // 🆕 선택지 저장
      }]);
      
      setIsLoading(false); // 로딩 종료 - 사용자가 스토리를 읽을 수 있음
      
      console.log(`📖 [${selectedScenario}] 스토리 표시 완료, 이미지: ${placeholderImageUrl}`);
      console.log(`🎨 백그라운드에서 고품질 이미지 생성 시도 중...`);
      
      // 3단계: 백그라운드에서 고품질 이미지 생성 시도
      console.log('🎨 [초기] 이미지 생성 함수 호출 중...');
      const initialNarrative = responseState.narrative; // 🔥 초기 narrative 저장
      generateImage(responseState.image_prompt, selectedScenario)
        .then(imageUrl => {
          console.log('✅ [초기] 고품질 이미지 생성 성공!');
          console.log('🖼️ [초기] 이미지 URL:', imageUrl.substring(0, 50) + '...');
          
          // 이미지 생성 성공 시 업데이트 (narrative 일치하는 항목만)
          setCurrentGameState((prev: GameState | null) => {
            if (prev && prev.narrative === initialNarrative) {
              console.log('🔄 [초기] currentGameState 업데이트');
              return { ...prev, imageUrl };
            }
            console.warn('⚠️ [초기] narrative 불일치, 업데이트 스킵');
            return prev;
          });
          
          setDisplayHistory((prev: GameHistoryEntry[]) => {
            const newHistory = [...prev];
            // narrative가 일치하는 항목만 업데이트
            for (let i = 0; i < newHistory.length; i++) {
              if (newHistory[i].gameState.narrative === initialNarrative) {
                console.log(`🔄 [초기] displayHistory[${i}] 업데이트`);
                newHistory[i] = {
                  ...newHistory[i],
                  gameState: { ...newHistory[i].gameState, imageUrl }
                };
                break; // 첫 번째 일치하는 항목만 업데이트
              }
            }
            return newHistory;
          });
        })
        .catch((error) => {
          console.error('❌ [초기] 고품질 이미지 생성 실패:', error);
          console.log('💾 [초기] Placeholder 유지');
          // Placeholder가 이미 설정되어 있으므로 추가 작업 불필요
        });

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

  // 🆕 선택지 위험도 계산 함수
  const calculateRiskLevel = (statChanges: { [key: string]: number }): 'safe' | 'risky' | 'extreme' => {
    const totalChange = Object.values(statChanges).reduce((sum, change) => sum + Math.abs(change), 0);
    
    if (totalChange <= 20) return 'safe';
    if (totalChange <= 50) return 'risky';
    return 'extreme';
  };

  // 🆕 소극성 엔딩 체크 함수
  const checkPassivityEnding = (
    scenario: Scenario,
    passivityScore: number,
    actionDiversity: { safe: number; risky: number; extreme: number }
  ): { isPassive: boolean; endingInfo: typeof PASSIVITY_ENDINGS[Scenario] | null } => {
    const passivityEnding = PASSIVITY_ENDINGS[scenario];
    
    // Horror: passivity_score >= 5 && risky === 0
    if (scenario === Scenario.Horror) {
      if (passivityScore >= 5 && actionDiversity.risky === 0) {
        return { isPassive: true, endingInfo: passivityEnding };
      }
    }
    
    // Thriller: passivity_score >= 5 && extreme === 0
    if (scenario === Scenario.Thriller) {
      if (passivityScore >= 5 && actionDiversity.extreme === 0) {
        return { isPassive: true, endingInfo: passivityEnding };
      }
    }
    
    // Romance: passivity_score >= 5 && risky === 0
    if (scenario === Scenario.Romance) {
      if (passivityScore >= 5 && actionDiversity.risky === 0) {
        return { isPassive: true, endingInfo: passivityEnding };
      }
    }
    
    return { isPassive: false, endingInfo: null };
  };

  // 🆕 TRUE 엔딩 조건 체크 함수
  const checkTrueEndingConditions = (
    scenario: Scenario,
    gameState: GameState,
    currentTurnCount: number
  ): { canUnlock: boolean; missingConditions: string[]; progress: { fragments: string; turns: string; stats: string } } => {
    const conditions = TRUE_ENDING_CONDITIONS[scenario];
    const missing: string[] = [];
    
    // 진실 조각 체크
    const fragmentsDiscovered = gameState.truth_fragments?.discovered.length || 0;
    const fragmentsRequired = conditions.required_fragments;
    const hasAllFragments = fragmentsDiscovered >= fragmentsRequired;
    
    if (!hasAllFragments) {
      missing.push(`진실 조각: ${fragmentsDiscovered}/${fragmentsRequired}`);
    }
    
    // 최소 턴 수 체크
    const hasEnoughTurns = currentTurnCount >= conditions.min_turns;
    if (!hasEnoughTurns) {
      missing.push(`턴 수: ${currentTurnCount}/${conditions.min_turns}`);
    }
    
    // 스탯 균형 체크 (모든 스탯이 min~max 범위 내)
    const statsBalanced = Object.values(gameState.stats).every(
      stat => stat >= conditions.stat_balance.min && stat <= conditions.stat_balance.max
    );
    if (!statsBalanced) {
      missing.push(`스탯 균형 유지 필요 (모든 스탯 ${conditions.stat_balance.min}-${conditions.stat_balance.max} 사이)`);
    }
    
    return {
      canUnlock: missing.length === 0,
      missingConditions: missing,
      progress: {
        fragments: `${fragmentsDiscovered}/${fragmentsRequired}`,
        turns: `${currentTurnCount}/${conditions.min_turns}`,
        stats: statsBalanced ? '✅ 균형 유지' : '⚠️ 불균형'
      }
    };
  };

  // 🆕 극한 스탯 엔딩 체크 함수
  const checkExtremeStatEnding = (
    scenario: Scenario,
    gameState: GameState,
    currentTurnCount: number
  ): { triggered: boolean; endingInfo: typeof EXTREME_STAT_ENDINGS[Scenario][0] | null } => {
    const extremeEndings = EXTREME_STAT_ENDINGS[scenario];
    
    for (const ending of extremeEndings) {
      const conditions = ending.conditions;
      let allConditionsMet = true;
      
      // 스탯 조건 체크
      if (conditions.stat_conditions) {
        for (const [statName, range] of Object.entries(conditions.stat_conditions)) {
          const statValue = gameState.stats[statName];
          if (statValue === undefined) {
            allConditionsMet = false;
            break;
          }
          
          if (range.min !== undefined && statValue < range.min) {
            allConditionsMet = false;
            break;
          }
          
          if (range.max !== undefined && statValue > range.max) {
            allConditionsMet = false;
            break;
          }
        }
      }
      
      // 턴 범위 체크
      if (allConditionsMet && conditions.turn_range) {
        const [minTurn, maxTurn] = conditions.turn_range;
        if (currentTurnCount < minTurn || currentTurnCount > maxTurn) {
          allConditionsMet = false;
        }
      }
      
      // 진실 조각 최소 개수 체크
      if (allConditionsMet && conditions.fragments_min !== undefined) {
        const fragmentsDiscovered = gameState.truth_fragments?.discovered.length || 0;
        if (fragmentsDiscovered < conditions.fragments_min) {
          allConditionsMet = false;
        }
      }
      
      if (allConditionsMet) {
        console.log(`🎯 극한 스탯 엔딩 발동: ${ending.title}`);
        return { triggered: true, endingInfo: ending };
      }
    }
    
    return { triggered: false, endingInfo: null };
  };

  // 🆕 히든 엔딩 체크 함수
  const checkHiddenEnding = (
    scenario: Scenario,
    gameState: GameState,
    currentTurnCount: number
  ): { triggered: boolean; endingInfo: typeof HIDDEN_ENDINGS[Scenario][0] | null } => {
    const hiddenEndings = HIDDEN_ENDINGS[scenario];
    
    for (const ending of hiddenEndings) {
      const conditions = ending.conditions;
      let allConditionsMet = true;
      
      // 정확한 스탯 체크
      if (conditions.exact_stats) {
        for (const [statName, exactValue] of Object.entries(conditions.exact_stats)) {
          const statValue = gameState.stats[statName];
          if (statValue !== exactValue) {
            allConditionsMet = false;
            break;
          }
        }
      }
      
      // 스탯 합계 체크
      if (allConditionsMet && conditions.stat_sum !== undefined) {
        const sum = Object.values(gameState.stats).reduce((a, b) => a + b, 0);
        if (sum !== conditions.stat_sum) {
          allConditionsMet = false;
        }
      }
      
      // 모든 진실 조각 체크
      if (allConditionsMet && conditions.all_fragments) {
        const fragmentsDiscovered = gameState.truth_fragments?.discovered.length || 0;
        const totalFragments = gameState.truth_fragments?.total || 0;
        if (fragmentsDiscovered < totalFragments) {
          allConditionsMet = false;
        }
      }
      
      // 특정 진실 조각 체크
      if (allConditionsMet && conditions.specific_fragments) {
        const discovered = gameState.truth_fragments?.discovered || [];
        for (const fragmentId of conditions.specific_fragments) {
          if (!discovered.includes(fragmentId)) {
            allConditionsMet = false;
            break;
          }
        }
      }
      
      // 정확한 턴 수 체크
      if (allConditionsMet && conditions.exact_turn !== undefined) {
        if (currentTurnCount !== conditions.exact_turn) {
          allConditionsMet = false;
        }
      }
      
      // 소극성 점수 범위 체크
      if (allConditionsMet && conditions.passivity_score_range) {
        const passivityScore = gameState.passivity_score || 0;
        const [min, max] = conditions.passivity_score_range;
        if (passivityScore < min || passivityScore > max) {
          allConditionsMet = false;
        }
      }
      
      // 행동 다양성 체크
      if (allConditionsMet && conditions.action_diversity_requirement) {
        const diversity = gameState.action_diversity || { safe: 0, risky: 0, extreme: 0 };
        const req = conditions.action_diversity_requirement;
        if (diversity.safe < req.safe || diversity.risky < req.risky || diversity.extreme < req.extreme) {
          allConditionsMet = false;
        }
      }
      
      if (allConditionsMet) {
        console.log(`🎁 히든 엔딩 발동: ${ending.title}`);
        return { triggered: true, endingInfo: ending };
      }
    }
    
    return { triggered: false, endingInfo: null };
  };

  // 스탯 고갈 엔딩 메시지
  const getStatDepletionEnding = (statName: string, selectedScenario: Scenario): string => {
    const endings: { [key: string]: { [key: string]: string } } = {
      Horror: {
        '정신력': '당신의 정신은 공포에 완전히 무너졌습니다. 비명을 지르며 어둠 속으로 사라져갔습니다.',
        '체력': '더 이상 버틸 수 없습니다. 탈진한 당신은 그 자리에 쓰러지고 말았습니다.',
        '공포도': '극도의 공포에 심장이 멈췄습니다. 두려움 그 자체가 당신을 삼켰습니다.',
      },
      Thriller: {
        '정신력': '극한의 압박감에 정신이 붕괴되었습니다. 당신은 이성을 잃고 말았습니다.',
        '체력': '부상과 피로가 한계에 달했습니다. 더 이상 움직일 수 없습니다.',
        '긴장도': '과도한 긴장으로 판단력을 잃었습니다. 치명적인 실수를 저질렀습니다.',
      },
      Romance: {
        '용기': '용기를 완전히 잃어버렸습니다. 고백할 기회를 영원히 놓쳤습니다.',
        '호감도': '상대의 호감도가 바닥에 떨어졌습니다. 그/그녀가 차갑게 돌아섰습니다.',
        '자신감': '자신감을 완전히 상실했습니다. 말도 제대로 걸지 못하고 자리를 떠났습니다.',
      },
    };
    
    return endings[selectedScenario]?.[statName] || `${statName}이(가) 고갈되어 더 이상 진행할 수 없습니다.`;
  };

  // 시나리오별 허용된 스탯 목록
  const getAllowedStats = (selectedScenario: Scenario): string[] => {
    switch (selectedScenario) {
      case Scenario.Horror:
        return ['정신력', '체력', '공포도'];
      case Scenario.Thriller:
        return ['정신력', '체력', '긴장도'];
      case Scenario.Romance:
        return ['용기', '호감도', '자신감'];
      default:
        return [];
    }
  };

  // 🆕 스탯 즉사 체크 함수
  const checkInstantDeath = (stats: { [key: string]: number }, selectedScenario: Scenario): { isDead: boolean; endingName?: string; endingInfo?: { title: string; description: string; imagePrompt: string } } => {
    const thresholds = STAT_THRESHOLDS[selectedScenario];
    if (!thresholds) return { isDead: false };

    for (const [statName, value] of Object.entries(stats)) {
      const threshold = thresholds[statName];
      if (!threshold) continue;

      // 하한선 체크
      if (value <= threshold.min && threshold.deathEndingLow) {
        const endingInfo = INSTANT_DEATH_ENDINGS[threshold.deathEndingLow];
        console.log(`💀 즉사 트리거: ${statName} = ${value} (하한선 ${threshold.min})`);
        return {
          isDead: true,
          endingName: threshold.deathEndingLow,
          endingInfo
        };
      }

      // 상한선 체크
      if (value >= threshold.max && threshold.deathEndingHigh) {
        const endingInfo = INSTANT_DEATH_ENDINGS[threshold.deathEndingHigh];
        console.log(`💀 즉사 트리거: ${statName} = ${value} (상한선 ${threshold.max})`);
        return {
          isDead: true,
          endingName: threshold.deathEndingHigh,
          endingInfo
        };
      }
    }

    return { isDead: false };
  };

  // 선택지 선택 처리
  const handleActionChoice = useCallback(async (selectedAction: SuggestedAction) => {
    if (!currentGameState || !scenario) return;
    
    // 현재 시나리오를 로컬 변수로 캡처 (비동기 작업 중 scenario 변경 방지)
    const currentScenario = scenario;
    
    // 이미 스탯 변화 표시 중이면 무시
    if (isShowingStatChange) {
      console.log('스탯 변화 이미 표시 중, 새 액션 무시');
      return;
    }

    // 타이머 리셋
    resetTimer();

    // 1. 트랩 체크
    if (selectedAction.is_trap && selectedAction.trap_ending) {
      soundManager.playSFX('game_over');
      setIsTimerActive(false);
      
      // 트랩 시 스탯 변화 표시 안 함
      setRecentStatChanges(null);
      setIsShowingStatChange(false);
      
      const trapState: GameState = {
        narrative: selectedAction.trap_ending.description,
        image_prompt: 'trap ending scene',
        stats: currentGameState.stats,
        analysis: {
          player_action: selectedAction.text,
          emotion_detected: '섣부른 선택',
        },
        ending_check: selectedAction.trap_ending.title,
        imageUrl: getPlaceholderImage(currentScenario),
      };
      
      setCurrentGameState(trapState);
      setDisplayHistory((prev) => [
        ...prev,
        {
          playerAction: `${selectedAction.emoji} ${selectedAction.text}`,
          gameState: trapState,
        },
      ]);
      return;
    }
    
    // 2. 스탯 체크
    if (selectedAction.required_stats) {
      const canPerform = Object.entries(selectedAction.required_stats).every(
        ([statName, required]) => (currentGameState.stats[statName] || 0) >= required
      );
      
      if (!canPerform) {
        // 스탯 부족으로 실패
        soundManager.playSFX('game_over');
        setIsTimerActive(false);
        
        // 실패 시 스탯 변화 표시 안 함
        setRecentStatChanges(null);
        setIsShowingStatChange(false);
        
        const missingStats = Object.entries(selectedAction.required_stats)
          .filter(([name, req]) => (currentGameState.stats[name] || 0) < req)
          .map(([name, req]) => `${name}: ${currentGameState.stats[name] || 0}/${req}`)
          .join('\n');
        
        const failState: GameState = {
          narrative: `스탯이 부족하여 행동에 실패했습니다.\n\n${missingStats}`,
          image_prompt: 'failure scene',
          stats: currentGameState.stats,
          analysis: {
            player_action: selectedAction.text,
            emotion_detected: '무리한 시도',
          },
          ending_check: '능력 부족',
          imageUrl: getPlaceholderImage(currentScenario),
        };
        
        setCurrentGameState(failState);
        setDisplayHistory((prev) => [
          ...prev,
          {
            playerAction: `${selectedAction.emoji} ${selectedAction.text}`,
            gameState: failState,
          },
        ]);
        return;
      }
    }
    
    // 3. 스탯 변화 적용 (완전 중복 제거)
    const oldStats = { ...currentGameState.stats };
    const newStats = { ...currentGameState.stats };
    const allowedStats = getAllowedStats(currentScenario);
    
    // 스탯 변화 적용 (중복 방지를 위해 Map 사용 + 시나리오별 필터링)
    const statChangesMap = new Map<string, { change: number, oldValue: number, newValue: number }>();
    
    // stat_changes 객체를 배열로 변환하고 중복 제거
    const uniqueStatChanges = new Map<string, number>();
    Object.entries(selectedAction.stat_changes || {}).forEach(([statName, change]) => {
      // 허용된 스탯만, 변화가 있는 것만
      if (allowedStats.includes(statName) && change !== 0) {
        uniqueStatChanges.set(statName, change);
      }
    });
    
    // 고유한 스탯 변화만 적용
    uniqueStatChanges.forEach((change, statName) => {
      const oldValue = oldStats[statName] || 0;
      let newValue = oldValue + change;
      
      // 🎮 스탯 범위 제한: 0~100
      newValue = Math.max(0, Math.min(100, newValue));
      
      newStats[statName] = newValue;
      
      // Map에 저장 (실제 적용된 변화량 계산)
      const actualChange = newValue - oldValue;
      statChangesMap.set(statName, {
        change: actualChange, // 상한선/하한선 적용 후 실제 변화량
        oldValue: oldValue,
        newValue: newValue,
      });
    });
    
    // 스탯 변화 저장 (시각적 표시용)
    const statChanges = Array.from(statChangesMap.entries()).map(([statName, data]) => ({
      name: statName,
      oldValue: data.oldValue,
      newValue: data.newValue,
      change: data.change,
    }));
    
    console.log('스탯 변화:', statChanges);
    
    // 🆕 4. 선택지 위험도 계산 및 소극성 추적
    const riskLevel = calculateRiskLevel(selectedAction.stat_changes);
    const currentPassivityScore = currentGameState.passivity_score || 0;
    const currentActionDiversity = currentGameState.action_diversity || { safe: 0, risky: 0, extreme: 0 };
    
    let newPassivityScore = currentPassivityScore;
    const newActionDiversity = { ...currentActionDiversity };
    
    // 위험도에 따라 소극성 점수 및 다양성 업데이트
    if (riskLevel === 'safe') {
      newPassivityScore += 1;
      newActionDiversity.safe += 1;
      console.log(`🟢 안전한 선택 | 소극성 점수: ${newPassivityScore} | 다양성:`, newActionDiversity);
    } else if (riskLevel === 'risky') {
      newPassivityScore -= 1;
      newActionDiversity.risky += 1;
      console.log(`🟡 위험한 선택 | 소극성 점수: ${newPassivityScore} | 다양성:`, newActionDiversity);
    } else if (riskLevel === 'extreme') {
      newPassivityScore -= 3;
      newActionDiversity.extreme += 1;
      console.log(`🔴 극단적 선택 | 소극성 점수: ${newPassivityScore} | 다양성:`, newActionDiversity);
    }
    
    // 🆕 5. 스탯 즉사 체크 (임계값 기반)
    const deathCheck = checkInstantDeath(newStats, currentScenario);
    if (deathCheck.isDead && deathCheck.endingInfo) {
      soundManager.playSFX('game_over');
      setIsTimerActive(false);
      
      // 게임 오버 시 스탯 변화 표시 안 함
      setRecentStatChanges(null);
      setIsShowingStatChange(false);
      
      const gameOverState: GameState = {
        narrative: deathCheck.endingInfo.description,
        image_prompt: deathCheck.endingInfo.imagePrompt,
        stats: newStats,
        analysis: {
          player_action: selectedAction.text,
          emotion_detected: '치명적 선택',
        },
        ending_check: deathCheck.endingInfo.title,
        imageUrl: getPlaceholderImage(currentScenario),
      };
      
      setCurrentGameState(gameOverState);
      setDisplayHistory((prev) => [
        ...prev,
        {
          playerAction: `${selectedAction.emoji} ${selectedAction.text}`,
          gameState: gameOverState,
        },
      ]);
      
      // 엔딩 이미지 생성
      generateImage(deathCheck.endingInfo.imagePrompt, currentScenario)
        .then(imageUrl => {
          setCurrentGameState((prev: GameState | null) => {
            if (prev && prev.ending_check === deathCheck.endingInfo!.title) {
              return { ...prev, imageUrl };
            }
            return prev;
          });
        })
        .catch(() => {
          // 이미지 생성 실패 시 placeholder 유지
        });
      
      return;
    }
    
    // 5. 스탯이 0 이하면 게임 오버 (기존 로직 유지)
    const depletedStat = Object.entries(newStats).find(([_, value]) => value <= 0);
    if (depletedStat) {
      soundManager.playSFX('game_over');
      setIsTimerActive(false);
      
      // 게임 오버 시 스탯 변화 표시 안 함
      setRecentStatChanges(null);
      setIsShowingStatChange(false);
      
      const [statName] = depletedStat;
      const gameOverNarrative = getStatDepletionEnding(statName, currentScenario);
      
      const gameOverState: GameState = {
        narrative: gameOverNarrative,
        image_prompt: 'game over scene',
        stats: newStats,
        analysis: {
          player_action: selectedAction.text,
          emotion_detected: '한계 도달',
        },
        ending_check: `${statName} 고갈`,
        imageUrl: getPlaceholderImage(currentScenario),
      };
      
      setCurrentGameState(gameOverState);
      setDisplayHistory((prev) => [
        ...prev,
        {
          playerAction: `${selectedAction.text}`,
          gameState: gameOverState,
        },
      ]);
      return;
    }
    
    // 5. 스탯 변화가 있으면 먼저 표시
    if (statChanges.length > 0) {
      const statChangeInfo: StatChangeInfo = {
        scenario: currentScenario,
        changes: statChanges,
        actionText: selectedAction.text,
      };
      
      setRecentStatChanges(statChangeInfo);
      setIsShowingStatChange(true);
    }
    
    // 🆕 6. 진실 조각 획득 체크
    let newTruthFragments = currentGameState.truth_fragments || { discovered: [], total: 0 };
    if (selectedAction.truth_fragment_id) {
      const fragmentId = selectedAction.truth_fragment_id;
      const alreadyDiscovered = newTruthFragments.discovered.includes(fragmentId);
      
      if (!alreadyDiscovered) {
        const fragment = TRUTH_FRAGMENTS[currentScenario].find(f => f.id === fragmentId);
        if (fragment) {
          newTruthFragments = {
            ...newTruthFragments,
            discovered: [...newTruthFragments.discovered, fragmentId]
          };
          console.log(`🔍 진실 조각 발견! "${fragment.name}" (${newTruthFragments.discovered.length}/${newTruthFragments.total})`);
          
          // 🆕 진실 조각 발견 모달 표시
          setDiscoveredFragment({
            name: fragment.name,
            description: fragment.description,
            count: newTruthFragments.discovered.length,
            total: newTruthFragments.total
          });
          setShowTruthFragmentModal(true);
          
          // 효과음 재생
          soundManager.playSFX('action_submit');
        }
      }
    }
    
    // 🆕 7. 소극성 정보 및 진실 조각을 currentGameState에 업데이트
    setCurrentGameState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        stats: newStats,
        passivity_score: newPassivityScore,
        action_diversity: newActionDiversity,
        truth_fragments: newTruthFragments
      };
    });
    
    // 🆕 7-1. 현재 턴의 선택지를 displayHistory에 저장 (다음 턴에서 "선택했던 행동" 표시용)
    setDisplayHistory((prev: GameHistoryEntry[]) => {
      if (prev.length > 0) {
        const newHistory = [...prev];
        const lastIndex = newHistory.length - 1;
        // 마지막 항목에 suggested_actions 추가
        newHistory[lastIndex] = {
          ...newHistory[lastIndex],
          suggestedActions: currentGameState.suggested_actions
        };
        return newHistory;
      }
      return prev;
    });
    
    // 8. 정상 진행 - AI에게 다음 스토리 요청 (이모지 포함)
    const fullActionText = `${selectedAction.emoji} ${selectedAction.text}`;
    await handlePlayerAction(fullActionText);
  }, [currentGameState, scenario, isShowingStatChange]);

  const handlePlayerAction = useCallback(async (action: string) => {
    console.log('🔍 handlePlayerAction 호출됨 - action:', action, 'currentGameState:', !!currentGameState, 'scenario:', scenario);
    
    if (!action.trim()) {
      console.warn('⚠️ 빈 액션');
      return;
    }
    
    if (!currentGameState) {
      console.warn('⚠️ currentGameState가 없음');
      return;
    }
    
    if (!scenario) {
      console.warn('⚠️ scenario가 없음');
      return;
    }

    // 현재 시나리오를 로컬 변수로 캡처
    const currentScenario = scenario;

    // 타이머 리셋
    resetTimer();
    
    // 행동 제출 사운드
    soundManager.playSFX('action_submit');
    
    setIsLoading(true);
    setError(null);
    
    // 🆕 턴 수 증가
    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);
    
    console.log(`🎮 [${currentScenario}] 액션 처리 시작: ${action} (턴 ${newTurnCount})`);
    
    try {
      const statsString = Object.entries(currentGameState.stats)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');

      // 🆕 Stage 정보 추가
      const currentStage = currentGameState.story_stage || 1;
      const stageTitle = currentGameState.stage_progress?.stage_title || '진행 중';
      const keyEvents = currentGameState.stage_progress?.key_events?.join(', ') || '없음';

      // 🆕 턴 수 기반 강제 단계 진행 계산
      const maxTurnsPerStage = 3; // 각 단계당 최대 3턴
      const totalStages = TOTAL_STAGES[currentScenario];
      const maxTurns = totalStages * maxTurnsPerStage; // Horror: 15턴, Thriller: 12턴, Romance: 9턴
      const expectedStage = Math.min(Math.floor(newTurnCount / maxTurnsPerStage) + 1, totalStages);
      
      // 🆕 엔딩 경고 메시지 추가
      const turnsRemaining = maxTurns - newTurnCount;
      const endingWarning = turnsRemaining <= 2 
        ? `\n\n⚠️⚠️⚠️ 경고: ${turnsRemaining}턴 남음! 다음 턴에 반드시 엔딩을 만들어야 합니다! ending_check를 엔딩명으로 설정하세요! ⚠️⚠️⚠️`
        : turnsRemaining <= 4
        ? `\n\n⚠️ 주의: ${turnsRemaining}턴 남음! 엔딩을 준비하세요!`
        : '';

      // 🆕 진실 조각 정보 추가
      const truthFragmentsInfo = currentGameState.truth_fragments 
        ? `\n\n🔍 진실 조각 현황: ${currentGameState.truth_fragments.discovered.length}/${currentGameState.truth_fragments.total} 발견됨\n발견한 조각: ${currentGameState.truth_fragments.discovered.join(', ') || '없음'}`
        : '';

      const userPrompt = GAME_PROGRESS_PROMPT
        .replace('{NARRATIVE}', currentGameState.narrative)
        .replace('{STATS}', statsString)
        .replace('{TURN_COUNT}', newTurnCount.toString())
        .replace('{CURRENT_STAGE}', currentStage.toString())
        .replace('{STAGE_TITLE}', stageTitle)
        .replace('{KEY_EVENTS}', keyEvents)
        .replace('{PLAYER_ACTION}', action) + truthFragmentsInfo + endingWarning;

      // 1단계: 스토리 생성
      const responseState = await generateGameResponse(gameHistory, userPrompt, currentScenario);
      
      console.log(`✅ [${currentScenario}] 다음 스토리 생성 완료`);
      
      // 🆕 AI가 stage_progress를 반환하지 않으면 기본값 유지 또는 설정
      if (!responseState.story_stage && currentGameState.story_stage) {
        // AI가 stage를 올리지 않았다면 턴 수 기반으로 강제 진행
        responseState.story_stage = Math.max(currentGameState.story_stage, expectedStage);
      } else if (!responseState.story_stage) {
        responseState.story_stage = expectedStage;
      }
      
      // 🆕 엔딩 로직 강화
      const isNearEnd = newTurnCount >= maxTurns - 2; // 엔딩 2턴 전부터 경고
      const isForcedEnding = newTurnCount >= maxTurns;
      
      // 1. 최대 턴 수 도달 시 무조건 엔딩
      if (isForcedEnding) {
        console.log(`⏰ 최대 턴 수 도달 (${newTurnCount}/${maxTurns}) - 강제 엔딩 트리거`);
        responseState.story_stage = totalStages;
        
        // AI가 엔딩을 만들지 않았다면 강제로 기본 엔딩 설정
        if (responseState.ending_check === '진행중') {
          responseState.ending_check = '시간 초과 엔딩';
          console.log('🎬 AI가 엔딩을 만들지 않아 기본 엔딩으로 설정');
        }
      }
      
      // 2. 최종 단계 + 목표 완료 시 엔딩
      if (responseState.story_stage >= totalStages) {
        const allObjectivesComplete = (responseState.stage_progress?.objectives_completed || 0) >= 
                                      (responseState.stage_progress?.objectives_total || 3);
        
        if (allObjectivesComplete && responseState.ending_check === '진행중') {
          console.log('🎯 최종 단계 목표 완료 - 엔딩 강제 트리거');
          responseState.ending_check = '목표 달성 엔딩';
        }
      }
      
      // 3. 엔딩 근처에서 AI에게 강력히 경고
      if (isNearEnd && responseState.ending_check === '진행중') {
        console.log(`⚠️ 엔딩 임박! (${maxTurns - newTurnCount}턴 남음) - AI가 엔딩을 준비해야 함`);
      }
      
      if (!responseState.stage_progress) {
        responseState.stage_progress = {
          current_stage: responseState.story_stage,
          stage_title: STAGE_TITLES[currentScenario][responseState.story_stage - 1] || '진행 중',
          objectives_completed: 0,
          objectives_total: 3,
          key_events: currentGameState.stage_progress?.key_events || [],
          can_advance: false,
        };
      }
      
      // 🆕 단계 자동 진행 로직
      if (responseState.story_stage > currentStage) {
        console.log(`📖 Chapter ${currentStage} → ${responseState.story_stage} 진행!`);
        responseState.stage_progress.stage_title = STAGE_TITLES[currentScenario][responseState.story_stage - 1] || '진행 중';
        responseState.stage_progress.current_stage = responseState.story_stage;
      }
      
      // 🆕 최종 단계 도달 시 엔딩 준비
      if (responseState.story_stage >= totalStages && responseState.ending_check === '진행중') {
        console.log(`🎬 최종 단계 도달 - 다음 턴에 반드시 엔딩이 나와야 함`);
        responseState.stage_progress.can_advance = true;
      }
      
      // 🎮 AI 응답 스탯 범위 제한: 0~100
      Object.keys(responseState.stats).forEach(statName => {
        const originalValue = responseState.stats[statName];
        responseState.stats[statName] = Math.max(0, Math.min(100, originalValue));
        
        if (originalValue !== responseState.stats[statName]) {
          console.log(`📊 스탯 범위 제한: ${statName} ${originalValue} → ${responseState.stats[statName]}`);
        }
      });
      
      // 🆕 스탯 즉사 체크 (AI 응답 후)
      const deathCheck = checkInstantDeath(responseState.stats, currentScenario);
      if (deathCheck.isDead && deathCheck.endingInfo) {
        console.log(`💀 AI 응답 후 즉사 감지: ${deathCheck.endingName}`);
        soundManager.playSFX('game_over');
        setIsTimerActive(false);
        
        // 즉사 엔딩으로 덮어쓰기
        responseState.narrative = deathCheck.endingInfo.description;
        responseState.image_prompt = deathCheck.endingInfo.imagePrompt;
        responseState.ending_check = deathCheck.endingInfo.title;
        
        // 🆕 엔딩 해금
        unlockEnding(`${currentScenario}_death_${deathCheck.endingName}`, deathCheck.endingInfo.title);
      }
      
      // 🆕 히든 엔딩 체크 (즉사 엔딩이 아닐 때, 최우선)
      let hiddenEndingTriggered = false;
      if (!deathCheck.isDead && responseState.ending_check !== '진행중') {
        const hiddenCheck = checkHiddenEnding(currentScenario, responseState, newTurnCount);
        
        if (hiddenCheck.triggered && hiddenCheck.endingInfo) {
          console.log(`🎁 히든 엔딩 발동: ${hiddenCheck.endingInfo.title}`);
          soundManager.playSFX('game_over');
          setIsTimerActive(false);
          hiddenEndingTriggered = true;
          
          // 히든 엔딩으로 덮어쓰기
          responseState.narrative = hiddenCheck.endingInfo.description;
          responseState.image_prompt = hiddenCheck.endingInfo.imagePrompt;
          responseState.ending_check = hiddenCheck.endingInfo.title;
          
          // 🆕 엔딩 해금
          unlockEnding(`${currentScenario}_hidden_${hiddenCheck.endingInfo.id}`, hiddenCheck.endingInfo.title);
        }
      }
      
      // 🆕 TRUE 엔딩 체크 (즉사, 히든 엔딩이 아닐 때)
      let trueEndingTriggered = false;
      if (!deathCheck.isDead && !hiddenEndingTriggered) {
        const trueEndingCheck = checkTrueEndingConditions(currentScenario, responseState, newTurnCount);
        
        // TRUE 엔딩 조건 충족 여부 로그
        console.log(`🏆 TRUE 엔딩 조건 체크:`, {
          canUnlock: trueEndingCheck.canUnlock,
          progress: trueEndingCheck.progress,
          missing: trueEndingCheck.missingConditions
        });
        
        // 엔딩 체크가 "진행중"이 아니고, TRUE 엔딩 조건을 모두 충족했을 때
        if (responseState.ending_check !== '진행중' && trueEndingCheck.canUnlock) {
          console.log(`🎉 TRUE 엔딩 발동!`);
          soundManager.playSFX('game_over');
          setIsTimerActive(false);
          trueEndingTriggered = true;
          
          const trueEnding = TRUE_ENDING_CONDITIONS[currentScenario].ending_info;
          responseState.narrative = trueEnding.description;
          responseState.image_prompt = trueEnding.imagePrompt;
          responseState.ending_check = trueEnding.title;
          
          // 🆕 엔딩 해금
          unlockEnding(`${currentScenario}_true`, trueEnding.title);
        }
      }
      
      // 🆕 극한 스탯 엔딩 체크 (즉사, 히든, TRUE 엔딩이 아닐 때, 엔딩 시점에만)
      let extremeEndingTriggered = false;
      if (!deathCheck.isDead && !hiddenEndingTriggered && !trueEndingTriggered && responseState.ending_check !== '진행중') {
        const extremeCheck = checkExtremeStatEnding(currentScenario, responseState, newTurnCount);
        
        if (extremeCheck.triggered && extremeCheck.endingInfo) {
          console.log(`🎯 극한 스탯 엔딩 발동: ${extremeCheck.endingInfo.title}`);
          soundManager.playSFX('game_over');
          setIsTimerActive(false);
          extremeEndingTriggered = true;
          
          // 극한 스탯 엔딩으로 덮어쓰기
          responseState.narrative = extremeCheck.endingInfo.description;
          responseState.image_prompt = extremeCheck.endingInfo.imagePrompt;
          responseState.ending_check = extremeCheck.endingInfo.title;
          
          // 🆕 엔딩 해금
          unlockEnding(`${currentScenario}_extreme_${extremeCheck.endingInfo.id}`, extremeCheck.endingInfo.title);
        }
      }
      
      // 🆕 소극성 엔딩 체크 (즉사, 히든, TRUE, 극한 엔딩이 모두 아닐 때)
      if (!deathCheck.isDead && !hiddenEndingTriggered && !trueEndingTriggered && !extremeEndingTriggered) {
        const passivityScore = currentGameState.passivity_score || 0;
        const actionDiversity = currentGameState.action_diversity || { safe: 0, risky: 0, extreme: 0 };
        const passivityCheck = checkPassivityEnding(currentScenario, passivityScore, actionDiversity);
        
        if (passivityCheck.isPassive && passivityCheck.endingInfo) {
          console.log(`😴 소극성 엔딩 발동! 점수: ${passivityScore}, 다양성:`, actionDiversity);
          soundManager.playSFX('game_over');
          setIsTimerActive(false);
          
          // 소극성 엔딩으로 덮어쓰기
          responseState.narrative = passivityCheck.endingInfo.description;
          responseState.image_prompt = passivityCheck.endingInfo.imagePrompt;
          responseState.ending_check = passivityCheck.endingInfo.title;
          
          // 🆕 엔딩 해금
          unlockEnding(`${currentScenario}_passivity`, passivityCheck.endingInfo.title);
        }
      }
      
      // 🆕 소극성 추적 정보를 responseState에 추가
      responseState.passivity_score = currentGameState.passivity_score || 0;
      responseState.action_diversity = currentGameState.action_diversity || { safe: 0, risky: 0, extreme: 0 };
      
      // 🆕 진실 조각 정보를 responseState에 유지
      responseState.truth_fragments = currentGameState.truth_fragments || { discovered: [], total: 0 };
      
      // 2단계: 로딩 이미지로 먼저 화면 표시
      const loadingImageUrl = getPlaceholderImage(currentScenario);
      const nextGameState = {
        ...responseState,
        imageUrl: loadingImageUrl
      };
      
      setCurrentGameState(nextGameState);
      setDisplayHistory((prev: GameHistoryEntry[]) => [...prev, { 
        playerAction: action, 
        gameState: nextGameState,
        suggestedActions: responseState.suggested_actions // 🆕 선택지 저장
      }]);
      
      setIsLoading(false); // 로딩 종료
      
      console.log(`📖 [${currentScenario}] 스토리 표시 완료, 이미지: ${loadingImageUrl}`);
      
      // 3단계: 백그라운드에서 고품질 이미지 생성 시도
      console.log('🎨 [턴] 이미지 생성 함수 호출 중...');
      const targetNarrative = responseState.narrative; // 🔥 이 턴의 narrative 저장
      generateImage(responseState.image_prompt, currentScenario)
        .then(imageUrl => {
          console.log('✅ [턴] 고품질 이미지 생성 성공!');
          console.log('🖼️ [턴] 이미지 URL:', imageUrl.substring(0, 50) + '...');
          
          // 이미지 생성 성공 시 업데이트 (narrative 일치하는 항목만)
          setCurrentGameState((prev: GameState | null) => {
            if (prev && prev.narrative === targetNarrative) {
              console.log('🔄 [턴] currentGameState 업데이트');
              return { ...prev, imageUrl };
            }
            console.warn('⚠️ [턴] narrative 불일치, 업데이트 스킵');
            return prev;
          });
          
          setDisplayHistory((prev: GameHistoryEntry[]) => {
            const newHistory = [...prev];
            // narrative가 일치하는 항목만 업데이트
            for (let i = newHistory.length - 1; i >= 0; i--) {
              if (newHistory[i].gameState.narrative === targetNarrative) {
                console.log(`🔄 [턴] displayHistory[${i}] 업데이트`);
                newHistory[i] = {
                  ...newHistory[i],
                  gameState: { ...newHistory[i].gameState, imageUrl }
                };
                break; // 첫 번째 일치하는 항목만 업데이트
              }
            }
            return newHistory;
          });
        })
        .catch((error) => {
          console.error('❌ [턴] 고품질 이미지 생성 실패:', error);
          console.log('💾 [턴] Placeholder 유지');
          // Placeholder가 이미 설정되어 있으므로 추가 작업 불필요
        });

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
    // 타이머 정지 및 리셋
    setIsTimerActive(false);
    setTimeRemaining(TIMER_DURATION);
    setShowTimerIntro(false);
    
    // 인트로 동영상 상태 초기화
    setShowIntroVideo(false);
    
    // 모달 상태 초기화
    setShowStatGuide(false);
    setPendingScenario(null);
    
    // 게임 상태 초기화
    setCurrentGameState(null);
    setGameHistory([]);
    setDisplayHistory([]);
    setError(null);
    setRecentStatChanges(null);
    setIsShowingStatChange(false);
    setTurnCount(0); // 🆕 턴 카운트 초기화
    
    // 🆕 BGM 즉시 정지 후 홈 BGM 재생
    soundManager.stopBGMImmediate();
    soundManager.playBGM('front');
    
    // 시나리오를 null로 설정하여 홈 화면으로 전환
    setScenario(null);
  };

  return (
    <div className="min-h-screen font-sans antialiased bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 text-gray-100">
      {/* 음향 제어 버튼 - 메인 화면에서만 표시 */}
      {scenario === null && <SoundControl />}
      
      {/* 배경 효과 - 신비로운 빛나는 구체들 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        {/* 추가 반짝임 */}
        <div className="absolute top-40 right-20 w-64 h-64 bg-blue-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>
      
      {/* 반짝이는 파티클 효과 */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 50%)
          `
        }}
      />
      
      <div className="relative z-10 container mx-auto px-5 md:px-10 py-10 max-w-7xl">
        <header className="text-center mb-10 md:mb-16">
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 mb-4 drop-shadow-2xl animate-pulse"
              style={{
                textShadow: '0 0 40px rgba(168, 85, 247, 0.6), 0 0 80px rgba(168, 85, 247, 0.4)',
                animationDuration: '3s'
              }}>
            Textify: AI Story Weaver
          </h1>
          <p className="text-purple-200 text-lg mt-3 font-light tracking-wide">✨ 당신의 선택이 이야기를 만듭니다 ✨</p>
          <div className="h-1 w-40 mx-auto mt-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-purple-500/50 animate-pulse"></div>
        </header>
        <main>
          {/* 🆕 1단계: 인트로 동영상 (문 열리는 영상 + 음악) */}
          {showIntroVideo && scenario && (
            <IntroVideoModal 
              scenario={scenario}
              onComplete={handleIntroVideoComplete}
            />
          )}
          
          {/* 🆕 2단계: 필독 모달 (스탯 + 생존 규칙) */}
          {showStatGuide && pendingScenario && !showIntroVideo && (
            <StatGuideModal 
              scenario={pendingScenario}
              onClose={handleCloseStatGuide}
            />
          )}
          
          {/* 🆕 3단계: 타이머 안내 모달 */}
          {showTimerIntro && !showStatGuide && !showIntroVideo && (
            <TimerIntroModal 
              scenario={pendingScenario || scenario!}
              onClose={handleCloseTimerIntro}
            />
          )}
          
          {/* 🆕 진실 조각 발견 모달 */}
          {showTruthFragmentModal && discoveredFragment && scenario && (
            <TruthFragmentDiscoveryModal
              scenario={scenario}
              fragmentName={discoveredFragment.name}
              fragmentDescription={discoveredFragment.description}
              discoveredCount={discoveredFragment.count}
              totalCount={discoveredFragment.total}
              onClose={() => {
                setShowTruthFragmentModal(false);
                setDiscoveredFragment(null);
              }}
            />
          )}
          
          {!scenario ? (
            <ScenarioSelection 
              onSelectScenario={handleSelectScenario}
              endingCollection={endingCollection}
            />
          ) : (
            <GameScreen
              scenario={scenario}
              gameState={currentGameState}
              history={displayHistory}
              isLoading={isLoading}
              onPlayerAction={handlePlayerAction}
              onActionChoice={handleActionChoice}
              onRestart={handleRestart}
              error={error}
              timeRemaining={timeRemaining}
              isTimerActive={isTimerActive}
              turnCount={turnCount}
              recentStatChanges={recentStatChanges}
              onStatChangeComplete={() => {
                setRecentStatChanges(null);
                setIsShowingStatChange(false);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
