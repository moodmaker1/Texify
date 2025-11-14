import React, { useState, useCallback, useEffect } from 'react';
import { Scenario, GameState, GameHistoryEntry, SuggestedAction, StatChangeInfo } from './types';
import {
  HORROR_PROMPT,
  THRILLER_PROMPT,
  ROMANCE_PROMPT,
  GAME_PROGRESS_PROMPT,
  TIMER_DURATION,
  TIMEOUT_ENDINGS,
  TOTAL_STAGES,
  STAGE_TITLES,
} from './constants';
import { generateGameResponse, generateImage } from './services/geminiService';
import { soundManager } from './services/soundManager';
import ScenarioSelection from './components/ScenarioSelection';
import GameScreen from './components/GameScreen';
import TimerIntroModal from './components/TimerIntroModal';
import IntroVideoModal from './components/IntroVideoModal';
import SoundControl from './components/SoundControl';

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

  // 인트로 동영상 완료 핸들러
  const handleIntroVideoComplete = useCallback(() => {
    setShowIntroVideo(false);
    // 동영상 종료 후 타이머 안내 모달 항상 표시
    setShowTimerIntro(true);
  }, []);

  // 모달 닫기 및 타이머 시작
  const handleCloseTimerIntro = useCallback(() => {
    setShowTimerIntro(false);
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
    
    // 시나리오 설정
    setScenario(selectedScenario);
    
    // 인트로 동영상 표시 (BGM은 IntroVideoModal에서 자동 처리)
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
      
      // 2단계: 로딩 이미지로 먼저 화면 표시 (사용자는 바로 스토리를 읽을 수 있음)
      const loadingImageUrl = getPlaceholderImage(selectedScenario);
      const initialGameState = {
        ...responseState,
        imageUrl: loadingImageUrl
      };
      
      setCurrentGameState(initialGameState);
      setDisplayHistory([{ 
        playerAction: '게임 시작', 
        gameState: initialGameState 
      }]);
      
      setIsLoading(false); // 로딩 종료 - 사용자가 스토리를 읽을 수 있음
      
      console.log(`📖 [${selectedScenario}] 스토리 표시 완료, 백그라운드에서 이미지 생성 중...`);
      
      // 3단계: 동영상 플레이 중 백그라운드에서 이미지 생성 (첫 이미지만)
      // 지연 없이 바로 시작 (동영상 7초 동안 생성)
      generateImage(responseState.image_prompt, selectedScenario)
        .then(imageUrl => {
          // 이미지 생성 성공 시 업데이트
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
        })
        .catch(() => {
          // 이미지 생성 실패 시 placeholder 유지
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
      const newValue = oldValue + change;
      newStats[statName] = newValue;
      
      // Map에 저장
      statChangesMap.set(statName, {
        change: change,
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
    
    // 4. 스탯이 0 이하면 게임 오버
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
    
    // 6. 정상 진행 - AI에게 다음 스토리 요청
    await handlePlayerAction(selectedAction.text);
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

      const userPrompt = GAME_PROGRESS_PROMPT
        .replace('{NARRATIVE}', currentGameState.narrative)
        .replace('{STATS}', statsString)
        .replace('{TURN_COUNT}', newTurnCount.toString())
        .replace('{CURRENT_STAGE}', currentStage.toString())
        .replace('{STAGE_TITLE}', stageTitle)
        .replace('{KEY_EVENTS}', keyEvents)
        .replace('{PLAYER_ACTION}', action) + endingWarning;

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
        const allObjectivesComplete = responseState.stage_progress?.objectives_completed >= 
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
      
      // 2단계: 로딩 이미지로 먼저 화면 표시
      const loadingImageUrl = getPlaceholderImage(currentScenario);
      const nextGameState = {
        ...responseState,
        imageUrl: loadingImageUrl
      };
      
      setCurrentGameState(nextGameState);
      setDisplayHistory((prev: GameHistoryEntry[]) => [...prev, { 
        playerAction: action, 
        gameState: nextGameState
      }]);
      
      setIsLoading(false); // 로딩 종료
      
      console.log(`📖 [${currentScenario}] 스토리 표시 완료, 백그라운드에서 이미지 생성 시도 중...`);
      
      // 3단계: 백그라운드에서 이미지 생성 (모든 턴에서 시도)
      // 5초 대기 후 시도 (사용자가 스토리 읽는 시간 활용)
      setTimeout(() => {
        generateImage(responseState.image_prompt, currentScenario)
          .then(imageUrl => {
            // 이미지 생성 성공 시 업데이트
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
          })
          .catch(() => {
            // 이미지 생성 실패 시 placeholder 유지
          });
      }, 5000); // 5초 후 이미지 생성 (스토리 읽는 시간 활용)

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
    setRecentStatChanges(null);
    setIsShowingStatChange(false);
    setTurnCount(0); // 🆕 턴 카운트 초기화
    
    // 타이머 정지 및 리셋
    setIsTimerActive(false);
    setTimeRemaining(TIMER_DURATION);
    setShowTimerIntro(false);
    
    // 인트로 동영상 상태 초기화
    setShowIntroVideo(false);
    
    // BGM 정지 후 메인 화면 BGM 재생 (fade out 완료 후)
    soundManager.stopBGM();
    setTimeout(() => {
      soundManager.playBGM('front' as any);
    }, 1100);
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
          {/* 인트로 동영상 모달 */}
          {showIntroVideo && scenario && (
            <IntroVideoModal 
              scenario={scenario}
              onComplete={handleIntroVideoComplete}
            />
          )}
          
          {/* 타이머 소개 모달 */}
          {showTimerIntro && scenario && !showIntroVideo && (
            <TimerIntroModal 
              scenario={scenario}
              onClose={handleCloseTimerIntro}
            />
          )}
          
          {!scenario ? (
            <ScenarioSelection onSelectScenario={handleSelectScenario} />
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
