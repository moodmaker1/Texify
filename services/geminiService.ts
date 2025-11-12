import { GoogleGenAI, Type, Modality } from '@google/genai';
import { GameState, Scenario } from '../types';
import { AI_MASTER_PROMPT, IMAGE_PROMPT_ENHANCEMENT_PROMPT } from '../constants';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

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
  try {
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

    const text = response.text.trim();
    // Sometimes the response might be wrapped in markdown, clean it.
    const cleanJsonText = text.replace(/^```json\s*|```\s*$/g, '');
    const parsedResponse = JSON.parse(cleanJsonText);
    return parsedResponse as GameState;
  } catch (error) {
    console.error('Error generating game response:', error);
    throw new Error('AI 응답을 생성하는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
  }
}

export async function enhanceImagePrompt(
    narrative: string,
    basePrompt: string,
    scenario: Scenario
  ): Promise<string> {
    try {
      const prompt = IMAGE_PROMPT_ENHANCEMENT_PROMPT
        .replace('{NARRATIVE}', narrative)
        .replace('{BASE_PROMPT}', basePrompt)
        .replace('{SCENARIO}', scenario);
  
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
  
      const enhancedPrompt = response.text.trim();
      return enhancedPrompt || basePrompt;
    } catch (error) {
      console.error('Error enhancing image prompt:', error);
      return basePrompt;
    }
}

export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [{ text: prompt }],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return `data:image/png;base64,${base64ImageBytes}`;
        }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error('Error generating image:', error);
    return "https://picsum.photos/seed/error/1024/768";
  }
}
