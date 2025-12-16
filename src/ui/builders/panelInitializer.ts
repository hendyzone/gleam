import { AttachmentHandler } from "../handlers/attachmentHandler";
import { HistoryHandler } from "../handlers/historyHandler";
import { MessageSendHandler } from "../handlers/messageSendHandler";
import { RegenerateHandler } from "../handlers/regenerateHandler";
import { StateManager } from "../managers/stateManager";
import { ParametersManager } from "../managers/parametersManager";
import { ChatManager } from "../managers/chatManager";
import { DataStorage } from "../../storage/data";
import { ContextInjector } from "../../features/context-injection";
import { AIProvider } from "../../api/base";
import { AIMessageService } from "../../services/AIMessageService";
import { ConfigService } from "../../services/ConfigService";
import { ChatMessage } from "../../utils/types";
import { ModelDialog } from "../components/modelDialog";
import { ParametersPanel } from "../components/parametersPanel";

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
    onAddMessage: (role: "user" | "assistant", content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>,
    onRegenerate: (messageId: string) => Promise<void>
  ): {
    configService: ConfigService;
    attachmentHandler: AttachmentHandler;
    historyHandler: HistoryHandler;
    messageSendHandler: MessageSendHandler;
    regenerateHandler: RegenerateHandler;
    stateManager: StateManager;
    parametersManager: ParametersManager;
    chatManager: ChatManager;
  } {
    // 创建 AIMessageService（统一的AI请求服务）
    const aiMessageService = new AIMessageService(
      storage,
      contextInjector,
      providers,
      plugin
    );

    // 创建 ConfigService（统一的配置服务）
    const configService = new ConfigService(
      storage,
      providers,
      plugin,
      allModels,
      allModelsInfo
    );
    configService.setModelDialog(modelDialog);

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

    const parametersManager = new ParametersManager(
      storage,
      configService,
      parametersPanel
    );

    const messageSendHandler = new MessageSendHandler(
      storage,
      aiMessageService,
      configService,
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
      aiMessageService,
      configService,
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
      configService,
      stateManager,
      messagesContainer,
      modelSelect,
      currentMessages,
      hasContextInjected,
      onAddMessage
    );

    return {
      configService,
      attachmentHandler,
      historyHandler,
      messageSendHandler,
      regenerateHandler,
      stateManager,
      parametersManager,
      chatManager
    };
  }
}

