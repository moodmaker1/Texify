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
      console.log(`⏳ 서버 과부하 감지. ${waitTime/1000}초 후 재시도 (${i + 1}/${maxRetries})...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error('Max retries reached');
}

const createGameStateSchema = (scenario: Scenario) => {
  let statsProperties: Record<string, { type: Type }> = {};
  let statsRequired: string[] = [];

  switch (scenario) {
    case Scenario.Horror:
      statsProperties = {
        '정신력': { type: Type.NUMBER },
        '체력': { type: Type.NUMBER },
        '시간': { type: Type.STRING },
        '공포도': { type: Type.NUMBER },
      };
      statsRequired = ['정신력', '체력', '시간', '공포도'];
      break;
    case Scenario.Thriller:
      statsProperties = {
        '체력': { type: Type.NUMBER },
        '신뢰도': { type: Type.NUMBER },
        '시간': { type: Type.STRING },
        '생존 인질': { type: Type.NUMBER },
      };
      statsRequired = ['체력', '신뢰도', '시간', '생존 인질'];
      break;
    case Scenario.Romance:
      statsProperties = {
        '설렘도': { type: Type.NUMBER },
        '용기': { type: Type.NUMBER },
        '시간': { type: Type.STRING },
        '호감도': { type: Type.NUMBER },
      };
      statsRequired = ['설렘도', '용기', '시간', '호감도'];
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
    required: ['narrative', 'image_prompt', 'stats', 'analysis', 'ending_check'],
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
  // Flash 모델로 먼저 시도 (더 빠르고 안정적)
  try {
    return await retryWithBackoff(async () => {
      console.log('⚡ Gemini Flash 모델로 스토리 생성 중...');
      
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
      console.log('✅ Flash 모델로 스토리 생성 성공!');
      return parsedResponse as GameState;
    }, 3, 3000); // 3번 재시도, 3초부터 시작
  } catch (flashError) {
    console.warn('⚠️ Flash 모델 실패, Pro 모델로 전환 중...');
    
    // Flash 모델 실패 시에만 Pro 모델로 폴백
    try {
      return await retryWithBackoff(async () => {
        console.log('🎮 Gemini Pro 모델로 스토리 생성 중...');
        
        const contents = constructPrompt(history, userPrompt);
        const gameStateSchema = createGameStateSchema(scenario);
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
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
        console.log('✅ Pro 모델로 스토리 생성 성공!');
        return parsedResponse as GameState;
      }, 2, 5000); // Pro는 2번만 재시도, 5초 간격
    } catch (proError) {
      console.error('❌ 두 모델 모두 실패:', proError);
      throw new Error('🔄 AI 서버가 현재 과부하 상태입니다. 잠시 후 다시 시도해주세요. (추천: 한국 낮 시간대 이용)');
    }
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
    }, 2, 1000); // 2번 재시도, 1초부터 시작
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    return await retryWithBackoff(async () => {
      console.log('🎨 이미지 생성 중...');
      
      const response = await ai.models.generateImages({
          model: 'imagen-4.0-generate-001',
          prompt: prompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
          },
      });

      if (response.generatedImages && response.generatedImages.length > 0) {
          const imageData = response.generatedImages[0].image;
          if (imageData && imageData.imageBytes) {
            const base64ImageBytes: string = imageData.imageBytes;
            console.log('✅ 이미지 생성 성공!');
            return `data:image/jpeg;base64,${base64ImageBytes}`;
          }
      }
      
      throw new Error("No image data found in response");
    }, 2, 2000); // 2번 재시도, 2초부터 시작
  } catch (error) {
    console.error('❌ 이미지 생성 실패:', error);
    console.log('🖼️ Placeholder 이미지 사용');
    // 이미지 생성 실패 시 아름다운 placeholder 사용
    return "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1024&h=576&fit=crop&q=80";
  }
}
