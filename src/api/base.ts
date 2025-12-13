import { Provider, AIRequestOptions, AIResponse, ModelInfo } from '../utils/types';

export interface AIProvider {
  name: Provider;
  chat(options: AIRequestOptions & { apiKey?: string }, onChunk?: (chunk: string) => void): Promise<AIResponse>;
  getModels(apiKey: string): Promise<string[]>;
  getModelsWithInfo(apiKey: string): Promise<ModelInfo[]>;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: Provider;
  abstract baseURL: string;

  protected async fetchWithAuth(url: string, options: RequestInit, apiKey: string): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${apiKey}`);
    headers.set('Content-Type', 'application/json');

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new Error(error.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  abstract chat(options: AIRequestOptions, onChunk?: (chunk: string) => void): Promise<AIResponse>;
  abstract getModels(apiKey: string): Promise<string[]>;
  abstract getModelsWithInfo(apiKey: string): Promise<ModelInfo[]>;
}

