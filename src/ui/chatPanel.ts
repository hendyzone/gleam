import { ChatMessage } from '../utils/types';
import { DataStorage } from '../storage/data';
import { ContextInjector } from '../features/context-injection';
import { OpenRouterProvider } from '../api/openrouter';
import { SiliconFlowProvider } from '../api/siliconflow';
import { AIProvider } from '../api/base';
import { Lute } from 'siyuan';
import { Logger } from '../utils/logger';

export class ChatPanel {
  private element: HTMLElement;
  private messagesContainer!: HTMLElement;
  private inputArea!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private providerSelect!: HTMLSelectElement;
  private modelSelect!: HTMLSelectElement;
  private contextToggle!: HTMLInputElement;
  private historyButton!: HTMLButtonElement;
  private newChatButton!: HTMLButtonElement;
  private historyPanel!: HTMLElement;

  private plugin: any;
  private storage: DataStorage;
  private contextInjector: ContextInjector;
  private providers: Map<string, AIProvider>;
  private currentMessages: ChatMessage[] = [];
  private isLoading = false;
  private hasContextInjected = false; // 标记是否已经注入过上下文

  constructor(plugin: any, element: HTMLElement) {
    this.plugin = plugin;
    this.element = element;
    this.storage = new DataStorage(plugin);
    this.contextInjector = new ContextInjector(plugin);
    this.providers = new Map<string, AIProvider>([
      ['openrouter', new OpenRouterProvider()],
      ['siliconflow', new SiliconFlowProvider()]
    ]);

    this.init();
  }

  private async init() {
    this.createUI();
    await this.loadConfig();
    await this.loadHistory();
    this.attachEventListeners();
  }

  private createUI() {
    this.element.innerHTML = `
      <div class="gleam-container">
        <div class="gleam-messages" id="gleam-messages"></div>
        <div class="gleam-history-panel" id="gleam-history-panel"></div>
        <div class="gleam-input-area">
          <div class="gleam-input-wrapper">
            <textarea class="gleam-textarea" id="gleam-textarea" placeholder="${this.plugin.i18n.inputPlaceholder}"></textarea>
            <button class="gleam-send-button" id="gleam-send-button">${this.plugin.i18n.send}</button>
          </div>
          <div class="gleam-controls">
            <select class="gleam-select" id="gleam-provider-select">
              <option value="openrouter">${this.plugin.i18n.provider}: OpenRouter</option>
              <option value="siliconflow">${this.plugin.i18n.provider}: SiliconFlow</option>
            </select>
            <select class="gleam-select" id="gleam-model-select">
              <option value="">${this.plugin.i18n.selectModel}</option>
            </select>
            <label class="gleam-toggle">
              <input type="checkbox" id="gleam-context-toggle">
              <span>${this.plugin.i18n.contextInjection}</span>
            </label>
            <button class="gleam-button" id="gleam-new-chat-button">${this.plugin.i18n.newChat || '新建对话'}</button>
            <button class="gleam-button" id="gleam-history-button">${this.plugin.i18n.history}</button>
          </div>
        </div>
      </div>
    `;

    this.messagesContainer = this.element.querySelector('#gleam-messages')!;
    this.inputArea = this.element.querySelector('.gleam-input-area')!;
    this.textarea = this.element.querySelector('#gleam-textarea') as HTMLTextAreaElement;
    this.sendButton = this.element.querySelector('#gleam-send-button') as HTMLButtonElement;
    this.providerSelect = this.element.querySelector('#gleam-provider-select') as HTMLSelectElement;
    this.modelSelect = this.element.querySelector('#gleam-model-select') as HTMLSelectElement;
    this.contextToggle = this.element.querySelector('#gleam-context-toggle') as HTMLInputElement;
    this.historyButton = this.element.querySelector('#gleam-history-button') as HTMLButtonElement;
    this.newChatButton = this.element.querySelector('#gleam-new-chat-button') as HTMLButtonElement;
    this.historyPanel = this.element.querySelector('#gleam-history-panel')!;
    
    this.updateEmptyState();
  }

  private async loadConfig() {
    const config = await this.storage.getConfig();
    this.providerSelect.value = config.currentProvider;
    this.contextToggle.checked = config.enableContext;
    await this.loadModels(config.currentProvider);
    if (config.currentModel) {
      this.modelSelect.value = config.currentModel;
    }
  }

