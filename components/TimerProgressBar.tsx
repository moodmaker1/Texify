import React, { useEffect, useRef } from 'react';
import { Scenario } from '../types';
import { TIMER_DURATION, TIMER_THEMES } from '../constants';
import { soundManager } from '../services/soundManager';

interface TimerProgressBarProps {
  scenario: Scenario;
  timeRemaining: number;
  isActive: boolean;
}

const TimerProgressBar: React.FC<TimerProgressBarProps> = ({ scenario, timeRemaining, isActive }) => {
  const theme = TIMER_THEMES[scenario];
  const percentage = (timeRemaining / TIMER_DURATION) * 100;
  
  // 경고음 재생 제어 (중복 방지)
  const lastWarningLevel = useRef<string | null>(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    // 30초: 경고 1
    if (timeRemaining === 30 && lastWarningLevel.current !== 'warning1') {
      soundManager.playSFX('timer_warning');
      lastWarningLevel.current = 'warning1';
    }
    // 15초: 경고 2
    else if (timeRemaining === 15 && lastWarningLevel.current !== 'warning2') {
      soundManager.playSFX('timer_warning');
      lastWarningLevel.current = 'warning2';
    }
    // 5초: 위험
    else if (timeRemaining === 5 && lastWarningLevel.current !== 'danger') {
      soundManager.playSFX('timer_danger');
      lastWarningLevel.current = 'danger';
    }
  }, [timeRemaining, isActive]);
  
  // 경고 단계 결정
  const getWarningLevel = (): 'normal' | 'warning1' | 'warning2' | 'danger' => {
    if (timeRemaining <= 5) return 'danger';
    if (timeRemaining <= 15) return 'warning2';
    if (timeRemaining <= 30) return 'warning1';
    return 'normal';
  };

  const warningLevel = getWarningLevel();
  const currentColor = theme.colors[warningLevel];
  
  // 경고 메시지
  const getMessage = (): string | null => {
    if (timeRemaining <= 5) {
      return theme.messages.danger.replace('{seconds}', timeRemaining.toString());
    }
    if (timeRemaining <= 15) return theme.messages.warning2;
    if (timeRemaining <= 30) return theme.messages.warning1;
    return null;
  };

  const message = getMessage();

  // 애니메이션 클래스
  const getAnimationClass = (): string => {
    if (timeRemaining <= 5) return 'animate-pulse-fast';
    if (timeRemaining <= 15) return 'animate-pulse-medium';
    if (timeRemaining <= 30) return 'animate-pulse-slow';
    return '';
  };

  // 시나리오별 배경 그라데이션
  const getBackgroundGradient = (): string => {
    switch (scenario) {
      case Scenario.Horror:
        return 'from-black/90 via-black/70 to-transparent';
      case Scenario.Thriller:
        return 'from-orange-900/90 via-red-900/70 to-transparent';
      case Scenario.Romance:
        return 'from-pink-900/90 via-pink-800/70 to-transparent';
      default:
        return 'from-black/90 via-black/70 to-transparent';
    }
  };

  // 투명도 조절
  const getOpacity = (): string => {
    if (timeRemaining <= 15) return 'opacity-95';
    if (timeRemaining <= 30) return 'opacity-85';
    return 'opacity-75';
  };

  if (!isActive) return null;

  return (
    <div 
      className={`bg-slate-900/80 backdrop-blur-md rounded-xl border-2 p-5 shadow-2xl transition-all duration-500 ${getAnimationClass()}`}
      style={{
        borderColor: currentColor,
        boxShadow: `0 0 20px ${currentColor}40`,
      }}
    >
      {/* 경고 메시지 */}
      {message && (
        <div 
          className="text-center mb-3 font-bold text-lg animate-pulse"
          style={{ color: currentColor }}
        >
          {message}
        </div>
      )}
      
      {/* 프로그레스 바 */}
      <div className="relative">
        {/* 배경 바 */}
        <div className="w-full h-4 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
          {/* 진행 바 */}
          <div
            className="h-full transition-all duration-1000 ease-linear relative"
            style={{
              width: `${percentage}%`,
              backgroundColor: currentColor,
              boxShadow: `0 0 20px ${currentColor}`,
            }}
          >
            {/* 빛나는 효과 */}
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
            />
          </div>
        </div>
        
        {/* 시간 표시 */}
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2">
            <span 
              className="text-2xl font-black tabular-nums"
              style={{ color: currentColor }}
            >
              {timeRemaining <= 15 ? '⏰' : '⏱️'} {timeRemaining}
            </span>
            <span 
              className="text-sm font-semibold"
              style={{ color: currentColor }}
            >
              초 남음
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              제한 시간
            </div>
            <div className="text-base font-bold text-gray-300">
              {TIMER_DURATION}초
            </div>
          </div>
        </div>
      </div>
      
      {/* 추가 스타일 */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default TimerProgressBar;
