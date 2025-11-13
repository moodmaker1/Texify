import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number; // 글자당 ms
  onComplete?: () => void;
  className?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 30, 
  onComplete,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSkipped, setIsSkipped] = useState(false);

  // 타이핑 효과
  useEffect(() => {
    if (isSkipped) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      if (onComplete) onComplete();
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete, isSkipped]);

  // 텍스트 변경 시 초기화
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsSkipped(false);
  }, [text]);

  // 클릭 시 스킵
  const handleSkip = () => {
    if (currentIndex < text.length) {
      setIsSkipped(true);
    }
  };

  return (
    <div 
      className={`${className} cursor-pointer relative`}
      onClick={handleSkip}
      title={currentIndex < text.length ? "클릭하여 스킵" : ""}
    >
      <p className="whitespace-pre-wrap leading-relaxed">
        {displayedText}
        {currentIndex < text.length && (
          <span className="animate-pulse ml-0.5">▊</span>
        )}
      </p>
      
      {currentIndex < text.length && (
        <div className="absolute bottom-0 right-0 text-xs text-gray-500 animate-pulse">
          클릭하여 스킵 →
        </div>
      )}
    </div>
  );
};

export default TypewriterText;
