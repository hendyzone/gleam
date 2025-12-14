import { ConfigHandler } from '../handlers/configHandler';
import { AttachmentHandler } from '../handlers/attachmentHandler';
import { DataStorage } from '../../storage/data';
import { ModelInfo } from '../../utils/types';

/**
 * 事件管理器
 */
export class EventManager {
  constructor(
    private element: HTMLElement,
    private textarea: HTMLTextAreaElement,
    private sendButton: HTMLButtonElement,
    private imageInput: HTMLInputElement,
    private imageButton: HTMLButtonElement,
    private modelButton: HTMLButtonElement,
    private modelSelect: HTMLSelectElement,
    private contextToggle: HTMLInputElement,
    private historyButton: HTMLButtonElement,
    private newChatButton: HTMLButtonElement,
    private parametersButton: HTMLButtonElement,
    private exportButton: HTMLButtonElement,
    private storage: DataStorage,
    private configHandler: ConfigHandler,
    private attachmentHandler: AttachmentHandler,
    private plugin: any,
    private onSend: () => Promise<void>,
    private onModelDialog: () => Promise<void>,
    private onModelSelectChange: () => Promise<void> | void,
    private onContextToggleChange: () => Promise<void> | void,
    private onHistoryToggle: () => void,
    private onNewChat: () => Promise<void>,
    private onParametersPanel: () => Promise<void>,
    private onExport: () => Promise<void>,
    private onError: (message: string) => void
  ) {}

  /**
   * 附加所有事件监听器
   */
  attachAll(): void {
    this.attachSendEvents();
    this.attachPasteEvents();
    this.attachFileEvents();
    this.attachModelEvents();
    this.attachControlEvents();
  }

  /**
   * 附加发送相关事件
   */
  private attachSendEvents(): void {
    this.sendButton.addEventListener('click', () => this.onSend());
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.onSend();
      }
    });
  }

  /**
   * 附加粘贴事件
   */
  private attachPasteEvents(): void {
    this.textarea.addEventListener('paste', async (e) => {
      const config = await this.storage.getConfig();
      const currentModelInfo = this.configHandler.getModelInfo(config.currentModel);
      const supportedInputTypes = currentModelInfo?.inputModalities || ['text'];
      await this.attachmentHandler.handlePaste(e as ClipboardEvent, supportedInputTypes);
    });
  }

  /**
   * 附加文件选择事件
   */
  private attachFileEvents(): void {
    this.imageButton.addEventListener('click', () => {
      this.imageInput.click();
    });
    
    this.imageInput.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      const files = input.files;
      if (!files || files.length === 0) return;

      // 检查当前模型是否支持文件类型
      const config = await this.storage.getConfig();
      const currentModelInfo = this.configHandler.getModelInfo(config.currentModel);
      const supportedInputTypes = currentModelInfo?.inputModalities || ['text'];

      await this.attachmentHandler.handleFileSelect(files, supportedInputTypes);
      
      // 清空 input，允许重复选择同一文件
      input.value = '';
    });
  }

  /**
   * 附加模型相关事件
   */
  private attachModelEvents(): void {
    this.modelButton.addEventListener('click', () => {
      this.onModelDialog();
    });
    
    this.modelSelect.addEventListener('change', () => {
      this.onModelSelectChange();
    });
  }

  /**
   * 附加控制按钮事件
   */
  private attachControlEvents(): void {
    this.contextToggle.addEventListener('change', () => {
      this.onContextToggleChange();
    });
    
    this.historyButton.addEventListener('click', () => {
      this.onHistoryToggle();
    });
    
    this.newChatButton.addEventListener('click', () => {
      this.onNewChat();
    });
    
    this.parametersButton.addEventListener('click', () => {
      this.onParametersPanel();
    });
    
    this.exportButton.addEventListener('click', () => {
      this.onExport();
    });
  }
}

