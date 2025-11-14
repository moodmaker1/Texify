import React, { useState } from 'react';
import { Scenario } from '../types';
import { STAT_GUIDE_DATA } from '../constants';

interface StatGuideModalProps {
  scenario: Scenario;
  onClose: () => void;
}

const StatGuideModal: React.FC<StatGuideModalProps> = ({ scenario, onClose }) => {
  const guideData = STAT_GUIDE_DATA[scenario];
  const [activeTab, setActiveTab] = useState<'stats' | 'rules'>('stats');

  // 시나리오별 액센트 색상
  const getAccentColor = () => {
    switch (scenario) {
      case Scenario.Horror:
        return { primary: 'from-red-500 to-pink-500', glow: 'shadow-red-500/50', border: 'border-red-500/30' };
      case Scenario.Thriller:
        return { primary: 'from-orange-500 to-yellow-500', glow: 'shadow-orange-500/50', border: 'border-orange-500/30' };
      case Scenario.Romance:
        return { primary: 'from-pink-500 to-purple-500', glow: 'shadow-pink-500/50', border: 'border-pink-500/30' };
      default:
        return { primary: 'from-purple-500 to-indigo-500', glow: 'shadow-purple-500/50', border: 'border-purple-500/30' };
    }
  };

  const colors = getAccentColor();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
      >
        {/* 헤더 */}
        <div className="relative bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm px-8 py-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className={`text-3xl font-bold bg-gradient-to-r ${colors.primary} bg-clip-text text-transparent`}>
                {guideData.title}
              </h2>
              <p className="text-slate-400 text-sm mt-1">게임 시작 전 필수 안내</p>
            </div>
            <div className={`px-4 py-2 bg-gradient-to-r ${colors.primary} rounded-lg ${colors.glow} shadow-lg`}>
              <p className="text-white text-sm font-bold">필독</p>
            </div>
          </div>

          {/* 탭 */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'stats'
                  ? `bg-gradient-to-r ${colors.primary} text-white ${colors.glow} shadow-lg`
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              📊 스탯 시스템
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all duration-300 ${
                activeTab === 'rules'
                  ? `bg-gradient-to-r ${colors.primary} text-white ${colors.glow} shadow-lg`
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              }`}
            >
              ⚠️ 생존 규칙
            </button>
          </div>
        </div>

        {/* 본문 */}
        <div className="overflow-y-auto max-h-[calc(92vh-200px)] p-8">
          {activeTab === 'stats' ? (
            // 스탯 탭
            <div className="space-y-6">
              <div className={`bg-gradient-to-r ${colors.primary} p-[1px] rounded-xl`}>
                <div className="bg-slate-900 rounded-xl p-4">
                  <p className="text-slate-300 text-center font-medium">
                    💡 {guideData.tone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {guideData.stats.map((stat) => (
                  <div
                    key={stat.name}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-slate-600 transition-all duration-300 hover:transform hover:scale-105"
                  >
                    {/* 아이콘 & 이름 */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.primary} flex items-center justify-center text-3xl ${colors.glow} shadow-lg`}>
                        {stat.emoji}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{stat.name}</h3>
                        <p className="text-slate-400 text-sm">시작: {stat.startValue}</p>
                      </div>
                    </div>

                    {/* 설명 */}
                    <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                      {stat.description}
                    </p>

                    {/* 효과 */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 bg-green-950/30 rounded-lg p-2 border border-green-500/20">
                        <span className="text-green-400 text-xs">▲</span>
                        <p className="text-green-300 text-xs flex-1">{stat.highEffect}</p>
                      </div>
                      <div className="flex items-start gap-2 bg-red-950/30 rounded-lg p-2 border border-red-500/20">
                        <span className="text-red-400 text-xs">▼</span>
                        <p className="text-red-300 text-xs flex-1">{stat.lowEffect}</p>
                      </div>
                    </div>

                    {/* 즉사 조건 */}
                    <div className="border-t border-slate-700/50 pt-3 space-y-1">
                      {stat.deathConditions.map((condition, idx) => (
                        <p key={idx} className="text-red-400 text-xs font-bold">
                          {condition}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 생존 규칙 탭
            <div className="space-y-6">
              {/* 위험 구간 */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className={`w-1 h-6 bg-gradient-to-b ${colors.primary} rounded-full`}></span>
                  스탯 위험 구간
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-green-950/30 rounded-xl p-4 border border-green-500/30">
                    <div className="text-3xl mb-2">🟢</div>
                    <h4 className="text-green-400 font-bold mb-1">안전</h4>
                    <p className="text-green-300 text-xs mb-2">60-100</p>
                    <p className="text-slate-400 text-xs">모든 선택지 가능</p>
                  </div>
                  <div className="bg-yellow-950/30 rounded-xl p-4 border border-yellow-500/30">
                    <div className="text-3xl mb-2">🟡</div>
                    <h4 className="text-yellow-400 font-bold mb-1">경고</h4>
                    <p className="text-yellow-300 text-xs mb-2">30-59</p>
                    <p className="text-slate-400 text-xs">일부 제한</p>
                  </div>
                  <div className="bg-orange-950/30 rounded-xl p-4 border border-orange-500/30">
                    <div className="text-3xl mb-2">🟠</div>
                    <h4 className="text-orange-400 font-bold mb-1">위험</h4>
                    <p className="text-orange-300 text-xs mb-2">10-29</p>
                    <p className="text-slate-400 text-xs">대부분 제한</p>
                  </div>
                  <div className="bg-red-950/30 rounded-xl p-4 border border-red-500/30">
                    <div className="text-3xl mb-2">🔴</div>
                    <h4 className="text-red-400 font-bold mb-1">임계</h4>
                    <p className="text-red-300 text-xs mb-2">0-9</p>
                    <p className="text-slate-400 text-xs">즉사 가능!</p>
                  </div>
                </div>
              </div>

              {/* 선택지 색상 */}
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <span className={`w-1 h-6 bg-gradient-to-b ${colors.primary} rounded-full`}></span>
                  선택지 색상 가이드
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border-l-4 border-green-500">
                    <div className="w-12 h-12 rounded-lg bg-slate-700 border-2 border-green-500 flex items-center justify-center font-bold text-white">A</div>
                    <div className="flex-1">
                      <h4 className="text-green-400 font-bold">초록색 테두리</h4>
                      <p className="text-slate-400 text-sm">안전한 선택 (스탯 충분)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border-l-4 border-yellow-500">
                    <div className="w-12 h-12 rounded-lg bg-slate-700 border-2 border-yellow-500 flex items-center justify-center font-bold text-white">B</div>
                    <div className="flex-1">
                      <h4 className="text-yellow-400 font-bold">노란색 테두리</h4>
                      <p className="text-slate-400 text-sm">위험한 선택 (스탯 부족, 실패 가능)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-800/50 rounded-xl p-4 border-l-4 border-red-500 opacity-60">
                    <div className="w-12 h-12 rounded-lg bg-slate-700 border-2 border-red-500 flex items-center justify-center font-bold text-white">C</div>
                    <div className="flex-1">
                      <h4 className="text-red-400 font-bold">빨간색 테두리</h4>
                      <p className="text-slate-400 text-sm">선택 불가 (스탯 매우 부족)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 타이머 경고 */}
              <div className={`bg-gradient-to-r ${colors.primary} p-[1px] rounded-xl`}>
                <div className="bg-slate-900 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⏰</div>
                    <div>
                      <h4 className="text-white font-bold text-lg mb-2">60초 타이머</h4>
                      <p className="text-slate-300 text-sm">시간 내에 선택하지 않으면 BAD 엔딩으로 게임 오버됩니다</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="bg-slate-800/80 backdrop-blur-sm px-8 py-4 border-t border-slate-700/50">
          <button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${colors.primary} hover:opacity-90 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 ${colors.glow} shadow-lg transform hover:scale-[1.02] text-lg`}
          >
            ✅ 이해했습니다
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatGuideModal;

