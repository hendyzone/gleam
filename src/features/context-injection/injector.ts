export class ContextInjector {
  private plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  async getCurrentDocumentContent(): Promise<string> {
    try {
      const blockId = this.getCurrentBlockId();
      console.log('[ContextInjector] 开始获取文档内容, blockId:', blockId);
      
      if (!blockId) {
        console.warn('[ContextInjector] 未找到当前块ID');
        return '';
      }

      const response = await fetch('/api/block/getBlockInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: blockId
        })
      });

      if (!response.ok) {
        console.warn('[ContextInjector] API调用失败, status:', response.status, response.statusText);
        return '';
      }

      const data = await response.json();
      console.log('[ContextInjector] API响应:', data);
      
      if (data.data?.content) {
        const extractedText = this.extractTextFromContent(data.data.content);
        console.log('[ContextInjector] 提取的文本长度:', extractedText.length, '字符');
        console.log('[ContextInjector] 提取的文本预览:', extractedText.substring(0, 100) + '...');
        return extractedText;
      }

      console.warn('[ContextInjector] API响应中没有content字段');
      return '';
    } catch (error) {
      console.error('[ContextInjector] 获取文档内容失败:', error);
      return '';
    }
  }

  private getCurrentBlockId(): string {
    console.log('[ContextInjector] 开始获取当前块ID');
    
    const protyle = (window as any).siyuan?.ws?.app?.plugins?.pluginInstances?.find(
      (p: any) => p.name === 'gleam'
    )?.protyle;

    if (protyle?.block?.id) {
      console.log('[ContextInjector] 从protyle获取块ID:', protyle.block.id);
      return protyle.block.id;
    }

    const activeElement = document.activeElement;
    console.log('[ContextInjector] 当前活动元素:', activeElement);
    
    if (activeElement?.closest('.protyle-content')) {
      const blockElement = activeElement.closest('[data-node-id]');
      if (blockElement) {
        const blockId = blockElement.getAttribute('data-node-id') || '';
        console.log('[ContextInjector] 从活动元素获取块ID:', blockId);
        return blockId;
      }
    }

    console.warn('[ContextInjector] 未找到块ID');
    return '';
  }

  private extractTextFromContent(content: string): string {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');
      const text = doc.body.textContent || '';
      return text.trim();
    } catch (error) {
      return content;
    }
  }

  async getDocumentTree(): Promise<any> {
    try {
      const blockId = this.getCurrentBlockId();
      if (!blockId) {
        return null;
      }

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

      return await response.json();
    } catch (error) {
      console.error('Failed to get document tree:', error);
      return null;
    }
  }

  buildContextPrompt(documentContent: string): string {
    if (!documentContent) {
      console.warn('[ContextInjector] 文档内容为空，无法构建上下文提示词');
      return '';
    }

    const prompt = `以下是当前文档的内容，请作为上下文参考：

${documentContent}

请基于以上内容回答用户的问题。`;
    
    console.log('[ContextInjector] 构建上下文提示词完成, 长度:', prompt.length, '字符');
    console.log('[ContextInjector] 上下文提示词预览:', prompt.substring(0, 200) + '...');
    
    return prompt;
  }
}

