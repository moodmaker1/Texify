import React from 'react';
import { Scenario, ScenarioDetails } from '../types';
import { SCENARIO_DETAILS } from '../constants';

interface ScenarioSelectionProps {
  onSelectScenario: (scenario: Scenario) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
    <div className="flex items-center text-amber-400">
        {'★'.repeat(rating)}
        {'☆'.repeat(3 - rating)}
    </div>
);

const ScenarioCard: React.FC<{
  details: ScenarioDetails;
  onSelect: () => void;
  index: number;
}> = ({ details, onSelect, index }) => (
    <div
        className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-2 border border-gray-200 focus-within:border-transparent transition-all duration-300 ease-out cursor-pointer group animate-card-fade-in-up"
        onClick={onSelect}
        tabIndex={0}
        onKeyPress={(e) => e.key === 'Enter' && onSelect()}
        style={{
            animationDelay: `${index * 150}ms`,
            '--genre-color': details.color, // CSS variable for hover/focus
        } as React.CSSProperties}
    >
        <style>{`
            .group:hover, .group:focus-within {
                border-color: var(--genre-color);
            }
        `}</style>
        <div className="aspect-16-9 overflow-hidden">
            <img src={details.image} alt={details.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
        <div className="p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{details.title}</h3>
            <p className="text-gray-600 text-sm mb-4 h-10">{details.description}</p>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="flex justify-between items-center text-sm text-gray-500 font-medium">
                <div className="flex items-center gap-2">
                    <span className="text-gray-700 font-bold">난이도</span>
                    <StarRating rating={details.difficultyStars} />
                </div>
                <div className="flex items-center gap-2">
                    <span role="img" aria-label="clock">⏱️</span>
                    <span>{details.playTime}</span>
                </div>
            </div>
        </div>
    </div>
);


const ScenarioSelection: React.FC<ScenarioSelectionProps> = ({ onSelectScenario }) => {
  return (
    <div className="space-y-12">
      <h2 className="text-4xl md:text-5xl font-black text-center text-gray-900 animate-title-fade-in">
        시나리오 선택
      </h2>
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