import { ChatMessage } from "../../utils/types";
import { DataStorage } from "../../storage/data";
import { AIMessageService } from "../../services/AIMessageService";
import { ConfigService } from "../../services/ConfigService";
import { Logger } from "../../utils/logger";
import { MessageHelper } from "../components/messageHelper";
import { ChatUtils } from "../utils/chatUtils";
import { HistoryHandler } from "./historyHandler";

/**
 * 重新生成处理器
 */
export class RegenerateHandler {
  constructor(
    private storage: DataStorage,
    private aiMessageService: AIMessageService,
    private configService: ConfigService,
    private historyHandler: HistoryHandler,
    private plugin: any,
    private messagesContainer: HTMLElement,
    private sendButton: HTMLButtonElement,
    private textarea: HTMLTextAreaElement,
    private currentMessages: ChatMessage[],
    private hasContextInjected: { value: boolean },
    private isLoading: { value: boolean },
    private onError: (message: string) => void,
    private addMessage: (role: "user" | "assistant", content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>
  ) {}

  /**
   * 处理重新生成请求
   */
  async handleRegenerate(messageId: string): Promise<void> {
    if (this.isLoading.value) return;

    // 找到对应的助手消息元素
    const assistantElement = this.messagesContainer.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement;
    if (!assistantElement || !assistantElement.classList.contains("gleam-message-assistant")) {
      return;
    }

    // 找到最后一条用户消息（应该是当前助手消息的前一条）
    const allMessages = Array.from(this.messagesContainer.querySelectorAll(".gleam-message"));
    const currentIndex = allMessages.indexOf(assistantElement);
    if (currentIndex <= 0) {
      this.onError("无法找到对应的用户消息");
      return;
    }

    // 从currentMessages中删除当前的助手回复（最后一条消息应该是助手消息）
    if (this.currentMessages.length > 0 && this.currentMessages[this.currentMessages.length - 1].role === "assistant") {
      this.currentMessages.pop();
    }

    // 从DOM中删除当前的助手消息
    assistantElement.remove();

    try {
      // 验证API配置
      const { apiKey, currentModel, config } = await this.aiMessageService.validateApiConfig();

      this.isLoading.value = true;
      this.sendButton.disabled = true;
      this.textarea.disabled = true;

      // 创建新的助手消息
      const newAssistantMessageId = await this.addMessage("assistant", "");
      const newAssistantElement = this.messagesContainer.querySelector(`[data-message-id="${newAssistantMessageId}"]`) as HTMLElement;
      const contentElement = newAssistantElement.querySelector(".gleam-message-content") as HTMLElement;

      // 标记消息为流式处理中
      newAssistantElement.classList.add("gleam-message-streaming");
      MessageHelper.updateMessageStatus(newAssistantElement, "streaming");

      try {
        // 构建消息列表（包含上下文和所有历史消息）
        let messages: ChatMessage[] = [...this.currentMessages];

        this.logMessageInfo(messages);

        // 注入上下文
        messages = await this.aiMessageService.injectContext(
          messages,
          config,
          this.hasContextInjected,
          "[RegenerateHandler]"
        );

        this.validateMessageImages(messages);

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
          newAssistantMessageId,
          this.messagesContainer,
          async (text) => await ChatUtils.copyToClipboard(text),
          async (id) => await this.handleRegenerate(id),
          (imageUrl) => ChatUtils.showImageZoom(imageUrl),
          async (imageUrl) => await ChatUtils.copyImageToClipboard(imageUrl)
        );

        this.currentMessages.push({
          role: "assistant",
          content: fullContent,
          images: imageUrls.length > 0 ? imageUrls : undefined
        });
        newAssistantElement.classList.remove("gleam-message-streaming");
        newAssistantElement.classList.add("gleam-message-completed");
        MessageHelper.updateMessageStatus(newAssistantElement, "completed");

        await this.historyHandler.saveCurrentChat(this.currentMessages);
      } catch (error: any) {
        this.onError(error.message || this.plugin.i18n.unknownError);
        // 标记消息为错误状态
        if (newAssistantElement) {
          newAssistantElement.classList.remove("gleam-message-streaming");
          newAssistantElement.classList.add("gleam-message-error");
          MessageHelper.updateMessageStatus(newAssistantElement, "error");
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

  /**
   * 记录消息信息（用于调试）
   */
  private logMessageInfo(messages: ChatMessage[]): void {
    Logger.log("[RegenerateHandler] 重新生成 - 消息列表:", messages.map(m => ({
      role: m.role,
      hasContent: !!m.content,
      hasImages: !!(m.images && m.images.length > 0),
      imageCount: m.images?.length || 0,
      hasAudio: !!(m.audio && m.audio.length > 0)
    })));
    const lastUserMessage = messages.filter(m => m.role === "user").pop();
    if (lastUserMessage?.images?.length) {
      Logger.log("[RegenerateHandler] 重新生成 - 最后一条用户消息包含图片，数量:", lastUserMessage.images.length);
    } else {
      Logger.warn("[RegenerateHandler] 重新生成 - 最后一条用户消息不包含图片");
    }
  }

  /**
   * 验证消息中的图片数据
   */
  private validateMessageImages(messages: ChatMessage[]): void {
    const messagesWithImages = messages.filter(m => m.images && m.images.length > 0);
    if (messagesWithImages.length > 0) {
      Logger.log("[RegenerateHandler] 重新生成 - 消息中包含图片，数量:", messagesWithImages.length);
      messagesWithImages.forEach((msg, idx) => {
        Logger.log(`[RegenerateHandler] 消息 ${idx} (role: ${msg.role}) 包含 ${msg.images?.length || 0} 张图片`);
      });
    } else {
      Logger.warn("[RegenerateHandler] 重新生成 - 消息中不包含图片");
    }
  }
}

