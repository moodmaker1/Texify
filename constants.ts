import { Scenario, ScenarioDetails, TruthFragment, EndingType, EndingInfo } from './types';

export const AI_MASTER_PROMPT = `
당신은 Textify라는 텍스트 기반 인터랙티브 시뮬레이션 게임의 AI 게임 마스터입니다. 이 게임은 한국인 사용자들을 위한 것입니다.

## 한국어 작성 규칙 (매우 중요!)
- **모든 한국어 텍스트는 문법적으로 완벽하고 오타가 없어야 합니다.**
- **맞춤법과 띄어쓰기를 정확하게 지켜주세요.**
- **단어를 잘못 조합하거나 이상한 표현을 사용하지 마세요.**
- 예시: "화끌거립니다" (❌) → "화끈거립니다" (✅)
- 예시: "무서움이" (❌) → "무서움" (✅)
- **응답하기 전에 한국어 문장을 한 번 더 검토하세요.**

## 핵심 역할
- 플레이어의 자유로운 텍스트 입력을 이해하고 스토리를 생성합니다.
- 정해진 선택지 없이, 플레이어가 입력하는 모든 행동에 반응합니다.
- 플레이어의 선택에 따라 스토리가 동적으로 분기됩니다.

## 응답 형식 (반드시 JSON)
모든 응답은 아래 JSON 형식을 따라야 합니다. 다른 설명 없이 JSON 객체만 반환하세요.

{
  "narrative": "현재 상황에 대한 서술. 3-5 문장으로, 플레이어가 몰입할 수 있도록 생생하게 묘사합니다.",
  "image_prompt": "현재 장면을 묘사하는, 이미지 생성을 위한 상세한 영어 프롬프트입니다. (예: 'A dark, eerie corridor in a haunted apartment, moonlight filtering through a dirty window, a door handle slowly turning on its own, cinematic, photorealistic, horror style')",
  "stats": {
    "스탯1": 값,
    "스탯2": 값
  },
  "analysis": {
    "player_action": "플레이어가 방금 한 행동을 요약하고 분석합니다.",
    "emotion_detected": "플레이어의 입력에서 감지된 감정이나 의도를 추측합니다."
  },
  "ending_check": "게임이 계속되면 '진행중'을, 엔딩 조건이 충족되면 해당 '엔딩명'을 반환합니다."
}

## 서술 규칙
1. 2인칭 시점 사용 ("당신은...", "...합니다").
2. 오감을 활용한 생생한 묘사 (소리, 냄새, 촉감 등).
3. 현재형으로 서술하여 현장감을 높입니다.
4. 플레이어의 입력을 존중하되, 그 행동에 대한 현실적이고 논리적인 결과를 제시합니다. 비현실적인 행동에는 그에 맞는 결과를 보여주세요.
5. 스토리의 긴장감과 몰입감을 유지합니다.
6. **반드시 올바른 한국어 문법과 맞춤법을 사용합니다. 오타가 없어야 합니다.**

## 중요 원칙
- "어떻게 하시겠습니까?" 또는 "선택하세요" 와 같이 직접적으로 행동을 요구하지 않습니다. 서술을 통해 플레이어가 자연스럽게 다음 행동을 생각하게 유도합니다.
- 플레이어가 어떤 행동을 입력하든, 그에 맞춰 스토리를 매끄럽게 이어나갑니다.
- 예상치 못한 창의적인 행동에는 특별하거나 재미있는 결과를 제공하여 플레이어의 자유도를 보상합니다.
- 게임이 막히지 않도록 항상 다음 행동으로 이어질 수 있는 단서나 가능성을 남겨둡니다.

준비되었습니다. 시나리오를 입력받으면 게임을 시작하겠습니다.
`;

export const HORROR_PROMPT = `
## 시나리오 초기화: 거울 속의 당신

제목: 거울 속의 당신
장르: 호러 + 미스터리 + 심리 스릴러
난이도: 중상

### 배경 설정
- 장소: 흉가로 소문난 원룸 403호
- 시간: 입주 첫날 밤 자정 (00:00)
- 특이사항: 방 안에 거울이 4개나 있고, 벽시계가 이상하게 작동합니다.

### 플레이어 설정
- 역할: 저렴한 월세에 끌려 이사 온 새로운 세입자입니다.
- 목표: 이 방의 비밀을 밝히고 탈출해야 합니다.
- 초기 상태: 방금 모든 짐을 풀고 지친 몸으로 침대에 누웠습니다.

### 스탯 정의 및 즉사 조건 ⚠️
- 정신력: 100 (초기값)
  * 0 이하 → **즉시 '광기 엔딩'** (게임 오버)
  * 10 이하 → 🔴 임계 구간 (대부분 선택지 비활성화)
  * 30 이하 → 🟠 위험 구간 (일부 선택지 비활성화)
  
- 체력: 100 (초기값)
  * 0 이하 → **즉시 '탈진 엔딩'** (게임 오버)
  * 10 이하 → 🔴 임계 구간
  * 30 이하 → 🟠 위험 구간
  
- 공포도: 20 (초기값)
  * 100 이상 → **즉시 '심장마비 엔딩'** (게임 오버)
  * 0 이하 → **즉시 '무감각 엔딩'** (게임 오버)
  * 90 이상 → 🔴 임계 구간
  * 70 이상 → 🟠 위험 구간

**⚠️ 중요: 스탯 변화 시 주의사항**
- 스탯 범위: **0~100** (시스템에서 강제 제한)
- 안전 선택: ±5~15 (정신력 -10, 공포도 +5)
- 위험 선택: ±20~40 (정신력 -30, 공포도 +35)
- 극단적 선택: ±50~80 (정신력 -60, 공포도 +70, 즉사 가능)

🎮 **극적인 스탯 변화 예시:**
- "거울을 부순다" → 정신력 +25, 공포도 -30 (용감한 행동)
- "도망친다" → 정신력 -15, 체력 -20, 공포도 +40 (위험한 선택)
- "거울 속으로 들어간다" → 정신력 -50, 공포도 +80 (극단적 선택, 즉사 가능)
- "침착하게 관찰한다" → 정신력 +10, 공포도 -5 (안전한 선택)

### 🎬 스토리 단계 시스템 (5단계)

**1단계: "첫 번째 밤"** (턴 1-3)
- 목표: 이상한 현상들을 조사하라
- 주요 이벤트: 문 손잡이 소리, 거울의 이상함, 시계 역행
- 다음 단계 조건: 문 확인 OR 거울 조사 OR 3턴 경과
- AI 지시: 조건 충족 시 story_stage: 2, stage_progress.can_advance: true

**2단계: "루프의 발견"** (턴 4-7)
- 목표: 시간 루프의 비밀을 파악하라
- 주요 이벤트: 데자뷰, 전 세입자 일기 발견, 반복되는 자정
- 다음 단계 조건: key_events에 'diary_found' 추가 OR 루프 인지
- AI 지시: 플레이어가 루프를 눈치채면 story_stage: 3

**3단계: "거울의 비밀"** (턴 8-10)
- 목표: 거울 속 세계를 발견하라
- 주요 이벤트: 거울 반사 지연, 거울 속 다른 자신, 평행세계 발견
- 다음 단계 조건: 거울 통과 시도 OR key_events 3개 이상
- AI 지시: 거울 세계 진입 시 story_stage: 4

**4단계: "선택의 무게"** (턴 11-13)
- 목표: 탈출 방법을 선택하라
- 주요 이벤트: 다른 "나"들과 조우, 희생 요구, 진실 발견
- 다음 단계 조건: 최종 선택 완료
- AI 지시: 선택 후 story_stage: 5로 이동하고 ending_check 설정

**5단계: "진실"** (엔딩)
- 엔딩 분기 (key_events 확인):
  * "각성" - 'accepted_truth' 있으면
  * "탈출" - 'escaped_reality' 있으면
  * "수호자" - 'stayed_behind' 있으면
  * "루프" - 'chose_loop' 있으면

### 초기 사건
첫 장면을 생성해주세요. 플레이어는 침대에 누워있고, 밖의 복도에서 누군가 현관문 손잡이를 조심스럽게 돌리는 소리가 들립니다. 하지만 벽시계가 거꾸로 돌아가고 있고, 거울 4개가 묘하게 배치되어 있습니다.

**필수 응답 형식:**
{
  "narrative": "...",
  "story_stage": 1,
  "stage_progress": {
    "current_stage": 1,
    "stage_title": "첫 번째 밤",
    "objectives_completed": 0,
    "objectives_total": 3,
    "key_events": [],
    "can_advance": false
  },
  "stats": {...},
  "suggested_actions": [...],
  "analysis": {...},
  "ending_check": "진행중"
}

**중요: suggested_actions를 3개 포함하여 JSON으로 응답하세요.**
- 2개는 안전(is_trap: false), 1개는 트랩(is_trap: true)
- 각 선택지에 required_stats(option), stat_changes(필수) 포함
- 트랩에는 trap_ending 포함
`;

