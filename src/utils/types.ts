export type Provider = 'openrouter';

export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
}

export interface PluginConfig {
  openrouter: ProviderConfig;
  currentProvider: Provider;
  currentModel: string;
  enableContext: boolean;
  enableDebugLog: boolean;
  maxHistoryCount: number; // 最大历史数量
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[]; // 图片 URL 或 base64 数据
  audio?: Array<{ data: string; format: string }>; // 音频数据（base64）和格式
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
  isFavorite?: boolean; // 是否已收藏
}

export interface PluginData {
  config: PluginConfig;
  history: ChatHistory[];
}

export interface AIRequestOptions {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  images?: string[]; // 图片输入（用于图生图）
}

export interface AIResponse {
  content: string;
  done: boolean;
}

export interface ModelInfo {
  id: string;
  name: string;
  inputModalities: string[]; // 输入模态: text, image, file, audio, video
  outputModalities: string[]; // 输出模态: text, image, embeddings
  description?: string;
  contextLength?: number;
}

