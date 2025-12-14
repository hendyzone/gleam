import { ChatMessage } from '../../utils/types';
import { DataStorage } from '../../storage/data';
import { ContextInjector } from '../../features/context-injection';
import { AIProvider } from '../../api/base';
import { Logger } from '../../utils/logger';
import { MessageHelper } from '../components/messageHelper';
import { ChatUtils } from '../utils/chatUtils';
import { ConfigHandler } from './configHandler';
import { HistoryHandler } from './historyHandler';

/**
 * 重新生成处理器
 */
export class RegenerateHandler {
  constructor(
    private storage: DataStorage,
    private contextInjector: ContextInjector,
    private providers: Map<string, AIProvider>,
    private configHandler: ConfigHandler,
    private historyHandler: HistoryHandler,
    private plugin: any,
    private messagesContainer: HTMLElement,
    private sendButton: HTMLButtonElement,
    private textarea: HTMLTextAreaElement,
    private currentMessages: ChatMessage[],
    private hasContextInjected: { value: boolean },
    private isLoading: { value: boolean },
    private onError: (message: string) => void,
    private addMessage: (role: 'user' | 'assistant', content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>
  ) {}

  /**
   * 处理重新生成请求
   */
  async handleRegenerate(messageId: string): Promise<void> {
    if (this.isLoading.value) return;

    // 找到对应的助手消息元素
    const assistantElement = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (!assistantElement || !assistantElement.classList.contains('gleam-message-assistant')) {
      return;
    }

    // 找到最后一条用户消息（应该是当前助手消息的前一条）
    const allMessages = Array.from(this.messagesContainer.querySelectorAll('.gleam-message'));
    const currentIndex = allMessages.indexOf(assistantElement);
    if (currentIndex <= 0) {
      this.onError('无法找到对应的用户消息');
      return;
    }

    // 从currentMessages中删除当前的助手回复（最后一条消息应该是助手消息）
    if (this.currentMessages.length > 0 && this.currentMessages[this.currentMessages.length - 1].role === 'assistant') {
      this.currentMessages.pop();
    }

    // 从DOM中删除当前的助手消息
    assistantElement.remove();

    // 获取配置
    const config = await this.storage.getConfig();
    const providerConfig = config.openrouter;

    // 检查 API key
    let apiKey = providerConfig.apiKey;
    if (!apiKey && (this.plugin as any).data?.openrouterApiKey) {
      apiKey = (this.plugin as any).data.openrouterApiKey;
      providerConfig.apiKey = apiKey;
      await this.storage.saveConfig(config);
    }

    if (!apiKey || apiKey.trim() === '') {
      this.onError(this.plugin.i18n.apiKeyRequired);
      return;
    }

    if (!config.currentModel) {
      this.onError(this.plugin.i18n.selectModel);
      return;
    }

    this.isLoading.value = true;
    this.sendButton.disabled = true;
    this.textarea.disabled = true;

    // 创建新的助手消息
    const newAssistantMessageId = await this.addMessage('assistant', '');
    const newAssistantElement = this.messagesContainer.querySelector(`[data-message-id="${newAssistantMessageId}"]`) as HTMLElement;
    const contentElement = newAssistantElement.querySelector('.gleam-message-content') as HTMLElement;
    
    // 标记消息为流式处理中
    newAssistantElement.classList.add('gleam-message-streaming');
    MessageHelper.updateMessageStatus(newAssistantElement, 'streaming');

    try {
      // 构建消息列表（包含上下文和所有历史消息）
      let messages: ChatMessage[] = [...this.currentMessages];

      this.logMessageInfo(messages);
      messages = await this.injectContext(messages, config);
      this.validateMessageImages(messages);

      const aiProvider = this.providers.get(config.currentProvider);
      if (!aiProvider) {
        throw new Error('Provider not found');
      }

      // 获取模型参数配置
      const modelParameters = config.modelParameters || {};
      const currentModelParams = modelParameters[config.currentModel] || {};
      
      // 构建请求选项
      const requestOptions = this.buildRequestOptions(
        messages,
        config.currentModel,
        apiKey,
        currentModelParams
      );

      // 检查当前模型是否支持图片输出
      const currentModelInfo = this.configHandler.getModelInfo(config.currentModel);
      const supportsImageOutput = currentModelInfo?.outputModalities?.includes('image') || false;
      
      // 执行 AI 请求
      const { fullContent, imageUrls } = await this.executeAIRequest(
        aiProvider,
        requestOptions,
        contentElement,
        supportsImageOutput,
        newAssistantMessageId
      );

      this.currentMessages.push({ 
        role: 'assistant', 
        content: fullContent,
        images: imageUrls.length > 0 ? imageUrls : undefined
      });
      newAssistantElement.classList.remove('gleam-message-streaming');
      newAssistantElement.classList.add('gleam-message-completed');
      MessageHelper.updateMessageStatus(newAssistantElement, 'completed');

      await this.historyHandler.saveCurrentChat(this.currentMessages);
    } catch (error: any) {
      this.onError(error.message || this.plugin.i18n.unknownError);
      // 标记消息为错误状态
      if (newAssistantElement) {
        newAssistantElement.classList.remove('gleam-message-streaming');
        newAssistantElement.classList.add('gleam-message-error');
        MessageHelper.updateMessageStatus(newAssistantElement, 'error');
      }
    } finally {
      this.isLoading.value = false;
      this.sendButton.disabled = false;
      this.textarea.disabled = false;
      this.textarea.focus();
    }
  }

  /**
   * 记录消息信息（用于调试）
   */
  private logMessageInfo(messages: ChatMessage[]): void {
    Logger.log('[RegenerateHandler] 重新生成 - 消息列表:', messages.map(m => ({
      role: m.role,
      hasContent: !!m.content,
      hasImages: !!(m.images && m.images.length > 0),
      imageCount: m.images?.length || 0,
      hasAudio: !!(m.audio && m.audio.length > 0)
    })));
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage?.images?.length) {
      Logger.log('[RegenerateHandler] 重新生成 - 最后一条用户消息包含图片，数量:', lastUserMessage.images.length);
    } else {
      Logger.warn('[RegenerateHandler] 重新生成 - 最后一条用户消息不包含图片');
    }
  }

