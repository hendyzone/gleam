import { Logger } from '../../utils/logger';
import { DocumentHelper } from '../../utils/documentHelper';

export class ContextInjector {
  private plugin: any;
  private documentHelper: DocumentHelper;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.documentHelper = new DocumentHelper(plugin);
  }

  async getCurrentDocumentContent(): Promise<string> {
    try {
      // 使用选中的块内容，如果没有选中则返回空
      const content = await this.documentHelper.getSelectedBlockContent();
      Logger.log('[ContextInjector] 提取的文本长度:', content.length, '字符');
      if (content) {
        Logger.log('[ContextInjector] 提取的文本预览:', content.substring(0, 100) + '...');
      }
      return content;
    } catch (error) {
      Logger.error('[ContextInjector] 获取文档内容失败:', error);
      return '';
    }
  }

  async getDocumentTree(blockId: string): Promise<any> {
    return await this.documentHelper.getDocumentTree(blockId);
  }

  buildContextPrompt(documentContent: string): string {
    if (!documentContent) {
      Logger.warn('[ContextInjector] 文档内容为空，无法构建上下文提示词');
      return '';
    }

    const prompt = `以下是当前文档的内容，请作为上下文参考：

${documentContent}

请基于以上内容回答用户的问题。`;
    
    Logger.log('[ContextInjector] 构建上下文提示词完成, 长度:', prompt.length, '字符');
    Logger.log('[ContextInjector] 上下文提示词预览:', prompt.substring(0, 200) + '...');
    
    return prompt;
  }
}

