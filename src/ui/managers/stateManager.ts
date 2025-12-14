import { ChatMessage } from '../../utils/types';
import { ChatUtils } from '../utils/chatUtils';

/**
 * 状态管理器
 */
export class StateManager {
  constructor(
    private messagesContainer: HTMLElement,
    private plugin: any
  ) {}

  /**
   * 更新空状态显示
   */
  updateEmptyState(currentMessages: ChatMessage[]): void {
    if (currentMessages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div class="gleam-empty-state">
          <div class="gleam-empty-icon">💬</div>
          <div class="gleam-empty-title">${this.plugin.i18n.emptyTitle || '开始新的对话'}</div>
          <div class="gleam-empty-description">${this.plugin.i18n.emptyDescription || '在下方输入框中输入消息，开始与 AI 对话'}</div>
        </div>
      `;
    }
  }

  /**
   * 显示错误消息
   */
  showError(message: string): void {
    const errorElement = document.createElement('div');
    errorElement.className = 'gleam-error';
    errorElement.textContent = message;
    this.messagesContainer.appendChild(errorElement);
    ChatUtils.scrollToBottom(this.messagesContainer);
    setTimeout(() => errorElement.remove(), 5000);
  }

  /**
   * 显示成功消息
   */
  showSuccess(message: string): void {
    const successElement = document.createElement('div');
    successElement.className = 'gleam-success';
    successElement.textContent = message;
    this.messagesContainer.appendChild(successElement);
    ChatUtils.scrollToBottom(this.messagesContainer);
    setTimeout(() => successElement.remove(), 3000);
  }
}

