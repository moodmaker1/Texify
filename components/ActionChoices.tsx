import React, { useState } from 'react';
import { SuggestedAction, Stats } from '../types';

interface ActionChoicesProps {
  actions: SuggestedAction[];
  currentStats: Stats;
  onSelect: (actionId: string) => void;
  disabled: boolean;
}

const ActionChoices: React.FC<ActionChoicesProps> = ({ 
  actions, 
  currentStats, 
  onSelect, 
  disabled 
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-purple-300 mb-4">
        💡 어떻게 하시겠습니까?
      </h3>
      
      {actions.map((action) => {
        const canPerform = canPerformAction(action);
        const missingStats = getMissingStats(action);
        const isHovered = hoveredId === action.id;
        
        return (
          <button
            key={action.id}
            onClick={() => canPerform && !disabled && onSelect(action.id)}
            onMouseEnter={() => setHoveredId(action.id)}
            onMouseLeave={() => setHoveredId(null)}
            disabled={!canPerform || disabled}
            className={`
              w-full text-left p-4 rounded-xl border-2 transition-all duration-300
              ${canPerform 
                ? 'bg-slate-800/60 border-purple-500/30 hover:border-purple-400 hover:bg-slate-800/80 cursor-pointer' 
                : 'bg-slate-900/40 border-gray-600/20 cursor-not-allowed opacity-50'
              }
              ${isHovered && canPerform ? 'transform scale-[1.02] shadow-lg shadow-purple-900/30' : ''}
              disabled:cursor-not-allowed
            `}
          >
            <div className="flex items-start gap-4">
              {/* 선택지 ID */}
              <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                ${canPerform 
                  ? 'bg-purple-600/30 text-purple-300' 
                  : 'bg-gray-700/30 text-gray-500'
                }
              `}>
                {action.id}
              </div>
              
              {/* 내용 */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{action.emoji}</span>
                  <span className={`font-medium ${canPerform ? 'text-gray-200' : 'text-gray-500'}`}>
                    {action.text}
                  </span>
                </div>
                
                {/* 스탯 변화 정보 */}
                {canPerform && Object.keys(action.stat_changes).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Object.entries(action.stat_changes).map(([statName, change]) => (
                      <span 
                        key={statName}
                        className={`text-xs px-2 py-1 rounded ${
                          change < 0 
                            ? 'bg-red-900/30 text-red-300' 
                            : 'bg-green-900/30 text-green-300'
                        }`}
                      >
                        {statName} {change > 0 ? '+' : ''}{change}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 스탯 부족 경고 */}
                {!canPerform && missingStats.length > 0 && (
                  <div className="mt-2 text-xs text-red-400">
                    ⚠️ {missingStats.join(', ')}
                  </div>
                )}
              </div>
              
              {/* 키보드 힌트 */}
              {canPerform && (
                <div className="flex-shrink-0 text-xs text-gray-500 mt-2">
                  {action.id}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ActionChoices;
