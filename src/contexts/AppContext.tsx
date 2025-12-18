import React, { createContext, useContext, ReactNode } from "react";
import { DataStorage } from "../storage/data";
import { AIProvider } from "../api/base";
import { ContextInjector } from "../features/context-injection";

export interface AppContextValue {
  plugin: any;
  storage: DataStorage;
  providers: Map<string, AIProvider>;
  contextInjector: ContextInjector;
  i18n: any;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export interface AppProviderProps {
  plugin: any;
  storage: DataStorage;
  providers: Map<string, AIProvider>;
  contextInjector: ContextInjector;
  i18n: any;
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({
  plugin,
  storage,
  providers,
  contextInjector,
  i18n,
  children,
}) => {
  const value: AppContextValue = {
    plugin,
    storage,
    providers,
    contextInjector,
    i18n,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
