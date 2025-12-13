import { ChatHistory, ChatMessage } from '../../utils/types';
import { DataStorage } from '../../storage/data';
import { MarkdownRenderer } from '../utils/markdown';

/**
 * 历史记录管理工具类
 */
export class HistoryManager {
  /**
   * 渲染历史记录列表
   */
  static renderHistoryList(
    history: ChatHistory[],
    container: HTMLElement,
    i18n: any,
    onItemClick: (id: string) => void,
    onFavoriteClick: (id: string) => void
  ): void {
    if (history.length === 0) {
      container.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--b3-theme-on-background); opacity: 0.6;">${i18n.noHistory}</div>`;
      return;
    }

    container.innerHTML = history.map((item, index) => `
      <div class="gleam-history-item" data-id="${item.id}">
        <div class="gleam-history-item-number">${index + 1}</div>
        <div class="gleam-history-item-content">
          <div class="gleam-history-item-title">${MarkdownRenderer.escapeHtml(item.title)}</div>
          <div class="gleam-history-item-time">${new Date(item.timestamp).toLocaleString()}</div>
        </div>
        <button class="gleam-history-favorite ${item.isFavorite ? 'active' : ''}" 
                data-id="${item.id}" 
                title="${item.isFavorite ? '取消收藏' : '收藏'}">
          ${item.isFavorite ? '⭐' : '☆'}
        </button>
      </div>
    `).join('');

    container.querySelectorAll('.gleam-history-item').forEach(item => {
      const id = item.getAttribute('data-id');
      if (!id) return;
      
      // 点击历史项加载对话
      item.addEventListener('click', async (e) => {
        // 如果点击的是收藏按钮，不加载对话
        if ((e.target as HTMLElement).closest('.gleam-history-favorite')) {
          return;
        }
        onItemClick(id);
      });
      
      // 收藏按钮点击事件
      const favoriteBtn = item.querySelector('.gleam-history-favorite') as HTMLButtonElement;
      if (favoriteBtn) {
        favoriteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          onFavoriteClick(id);
        });
      }
    });
  }

  /**
   * 检查消息是否包含上下文（system 消息）
   */
  static hasContextInjected(messages: ChatMessage[]): boolean {
    return messages.length > 0 && messages[0].role === 'system';
  }
}

