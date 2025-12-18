import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { uiReducer, initialUIState, UIState, UIAction } from "../reducers/uiReducer";

export interface UIContextValue {
  state: UIState;
  dispatch: Dispatch<UIAction>;
}

const UIContext = createContext<UIContextValue | undefined>(undefined);

export interface UIProviderProps {
  children: ReactNode;
}

export const UIProvider: React.FC<UIProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(uiReducer, initialUIState);

  const value: UIContextValue = {
    state,
    dispatch,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUIContext = (): UIContextValue => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUIContext must be used within UIProvider");
  }
  return context;
};
