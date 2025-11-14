import React, { useState, useEffect } from 'react';
import { SuggestedAction, Stats, Scenario, StatRiskLevel } from '../types';
import { soundManager } from '../services/soundManager';
import { STAT_THRESHOLDS } from '../constants';

interface ActionChoiceProps {
  actions: SuggestedAction[];
  currentStats: Stats;
  onActionSelect: (action: SuggestedAction) => void;
  disabled: boolean;
  scenario: Scenario;
}

const ActionChoice: React.FC<ActionChoiceProps> = ({ 
  actions, 
  currentStats, 
  onActionSelect,
  disabled,
  scenario
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // actions가 변경될 때마다 선택 상태 초기화
  useEffect(() => {
    setSelectedId(null);
    setHoveredId(null);
  }, [actions]);

  // 🆕 스탯 위험 레벨 계산
  const getStatRiskLevel = (statName: string, value: number): StatRiskLevel => {
    const threshold = STAT_THRESHOLDS[scenario]?.[statName];
    if (!threshold) return StatRiskLevel.SAFE;

    // 특수 스탯 (공포도, 긴장도 등) - 높을수록 위험
    const isDangerousWhenHigh = ['공포도', '긴장도'].includes(statName);

    if (isDangerousWhenHigh) {
      if (value >= threshold.criticalHigh) return StatRiskLevel.CRITICAL;
      if (value >= threshold.warningHigh) return StatRiskLevel.DANGER;
      if (value <= threshold.criticalLow) return StatRiskLevel.CRITICAL;
      if (value <= threshold.warningLow) return StatRiskLevel.WARNING;
    } else {
      // 일반 스탯 (정신력, 체력 등) - 낮을수록 위험
      if (value <= threshold.criticalLow) return StatRiskLevel.CRITICAL;
      if (value <= threshold.warningLow) return StatRiskLevel.DANGER;
    }

    return StatRiskLevel.SAFE;
  };

  // 🆕 위험 레벨에 따른 색상
  const getRiskColor = (riskLevel: StatRiskLevel): string => {
    switch (riskLevel) {
      case StatRiskLevel.CRITICAL: return 'text-red-500';
      case StatRiskLevel.DANGER: return 'text-orange-500';
      case StatRiskLevel.WARNING: return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  // 🆕 위험 레벨 아이콘
  const getRiskIcon = (riskLevel: StatRiskLevel): string => {
    switch (riskLevel) {
      case StatRiskLevel.CRITICAL: return '🔴';
      case StatRiskLevel.DANGER: return '🟠';
      case StatRiskLevel.WARNING: return '🟡';
      default: return '🟢';
    }
  };

  // 스탯 충족 여부 확인 (50% 미만이면 완전 비활성화)
  const canPerformAction = (action: SuggestedAction): 'full' | 'risky' | 'blocked' => {
    if (!action.required_stats) return 'full';
    
    let hasBlocked = false;
    let hasRisky = false;

    Object.entries(action.required_stats).forEach(([statName, required]) => {
      const current = currentStats[statName] || 0;
      const percentage = (current / required) * 100;

      if (percentage < 50) {
        hasBlocked = true;
      } else if (percentage < 100) {
        hasRisky = true;
      }
    });

    if (hasBlocked) return 'blocked';
    if (hasRisky) return 'risky';
    return 'full';
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
    
    const performStatus = canPerformAction(action);
    
    if (performStatus === 'blocked') {
      // 스탯 부족 시 효과음
      soundManager.playSFX('timer_warning');
      return;
    }

    if (performStatus === 'risky') {
      // 위험 선택 시 경고음
      soundManager.playSFX('timer_warning');
    } else {
      soundManager.playSFX('action_submit');
    }

    setSelectedId(action.id);
    
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
          const performStatus = canPerformAction(action);
          const missingStats = getMissingStats(action);
          const isSelected = selectedId === action.id;
          const isHovered = hoveredId === action.id;
          const isBlocked = performStatus === 'blocked';
          const isRisky = performStatus === 'risky';
          const isFull = performStatus === 'full';

          return (
            <button
              key={action.id}
              onClick={(e) => handleActionClick(action, e)}
              onMouseEnter={() => setHoveredId(action.id)}
              onMouseLeave={() => setHoveredId(null)}
              disabled={disabled || isBlocked}
              className={`
                w-full text-left p-4 rounded-xl border-2 transition-all duration-300
                ${isSelected 
                  ? 'bg-purple-600/30 border-purple-400 shadow-lg shadow-purple-900/50' 
                  : isBlocked
                    ? 'bg-slate-900/50 border-red-900/50 opacity-50 cursor-not-allowed'
                    : isRisky
                      ? 'bg-slate-800/50 border-yellow-700 hover:bg-slate-800/80 hover:border-yellow-500/50 hover:shadow-lg'
                      : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800/80 hover:border-purple-500/50 hover:shadow-lg'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                ${isHovered && !isBlocked ? 'transform scale-[1.02]' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* 선택지 ID */}
                <div className={`
                  flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                  ${isBlocked
                    ? 'bg-red-900/30 text-red-400'
                    : isRisky
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : 'bg-purple-600/30 text-purple-300'
                  }
                `}>
                  {action.id}
                </div>

                {/* 텍스트 */}
                <div className="flex-1">
                  <p className={`
                    font-medium text-base leading-relaxed
                    ${isBlocked ? 'text-red-400' : isRisky ? 'text-yellow-300' : 'text-gray-200'}
                  `}>
                    {action.text}
                  </p>

                  {/* 🆕 위험 선택지 경고 */}
                  {isRisky && (
                    <div className="mt-2 text-xs text-yellow-400">
                      ⚠️ 위험한 선택! 실패 확률이 높습니다
                      <div className="text-xs text-gray-400 mt-1">
                        {Object.entries(action.required_stats || {}).map(([name, req]) => {
                          const current = currentStats[name] || 0;
                          const percentage = Math.floor((current / req) * 100);
                          return (
                            <span key={name} className="mr-2">
                              {name}: {current}/{req} ({percentage}%)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 스탯 부족 경고 (완전 차단) */}
                  {isBlocked && missingStats.length > 0 && (
                    <div className="mt-2 text-xs text-red-400">
                      🚫 선택 불가 - {missingStats.join(', ')}
                      <div className="text-xs text-gray-500 mt-1">
                        {Object.entries(action.required_stats || {}).map(([name, req]) => {
                          const current = currentStats[name] || 0;
                          const percentage = Math.floor((current / req) * 100);
                          return (
                            <span key={name} className="mr-2">
                              {name}: {current}/{req} ({percentage}%)
                            </span>
                          );
                        })}
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