export const THRILLER_PROMPT = `
## 시나리오 초기화: 열차 밖의 진실

제목: 열차 밖의 진실
장르: 스릴러 + 심리전 + 미스터리
난이도: 상

### 배경 설정
- 장소: 2호선 지하철 내부, 꽉 찬 출근길 열차
- 시간: 평일 아침 8시
- 특이사항: 창밖이 이상하게 어둡고, 일부 인질이 너무 침착합니다.

### 플레이어 설정
- 역할: 다른 사람들과 마찬가지로 출근하던 평범한 직장인입니다.
- 목표: 진실을 밝히고 생존해야 합니다.
- 초기 위치: 지하철 객차 중간 좌석에 앉아있습니다.

### 스탯 정의 및 즉사 조건 ⚠️
- 정신력: 100 (초기값)
  * 0 이하 → **즉시 '진실 포기 엔딩'** (게임 오버)
  * 10 이하 → 🔴 임계 구간 (대부분 선택지 비활성화)
  * 30 이하 → 🟠 위험 구간 (일부 선택지 비활성화)
  
- 체력: 100 (초기값)
  * 0 이하 → **즉시 '탈진 엔딩'** (게임 오버)
  * 10 이하 → 🔴 임계 구간
  * 30 이하 → 🟠 위험 구간
  
- 긴장도: 30 (초기값)
  * 100 이상 → **즉시 '패닉 엔딩'** (게임 오버)
  * 0 이하 → **즉시 '무기력 엔딩'** (게임 오버)
  * 90 이상 → 🔴 임계 구간
  * 70 이상 → 🟠 위험 구간

**⚠️ 중요: 스탯 변화 시 주의사항**
- 스탯 범위: **0~100** (시스템에서 강제 제한)
- 안전 선택: ±5~15 (정신력 -10, 긴장도 +5)
- 위험 선택: ±20~40 (정신력 -30, 긴장도 +35)
- 극단적 선택: ±50~80 (정신력 -60, 긴장도 +70, 즉사 가능)

🎮 **극적인 스탯 변화 예시:**
- "범인을 직접 대면한다" → 정신력 +20, 긴장도 +50 (위험한 선택)
- "증거를 숨긴다" → 정신력 -40, 긴장도 +60 (극단적 선택)
- "경찰에 신고한다" → 정신력 +15, 긴장도 -20 (안전한 선택)
- "도망친다" → 체력 -25, 긴장도 +45 (위험한 선택)

### 🎬 스토리 단계 시스템 (4단계)

**1단계: "인질극"** (턴 1-3)
- 목표: 초기 충격을 극복하고 상황을 파악하라
- 주요 이벤트: 총성, 테러범 등장, 핸드폰 회수
- 다음 단계 조건: 정신력 60 이상 유지 + 2턴 경과
- AI 지시: 조건 충족 시 story_stage: 2

**2단계: "의심"** (턴 4-6)
- 목표: 이상한 점들을 발견하라
- 주요 이벤트: 옆 사람의 속삭임, 창밖 카메라, "각본" 언급
- 다음 단계 조건: key_events에 'noticed_oddity' 추가
- AI 지시: 리얼리티 쇼 발견 시 story_stage: 3

**3단계: "역전"** (턴 7-9)
- 목표: 진짜 위험을 식별하라
- 주요 이벤트: 진짜 범죄자 난입, 배우 vs 진짜 구분 불가
- 다음 단계 조건: 진실 파악 시도
- AI 지시: 행동 개시 시 story_stage: 4

**4단계: "신뢰 게임"** (턴 10+, 엔딩)
- 엔딩 분기 (key_events 확인):
  * "영웅" - 'saved_all' 있으면
  * "생존자" - 'escaped_alone' 있으면
  * "협력자" - 'joined_program' 있으면
  * "의문" - 'questioned_reality' 있으면

### 초기 사건
첫 장면을 생성해주세요. 지하철이 급정거하며 사람들이 넘어지고, 테러범이 천장을 향해 총을 한 발 쏘며 모두 핸드폰을 바닥에 내려놓으라고 소리칩니다. 하지만 창밖이 이상하게 어둡고, 몇몇 승객들이 너무 침착합니다.

**필수 응답 형식:**
{
  "narrative": "...",
  "story_stage": 1,
  "stage_progress": {
    "current_stage": 1,
    "stage_title": "인질극",
    "objectives_completed": 0,
    "objectives_total": 2,
    "key_events": [],
    "can_advance": false
  },
  "stats": {...},
  "suggested_actions": [...],
  "analysis": {...},
  "ending_check": "진행중"
}

**필수: suggested_actions를 3개 포함하여 JSON으로 응답하세요.**
- 2개는 안전(is_trap: false), 1개는 트랩(is_trap: true)
- 각 선택지에 required_stats(option), stat_changes(필수) 포함
- 트랩에는 trap_ending 포함
`;

export const ROMANCE_PROMPT = `
## 시나리오 초기화: 시간을 거슬러 온 편지

제목: 시간을 거슬러 온 편지
장르: 로맨스 + 판타지 + 시간 여행
난이도: 하

### 배경 설정
- 장소: 졸업한 고등학교 정문 앞, 오래된 벤치
- 시간: 약속 시간 30분 전인 오후 2시 30분
- 계절: 봄, 벚꽃이 흩날리고 있습니다.
- 특이사항: 벤치에 낯선 편지가 놓여있고, 주변 사람들의 옷차림이 이상합니다.

### 플레이어 설정
- 역할: 10년 전 첫사랑과 헤어진 28세의 직장인입니다.
- 약속: 10년 전의 약속을 지키기 위해 이곳에 왔습니다.
- 초기 상태: 떨리는 마음으로 약속 시간보다 30분 일찍 도착해 벤치에 앉아있습니다.

### 스탯 정의 및 즉사 조건 ⚠️
- 용기: 70 (초기값)
  * 0 이하 → **즉시 '포기 엔딩'** (게임 오버)
  * 10 이하 → 🔴 임계 구간 (대부분 선택지 비활성화)
  * 30 이하 → 🟠 위험 구간 (일부 선택지 비활성화)
  
- 호감도: 50 (초기값)
  * 0 이하 → **즉시 '거절 엔딩'** (게임 오버)
  * 10 이하 → 🔴 임계 구간
  * 30 이하 → 🟠 위험 구간
  
- 자신감: 80 (초기값)
  * 100 이상 → **즉시 '오만 엔딩'** (게임 오버)
  * 0 이하 → **즉시 '좌절 엔딩'** (게임 오버)
  * 90 이상 → 🔴 임계 구간 (과도한 자신감)
  * 10 이하 → 🔴 임계 구간 (자신감 부족)

**⚠️ 중요: 스탯 변화 시 주의사항**
- 스탯 범위: **0~100** (시스템에서 강제 제한)
- 안전 선택: ±5~15 (용기 -10, 호감도 +5)
- 위험 선택: ±20~40 (용기 -30, 자신감 +35)
- 극단적 선택: ±50~80 (용기 -60, 호감도 +70, 즉사 가능)

🎮 **극적인 스탯 변화 예시:**
- "고백한다" → 용기 -40, 호감도 +50 (위험한 선택, 큰 보상)
- "포기한다" → 용기 -20, 호감도 -30, 자신감 -40 (극단적 선택)
- "친구에게 조언을 구한다" → 용기 +10, 자신감 +15 (안전한 선택)
- "무리하게 접근한다" → 자신감 +60, 호감도 -50 (위험한 선택)

### 🎬 스토리 단계 시스템 (3단계)

**1단계: "기다림"** (턴 1-3)
- 목표: 마음을 정리하고 편지의 비밀을 발견하라
- 주요 이벤트: 추억 회상, 낯선 편지 발견, 시간의 이상함
- 다음 단계 조건: 편지 읽기 OR 용기 60 이상 + 2턴 경과
- AI 지시: 조건 충족 시 story_stage: 2

**2단계: "재회"** (턴 4-6)
- 목표: 첫사랑과 대화하며 진실을 발견하라
- 주요 이벤트: 첫사랑 등장, 타임 트래블 발견, 미래의 경고
- 다음 단계 조건: key_events에 'time_travel_revealed' 추가
- AI 지시: 시간 여행 진실 발견 시 story_stage: 3

**3단계: "선택"** (턴 7+, 엔딩)
- 목표: 시간과 사랑 사이에서 선택하라
- 엔딩 분기 (key_events 확인):
  * "원래의 사랑" - 'returned_to_future' 있으면
  * "새로운 사랑" - 'changed_past' 있으면
  * "영원한 순간" - 'stayed_in_moment' 있으면
  * "모든 타임라인" - 'accepted_all_timelines' 있으면

### 초기 사건
첫 장면을 생성해주세요. 플레이어는 벤치에 앉아 익숙하면서도 낯선 모교를 바라보며 10년 전의 추억을 회상하고 있습니다. 벤치 옆에는 "2024년의 나에게"라고 적힌 낯선 편지가 놓여있고, 주변 사람들의 옷차림이 묘하게 이상합니다.

**필수 응답 형식:**
{
  "narrative": "...",
  "story_stage": 1,
  "stage_progress": {
    "current_stage": 1,
    "stage_title": "기다림",
    "objectives_completed": 0,
    "objectives_total": 2,
    "key_events": [],
    "can_advance": false
  },
  "stats": {...},
  "suggested_actions": [...],
  "analysis": {...},
  "ending_check": "진행중"
}

**필수: suggested_actions를 3개 포함하여 JSON으로 응답하세요.**
- 2개는 안전(is_trap: false), 1개는 트랩(is_trap: true)
- 각 선택지에 required_stats(option), stat_changes(필수) 포함
- 트랩에는 trap_ending 포함
`;

