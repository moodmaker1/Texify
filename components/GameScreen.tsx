import React, { useState, useRef, useEffect } from 'react';
import { Scenario, GameState, Stats, GameHistoryEntry, SuggestedAction, StatChangeInfo } from '../types';
import TimerProgressBar from './TimerProgressBar';
import TypewriterText from './TypewriterText';
import { soundManager } from '../services/soundManager';
import ActionChoice from './ActionChoice';
import StatChangeCard from './StatChangeCard';
import SoundControl from './SoundControl';

interface GameScreenProps {
  scenario: Scenario;
  gameState: GameState | null;
  history: GameHistoryEntry[];
  isLoading: boolean;
  onPlayerAction: (action: string) => void;
  onActionChoice: (action: SuggestedAction) => void;
  onRestart: () => void;
  error: string | null;
  timeRemaining: number;
  isTimerActive: boolean;
  recentStatChanges: StatChangeInfo | null;
  onStatChangeComplete: () => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400 shadow-lg shadow-cyan-400/70"></div>
    </div>
);

const GameImage: React.FC<{ imageUrl?: string, prompt?: string, scenario: Scenario, timeRemaining: number, isTimerActive: boolean }> = ({ imageUrl, prompt, scenario, timeRemaining, isTimerActive }) => (
    <div className="relative aspect-video bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 mb-6 border border-purple-500/30">
        {!imageUrl ? (
            <div className="w-full h-full flex flex-col justify-center items-center text-purple-200">
                <LoadingSpinner />
                <p className="mt-4 text-sm">이미지 생성 중...</p>
            </div>
        ) : (
            <img src={imageUrl} alt={prompt || "Scene image"} className="w-full h-full object-cover" />
        )}
    </div>
);

const StatsDisplay: React.FC<{ stats: Stats }> = ({ stats }) => (
    <div className="bg-gradient-to-br from-indigo-900/70 to-purple-900/70 backdrop-blur-md p-5 rounded-2xl mb-6 shadow-2xl shadow-purple-500/30 border-2 border-purple-400/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-indigo-950/60 rounded-xl p-3 border border-cyan-400/30">
                    <p className="text-xs text-cyan-300 font-semibold mb-1">{key}</p>
                    <p className="text-xl font-bold text-purple-100">{value}</p>
                </div>
            ))}
        </div>
    </div>
);

const NarrativePanel: React.FC<{ narrative: string }> = ({ narrative }) => (
    <div className="bg-white p-6 rounded-lg mb-6 text-gray-800 leading-relaxed shadow-md border border-gray-200">
        <p>{narrative}</p>
    </div>
);

