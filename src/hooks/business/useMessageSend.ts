import { useAppContext } from "../../contexts/AppContext";
import { useChatContext } from "../../contexts/ChatContext";
import { useConfigContext } from "../../contexts/ConfigContext";
import { useUIContext } from "../../contexts/UIContext";
import { ChatMessage, AIRequestOptions } from "../../utils/types";
import { Logger } from "../../utils/logger";

export const useMessageSend = () => {
  const { providers, contextInjector, storage } = useAppContext();
  const { state: chatState, dispatch: chatDispatch } = useChatContext();
  const { state: configState } = useConfigContext();
  const { state: uiState, dispatch: uiDispatch } = useUIContext();

  const sendMessage = async (content: string): Promise<void> => {
    try {
      // 1. Validate configuration
      const config = await storage.getConfig();
      if (!config.openrouter?.apiKey) {
        uiDispatch({
          type: "ADD_NOTIFICATION",
          payload: { type: "error", message: "API key is required" },
        });
        return;
      }

      // 2. Set loading state
      chatDispatch({ type: "SET_LOADING", payload: true });

      // 3. Get attachments
      const images = uiState.attachments.images;
      const audio = uiState.attachments.audio;

      // 4. Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString() + Math.random(),
        role: "user",
        content,
        images: images.length > 0 ? images : undefined,
        audio: audio.length > 0 ? audio : undefined,
      };
      chatDispatch({ type: "ADD_MESSAGE", payload: userMessage });

      // 5. Clear attachments
      uiDispatch({ type: "CLEAR_ATTACHMENTS" });

      // 6. Create assistant message placeholder
      const assistantMessageId = Date.now().toString() + Math.random() + 1;
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
      };
      chatDispatch({ type: "ADD_MESSAGE", payload: assistantMessage });
      chatDispatch({ type: "SET_STREAMING_MESSAGE", payload: assistantMessageId });

      // 7. Inject context if enabled
      let messagesToSend = [...chatState.messages, userMessage];
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

      // 8. Build request options
      const provider = providers.get("openrouter");
      if (!provider) {
        throw new Error("Provider not found");
      }

      const requestOptions: AIRequestOptions = {
        apiKey: config.openrouter.apiKey,
        baseURL: config.openrouter.baseURL,
        model: configState.currentModel || config.currentModel,
        messages: messagesToSend,
        parameters: configState.modelParameters[configState.currentModel] || {},
      };

      // 9. Execute streaming request
      let accumulatedContent = "";
      await provider.chat(requestOptions, (chunk: string) => {
        accumulatedContent += chunk;
        chatDispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            id: assistantMessageId,
            content: accumulatedContent,
          },
        });
      });

      // 10. Mark streaming complete
      chatDispatch({ type: "SET_STREAMING_MESSAGE", payload: null });
      chatDispatch({ type: "SET_LOADING", payload: false });

      // 11. Save chat history
      const updatedMessages = [...messagesToSend, { ...assistantMessage, content: accumulatedContent }];
      const history = await storage.getHistory();
      const currentHistory = {
        id: Date.now().toString(),
        title: content.substring(0, 50),
        messages: updatedMessages,
        timestamp: Date.now(),
      };
      await storage.saveHistory([currentHistory, ...history]);

    } catch (error: any) {
      Logger.error("Message send failed:", error);

      chatDispatch({ type: "SET_STREAMING_MESSAGE", payload: null });
      chatDispatch({ type: "SET_LOADING", payload: false });

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: error.message || "Failed to send message",
        },
      });
    }
  };

  return {
    sendMessage,
    isLoading: chatState.isLoading,
  };
};
