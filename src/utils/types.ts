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
  modelParameters?: Record<string, ModelParameters>; // 每个模型的参数配置，key 为 modelId
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
  [key: string]: any; // 允许其他参数（如 top_p, top_k 等）
}

export interface AIResponse {
  content: string;
  done: boolean;
}

export type SupportedParameter = 
  | 'temperature'
  | 'top_p'
  | 'top_k'
  | 'min_p'
  | 'top_a'
  | 'frequency_penalty'
  | 'presence_penalty'
  | 'repetition_penalty'
  | 'max_tokens'
  | 'logit_bias'
  | 'logprobs'
  | 'top_logprobs'
  | 'seed'
  | 'response_format'
  | 'structured_outputs'
  | 'stop'
  | 'tools'
  | 'tool_choice'
  | 'parallel_tool_calls'
  | 'include_reasoning'
  | 'reasoning'
  | 'web_search_options'
  | 'verbosity';

export interface ModelInfo {
  id: string;
  name: string;
  inputModalities: string[]; // 输入模态: text, image, file, audio, video
  outputModalities: string[]; // 输出模态: text, image, embeddings
  description?: string;
  contextLength?: number;
  supportedParameters?: SupportedParameter[]; // 支持的参数列表
  defaultParameters?: {
    temperature?: number;
    top_p?: number;
    frequency_penalty?: number;
  };
}

export interface ModelParameters {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  top_a?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  repetition_penalty?: number;
  max_tokens?: number;
  maxTokens?: number; // 兼容性
  seed?: number;
  stop?: string[] | string;
  parallel_tool_calls?: boolean;
  include_reasoning?: boolean;
  [key: string]: any; // 允许其他参数
}

