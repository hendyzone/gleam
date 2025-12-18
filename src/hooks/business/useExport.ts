import { useAppContext } from "../../contexts/AppContext";
import { useChatContext } from "../../contexts/ChatContext";
import { useUIContext } from "../../contexts/UIContext";
import { ChatMessage } from "../../utils/types";
import { Logger } from "../../utils/logger";
import { getAllEditor } from "siyuan";

export const useExport = () => {
  const { plugin, i18n } = useAppContext();
  const { state: chatState } = useChatContext();
  const { dispatch: uiDispatch } = useUIContext();

  /**
   * 获取当前笔记本ID
   */
  const getCurrentNotebookId = async (): Promise<string | null> => {
    try {
      // 尝试从当前打开的文档获取笔记本ID
      const editors = getAllEditor();
      const visibleEditor = editors.find((editor) => {
        const element = (editor as any).protyle?.element;
        if (!element) return false;
        return !element.classList.contains("fn__none");
      });

      if (visibleEditor) {
        const protyle = (visibleEditor as any).protyle;
        const blockId = protyle?.block?.id;
        if (blockId) {
          const docInfo = await getDocumentInfo(blockId);
          if (docInfo?.notebook) {
            return docInfo.notebook;
          }
        }
      }

      // 获取第一个打开的笔记本
      const notebooks = await listNotebooks();
      if (notebooks && notebooks.length > 0) {
        const openNotebook = notebooks.find((nb: any) => !nb.closed);
        if (openNotebook) {
          return openNotebook.id;
        }
        return notebooks[0].id;
      }

      return null;
    } catch (error) {
      Logger.error("Failed to get notebook ID:", error);
      return null;
    }
  };

  /**
   * 获取文档信息
   */
  const getDocumentInfo = async (blockId: string): Promise<any> => {
    try {
      const response = await fetch("/api/filetree/getDoc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: blockId })
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      Logger.error("Failed to get document info:", error);
      return null;
    }
  };

  /**
   * 列出所有笔记本
   */
  const listNotebooks = async (): Promise<any[]> => {
    try {
      const response = await fetch("/api/notebook/lsNotebooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.data?.notebooks || [];
    } catch (error) {
      Logger.error("Failed to list notebooks:", error);
      return [];
    }
  };

  /**
   * 将 base64 图片转换为文件并保存
   */
  const saveBase64Image = async (base64Data: string, index: number): Promise<string | null> => {
    try {
      const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        Logger.warn("Invalid base64 image format");
        return null;
      }

      const mimeType = matches[1];
      const base64Content = matches[2];

      // 将 base64 转换为 Blob
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: `image/${mimeType}` });

      // 生成文件名
      const timestamp = Date.now();
      const extension = mimeType === "jpeg" ? "jpg" : mimeType;
      const fileName = `gleam-export-${timestamp}-${index}.${extension}`;

      const assetsPath = "data/assets";
      const filePath = `${assetsPath}/${fileName}`;

      // 创建 FormData
      const formData = new FormData();
      formData.append("path", filePath);
      formData.append("isDir", "false");
      formData.append("modTime", Math.floor(Date.now() / 1000).toString());
      formData.append("file", blob, fileName);

      // 上传文件
      const response = await fetch("/api/file/putFile", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to save image");
      }

      return `assets/${fileName}`;
    } catch (error) {
      Logger.error("Failed to save base64 image:", error);
      return null;
    }
  };

  /**
   * 将对话消息转换为Markdown格式
   */
  const messagesToMarkdown = async (messages: ChatMessage[]): Promise<string> => {
    if (messages.length === 0) return "";

    let markdown = "";

    // 生成标题
    const firstUserMessage = messages.find((msg) => msg.role === "user");
    const title = firstUserMessage?.content?.substring(0, 50) || "AI对话记录";
    markdown += `# ${title}\n\n`;

    // 添加时间戳
    const now = new Date();
    markdown += `**导出时间**: ${now.toLocaleString("zh-CN")}\n\n`;
    markdown += "---\n\n";

    // 转换每条消息
    let imageIndex = 0;
    for (const msg of messages) {
      if (msg.role === "system") continue; // 跳过系统消息

      const roleLabel = msg.role === "user" ? "👤 用户" : "🤖 AI助手";
      markdown += `## ${roleLabel}\n\n`;

      // 处理文本内容
      if (msg.content) {
        markdown += `${msg.content}\n\n`;
      }

      // 处理图片
      if (msg.images && msg.images.length > 0) {
        for (const image of msg.images) {
          if (image.startsWith("data:")) {
            const savedPath = await saveBase64Image(image, imageIndex++);
            if (savedPath) {
              markdown += `![图片](${savedPath})\n\n`;
            } else {
              markdown += "*[图片保存失败]*\n\n";
            }
          } else {
            markdown += `![图片](${image})\n\n`;
          }
        }
      }

      // 处理音频
      if (msg.audio && msg.audio.length > 0) {
        markdown += `*[包含 ${msg.audio.length} 个音频文件]*\n\n`;
      }

      markdown += "---\n\n";
    }

    return markdown;
  };

  /**
   * 创建文档
   */
  const createDocument = async (notebookId: string, path: string, markdown: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/filetree/createDocWithMd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebook: notebookId,
          path: path,
          markdown: markdown
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || "Failed to create document");
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      Logger.error("Failed to create document:", error);
      throw error;
    }
  };

  /**
   * 打开文档
   */
  const openDocument = async (docId: string): Promise<void> => {
    try {
      if ((plugin as any).openTab) {
        await (plugin as any).openTab({
          app: (plugin as any).app,
          doc: {
            id: docId,
            action: ["cb-get-focus"]
          }
        });
      } else {
        await fetch("/api/filetree/getDoc", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: docId })
        });
      }
    } catch (error) {
      Logger.error("Failed to open document:", error);
    }
  };

  /**
   * 导出当前对话到文档
   */
  const exportToDocument = async (): Promise<void> => {
    const messages = chatState.messages;

    if (messages.length === 0) {
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: i18n?.exportNoMessages || "没有可导出的消息"
        }
      });
      return;
    }

    try {
      // 获取笔记本ID
      const notebookId = await getCurrentNotebookId();
      if (!notebookId) {
        uiDispatch({
          type: "ADD_NOTIFICATION",
          payload: {
            type: "error",
            message: i18n?.exportNoNotebook || "未找到可用的笔记本，请先打开一个笔记本"
          }
        });
        return;
      }

      // 生成文档路径
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
      const firstUserMessage = messages.find((msg) => msg.role === "user");
      const title = firstUserMessage?.content?.substring(0, 30) || "AI对话";
      const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").trim() || "AI对话";
      const path = `/AI对话/${safeTitle}-${timestamp}`;

      // 转换为Markdown
      const markdown = await messagesToMarkdown(messages);

      // 创建文档
      const docId = await createDocument(notebookId, path, markdown);
      if (!docId) {
        throw new Error(i18n?.exportFailed || "创建文档失败");
      }

      // 打开文档
      await openDocument(docId);

      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "success",
          message: i18n?.exportSuccess || "导出成功"
        }
      });

      Logger.log("Export successful, document ID:", docId);
    } catch (error: any) {
      Logger.error("Export failed:", error);
      uiDispatch({
        type: "ADD_NOTIFICATION",
        payload: {
          type: "error",
          message: error?.message || i18n?.exportFailed || "导出失败"
        }
      });
    }
  };

  return {
    exportToDocument
  };
};