  /**
   * 注入上下文
   */
  private async injectContext(messages: ChatMessage[], config: any): Promise<ChatMessage[]> {
    if (config.enableContext && !this.hasContextInjected.value) {
      Logger.log('[RegenerateHandler] 上下文注入已启用，开始获取文档内容');
      const documentContent = await this.contextInjector.getCurrentDocumentContent();
      if (documentContent) {
        const contextPrompt = this.contextInjector.buildContextPrompt(documentContent);
        this.hasContextInjected.value = true;
        Logger.log('[RegenerateHandler] 上下文注入成功，消息数量:', messages.length + 1);
        return [{ role: 'system', content: contextPrompt }, ...messages];
      } else {
        Logger.warn('[RegenerateHandler] 上下文注入已启用但未获取到文档内容');
      }
    } else if (config.enableContext && this.hasContextInjected.value) {
      Logger.log('[RegenerateHandler] 上下文已在本次对话中注入过，跳过重复注入');
    } else {
      Logger.log('[RegenerateHandler] 上下文注入未启用');
    }
    return messages;
  }

  /**
   * 验证消息中的图片数据
   */
  private validateMessageImages(messages: ChatMessage[]): void {
    const messagesWithImages = messages.filter(m => m.images && m.images.length > 0);
    if (messagesWithImages.length > 0) {
      Logger.log('[RegenerateHandler] 重新生成 - 消息中包含图片，数量:', messagesWithImages.length);
      messagesWithImages.forEach((msg, idx) => {
        Logger.log(`[RegenerateHandler] 消息 ${idx} (role: ${msg.role}) 包含 ${msg.images?.length || 0} 张图片`);
      });
    } else {
      Logger.warn('[RegenerateHandler] 重新生成 - 消息中不包含图片');
    }
  }

  /**
   * 构建请求选项
   */
  private buildRequestOptions(
    messages: ChatMessage[],
    model: string,
    apiKey: string,
    currentModelParams: any
  ): any {
    const requestOptions: any = {
      messages,
      model,
      stream: true,
      apiKey,
      temperature: currentModelParams.temperature ?? 0.7,
      ...currentModelParams
    };
    
    if (currentModelParams.max_tokens !== undefined) {
      requestOptions.max_tokens = currentModelParams.max_tokens;
    } else if (currentModelParams.maxTokens !== undefined) {
      requestOptions.maxTokens = currentModelParams.maxTokens;
    }
    
    return requestOptions;
  }

  /**
   * 执行 AI 请求
   */
  private async executeAIRequest(
    aiProvider: AIProvider,
    requestOptions: any,
    contentElement: HTMLElement,
    supportsImageOutput: boolean,
    messageId: string
  ): Promise<{ fullContent: string; imageUrls: string[] }> {
    let fullContent = '';
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
          fullContent = fullContent.replace(/\[IMAGE:.+?\]/g, '');
        } else {
          fullContent += chunk;
        }
        
        // 更新流式消息
        MessageHelper.updateStreamingMessage(
          contentElement,
          fullContent,
          imageUrls,
          supportsImageOutput,
          async (text) => await ChatUtils.copyToClipboard(text),
          async (id) => await this.handleRegenerate(id),
          messageId
        );
        ChatUtils.scrollToBottom(this.messagesContainer);
      }
    );
    
    return { fullContent, imageUrls };
  }
}

