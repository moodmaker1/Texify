import React, { useMemo } from 'react';
import { Scenario, EndingCollectionItem, EndingType, EndingCollectionStats } from '../types';

interface EndingCollectionModalProps {
  collection: EndingCollectionItem[];
  onClose: () => void;
}

const EndingCollectionModal: React.FC<EndingCollectionModalProps> = ({ collection, onClose }) => {
  // 통계 계산
  const stats: EndingCollectionStats = useMemo(() => {
    const totalEndings = collection.length;
    const unlockedEndings = collection.filter(e => e.unlocked).length;
    const trueEndingsUnlocked = collection.filter(e => e.unlocked && e.type === EndingType.TRUE).length;
    const hiddenEndingsUnlocked = collection.filter(e => e.unlocked && e.type === EndingType.HIDDEN).length;
    const completionRate = totalEndings > 0 ? (unlockedEndings / totalEndings) * 100 : 0;
    
    return {
      totalEndings,
      unlockedEndings,
      trueEndingsUnlocked,
      hiddenEndingsUnlocked,
      completionRate
    };
  }, [collection]);
  
  // 시나리오별 그룹화
  const groupedByScenario = useMemo(() => {
    const groups: Record<Scenario, EndingCollectionItem[]> = {
      [Scenario.Horror]: [],
      [Scenario.Thriller]: [],
      [Scenario.Romance]: []
    };
    
    collection.forEach(item => {
      groups[item.scenario].push(item);
    });
    
    return groups;
  }, [collection]);
  
  const getEndingTypeColor = (type: EndingType) => {
    switch (type) {
      case EndingType.TRUE:
        return 'text-yellow-300 border-yellow-500/50 bg-yellow-900/20';
      case EndingType.GOOD:
        return 'text-green-300 border-green-500/50 bg-green-900/20';
      case EndingType.NORMAL:
        return 'text-blue-300 border-blue-500/50 bg-blue-900/20';
      case EndingType.BAD:
        return 'text-red-300 border-red-500/50 bg-red-900/20';
      case EndingType.HIDDEN:
        return 'text-purple-300 border-purple-500/50 bg-purple-900/20';
      default:
        return 'text-gray-300 border-gray-500/50 bg-gray-900/20';
    }
  };
  
  const getEndingTypeLabel = (type: EndingType) => {
    switch (type) {
      case EndingType.TRUE:
        return 'TRUE';
      case EndingType.GOOD:
        return 'GOOD';
      case EndingType.NORMAL:
        return 'NORMAL';
      case EndingType.BAD:
        return 'BAD';
      case EndingType.HIDDEN:
        return 'HIDDEN';
      default:
        return 'UNKNOWN';
    }
  };
  
  const getScenarioName = (scenario: Scenario) => {
    switch (scenario) {
      case Scenario.Horror:
        return '거울 속의 당신';
      case Scenario.Thriller:
        return '지하철 13호선';
      case Scenario.Romance:
        return '벚꽃의 기억';
      default:
        return scenario;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-indigo-950 via-purple-900 to-violet-950 rounded-2xl shadow-2xl border-2 border-purple-500/30 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
              🏆 엔딩 컬렉션
            </h2>
            <button
              onClick={onClose}
              className="text-purple-300 hover:text-purple-100 text-2xl font-bold transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-indigo-900/40 rounded-lg p-3 border border-cyan-500/30">
              <div className="text-xs text-cyan-300 mb-1">전체 엔딩</div>
              <div className="text-2xl font-bold text-cyan-200">{stats.totalEndings}</div>
            </div>
            <div className="bg-indigo-900/40 rounded-lg p-3 border border-purple-500/30">
              <div className="text-xs text-purple-300 mb-1">해금 엔딩</div>
              <div className="text-2xl font-bold text-purple-200">{stats.unlockedEndings}</div>
            </div>
            <div className="bg-indigo-900/40 rounded-lg p-3 border border-yellow-500/30">
              <div className="text-xs text-yellow-300 mb-1">TRUE 엔딩</div>
              <div className="text-2xl font-bold text-yellow-200">{stats.trueEndingsUnlocked}</div>
            </div>
            <div className="bg-indigo-900/40 rounded-lg p-3 border border-purple-500/30">
              <div className="text-xs text-purple-300 mb-1">HIDDEN 엔딩</div>
              <div className="text-2xl font-bold text-purple-200">{stats.hiddenEndingsUnlocked}</div>
            </div>
            <div className="bg-indigo-900/40 rounded-lg p-3 border border-green-500/30">
              <div className="text-xs text-green-300 mb-1">완성도</div>
              <div className="text-2xl font-bold text-green-200">{stats.completionRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
        
        {/* 컬렉션 목록 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.entries(groupedByScenario).map(([scenario, endings]) => (
            <div key={scenario}>
              <h3 className="text-xl font-bold text-purple-200 mb-3">
                {getScenarioName(scenario as Scenario)}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {endings.map(ending => (
                  <div
                    key={ending.id}
                    className={`
                      rounded-lg p-4 border transition-all duration-300
                      ${ending.unlocked 
                        ? `${getEndingTypeColor(ending.type)} opacity-100` 
                        : 'bg-gray-900/40 border-gray-700/50 opacity-50'
                      }
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{ending.unlocked ? '✅' : '🔒'}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${getEndingTypeColor(ending.type)}`}>
                            {getEndingTypeLabel(ending.type)}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm">
                          {ending.unlocked ? ending.title : '???'}
                        </h4>
                      </div>
                    </div>
                    {ending.unlocked && ending.description && (
                      <p className="text-xs text-gray-300 line-clamp-3">
                        {ending.description.split('\n')[0]}
                      </p>
                    )}
                    {ending.unlocked && ending.unlockedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        해금: {new Date(ending.unlockedAt).toLocaleDateString('ko-KR')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* 푸터 */}
        <div className="p-4 border-t border-purple-500/30 bg-indigo-950/50">
          <p className="text-center text-sm text-purple-300">
            💡 다양한 선택으로 숨겨진 엔딩을 찾아보세요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default EndingCollectionModal;