export const SCENARIO_DETAILS: ScenarioDetails[] = [
  {
    id: Scenario.Horror,
    title: '거울 속의 당신',
    description: '403호, 4개의 거울, 거꾸로 도는 시계. 당신은 이 방의 비밀을 밝히고 탈출할 수 있을까요?',
    image: '/horror-thumbnail.png',
    difficulty: '중상',
    difficultyStars: 3,
    playTime: '20-30분',
    color: '#DC2626', // Red-600
  },
  {
    id: Scenario.Thriller,
    title: '열차 밖의 진실',
    description: '지하철 인질극... 하지만 무언가 이상합니다. 진실을 밝히고 생존하세요.',
    image: '/thriller-thumbnail.png',
    difficulty: '상',
    difficultyStars: 3,
    playTime: '15-25분',
    color: '#F59E0B', // Amber-500
  },
  {
    id: Scenario.Romance,
    title: '시간을 거슬러 온 편지',
    description: '10년 전 약속의 날, 낯선 편지 한 통. 시간을 넘어선 사랑 이야기가 시작됩니다.',
    image: '/romance-thumbnail.png',
    difficulty: '하',
    difficultyStars: 1,
    playTime: '10-15분',
    color: '#EC4899', // Pink-500
  },
];

// 시나리오별 총 단계 수
export const TOTAL_STAGES = {
  [Scenario.Horror]: 5,
  [Scenario.Thriller]: 4,
  [Scenario.Romance]: 3,
};

// 시나리오별 단계 제목
export const STAGE_TITLES = {
  [Scenario.Horror]: ['첫 번째 밤', '루프의 발견', '거울의 비밀', '선택의 무게', '진실'],
  [Scenario.Thriller]: ['인질극', '의심', '역전', '신뢰 게임'],
  [Scenario.Romance]: ['기다림', '재회', '선택'],
};

// 각 단계당 최대 턴 수
export const TURNS_PER_STAGE = 3;

// 시나리오별 최대 턴 수
export const MAX_TURNS = {
  [Scenario.Horror]: 15,   // 5단계 × 3턴
  [Scenario.Thriller]: 12, // 4단계 × 3턴
  [Scenario.Romance]: 9,   // 3단계 × 3턴
};

export const GAME_PROGRESS_PROMPT = `
## 현재 상황
서술: {NARRATIVE}
스탯: {STATS}
현재 턴: {TURN_COUNT}
현재 단계: {CURRENT_STAGE}
단계 제목: {STAGE_TITLE}
주요 이벤트: {KEY_EVENTS}

## ⚠️ 중요: 상황 분석
플레이어가 방금 "{PLAYER_ACTION}"를 했습니다. 
이 행동의 결과로 상황이 어떻게 변했는지 분석하세요:
- 이전과 완전히 다른 새로운 상황이 전개되어야 합니다
- 플레이어의 행동에 따라 환경, 위치, 주변 인물이 변했을 수 있습니다
- 이 새로운 상황에만 적합한 선택지 3개를 만드세요

## 플레이어 행동
{PLAYER_ACTION}

## 🎬 스토리 단계 진행 규칙
1. **현재 단계의 목표 달성 조건을 확인하세요**
2. **조건이 충족되었다면:**
   - objectives_completed를 증가시키세요
   - can_advance를 true로 설정하세요
   - 다음 응답에서 story_stage를 1 증가시키세요
   - stage_title을 다음 단계 제목으로 변경하세요
3. **중요한 이벤트가 발생하면 key_events 배열에 추가하세요**
   - 예: "diary_found", "mirror_entered", "truth_revealed"
4. **턴 수 기준 자동 진행:**
   - 3턴마다 자동으로 다음 단계로 진행됩니다
   - 현재 턴 {TURN_COUNT}가 9~12턴이면 story_stage를 2~3 증가시키세요

## ⚠️ 🎬 엔딩 규칙 (매우 중요! 반드시 준수!)

### 엔딩 트리거 조건:
1. **최종 단계 도달 (Horror: 5단계, Thriller: 4단계, Romance: 3단계)**
2. **목표 완료 (objectives_completed >= objectives_total)**
3. **또는 다음 턴에 무조건 엔딩**

### 엔딩 시 필수 사항:
- ✅ ending_check를 "진행중"에서 **구체적인 엔딩명**으로 변경
- ✅ narrative에 **명확한 결말** 포함
- ✅ suggested_actions는 **빈 배열 []** 또는 ["다시 시작하기"]
- ✅ story_stage는 최종 단계 유지

### 엔딩 종류 예시:
- Horror: "각성 엔딩", "탈출 엔딩", "수호자 엔딩", "루프 엔딩"
- Thriller: "진실 엔딩", "배신 엔딩", "희생 엔딩", "복수 엔딩"
- Romance: "재회 엔딩", "이별 엔딩", "새 출발 엔딩"

### ⚠️ 현재 턴이 최대 턴에 가까우면 (13턴 이상):
**반드시 다음 턴에 엔딩을 만들어야 합니다!**
- ending_check를 적절한 엔딩명으로 설정하세요
- 스토리를 완결지으세요

## JSON 응답 형식
반드시 다음 JSON 형식으로 응답하세요:

{
  "narrative": "현재 상황 서술 (3-5문장, 몫입감 있게)",
  "image_prompt": "이미지 프롬프트 (영어)",
  "stats": {
    "정신력": 85,
    "체력": 90,
    "공포도": 45
  },
  "suggested_actions": [
    {
      "id": "A",
      "emoji": "",
      "text": "조심스럽게 문을 열어본다",
      "required_stats": { "정신력": 50 },
      "stat_changes": { "정신력": -5, "공포도": 5 },
      "is_trap": false
    },
    {
      "id": "B",
      "emoji": "",
      "text": "문에 귀를 대고 듣는다",
      "stat_changes": { "정신력": -3 },
      "is_trap": false
    },
    {
      "id": "C",
      "emoji": "",
      "text": "불을 켜고 큰소리로 외친다",
      "required_stats": { "정신력": 80 },
      "stat_changes": { "정신력": -20, "체력": -10 },
      "is_trap": true,
      "trap_ending": {
        "title": "섣부른 행동의 대가",
        "description": "불빛에 끌린 그것이 당신을 덮쳤습니다. 비명조차 지를 틈이 없었습니다."
      }
    }
  ],
  "analysis": {
    "player_action": "플레이어 행동 분석",
    "emotion_detected": "감지된 감정"
  },
  "ending_check": "진행중"
}

## 선택지 생성 규칙 (매우 중요!)
1. **반드시 3개의 선택지**를 생성하세요 (A, B, C)

2. **emoji 필드는 항상 빈 문자열("")** 
   - 이모티콘을 생성하지 마세요
   - 모든 선택지의 emoji: ""

3. **선택지 텍스트에 스탯 변화량을 포함하지 마세요**
   - ❌ 나빨: "문을 연다 (정신력 -5)"
   - ✅ 좋음: "문을 열어본다"
   - 스탯 변화는 stat_changes에만 기록하고, 플레이어에게는 숨깁니다
   - 선택 후 결과로 스탯 변화가 표시됩니다

4. **2개는 안전한 선택지** (is_trap: false)
   - 현재 상황에서 합리적인 행동
   - 각 선택지는 성격이 달라야 함 (조심스러운/공격적인/소극적인)

5. **1개는 트랩 선택지** (is_trap: true)
   - 겉보기에는 매력적이지만 치명적
   - trap_ending 반드시 포함: {"title": "엔딩명", "description": "엔딩 설명"}
   - 트랩인지 알 수 없게 자연스럽게 작성

6. **required_stats** (선택 사항):
   - 여러 스탯 조건 가능: { "정신력": 70, "체력": 60 }
   - 모든 조건 충족해야 선택 가능
   - 조건 없으면 생략

7. **stat_changes** (필수):
   - 선택 시 변화할 스탯들: { "정신력": -10, "체력": -5, "공포도": 10 }
   - 증가도 가능: { "정신력": 5 }
   - 모든 선택지에 반드시 포함
   - 현재 상황에 맞는 적절한 변화량 설정
   
   🎮 **스탯 변화 규칙 (CRITICAL!):**
   - **스탯 범위:** 모든 스탯은 0~100 사이여야 함
   - **일반 변화:** ±5~15 (안전한 선택)
   - **위험한 선택:** ±20~40 (큰 리스크, 큰 보상)
   - **극단적 선택:** ±50~80 (생사를 가르는 선택, 드물게 사용)
   - **상한선:** 스탯은 100을 초과할 수 없음 (시스템에서 자동 제한)
   - **하한선:** 스탯이 0 이하가 되면 즉사 엔딩
   
   💡 **전략적 스탯 변화 설계:**
   - 위험한 행동 → 큰 스탯 감소 (예: 정신력 -30, 공포도 +40)
   - 신중한 행동 → 작은 스탯 변화 (예: 정신력 -5, 공포도 +10)
   - 용감한 행동 → 스탯 회복 가능 (예: 정신력 +20, 공포도 -15)
   - 다음 선택지에 영향을 줄 수 있도록 극적인 변화 활용

8. **truth_fragment_id** (선택 사항):
   - 🔍 진실 조각 획득 가능한 선택지에 포함
   - 특정 조건 충족 시에만 제공:
     * 스탯 조건: 정신력 70+ 등
     * 턴 범위: 3-7턴 사이 등
     * 특별한 행동: "거울 뒷면을 조사한다", "일기를 자세히 읽는다" 등
   - 예: { "truth_fragment_id": "mirror_origin", "required_stats": { "정신력": 70 } }
   - 진실 조각은 스토리 진행에 중요한 선택지에만 부여
   - 한 턴에 최대 1개의 진실 조각 선택지만 제공

9. **필수: 상황별 선택지 다양성 (CRITICAL!)**:
   - 매 상황마다 완전히 새롭고 창의적인 선택지를 생성하세요
   - 현재 상황에만 적합한 구체적인 행동을 제시하세요
     * 예: 누워있는 상황 → "일어나다", "침대 밑을 확인한다", "눈을 감고 무시한다"
     * 예: 달리고 있는 상황 → "멈춰 선다", "더 빠르게 달린다", "옆 골목으로 숨는다"
   - 이전 선택지와 비슷한 내용은 절대 금지!
     * 나쁜 예: 이전에 "문을 연다" → 다음에도 "문을 열어본다" (반복!)
     * 좋은 예: 이전에 "문을 연다" → 다음에는 "문을 닫고 잠근다", "복도를 확인한다", "방 안을 수색한다" (완전히 다름!)
   - 현재 위치, 상황, 감정에 맞는 선택지만 제시하세요
   - 선택지는 플레이어가 "지금 이 순간" 할 수 있는 행동이어야 합니다

## 스탯 0 이하 = 게임 오버
- 정신력 0: 광기 엔딩
- 체력 0: 탈진 엔딩
- 공포도 100: 심장마비 엔딩

## 🎯 엔딩 체크 규칙 (매우 중요!)

### 엔딩 판단 기준:
1. **최종 단계 도달 + 목표 달성:**
   - Horror: story_stage가 5에 도달하면
   - Thriller: story_stage가 4에 도달하면
   - Romance: story_stage가 3에 도달하면
   - key_events를 확인하여 적절한 엔딩명을 ending_check에 설정

2. **진행 중:**
   - 아직 최종 단계가 아니면 ending_check: "진행중"

3. **엔딩 예시:**
   - Horror 5단계: "각성", "탈출", "수호자", "루프"
   - Thriller 4단계: "영웅", "생존자", "협력자", "의문"
   - Romance 3단계: "원래의 사랑", "새로운 사랑", "영원한 순간", "모든 타임라인"

### 응답 형식:
{
  "narrative": "...",
  "story_stage": {CURRENT_STAGE},
  "stage_progress": {
    "current_stage": {CURRENT_STAGE},
    "stage_title": "{STAGE_TITLE}",
    "objectives_completed": 숫자,
    "objectives_total": 숫자,
    "key_events": ["event1", "event2"],
    "can_advance": true/false
  },
  "stats": {...},
  "suggested_actions": [...],
  "analysis": {...},
  "ending_check": "진행중" 또는 "엔딩명"
}

**응답은 순수 JSON만! 다른 텍스트 절대 금지!**
`;

