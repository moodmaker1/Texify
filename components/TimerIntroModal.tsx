import React, { useState, useEffect } from 'react';
import { Scenario } from '../types';

interface TimerIntroModalProps {
  scenario: Scenario;
  onClose: () => void;
}

const TimerIntroModal: React.FC<TimerIntroModalProps> = ({ scenario, onClose }) => {
  const [countdown, setCountdown] = useState(10);
  
  // 카운트다운 로직
  useEffect(() => {
    if (countdown <= 0) {
      onClose();
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown, onClose]);
  const getContent = () => {
    switch (scenario) {
      case Scenario.Horror:
        return {
          icon: '⏱️',
          title: '잠깐! 중요한 규칙',
          description: (
            <>
              <p className="mb-3">403호에서는 시간이 당신의 적입니다.</p>
              <p className="mb-3">매 행동마다 <strong className="text-red-400">60초</strong>의 제한 시간이 주어집니다.</p>
              <p className="mb-4">시간 내 결정하지 못하면...</p>
              <p className="text-red-400 font-bold animate-pulse">어둠이 당신을 삼킬 것입니다.</p>
            </>
          ),
          buttonText: '무서워요... 준비됐어요!',
          bgGradient: 'from-slate-900 via-purple-950 to-slate-900',
          borderColor: 'border-red-500/50',
          buttonGradient: 'from-red-600 to-red-800',
          buttonHover: 'hover:from-red-500 hover:to-red-700',
        };
      
      case Scenario.Thriller:
        return {
          icon: '🚨',
          title: '긴급 안내',
          description: (
            <>
              <p className="mb-3">인질극 상황에서는 빠른 판단이 생명입니다.</p>
              <p className="mb-3">매 순간 <strong className="text-amber-400">60초</strong> 안에 행동해야 합니다.</p>
              <p className="mb-4"></p>
              <p className="text-amber-400 font-bold animate-pulse">시간 초과 시 테러범이 실행에 옮깁니다!</p>
            </>
          ),
          buttonText: '알겠습니다. 시작!',
          bgGradient: 'from-slate-900 via-orange-950 to-slate-900',
          borderColor: 'border-amber-500/50',
          buttonGradient: 'from-amber-600 to-orange-700',
          buttonHover: 'hover:from-amber-500 hover:to-orange-600',
        };
      
      case Scenario.Romance:
        return {
          icon: '💭',
          title: '소중한 시간',
          description: (
            <>
              <p className="mb-3">10년 만의 재회, 매 순간이 소중합니다.</p>
              <p className="mb-3">각 대화마다 <strong className="text-pink-400">60초</strong>가 주어집니다.</p>
              <p className="mb-4">너무 오래 망설이면...</p>
              <p className="text-pink-400 font-bold animate-pulse">그 사람은 떠날 수도 있어요.</p>
            </>
          ),
          buttonText: '네, 준비됐어요!',
          bgGradient: 'from-slate-900 via-pink-950 to-slate-900',
          borderColor: 'border-pink-500/50',
          buttonGradient: 'from-pink-600 to-pink-800',
          buttonHover: 'hover:from-pink-500 hover:to-pink-700',
        };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center animate-fade-in">
      {/* 배경 오버레이 */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* 모달 컨텐츠 */}
      <div 
        className={`relative max-w-md mx-4 p-8 rounded-2xl bg-gradient-to-br ${content.bgGradient} border-2 ${content.borderColor} shadow-2xl animate-scale-in`}
      >
        {/* 아이콘 */}
        <div className="text-6xl text-center mb-4 animate-bounce-slow">
          {content.icon}
        </div>
        
        {/* 타이틀 */}
        <h2 className="text-3xl font-black text-center mb-6 text-white">
          {content.title}
        </h2>
        
        {/* 설명 */}
        <div className="text-gray-200 text-center leading-relaxed mb-8">
          {content.description}
        </div>
        
        {/* 버튼 */}
        <button
          onClick={onClose}
          className={`w-full py-4 px-6 rounded-full font-bold text-white text-lg bg-gradient-to-r ${content.buttonGradient} ${content.buttonHover} transition-all duration-300 shadow-lg transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white/50`}
        >
          {content.buttonText}
        </button>
        
        {/* 카운트다운 표시 */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-800/50 px-6 py-3 rounded-full border border-gray-600/50">
            <span className="text-gray-300 text-sm">
              자동 시작까지
            </span>
            <div 
              className={`text-3xl font-black tabular-nums transition-all duration-300 ${
                countdown <= 3 ? 'text-red-400 animate-pulse-fast scale-110' : 
                countdown <= 5 ? 'text-yellow-400 animate-pulse-medium' : 
                'text-green-400'
              }`}
            >
              {countdown}
            </div>
            <span className="text-gray-300 text-sm">
              초
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerIntroModal;
