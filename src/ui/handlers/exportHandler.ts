import { ChatMessage } from '../../utils/types';
import { Logger } from '../../utils/logger';
import { getAllEditor } from 'siyuan';

/**
 * 导出对话到文档的处理器
 */
export class ExportHandler {
  constructor(private plugin: any) {}

  /**
   * 获取当前笔记本ID
   */
  private async getCurrentNotebookId(): Promise<string | null> {
    try {
      // 尝试从当前打开的文档获取笔记本ID
      const editors = getAllEditor();
      const visibleEditor = editors.find((editor) => {
        const element = (editor as any).protyle?.element;
        if (!element) return false;
        return !element.classList.contains('fn__none');
      });

      if (visibleEditor) {
        const protyle = (visibleEditor as any).protyle;
        const blockId = protyle?.block?.id;
        if (blockId) {
          // 通过块ID获取文档信息，进而获取笔记本ID
          const docInfo = await this.getDocumentInfo(blockId);
          if (docInfo?.notebook) {
            return docInfo.notebook;
          }
        }
      }

      // 如果无法从当前文档获取，则获取第一个打开的笔记本
      const notebooks = await this.listNotebooks();
      if (notebooks && notebooks.length > 0) {
        // 返回第一个未关闭的笔记本
        const openNotebook = notebooks.find((nb: any) => !nb.closed);
        if (openNotebook) {
          return openNotebook.id;
        }
        // 如果没有打开的笔记本，返回第一个笔记本
        return notebooks[0].id;
      }

      return null;
    } catch (error) {
      Logger.error('[ExportHandler] 获取笔记本ID失败:', error);
      return null;
    }
  }

  /**
   * 获取文档信息
   */
  private async getDocumentInfo(blockId: string): Promise<any> {
    try {
      const response = await fetch('/api/filetree/getDoc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: blockId
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      Logger.error('[ExportHandler] 获取文档信息失败:', error);
      return null;
    }
  }

  /**
   * 列出所有笔记本
   */
  private async listNotebooks(): Promise<any[]> {
    try {
      const response = await fetch('/api/notebook/lsNotebooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.data?.notebooks || [];
    } catch (error) {
      Logger.error('[ExportHandler] 列出笔记本失败:', error);
      return [];
    }
  }

  /**
   * 将 base64 图片转换为文件并保存
   */
  private async saveBase64Image(base64Data: string, index: number): Promise<string | null> {
    try {
      // 解析 base64 数据
      const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        Logger.warn('[ExportHandler] 无效的 base64 图片格式');
        return null;
      }

      const mimeType = matches[1]; // jpeg, png, etc.
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
      const extension = mimeType === 'jpeg' ? 'jpg' : mimeType;
      const fileName = `gleam-export-${timestamp}-${index}.${extension}`;
      
      // 资源文件路径（assets 目录）
      const assetsPath = 'data/assets';
      const filePath = `${assetsPath}/${fileName}`;

      // 创建 FormData
      const formData = new FormData();
      formData.append('path', filePath);
      formData.append('isDir', 'false');
      formData.append('modTime', Math.floor(Date.now() / 1000).toString());
      formData.append('file', blob, fileName);

      // 上传文件
      const response = await fetch('/api/file/putFile', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || '保存图片失败');
      }

      // 返回资源路径（用于 Markdown 引用）
      return `assets/${fileName}`;
    } catch (error) {
      Logger.error('[ExportHandler] 保存 base64 图片失败:', error);
      return null;
    }
  }

