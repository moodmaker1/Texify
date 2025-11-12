export enum Scenario {
  Horror = 'horror',
  Thriller = 'thriller',
  Romance = 'romance',
}

export interface Stats {
  [key: string]: number | string;
}

export interface Analysis {
  player_action: string;
  emotion_detected: string;
}

export interface GameState {
  narrative: string;
  image_prompt: string;
  stats: Stats;
  analysis: Analysis;
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