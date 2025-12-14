import { MarkdownRenderer } from '../utils/markdown';

/**
 * 消息渲染工具类
 */
export class MessageRenderer {
  /**
   * 渲染消息内容（包括文本、图片和音频）
   */
  static renderMessageContent(
    content: string,
    images: string[],
    supportsImageOutput: boolean,
    audio?: Array<{ data: string; format: string }>
  ): string {
    let html = '';
    
    // 如果有图片，先渲染图片
    if (images && images.length > 0) {
      images.forEach(imageUrl => {
        html += `<div class="gleam-message-image"><img src="${this.escapeHtml(imageUrl)}" alt="Generated image" loading="lazy"></div>`;
      });
    }
    
    // 如果有音频，渲染音频
    if (audio && audio.length > 0) {
      audio.forEach(audioItem => {
        // 为显示生成 data URL（包含前缀，用于 audio 元素播放）
        const audioDataUrl = `data:audio/${audioItem.format};base64,${audioItem.data}`;
        html += `<div class="gleam-message-audio"><audio controls src="${this.escapeHtml(audioDataUrl)}" style="max-width: 100%;"></audio></div>`;
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

