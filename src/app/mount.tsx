import React from "react";
import { createRoot, Root } from "react-dom/client";
import App from "./App";
import { AppProvider } from "./AppProvider";
import { DataStorage } from "../storage/data";
import { AIProvider } from "../api/base";
import { ContextInjector } from "../features/context-injection";

export interface MountOptions {
  plugin: any;
  storage: DataStorage;
  providers: Map<string, AIProvider>;
  contextInjector: ContextInjector;
  i18n: any;
}

export function mountReactApp(container: HTMLElement, options: MountOptions): Root {
  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <AppProvider {...options}>
        <App />
      </AppProvider>
    </React.StrictMode>
  );

  return root;
}

export function unmountReactApp(root: Root): void {
  root.unmount();
}
