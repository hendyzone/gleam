import { ChatMessage, ModelInfo, ModelParameters } from '../utils/types';
import { DataStorage } from '../storage/data';
import { ContextInjector } from '../features/context-injection';
import { OpenRouterProvider } from '../api/openrouter';
import { AIProvider } from '../api/base';
import { Logger } from '../utils/logger';
import { MarkdownRenderer } from './utils/markdown';
import { MessageRenderer } from './components/messageRenderer';
import { ModelDialog } from './components/modelDialog';
import { ParametersPanel } from './components/parametersPanel';
import { ConfigHandler } from './handlers/configHandler';
import { AttachmentHandler } from './handlers/attachmentHandler';
import { HistoryHandler } from './handlers/historyHandler';
import { MessageSendHandler } from './handlers/messageSendHandler';
import { RegenerateHandler } from './handlers/regenerateHandler';
import { MessageHelper } from './components/messageHelper';
import { ChatUtils } from './utils/chatUtils';
import { UIBuilder } from './builders/uiBuilder';
import { EventManager } from './managers/eventManager';
import { ConfigManager } from './managers/configManager';
import { StateManager } from './managers/stateManager';
import { ParametersManager } from './managers/parametersManager';
import { ChatManager } from './managers/chatManager';
import { PanelInitializer } from './builders/panelInitializer';

export class ChatPanel {
  private element: HTMLElement;
  private messagesContainer!: HTMLElement;
  private inputArea!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private modelSelect!: HTMLSelectElement;
  private modelButton!: HTMLButtonElement; // 模型选择按钮
  private modelDialog!: ModelDialog; // 模型选择对话框
  private parametersPanel!: ParametersPanel; // 参数配置面板
  private parametersButton!: HTMLButtonElement; // 参数配置按钮
  private contextToggle!: HTMLInputElement;
  private historyButton!: HTMLButtonElement;
  private newChatButton!: HTMLButtonElement;
  private historyPanel!: HTMLElement;
  private imageInput!: HTMLInputElement; // 文件选择输入框
  private imagePreviewContainer!: HTMLElement; // 附件预览容器

  private plugin: any;
  private storage: DataStorage;
  private contextInjector: ContextInjector;
  private providers: Map<string, AIProvider>;
  private currentMessages: ChatMessage[] = [];
  private isLoading = { value: false };
  private hasContextInjected = { value: false }; // 标记是否已经注入过上下文
  
  // 处理器
  private configHandler!: ConfigHandler;
  private attachmentHandler!: AttachmentHandler;
  private historyHandler!: HistoryHandler;
  private messageSendHandler!: MessageSendHandler;
  private regenerateHandler!: RegenerateHandler;
  private eventManager!: EventManager;
  private configManager!: ConfigManager;
  private stateManager!: StateManager;
  private parametersManager!: ParametersManager;
  private chatManager!: ChatManager;
  
  // 模型相关（保留用于兼容）
  private allModels: string[] = [];
  private allModelsInfo: ModelInfo[] = [];

  constructor(plugin: any, element: HTMLElement) {
    this.plugin = plugin;
    this.element = element;
    this.storage = new DataStorage(plugin);
    this.contextInjector = new ContextInjector(plugin);
    this.providers = new Map<string, AIProvider>([
      ['openrouter', new OpenRouterProvider()]
    ]);

    this.init();
  }

  private async init() {
    this.createUI();
    await this.loadConfig();
    await this.loadHistory();
    this.attachEventListeners();
  }

