import { ChatMessage } from '../../utils/types';
import { MarkdownRenderer } from '../utils/markdown';
import { MessageRenderer } from './messageRenderer';
import { ChatUtils } from '../utils/chatUtils';
import { ModelInfo } from '../../utils/types';
import { DataStorage } from '../../storage/data';
import { ConfigHandler } from '../handlers/configHandler';

/**
 * 消息渲染辅助类
 */
export class MessageHelper {
  /**
   * 添加消息到DOM
   */
  static async addMessage(
    messagesContainer: HTMLElement,
    role: 'user' | 'assistant',
    content: string,
    images?: string[],
    audio?: Array<{ data: string; format: string }>,
    supportsImageOutput?: boolean,
    plugin?: any,
    onCopy?: (text: string) => Promise<void>,
    onRegenerate?: (messageId: string) => Promise<void>,
    onImageZoom?: (imageUrl: string) => void,
    onImageCopy?: (imageUrl: string) => Promise<void>,
    storage?: DataStorage,
    configHandler?: ConfigHandler
  ): Promise<string> {
    // 清除空状态显示
    if (messagesContainer.querySelector('.gleam-empty-state')) {
      messagesContainer.innerHTML = '';
    }

    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const messageElement = document.createElement('div');
    messageElement.className = `gleam-message gleam-message-${role}`;
    messageElement.setAttribute('data-message-id', messageId);

    const time = new Date().toLocaleTimeString();
    
    // 如果未提供 supportsImageOutput，尝试从配置中获取
    let finalSupportsImageOutput = supportsImageOutput;
    if (finalSupportsImageOutput === undefined && storage && configHandler) {
      try {
        const config = await storage.getConfig();
        const currentModelInfo = configHandler.getModelInfo(config.currentModel);
        finalSupportsImageOutput = currentModelInfo?.outputModalities?.includes('image') || false;
      } catch (e) {
        // 忽略错误，使用默认值
        finalSupportsImageOutput = false;
      }
    }
    
    // 渲染内容（包括图片和音频）
    const contentHtml = role === 'assistant' 
      ? MessageRenderer.renderMessageContent(content, images || [], finalSupportsImageOutput || false, audio)
      : MessageRenderer.renderMessageContent(MarkdownRenderer.escapeHtml(content), images || [], false, audio);
    
    // 为助手消息添加复制按钮、重新生成按钮和状态指示器
    const copyButton = role === 'assistant' 
      ? '<button class="gleam-copy-button" title="复制" data-content="' + MarkdownRenderer.escapeHtml(content) + '">📋</button>'
      : '';
    const regenerateButton = role === 'assistant'
      ? '<button class="gleam-regenerate-button" title="' + (plugin?.i18n?.regenerate || '重新生成') + '" data-message-id="' + messageId + '">🔄</button>'
      : '';
    const statusIndicator = role === 'assistant'
      ? '<div class="gleam-message-status"></div>'
      : '';
    messageElement.innerHTML = `
      <div class="gleam-message-content">
        ${contentHtml}
        <div class="gleam-message-actions">
          ${copyButton}
          ${regenerateButton}
        </div>
      </div>
      <div class="gleam-message-footer">
        ${statusIndicator}
        <div class="gleam-message-time">${time}</div>
      </div>
    `;
    
    // 为复制按钮添加事件监听
    if (role === 'assistant' && onCopy) {
      const copyBtn = messageElement.querySelector('.gleam-copy-button') as HTMLButtonElement;
      if (copyBtn) {
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const textToCopy = copyBtn.getAttribute('data-content') || '';
          await onCopy(textToCopy);
        });
      }
      
      // 为重新生成按钮添加事件监听
      const regenerateBtn = messageElement.querySelector('.gleam-regenerate-button') as HTMLButtonElement;
      if (regenerateBtn && onRegenerate) {
        regenerateBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          await onRegenerate(messageId);
        });
      }
    }

    // 为图片操作按钮添加事件监听
    const imageActionBtns = messageElement.querySelectorAll('.gleam-image-action-btn');
    imageActionBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = (btn as HTMLElement).getAttribute('data-action');
        const imageUrl = (btn as HTMLElement).getAttribute('data-image-url') || '';
        
        if (action === 'zoom' && onImageZoom) {
          onImageZoom(imageUrl);
        } else if (action === 'copy' && onImageCopy) {
          await onImageCopy(imageUrl);
        }
      });
    });

    messagesContainer.appendChild(messageElement);
    ChatUtils.scrollToBottom(messagesContainer);
    return messageId;
  }

  /**
   * 更新消息状态指示器
   */
  static updateMessageStatus(messageElement: HTMLElement, status: 'streaming' | 'completed' | 'error'): void {
    const statusElement = messageElement.querySelector('.gleam-message-status') as HTMLElement;
    if (!statusElement) return;

    // 移除所有状态类
    statusElement.classList.remove('streaming', 'completed', 'error');
    
    // 添加当前状态类
    statusElement.classList.add(status);
    
    // 更新状态文本
    switch (status) {
      case 'streaming':
        statusElement.textContent = '正在输入...';
        statusElement.title = '正在生成回复';
        break;
      case 'completed':
        statusElement.textContent = '✓';
        statusElement.title = '回复完成';
        break;
      case 'error':
        statusElement.textContent = '✗';
        statusElement.title = '生成失败';
        break;
    }
  }

  /**
   * 更新流式消息内容
   */
  static updateStreamingMessage(
    contentElement: HTMLElement,
    fullContent: string,
    imageUrls: string[],
    supportsImageOutput: boolean,
    onCopy?: (text: string) => Promise<void>,
    onRegenerate?: (messageId: string) => Promise<void>,
    messageId?: string,
    onImageZoom?: (imageUrl: string) => void,
    onImageCopy?: (imageUrl: string) => Promise<void>
  ): void {
    // 渲染内容（包括图片），流式生成时传递 isStreaming 参数
    const html = MessageRenderer.renderMessageContent(fullContent, imageUrls, supportsImageOutput, undefined, true);
    // 保留按钮区域
    const actionsContainer = contentElement.querySelector('.gleam-message-actions');
    if (actionsContainer) {
      const actionsHtml = actionsContainer.outerHTML;
      contentElement.innerHTML = html + actionsHtml;

      // 重新绑定文本复制和重新生成按钮事件
      const copyBtn = contentElement.querySelector('.gleam-copy-button') as HTMLButtonElement;
      if (copyBtn && onCopy) {
        copyBtn.setAttribute('data-content', MarkdownRenderer.escapeHtml(fullContent));
        copyBtn.onclick = async (e) => {
          e.stopPropagation();
          await onCopy(fullContent);
        };
      }
      const regenerateBtn = contentElement.querySelector('.gleam-regenerate-button') as HTMLButtonElement;
      if (regenerateBtn && onRegenerate && messageId) {
        regenerateBtn.setAttribute('data-message-id', messageId);
        regenerateBtn.onclick = async (e) => {
          e.stopPropagation();
          await onRegenerate(messageId);
        };
      }
    } else {
      contentElement.innerHTML = html;
    }

    // 为图片操作按钮重新绑定事件（流式更新会替换图片区域）
    const imageActionBtns = contentElement.querySelectorAll('.gleam-image-action-btn');
    imageActionBtns.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = (btn as HTMLElement).getAttribute('data-action');
        const imageUrl = (btn as HTMLElement).getAttribute('data-image-url') || '';

        if (action === 'zoom' && onImageZoom) {
          onImageZoom(imageUrl);
        } else if (action === 'copy' && onImageCopy) {
          await onImageCopy(imageUrl);
        }
      });
    });
  }
}