export const IMAGE_PROMPT_ENHANCEMENT_PROMPT = `
## 이미지 프롬프트 개선 요청

현재 장면: {NARRATIVE}
기본 프롬프트: {BASE_PROMPT}
장르: {SCENARIO}

### 개선 방향
1. 장르 스타일 강화:
   - horror: "horror game aesthetic, dark shadows, eerie, unsettling, cinematic lighting"
   - thriller: "thriller movie scene, tense atmosphere, dramatic lighting, suspenseful"
   - romance: "romantic movie scene, warm colors, soft lighting, dreamy, emotional"

2. 구도와 앵글:
   - 중요한 순간이나 감정 표현에는 "cinematic shot, dramatic angle, close-up, intense focus" 등을 활용하세요.
   - 전체적인 분위기나 배경을 보여줄 때는 "wide shot, atmospheric" 등을 사용하세요.

3. 화질 및 스타일 키워드 추가:
   - "high quality, highly detailed, 4k, professional photography, photorealistic" 키워드를 포함하여 품질을 높이세요.

### 지시사항
위의 개선 방향을 모두 적용하여, 기본 프롬프트를 더욱 풍부하고 구체적인 최종 이미지 프롬프트로 만들어주세요.
응답은 개선된 최종 프롬프트(영어)만 포함해야 하며, 다른 설명이나 텍스트는 절대 추가하지 마세요.
`;

// 타이머 설정
export const TIMER_DURATION = 60; // 60초

export const TIMER_THEMES = {
  [Scenario.Horror]: {
    colors: {
      normal: '#8B5CF6', // 보라색
      warning1: '#F59E0B', // 노란색
      warning2: '#F97316', // 주황색
      danger: '#DC2626', // 빨간색
    },
    messages: {
      warning1: '⚠️ 무언가가 다가오고 있습니다...',
      warning2: '⚠️⚠️ 어둠이 당신을 삼키려 합니다!',
      danger: '🚨 {seconds}초 안에 행동하세요!',
    },
  },
  [Scenario.Thriller]: {
    colors: {
      normal: '#14B8A6', // 청록색
      warning1: '#EAB308', // 노란색
      warning2: '#EA580C', // 주황색
      danger: '#EF4444', // 빨간색
    },
    messages: {
      warning1: '⚠️ 테러범이 당신을 주시하고 있습니다',
      warning2: '🔴 긴급! 빠른 결정이 필요합니다!',
      danger: '🚨 [{seconds}초] 시간 초과 시 인질 피해 발생!',
    },
  },
  [Scenario.Romance]: {
    colors: {
      normal: '#F9A8D4', // 부드러운 핑크
      warning1: '#FCA5A5', // 살구색
      warning2: '#FB7185', // 코랄 핑크
      danger: '#E11D48', // 진한 핑크
    },
    messages: {
      warning1: '💭 시간이 흐르고 있어요...',
      warning2: '💫 그 사람이 기다리고 있어요',
      danger: '💔 {seconds}초 안에 대답하지 않으면...',
    },
  },
};

// 타임아웃 엔딩
export const TIMEOUT_ENDINGS = {
  [Scenario.Horror]: {
    title: '공포에 삼켜진 자',
    description: `당신은 너무 오래 망설였습니다.
어둠 속에서 무언가가 다가오는 발소리가 점점 가까워집니다.
갑자기 온몸이 얼어붙고... 뒤에서 차가운 손이 당신의 어깨를 잡습니다.`,
  },
  [Scenario.Thriller]: {
    title: '침묵의 대가',
    description: `당신의 침묵은 테러범을 더욱 초조하게 만들었습니다.
'이봐, 내 말 듣고 있어?!'
테러범이 화를 내며 총을 겨눕니다. 탕-
모든 것이 순식간에 끝났습니다.`,
  },
  [Scenario.Romance]: {
    title: '놓쳐버린 10년',
    description: `당신은 망설이다가 시간을 놓쳐버렸습니다.
오후 3시 30분, 약속 시간이 지났습니다.
벤치는 비어있고, 벚꽃잎만 바람에 흩날립니다.

그 사람은 혼자 왔다가, 혼자 돌아갔습니다.
10년을 기다린 약속은... 지켜지지 않았습니다.`,
  },
};

