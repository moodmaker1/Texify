import React from 'react';
import { Scenario } from '../types';
import { TRUTH_FRAGMENTS } from '../constants';

interface TruthFragmentDisplayProps {
  scenario: Scenario;
  discoveredFragments: string[];
  totalFragments: number;
}

const TruthFragmentDisplay: React.FC<TruthFragmentDisplayProps> = ({
  scenario,
  discoveredFragments,
  totalFragments,
}) => {
  const fragments = TRUTH_FRAGMENTS[scenario];
  const discoveredCount = discoveredFragments.length;
  const progressPercentage = (discoveredCount / totalFragments) * 100;

  return (
    <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-sm rounded-xl p-4 border border-purple-500/30 shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔍</span>
          <h3 className="text-lg font-bold text-purple-200">진실 조각</h3>
        </div>
        <div className="text-xl font-bold text-purple-300">
          {discoveredCount}/{totalFragments}
        </div>
      </div>

      {/* 진행도 바 */}
      <div className="mb-4">
        <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* 조각 목록 */}
      <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-500/50 scrollbar-track-gray-700/30">
        {fragments.map((fragment) => {
          const isDiscovered = discoveredFragments.includes(fragment.id);
          return (
            <div
              key={fragment.id}
              className={`
                flex items-start gap-2 p-2 rounded-lg transition-all duration-300
                ${
                  isDiscovered
                    ? 'bg-purple-500/20 border border-purple-400/40'
                    : 'bg-gray-800/30 border border-gray-600/30 opacity-50'
                }
              `}
            >
              <span className="text-lg flex-shrink-0">
                {isDiscovered ? '✅' : '🔒'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-purple-200">
                  {isDiscovered ? fragment.name : '???'}
                </div>
                {isDiscovered && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {fragment.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 완성도 메시지 */}
      {discoveredCount === totalFragments && (
        <div className="mt-3 p-2 bg-gradient-to-r from-purple-500/30 to-pink-500/30 rounded-lg border border-purple-400/50 animate-pulse">
          <div className="text-center text-sm font-bold text-purple-200">
            ✨ 모든 진실 조각을 발견했습니다! ✨
          </div>
          <div className="text-center text-xs text-purple-300 mt-1">
            TRUE 엔딩 조건 달성 가능!
          </div>
        </div>
      )}
    </div>
  );
};

export default TruthFragmentDisplay;

