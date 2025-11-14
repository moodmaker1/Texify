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
  risk_level?: 'safe' | 'risky' | 'extreme'; // 🆕 위험도 레벨
  truth_fragment_id?: string; // 🆕 이 선택지로 획득 가능한 진실 조각 ID
}

export interface StageProgress {
  current_stage: number;        // 현재 단계 (1~5)
  stage_title: string;          // 단계 제목 ("침입자", "재회" 등)
  objectives_completed: number; // 완료한 목표 수
  objectives_total: number;     // 전체 목표 수
  key_events: string[];        // 발생한 주요 이벤트
  can_advance: boolean;        // 다음 단계 진입 가능 여부
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
  // 🆕 스토리 단계 시스템
  story_stage?: number;           // 현재 스토리 단계 (1~5)
  stage_progress?: StageProgress; // 단계별 진행 상황
  // 🆕 소극성 추적 시스템
  passivity_score?: number;       // 소극성 점수 (초기값 0)
  action_diversity?: {            // 행동 다양성 추적
    safe: number;
    risky: number;
    extreme: number;
  };
  // 🆕 진실 조각 시스템
  truth_fragments?: {
    discovered: string[];         // 발견한 진실 조각 ID 배열
    total: number;                // 전체 진실 조각 수
  };
}

export interface GameHistoryEntry {
  playerAction: string;
  gameState: GameState;
  suggestedActions?: SuggestedAction[]; // 🆕 해당 턴의 선택지 기록
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

// 🆕 스탯 설명 및 위험 구간 정보
export interface StatDescription {
  name: string;
  description: string;
  highRisk: string;
  lowRisk: string;
}

// 🆕 스탯 위험 레벨
export enum StatRiskLevel {
  SAFE = 'safe',           // 60-100 (안전)
  WARNING = 'warning',     // 30-59 (경고)
  DANGER = 'danger',       // 10-29 (위험)
  CRITICAL = 'critical'    // 0-9 (임계)
}

// 🆕 스탯 임계값 설정
export interface StatThreshold {
  min: number;              // 최소값 (이하 시 즉사)
  max: number;              // 최대값 (이상 시 즉사)
  warningLow: number;       // 경고 하한선
  warningHigh: number;      // 경고 상한선
  criticalLow: number;      // 임계 하한선
  criticalHigh: number;     // 임계 상한선
  deathEndingLow?: string;  // 하한선 즉사 엔딩명
  deathEndingHigh?: string; // 상한선 즉사 엔딩명
}

// 🆕 엔딩 타입
export enum EndingType {
  TRUE = 'true',           // 진엔딩
  GOOD = 'good',           // 굿엔딩
  NORMAL = 'normal',       // 노말엔딩
  BAD = 'bad',             // 배드엔딩
  HIDDEN = 'hidden'        // 히든엔딩
}

// 🆕 엔딩 정보
export interface EndingInfo {
  id: string;
  title: string;
  description: string;
  type: EndingType;
  conditions: string[];    // 달성 조건 설명
  imagePrompt: string;     // 엔딩 이미지 프롬프트
}

// 🆕 진실 조각
export interface TruthFragment {
  id: string;
  name: string;
  description: string;
  discovered: boolean;
}

// 🆕 진실 조각 획득 조건
export interface TruthFragmentCondition {
  fragment_id: string;
  required_stats?: Record<string, number>;
  required_actions?: string[];
  turn_range?: [number, number];
}

// 🆕 엔딩 컬렉션 항목
export interface EndingCollectionItem {
  id: string;
  title: string;
  type: EndingType;
  scenario: Scenario;
  unlocked: boolean;
  unlockedAt?: string; // ISO timestamp
  description?: string;
  imagePrompt?: string;
}

// 🆕 엔딩 컬렉션 통계
export interface EndingCollectionStats {
  totalEndings: number;
  unlockedEndings: number;
  trueEndingsUnlocked: number;
  hiddenEndingsUnlocked: number;
  completionRate: number;
}
