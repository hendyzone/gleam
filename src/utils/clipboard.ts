import { Logger } from "./logger";

/**
 * 复制文本到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      // 使用 Clipboard API (HTTPS 环境)
      await navigator.clipboard.writeText(text);
      Logger.log("Text copied to clipboard");
      return true;
    } else {
      // 降级方案：使用 textarea (HTTP 环境)
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      textarea.style.top = "-999999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (successful) {
          Logger.log("Text copied to clipboard (fallback method)");
          return true;
        } else {
          Logger.error("Failed to copy text (fallback method)");
          return false;
        }
      } catch (err) {
        document.body.removeChild(textarea);
        throw err;
      }
    }
  } catch (error) {
    Logger.error("Failed to copy to clipboard:", error);
    return false;
  }
}

/**
 * 复制图片到剪贴板
 */
export async function copyImageToClipboard(imageUrl: string): Promise<boolean> {
  try {
    // 只支持 data: URL 或同源图片
    if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("/") && !imageUrl.startsWith(window.location.origin)) {
      Logger.warn("Cannot copy cross-origin image");
      return false;
    }

    // 从 URL 获取图片数据
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    // 使用 Clipboard API 复制图片
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          [blob.type]: blob
        })
      ]);
      Logger.log("Image copied to clipboard");
      return true;
    } else {
      Logger.warn("Clipboard API not supported for images");
      return false;
    }
  } catch (error) {
    Logger.error("Failed to copy image to clipboard:", error);
    return false;
  }
}