  private async loadModels(provider: string) {
    const config = await this.storage.getConfig();
    const providerConfig = provider === 'openrouter' ? config.openrouter : config.siliconflow;
    
    if (!providerConfig.apiKey) {
      this.modelSelect.innerHTML = `<option value="">${this.plugin.i18n.apiKeyRequired}</option>`;
      return;
    }

    const aiProvider = this.providers.get(provider);
    if (!aiProvider) return;

    try {
      const models = await aiProvider.getModels(providerConfig.apiKey);
      this.modelSelect.innerHTML = models.map(model => 
        `<option value="${model}">${model}</option>`
      ).join('');
    } catch (error) {
      Logger.error('Failed to load models:', error);
    }
  }

  private async loadHistory() {
    const history = await this.storage.getHistory();
    if (history.length === 0) {
      this.showNoMessages();
      return;
    }
  }

  private showNoMessages() {
    this.updateEmptyState();
  }

  private updateEmptyState() {
    if (this.currentMessages.length === 0) {
      this.messagesContainer.innerHTML = `
        <div class="gleam-empty-state">
          <div class="gleam-empty-icon">💬</div>
          <div class="gleam-empty-title">${this.plugin.i18n.emptyTitle || '开始新的对话'}</div>
          <div class="gleam-empty-description">${this.plugin.i18n.emptyDescription || '在下方输入框中输入消息，开始与 AI 对话'}</div>
        </div>
      `;
    }
  }

  private attachEventListeners() {
    this.sendButton.addEventListener('click', () => this.handleSend());
    this.textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    this.providerSelect.addEventListener('change', async () => {
      await this.loadModels(this.providerSelect.value);
      await this.saveConfig();
    });

    this.modelSelect.addEventListener('change', () => this.saveConfig());
    this.contextToggle.addEventListener('change', () => this.saveConfig());
    this.historyButton.addEventListener('click', () => this.toggleHistory());
    this.newChatButton.addEventListener('click', () => this.newChat());
  }