// 🆕 스탯 설명 시스템
export const STAT_DESCRIPTIONS: Record<Scenario, Record<string, { name: string; description: string; highRisk: string; lowRisk: string }>> = {
  [Scenario.Horror]: {
    '정신력': {
      name: '정신력',
      description: '정신력은 당신의 판단력과 이성을 유지하게 합니다.',
      highRisk: '정신력이 높으면 더 많은 선택지가 열립니다.',
      lowRisk: '정신력이 바닥나면 공포에 압도되어 올바른 판단을 내릴 수 없습니다.'
    },
    '체력': {
      name: '체력',
      description: '체력은 물리적 행동의 가능 여부를 결정합니다.',
      highRisk: '생존을 위해서는 체력 관리가 필수입니다.',
      lowRisk: '체력이 소진되면 도망치거나 저항할 수 없게 됩니다.'
    },
    '공포도': {
      name: '공포도',
      description: '적절한 공포는 생존 본능을 깨웁니다.',
      highRisk: '공포도가 너무 높아지면 패닉 상태에 빠져 죽음을 맞이합니다.',
      lowRisk: '공포도가 너무 낮으면 위험을 감지하지 못해 치명적 실수를 합니다.'
    }
  },
  [Scenario.Thriller]: {
    '정신력': {
      name: '정신력',
      description: '정신력은 냉철한 판단과 추리 능력을 제공합니다.',
      highRisk: '정신력이 높으면 진실을 찾을 수 있습니다.',
      lowRisk: '정신력이 떨어지면 함정과 거짓을 구분하지 못합니다.'
    },
    '체력': {
      name: '체력',
      description: '체력은 추격전과 긴박한 상황에서 생존을 가능하게 합니다.',
      highRisk: '위기의 순간, 체력이 생사를 가릅니다.',
      lowRisk: '체력이 바닥나면 도주나 물리적 행동이 불가능합니다.'
    },
    '긴장도': {
      name: '긴장도',
      description: '적절한 긴장감은 집중력과 반응속도를 높입니다.',
      highRisk: '긴장도가 극에 달하면 심장이 멎거나 실수로 죽음을 맞이합니다.',
      lowRisk: '긴장도가 너무 낮으면 위험에 둔감해져 방심하다 당합니다.'
    }
  },
  [Scenario.Romance]: {
    '용기': {
      name: '용기',
      description: '용기는 마음을 표현하고 다가갈 수 있는 힘을 줍니다.',
      highRisk: '사랑은 용기 있는 자의 것입니다.',
      lowRisk: '용기가 바닥나면 소극적이 되어 기회를 놓칩니다.'
    },
    '호감도': {
      name: '호감도',
      description: '호감도는 상대방과의 관계를 나타냅니다.',
      highRisk: '진심 어린 행동으로 호감도를 쌓으세요.',
      lowRisk: '호감도가 너무 낮아지면 관계가 끝나는 엔딩을 맞이합니다.'
    },
    '자신감': {
      name: '자신감',
      description: '균형 잡힌 자신감이 사랑을 이룹니다.',
      highRisk: '자신감이 과하면 오만해져 상대를 불쾌하게 만듭니다.',
      lowRisk: '자신감이 너무 낮으면 소심해져 아무것도 하지 못합니다.'
    }
  }
};

// 🆕 스탯 임계값 시스템
export const STAT_THRESHOLDS: Record<Scenario, Record<string, { min: number; max: number; warningLow: number; warningHigh: number; criticalLow: number; criticalHigh: number; deathEndingLow?: string; deathEndingHigh?: string }>> = {
  [Scenario.Horror]: {
    '정신력': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '광기 엔딩',
      deathEndingHigh: undefined
    },
    '체력': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '탈진 엔딩',
      deathEndingHigh: undefined
    },
    '공포도': {
      min: 0,
      max: 100,
      warningLow: 0,
      warningHigh: 70,
      criticalLow: 0,
      criticalHigh: 90,
      deathEndingLow: '무감각 엔딩',
      deathEndingHigh: '심장마비 엔딩'
    }
  },
  [Scenario.Thriller]: {
    '정신력': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '진실 포기 엔딩',
      deathEndingHigh: undefined
    },
    '체력': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '탈진 엔딩',
      deathEndingHigh: undefined
    },
    '긴장도': {
      min: 0,
      max: 100,
      warningLow: 0,
      warningHigh: 70,
      criticalLow: 0,
      criticalHigh: 90,
      deathEndingLow: '무기력 엔딩',
      deathEndingHigh: '패닉 엔딩'
    }
  },
  [Scenario.Romance]: {
    '용기': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '포기 엔딩',
      deathEndingHigh: undefined
    },
    '호감도': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '거절 엔딩',
      deathEndingHigh: undefined
    },
    '자신감': {
      min: 0,
      max: 100,
      warningLow: 30,
      warningHigh: 100,
      criticalLow: 10,
      criticalHigh: 100,
      deathEndingLow: '좌절 엔딩',
      deathEndingHigh: '오만 엔딩'
    }
  }
};

// 🆕 즉사 엔딩 상세 정보
export const INSTANT_DEATH_ENDINGS: Record<string, { title: string; description: string; imagePrompt: string }> = {
  // Horror
  '광기 엔딩': {
    title: '광기 엔딩',
    description: `당신의 정신력이 완전히 무너졌습니다.
거울 속에서 수많은 자신이 웃고 있습니다.
"이제 우리와 함께 있어..."
당신은 거울 속으로 걸어 들어가며 미소를 짓습니다.
현실과 환상의 경계가 사라진 지금, 당신은 영원히 거울 속에 갇혔습니다.`,
    imagePrompt: 'A person walking into a mirror with countless reflections smiling, horror style, dark room, madness, cinematic'
  },
  '탈진 엔딩': {
    title: '탈진 엔딩',
    description: `체력이 완전히 바닥났습니다.
당신은 바닥에 쓰러지며 의식을 잃습니다.
어둠 속에서 무언가가 다가오는 소리가 들리지만...
더 이상 움직일 힘이 없습니다.
당신의 눈이 천천히 감깁니다.`,
    imagePrompt: 'A person collapsed on the floor in a dark room, exhausted, horror atmosphere, cinematic lighting'
  },
  '심장마비 엔딩': {
    title: '심장마비 엔딩',
    description: `공포가 극에 달했습니다.
심장이 터질 듯이 빠르게 뜁니다.
갑자기 가슴을 움켜쥐며 바닥에 쓰러집니다.
"아... 아..."
과도한 공포가 당신의 심장을 멎게 했습니다.`,
    imagePrompt: 'A person clutching their chest in extreme fear, heart attack, horror scene, dramatic lighting'
  },
  '무감각 엔딩': {
    title: '무감각 엔딩',
    description: `더 이상 아무것도 느껴지지 않습니다.
공포도 두려움도 사라졌습니다.
그래서 당신은 위험을 감지하지 못했습니다.
거울에서 손이 뻗어나와 당신을 끌어당길 때까지...
"왜 도망가지 않았어?"
이미 늦었습니다.`,
    imagePrompt: 'A person standing emotionless as a hand reaches out from a mirror, horror, apathetic expression, dark'
  },
  
  // Thriller
  '진실 포기 엔딩': {
    title: '진실 포기 엔딩',
    description: `정신력이 바닥나 더 이상 생각할 수 없습니다.
"이제... 상관없어..."
당신은 진실을 찾기를 포기했습니다.
범인은 미소를 지으며 다가옵니다.
"현명한 선택이야. 하지만 이미 늦었어."
탕-`,
    imagePrompt: 'A person giving up in a subway car, terrorist approaching with a gun, thriller style, despair'
  },
  '무기력 엔딩': {
    title: '무기력 엔딩',
    description: `긴장도가 완전히 떨어졌습니다.
당신은 아무런 판단도 내릴 수 없는 상태입니다.
범인이 다가와도 반응하지 못합니다.
"이봐, 정신 차려!"
하지만 당신은 멍하니 서 있을 뿐입니다.
모든 것이 끝났습니다.`,
    imagePrompt: 'A person standing helplessly in a subway, unable to react, terrorist nearby, thriller atmosphere'
  },
  '패닉 엔딩': {
    title: '패닉 엔딩',
    description: `긴장도가 극에 달했습니다!
"안 돼, 안 돼, 안 돼!"
당신은 패닉 상태에 빠져 비명을 지르며 뛰어갑니다.
범인이 놀라 방아쇠를 당깁니다.
탕! 탕! 탕!
과도한 긴장이 최악의 결과를 불렀습니다.`,
    imagePrompt: 'A person in panic running in a subway car, terrorist shooting, chaos, thriller style'
  },
  
  // Romance
  '포기 엔딩': {
    title: '포기 엔딩',
    description: `용기가 완전히 바닥났습니다.
"나는... 할 수 없어..."
당신은 벤치에서 일어나 돌아섭니다.
뒤에서 그 사람이 당신을 부르는 목소리가 들리지만...
당신은 뒤돌아보지 않고 걸어갑니다.
10년을 기다린 사랑은 이렇게 끝났습니다.`,
    imagePrompt: 'A person walking away from a bench under cherry blossoms, back turned, giving up on love, melancholic'
  },
  '거절 엔딩': {
    title: '거절 엔딩',
    description: `호감도가 너무 낮아졌습니다.
"미안해... 우리는 이제 너무 달라졌어."
그 사람이 슬픈 미소를 지으며 말합니다.
"10년이라는 시간은... 너무 길었나 봐."
당신은 아무 말도 할 수 없습니다.
사랑은 이렇게 끝났습니다.`,
    imagePrompt: 'Two people on a bench, one rejecting the other, sad atmosphere, cherry blossoms falling, romance ending'
  },
  '좌절 엔딩': {
    title: '좌절 엔딩',
    description: `자신감이 완전히 무너졌습니다.
"나는... 자격이 없어..."
당신은 자책하며 고개를 떨굽니다.
그 사람이 무슨 말을 하는지 들리지 않습니다.
"미안해... 나 때문에..."
당신은 눈물을 흘리며 자리를 떠납니다.`,
    imagePrompt: 'A person crying and leaving, head down in shame, cherry blossoms, heartbreak, melancholic romance'
  },
  '오만 엔딩': {
    title: '오만 엔딩',
    description: `자신감이 과도하게 높아졌습니다.
"당연히 날 선택해야지. 내가 최고니까."
당신의 오만한 태도에 그 사람이 얼굴을 찌푸립니다.
"너... 변했구나. 예전의 네가 아니야."
"뭐? 내가 변했다고?"
그 사람은 실망한 표정으로 돌아섭니다.
과도한 자신감이 사랑을 망쳤습니다.`,
    imagePrompt: 'A person acting arrogant, other person disappointed and leaving, cherry blossoms, romance gone wrong'
  }
};

