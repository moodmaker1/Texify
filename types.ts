export enum Scenario {
  Horror = 'Horror',
  Thriller = 'Thriller',
  Romance = 'Romance',
}

export interface Stats {
  [key: string]: number;
}

export interface SuggestedAction {
  id: string; // 'A', 'B', 'C'
  emoji: string; // '🚪', '👂', '🔦'
  text: string; // '조심스럽게 문을 열어본다'
  required_stats?: { [key: string]: number }; // { '정신력': 70 } - 필요 스탯
  stat_changes: { [key: string]: number }; // { '정신력': -10, '체력': -5 } - 스탯 변화
  is_trap: boolean; // true면 즉시 엔딩
  trap_ending?: {
    title: string;
    description: string;
  };
}

export interface GameState {
  narrative: string;
  image_prompt: string;
  stats: Stats;
  suggested_actions?: SuggestedAction[]; // AI가 생성한 추천 선택지 (3개)
  analysis: {
    player_action: string;
    emotion_detected: string;
  };
  ending_check: string;
  imageUrl?: string;
}

export interface GameHistoryEntry {
  playerAction: string;
  gameState: GameState;
}

export interface ScenarioDetails {
  id: Scenario;
  title: string;
  description: string;
  image: string;
  difficulty: string;
  difficultyStars: number;
  playTime: string;
  color: string;
}

// 스탯 변화 관련 타입
export interface StatChange {
  name: string;           // 스탯 이름 (예: "정신력")
  oldValue: number;       // 이전 값
  newValue: number;       // 새로운 값
  change: number;         // 변화량 (+5 또는 -10)
}

export interface StatChangeInfo {
  scenario: Scenario;     // 현재 시나리오
  changes: StatChange[];  // 변화된 스탯 목록
  actionText: string;     // 플레이어가 선택한 행동 텍스트
}
