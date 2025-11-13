import { GoogleGenAI, Type } from '@google/genai';
import { GameState, Scenario } from '../types';
import { AI_MASTER_PROMPT, IMAGE_PROMPT_ENHANCEMENT_PROMPT } from '../constants';

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;
if (!API_KEY || API_KEY === 'PLACEHOLDER_API_KEY') {
  throw new Error("유효한 GEMINI_API_KEY를 .env.local 파일에 설정해주세요.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

// 재시도 헬퍼 함수
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastRetry = i === maxRetries - 1;
      const isRetryableError = 
        error?.message?.includes('overloaded') || 
        error?.message?.includes('503') ||
        error?.message?.includes('UNAVAILABLE') ||
        error?.status === 'UNAVAILABLE';
      
      if (isLastRetry || !isRetryableError) {
        throw error;
      }
      
      // 지수 백오프: 3초, 6초, 12초...
      const waitTime = delay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries reached');
}

const createGameStateSchema = (scenario: Scenario) => {
  let statsProperties: Record<string, { type: Type }> = {};
  let statsRequired: string[] = [];
  let statChangesProperties: Record<string, { type: Type }> = {};

  switch (scenario) {
    case Scenario.Horror:
      statsProperties = {
        '정신력': { type: Type.NUMBER },
        '체력': { type: Type.NUMBER },
        '공포도': { type: Type.NUMBER },
      };
      statsRequired = ['정신력', '체력', '공포도'];
      statChangesProperties = {
        '정신력': { type: Type.NUMBER },
        '체력': { type: Type.NUMBER },
        '공포도': { type: Type.NUMBER },
      };
      break;
    case Scenario.Thriller:
      statsProperties = {
        '정신력': { type: Type.NUMBER },
        '체력': { type: Type.NUMBER },
        '긴장도': { type: Type.NUMBER },
      };
      statsRequired = ['정신력', '체력', '긴장도'];
      statChangesProperties = {
        '정신력': { type: Type.NUMBER },
        '체력': { type: Type.NUMBER },
        '긴장도': { type: Type.NUMBER },
      };
      break;
    case Scenario.Romance:
      statsProperties = {
        '용기': { type: Type.NUMBER },
        '호감도': { type: Type.NUMBER },
        '자신감': { type: Type.NUMBER },
      };
      statsRequired = ['용기', '호감도', '자신감'];
      statChangesProperties = {
        '용기': { type: Type.NUMBER },
        '호감도': { type: Type.NUMBER },
        '자신감': { type: Type.NUMBER },
      };
      break;
  }

  return {
    type: Type.OBJECT,
    properties: {
      narrative: {
        type: Type.STRING,
        description: '상황 설명 (3-5문장, 몰입감 있게 서술)',
      },
      image_prompt: {
        type: Type.STRING,
        description: '이 장면의 이미지 프롬프트 (영어, 구체적으로)',
      },
      stats: {
        type: Type.OBJECT,
        description: '플레이어의 현재 스탯',
        properties: statsProperties,
        required: statsRequired,
      },
      suggested_actions: {
        type: Type.ARRAY,
        description: '추천 선택지 3개 (A, B, C)',
        items: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: '선택지 ID (A, B, C)',
            },
            emoji: {
              type: Type.STRING,
              description: '이모지',
            },
            text: {
              type: Type.STRING,
              description: '행동 설명',
            },
            required_stats: {
              type: Type.OBJECT,
              description: '필요한 스탯 조건',
              properties: statsProperties,
              nullable: true,
            },
            stat_changes: {
              type: Type.OBJECT,
              description: '스탯 변화량 (선택 후 적용, UI에 표시 안 함)',
              properties: statChangesProperties,
            },
            is_trap: {
              type: Type.BOOLEAN,
              description: '트랩 여부',
            },
            trap_ending: {
              type: Type.OBJECT,
              description: '트랩 엔딩 (트랩일 경우 필수)',
              properties: {
                title: {
                  type: Type.STRING,
                  description: '엔딩 제목',
                },
                description: {
                  type: Type.STRING,
                  description: '엔딩 설명',
                },
              },
              nullable: true,
            },
          },
          required: ['id', 'emoji', 'text', 'stat_changes', 'is_trap'],
        },
      },
      analysis: {
        type: Type.OBJECT,
        properties: {
          player_action: {
            type: Type.STRING,
            description: '플레이어가 한 행동 분석',
          },
          emotion_detected: {
            type: Type.STRING,
            description: '감지된 감정이나 의도',
          },
        },
        required: ['player_action', 'emotion_detected'],
      },
      ending_check: {
        type: Type.STRING,
        description: '진행중 또는 엔딩명',
      },
    },
    required: ['narrative', 'image_prompt', 'stats', 'suggested_actions', 'analysis', 'ending_check'],
  };
};