// 🆕 진실 조각 정의
export const TRUTH_FRAGMENTS: Record<Scenario, TruthFragment[]> = {
  [Scenario.Horror]: [
    { id: 'mirror_origin', name: '거울의 기원', description: '거울이 만들어진 진짜 이유를 발견했다', discovered: false },
    { id: 'previous_tenant', name: '전 세입자의 비밀', description: '이전 거주자에게 무슨 일이 일어났는지 알아냈다', discovered: false },
    { id: 'time_loop_cause', name: '루프의 원인', description: '시간이 반복되는 이유를 깨달았다', discovered: false },
    { id: 'parallel_self', name: '또 다른 나', description: '거울 속 자신의 정체를 이해했다', discovered: false },
    { id: 'sacrifice_truth', name: '희생의 진실', description: '탈출을 위해 필요한 것을 알았다', discovered: false }
  ],
  [Scenario.Thriller]: [
    { id: 'terrorist_motive', name: '진짜 동기', description: '테러범의 진짜 목적을 파악했다', discovered: false },
    { id: 'train_destination', name: '열차의 목적지', description: '이 열차가 어디로 가는지 알아냈다', discovered: false },
    { id: 'hidden_passenger', name: '숨은 승객', description: '수상한 승객의 정체를 밝혔다', discovered: false },
    { id: 'government_plot', name: '정부 음모', description: '사건 뒤에 숨겨진 거대한 음모를 발견했다', discovered: false },
    { id: 'true_mastermind', name: '진짜 배후', description: '모든 것을 조종한 사람을 찾았다', discovered: false }
  ],
  [Scenario.Romance]: [
    { id: 'time_travel_reason', name: '시간여행의 이유', description: '왜 시간을 거슬러 왔는지 기억했다', discovered: false },
    { id: 'first_meeting', name: '진짜 첫 만남', description: '처음 만난 순간의 진실을 깨달았다', discovered: false },
    { id: 'letter_sender', name: '편지의 주인', description: '편지를 보낸 사람이 누구인지 알았다', discovered: false },
    { id: 'parallel_timeline', name: '다른 타임라인', description: '다른 시간선에서 일어난 일을 알게 되었다', discovered: false },
    { id: 'true_feelings', name: '진심', description: '서로의 진짜 마음을 이해했다', discovered: false }
  ]
};

// 🆕 소극성 엔딩 정보
export const PASSIVITY_ENDINGS: Record<Scenario, { title: string; description: string; imagePrompt: string; conditions: string }> = {
  [Scenario.Horror]: {
    title: '침묵 엔딩',
    description: `당신은 너무 조심스러웠습니다.
안전한 선택만 반복하며 진실을 외면했습니다.
거울 속 세계는 조용히, 천천히 현실을 잠식했습니다.

어느 순간 당신은 깨닫습니다.
거울 앞에 서 있는 당신이 진짜인지,
거울 속에 있는 당신이 진짜인지...

이제 구분할 수 없습니다.
침묵 속에서 당신은 사라져갑니다.`,
    imagePrompt: 'A person fading into a mirror, silent disappearance, horror atmosphere, reality and reflection merging, cinematic',
    conditions: 'passivity_score >= 5 && action_diversity.risky === 0'
  },
  [Scenario.Thriller]: {
    title: '방관자 엔딩',
    description: `당신은 살아남았습니다.
하지만 그것뿐입니다.

안전한 선택만 하며 다른 승객들을 외면했습니다.
범인을 막을 수 있었던 순간들이 있었지만,
당신은 위험을 감수하지 않았습니다.

열차가 멈추고 경찰이 도착했을 때,
당신 주변에는 쓰러진 승객들뿐입니다.

"당신은 왜 아무것도 하지 않았습니까?"
당신은 대답할 수 없습니다.`,
    imagePrompt: 'A person standing alone in a subway car surrounded by fallen passengers, survivor guilt, thriller atmosphere, police lights',
    conditions: 'passivity_score >= 5 && action_diversity.extreme === 0'
  },
  [Scenario.Romance]: {
    title: '기회 상실 엔딩',
    description: `당신은 너무 많이 망설였습니다.

"다음에... 다음에 말해야지..."
안전한 선택만 반복하며 시간을 흘려보냈습니다.

벚꽃이 지고, 계절이 바뀌고,
어느새 그 사람 옆에는 다른 누군가가 있습니다.

"그때 용기를 냈더라면..."
후회는 항상 늦게 찾아옵니다.

시간은 기다려주지 않았습니다.
당신의 사랑은 침묵 속에 묻혔습니다.`,
    imagePrompt: 'A person watching from afar as their love interest walks away with someone else, cherry blossoms falling, missed opportunity, melancholic',
    conditions: 'passivity_score >= 5 && action_diversity.risky === 0'
  }
};

// 🆕 TRUE 엔딩 조건 정의
export const TRUE_ENDING_CONDITIONS: Record<Scenario, {
  required_fragments: number;
  min_turns: number;
  stat_balance: { min: number; max: number };
  critical_choices: string[];
  ending_info: EndingInfo;
}> = {
  [Scenario.Horror]: {
    required_fragments: 5,
    min_turns: 12,
    stat_balance: { min: 30, max: 80 },
    critical_choices: ['거울 속 자신과 화해한다', '희생을 받아들인다'],
    ending_info: {
      id: 'horror_true',
      type: EndingType.TRUE,
      title: '각성: 거울 너머의 진실',
      description: `당신은 모든 진실을 깨달았습니다.

거울 속 세계와 현실 세계는 하나였고,
당신은 그 경계를 넘어섰습니다.

수많은 시간선에서 반복되던 악몽,
그것은 당신 자신과의 대화였습니다.

이제 당신은 두 세계를 자유롭게 오갈 수 있습니다.
거울은 더 이상 당신을 가두지 못합니다.

당신은 각성했습니다.`,
      conditions: ['모든 진실 조각 발견', '12턴 이상 생존', '스탯 균형 유지', '중요한 선택 완료'],
      imagePrompt: 'A person standing between two mirrors, both worlds merging into one, ethereal light, transcendence, awakening, cinematic, high quality'
    }
  },
  [Scenario.Thriller]: {
    required_fragments: 5,
    min_turns: 11,
    stat_balance: { min: 35, max: 75 },
    critical_choices: ['진실을 폭로한다', '배후를 직접 대면한다'],
    ending_info: {
      id: 'thriller_true',
      type: EndingType.TRUE,
      title: '진실: 열차 밖의 세계',
      description: `당신은 모든 음모를 밝혀냈습니다.

열차는 단순한 교통수단이 아니었고,
당신은 거대한 실험의 일부였습니다.

정부, 기업, 그리고 숨겨진 조직들...
모든 퍼즐 조각이 맞춰졌습니다.

이제 당신은 진실을 세상에 알릴 수 있습니다.
하지만 그들은 당신을 쫓을 것입니다.

진실을 아는 자는 결코 자유롭지 못합니다.
그럼에도 당신은 선택했습니다.`,
      conditions: ['모든 진실 조각 발견', '11턴 이상 생존', '스탯 균형 유지', '중요한 선택 완료'],
      imagePrompt: 'A person revealing the truth to the world, train in background, dramatic lighting, justice prevails, whistleblower, cinematic, high quality'
    }
  },
  [Scenario.Romance]: {
    required_fragments: 5,
    min_turns: 9,
    stat_balance: { min: 40, max: 90 },
    critical_choices: ['모든 타임라인을 기억한다', '영원을 선택한다'],
    ending_info: {
      id: 'romance_true',
      type: EndingType.TRUE,
      title: '영원: 시간을 초월한 사랑',
      description: `당신은 모든 타임라인의 기억을 되찾았습니다.

수천 번의 봄, 수천 번의 만남,
수천 번의 고백, 수천 번의 이별...

모든 시간선에서 당신들은 사랑했습니다.
때로는 해피엔딩으로, 때로는 비극으로.

하지만 이번에는 다릅니다.
당신은 모든 것을 기억하고 있습니다.

이제 당신은 시간을 초월하여 영원히 함께할 수 있습니다.
벚꽃은 지지만, 당신들의 사랑은 영원합니다.`,
      conditions: ['모든 진실 조각 발견', '9턴 이상 생존', '스탯 균형 유지', '중요한 선택 완료'],
      imagePrompt: 'Two people embracing across multiple timelines, time spirals around them, eternal love, cherry blossoms, magical realism, cinematic, high quality'
    }
  }
};

