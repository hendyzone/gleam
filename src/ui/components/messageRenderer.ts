import { MarkdownRenderer } from '../utils/markdown';

/**
 * 消息渲染工具类
 */
export class MessageRenderer {
  /**
   * 渲染消息内容（包括文本和图片）
   */
  static renderMessageContent(
    content: string,
    images: string[],
    supportsImageOutput: boolean
  ): string {
    let html = '';
    
    // 如果有图片，先渲染图片
    if (images && images.length > 0) {
      images.forEach(imageUrl => {
        html += `<div class="gleam-message-image"><img src="${this.escapeHtml(imageUrl)}" alt="Generated image" loading="lazy"></div>`;
      });
    }
    
    // 如果有文本内容，渲染文本
    if (content && content.trim()) {
      const textHtml = supportsImageOutput 
        ? MarkdownRenderer.renderMarkdown(content) 
        : MarkdownRenderer.renderMarkdown(content);
      html += textHtml;
    }
    
    return html || '<div class="gleam-message-empty">无内容</div>';
  }

  /**
   * 转义 HTML 特殊字符
   */
  private static escapeHtml(text: string): string {
    return MarkdownRenderer.escapeHtml(text);
  }
}

