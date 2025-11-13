import React, { useState, useEffect } from 'react';
import { SuggestedAction, Stats } from '../types';
import { soundManager } from '../services/soundManager';

interface ActionChoiceProps {
  actions: SuggestedAction[];
  currentStats: Stats;
  onActionSelect: (action: SuggestedAction) => void;
  disabled: boolean;
}

const ActionChoice: React.FC<ActionChoiceProps> = ({ 
  actions, 
  currentStats, 
  onActionSelect,
  disabled 
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // actions가 변경될 때마다 선택 상태 초기화
  useEffect(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, [actions]);

  // 스탯 충족 여부 확인
  const canPerformAction = (action: SuggestedAction): boolean => {
    if (!action.required_stats) return true;
    
    return Object.entries(action.required_stats).every(([statName, required]) => {
      return (currentStats[statName] || 0) >= required;
    });
  };

  // 스탯 부족 메시지
  const getMissingStats = (action: SuggestedAction): string[] => {
    if (!action.required_stats) return [];
    
    return Object.entries(action.required_stats)
      .filter(([statName, required]) => (currentStats[statName] || 0) < required)
      .map(([statName, required]) => `${statName} ${required}+ 필요`);
  };

  const handleActionClick = (action: SuggestedAction, event?: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const canPerform = canPerformAction(action);
    
    if (!canPerform) {
      // 스탯 부족 시 효과음
      soundManager.playSFX('timer_warning');
      return;
    }

    setSelectedId(action.id);
    soundManager.playSFX('action_submit');
    
    // 버튼의 focus 상태 제거 (클릭 후 하이라이트 방지)
    if (event) {
      event.currentTarget.blur();
    }
    
    onActionSelect(action);
  };

  // 키보드 단축키
  useEffect(() => {
    if (disabled) return;

    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (['A', 'B', 'C'].includes(key)) {
        const action = actions.find(a => a.id === key);
        if (action) {
          handleActionClick(action);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [actions, disabled, currentStats]);

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30 shadow-2xl mb-6">
      <h3 className="text-xl font-bold text-purple-300 mb-4 flex items-center gap-2">
        <span>💡</span>
        <span>어떻게 하시겠습니까?</span>
      </h3>

      <div className="space-y-3">
        {actions.map((action) => {
          const canPerform = canPerformAction(action);
          const missingStats = getMissingStats(action);
          const isSelected = selectedId === action.id;
          const isHovered = hoveredId === action.id;

          return (
            <button
              key={action.id}
              onClick={(e) => handleActionClick(action, e)}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={disabled || !canPerform}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'bg-purple-600/30 border-purple-400 shadow-lg shadow-purple-900/50' 
                  : canPerform
                    ? 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 hover:border-purple-500/50 hover:shadow-lg'
                    : 'bg-slate-900/50 border-red-900/50 opacity-50 cursor-not-allowed'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${isHovered && canPerform ? 'transform scale-[1.02]' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* 선택지 ID */}
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                  ${canPerform 
                    ? 'bg-purple-600/30 text-purple-300' 
                    : 'bg-red-900/30 text-red-400'
                  }
                `}>
                  {action.id}
                </div>

                {/* 텍스트 */}
                <div className="flex-1">
                  <p className={`
                    font-medium text-base leading-relaxed
                    ${canPerform ? 'text-gray-200' : 'text-red-400'}
                  `}>
                    {action.text}
                  </p>

                  {/* 스탯 부족 경고만 표시 */}
                  {!canPerform && missingStats.length > 0 && (
                    <div className="mt-2 text-xs text-red-400">
                      ⚠️ {missingStats.join(', ')}
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(action.required_stats || {}).map(([name, req]) => (
                          <span key={name} className="mr-2">
                            (현재 {name}: {currentStats[name] || 0})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 키보드 단축키 안내 */}
      <div className="mt-4 text-center text-xs text-gray-500">
        💡 팁: A, B, C 키로 빠르게 선택할 수 있습니다
      </div>
    </div>
  );
};

export default ActionChoice;
