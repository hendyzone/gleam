import { Logger } from "./logger";

export interface BlockInfo {
  id: string;
  content?: string;
  type?: string;
  [key: string]: any;
}

export interface DocumentInfo {
  id: string;
  title?: string;
  content?: string;
  [key: string]: any;
}

export class DocumentHelper {
  private plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  /**
   * 获取当前选中的块ID
   * 从选中的元素中获取
   */
  getSelectedBlockId(): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      Logger.log("[DocumentHelper] 没有选中内容");
      return "";
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // 查找包含选中内容的块元素
    const blockElement = container.nodeType === Node.ELEMENT_NODE
      ? (container as Element).closest("[data-node-id]")
      : (container as Node).parentElement?.closest("[data-node-id]");

    if (blockElement) {
      const blockId = blockElement.getAttribute("data-node-id") || "";
      Logger.log("[DocumentHelper] 从选中内容获取块ID:", blockId);
      return blockId;
    }

    Logger.warn("[DocumentHelper] 未找到选中块的ID");
    return "";
  }


  /**
   * 获取块信息
   */
  async getBlockInfo(blockId: string): Promise<BlockInfo | null> {
    if (!blockId) {
      return null;
    }

    try {
      const response = await fetch("/api/block/getBlockInfo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: blockId
        })
      });

      if (!response.ok) {
        Logger.warn("[DocumentHelper] API调用失败, status:", response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      Logger.log("[DocumentHelper] API响应:", data);
      
      return data.data || null;
    } catch (error) {
      Logger.error("[DocumentHelper] 获取块信息失败:", error);
      return null;
    }
  }

  /**
   * 获取块内容（纯文本）
   */
  async getBlockContent(blockId: string): Promise<string> {
    const blockInfo = await this.getBlockInfo(blockId);
    if (!blockInfo?.content) {
      return "";
    }

    return this.extractTextFromContent(blockInfo.content);
  }

  /**
   * 获取当前选中的块内容
   */
  async getSelectedBlockContent(): Promise<string> {
    const blockId = this.getSelectedBlockId();
    if (!blockId) {
      return "";
    }

    return await this.getBlockContent(blockId);
  }

  /**
   * 获取文档树
   */
  async getDocumentTree(blockId: string): Promise<any> {
    if (!blockId) {
      return null;
    }

    try {
      const response = await fetch("/api/filetree/getDoc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id: blockId
        })
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      Logger.error("[DocumentHelper] 获取文档树失败:", error);
      return null;
    }
  }

  /**
   * 从HTML内容中提取纯文本
   */
  extractTextFromContent(content: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "text/html");
      const text = doc.body.textContent || "";
      return text.trim();
    } catch (error) {
      Logger.warn("[DocumentHelper] 文本提取失败，返回原始内容");
      return content;
    }
  }

  /**
   * 获取选中的文本内容
   */
  getSelectedText(): string {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return "";
    }

    return selection.toString().trim();
  }

}

