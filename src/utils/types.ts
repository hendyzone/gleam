export type Provider = 'openrouter' | 'siliconflow';

export interface ProviderConfig {
  apiKey: string;
  baseURL: string;
}

export interface PluginConfig {
  openrouter: ProviderConfig;
  siliconflow: ProviderConfig;
  currentProvider: Provider;
  currentModel: string;
  enableContext: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
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
}

export interface AIResponse {
  content: string;
  done: boolean;
}

