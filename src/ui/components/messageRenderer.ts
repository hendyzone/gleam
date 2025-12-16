import { MarkdownRenderer } from "../utils/markdown";

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
    audio?: Array<{ data: string; format: string }>,
    isStreaming?: boolean
  ): string {
    let html = "";
    
    // 如果有图片，先渲染图片
    if (images && images.length > 0) {
      images.forEach((imageUrl, index) => {
        html += `
          <div class="gleam-message-image">
            <img src="${this.escapeHtml(imageUrl)}" alt="Generated image" loading="lazy" data-image-url="${this.escapeHtml(imageUrl)}">
            <div class="gleam-image-actions">
              <button class="gleam-image-action-btn" data-action="zoom" data-image-url="${this.escapeHtml(imageUrl)}" title="放大">🔍</button>
              <button class="gleam-image-action-btn" data-action="copy" data-image-url="${this.escapeHtml(imageUrl)}" title="复制">📋</button>
            </div>
          </div>
        `;
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
    
    // 如果没有内容，根据是否正在流式生成显示不同的提示
    if (!html) {
      if (isStreaming) {
        return '<div class="gleam-message-loading"><span class="gleam-loading-dots"><span>.</span><span>.</span><span>.</span></span></div>';
      } else {
        return '<div class="gleam-message-empty">无内容</div>';
      }
    }
    
    return html;
  }

  /**
   * 转义 HTML 特殊字符
   */
  private static escapeHtml(text: string): string {
    return MarkdownRenderer.escapeHtml(text);
  }
}

