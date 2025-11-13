import React, { useEffect, useState } from 'react';
import { Scenario } from '../types';

interface StatChange {
  name: string;
  oldValue: number;
  newValue: number;
  change: number;
}

interface StatChangeCardProps {
  scenario: Scenario;
  changes: StatChange[];
  actionText?: string;
  onComplete?: () => void;
}

// 각 시나리오별 허용된 스탯 목록
const ALLOWED_STATS: Record<Scenario, string[]> = {
  [Scenario.Horror]: ['정신력', '체력', '공포도'],
  [Scenario.Thriller]: ['정신력', '체력', '긴장도'],
  [Scenario.Romance]: ['용기', '호감도', '자신감'],
};

const StatChangeCard: React.FC<StatChangeCardProps> = ({ scenario, changes, actionText, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedChanges, setAnimatedChanges] = useState<StatChange[]>([]);
  const [renderKey] = useState(() => Date.now()); // 고유 ID 생성

  // 해당 시나리오에 맞는 스탯만 필터링 + 중복 제거
  const filteredChanges = React.useMemo(() => {
    // 1. 시나리오에 맞는 스탯만 필터링
    const filtered = changes.filter(change => 
      ALLOWED_STATS[scenario].includes(change.name) && change.change !== 0
    );
    
    // 2. 중복 제거 - 각 스탯명별로 마지막 항목만 유지
    const uniqueMap = new Map<string, StatChange>();
    filtered.forEach(change => {
      // 같은 이름의 스탯이 이미 있으면 덮어쓰기
      uniqueMap.set(change.name, change);
    });
    
    // 3. 배열로 변환하고 정렬 (일관된 순서 보장)
    return Array.from(uniqueMap.values()).sort((a, b) => 
      ALLOWED_STATS[scenario].indexOf(a.name) - ALLOWED_STATS[scenario].indexOf(b.name)
    );
  }, [scenario, changes]);

  useEffect(() => {
    // 필터링된 변화가 없으면 즉시 완료
    if (filteredChanges.length === 0) {
      if (onComplete) onComplete();
      return;
    }

    // 마운트 시 애니메이션 시작
    setIsVisible(true);
    setAnimatedChanges(filteredChanges); // 즉시 모두 표시
    
    // 3초 후 완료 (더 빠르게)
    const fadeTimer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);
    
    const completeTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [renderKey, onComplete]); // renderKey로 한 번만 실행

  const getThemeConfig = () => {
    switch (scenario) {
      case Scenario.Horror:
        return {
          bgColor: 'from-purple-900/95 to-red-900/95',
          borderColor: 'border-purple-500',
          icon: '💀',
          title: '당신의 선택이 당신을 변화시켰습니다',
          glowColor: 'shadow-purple-500/50',
        };
      case Scenario.Thriller:
        return {
          bgColor: 'from-orange-900/95 to-yellow-900/95',
          borderColor: 'border-orange-500',
          icon: '⚡',
          title: '행동의 결과입니다',
          glowColor: 'shadow-orange-500/50',
        };
      case Scenario.Romance:
        return {
          bgColor: 'from-pink-900/95 to-rose-900/95',
          borderColor: 'border-pink-500',
          icon: '💓',
          title: '당신의 마음이 흔들렸습니다',
          glowColor: 'shadow-pink-500/50',
        };
      default:
        return {
          bgColor: 'from-purple-900/95 to-blue-900/95',
          borderColor: 'border-purple-500',
          icon: '📊',
          title: '스탯 변화',
          glowColor: 'shadow-purple-500/50',
        };
    }
  };

  const theme = getThemeConfig();

  // 필터링된 변화가 없으면 렌더링하지 않음
  if (filteredChanges.length === 0) {
    return null;
  }

  return (
    <>
      {/* 애니메이션 스타일 */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.95);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.5s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.5s ease-in forwards;
        }
      `}</style>

      {/* 팝업 오버레이 - 화면 중앙에 고정 */}
      <div 
        className={`
          fixed inset-0 z-50 flex items-center justify-center
          bg-black/50 backdrop-blur-sm
          ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}
        `}
      >
        <div
          className={`
            bg-gradient-to-br ${theme.bgColor} backdrop-blur-md
            rounded-3xl p-8 mx-4
            border-2 ${theme.borderColor}
            shadow-2xl ${theme.glowColor}
            max-w-md w-full
            transform transition-all duration-500
          `}
        >
          {/* 헤더 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-5xl animate-pulse">{theme.icon}</span>
              <h3 className="text-2xl font-bold text-gray-100">
                {theme.title}
              </h3>
            </div>
            {actionText && (
              <div className="ml-16 mt-2">
                <span className="text-sm text-purple-300">행동: </span>
                <span className="text-lg font-semibold text-white">"{actionText}"</span>
              </div>
            )}
          </div>

          {/* 스탯 변화 목록 */}
          <div className="space-y-4">
            {animatedChanges.map((change, index) => (
              <div
                key={`${renderKey}-${change.name}-${index}`}
                className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 animate-slideIn"
                style={{
                  animationDelay: `${index * 200}ms`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  {/* 스탯 이름 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-purple-300">
                      {change.name}
                    </span>
                  </div>

                  {/* 변화 표시 */}
                  <div className="flex items-center gap-3">
                    {/* 이전 값 */}
                    <span className="text-gray-400 line-through text-lg">
                      {change.oldValue}
                    </span>

                    {/* 화살표 */}
                    <span className="text-3xl font-bold">
                      →
                    </span>

                    {/* 새 값 */}
                    <span className={`
                      text-3xl font-black
                      ${change.change > 0 ? 'text-green-400' : 'text-red-400'}
                    `}>
                      {change.newValue}
                    </span>

                    {/* 변화량 */}
                    <span className={`
                      px-4 py-2 rounded-full text-lg font-bold
                      ${change.change > 0 
                        ? 'bg-green-500/30 text-green-300' 
                        : 'bg-red-500/30 text-red-300'
                      }
                      flex items-center gap-1
                      animate-bounce
                    `}>
                      {change.change > 0 ? '↗' : '↘'}
                      {change.change > 0 ? `+${change.change}` : change.change}
                    </span>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="relative">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`
                        h-full rounded-full transition-all duration-1000 ease-out
                        ${change.change > 0 
                          ? 'bg-gradient-to-r from-green-500 to-green-400' 
                          : 'bg-gradient-to-r from-red-500 to-red-400'
                        }
                      `}
                      style={{
                        width: `${Math.min(100, Math.max(0, change.newValue))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 하단 힌트 */}
          <div className="mt-6 text-center text-sm text-gray-400">
            선택은 언제나 결과를 가져옵니다...
          </div>
        </div>
      </div>
    </>
  );
};

export default StatChangeCard;