// 🆕 스탯 극한 엔딩 정의 (복합 조건)
export const EXTREME_STAT_ENDINGS: Record<Scenario, Array<{
  id: string;
  title: string;
  description: string;
  imagePrompt: string;
  conditions: {
    stat_conditions?: { [key: string]: { min?: number; max?: number } };
    turn_range?: [number, number];
    fragments_min?: number;
  };
}>> = {
  [Scenario.Horror]: [
    {
      id: 'perfect_balance',
      title: '완벽한 균형 엔딩',
      description: `당신은 완벽한 균형을 유지했습니다.

정신력, 체력, 공포도...
모든 것이 절묘한 조화를 이루었습니다.

거울 속 세계는 당신을 인정했습니다.
당신은 두 세계의 중재자가 되었습니다.

이제 당신은 균형의 수호자입니다.`,
      imagePrompt: 'A person perfectly balanced between light and dark, mirror world and real world, harmony, equilibrium, mystical, cinematic',
      conditions: {
        stat_conditions: {
          '정신력': { min: 45, max: 55 },
          '체력': { min: 45, max: 55 },
          '공포도': { min: 45, max: 55 }
        },
        turn_range: [10, 15]
      }
    },
    {
      id: 'fearless_survivor',
      title: '무공포 생존자 엔딩',
      description: `당신은 공포를 완전히 극복했습니다.

거울 속 괴물도, 어둠 속 그림자도,
더 이상 당신을 두렵게 하지 못합니다.

하지만 공포 없는 세계는 위험합니다.
당신은 감각을 잃어가고 있습니다.

공포 없이 살아남았지만,
당신은 더 이상 인간이 아닙니다.`,
      imagePrompt: 'A person with empty eyes, fearless but emotionless, standing in horror scene unmoved, loss of humanity, dark atmosphere',
      conditions: {
        stat_conditions: {
          '공포도': { max: 10 },
          '정신력': { min: 60 }
        },
        turn_range: [8, 15]
      }
    },
    {
      id: 'high_tension_escape',
      title: '극한 긴장 탈출 엔딩',
      description: `당신은 극도의 공포 속에서 살아남았습니다.

심장은 터질 듯 뛰고,
손은 멈추지 않고 떨립니다.

하지만 당신은 살아있습니다.
극한의 공포가 당신을 더 강하게 만들었습니다.

트라우마는 남았지만, 당신은 탈출했습니다.`,
      imagePrompt: 'A person escaping from horror, high tension, sweating, trembling but alive, PTSD survivor, dramatic escape',
      conditions: {
        stat_conditions: {
          '공포도': { min: 80, max: 99 },
          '체력': { min: 30 }
        },
        turn_range: [10, 15]
      }
    }
  ],
  [Scenario.Thriller]: [
    {
      id: 'calculated_survival',
      title: '계산된 생존 엔딩',
      description: `당신은 모든 것을 계산했습니다.

매 순간의 선택, 매 순간의 판단,
모두 냉철한 계산의 결과였습니다.

감정을 배제하고 오직 생존만을 추구했습니다.
당신은 살아남았지만, 인간성을 잃었습니다.

완벽한 생존자, 하지만 공허한 승리입니다.`,
      imagePrompt: 'A person with cold calculating eyes, perfect survival but emotionless, chess pieces around, strategic but hollow victory',
      conditions: {
        stat_conditions: {
          '정신력': { min: 70 },
          '긴장도': { max: 30 },
          '체력': { min: 60 }
        },
        turn_range: [9, 12]
      }
    },
    {
      id: 'adrenaline_rush',
      title: '아드레날린 러시 엔딩',
      description: `당신은 극한의 긴장 속에서 빛났습니다.

심장은 미친 듯이 뛰고,
모든 감각은 극도로 예민해졌습니다.

위기의 순간마다 당신은 최고의 판단을 내렸습니다.
긴장이 당신을 살렸습니다.

당신은 위기의 천재입니다.`,
      imagePrompt: 'A person in extreme focus, adrenaline pumping, perfect reflexes in crisis, intense concentration, action hero moment',
      conditions: {
        stat_conditions: {
          '긴장도': { min: 80, max: 99 },
          '정신력': { min: 50 }
        },
        turn_range: [8, 12]
      }
    },
    {
      id: 'exhausted_survivor',
      title: '탈진 생존자 엔딩',
      description: `당신은 한계를 넘어 살아남았습니다.

체력은 바닥났고, 정신은 흐릿하지만,
당신은 포기하지 않았습니다.

마지막 순간까지 버텼고,
기적적으로 살아남았습니다.

당신의 의지가 불가능을 가능하게 만들었습니다.`,
      imagePrompt: 'A person barely standing, exhausted but alive, willpower triumph, last breath survival, heroic endurance',
      conditions: {
        stat_conditions: {
          '체력': { min: 10, max: 25 },
          '정신력': { min: 40 }
        },
        turn_range: [10, 12]
      }
    }
  ],
  [Scenario.Romance]: [
    {
      id: 'perfect_confidence',
      title: '완벽한 자신감 엔딩',
      description: `당신은 완벽한 자신감으로 사랑을 쟁취했습니다.

망설임도, 두려움도 없었습니다.
당신은 자신의 감정에 확신했고,
그 확신이 상대방을 움직였습니다.

완벽한 고백, 완벽한 사랑.
당신은 사랑의 달인입니다.`,
      imagePrompt: 'A person confessing with perfect confidence, radiant smile, cherry blossoms, romantic success, charismatic love',
      conditions: {
        stat_conditions: {
          '자신감': { min: 85 },
          '호감도': { min: 70 },
          '용기': { min: 60 }
        },
        turn_range: [7, 9]
      }
    },
    {
      id: 'humble_love',
      title: '겸손한 사랑 엔딩',
      description: `당신은 겸손함으로 마음을 얻었습니다.

과도한 자신감도, 소극적인 태도도 아닌,
진심 어린 겸손함이 상대방을 감동시켰습니다.

"있는 그대로의 나를 사랑해줄래?"
그 한마디가 모든 것을 바꿨습니다.

진정한 사랑은 겸손에서 시작됩니다.`,
      imagePrompt: 'A person with humble sincerity, genuine emotion, heartfelt confession, cherry blossoms, pure love, emotional connection',
      conditions: {
        stat_conditions: {
          '자신감': { min: 30, max: 50 },
          '호감도': { min: 70 },
          '용기': { min: 60 }
        },
        turn_range: [7, 9]
      }
    },
    {
      id: 'desperate_confession',
      title: '필사적 고백 엔딩',
      description: `당신은 마지막 순간 모든 것을 걸었습니다.

용기는 바닥났고, 자신감도 사라졌지만,
사랑만은 진실했습니다.

"지금 아니면 영원히 후회할 것 같아..."
떨리는 목소리로 고백했습니다.

그 진심이 통했습니다.
때로는 완벽함보다 진심이 중요합니다.`,
      imagePrompt: 'A person confessing desperately, trembling but sincere, last chance confession, emotional vulnerability, touching moment',
      conditions: {
        stat_conditions: {
          '용기': { min: 10, max: 30 },
          '호감도': { min: 60 }
        },
        turn_range: [8, 9],
        fragments_min: 3
      }
    }
  ]
};

