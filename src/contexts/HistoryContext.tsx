import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { historyReducer, initialHistoryState, HistoryState, HistoryAction } from "../reducers/historyReducer";

export interface HistoryContextValue {
  state: HistoryState;
  dispatch: Dispatch<HistoryAction>;
}

const HistoryContext = createContext<HistoryContextValue | undefined>(undefined);

export interface HistoryProviderProps {
  children: ReactNode;
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(historyReducer, initialHistoryState);

  const value: HistoryContextValue = {
    state,
    dispatch,
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};

export const useHistoryContext = (): HistoryContextValue => {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error("useHistoryContext must be used within HistoryProvider");
  }
  return context;
};
