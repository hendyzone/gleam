import { ChatMessage } from "../utils/types";

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  hasContextInjected: boolean;
  streamingMessageId: string | null;
}

export type ChatAction =
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | { type: "UPDATE_MESSAGE"; payload: { id: string; content: string; images?: string[] } }
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "CLEAR_MESSAGES" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_CONTEXT_INJECTED"; payload: boolean }
  | { type: "SET_STREAMING_MESSAGE"; payload: string | null }
  | { type: "DELETE_MESSAGE"; payload: string };

export const initialChatState: ChatState = {
  messages: [],
  isLoading: false,
  hasContextInjected: false,
  streamingMessageId: null,
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case "UPDATE_MESSAGE":
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? {
                ...msg,
                content: action.payload.content,
                images: action.payload.images ?? msg.images,
              }
            : msg
        ),
      };

    case "SET_MESSAGES":
      return {
        ...state,
        messages: action.payload,
      };

    case "CLEAR_MESSAGES":
      return {
        ...state,
        messages: [],
        hasContextInjected: false,
        streamingMessageId: null,
      };

    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.payload,
      };

    case "SET_CONTEXT_INJECTED":
      return {
        ...state,
        hasContextInjected: action.payload,
      };

    case "SET_STREAMING_MESSAGE":
      return {
        ...state,
        streamingMessageId: action.payload,
      };

    case "DELETE_MESSAGE":
      return {
        ...state,
        messages: state.messages.filter((msg) => msg.id !== action.payload),
      };

    default:
      return state;
  }
}