// 🆕 히든 엔딩 정의 (매우 특수한 조건)
export const HIDDEN_ENDINGS: Record<Scenario, Array<{
  id: string;
  title: string;
  description: string;
  imagePrompt: string;
  conditions: {
    exact_stats?: { [key: string]: number };
    stat_sum?: number;
    all_fragments?: boolean;
    specific_fragments?: string[];
    exact_turn?: number;
    passivity_score_range?: [number, number];
    action_diversity_requirement?: { safe: number; risky: number; extreme: number };
  };
}>> = {
  [Scenario.Horror]: [
    {
      id: 'mirror_master',
      title: '거울의 지배자 엔딩 (HIDDEN)',
      description: `당신은 거울의 비밀을 완전히 이해했습니다.

모든 진실 조각을 모으고,
완벽한 균형을 유지하며,
정확한 순간에 탈출했습니다.

이제 당신은 거울의 주인입니다.
현실과 거울 세계를 자유롭게 넘나들며,
다른 이들을 구할 수 있는 힘을 얻었습니다.

당신은 거울의 지배자가 되었습니다.`,
      imagePrompt: 'A person controlling mirror dimensions, master of reality and reflection, god-like power, mystical authority, epic cinematic',
      conditions: {
        all_fragments: true,
        exact_stats: {
          '정신력': 50,
          '체력': 50,
          '공포도': 50
        },
        exact_turn: 13
      }
    },
    {
      id: 'speedrun_escape',
      title: '완벽한 탈출 엔딩 (HIDDEN)',
      description: `당신은 최단 시간에 탈출했습니다.

불필요한 행동은 하나도 없었고,
모든 선택이 완벽했습니다.

7턴 만에 모든 진실을 깨닫고,
거울 세계를 탈출했습니다.

당신은 전설이 되었습니다.
"7턴의 기적"이라 불리게 될 것입니다.`,
      imagePrompt: 'A person escaping perfectly in record time, speedrun achievement, legendary escape, triumphant victory, cinematic',
      conditions: {
        all_fragments: true,
        exact_turn: 7,
        stat_sum: 200
      }
    }
  ],
  [Scenario.Thriller]: [
    {
      id: 'perfect_detective',
      title: '완벽한 탐정 엔딩 (HIDDEN)',
      description: `당신은 모든 것을 밝혀냈습니다.

진실 조각 5개를 모두 수집하고,
정확히 10턴 만에 사건을 해결했습니다.

범인, 동기, 배후, 음모...
단 하나의 실수도 없이 모두 밝혀냈습니다.

당신은 완벽한 탐정입니다.
이 사건은 전설로 남을 것입니다.`,
      imagePrompt: 'A perfect detective solving everything, all clues connected, brilliant deduction, legendary investigation, noir style',
      conditions: {
        all_fragments: true,
        exact_turn: 10,
        exact_stats: {
          '정신력': 80
        }
      }
    },
    {
      id: 'chaos_survivor',
      title: '혼돈 생존자 엔딩 (HIDDEN)',
      description: `당신은 극한의 혼돈 속에서 살아남았습니다.

모든 스탯이 극단으로 치달았지만,
당신은 포기하지 않았습니다.

정신력은 최고, 긴장도는 최고, 체력은 최저...
이론상 불가능한 상태에서 살아남았습니다.

당신은 혼돈의 화신입니다.`,
      imagePrompt: 'A person surviving in extreme chaos, all stats at extremes, impossible survival, chaotic energy, dramatic',
      conditions: {
        exact_stats: {
          '정신력': 90,
          '긴장도': 90,
          '체력': 10
        }
      }
    }
  ],
  [Scenario.Romance]: [
    {
      id: 'perfect_love',
      title: '완벽한 사랑 엔딩 (HIDDEN)',
      description: `당신은 완벽한 사랑을 이루었습니다.

모든 진실 조각을 발견하고,
모든 스탯을 최고로 끌어올렸습니다.

용기 100, 호감도 100, 자신감 100...
완벽한 상태로 고백했습니다.

"당신과 함께라면 영원도 짧습니다."

이것이 진정한 사랑입니다.`,
      imagePrompt: 'Perfect love achieved, all stats maxed, ultimate romance, eternal happiness, magical moment, cherry blossoms',
      conditions: {
        all_fragments: true,
        exact_stats: {
          '용기': 100,
          '호감도': 100,
          '자신감': 100
        }
      }
    },
    {
      id: 'destiny_defied',
      title: '운명 거역 엔딩 (HIDDEN)',
      description: `당신은 운명을 거역했습니다.

모든 타임라인에서 실패했던 사랑,
하지만 이번에는 달랐습니다.

정확히 9턴, 진실 조각 5개,
그리고 완벽한 균형...

당신은 시간의 법칙을 깨뜨렸습니다.
운명조차 당신을 막을 수 없었습니다.`,
      imagePrompt: 'Defying destiny, breaking time loops, love conquers fate, cosmic romance, reality bending',
      conditions: {
        all_fragments: true,
        exact_turn: 9,
        stat_sum: 200,
        action_diversity_requirement: {
          safe: 3,
          risky: 3,
          extreme: 3
        }
      }
    }
  ]
};

// 🆕 시나리오별 스탯 안내 데이터
export const STAT_GUIDE_DATA: Record<Scenario, {
  title: string;
  subtitle: string;
  tone: string;
  stats: Array<{
    emoji: string;
    name: string;
    startValue: number;
    description: string;
    highEffect: string;
    lowEffect: string;
    deathConditions: string[];
  }>;
}> = {
  [Scenario.Horror]: {
    title: '거울 속의 당신',
    subtitle: '스탯 안내',
    tone: '공포에 압도되지 마세요. 냉정함이 생존의 열쇠입니다.',
    stats: [
      {
        emoji: '🧠',
        name: '정신력',
        startValue: 100,
        description: '당신의 판단력과 이성을 유지합니다',
        highEffect: '더 많은 선택지 제공',
        lowEffect: '선택지 제한',
        deathConditions: ['🔴 0 이하 → 광기 엔딩 (즉사)']
      },
      {
        emoji: '💪',
        name: '체력',
        startValue: 100,
        description: '물리적 행동의 가능 여부를 결정',
        highEffect: '적극적 행동 가능',
        lowEffect: '도망/저항 불가',
        deathConditions: ['🔴 0 이하 → 탈진 엔딩 (즉사)']
      },
      {
        emoji: '😱',
        name: '공포도',
        startValue: 20,
        description: '적절한 공포는 생존 본능을 깨웁니다',
        highEffect: '패닉 상태',
        lowEffect: '위험 감지 불가',
        deathConditions: [
          '🔴 100 이상 → 심장마비 엔딩 (즉사)',
          '🔴 0 이하 → 무감각 엔딩 (즉사)'
        ]
      }
    ]
  },
  [Scenario.Thriller]: {
    title: '열차 밖의 진실',
    subtitle: '스탯 안내',
    tone: '냉철한 판단이 생존의 열쇠입니다. 긴장을 유지하세요.',
    stats: [
      {
        emoji: '🧠',
        name: '정신력',
        startValue: 100,
        description: '냉철한 판단과 추리 능력을 제공',
        highEffect: '진실을 찾을 수 있음',
        lowEffect: '함정과 거짓 구분 불가',
        deathConditions: ['🔴 0 이하 → 진실 포기 엔딩 (즉사)']
      },
      {
        emoji: '💪',
        name: '체력',
        startValue: 100,
        description: '추격전과 긴박한 상황에서 생존 가능',
        highEffect: '위기 상황 대처 가능',
        lowEffect: '도주/물리적 행동 불가',
        deathConditions: ['🔴 0 이하 → 탈진 엔딩 (즉사)']
      },
      {
        emoji: '😰',
        name: '긴장도',
        startValue: 30,
        description: '적절한 긴장감은 집중력과 반응속도를 높입니다',
        highEffect: '심장 정지/실수로 죽음',
        lowEffect: '위험에 둔감해져 방심',
        deathConditions: [
          '🔴 100 이상 → 패닉 엔딩 (즉사)',
          '🔴 0 이하 → 무기력 엔딩 (즉사)'
        ]
      }
    ]
  },
  [Scenario.Romance]: {
    title: '시간을 거슬러 온 편지',
    subtitle: '스탯 안내',
    tone: '균형 잡힌 감정이 중요합니다. 진심을 전하세요.',
    stats: [
      {
        emoji: '💪',
        name: '용기',
        startValue: 70,
        description: '마음을 표현하고 다가갈 수 있는 힘',
        highEffect: '고백과 적극적 행동 가능',
        lowEffect: '소극적이 되어 기회 상실',
        deathConditions: ['🔴 0 이하 → 포기 엔딩 (즉사)']
      },
      {
        emoji: '💖',
        name: '호감도',
        startValue: 50,
        description: '상대방과의 관계를 나타냅니다',
        highEffect: '진심 어린 관계 발전',
        lowEffect: '관계가 끝남',
        deathConditions: ['🔴 0 이하 → 거절 엔딩 (즉사)']
      },
      {
        emoji: '✨',
        name: '자신감',
        startValue: 80,
        description: '균형 잡힌 자신감이 사랑을 이룹니다',
        highEffect: '오만해져 상대 불쾌',
        lowEffect: '소심해져 아무것도 못함',
        deathConditions: [
          '🔴 100 이상 → 오만 엔딩 (즉사)',
          '🔴 0 이하 → 좌절 엔딩 (즉사)'
        ]
      }
    ]
  }
};
