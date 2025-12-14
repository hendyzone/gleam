import { ChatMessage } from '../../utils/types';
import { HistoryHandler } from '../handlers/historyHandler';
import { AttachmentHandler } from '../handlers/attachmentHandler';
import { ConfigManager } from './configManager';
import { StateManager } from './stateManager';
import { ConfigHandler } from '../handlers/configHandler';
import { DataStorage } from '../../storage/data';
import { Logger } from '../../utils/logger';

/**
 * 聊天管理器
 */
export class ChatManager {
  constructor(
    private storage: DataStorage,
    private historyHandler: HistoryHandler,
    private attachmentHandler: AttachmentHandler,
    private configManager: ConfigManager,
    private configHandler: ConfigHandler,
    private stateManager: StateManager,
    private messagesContainer: HTMLElement,
    private modelSelect: HTMLSelectElement,
    private currentMessages: ChatMessage[],
    private hasContextInjected: { value: boolean },
    private addMessage: (role: 'user' | 'assistant', content: string, images?: string[], audio?: Array<{ data: string; format: string }>) => Promise<string>
  ) {}

  /**
   * 切换历史记录面板
   */
  toggleHistory(): void {
    this.historyHandler.toggleHistory();
    if (this.historyHandler.isHistoryVisible()) {
      this.historyHandler.loadHistoryList(
        async (id: string) => {
          const { messages, hasContextInjected } = await this.historyHandler.loadChatFromHistory(id);
          this.currentMessages.length = 0;
          this.currentMessages.push(...messages);
          this.hasContextInjected.value = hasContextInjected;
          this.messagesContainer.innerHTML = '';
          for (const msg of messages) {
            if (msg.role !== 'system') {
              await this.addMessage(msg.role as 'user' | 'assistant', msg.content, msg.images, msg.audio);
            }
          }
          this.historyHandler.toggleHistory();
        },
        async (id: string) => {
          await this.historyHandler.toggleFavorite(id);
        }
      );
    }
  }

  /**
   * 新建对话
   */
  async newChat(): Promise<void> {
    // 立即清空消息和显示空状态（同步操作，立即响应）
    this.currentMessages.length = 0;
    this.hasContextInjected.value = false; // 重置上下文注入标记
    this.attachmentHandler.clearAttachments(); // 清空附件
    this.stateManager.updateEmptyState(this.currentMessages); // 立即显示空状态
    
    // 异步处理配置和模型（不阻塞UI更新）
    (async () => {
      try {
        const config = await this.storage.getConfig();
        
        // 如果模型列表已加载，直接使用；否则异步加载（不阻塞）
        if (this.configHandler.getAllModels().length === 0) {
          // 只在模型列表为空时才加载
          await this.configManager.loadModels('openrouter');
        }
        
        if (config.currentModel) {
          this.modelSelect.value = config.currentModel;
          this.configManager.updateModelButtonText(config.currentModel);
        }
        
        // 异步保存配置（不阻塞UI）
        await this.configManager.saveConfig();
      } catch (err) {
        Logger.error('[ChatManager] 新对话初始化失败:', err);
      }
    })();
  }
}

