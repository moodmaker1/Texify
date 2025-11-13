import { Scenario, ScenarioDetails } from './types';

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
## 시나리오 초기화: 403호의 전설

제목: 403호의 전설
장르: 호러
난이도: 중상

### 배경 설정
- 장소: 흉가로 소문난 원룸 403호
- 시간: 입주 첫날 밤 자정 (00:00)
- 상황: 전 세입자들이 일주일도 못 버티고 나간 악명 높은 방입니다.

### 플레이어 설정
- 역할: 저렴한 월세에 끌려 이사 온 새로운 세입자입니다.
- 목표: 이 방에서 새벽 5시까지 살아남아야 합니다.
- 초기 상태: 방금 모든 짐을 풀고 지친 몸으로 침대에 누웠습니다.

### 스탯 정의
- 정신력: 100 (0이 되면 '광기 엔딩')
- 체력: 100 (0이 되면 '탈진 엔딩')
- 공포도: 20 (100이 되면 '심장마비 엔딩')

### 초기 사건
첫 장면을 생성해주세요. 플레이어는 침대에 누워있고, 밖의 복도에서 누군가 현관문 손잡이를 조심스럽게 돌리는 소리가 들립니다.

**필수: suggested_actions를 3개 포함하여 JSON으로 응답하세요.**
- 2개는 안전(is_trap: false), 1개는 트랩(is_trap: true)
- 각 선택지에 required_stats(option), stat_changes(필수) 포함
- 트랩에는 trap_ending 포함
`;

export const THRILLER_PROMPT = `
## 시나리오 초기화: 지하철 인질극

제목: 지하철 인질극
장르: 스릴러
난이도: 상

### 배경 설정
- 장소: 2호선 지하철 내부, 꽉 찬 출근길 열차
- 시간: 평일 아침 8시
- 상황: 갑자기 울린 총성과 함께 무장 테러범이 등장했고, 지하철은 터널 중간에 비상 정차했습니다.

### 플레이어 설정
- 역할: 다른 사람들과 마찬가지로 출근하던 평범한 직장인입니다.
- 목표: 이 극한 상황에서 생존하고, 가능하다면 다른 인질들을 구해야 합니다.
- 초기 위치: 지하철 객차 중간 좌석에 앉아있습니다.

### 스탯 정의
- 정신력: 100 (0이 되면 '패닉 엔딩')
- 체력: 100 (0이 되면 '부상 엔딩')
- 긴장도: 30 (100이 되면 '실수 엔딩')

### 초기 사건
첫 장면을 생성해주세요. 지하철이 급정거하며 사람들이 넘어지고, 테러범이 천장을 향해 총을 한 발 쏘며 모두 핸드폰을 바닥에 내려놓으라고 소리칩니다.

**필수: suggested_actions를 3개 포함하여 JSON으로 응답하세요.**
- 2개는 안전(is_trap: false), 1개는 트랩(is_trap: true)
- 각 선택지에 required_stats(option), stat_changes(필수) 포함
- 트랩에는 trap_ending 포함
`;

export const ROMANCE_PROMPT = `
## 시나리오 초기화: 타임캡슐 재회

제목: 타임캡슐 재회
장르: 로맨스
난이도: 하

### 배경 설정
- 장소: 졸업한 고등학교 정문 앞, 오래된 벤치
- 시간: 약속 시간 30분 전인 오후 2시 30분
- 계절: 봄, 벚꽃이 흩날리고 있습니다.
- 상황: 10년 전, 첫사랑과 "10년 후 오늘, 이 자리에서 다시 만나자"고 약속했던 바로 그날입니다.

### 플레이어 설정
- 역할: 10년 전 첫사랑과 헤어진 28세의 직장인입니다.
- 약속: 10년 전의 약속을 지키기 위해 이곳에 왔습니다.
- 초기 상태: 떨리는 마음으로 약속 시간보다 30분 일찍 도착해 벤치에 앉아있습니다.

### 스탯 정의
- 용기: 70 (0이 되면 '포기 엔딩')
- 호감도: 50 (0이 되면 '거절 엔딩')
- 자신감: 80 (0이 되면 '좌절 엔딩')

### 초기 사건
첫 장면을 생성해주세요. 플레이어는 벤치에 앉아 익숙하면서도 낯선 모교를 바라보며 10년 전의 추억을 회상하고 있습니다.

**필수: suggested_actions를 3개 포함하여 JSON으로 응답하세요.**
- 2개는 안전(is_trap: false), 1개는 트랩(is_trap: true)
- 각 선택지에 required_stats(option), stat_changes(필수) 포함
- 트랩에는 trap_ending 포함
`;

export const SCENARIO_DETAILS: ScenarioDetails[] = [
  {
    id: Scenario.Horror,
    title: '403호의 전설',
    description: '흉가로 소문난 원룸, 입주 첫날 밤. 당신은 새벽 5시까지 살아남아야 합니다.',
    image: '/horror-thumbnail.png',
    difficulty: '중상',
    difficultyStars: 3,
    playTime: '20-30분',
    color: '#DC2626', // Red-600
  },
  {
    id: Scenario.Thriller,
    title: '지하철 인질극',
    description: '출근길 지하철이 무장 테러범에게 점령당했습니다. 제한 시간 내에 생존하고 인질을 구하세요.',
    image: '/thriller-thumbnail.png',
    difficulty: '상',
    difficultyStars: 3,
    playTime: '15-25분',
    color: '#F59E0B', // Amber-500
  },
  {
    id: Scenario.Romance,
    title: '타임캡슐 재회',
    description: '10년 전 약속의 날, 당신은 첫사랑을 다시 만날 수 있을까요?',
    image: '/romance-thumbnail.png',
    difficulty: '하',
    difficultyStars: 1,
    playTime: '10-15분',
    color: '#EC4899', // Pink-500
  },
];

export const GAME_PROGRESS_PROMPT = `
## 현재 상황
서술: {NARRATIVE}
스탯: {STATS}

## ⚠️ 중요: 상황 분석
플레이어가 방금 "{PLAYER_ACTION}"를 했습니다. 
이 행동의 결과로 상황이 어떻게 변했는지 분석하세요:
- 이전과 완전히 다른 새로운 상황이 전개되어야 합니다
- 플레이어의 행동에 따라 환경, 위치, 주변 인물이 변했을 수 있습니다
- 이 새로운 상황에만 적합한 선택지 3개를 만드세요

## 플레이어 행동
{PLAYER_ACTION}

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

8. **필수: 상황별 선택지 다양성 (CRITICAL!)**:
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

## 엔딩 체크
- 목표 달성 시: ending_check에 "엔딩명"
- 계속 진행: "진행중"

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
