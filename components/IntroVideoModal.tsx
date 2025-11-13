import React, { useEffect, useRef, useState } from 'react';
import { Scenario } from '../types';
import { soundManager } from '../services/soundManager';
import TypewriterText from './TypewriterText';

interface IntroVideoModalProps {
  scenario: Scenario;
  onComplete: () => void;
}

const IntroVideoModal: React.FC<IntroVideoModalProps> = ({ scenario, onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // 효과음 재생
    soundManager.playSFX('opening_door');
    
    // 시나리오 BGM 재생
    soundManager.playBGM(scenario);

    // 자동 재생 시도
    const playVideo = async () => {
      try {
        await video.play();
      } catch (error) {
        console.warn('자동 재생 실패:', error);
      }
    };

    playVideo();

    // 동영상 종료 시 콜백
    const handleEnded = () => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500);
    };

    video.addEventListener('ended', handleEnded);

    // 7초 타임아웃
    const timeout = setTimeout(() => {
      if (!video.ended) {
        handleEnded();
      }
    }, 7500);

    return () => {
      video.removeEventListener('ended', handleEnded);
      clearTimeout(timeout);
    };
  }, [scenario, onComplete]);

  const getScenarioTheme = () => {
    switch (scenario) {
      case Scenario.Horror:
        return {
          bgGradient: 'from-black via-purple-950 to-black',
          glow: 'shadow-purple-500/50',
          textColor: 'text-purple-300',
        };
      case Scenario.Thriller:
        return {
          bgGradient: 'from-black via-orange-950 to-black',
          glow: 'shadow-orange-500/50',
          textColor: 'text-orange-300',
        };
      case Scenario.Romance:
        return {
          bgGradient: 'from-black via-pink-950 to-black',
          glow: 'shadow-pink-500/50',
          textColor: 'text-pink-300',
        };
      default:
        return {
          bgGradient: 'from-black via-purple-950 to-black',
          glow: 'shadow-purple-500/50',
          textColor: 'text-purple-300',
        };
    }
  };

  const getScenarioMessage = () => {
    switch (scenario) {
      case Scenario.Horror:
        return '403호가 당신을 부릅니다...';
      case Scenario.Thriller:
        return '긴급 상황 발생...';
      case Scenario.Romance:
        return '10년 전의 약속...';
      default:
        return '준비 중...';
    }
  };

  const theme = getScenarioTheme();
  const message = getScenarioMessage();

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in forwards;
        }
        .animate-fadeOut {
          animation: fadeOut 0.5s ease-out forwards;
        }
      `}</style>

      {/* 전체 화면 오버레이 */}
      <div 
        className={`
          fixed inset-0 z-50 flex items-center justify-center
          bg-gradient-to-br ${theme.bgGradient}
          ${isVisible ? 'animate-fadeIn' : 'animate-fadeOut'}
        `}
      >
        {/* 동영상 컨테이너 */}
        <div className={`relative w-full max-w-6xl mx-4 rounded-2xl overflow-hidden shadow-2xl ${theme.glow}`}>
          <video
            ref={videoRef}
            className="w-full h-auto"
            muted
            playsInline
            preload="auto"
          >
            <source src="/door.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* 로딩 오버레이 (동영상 로딩 중) */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center px-4">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-6"></div>
              <div className={`text-2xl font-bold ${theme.textColor} drop-shadow-lg`}>
                <TypewriterText 
                  text={message}
                  speed={80}
                  className="text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntroVideoModal;
