import { Logger } from '../../utils/logger';

/**
 * Markdown 渲染工具类
 */
export class MarkdownRenderer {
  /**
   * 转义 HTML 特殊字符
   */
  static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 将 Markdown 文本渲染为 HTML
   */
  static renderMarkdown(markdown: string): string {
    try {
      // 获取 Lute 实例（从任意编辑器实例中获取）
      const editors = (window as any).siyuan?.getAllEditor?.() || [];
      let lute: any = null;
      
      if (editors.length > 0) {
        const editor = editors[0] as any;
        lute = editor?.protyle?.lute;
      }
      
      // 如果没有找到 Lute，尝试从全局获取
      if (!lute && (window as any).siyuan?.Lute) {
        lute = new (window as any).siyuan.Lute();
      }
      
      // 如果仍然没有，使用简化的 Markdown 渲染
      if (!lute) {
        return this.simpleMarkdownRender(markdown);
      }
      
      // 使用 Lute 渲染 Markdown
      return lute.Md2HTML(markdown);
    } catch (error) {
      Logger.error('[MarkdownRenderer] Markdown 渲染失败:', error);
      // 降级到简单渲染
      return this.simpleMarkdownRender(markdown);
    }
  }

  /**
   * 简单的 Markdown 渲染（降级方案）
   */
  private static simpleMarkdownRender(markdown: string): string {
    let html = markdown;
    
    // 代码块（必须在转义之前处理，使用特殊标记保护）
    const codeBlocks: string[] = [];
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push(`<pre><code class="language-${lang || 'text'}">${this.escapeHtml(code)}</code></pre>`);
      return placeholder;
    });
    
    // 行内代码（使用特殊标记保护）
    const inlineCodes: string[] = [];
    html = html.replace(/`([^`]+)`/g, (match, code) => {
      const placeholder = `__INLINE_CODE_${inlineCodes.length}__`;
      inlineCodes.push(`<code>${this.escapeHtml(code)}</code>`);
      return placeholder;
    });
    
    // 标题（必须在转义之前处理，按从多到少的顺序）
    html = html.replace(/^###### (.*)$/gim, '<h6>$1</h6>');
    html = html.replace(/^##### (.*)$/gim, '<h5>$1</h5>');
    html = html.replace(/^#### (.*)$/gim, '<h4>$1</h4>');
    html = html.replace(/^### (.*)$/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*)$/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*)$/gim, '<h1>$1</h1>');
    
    // 转义 HTML（标题已经处理，不会被转义）
    html = this.escapeHtml(html);
    
    // 恢复代码块
    codeBlocks.forEach((codeBlock, index) => {
      html = html.replace(`__CODE_BLOCK_${index}__`, codeBlock);
    });
    
    // 恢复行内代码
    inlineCodes.forEach((inlineCode, index) => {
      html = html.replace(`__INLINE_CODE_${index}__`, inlineCode);
    });
    
    // 恢复标题（因为 escapeHtml 会转义它们）
    html = html.replace(/&lt;h([1-6])&gt;(.*?)&lt;\/h([1-6])&gt;/g, '<h$1>$2</h$3>');
    
    // 粗体
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // 斜体
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // 链接
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    
    // 列表（无序）
    html = html.replace(/^\* (.*)$/gim, '<li>$1</li>');
    html = html.replace(/^- (.*)$/gim, '<li>$1</li>');
    html = html.replace(/^\+ (.*)$/gim, '<li>$1</li>');
    
    // 有序列表
    html = html.replace(/^\d+\. (.*)$/gim, '<li>$1</li>');
    
    // 引用
    html = html.replace(/^&gt; (.*)$/gim, '<blockquote>$1</blockquote>');
    
    // 分隔线
    html = html.replace(/^---$/gim, '<hr>');
    html = html.replace(/^\*\*\*$/gim, '<hr>');
    
    // 将连续的 li 包裹在 ul 或 ol 中
    html = html.replace(/(<li>.*?<\/li>(?:\n|$))+/g, (match) => {
      // 检查是否是有序列表（包含数字）
      const isOrdered = /^\d+\./.test(match);
      const tag = isOrdered ? 'ol' : 'ul';
      return `<${tag}>${match}</${tag}>`;
    });
    
    // 段落处理：将连续的非标签行包裹在 <p> 中
    const lines = html.split('\n');
    const processedLines: string[] = [];
    let currentParagraph: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // 如果是空行，结束当前段落
      if (trimmed === '') {
        if (currentParagraph.length > 0) {
          processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        continue;
      }
      // 如果已经是 HTML 标签（标题、列表、代码块等），结束当前段落并添加该行
      if (trimmed.match(/^<(h[1-6]|ul|ol|li|pre|code|blockquote|hr|p)/)) {
        if (currentParagraph.length > 0) {
          processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
          currentParagraph = [];
        }
        processedLines.push(line);
      } else {
        // 普通文本，添加到当前段落
        currentParagraph.push(trimmed);
      }
    }
    
    // 处理剩余的段落
    if (currentParagraph.length > 0) {
      processedLines.push(`<p>${currentParagraph.join(' ')}</p>`);
    }
    
    html = processedLines.join('\n');
    
    return html;
  }
}

