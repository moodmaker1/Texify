import React, { useState } from 'react';
import { Scenario, ScenarioDetails, EndingCollectionItem } from '../types';
import { SCENARIO_DETAILS, STAT_DESCRIPTIONS } from '../constants';
import EndingCollectionModal from './EndingCollectionModal';

interface ScenarioSelectionProps {
  onSelectScenario: (scenario: Scenario) => void;
  endingCollection: EndingCollectionItem[];
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center text-yellow-300">
        {Array.from({ length: rating }).map((_, i) => (
            <span key={i} className="drop-shadow-lg animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>★</span>
        ))}
        {Array.from({ length: 3 - rating }).map((_, i) => (
            <span key={i} className="opacity-30">★</span>
        ))}
    </div>
);

const ScenarioCard: React.FC<{
  details: ScenarioDetails;
  onSelect: () => void;
  index: number;
}> = ({ details, onSelect, index }) => {
    const [showStats, setShowStats] = useState(false);
    const statDescriptions = STAT_DESCRIPTIONS[details.id];

    return (
        <div
            className="bg-gradient-to-br from-indigo-900/80 to-purple-900/80 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-3 border-2 border-purple-400/30 hover:border-cyan-400/70 focus-within:border-cyan-400/70 transition-all duration-500 ease-out group animate-card-fade-in-up"
            style={{
                animationDelay: `${index * 150}ms`,
                boxShadow: '0 8px 32px rgba(168, 85, 247, 0.3), inset 0 1px 1px rgba(255,255,255,0.1)'
            } as React.CSSProperties}
        >
            <div className="relative aspect-16-9 overflow-hidden border-b-2 border-purple-400/20">
                <img 
                    src={details.image} 
                    alt={details.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-90" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-950 via-transparent to-transparent opacity-80"></div>
                {/* 신비로운 빛 효과 */}
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </div>
            <div className="p-6 bg-gradient-to-b from-indigo-900/60 to-purple-900/80">
                <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300 mb-2 group-hover:from-pink-300 group-hover:to-cyan-300 transition-all duration-300"
                    style={{
                        textShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
                    }}>
                    {details.title}
                </h3>
                <p className="text-purple-200 text-sm mb-4 leading-relaxed">{details.description}</p>
                
                {/* 🆕 스탯 정보 토글 버튼 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowStats(!showStats);
                    }}
                    className="w-full text-xs text-cyan-300 hover:text-cyan-200 transition-colors duration-200 mb-2 flex items-center justify-center gap-1"
                >
                    {showStats ? '▲ 스탯 정보 숨기기' : '▼ 스탯 정보 보기'}
                </button>

                {/* 🆕 스탯 설명 (토글) */}
                {showStats && (
                    <div className="mb-4 space-y-3 text-sm bg-indigo-950/50 rounded-lg p-4 border border-purple-400/20">
                        {Object.entries(statDescriptions).map(([statName, desc]) => (
                            <div key={statName} className="border-b border-purple-400/10 last:border-0 pb-3 last:pb-0">
                                <p className="font-bold text-cyan-300 mb-2 text-base">📊 {desc.name}</p>
                                <p className="text-purple-200 mb-2 leading-relaxed">{desc.description}</p>
                                <p className="text-green-400 text-sm leading-relaxed">✅ {desc.highRisk}</p>
                                <p className="text-red-400 text-sm leading-relaxed">⚠️ {desc.lowRisk}</p>
                            </div>
                        ))}
                    </div>
                )}

                <div className="border-t border-purple-400/20 my-4"></div>
                <div className="flex justify-between items-center text-sm text-purple-300 font-medium mb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-bold">난이도</span>
                        <StarRating rating={details.difficultyStars} />
                    </div>
                    <div className="flex items-center gap-2">
                        <span role="img" aria-label="clock" className="text-lg">⏱️</span>
                        <span className="text-cyan-200">{details.playTime}</span>
                    </div>
                </div>

                {/* 🆕 시작 버튼 */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect();
                    }}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/50 transform hover:scale-105"
                >
                    🎮 게임 시작
                </button>
            </div>
        </div>
    );
};


const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ onSelectScenario, endingCollection }) => {
    const [showEndingCollection, setShowEndingCollection] = useState(false);
  return (
    <>
      {showEndingCollection && (
        <EndingCollectionModal
          collection={endingCollection}
          onClose={() => setShowEndingCollection(false)}
        />
      )}
      
      <div className="space-y-12">
        {/* 엔딩 컬렉션 버튼 */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowEndingCollection(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center gap-2"
          >
            <span className="text-xl">🏆</span>
            <span>엔딩 컬렉션</span>
            <span className="text-sm opacity-80">
              ({endingCollection.filter(e => e.unlocked).length}/{endingCollection.length})
            </span>
          </button>
        </div>
        
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 animate-title-fade-in"
              style={{
              textShadow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(168, 85, 247, 0.3)'
            }}>
          시나리오 선택
        </h2>
        <p className="text-center text-purple-200 mt-3 text-base">🌟 당신의 운명을 선택하세요 🌟</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {SCENARIO_DETAILS.map((details, index) => (
          <ScenarioCard
            key={details.id}
            details={details}
            onSelect={() => onSelectScenario(details.id)}
            index={index}
          />
        ))}
      </div>
    </div>
    </>
  );
};

export default ScenarioSelection;