import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager';

interface SoundControlProps {
  inGame?: boolean;
}

const SoundControl: React.FC<SoundControlProps> = ({ inGame = false }) => {
  const [isMuted, setIsMuted] = useState(soundManager.getMuted());

  const toggleSound = () => {
    const newMuteState = soundManager.toggleMute();
    setIsMuted(newMuteState);
  };

  // 게임 내부에서는 다른 스타일
  if (inGame) {
    return (
      <button
        onClick={toggleSound}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-900/70 backdrop-blur-md border-2 border-purple-400/30 rounded-xl text-purple-100 hover:text-cyan-300 hover:border-cyan-400/60 hover:shadow-cyan-400/30 transition-all duration-300 shadow-lg shadow-purple-500/20"
        title={isMuted ? '소리 켜기' : '소리 끄기'}
      >
        <span className="text-xl">
          {isMuted ? '🔇' : '🔊'}
        </span>
      </button>
    );
  }

  // 메인 화면에서는 플로팅 버튼
  return (
    <button
      onClick={toggleSound}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-slate-900/80 backdrop-blur-sm border-2 border-purple-500/50 rounded-full flex items-center justify-center hover:bg-slate-800/80 hover:border-purple-400 transition-all duration-300 shadow-2xl shadow-purple-900/50 hover:scale-110"
      title={isMuted ? '소리 켜기' : '소리 끄기'}
    >
      <span className="text-2xl">
        {isMuted ? '🔇' : '🔊'}
      </span>
    </button>
  );
};

export default SoundControl;
