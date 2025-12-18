import { useAppContext } from "../../contexts/AppContext";
import { useChatContext } from "../../contexts/ChatContext";
import { useConfigContext } from "../../contexts/ConfigContext";
import { useUIContext } from "../../contexts/UIContext";
import { ChatMessage } from "../../utils/types";
import { Logger } from "../../utils/logger";

export const useMessageRegenerate = () => {
  const { providers, contextInjector, storage } = useAppContext();
  const { state: chatState, dispatch: chatDispatch } = useChatContext();
  const { state: configState } = useConfigContext();
  const { dispatch: uiDispatch } = useUIContext();

  /**
   * 重新生成指定的助手消息
   */
  const regenerateMessage = async (messageId: string): Promise<void> => {
    if (chatState.isLoading) {
      Logger.warn("Already loading, cannot regenerate");
      return;
    }

    try {
      // 找到要重新生成的消息
      const messageIndex = chatState.messages.findIndex((m) => m.id === messageId);
      if (messageIndex === -1) {
        Logger.error("Message not found:", messageId);
        return;
      }

      const message = chatState.messages[messageIndex];
      if (message.role !== "assistant") {
        Logger.error("Can only regenerate assistant messages");
        return;
      }

      // 删除该消息及其后的所有消息
      const messagesToKeep = chatState.messages.slice(0, messageIndex);
      chatDispatch({ type: "SET_MESSAGES", payload: messagesToKeep });

      // 验证配置
      const config = await storage.getConfig();
      if (!config.openrouter?.apiKey) {
        uiDispatch({
          type: "ADD_NOTIFICATION",
          payload: { type: "error", message: "API key is required" }
        });
        return;
      }

      // 设置加载状态
      chatDispatch({ type: "SET_LOADING", payload: true });

      // 创建新的助手消息占位符
      const assistantMessageId = Date.now().toString() + Math.random() + 1;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: ""
      };
      chatDispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
      chatDispatch({ type: "SET_STREAMING_MESSAGE", payload: assistantMessageId });

      // 准备消息列表（包含上下文注入）
      let messagesToSend = [...messagesToKeep];

      // 如果启用了上下文且未注入，则注入
      if (configState.enableContext && !chatState.hasContextInjected) {
        try {
          const contextMessage = await contextInjector.injectContext();
          if (contextMessage) {
            messagesToSend = [contextMessage, ...messagesToSend];
            chatDispatch({ type: "SET_CONTEXT_INJECTED", payload: true });
          }
        } catch (error) {
          Logger.error("Context injection failed:", error);
        }
      }

      // 构建请求选项
      const provider = providers.get("openrouter");
      if (!provider) {
        throw new Error("Provider not found");
      }

      const requestOptions = {
        apiKey: config.openrouter.apiKey,
        baseURL: config.openrouter.baseURL,
        model: configState.currentModel || config.currentModel,
        messages: messagesToSend,
        parameters: configState.modelParameters[configState.currentModel] || {}
      };

      // 执行流式请求
      let accumulatedContent = "";
      await provider.chat(requestOptions, (chunk: string) => {
        accumulatedContent += chunk;
        chatDispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            id: assistantMessageId,
            content: accumulatedContent
          }
        });
      });

      // 标记流式完成
      chatDispatch({ type: "SET_STREAMING_MESSAGE", payload: null });
      chatDispatch({ type: "SET_LOADING", payload: false });

      // 保存聊天历史
      const updatedMessages = [...messagesToSend, { ...assistantMessage, content: accumulatedContent }];
      const history = await storage.getHistory();
      const currentHistory = {
        id: Date.now().toString(),
        title: messagesToKeep.find((m) => m.role === "user")?.content?.substring(0, 50) || "Regenerated Chat",
        messages: updatedMessages,
        timestamp: Date.now()
      };
      await storage.saveHistory([currentHistory, ...history]);

      Logger.log("Message regenerated successfully");
    } catch (error: any) {
      Logger.error("Message regeneration failed:", error);

      chatDispatch({ type: "SET_STREAMING_MESSAGE", payload: null });
      chatDispatch({ type: "SET_LOADING", payload: false });

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: error.message || "Failed to regenerate message"
        }
      });
    }
  };

  return {
    regenerateMessage,
    isLoading: chatState.isLoading
  };
};
