import { ChatMessage } from "../../utils/types";
import { DataStorage } from "../../storage/data";
import { AIMessageService } from "../../services/AIMessageService";
import { ConfigService } from "../../services/ConfigService";
import { MessageHelper } from "../components/messageHelper";
import { ChatUtils } from "../utils/chatUtils";
import { AttachmentHandler } from "./attachmentHandler";
import { HistoryHandler } from "./historyHandler";

/**
 * 消息发送处理器
 */
export class MessageSendHandler {
  constructor(
    private storage: DataStorage,
    private aiMessageService: AIMessageService,
    private configService: ConfigService,
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
    private addMessage: (role: "user" | "assistant", content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>,
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

    try {
      // 验证API配置
      const { apiKey, currentModel, config } = await this.aiMessageService.validateApiConfig();

      this.isLoading.value = true;
      this.sendButton.disabled = true;
      this.textarea.disabled = true;

      // 保存当前选择的附件
      const imagesToSend = this.attachmentHandler.getSelectedImages();
      const audioToSend = this.attachmentHandler.getSelectedAudio();

      await this.addMessage("user", message, imagesToSend, audioToSend);
      this.textarea.value = "";
      this.attachmentHandler.clearAttachments();

      const assistantMessageId = await this.addMessage("assistant", "");
      const assistantElement = this.messagesContainer.querySelector(`[data-message-id="${assistantMessageId}"]`) as HTMLElement;
      const contentElement = assistantElement.querySelector(".gleam-message-content") as HTMLElement;

      // 标记消息为流式处理中
      assistantElement.classList.add("gleam-message-streaming");
      MessageHelper.updateMessageStatus(assistantElement, "streaming");

      try {
        // 构建用户消息，包含图片和音频
        const userMessage: ChatMessage = {
          role: "user",
          content: message,
          images: imagesToSend.length > 0 ? imagesToSend : undefined,
          audio: audioToSend.length > 0 ? audioToSend : undefined
        };
        let messages: ChatMessage[] = [...this.currentMessages, userMessage];

        // 处理上下文注入
        messages = await this.aiMessageService.injectContext(
          messages,
          config,
          this.hasContextInjected,
          "[MessageSendHandler]"
        );

        // 获取模型参数配置
        const currentModelParams = await this.aiMessageService.getModelParameters(currentModel);

        // 构建请求选项
        const requestOptions = this.aiMessageService.buildRequestOptions(
          messages,
          currentModel,
          apiKey,
          currentModelParams
        );

        // 检查当前模型是否支持图片输出
        const currentModelInfo = this.configService.getModelInfo(currentModel);
        const supportsImageOutput = currentModelInfo?.outputModalities?.includes("image") || false;

        // 执行 AI 请求
        const { fullContent, imageUrls } = await this.aiMessageService.executeStreamingRequest(
          config.currentProvider,
          requestOptions,
          contentElement,
          supportsImageOutput,
          assistantMessageId,
          this.messagesContainer,
          async (text) => await ChatUtils.copyToClipboard(text),
          this.onRegenerate,
          (imageUrl) => ChatUtils.showImageZoom(imageUrl),
          async (imageUrl) => await ChatUtils.copyImageToClipboard(imageUrl)
        );

        // 更新消息列表
        this.currentMessages.push(userMessage);
        this.currentMessages.push({
          role: "assistant",
          content: fullContent,
          images: imageUrls.length > 0 ? imageUrls : undefined
        });

        // 标记消息为已完成
        assistantElement.classList.remove("gleam-message-streaming");
        assistantElement.classList.add("gleam-message-completed");
        MessageHelper.updateMessageStatus(assistantElement, "completed");

        await this.historyHandler.saveCurrentChat(this.currentMessages);
      } catch (error: any) {
        this.onError(error.message || this.plugin.i18n.unknownError);
        // 标记消息为错误状态
        if (assistantElement) {
          assistantElement.classList.remove("gleam-message-streaming");
          assistantElement.classList.add("gleam-message-error");
          MessageHelper.updateMessageStatus(assistantElement, "error");
        }
      } finally {
        this.isLoading.value = false;
        this.sendButton.disabled = false;
        this.textarea.disabled = false;
        this.textarea.focus();
      }
    } catch (error: any) {
      this.onError(error.message || this.plugin.i18n.unknownError);
    }
  }
}

