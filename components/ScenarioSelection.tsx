import React from 'react';
import { Scenario, ScenarioDetails } from '../types';
import { SCENARIO_DETAILS } from '../constants';

interface ScenarioSelectionProps {
  onSelectScenario: (scenario: Scenario) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center text-amber-300">
        {Array.from({ length: rating }).map((_, i) => (
            <span key={i} className="drop-shadow-lg">★</span>
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
}> = ({ details, onSelect, index }) => (
    <div
        className="bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl hover:shadow-purple-500/50 hover:-translate-y-3 border border-purple-500/30 hover:border-purple-400 focus-within:border-purple-400 transition-all duration-500 ease-out cursor-pointer group animate-card-fade-in-up"
        onClick={onSelect}
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onSelect()}
        style={{
            animationDelay: `${index * 150}ms`,
        } as React.CSSProperties}
    >
        <div className="relative aspect-16-9 overflow-hidden">
            <img 
                src={details.image} 
                alt={details.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-75 group-hover:brightness-100" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
        </div>
        <div className="p-6">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2 group-hover:from-purple-200 group-hover:to-pink-200 transition-all duration-300">
                {details.title}
            </h3>
            <p className="text-gray-300 text-sm mb-4 h-10 leading-relaxed">{details.description}</p>
            <div className="border-t border-purple-500/30 my-4"></div>
            <div className="flex justify-between items-center text-sm text-gray-400 font-medium">
                <div className="flex items-center gap-2">
                    <span className="text-purple-300 font-bold">난이도</span>
                    <StarRating rating={details.difficultyStars} />
                </div>
                <div className="flex items-center gap-2">
                    <span role="img" aria-label="clock" className="text-lg">⏱️</span>
                    <span className="text-gray-300">{details.playTime}</span>
                </div>
            </div>
        </div>
    </div>
);


const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ onSelectScenario }) => {
  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-4xl md:text-5xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 animate-title-fade-in drop-shadow-2xl">
          시나리오 선택
        </h2>
        <p className="text-center text-purple-300/70 mt-3 text-sm">당신의 운명을 선택하세요</p>
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
  );
};

export default ScenarioSelection;