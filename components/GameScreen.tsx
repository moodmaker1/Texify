import React, { useState } from 'react';
import { GameState, Stats } from '../types';

interface GameScreenProps {
  gameState: GameState | null;
  isLoading: boolean;
  onPlayerAction: (action: string) => void;
  onRestart: () => void;
  error: string | null;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
    </div>
);

const GameImage: React.FC<{ imageUrl?: string, prompt?: string }> = ({ imageUrl, prompt }) => (
    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden shadow-md mb-6 border border-gray-200">
        {!imageUrl ? (
            <div className="w-full h-full flex flex-col justify-center items-center text-gray-600">
                <LoadingSpinner />
                <p className="mt-4 text-sm">이미지 생성 중...</p>
            </div>
        ) : (
            <img src={imageUrl} alt={prompt || "Scene image"} className="w-full h-full object-cover" />
        )}
    </div>
);

const StatsDisplay: React.FC<{ stats: Stats }> = ({ stats }) => (
    <div className="bg-white p-4 rounded-lg mb-6 shadow-md border border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {Object.entries(stats).map(([key, value]) => (
                <div key={key}>
                    <p className="text-sm text-gray-500">{key}</p>
                    <p className="text-lg font-bold text-purple-600">{value}</p>
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
            <div className="relative shadow-lg rounded-full">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="무엇을 하시겠습니까?"
                    disabled={disabled}
                    className="w-full bg-white text-gray-900 placeholder-gray-500 border border-gray-300 rounded-full py-3 pl-5 pr-28 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-shadow duration-200 disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={disabled}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-600 text-white font-bold rounded-full px-6 py-2 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                    {disabled ? '생각 중...' : '행동'}
                </button>
            </div>
        </form>
    );
};

const GameScreen: React.FC<GameScreenProps> = ({ gameState, isLoading, onPlayerAction, onRestart, error }) => {
    const isGameOver = gameState?.ending_check !== '진행중';

    return (
        <div className="flex flex-col">
            <GameImage imageUrl={gameState?.imageUrl} prompt={gameState?.image_prompt} />
            
            {gameState && <StatsDisplay stats={gameState.stats} />}
            
            {isLoading && !gameState && (
                 <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                    <LoadingSpinner />
                    <p className="mt-4 text-gray-600">AI 게임 마스터가 당신의 이야기를 준비하고 있습니다...</p>
                 </div>
            )}

            {gameState && <NarrativePanel narrative={gameState.narrative} />}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4" role="alert">
                    <strong className="font-bold">오류: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            
            {isGameOver && gameState && (
                <div className="text-center p-6 bg-white rounded-lg shadow-lg border border-amber-400">
                    <h2 className="text-3xl font-bold text-amber-500 mb-2">게임 종료</h2>
                    <p className="text-xl text-gray-700 mb-4">엔딩: {gameState.ending_check}</p>
                    <button
                        onClick={onRestart}
                        className="bg-purple-600 text-white font-bold rounded-full px-8 py-3 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white transition-colors"
                    >
                        새로운 이야기 시작하기
                    </button>
                </div>
            )}

            {!isGameOver && (
                 <>
                    <ActionInput onAction={onPlayerAction} disabled={isLoading} />
                    <button onClick={onRestart} className="text-gray-500 hover:text-gray-800 text-sm mt-8 mx-auto block transition-colors">
                        시나리오 선택으로 돌아가기
                    </button>
                 </>
            )}
        </div>
    );
};

export default GameScreen;