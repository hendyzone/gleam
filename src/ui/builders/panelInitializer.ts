import { ConfigHandler } from '../handlers/configHandler';
import { AttachmentHandler } from '../handlers/attachmentHandler';
import { HistoryHandler } from '../handlers/historyHandler';
import { MessageSendHandler } from '../handlers/messageSendHandler';
import { RegenerateHandler } from '../handlers/regenerateHandler';
import { ConfigManager } from '../managers/configManager';
import { StateManager } from '../managers/stateManager';
import { ParametersManager } from '../managers/parametersManager';
import { ChatManager } from '../managers/chatManager';
import { DataStorage } from '../../storage/data';
import { ContextInjector } from '../../features/context-injection';
import { AIProvider } from '../../api/base';
import { ChatMessage } from '../../utils/types';
import { ModelDialog } from '../components/modelDialog';
import { ParametersPanel } from '../components/parametersPanel';

/**
 * 面板初始化器
 */
export class PanelInitializer {
  /**
   * 初始化所有处理器和管理器
   */
  static initializeHandlers(
    storage: DataStorage,
    contextInjector: ContextInjector,
    providers: Map<string, AIProvider>,
    plugin: any,
    allModels: string[],
    allModelsInfo: any[],
    imagePreviewContainer: HTMLElement,
    historyPanel: HTMLElement,
    messagesContainer: HTMLElement,
    textarea: HTMLTextAreaElement,
    sendButton: HTMLButtonElement,
    modelSelect: HTMLSelectElement,
    modelButton: HTMLButtonElement,
    contextToggle: HTMLInputElement,
    currentMessages: ChatMessage[],
    hasContextInjected: { value: boolean },
    isLoading: { value: boolean },
    modelDialog: ModelDialog,
    parametersPanel: ParametersPanel,
    onError: (message: string) => void,
    onAddMessage: (role: 'user' | 'assistant', content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>,
    onRegenerate: (messageId: string) => Promise<void>
  ): {
    configHandler: ConfigHandler;
    attachmentHandler: AttachmentHandler;
    historyHandler: HistoryHandler;
    messageSendHandler: MessageSendHandler;
    regenerateHandler: RegenerateHandler;
    configManager: ConfigManager;
    stateManager: StateManager;
    parametersManager: ParametersManager;
    chatManager: ChatManager;
  } {
    const configHandler = new ConfigHandler(
      storage,
      providers,
      plugin,
      allModels,
      allModelsInfo
    );
    
    const attachmentHandler = new AttachmentHandler(
      imagePreviewContainer,
      onError
    );
    
    const historyHandler = new HistoryHandler(
      storage,
      historyPanel,
      plugin
    );
    
    const stateManager = new StateManager(
      messagesContainer,
      plugin
    );
    
    const configManager = new ConfigManager(
      storage,
      configHandler,
      modelSelect,
      modelButton,
      contextToggle,
      plugin,
      onError
    );
    configManager.setModelDialog(modelDialog);
    
    const parametersManager = new ParametersManager(
      storage,
      configHandler,
      parametersPanel
    );
    
    const messageSendHandler = new MessageSendHandler(
      storage,
      contextInjector,
      providers,
      configHandler,
      attachmentHandler,
      historyHandler,
      plugin,
      messagesContainer,
      textarea,
      sendButton,
      currentMessages,
      hasContextInjected,
      isLoading,
      onError,
      onAddMessage,
      onRegenerate
    );
    
    const regenerateHandler = new RegenerateHandler(
      storage,
      contextInjector,
      providers,
      configHandler,
      historyHandler,
      plugin,
      messagesContainer,
      sendButton,
      textarea,
      currentMessages,
      hasContextInjected,
      isLoading,
      onError,
      onAddMessage
    );
    
    const chatManager = new ChatManager(
      storage,
      historyHandler,
      attachmentHandler,
      configManager,
      configHandler,
      stateManager,
      messagesContainer,
      modelSelect,
      currentMessages,
      hasContextInjected,
      onAddMessage
    );
    
    return {
      configHandler,
      attachmentHandler,
      historyHandler,
      messageSendHandler,
      regenerateHandler,
      configManager,
      stateManager,
      parametersManager,
      chatManager
    };
  }
}

