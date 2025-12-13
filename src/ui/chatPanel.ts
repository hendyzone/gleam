import { ChatMessage } from '../utils/types';
import { DataStorage } from '../storage/data';
import { ContextInjector } from '../features/context-injection';
import { OpenRouterProvider } from '../api/openrouter';
import { SiliconFlowProvider } from '../api/siliconflow';
import { AIProvider } from '../api/base';
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
          contentElement.textContent = fullContent;
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
    messageElement.innerHTML = `
      <div class="gleam-message-content">${this.escapeHtml(content)}</div>
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

