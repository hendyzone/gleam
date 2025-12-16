import { BaseAIProvider } from "./base";
import { Provider, AIRequestOptions, AIResponse, ModelInfo } from "../utils/types";
import { Logger } from "../utils/logger";

export class OpenRouterProvider extends BaseAIProvider {
  name: Provider = "openrouter";
  baseURL = "https://openrouter.ai/api/v1";

  async chat(options: AIRequestOptions & { apiKey?: string }, onChunk?: (chunk: string) => void): Promise<AIResponse> {
    const url = `${this.baseURL}/chat/completions`;
    
    // 转换消息格式，支持图片和音频输入
    const formattedMessages = options.messages.map(msg => {
      const hasImages = msg.images && msg.images.length > 0;
      const hasAudio = msg.audio && msg.audio.length > 0;
      
      // 如果消息包含图片或音频，需要转换为多模态格式
      if (hasImages || hasAudio) {
        const content: any[] = [];
        
        // 如果有文本内容，添加文本部分
        if (msg.content && msg.content.trim()) {
          content.push({
            type: "text",
            text: msg.content
          });
        }
        
        // 添加图片部分
        if (hasImages) {
          msg.images!.forEach(imageUrl => {
            content.push({
              type: "image_url",
              image_url: {
                url: imageUrl // 支持 base64 data URL 或普通 URL
              }
            });
          });
        }
        
        // 添加音频部分
        if (hasAudio) {
          msg.audio!.forEach(audioItem => {
            content.push({
              type: "input_audio",
              input_audio: {
                data: audioItem.data, // base64 编码的音频数据（不含 data URL 前缀）
                format: audioItem.format // 音频格式，如 wav, mp3 等
              }
            });
          });
        }
        
        return {
          role: msg.role,
          content: content
        };
      }
      
      // 普通文本消息，保持原样
      return {
        role: msg.role,
        content: msg.content
      };
    });
    
    const requestBody = {
      model: options.model,
      messages: formattedMessages,
      stream: options.stream !== false,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens
    };

    const apiKey = options.apiKey;
    if (!apiKey) {
      throw new Error("API key is required");
    }

    // 先发送请求，根据响应的 Content-Type 判断处理方式
    const response = await this.fetchWithAuth(url, {
      method: "POST",
      body: JSON.stringify(requestBody)
    }, apiKey);

    // 检查响应的 Content-Type
    const contentType = response.headers.get("content-type") || "";
    const isEventStream = contentType.includes("text/event-stream") || contentType.includes("text/eventstream");

    if (isEventStream) {
      // 流式响应，使用流式处理
      return this.streamChatFromResponse(response, onChunk);
    } else {
      // 非流式响应，使用非流式处理
      return this.nonStreamChatFromResponse(response);
    }
  }

  /**
   * 从响应对象处理流式数据
   */
  private async streamChatFromResponse(
    response: Response,
    onChunk?: (chunk: string) => void
  ): Promise<AIResponse> {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = ""; // 用于存储不完整的行

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        // 处理剩余的缓冲区内容（最终解码，不使用 stream 模式）
        if (value) {
          // 如果还有最后一个 chunk，解码它（不使用 stream 模式以确保所有字节都被解码）
          buffer += decoder.decode(value, { stream: false });
        }
        
        // 处理剩余的缓冲区内容
        if (buffer.trim()) {
          const lines = buffer.split("\n").filter(line => line.trim() !== "");
          for (const line of lines) {
            const result = this.processStreamLine(line.trim(), fullContent, onChunk);
            if (result.contentAdded !== undefined) {
              fullContent += result.contentAdded;
            }
            if (result.done) {
              return { content: fullContent, done: true };
            }
          }
        }
        break;
      }

      // 解码当前 chunk，可能包含不完整的行（使用 stream 模式以处理多字节字符）
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;
      
      // 按行分割，最后一行可能不完整
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 保留最后一行（可能不完整）

