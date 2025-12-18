import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { chatReducer, initialChatState, ChatState, ChatAction } from "../reducers/chatReducer";

export interface ChatContextValue {
  state: ChatState;
  dispatch: Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);

  const value: ChatContextValue = {
    state,
    dispatch,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = (): ChatContextValue => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
};
