import { ChatMessage } from '../../utils/types';
import { DataStorage } from '../../storage/data';
import { ContextInjector } from '../../features/context-injection';
import { AIProvider } from '../../api/base';
import { Logger } from '../../utils/logger';
import { MessageHelper } from '../components/messageHelper';
import { ChatUtils } from '../utils/chatUtils';
import { ConfigHandler } from './configHandler';
import { AttachmentHandler } from './attachmentHandler';
import { HistoryHandler } from './historyHandler';

/**
 * 消息发送处理器
 */
export class MessageSendHandler {
  constructor(
    private storage: DataStorage,
    private contextInjector: ContextInjector,
    private providers: Map<string, AIProvider>,
    private configHandler: ConfigHandler,
    private attachmentHandler: AttachmentHandler,
    private historyHandler: HistoryHandler,
    private plugin: any,
    private messagesContainer: HTMLElement,
    private textarea: HTMLTextAreaElement,
    private sendButton: HTMLButtonElement,
    private currentMessages: ChatMessage[],
    private hasContextInjected: { value: boolean },
    private isLoading: { value: boolean },
    private onError: (message: string) => void,
    private addMessage: (role: 'user' | 'assistant', content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>,
    private onRegenerate: (messageId: string) => Promise<void>
  ) {}

  /**
   * 处理消息发送
   */
  async handleSend(): Promise<void> {
    const message = this.textarea.value.trim();
    const hasAttachments = this.attachmentHandler.getSelectedImages().length > 0 || 
                          this.attachmentHandler.getSelectedAudio().length > 0;
    
    if ((!message && !hasAttachments) || this.isLoading.value) return;

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

    // 保存当前选择的附件
    const imagesToSend = this.attachmentHandler.getSelectedImages();
    const audioToSend = this.attachmentHandler.getSelectedAudio();
    
    await this.addMessage('user', message, imagesToSend, audioToSend);
    this.textarea.value = '';
    this.attachmentHandler.clearAttachments();

    const assistantMessageId = await this.addMessage('assistant', '');
    const assistantElement = this.messagesContainer.querySelector(`[data-message-id="${assistantMessageId}"]`) as HTMLElement;
    const contentElement = assistantElement.querySelector('.gleam-message-content') as HTMLElement;
    
    // 标记消息为流式处理中
    assistantElement.classList.add('gleam-message-streaming');
    MessageHelper.updateMessageStatus(assistantElement, 'streaming');

    try {
      // 构建用户消息，包含图片和音频
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
        audio: audioToSend.length > 0 ? audioToSend : undefined
      };
      let messages: ChatMessage[] = [...this.currentMessages, userMessage];

      // 处理上下文注入
      messages = await this.injectContext(messages, config);

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
        assistantMessageId
      );

      // 更新消息列表
      this.currentMessages.push(userMessage);
      this.currentMessages.push({ 
        role: 'assistant', 
        content: fullContent,
        images: imageUrls.length > 0 ? imageUrls : undefined
      });

      // 标记消息为已完成
      assistantElement.classList.remove('gleam-message-streaming');
      assistantElement.classList.add('gleam-message-completed');
      MessageHelper.updateMessageStatus(assistantElement, 'completed');

      await this.historyHandler.saveCurrentChat(this.currentMessages);
    } catch (error: any) {
      this.onError(error.message || this.plugin.i18n.unknownError);
      // 标记消息为错误状态
      if (assistantElement) {
        assistantElement.classList.remove('gleam-message-streaming');
        assistantElement.classList.add('gleam-message-error');
        MessageHelper.updateMessageStatus(assistantElement, 'error');
      }
    } finally {
      this.isLoading.value = false;
      this.sendButton.disabled = false;
      this.textarea.disabled = false;
      this.textarea.focus();
    }
  }

  /**
   * 注入上下文
   */
  private async injectContext(messages: ChatMessage[], config: any): Promise<ChatMessage[]> {
    if (config.enableContext && !this.hasContextInjected.value) {
      Logger.log('[MessageSendHandler] 上下文注入已启用，开始获取文档内容');
      const documentContent = await this.contextInjector.getCurrentDocumentContent();
      if (documentContent) {
        const contextPrompt = this.contextInjector.buildContextPrompt(documentContent);
        this.hasContextInjected.value = true;
        Logger.log('[MessageSendHandler] 上下文注入成功，消息数量:', messages.length + 1);
        return [
          { role: 'system', content: contextPrompt },
          ...messages
        ];
      } else {
        Logger.warn('[MessageSendHandler] 上下文注入已启用但未获取到文档内容');
      }
    } else if (config.enableContext && this.hasContextInjected.value) {
      Logger.log('[MessageSendHandler] 上下文已在本次对话中注入过，跳过重复注入');
    } else {
      Logger.log('[MessageSendHandler] 上下文注入未启用');
    }
    return messages;
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
    assistantMessageId: string
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
          this.onRegenerate,
          assistantMessageId,
          (imageUrl) => ChatUtils.showImageZoom(imageUrl),
          async (imageUrl) => await ChatUtils.copyImageToClipboard(imageUrl)
        );
        ChatUtils.scrollToBottom(this.messagesContainer);
      }
    );
    
    return { fullContent, imageUrls };
  }
}

