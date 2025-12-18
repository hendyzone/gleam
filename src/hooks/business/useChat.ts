import { useChatContext } from "../../contexts/ChatContext";
import { ChatMessage } from "../../utils/types";

export const useChat = () => {
  const { state, dispatch } = useChatContext();

  const addMessage = (
    role: "user" | "assistant",
    content: string,
    images?: string[],
    audio?: Array<{ data: string; format: string }>
  ): string => {
    const message: ChatMessage = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      images,
      audio,
    };

    dispatch({
      type: "ADD_MESSAGE",
      payload: message,
    });

    return message.id;
  };

  const updateMessage = (id: string, content: string, images?: string[]) => {
    dispatch({
      type: "UPDATE_MESSAGE",
      payload: { id, content, images },
    });
  };

  const clearMessages = () => {
    dispatch({ type: "CLEAR_MESSAGES" });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: "SET_LOADING", payload: loading });
  };

  const setStreamingMessage = (messageId: string | null) => {
    dispatch({ type: "SET_STREAMING_MESSAGE", payload: messageId });
  };

  return {
    messages: state.messages,
    isLoading: state.isLoading,
    hasContextInjected: state.hasContextInjected,
    streamingMessageId: state.streamingMessageId,
    addMessage,
    updateMessage,
    clearMessages,
    setLoading,
    setStreamingMessage,
  };
};