  private async handleSend() {
    const message = this.textarea.value.trim();
    if (!message || this.isLoading) return;

    const config = await this.storage.getConfig();
    const providerConfig = config.currentProvider === 'openrouter' 
      ? config.openrouter 
      : config.siliconflow;

    if (!providerConfig.apiKey) {
      this.showError(this.plugin.i18n.apiKeyRequired);
      return;
    }

    if (!config.currentModel) {
      this.showError(this.plugin.i18n.selectModel);
      return;
    }

    this.isLoading = true;
    this.sendButton.disabled = true;
    this.textarea.disabled = true;

    this.addMessage('user', message);
    this.textarea.value = '';

    const assistantMessageId = this.addMessage('assistant', '');
    const assistantElement = this.messagesContainer.querySelector(`[data-message-id="${assistantMessageId}"]`) as HTMLElement;
    const contentElement = assistantElement.querySelector('.gleam-message-content') as HTMLElement;

    try {
      let messages: ChatMessage[] = [...this.currentMessages, { role: 'user', content: message }];

      if (config.enableContext && !this.hasContextInjected) {
        Logger.log('[ChatPanel] 上下文注入已启用，开始获取文档内容');
        const documentContent = await this.contextInjector.getCurrentDocumentContent();
        if (documentContent) {
          const contextPrompt = this.contextInjector.buildContextPrompt(documentContent);
          messages = [
            { role: 'system', content: contextPrompt },
            ...messages
          ];
          this.hasContextInjected = true; // 标记已注入上下文
          Logger.log('[ChatPanel] 上下文注入成功，消息数量:', messages.length);
          Logger.log('[ChatPanel] 消息结构:', messages.map(m => ({ role: m.role, contentLength: m.content.length })));
        } else {
          Logger.warn('[ChatPanel] 上下文注入已启用但未获取到文档内容');
        }
      } else if (config.enableContext && this.hasContextInjected) {
        Logger.log('[ChatPanel] 上下文已在本次对话中注入过，跳过重复注入');
      } else {
        Logger.log('[ChatPanel] 上下文注入未启用');
      }

      const aiProvider = this.providers.get(config.currentProvider);
      if (!aiProvider) {
        throw new Error('Provider not found');
      }

      let fullContent = '';
      const requestOptions: any = {
        messages,
        model: config.currentModel,
        stream: true,
        temperature: 0.7,
        apiKey: providerConfig.apiKey
      };

      await aiProvider.chat(
        requestOptions,
        (chunk: string) => {
          fullContent += chunk;
          // 使用 Markdown 渲染
          const html = this.renderMarkdown(fullContent);
          contentElement.innerHTML = html;
          this.scrollToBottom();
        }
      );

      this.currentMessages.push({ role: 'user', content: message });
      this.currentMessages.push({ role: 'assistant', content: fullContent });

      await this.saveCurrentChat();
    } catch (error: any) {
      this.showError(error.message || this.plugin.i18n.unknownError);
      assistantElement.remove();
    } finally {
      this.isLoading = false;
      this.sendButton.disabled = false;
      this.textarea.disabled = false;
      this.textarea.focus();
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string): string {
    // 清除空状态显示
    if (this.messagesContainer.querySelector('.gleam-empty-state')) {
      this.messagesContainer.innerHTML = '';
    }

    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const messageElement = document.createElement('div');
    messageElement.className = `gleam-message gleam-message-${role}`;
    messageElement.setAttribute('data-message-id', messageId);

    const time = new Date().toLocaleTimeString();
    // 如果是助手消息，使用 Markdown 渲染；用户消息使用纯文本
    const contentHtml = role === 'assistant' ? this.renderMarkdown(content) : this.escapeHtml(content);
    messageElement.innerHTML = `
      <div class="gleam-message-content">${contentHtml}</div>
      <div class="gleam-message-time">${time}</div>
    `;

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    return messageId;
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 将 Markdown 文本渲染为 HTML
   */
  private renderMarkdown(markdown: string): string {
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
      Logger.error('[ChatPanel] Markdown 渲染失败:', error);
      // 降级到简单渲染
      return this.simpleMarkdownRender(markdown);
    }
  }

  /**
   * 简单的 Markdown 渲染（降级方案）
   */
  private simpleMarkdownRender(markdown: string): string {
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

  private scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private showError(message: string) {
    const errorElement = document.createElement('div');
    errorElement.className = 'gleam-error';
    errorElement.textContent = message;
    this.messagesContainer.appendChild(errorElement);
    this.scrollToBottom();
    setTimeout(() => errorElement.remove(), 5000);
  }

  private async saveConfig() {
    const config = await this.storage.getConfig();
    config.currentProvider = this.providerSelect.value as any;
    config.currentModel = this.modelSelect.value;
    config.enableContext = this.contextToggle.checked;
    await this.storage.saveConfig(config);
    await Logger.updateEnabled();
  }

  private async saveCurrentChat() {
    if (this.currentMessages.length === 0) return;

    const title = this.currentMessages[0]?.content?.substring(0, 50) || 'New Chat';
    const historyItem = {
      id: `chat-${Date.now()}`,
      title,
      messages: [...this.currentMessages],
      timestamp: Date.now()
    };

    await this.storage.addHistoryItem(historyItem);
  }

  private toggleHistory() {
    this.historyPanel.classList.toggle('show');
    if (this.historyPanel.classList.contains('show')) {
      this.loadHistoryList();
    }
  }

  private async loadHistoryList() {
    const history = await this.storage.getHistory();
    if (history.length === 0) {
      this.historyPanel.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--b3-theme-on-background); opacity: 0.6;">${this.plugin.i18n.noHistory}</div>`;
      return;
    }

    this.historyPanel.innerHTML = history.map(item => `
      <div class="gleam-history-item" data-id="${item.id}">
        <div class="gleam-history-item-title">${this.escapeHtml(item.title)}</div>
        <div class="gleam-history-item-time">${new Date(item.timestamp).toLocaleString()}</div>
      </div>
    `).join('');

    this.historyPanel.querySelectorAll('.gleam-history-item').forEach(item => {
      item.addEventListener('click', async () => {
        const id = item.getAttribute('data-id');
        if (id) {
          await this.loadChatFromHistory(id);
          this.historyPanel.classList.remove('show');
        }
      });
    });
  }

  private async loadChatFromHistory(id: string) {
    const history = await this.storage.getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;

    this.currentMessages = [...item.messages];
    // 检查是否已有 system 消息（表示已注入上下文）
    if (this.currentMessages.length > 0 && this.currentMessages[0].role === 'system') {
      this.hasContextInjected = true;
    } else {
      this.hasContextInjected = false;
    }
    this.messagesContainer.innerHTML = '';
    item.messages.forEach(msg => {
      if (msg.role !== 'system') {
        this.addMessage(msg.role as 'user' | 'assistant', msg.content);
      }
    });
  }

  async newChat() {
    this.currentMessages = [];
    this.showNoMessages();
  }
}