function constructPrompt(history: { role: string, parts: { text: string }[] }[], newContent: string) {
    return [...history, { role: 'user', parts: [{ text: newContent }] }];
}

export async function generateGameResponse(
  history: { role: string, parts: { text: string }[] }[],
  userPrompt: string,
  scenario: Scenario
): Promise<GameState> {
  // Flash 모델로 먼저 시도 (더 빠르고 저렴)
  try {
    return await retryWithBackoff(async () => {
      
      const contents = constructPrompt(history, userPrompt);
      const gameStateSchema = createGameStateSchema(scenario);
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: AI_MASTER_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: gameStateSchema,
          temperature: 0.8,
          topP: 0.9,
        },
      });

      if (!response || !response.text) {
        throw new Error('Invalid response from API');
      }

      const responseText = response.text;
      const text = responseText.trim();
      const cleanJsonText = text.replace(/^```json\s*|```\s*$/g, '');
      const parsedResponse = JSON.parse(cleanJsonText);
      
      return parsedResponse as GameState;
    }, 1, 2000); // 재시도 1회로 줄임 (API 절약)
  } catch (flashError) {
    // Flash 실패 시 바로 오류 반환 (Pro 시도 안 함 - API 절약)
    console.error('❌ 스토리 생성 실패:', flashError);
    throw new Error('🔄 AI 서버가 현재 바쁩니다. 잠시 후 다시 시도해주세요.');
  }
}

export async function enhanceImagePrompt(
    narrative: string,
    basePrompt: string,
    scenario: Scenario
  ): Promise<string> {
    return retryWithBackoff(async () => {
      try {
        const prompt = IMAGE_PROMPT_ENHANCEMENT_PROMPT
          .replace('{NARRATIVE}', narrative)
          .replace('{BASE_PROMPT}', basePrompt)
          .replace('{SCENARIO}', scenario);
    
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
          }
        });
    
        if (!response || !response.text) {
          return basePrompt;
        }

        const responseText = response.text;
        let enhancedPrompt = responseText.trim();
        
        // 한국어나 러시아어 등 비영어 문자 제거
        enhancedPrompt = enhancedPrompt.replace(/[^\x00-\x7F]/g, ' ');
        
        // 여러 공백을 하나로
        enhancedPrompt = enhancedPrompt.replace(/\s+/g, ' ').trim();
        
        // 비어있거나 너무 짧으면 기본 프롬프트 사용
        if (!enhancedPrompt || enhancedPrompt.length < 10) {
          return basePrompt;
        }
        
        return enhancedPrompt;
      } catch (error) {
        console.error('Error enhancing image prompt:', error);
        return basePrompt;
      }
    }, 2, 1000);
}

export async function generateImage(prompt: string, scenario: Scenario): Promise<string> {
  const placeholderMap: Record<Scenario, string> = {
    [Scenario.Horror]: '/horror-thumbnail.png',
    [Scenario.Thriller]: '/thriller-thumbnail.png',
    [Scenario.Romance]: '/romance-thumbnail.png',
  };
  
  // 재시도 로직 포함 (2회 시도, 10초 간격)
  return await retryWithBackoff(async () => {
    try {
      // Gemini Imagen 시도
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9',
        },
      });

      if (!response || !response.generatedImages || response.generatedImages.length === 0) {
        throw new Error('No generated images in response');
      }

      const imageData = response.generatedImages[0];
      const imageDataAny = imageData as any;
      let base64Data: string | null = null;
      
      if (imageData.image?.imageBytes) {
        base64Data = imageData.image.imageBytes;
      } else if (imageDataAny.imageBytes) {
        base64Data = imageDataAny.imageBytes;
      } else if (imageDataAny.bytesBase64Encoded) {
        base64Data = imageDataAny.bytesBase64Encoded;
      } else if (typeof imageData === 'string') {
        base64Data = imageData as string;
      } else {
        for (const [_, value] of Object.entries(imageData)) {
          if (typeof value === 'string' && value.length > 100) {
            base64Data = value;
            break;
          }
        }
      }
      
      if (base64Data) {
        console.log('✅ Gemini 이미지 생성 성공');
        return `data:image/jpeg;base64,${base64Data}`;
      }
      
      throw new Error('No image data found');
      
    } catch (error) {
      console.log('⚠️ 이미지 생성 시도 실패, 재시도 중...');
      throw error; // retryWithBackoff가 재시도
    }
  }, 2, 10000).catch(() => {
    // 모든 재시도 실패 시 placeholder
    console.log('💾 이미지 생성 완전 실패, placeholder 사용');
    return placeholderMap[scenario] || '/horror-thumbnail.png';
  });
}
