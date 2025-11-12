import React, { useState, useRef, useEffect } from 'react';
import { GameState, Stats, GameHistoryEntry } from '../types';

interface GameScreenProps {
  gameState: GameState | null;
  history: GameHistoryEntry[];
  isLoading: boolean;
  onPlayerAction: (action: string) => void;
  onRestart: () => void;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 shadow-lg shadow-purple-500/50"></div>
    </div>
);

const GameImage: React.FC<{ imageUrl?: string, prompt?: string }> = ({ imageUrl, prompt }) => (
    <div className="aspect-video bg-slate-900/50 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl shadow-purple-900/50 mb-6 border border-purple-500/30">
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
    <div className="bg-slate-900/60 backdrop-blur-sm p-5 rounded-2xl mb-6 shadow-2xl shadow-purple-900/30 border border-purple-500/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-slate-800/50 rounded-xl p-3 border border-purple-500/20">
                    <p className="text-xs text-purple-300 font-semibold mb-1">{key}</p>
                    <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">{value}</p>
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

const HistoryItem: React.FC<{ entry: GameHistoryEntry; isFirst: boolean }> = ({ entry, isFirst }) => (
    <div className="mb-6">
        {!isFirst && (
            <div className="bg-purple-900/40 backdrop-blur-sm p-4 rounded-xl mb-3 border-l-4 border-purple-400 shadow-lg shadow-purple-900/30">
                <p className="text-sm font-semibold text-purple-300">🎮 플레이어 행동:</p>
                <p className="text-gray-200 mt-2 leading-relaxed">{entry.playerAction}</p>
            </div>
        )}
        <div className="bg-slate-900/60 backdrop-blur-sm p-6 rounded-xl text-gray-200 leading-relaxed shadow-xl shadow-slate-900/50 border border-purple-500/20">
            <p>{entry.gameState.narrative}</p>
        </div>
    </div>
);

const HistoryDisplay: React.FC<{ history: GameHistoryEntry[] }> = ({ history }) => {
    const historyEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    return (
        <div className="mb-6">
            {history.map((entry, index) => (
                <HistoryItem key={index} entry={entry} isFirst={index === 0} />
            ))}
            <div ref={historyEndRef} />
        </div>
    );
};

const ActionInput: React.FC<{
    onAction: (action: string) => void;
    disabled: boolean;
}> = ({ onAction, disabled }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onAction(input);
            setInput('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="sticky bottom-4">
            <div className="relative shadow-2xl shadow-purple-900/50 rounded-full">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="무엇을 하시겠습니까?"
                    disabled={disabled}
                    className="w-full bg-slate-900/80 backdrop-blur-sm text-gray-100 placeholder-purple-300/50 border border-purple-500/50 rounded-full py-4 pl-6 pr-32 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-300 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={disabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full px-7 py-2.5 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed shadow-lg shadow-purple-900/50"
                >
                    {disabled ? '생각 중...' : '행동'}
                </button>
            </div>
        </form>
    );
};

const GameScreen: React.FC<GameScreenProps> = ({ gameState, history, isLoading, onPlayerAction, onRestart, error }) => {
    const isGameOver = gameState?.ending_check !== '진행중';

    return (
        <div className="flex flex-col">
            {/* 상단 네비게이션 버튼 */}
            <div className="flex justify-between items-center mb-6">
                <button 
                    onClick={onRestart} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-sm border border-purple-500/30 rounded-xl text-purple-300 hover:text-purple-200 hover:border-purple-400 transition-all duration-300 shadow-lg shadow-purple-900/30"
                >
                    <span className="text-xl">🏠</span>
                    <span className="text-sm font-medium">홈화면으로</span>
                </button>
                {history.length > 1 && (
                    <button 
                        onClick={() => window.history.back()}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900/60 backdrop-blur-sm border border-purple-500/30 rounded-xl text-purple-300 hover:text-purple-200 hover:border-purple-400 transition-all duration-300 shadow-lg shadow-purple-900/30"
                    >
                        <span className="text-xl">◀</span>
                        <span className="text-sm font-medium">이전 화면</span>
                    </button>
                )}
            </div>
            
            <GameImage imageUrl={gameState?.imageUrl} prompt={gameState?.image_prompt} />
            
            {gameState && <StatsDisplay stats={gameState.stats} />}
            
            {isLoading && !gameState && (
                 <div className="flex flex-col items-center justify-center text-center p-10 bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-900/50">
                    <LoadingSpinner />
                    <p className="mt-4 text-purple-200">AI 게임 마스터가 당신의 이야기를 준비하고 있습니다...</p>
                 </div>
            )}

            {history.length > 0 && <HistoryDisplay history={history} />}

            {isLoading && gameState && (
                <div className="flex justify-center items-center p-6 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-purple-500/30 mb-6">
                    <LoadingSpinner />
                    <span className="ml-3 text-purple-200">다음 장면을 생성하는 중...</span>
                </div>
            )}

            {error && (
                <div className="bg-red-900/60 backdrop-blur-sm border border-red-500/50 text-red-200 px-6 py-4 rounded-xl relative mb-4 shadow-xl shadow-red-900/50" role="alert">
                    <strong className="font-bold">오류: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {isGameOver && gameState && (
                <div className="text-center p-8 bg-slate-900/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-amber-500/50 shadow-amber-900/50">
                    <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-400 mb-3">게임 종료</h2>
                    <p className="text-2xl text-gray-200 mb-6">엔딩: {gameState.ending_check}</p>
                    <button
                        onClick={onRestart}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-full px-10 py-4 hover:from-purple-500 hover:to-pink-500 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-300 shadow-lg shadow-purple-900/50"
                    >
                        새로운 이야기 시작하기
                    </button>
                </div>
            )}

            {!isGameOver && (
                 <>
                    <ActionInput onAction={onPlayerAction} disabled={isLoading} />
                 </>
            )}
        </div>
    );
};

export default GameScreen;