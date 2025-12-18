import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from "react";
import { configReducer, initialConfigState, ConfigState, ConfigAction } from "../reducers/configReducer";

export interface ConfigContextValue {
  state: ConfigState;
  dispatch: Dispatch<ConfigAction>;
}

const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(configReducer, initialConfigState);

  const value: ConfigContextValue = {
    state,
    dispatch,
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfigContext = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfigContext must be used within ConfigProvider");
  }
  return context;
};