const HistoryItem: React.FC<{ 
    entry: GameHistoryEntry; 
    isFirst: boolean; 
    isLatest: boolean;
    scenario: Scenario;
    timeRemaining: number;
    isTimerActive: boolean;
}> = ({ entry, isFirst, isLatest, scenario, timeRemaining, isTimerActive }) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const isGameOver = entry.gameState.ending_check !== '진행중';

    useEffect(() => {
        // 최신 항목일 때만 해당 위치로 스크롤
        if (isLatest && itemRef.current) {
            setTimeout(() => {
                itemRef.current?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 300); // 렌더링 완료 후 스크롤
        }
    }, [isLatest]);

    return (
        <div ref={itemRef} className="mb-8">
            {/* 플레이어 행동 */}
            {!isFirst && (
                <div className="bg-indigo-900/50 backdrop-blur-md p-4 rounded-xl mb-4 border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/30">
                    <p className="text-sm font-semibold text-cyan-300">🎮 플레이어 행동:</p>
                    <p className="text-purple-100 mt-2 leading-relaxed">{entry.playerAction}</p>
                </div>
            )}
            
            {/* 이미지 + 스탯 그리드 */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
                {/* 이미지 - 왼쪽 3칸럼 (3/4) */}
                {entry.gameState.imageUrl && (
                    <div className="lg:col-span-3 relative aspect-video bg-indigo-950/60 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/30 border-2 border-purple-400/30">
                        <img 
                            src={entry.gameState.imageUrl} 
                            alt={entry.gameState.image_prompt || "Scene image"} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                // 이미지 로딩 실패 시 placeholder로 즉시 교체
                                const placeholders: Record<string, string> = {
                                    'Horror': '/horror-thumbnail.png',
                                    'Thriller': '/thriller-thumbnail.png',
                                    'Romance': '/romance-thumbnail.png',
                                };
                                const placeholder = placeholders[scenario] || '/horror-thumbnail.png';
                                (e.target as HTMLImageElement).src = placeholder;
                                console.log('⚠️ 이미지 로드 실패, placeholder로 교체');
                            }}
                        />
                    </div>
                )}
                
                {/* 스탯 - 오른쪽 1칸럼 (1/4) */}
                <div className={entry.gameState.imageUrl ? "lg:col-span-1" : "lg:col-span-4"}>
                    <div className="bg-gradient-to-br from-indigo-900/70 to-purple-900/70 backdrop-blur-md p-5 rounded-2xl shadow-2xl shadow-purple-500/30 border-2 border-purple-400/30 h-full">
                        <h3 className="text-lg font-bold text-cyan-300 mb-4 text-center">상태</h3>
                        <div className={`grid gap-3 ${entry.gameState.imageUrl ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'}`}>
                            {Object.entries(entry.gameState.stats).map(([key, value], index) => (
                                <div key={`stat-${key}-${index}`} className="bg-indigo-950/60 rounded-xl p-3 border border-cyan-400/30">
                                    <p className="text-xs text-cyan-300 font-semibold mb-1">{key}</p>
                                    <p className="text-2xl font-bold text-purple-100">{value}</p>
                                    {/* 프로그레스 바 */}
                                    <div className="mt-2 h-2 bg-indigo-950 rounded-full overflow-hidden border border-purple-400/20">
                                        <div 
                                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500 shadow-lg shadow-cyan-400/50"
                                            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 🆕 Chapter 진행도 표시 (이미지 바로 아래, 작게) */}
            {isLatest && entry.gameState.stage_progress && !isGameOver && (
                <div className="mb-4 bg-gradient-to-r from-indigo-900/60 to-purple-900/60 backdrop-blur-md rounded-xl px-4 py-3 border border-purple-400/30 shadow-lg shadow-purple-500/20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-lg">📖</span>
                            <div>
                                <p className="text-sm font-bold text-cyan-300">
                                    Chapter {entry.gameState.stage_progress.current_stage}
                                    {scenario === Scenario.Horror && '/5'}
                                    {scenario === Scenario.Thriller && '/4'}
                                    {scenario === Scenario.Romance && '/3'}
                                    : {entry.gameState.stage_progress.stage_title}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                            <span className="text-purple-200">
                                목표: {entry.gameState.stage_progress.objectives_completed}/{entry.gameState.stage_progress.objectives_total}
                            </span>
                            <span className="text-cyan-300 font-semibold">
                                {Math.round((entry.gameState.stage_progress.current_stage / 
                                    (scenario === Scenario.Horror ? 5 : scenario === Scenario.Thriller ? 4 : 3)) * 100)}%
                            </span>
                        </div>
                    </div>
                    {/* 작은 진행도 바 */}
                    <div className="mt-2">
                        <div className="h-1.5 bg-indigo-950/60 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-500"
                                style={{ 
                                    width: `${(entry.gameState.stage_progress.current_stage / 
                                        (scenario === Scenario.Horror ? 5 : scenario === Scenario.Thriller ? 4 : 3)) * 100}%` 
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* 스토리 */}
            <div className="bg-gradient-to-br from-indigo-900/60 to-purple-900/60 backdrop-blur-md p-6 rounded-2xl text-purple-100 leading-relaxed shadow-xl shadow-purple-500/30 border-2 border-purple-400/20 mb-4">
                {isLatest ? (
                    <TypewriterText 
                        text={entry.gameState.narrative}
                        speed={30}
                        className=""
                    />
                ) : (
                    <p>{entry.gameState.narrative}</p>
                )}
            </div>
            
            {/* 타이머 - 스토리와 선택지 사이 (게임 오버가 아닐 때만) */}
            {isLatest && !isGameOver && (
                <div className="mb-6">
                    <TimerProgressBar 
                        scenario={scenario}
                        timeRemaining={timeRemaining}
                        isActive={isTimerActive}
                    />
                </div>
            )}
        </div>
    );
};

const HistoryDisplay: React.FC<{ 
    history: GameHistoryEntry[];
    scenario: Scenario;
    timeRemaining: number;
    isTimerActive: boolean;
}> = ({ history, scenario, timeRemaining, isTimerActive }) => {
    // historyEndRef는 제거 - 이제 HistoryItem에서 개별 스크롤 처리

    return (
        <div className="mb-6">
            {history.map((entry, index) => (
                <HistoryItem 
                    key={index} 
                    entry={entry} 
                    isFirst={index === 0}
                    isLatest={index === history.length - 1}
                    scenario={scenario}
                    timeRemaining={timeRemaining}
                    isTimerActive={isTimerActive}
                />
            ))}
        </div>
    );
};

const ActionInput: React.FC<{
    onAction: (action: string) => void;
    disabled: boolean;
    scenario: Scenario;
}> = ({ onAction, disabled, scenario }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('📝 Form submitted - input:', input, 'disabled:', disabled);
        
        if (input.trim() && !disabled) {
            console.log('✍️ 사용자 직접 입력:', input.trim());
            onAction(input.trim());
            setInput('');
        } else if (disabled) {
            console.warn('⚠️ 입력 차단됨 - 로딩 중입니다');
        } else {
            console.warn('⚠️ 빈 입력');
        }
    };

    const getLoadingText = () => {
        switch (scenario) {
            case Scenario.Horror:
                return '두려움에 떨고 있습니다...';
            case Scenario.Thriller:
                return '긴장하고 있습니다...';
            case Scenario.Romance:
                return '마음을 정리하고 있습니다...';
            default:
                return '생각 중...';
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sticky bottom-4">
            <div className="relative shadow-2xl shadow-purple-500/30 rounded-xl">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="✨ 무엇을 하시겠습니까?"
                    disabled={disabled}
                    className="w-full bg-indigo-900/70 backdrop-blur-md text-purple-100 placeholder-purple-300/50 border-2 border-purple-400/30 rounded-xl py-4 pl-6 pr-32 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition-all duration-300 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={disabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-lg px-7 py-2.5 hover:from-cyan-400 hover:to-purple-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-indigo-950 transition-all duration-300 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed shadow-lg shadow-cyan-400/50"
                >
                    {disabled ? getLoadingText() : '✨ 시도'}
                </button>
            </div>
        </form>
    );
};

const GameScreen: React.FC<GameScreenProps> = ({ 
    scenario,
    gameState, 
    history, 
    isLoading, 
    onPlayerAction,
    onActionChoice,
    onRestart, 
    error,
    timeRemaining,
    isTimerActive,
    recentStatChanges,
    onStatChangeComplete
}) => {
    const isGameOver = gameState?.ending_check !== '진행중';
    
    // 게임 오버 사운드
    useEffect(() => {
        if (isGameOver && gameState) {
            soundManager.playSFX('game_over');
        }
    }, [isGameOver, gameState]);

    return (
        <div className="flex flex-col">
            {/* 상단 네비게이션 버튼 */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={onRestart} 
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-900/70 backdrop-blur-md border-2 border-purple-400/30 rounded-xl text-purple-100 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-cyan-400/30 transition-all duration-300 shadow-lg shadow-purple-500/20"
                    >
                        <span className="text-xl">🏠</span>
                        <span className="text-sm font-medium">홈화면으로</span>
                    </button>
                    
                    {/* 사운드 컨트롤 버튼 */}
                    <SoundControl inGame={true} />
                </div>
                
                {history.length > 1 && (
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-900/70 backdrop-blur-md border-2 border-purple-400/30 rounded-xl text-purple-100 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-cyan-400/30 transition-all duration-300 shadow-lg shadow-purple-500/20"
                    >
                        <span className="text-xl">◀</span>
                        <span className="text-sm font-medium">이전 화면</span>
                    </button>
                )}
            </div>
            
            {/* 상단 고정 이미지 제거 - 이제 각 히스토리 항목에 이미지 포함 */}
            {/* <GameImage ... /> */}
            
            {/* 스탯 디스플레이 제거 - 이제 각 히스토리 항목에 포함 */}
            {/* {gameState && <StatsDisplay stats={gameState.stats} />} */}
            
            {isLoading && !gameState && (
                 <div className="flex flex-col items-center justify-center text-center p-10 bg-gradient-to-br from-indigo-900/70 to-purple-900/70 backdrop-blur-md rounded-2xl border-2 border-purple-400/30 shadow-2xl shadow-purple-500/30">
                    <LoadingSpinner />
                    <p className="mt-4 text-purple-200 text-lg">
                        {scenario === Scenario.Horror && "✨ 어둠이 숨을 죽이고 당신을 기다립니다..."}
                        {scenario === Scenario.Thriller && "✨ 숨막히는 긴장감, 심장이 요동칩니다..."}
                        {scenario === Scenario.Romance && "✨ 운명의 설렘이 시작됩니다..."}
                    </p>
                 </div>
            )}

            {history.length > 0 && (
                <HistoryDisplay 
                    history={history}
                    scenario={scenario}
                    timeRemaining={timeRemaining}
                    isTimerActive={isTimerActive && !isGameOver}
                />
            )}

            {/* 스탯 변화 카드 */}
            {recentStatChanges && (
                <StatChangeCard
                    scenario={recentStatChanges.scenario}
                    changes={recentStatChanges.changes}
                    actionText={recentStatChanges.actionText}
                    onComplete={onStatChangeComplete}
                />
            )}

            {isLoading && gameState && (
                <div className="flex justify-center items-center p-6 bg-indigo-900/50 backdrop-blur-md rounded-2xl border-2 border-purple-400/30 mb-6">
                    <LoadingSpinner />
                    <span className="ml-3 text-purple-200 text-lg">
                        {scenario === Scenario.Horror && "💫 비명소리가 메아리칩니다..."}
                        {scenario === Scenario.Thriller && "💫 심장이 박동을 멈추지 않습니다..."}
                        {scenario === Scenario.Romance && "💫 얼굴이 화끈거립니다..."}
                    </span>
                </div>
            )}

            {error && (
                <div className="bg-gradient-to-r from-red-900/80 to-pink-900/80 backdrop-blur-md border-2 border-red-400/50 text-red-100 px-6 py-4 rounded-2xl relative mb-4 shadow-xl shadow-red-500/30" role="alert">
                    <strong className="font-bold">⚠️ 오류: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {isGameOver && gameState && (
                <div className="text-center p-8 bg-gradient-to-br from-indigo-900/90 to-purple-900/90 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-cyan-400/60 shadow-cyan-400/30">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mb-3"
                        style={{
                            textShadow: '0 0 30px rgba(6, 182, 212, 0.5)'
                        }}>✨ 게임 종료 ✨</h2>
                    <p className="text-2xl text-purple-100 mb-6">엔딩: {gameState.ending_check}</p>
                    <button
                        onClick={onRestart}
                        className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl px-10 py-4 hover:from-cyan-400 hover:to-purple-400 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-indigo-950 transition-all duration-300 shadow-lg shadow-cyan-400/50"
                    >
                        ✨ 새로운 이야기 시작하기 ✨
                    </button>
                </div>
            )}

            {!isGameOver && (
                 <>
                    {/* 객관식 선택지 */}
                    {gameState?.suggested_actions && gameState.suggested_actions.length > 0 && (
                        <ActionChoice
                            actions={gameState.suggested_actions}
                            currentStats={gameState.stats}
                            onActionSelect={onActionChoice}
                            disabled={isLoading}
                        />
                    )}
                    
                    {/* 자유 입력 */}
                    <div className="bg-indigo-900/50 backdrop-blur-md rounded-2xl p-4 border-2 border-purple-400/20 mb-4">
                        <p className="text-purple-200 text-sm mb-2 text-center">
                            💫 또는 직접 행동을 입력하세요
                        </p>
                        <ActionInput onAction={onPlayerAction} disabled={isLoading} scenario={scenario} />
                    </div>
                 </>
            )}
        </div>
    );
};

export default GameScreen;