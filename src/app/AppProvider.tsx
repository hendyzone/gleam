import React, { ReactNode } from "react";
import { MountOptions } from "./mount";
import { AppProvider as AppContextProvider } from "../contexts/AppContext";
import { ChatProvider } from "../contexts/ChatContext";
import { ConfigProvider } from "../contexts/ConfigContext";
import { HistoryProvider } from "../contexts/HistoryContext";
import { UIProvider } from "../contexts/UIContext";

// Phase 2: Nest all Context providers
export const AppProvider: React.FC<MountOptions & { children: ReactNode }> = ({
  plugin,
  storage,
  providers,
  contextInjector,
  i18n,
  children
}) => {
  return (
    <AppContextProvider
      plugin={plugin}
      storage={storage}
      providers={providers}
      contextInjector={contextInjector}
      i18n={i18n}
    >
      <ConfigProvider>
        <ChatProvider>
          <HistoryProvider>
            <UIProvider>
              {children}
            </UIProvider>
          </HistoryProvider>
        </ChatProvider>
      </ConfigProvider>
    </AppContextProvider>
  );
};
