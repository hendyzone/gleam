import { ChatMessage, ModelInfo } from "../utils/types";
import { DataStorage } from "../storage/data";
import { ContextInjector } from "../features/context-injection";
import { AIProvider } from "../api/base";
import { Logger } from "../utils/logger";
import { MessageHelper } from "../ui/components/messageHelper";
import { ChatUtils } from "../ui/utils/chatUtils";

/**
 * AI消息服务 - 统一处理AI请求的核心逻辑
 * 提取自 MessageSendHandler 和 RegenerateHandler 的公共代码
 */
export class AIMessageService {
  constructor(
    private storage: DataStorage,
    private contextInjector: ContextInjector,
    private providers: Map<string, AIProvider>,
    private plugin: any
  ) {}

  /**
   * 验证API配置
   * @returns {apiKey, currentModel, config} 如果验证失败则抛出错误
   */
  async validateApiConfig(): Promise<{ apiKey: string; currentModel: string; config: any }> {
    const config = await this.storage.getConfig();
    const providerConfig = config.openrouter;

    // 检查 API key
    let apiKey = providerConfig.apiKey;
    if (!apiKey && (this.plugin as any).data?.openrouterApiKey) {
      apiKey = (this.plugin as any).data.openrouterApiKey;
      providerConfig.apiKey = apiKey;
      await this.storage.saveConfig(config);
    }

    if (!apiKey || apiKey.trim() === "") {
      throw new Error(this.plugin.i18n.apiKeyRequired);
    }

    if (!config.currentModel) {
      throw new Error(this.plugin.i18n.selectModel);
    }

    return { apiKey, currentModel: config.currentModel, config };
  }

  /**
   * 注入上下文到消息列表
   */
  async injectContext(
    messages: ChatMessage[],
    config: any,
    hasContextInjected: { value: boolean },
    logPrefix: string = "[AIMessageService]"
  ): Promise<ChatMessage[]> {
    if (config.enableContext && !hasContextInjected.value) {
      Logger.log(`${logPrefix} 上下文注入已启用，开始获取文档内容`);
      const documentContent = await this.contextInjector.getCurrentDocumentContent();
      if (documentContent) {
        const contextPrompt = this.contextInjector.buildContextPrompt(documentContent);
        hasContextInjected.value = true;
        Logger.log(`${logPrefix} 上下文注入成功，消息数量:`, messages.length + 1);
        return [
          { role: "system", content: contextPrompt },
          ...messages
        ];
      } else {
        Logger.warn(`${logPrefix} 上下文注入已启用但未获取到文档内容`);
      }
    } else if (config.enableContext && hasContextInjected.value) {
      Logger.log(`${logPrefix} 上下文已在本次对话中注入过，跳过重复注入`);
    } else {
      Logger.log(`${logPrefix} 上下文注入未启用`);
    }
    return messages;
  }

  /**
   * 构建AI请求选项
   */
  buildRequestOptions(
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    modelParams: any
  ): any {
    const requestOptions: any = {
      messages,
      model,
      stream: true,
      apiKey,
      temperature: modelParams.temperature ?? 0.7,
      ...modelParams
    };

    // 处理 max_tokens 的兼容性
    if (modelParams.max_tokens !== undefined) {
      requestOptions.max_tokens = modelParams.max_tokens;
    } else if (modelParams.maxTokens !== undefined) {
      requestOptions.maxTokens = modelParams.maxTokens;
    }

    return requestOptions;
  }

  /**
   * 执行AI请求（流式）
   */
  async executeStreamingRequest(
    provider: string,
    requestOptions: any,
    contentElement: HTMLElement,
    supportsImageOutput: boolean,
    messageId: string,
    messagesContainer: HTMLElement,
    onCopy: (text: string) => Promise<void>,
    onRegenerate: (id: string) => Promise<void>,
    onImageZoom: (imageUrl: string) => void,
    onImageCopy: (imageUrl: string) => Promise<void>
  ): Promise<{ fullContent: string; imageUrls: string[] }> {
    const aiProvider = this.providers.get(provider);
    if (!aiProvider) {
      throw new Error("Provider not found");
    }

    let fullContent = "";
    const imageUrls: string[] = [];

    await aiProvider.chat(
      requestOptions,
      (chunk: string) => {
        // 检查是否是图片标记
        const imageMatch = chunk.match(/\[IMAGE:(.+?)\]/);
        if (imageMatch) {
          const imageUrl = imageMatch[1];
          if (!imageUrls.includes(imageUrl)) {
            imageUrls.push(imageUrl);
          }
          fullContent = fullContent.replace(/\[IMAGE:.+?\]/g, "");
        } else {
          fullContent += chunk;
        }

        // 更新流式消息
        MessageHelper.updateStreamingMessage(
          contentElement,
          fullContent,
          imageUrls,
          supportsImageOutput,
          onCopy,
          onRegenerate,
          messageId,
          onImageZoom,
          onImageCopy
        );
        ChatUtils.scrollToBottom(messagesContainer);
      }
    );

    return { fullContent, imageUrls };
  }

  /**
   * 获取模型参数配置
   */
  async getModelParameters(modelId: string): Promise<any> {
    const config = await this.storage.getConfig();
    const modelParameters = config.modelParameters || {};
    return modelParameters[modelId] || {};
  }
}