  private createUI() {
    this.element.innerHTML = UIBuilder.createUI(this.plugin);
    
    // 初始化 UI 元素引用
    const elements = UIBuilder.initializeElements(this.element);
    this.messagesContainer = elements.messagesContainer;
    this.inputArea = elements.inputArea;
    this.textarea = elements.textarea;
    this.sendButton = elements.sendButton;
    this.modelSelect = elements.modelSelect;
    this.modelButton = elements.modelButton;
    this.contextToggle = elements.contextToggle;
    this.historyButton = elements.historyButton;
    this.newChatButton = elements.newChatButton;
    this.parametersButton = elements.parametersButton;
    this.historyPanel = elements.historyPanel;
    this.imageInput = elements.imageInput;
    this.imagePreviewContainer = elements.imagePreviewContainer;
    
    // 创建模型选择对话框和参数配置面板
    this.modelDialog = UIBuilder.createModelDialog(
      this.plugin,
      (modelId: string) => {
        this.modelSelect.value = modelId;
        // 延迟设置，因为 configManager 在后面初始化
        if (this.configManager) {
          this.configManager.updateModelButtonText(modelId);
          this.configManager.saveConfig();
        }
      }
    );
    this.parametersPanel = UIBuilder.createParametersPanel(
      (parameters) => this.handleParametersSave(parameters),
      () => {}
    );
    
    // 初始化所有处理器和管理器
    const handlers = PanelInitializer.initializeHandlers(
      this.storage,
      this.contextInjector,
      this.providers,
      this.plugin,
      this.allModels,
      this.allModelsInfo,
      this.imagePreviewContainer,
      this.historyPanel,
      this.messagesContainer,
      this.textarea,
      this.sendButton,
      this.modelSelect,
      this.modelButton,
      this.contextToggle,
      this.currentMessages,
      this.hasContextInjected,
      this.isLoading,
      this.modelDialog,
      this.parametersPanel,
      (msg) => {
        // 延迟错误处理，因为 stateManager 在初始化中创建
        if (this.stateManager) {
          this.stateManager.showError(msg);
        }
      },
      (role, content, images, audio) => this.addMessage(role, content, images, audio),
      (id) => this.handleRegenerate(id)
    );
    
    this.configHandler = handlers.configHandler;
    this.attachmentHandler = handlers.attachmentHandler;
    this.historyHandler = handlers.historyHandler;
    this.messageSendHandler = handlers.messageSendHandler;
    this.regenerateHandler = handlers.regenerateHandler;
    this.configManager = handlers.configManager;
    this.stateManager = handlers.stateManager;
    this.parametersManager = handlers.parametersManager;
    this.chatManager = handlers.chatManager;
    
    // 更新模型对话框引用
    this.configManager.setModelDialog(this.modelDialog);
    
    this.stateManager.updateEmptyState(this.currentMessages);
  }

  private async loadConfig() {
    await this.configManager.loadConfig();
  }

  private async showModelDialog() {
    await this.configManager.showModelDialog();
  }

  private updateModelButtonText(value: string) {
    this.configManager.updateModelButtonText(value);
  }

  private async loadHistory() {
    const hasHistory = await this.historyHandler.hasHistory();
    if (!hasHistory) {
      this.showNoMessages();
    }
  }

  private showNoMessages() {
    this.stateManager.updateEmptyState(this.currentMessages);
  }

  private attachEventListeners() {
    const imageButton = this.element.querySelector('#gleam-image-button') as HTMLButtonElement;
    
    this.eventManager = new EventManager(
      this.element,
      this.textarea,
      this.sendButton,
      this.imageInput,
      imageButton,
      this.modelButton,
      this.modelSelect,
      this.contextToggle,
      this.historyButton,
      this.newChatButton,
      this.parametersButton,
      this.storage,
      this.configHandler,
      this.attachmentHandler,
      this.plugin,
      () => this.messageSendHandler.handleSend(),
      () => this.configManager.showModelDialog(),
      async () => {
        this.configManager.updateModelButtonText(this.modelSelect.value);
        await this.configManager.saveConfig();
      },
      async () => await this.configManager.saveConfig(),
      () => this.chatManager.toggleHistory(),
      () => this.chatManager.newChat(),
      () => this.showParametersPanel(),
      (msg) => this.stateManager.showError(msg)
    );
    
    this.eventManager.attachAll();
  }

  private async showParametersPanel() {
    await this.parametersManager.showParametersPanel();
  }

  private async handleParametersSave(parameters: ModelParameters) {
    await this.parametersManager.handleParametersSave(parameters);
  }

  private async handleSend() {
    await this.messageSendHandler.handleSend();
  }

  private async addMessage(
    role: 'user' | 'assistant', 
    content: string, 
    images?: string[], 
    audio?: Array<{ data: string; format: string }>
  ): Promise<string> {
    if (this.messagesContainer.querySelector('.gleam-empty-state')) {
      this.messagesContainer.innerHTML = '';
    }
    
    return await MessageHelper.addMessage(
      this.messagesContainer,
      role,
      content,
      images,
      audio,
      undefined,
      this.plugin,
      async (text) => await ChatUtils.copyToClipboard(text),
      async (id) => await this.handleRegenerate(id),
      (imageUrl) => ChatUtils.showImageZoom(imageUrl),
      async (imageUrl) => await ChatUtils.copyImageToClipboard(imageUrl),
      this.storage,
      this.configHandler
    );
  }



  private async handleRegenerate(messageId: string) {
    await this.regenerateHandler.handleRegenerate(messageId);
  }

  private toggleHistory() {
    this.chatManager.toggleHistory();
  }

  async newChat() {
    await this.chatManager.newChat();
  }
}

