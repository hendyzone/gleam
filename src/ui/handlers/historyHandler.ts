import { DataStorage } from "../../storage/data";
import { HistoryManager } from "../components/historyManager";
import { ChatMessage } from "../../utils/types";

/**
 * 历史记录处理处理器
 */
export class HistoryHandler {
  constructor(
    private storage: DataStorage,
    private historyPanel: HTMLElement,
    private plugin: any
  ) {}

  /**
   * 加载历史记录
   */
  async loadHistory(): Promise<boolean> {
    const history = await this.storage.getHistory();
    return history.length > 0;
  }

  /**
   * 加载历史记录列表
   */
  async loadHistoryList(
    onSelect: (id: string) => Promise<void>,
    onToggleFavorite: (id: string) => Promise<void>
  ): Promise<void> {
    const history = await this.storage.getHistory();
    HistoryManager.renderHistoryList(
      history,
      this.historyPanel,
      this.plugin.i18n,
      onSelect,
      async (id: string) => {
        await onToggleFavorite(id);
        await this.loadHistoryList(onSelect, onToggleFavorite); // 重新加载历史列表以更新UI
      }
    );
  }

  /**
   * 从历史记录加载对话
   */
  async loadChatFromHistory(id: string): Promise<{
    messages: ChatMessage[];
    hasContextInjected: boolean;
  }> {
    const history = await this.storage.getHistory();
    const item = history.find(h => h.id === id);
    if (!item) {
      throw new Error("历史记录项不存在");
    }

    const messages = [...item.messages];
    const hasContextInjected = HistoryManager.hasContextInjected(messages);
    
    return { messages, hasContextInjected };
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string): Promise<void> {
    await this.storage.toggleFavorite(id);
  }

  /**
   * 保存当前对话
   */
  async saveCurrentChat(messages: ChatMessage[]): Promise<void> {
    if (messages.length === 0) return;

    const title = messages[0]?.content?.substring(0, 50) || "New Chat";
    const historyItem = {
      id: `chat-${Date.now()}`,
      title,
      messages: [...messages],
      timestamp: Date.now()
    };

    await this.storage.addHistoryItem(historyItem);
  }

  /**
   * 切换历史面板显示
   */
  toggleHistory(): void {
    this.historyPanel.classList.toggle("show");
  }

  /**
   * 检查历史面板是否显示
   */
  isHistoryVisible(): boolean {
    return this.historyPanel.classList.contains("show");
  }

  /**
   * 检查是否有历史记录
   */
  async hasHistory(): Promise<boolean> {
    const history = await this.storage.getHistory();
    return history.length > 0;
  }
}

