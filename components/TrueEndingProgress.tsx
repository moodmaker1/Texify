import React from 'react';
import { Scenario } from '../types';
import { TRUE_ENDING_CONDITIONS } from '../constants';

interface TrueEndingProgressProps {
  scenario: Scenario;
  fragmentsDiscovered: number;
  totalFragments: number;
  currentTurn: number;
  stats: { [key: string]: number };
}

const TrueEndingProgress: React.FC<TrueEndingProgressProps> = ({
  scenario,
  fragmentsDiscovered,
  totalFragments,
  currentTurn,
  stats,
}) => {
  const conditions = TRUE_ENDING_CONDITIONS[scenario];
  
  // 조건 체크
  const hasAllFragments = fragmentsDiscovered >= conditions.required_fragments;
  const hasEnoughTurns = currentTurn >= conditions.min_turns;
  const statsBalanced = Object.values(stats).every(
    stat => stat >= conditions.stat_balance.min && stat <= conditions.stat_balance.max
  );
  
  // 진행도 계산
  const fragmentProgress = (fragmentsDiscovered / conditions.required_fragments) * 100;
  const turnProgress = Math.min((currentTurn / conditions.min_turns) * 100, 100);
  const statsProgress = statsBalanced ? 100 : 0;
  
  const totalProgress = (
    (hasAllFragments ? 33.33 : fragmentProgress / 3) +
    (hasEnoughTurns ? 33.33 : turnProgress / 3) +
    (statsBalanced ? 33.34 : 0)
  );
  
  const allConditionsMet = hasAllFragments && hasEnoughTurns && statsBalanced;

  return (
    <div className={`
      bg-gradient-to-br backdrop-blur-sm rounded-xl p-4 border shadow-lg transition-all duration-500
      ${allConditionsMet 
        ? 'from-yellow-900/40 to-amber-900/40 border-yellow-500/50 shadow-yellow-500/30 animate-pulse' 
        : 'from-indigo-900/30 to-purple-900/30 border-indigo-500/30 shadow-purple-500/20'
      }
    `}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{allConditionsMet ? '✨' : '🏆'}</span>
          <h3 className="text-lg font-bold text-yellow-200">TRUE 엔딩 조건</h3>
        </div>
        <div className="text-xl font-bold text-yellow-300">
          {Math.round(totalProgress)}%
        </div>
      </div>

      {/* 전체 진행도 바 */}
      <div className="mb-4">
        <div className="h-3 bg-gray-700/50 rounded-full overflow-hidden border border-yellow-500/30">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              allConditionsMet
                ? 'bg-gradient-to-r from-yellow-400 to-amber-500 animate-pulse'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* 조건 목록 */}
      <div className="space-y-2">
        {/* 진실 조각 */}
        <div className={`
          flex items-center justify-between p-2 rounded-lg transition-all duration-300
          ${hasAllFragments 
            ? 'bg-green-500/20 border border-green-400/40' 
            : 'bg-gray-800/30 border border-gray-600/30'
          }
        `}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{hasAllFragments ? '✅' : '🔍'}</span>
            <span className="text-sm text-purple-200">진실 조각</span>
          </div>
          <span className={`text-sm font-semibold ${
            hasAllFragments ? 'text-green-300' : 'text-gray-400'
          }`}>
            {fragmentsDiscovered}/{conditions.required_fragments}
          </span>
        </div>

        {/* 턴 수 */}
        <div className={`
          flex items-center justify-between p-2 rounded-lg transition-all duration-300
          ${hasEnoughTurns 
            ? 'bg-green-500/20 border border-green-400/40' 
            : 'bg-gray-800/30 border border-gray-600/30'
          }
        `}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{hasEnoughTurns ? '✅' : '⏱️'}</span>
            <span className="text-sm text-purple-200">생존 턴</span>
          </div>
          <span className={`text-sm font-semibold ${
            hasEnoughTurns ? 'text-green-300' : 'text-gray-400'
          }`}>
            {currentTurn}/{conditions.min_turns}
          </span>
        </div>

        {/* 스탯 균형 */}
        <div className={`
          flex items-center justify-between p-2 rounded-lg transition-all duration-300
          ${statsBalanced 
            ? 'bg-green-500/20 border border-green-400/40' 
            : 'bg-gray-800/30 border border-gray-600/30'
          }
        `}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{statsBalanced ? '✅' : '⚖️'}</span>
            <span className="text-sm text-purple-200">스탯 균형</span>
          </div>
          <span className={`text-xs font-semibold ${
            statsBalanced ? 'text-green-300' : 'text-gray-400'
          }`}>
            {conditions.stat_balance.min}-{conditions.stat_balance.max}
          </span>
        </div>
      </div>

      {/* 완성 메시지 */}
      {allConditionsMet && (
        <div className="mt-3 p-2 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-lg border border-yellow-400/50 animate-pulse">
          <div className="text-center text-sm font-bold text-yellow-200">
            ✨ TRUE 엔딩 조건 달성! ✨
          </div>
          <div className="text-center text-xs text-yellow-300 mt-1">
            엔딩 시 TRUE 엔딩이 발동됩니다!
          </div>
        </div>
      )}
    </div>
  );
};

export default TrueEndingProgress;