  /**
   * 将对话消息转换为Markdown格式
   */
  private async messagesToMarkdown(messages: ChatMessage[]): Promise<string> {
    if (messages.length === 0) {
      return '';
    }

    let markdown = '';
    
    // 生成标题（使用第一条用户消息的前50个字符）
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    const title = firstUserMessage?.content?.substring(0, 50) || 'AI对话记录';
    markdown += `# ${title}\n\n`;
    
    // 添加时间戳
    const now = new Date();
    markdown += `**导出时间**: ${now.toLocaleString('zh-CN')}\n\n`;
    markdown += `---\n\n`;

    // 转换每条消息
    let imageIndex = 0;
    for (const msg of messages) {
      if (msg.role === 'system') {
        continue; // 跳过系统消息
      }

      const roleLabel = msg.role === 'user' ? '👤 用户' : '🤖 AI助手';
      markdown += `## ${roleLabel}\n\n`;

      // 处理文本内容
      if (msg.content) {
        markdown += `${msg.content}\n\n`;
      }

      // 处理图片
      if (msg.images && msg.images.length > 0) {
        for (const image of msg.images) {
          if (image.startsWith('data:')) {
            // Base64图片，保存为文件
            const savedPath = await this.saveBase64Image(image, imageIndex++);
            if (savedPath) {
              markdown += `![图片](${savedPath})\n\n`;
            } else {
              markdown += `*[图片保存失败]*\n\n`;
            }
          } else {
            // URL图片，直接使用
            markdown += `![图片](${image})\n\n`;
          }
        }
      }

      // 处理音频（在Markdown中无法直接显示，添加说明）
      if (msg.audio && msg.audio.length > 0) {
        markdown += `*[包含 ${msg.audio.length} 个音频文件]*\n\n`;
      }

      markdown += `---\n\n`;
    }

    return markdown;
  }

  /**
   * 创建文档
   */
  private async createDocument(notebookId: string, path: string, markdown: string): Promise<string | null> {
    try {
      const response = await fetch('/api/filetree/createDocWithMd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notebook: notebookId,
          path: path,
          markdown: markdown
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.msg || '创建文档失败');
      }

      const data = await response.json();
      return data.data || null;
    } catch (error) {
      Logger.error('[ExportHandler] 创建文档失败:', error);
      throw error;
    }
  }

  /**
   * 打开文档
   */
  private async openDocument(docId: string): Promise<void> {
    try {
      // 使用思源笔记的API打开文档
      if (this.plugin.openTab) {
        await this.plugin.openTab({
          app: this.plugin.app,
          doc: {
            id: docId,
            action: ['cb-get-focus']
          }
        });
      } else {
        // 备用方法：使用后端API
        await fetch('/api/filetree/getDoc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            id: docId
          })
        });
      }
    } catch (error) {
      Logger.error('[ExportHandler] 打开文档失败:', error);
    }
  }

  /**
   * 导出当前对话到文档
   */
  async exportToDocument(messages: ChatMessage[]): Promise<void> {
    if (messages.length === 0) {
      throw new Error(this.plugin.i18n.exportNoMessages || '没有可导出的消息');
    }

    try {
      // 获取笔记本ID
      const notebookId = await this.getCurrentNotebookId();
      if (!notebookId) {
        throw new Error(this.plugin.i18n.exportNoNotebook || '未找到可用的笔记本，请先打开一个笔记本');
      }

      // 生成文档路径（使用时间戳作为文件名）
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const firstUserMessage = messages.find(msg => msg.role === 'user');
      const title = firstUserMessage?.content?.substring(0, 30) || 'AI对话';
      // 清理标题中的特殊字符，用于路径
      const safeTitle = title.replace(/[<>:"/\\|?*]/g, '').trim() || 'AI对话';
      const path = `/AI对话/${safeTitle}-${timestamp}`;

      // 转换为Markdown（异步处理图片）
      const markdown = await this.messagesToMarkdown(messages);

      // 创建文档
      const docId = await this.createDocument(notebookId, path, markdown);
      if (!docId) {
        throw new Error(this.plugin.i18n.exportFailed || '创建文档失败');
      }

      // 打开文档
      await this.openDocument(docId);

      Logger.log('[ExportHandler] 导出成功，文档ID:', docId);
    } catch (error) {
      Logger.error('[ExportHandler] 导出失败:', error);
      throw error;
    }
  }
}
