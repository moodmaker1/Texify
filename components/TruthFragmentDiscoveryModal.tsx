import React from 'react';
import { Scenario } from '../types';

interface TruthFragmentDiscoveryModalProps {
  scenario: Scenario;
  fragmentName: string;
  fragmentDescription: string;
  discoveredCount: number;
  totalCount: number;
  onClose: () => void;
}

const TruthFragmentDiscoveryModal: React.FC<TruthFragmentDiscoveryModalProps> = ({
  scenario,
  fragmentName,
  fragmentDescription,
  discoveredCount,
  totalCount,
  onClose,
}) => {
  const getScenarioColor = () => {
    switch (scenario) {
      case Scenario.Horror:
        return {
          gradient: 'from-red-900/90 via-purple-900/90 to-indigo-900/90',
          border: 'border-red-500/50',
          glow: 'shadow-red-500/50',
          text: 'text-red-300',
          button: 'from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500'
        };
      case Scenario.Thriller:
        return {
          gradient: 'from-gray-900/90 via-blue-900/90 to-indigo-900/90',
          border: 'border-blue-500/50',
          glow: 'shadow-blue-500/50',
          text: 'text-blue-300',
          button: 'from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
        };
      case Scenario.Romance:
        return {
          gradient: 'from-pink-900/90 via-purple-900/90 to-rose-900/90',
          border: 'border-pink-500/50',
          glow: 'shadow-pink-500/50',
          text: 'text-pink-300',
          button: 'from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500'
        };
      default:
        return {
          gradient: 'from-purple-900/90 via-indigo-900/90 to-violet-900/90',
          border: 'border-purple-500/50',
          glow: 'shadow-purple-500/50',
          text: 'text-purple-300',
          button: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500'
        };
    }
  };

  const colors = getScenarioColor();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      {/* 배경 클릭 방지 */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      
      {/* 모달 컨텐츠 */}
      <div 
        className={`
          relative bg-gradient-to-br ${colors.gradient} 
          rounded-2xl shadow-2xl ${colors.glow} 
          border-2 ${colors.border}
          w-full max-w-2xl 
          animate-scale-in
          overflow-hidden
        `}
      >
        {/* 반짝이는 효과 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* 헤더 */}
        <div className="relative p-6 text-center border-b border-white/10">
          {/* 아이콘 */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="text-7xl animate-bounce">🔍</div>
              <div className="absolute -top-2 -right-2 text-4xl animate-spin-slow">✨</div>
            </div>
          </div>

          {/* 제목 */}
          <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-purple-300 to-pink-300 mb-2 animate-glow">
            진실 조각 발견!
          </h2>
          
          {/* 카운트 */}
          <div className={`text-lg font-bold ${colors.text}`}>
            {discoveredCount} / {totalCount} 발견
          </div>
        </div>

        {/* 본문 */}
        <div className="relative p-8 space-y-6">
          {/* 조각 이름 */}
          <div className="text-center">
            <div className="inline-block bg-gradient-to-r from-yellow-500/20 to-purple-500/20 border border-yellow-500/50 rounded-xl px-6 py-3 mb-4">
              <h3 className="text-2xl font-bold text-yellow-200">
                {fragmentName}
              </h3>
            </div>
          </div>

          {/* 설명 */}
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <p className="text-lg text-purple-100 leading-relaxed text-center">
              {fragmentDescription}
            </p>
          </div>

          {/* 축하 메시지 */}
          <div className="text-center">
            <p className="text-base text-purple-200 italic">
              "당신은 숨겨진 진실에 한 걸음 더 다가갔습니다..."
            </p>
          </div>

          {/* 진행도 바 */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-purple-300">
              <span>진실 발견 진행도</span>
              <span className="font-bold">{Math.round((discoveredCount / totalCount) * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-800/50 rounded-full overflow-hidden border border-purple-500/30">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 via-purple-500 to-pink-500 transition-all duration-1000 ease-out animate-progress-fill"
                style={{ width: `${(discoveredCount / totalCount) * 100}%` }}
              />
            </div>
          </div>

          {/* TRUE 엔딩 힌트 */}
          {discoveredCount === totalCount && (
            <div className="bg-gradient-to-r from-yellow-900/40 to-purple-900/40 border border-yellow-500/50 rounded-xl p-4 animate-pulse">
              <div className="text-center">
                <div className="text-2xl mb-2">🏆</div>
                <p className="text-yellow-200 font-bold text-lg">
                  모든 진실을 발견했습니다!
                </p>
                <p className="text-yellow-300 text-sm mt-1">
                  TRUE 엔딩 조건 중 하나를 달성했습니다!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 - 닫기 버튼 */}
        <div className="relative p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className={`
              w-full bg-gradient-to-r ${colors.button}
              text-white font-bold py-4 px-6 rounded-xl
              shadow-lg transition-all duration-300
              hover:scale-105 hover:shadow-2xl
              active:scale-95
              flex items-center justify-center gap-2
            `}
          >
            <span className="text-xl">✓</span>
            <span className="text-lg">확인</span>
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
          }
          50% {
            text-shadow: 0 0 40px rgba(255, 215, 0, 0.8);
          }
        }

        @keyframes progress-fill {
          from {
            width: 0%;
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }

        .animate-progress-fill {
          animation: progress-fill 1s ease-out;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}} />
    </div>
  );
};

export default TruthFragmentDiscoveryModal;

