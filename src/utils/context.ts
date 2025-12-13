export class ContextInjector {
  private plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  async getCurrentDocumentContent(): Promise<string> {
    try {
      const response = await fetch('/api/block/getBlockInfo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: this.getCurrentBlockId()
        })
      });

      if (!response.ok) {
        return '';
      }

      const data = await response.json();
      if (data.data?.content) {
        return this.extractTextFromContent(data.data.content);
      }

      return '';
    } catch (error) {
      console.error('Failed to get current document content:', error);
      return '';
    }
  }

  private getCurrentBlockId(): string {
    const protyle = (window as any).siyuan?.ws?.app?.plugins?.pluginInstances?.find(
      (p: any) => p.name === 'gleam'
    )?.protyle;

    if (protyle?.block?.id) {
      return protyle.block.id;
    }

    const activeElement = document.activeElement;
    if (activeElement?.closest('.protyle-content')) {
      const blockElement = activeElement.closest('[data-node-id]');
      if (blockElement) {
        return blockElement.getAttribute('data-node-id') || '';
      }
    }

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
      return '';
    }

    return `以下是当前文档的内容，请作为上下文参考：

${documentContent}

请基于以上内容回答用户的问题。`;
  }
}

