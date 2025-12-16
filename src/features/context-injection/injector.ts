import { Logger } from "../../utils/logger";
import { DocumentHelper } from "../../utils/documentHelper";
import { getAllEditor } from "siyuan";

export class ContextInjector {
  private plugin: any;
  private documentHelper: DocumentHelper;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.documentHelper = new DocumentHelper(plugin);
  }

  async getCurrentDocumentContent(): Promise<string> {
    try {
      // 使用 getAllEditor 获取所有编辑器实例
      const editors = getAllEditor();
      Logger.log("[ContextInjector] 找到编辑器数量:", editors.length);
      
      // 找到当前可见的编辑器（不带 fn__none 类的）
      const visibleEditor = editors.find((editor) => {
        const element = (editor as any).protyle?.element;
        if (!element) return false;
        // 当前显示的页面不带 fn__none
        return !element.classList.contains("fn__none");
      });

      if (!visibleEditor) {
        Logger.warn("[ContextInjector] 未找到可见的编辑器");
        return "";
      }

      const protyle = (visibleEditor as any).protyle;
      Logger.log("[ContextInjector] 找到可见编辑器，block ID:", protyle?.block?.id);

      // 从编辑器的 contentElement 中提取文本内容
      const contentElement = protyle?.contentElement;
      if (!contentElement) {
        Logger.warn("[ContextInjector] 编辑器没有 contentElement");
        return "";
      }

      // 提取所有文本内容
      const textContent = this.extractTextFromElement(contentElement);
      Logger.log("[ContextInjector] 提取的文本长度:", textContent.length, "字符");
      if (textContent) {
        Logger.log("[ContextInjector] 提取的文本预览:", textContent.substring(0, 100) + "...");
      }
      return textContent;
    } catch (error) {
      Logger.error("[ContextInjector] 获取文档内容失败:", error);
      return "";
    }
  }

  /**
   * 从元素中提取纯文本内容
   */
  private extractTextFromElement(element: HTMLElement): string {
    // 克隆元素以避免修改原始 DOM
    const clone = element.cloneNode(true) as HTMLElement;
    
    // 移除不需要的元素（如代码块、图表等）
    const excludeSelectors = [
      "code",
      ".code-block",
      ".render-node",
      ".av",
      ".b3-typography",
      "svg",
      "img"
    ];
    
    excludeSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // 获取纯文本内容
    const text = clone.textContent || "";
    // 清理多余的空白字符
    return text.replace(/\s+/g, " ").trim();
  }

  async getDocumentTree(blockId: string): Promise<any> {
    return await this.documentHelper.getDocumentTree(blockId);
  }

  buildContextPrompt(documentContent: string): string {
    if (!documentContent) {
      Logger.warn("[ContextInjector] 文档内容为空，无法构建上下文提示词");
      return "";
    }

    const prompt = `以下是当前文档的内容，请作为上下文参考：

${documentContent}

请基于以上内容回答用户的问题。`;
    
    Logger.log("[ContextInjector] 构建上下文提示词完成, 长度:", prompt.length, "字符");
    Logger.log("[ContextInjector] 上下文提示词预览:", prompt.substring(0, 200) + "...");
    
    return prompt;
  }
}