      // 处理完整的行
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        const result = this.processStreamLine(trimmedLine, fullContent, onChunk);
        if (result.contentAdded !== undefined) {
          fullContent += result.contentAdded;
        }
        if (result.done) {
          return { content: fullContent, done: true };
        }
      }
    }

    return { content: fullContent, done: true };
  }

  /**
   * 处理流式响应中的一行数据
   */
  private processStreamLine(
    line: string,
    currentContent: string,
    onChunk?: (chunk: string) => void
  ): { contentAdded?: string; done: boolean } {
    if (!line.startsWith("data: ")) {
      return { done: false };
    }

    const data = line.slice(6);
    if (data === "[DONE]") {
      return { done: true };
    }

    try {
      const parsed = JSON.parse(data);
      // 检查是否有图片内容
      const choice = parsed.choices?.[0];
      const content = choice?.delta?.content || "";
      
      // 处理图片：支持两种格式
      // 1. choices[0].delta.images 数组格式（新格式）
      // 2. choices[0].delta.image_url 或 choice.image_url（旧格式）
      const images = choice?.delta?.images;
      if (images && Array.isArray(images)) {
        // 新格式：images 数组
        images.forEach((img: any) => {
          if (img.type === "image_url" && img.image_url?.url) {
            onChunk?.(`[IMAGE:${img.image_url.url}]`);
          } else if (img.url) {
            // 兼容其他可能的格式
            onChunk?.(`[IMAGE:${img.url}]`);
          }
        });
      } else {
        // 旧格式：单个 image_url
        const imageUrl = choice?.delta?.image_url || choice?.image_url;
        if (imageUrl) {
          onChunk?.(`[IMAGE:${imageUrl}]`);
        }
      }
      
      if (content) {
        onChunk?.(content);
        return { contentAdded: content, done: false };
      }

      return { done: false };
    } catch (e) {
      // Ignore parse errors
      return { done: false };
    }
  }

  /**
   * 从响应对象处理非流式数据
   */
  private async nonStreamChatFromResponse(response: Response): Promise<AIResponse> {
    const data = await response.json();
    const choice = data.choices?.[0];
    let content = choice?.message?.content || "";
    
    // 检查是否有图片响应（某些图片生成模型可能返回图片 URL）
    const imageUrl = choice?.message?.image_url || data.image_url || data.url;
    if (imageUrl && !content) {
      // 如果只有图片没有文本，将图片 URL 作为内容
      content = `[IMAGE:${imageUrl}]`;
    } else if (imageUrl) {
      // 如果有文本也有图片，将图片追加到内容中
      content += `\n[IMAGE:${imageUrl}]`;
    }

    return { content, done: true };
  }

  async getModels(apiKey: string): Promise<string[]> {
    try {
      const models = await this.getModelsWithInfo(apiKey);
      return models.map(m => m.id);
    } catch (error) {
      Logger.error("Failed to fetch OpenRouter models:", error);
      return [
        "openai/gpt-4-turbo",
        "openai/gpt-3.5-turbo",
        "anthropic/claude-3-opus",
        "anthropic/claude-3-sonnet",
        "google/gemini-pro"
      ];
    }
  }

  async getModelsWithInfo(apiKey: string): Promise<ModelInfo[]> {
    try {
      const url = `${this.baseURL}/models`;
      const response = await this.fetchWithAuth(url, {
        method: "GET"
      }, apiKey);

      const data = await response.json();
      return (data.data || []).map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        inputModalities: model.architecture?.input_modalities || ["text"],
        outputModalities: model.architecture?.output_modalities || ["text"],
        description: model.description || "",
        contextLength: model.context_length || null,
        supportedParameters: model.supported_parameters || [],
        defaultParameters: model.default_parameters || undefined
      }));
    } catch (error) {
      Logger.error("Failed to fetch OpenRouter models with info:", error);
      return [];
    }
  }
}

