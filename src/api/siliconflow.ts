import { BaseAIProvider } from "./base";
import { Provider, AIRequestOptions, AIResponse } from "../utils/types";
import { Logger } from "../utils/logger";

export class SiliconFlowProvider extends BaseAIProvider {
  name: Provider = "siliconflow";
  baseURL = "https://api.siliconflow.cn/v1";

  async chat(options: AIRequestOptions & { apiKey?: string }, onChunk?: (chunk: string) => void): Promise<AIResponse> {
    const url = `${this.baseURL}/chat/completions`;
    
    const requestBody = {
      model: options.model,
      messages: options.messages,
      stream: options.stream !== false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens
    };

    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error("API key is required");
    }

    if (options.stream) {
      return this.streamChat(url, requestBody, apiKey, onChunk);
    } else {
      return this.nonStreamChat(url, requestBody, apiKey);
    }
  }

  private async streamChat(
    url: string,
    body: any,
    apiKey: string,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const response = await this.fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(body)
    }, apiKey);

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter(line => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            return { content: fullContent, done: true };
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || "";
            if (content) {
              fullContent += content;
              onChunk?.(content);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    return { content: fullContent, done: true };
  }

  private async nonStreamChat(url: string, body: any, apiKey: string): Promise<AIResponse> {
    const response = await this.fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify({ ...body, stream: false })
    }, apiKey);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return { content, done: true };
  }

  async getModels(apiKey: string): Promise<string[]> {
    try {
      const url = `${this.baseURL}/models`;
      const response = await this.fetchWithAuth(url, {
        method: "GET"
      }, apiKey);

      const data = await response.json();
      return data.data?.map((model: any) => model.id) || [];
    } catch (error) {
      Logger.error("Failed to fetch SiliconFlow models:", error);
      return [
        "deepseek-ai/DeepSeek-V2.5",
        "Qwen/Qwen2.5-72B-Instruct",
        "meta-llama/Llama-3.1-70B-Instruct",
        "01-ai/Yi-1.5-34B-Chat",
        "THUDM/glm-4-9b-chat"
      ];
    }
  }
}

