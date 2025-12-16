import { Logger } from "../../utils/logger";

/**
 * 聊天工具方法
 */
export class ChatUtils {
  /**
   * 转义 HTML 特殊字符
   */
  static escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 复制文本到剪贴板
   */
  static async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        Logger.log("[ChatUtils] 文本已复制到剪贴板");
      } else {
        // 降级方案：使用传统方法
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        Logger.log("[ChatUtils] 文本已复制到剪贴板（降级方案）");
      }
    } catch (error) {
      Logger.error("[ChatUtils] 复制失败:", error);
      throw new Error("复制失败，请手动复制");
    }
  }

  /**
   * 显示图片放大查看器
   */
  static showImageZoom(imageUrl: string): void {
    // 创建图片查看器
    const zoomContainer = document.createElement("div");
    zoomContainer.className = "gleam-image-zoom-container";
    zoomContainer.innerHTML = `
      <div class="gleam-image-zoom-backdrop"></div>
      <div class="gleam-image-zoom-content">
        <button class="gleam-image-zoom-close">&times;</button>
        <img src="${this.escapeHtml(imageUrl)}" alt="Zoomed image" class="gleam-image-zoom-image">
      </div>
    `;

    document.body.appendChild(zoomContainer);
    
    // 关闭按钮事件
    const closeBtn = zoomContainer.querySelector(".gleam-image-zoom-close") as HTMLButtonElement;
    const backdrop = zoomContainer.querySelector(".gleam-image-zoom-backdrop") as HTMLElement;
    
    const closeZoom = () => {
      zoomContainer.remove();
    };
    
    closeBtn.addEventListener("click", closeZoom);
    backdrop.addEventListener("click", closeZoom);
    
    // ESC 键关闭
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeZoom();
        document.removeEventListener("keydown", handleKeyDown);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
  }

  /**
   * 复制图片到剪贴板
   */
  static async copyImageToClipboard(imageUrl: string): Promise<void> {
    try {
      // 将图片 URL 转换为 Blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      if (navigator.clipboard && navigator.clipboard.write) {
        // 使用 Clipboard API
        const item = new ClipboardItem({ [blob.type]: blob });
        await navigator.clipboard.write([item]);
        Logger.log("[ChatUtils] 图片已复制到剪贴板");
      } else {
        // 降级方案：创建临时图片元素并复制
        const img = document.createElement("img");
        img.src = imageUrl;
        img.style.position = "fixed";
        img.style.left = "-999999px";
        document.body.appendChild(img);
        
        // 使用 execCommand 复制（如果支持）
        const range = document.createRange();
        range.selectNode(img);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
          document.execCommand("copy");
          selection.removeAllRanges();
        }
        
        document.body.removeChild(img);
        Logger.log("[ChatUtils] 图片已复制到剪贴板（降级方案）");
      }
    } catch (error) {
      Logger.error("[ChatUtils] 复制图片失败:", error);
      throw new Error("复制图片失败，请手动保存");
    }
  }

  /**
   * 滚动到底部
   */
  static scrollToBottom(container: HTMLElement): void {
    container.scrollTop = container.scrollHeight;
  }

  /**
   * 根据文件扩展名获取文件类型
   */
  static getFileTypeFromExtension(filename: string): string {
    const ext = filename.toLowerCase().split(".").pop() || "";
    
    // 图片类型
    const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico"];
    if (imageExts.includes(ext)) return "image";
    
    // 音频类型
    const audioExts = ["mp3", "wav", "ogg", "flac", "aac", "m4a", "wma"];
    if (audioExts.includes(ext)) return "audio";
    
    // 视频类型
    const videoExts = ["mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"];
    if (videoExts.includes(ext)) return "video";
    
    // 文件类型（文本文件等）
    const fileExts = ["txt", "pdf", "doc", "docx", "md", "json", "xml", "csv"];
    if (fileExts.includes(ext)) return "file";
    
    // 默认返回 text
    return "text";
  }

  /**
   * 获取文件类型的显示名称
   */
  static getFileTypeName(fileType: string): string {
    const typeNames: Record<string, string> = {
      image: "图片",
      audio: "音频",
      video: "视频",
      file: "文件",
      text: "文本"
    };
    return typeNames[fileType] || fileType;
  }
}

