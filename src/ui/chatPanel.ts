import { ChatMessage, ModelInfo } from '../utils/types';
import { DataStorage } from '../storage/data';
import { ContextInjector } from '../features/context-injection';
import { OpenRouterProvider } from '../api/openrouter';
import { AIProvider } from '../api/base';
import { Logger } from '../utils/logger';
import { MarkdownRenderer } from './utils/markdown';
import { MessageRenderer } from './components/messageRenderer';
import { ImageHandler } from './components/imageHandler';
import { AudioHandler } from './components/audioHandler';
import { HistoryManager } from './components/historyManager';
import { ModelDialog } from './components/modelDialog';

export class ChatPanel {
  private element: HTMLElement;
  private messagesContainer!: HTMLElement;
  private inputArea!: HTMLElement;
  private textarea!: HTMLTextAreaElement;
  private sendButton!: HTMLButtonElement;
  private modelSelect!: HTMLSelectElement;
  private modelButton!: HTMLButtonElement; // 模型选择按钮
  private allModels: string[] = []; // 存储所有模型ID列表（用于兼容）
  private allModelsInfo: ModelInfo[] = []; // 存储所有模型详细信息
  private modelDialog!: ModelDialog; // 模型选择对话框
  private contextToggle!: HTMLInputElement;
  private historyButton!: HTMLButtonElement;
  private newChatButton!: HTMLButtonElement;
  private historyPanel!: HTMLElement;
  private imageInput!: HTMLInputElement; // 文件选择输入框
  private imagePreviewContainer!: HTMLElement; // 附件预览容器
  private selectedImages: string[] = []; // 已选择的图片（base64 或 URL）
  private selectedAudio: Array<{ name: string; data: string; format: string }> = []; // 已选择的音频（包含文件名、base64数据和格式）

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
      ['openrouter', new OpenRouterProvider()]
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
          <div class="gleam-image-preview" id="gleam-image-preview"></div>
          <div class="gleam-input-wrapper">
            <input type="file" class="gleam-image-input" id="gleam-image-input" accept="image/*,audio/*" multiple style="display: none;">
            <button class="gleam-image-button" id="gleam-image-button" title="添加文件">🧷</button>
            <textarea class="gleam-textarea" id="gleam-textarea" placeholder="${this.plugin.i18n.inputPlaceholder}"></textarea>
            <button class="gleam-send-button" id="gleam-send-button">${this.plugin.i18n.send}</button>
          </div>
          <div class="gleam-controls">
            <button class="gleam-model-button" id="gleam-model-button">
              <span id="gleam-model-button-text">${this.plugin.i18n.selectModel}</span>
              <span class="gleam-model-button-arrow">▼</span>
            </button>
            <select class="gleam-select gleam-model-select-hidden" id="gleam-model-select">
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
    this.modelSelect = this.element.querySelector('#gleam-model-select') as HTMLSelectElement;
    this.modelButton = this.element.querySelector('#gleam-model-button') as HTMLButtonElement;
    this.contextToggle = this.element.querySelector('#gleam-context-toggle') as HTMLInputElement;
    this.historyButton = this.element.querySelector('#gleam-history-button') as HTMLButtonElement;
    this.newChatButton = this.element.querySelector('#gleam-new-chat-button') as HTMLButtonElement;
    this.historyPanel = this.element.querySelector('#gleam-history-panel')!;
    this.imageInput = this.element.querySelector('#gleam-image-input') as HTMLInputElement;
    this.imagePreviewContainer = this.element.querySelector('#gleam-image-preview')!;
    
    // 创建模型选择对话框
    this.modelDialog = new ModelDialog(
      this.plugin.i18n,
      (modelId: string) => {
        this.modelSelect.value = modelId;
        this.updateModelButtonText(modelId);
        this.saveConfig();
      }
    );
    
    this.updateEmptyState();
  }

  private async loadConfig() {
    const config = await this.storage.getConfig();
    this.contextToggle.checked = config.enableContext;
    await this.loadModels('openrouter');
    if (config.currentModel) {
      this.modelSelect.value = config.currentModel;
      this.updateModelButtonText(config.currentModel);
    }
  }

  private async loadModels(provider: string) {
    const config = await this.storage.getConfig();
    const providerConfig = config.openrouter;
    
    // 检查 API key，优先从 config 中获取，如果没有则尝试从 plugin.data 中获取
    let apiKey = providerConfig.apiKey;
    if (!apiKey && (this.plugin as any).data?.openrouterApiKey) {
      apiKey = (this.plugin as any).data.openrouterApiKey;
      // 同步到 config
      providerConfig.apiKey = apiKey;
      await this.storage.saveConfig(config);
    }
    
    if (!apiKey || apiKey.trim() === '') {
      this.modelSelect.innerHTML = `<option value="">${this.plugin.i18n.apiKeyRequired}</option>`;
      this.allModels = [];
      this.allModelsInfo = [];
      this.updateModelButtonText('');
      return;
    }

    const aiProvider = this.providers.get(provider);
    if (!aiProvider) return;

    try {
      // 优先使用 getModelsWithInfo 获取详细信息
      if (typeof (aiProvider as any).getModelsWithInfo === 'function') {
        this.allModelsInfo = await (aiProvider as any).getModelsWithInfo(apiKey);
        this.allModels = this.allModelsInfo.map(m => m.id);
        Logger.log(`Loaded ${this.allModelsInfo.length} models with info`);
      } else {
        // 降级方案：只获取模型ID
        this.allModels = await aiProvider.getModels(apiKey);
        this.allModelsInfo = this.allModels.map(id => ({
          id,
          name: id,
          inputModalities: ['text'],
          outputModalities: ['text']
        }));
        Logger.log(`Loaded ${this.allModels.length} models (fallback)`);
      }
      
      this.modelSelect.innerHTML = this.allModels.map(model => 
        `<option value="${model}">${model}</option>`
      ).join('');
    } catch (error: any) {
      Logger.error('Failed to load models:', error);
      const errorMsg = error?.message || '加载模型失败';
      this.showError(errorMsg);
      this.allModels = [];
      this.allModelsInfo = [];
      this.updateModelButtonText('');
    }
  }

  /**
   * 显示模型选择对话框
   */
  private async showModelDialog() {
    // 如果模型信息为空，尝试重新加载
    if (this.allModelsInfo.length === 0 && this.allModels.length === 0) {
      try {
        await this.loadModels('openrouter');
        // 检查是否是因为 API key 未配置
        const config = await this.storage.getConfig();
        const apiKey = config.openrouter?.apiKey || (this.plugin as any).data?.openrouterApiKey;
        if (!apiKey || apiKey.trim() === '') {
          this.showError(this.plugin.i18n.apiKeyRequired || '请先配置API密钥');
          return;
        }
        // 如果加载后仍然为空，可能是加载失败
        if (this.allModelsInfo.length === 0 && this.allModels.length === 0) {
          this.showError('加载模型失败，请检查API密钥是否正确');
          return;
        }
      } catch (error: any) {
        Logger.error('Failed to load models in dialog:', error);
        this.showError(error?.message || '加载模型失败');
        return;
      }
    }
    
    this.modelDialog.show(this.allModelsInfo, this.modelSelect.value);
  }


  /**
   * 更新模型按钮文本
   */
  private updateModelButtonText(value: string) {
    const buttonText = this.modelButton.querySelector('#gleam-model-button-text') as HTMLElement;
    if (value) {
      buttonText.textContent = value;
    } else {
      buttonText.textContent = this.plugin.i18n.selectModel || '选择模型';
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

    // 图片上传按钮
    const imageButton = this.element.querySelector('#gleam-image-button') as HTMLButtonElement;
    imageButton.addEventListener('click', () => {
      this.imageInput.click();
    });
    
    // 文件选择事件
    this.imageInput.addEventListener('change', async (e) => {
      const input = e.target as HTMLInputElement;
      const files = input.files;
      if (!files || files.length === 0) return;

      // 检查当前模型是否支持文件类型
      const config = await this.storage.getConfig();
      const currentModelInfo = this.allModelsInfo.find(m => m.id === config.currentModel);
      const supportedInputTypes = currentModelInfo?.inputModalities || ['text'];

      const imageFiles: File[] = [];
      const audioFiles: File[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileType = this.getFileTypeFromExtension(file.name);
        
        // 处理图片文件
        if (fileType === 'image') {
          if (!supportedInputTypes.includes('image')) {
            this.showError('当前模型不支持图片类型的文件');
            continue;
          }
          imageFiles.push(file);
          continue;
        }
        
        // 处理音频文件
        if (fileType === 'audio') {
          if (!supportedInputTypes.includes('audio')) {
            this.showError('当前模型不支持音频类型的文件');
            continue;
          }
          audioFiles.push(file);
          continue;
        }
        
        // 其他类型暂时不支持
        const typeName = this.getFileTypeName(fileType);
        if (!supportedInputTypes.includes(fileType)) {
          this.showError(`当前模型不支持${typeName}类型的文件`);
        } else {
          this.showError(`${typeName}类型文件暂不支持，请等待后续更新`);
        }
      }

      // 处理图片文件
      if (imageFiles.length > 0) {
        const images = await ImageHandler.handleImageSelect(
          { target: { files: imageFiles } } as any,
          (msg) => this.showError(msg)
        );
        this.selectedImages.push(...images);
      }

      // 处理音频文件
      if (audioFiles.length > 0) {
        const audio = await AudioHandler.handleAudioSelect(
          audioFiles,
          (msg) => this.showError(msg)
        );
        this.selectedAudio.push(...audio);
      }

      // 更新预览
      this.updateAttachmentPreview();
      
      // 清空 input，允许重复选择同一文件
      input.value = '';
    });

    // 模型选择按钮点击事件
    this.modelButton.addEventListener('click', () => {
      this.showModelDialog();
    });
    
    // 当 select 改变时，更新按钮文本
    this.modelSelect.addEventListener('change', () => {
      this.updateModelButtonText(this.modelSelect.value);
      this.saveConfig();
    });

    this.contextToggle.addEventListener('change', () => this.saveConfig());
    this.historyButton.addEventListener('click', () => this.toggleHistory());
    this.newChatButton.addEventListener('click', () => this.newChat());
  }


  /**
   * 根据文件扩展名获取文件类型
   */
  private getFileTypeFromExtension(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop() || '';
    
    // 图片类型
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'];
    if (imageExts.includes(ext)) return 'image';
    
    // 音频类型
    const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'];
    if (audioExts.includes(ext)) return 'audio';
    
    // 视频类型
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    if (videoExts.includes(ext)) return 'video';
    
    // 文件类型（文本文件等）
    const fileExts = ['txt', 'pdf', 'doc', 'docx', 'md', 'json', 'xml', 'csv'];
    if (fileExts.includes(ext)) return 'file';
    
    // 默认返回 text
    return 'text';
  }

  /**
   * 获取文件类型的显示名称
   */
  private getFileTypeName(fileType: string): string {
    const typeNames: Record<string, string> = {
      image: '图片',
      audio: '音频',
      video: '视频',
      file: '文件',
      text: '文本'
    };
    return typeNames[fileType] || fileType;
  }

  /**
   * 将文件转换为 base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 更新附件预览（包括图片和音频）
   */
  private updateAttachmentPreview() {
    const hasAttachments = this.selectedImages.length > 0 || this.selectedAudio.length > 0;
    
    if (!hasAttachments) {
      this.imagePreviewContainer.innerHTML = '';
      this.imagePreviewContainer.classList.remove('show');
      return;
    }

    this.imagePreviewContainer.classList.add('show');
    let html = '';

    // 渲染图片
    if (this.selectedImages.length > 0) {
      html += this.selectedImages.map((image, index) => `
        <div class="gleam-image-preview-item">
          <img src="${this.escapeHtml(image)}" alt="Preview ${index + 1}">
          <button class="gleam-image-preview-remove" data-type="image" data-index="${index}" title="删除">×</button>
        </div>
      `).join('');
    }

    // 渲染音频
    if (this.selectedAudio.length > 0) {
      html += this.selectedAudio.map((audio, index) => {
        // 为预览生成 data URL（包含前缀，用于 audio 元素播放）
        const audioDataUrl = `data:audio/${audio.format};base64,${audio.data}`;
        return `
        <div class="gleam-image-preview-item gleam-audio-preview-item">
          <audio controls src="${this.escapeHtml(audioDataUrl)}" style="max-width: 200px; height: 32px;"></audio>
          <span class="gleam-audio-name">${this.escapeHtml(audio.name)}</span>
          <button class="gleam-image-preview-remove" data-type="audio" data-index="${index}" title="删除">×</button>
        </div>
      `;
      }).join('');
    }

    this.imagePreviewContainer.innerHTML = html;

    // 添加删除按钮事件
    this.imagePreviewContainer.querySelectorAll('.gleam-image-preview-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const element = e.target as HTMLElement;
        const type = element.getAttribute('data-type');
        const index = parseInt(element.getAttribute('data-index') || '0');
        if (type === 'image') {
          this.selectedImages.splice(index, 1);
        } else if (type === 'audio') {
          this.selectedAudio.splice(index, 1);
        }
        this.updateAttachmentPreview();
      });
    });
  }

  /**
   * 转义 HTML 特殊字符
   */
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private async handleSend() {
    const message = this.textarea.value.trim();
    const hasAttachments = this.selectedImages.length > 0 || this.selectedAudio.length > 0;
    
    if ((!message && !hasAttachments) || this.isLoading) return;

    const config = await this.storage.getConfig();
    const providerConfig = config.openrouter;

    // 检查 API key，优先从 config 中获取，如果没有则尝试从 plugin.data 中获取
    let apiKey = providerConfig.apiKey;
    if (!apiKey && (this.plugin as any).data?.openrouterApiKey) {
      apiKey = (this.plugin as any).data.openrouterApiKey;
      // 同步到 config
      providerConfig.apiKey = apiKey;
      await this.storage.saveConfig(config);
    }

    if (!apiKey || apiKey.trim() === '') {
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

    // 保存当前选择的附件
    const imagesToSend = [...this.selectedImages];
    const audioToSend = this.selectedAudio.map(a => ({ data: a.data, format: a.format }));
    
    await this.addMessage('user', message, imagesToSend, audioToSend);
    this.textarea.value = '';
    this.selectedImages = [];
    this.selectedAudio = [];
    this.updateAttachmentPreview();

    const assistantMessageId = await this.addMessage('assistant', '');
    const assistantElement = this.messagesContainer.querySelector(`[data-message-id="${assistantMessageId}"]`) as HTMLElement;
    const contentElement = assistantElement.querySelector('.gleam-message-content') as HTMLElement;
    
    // 标记消息为流式处理中
    assistantElement.classList.add('gleam-message-streaming');
    this.updateMessageStatus(assistantElement, 'streaming');

    try {
      // 构建用户消息，包含图片和音频
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        images: imagesToSend.length > 0 ? imagesToSend : undefined,
        audio: audioToSend.length > 0 ? audioToSend : undefined
      };
      let messages: ChatMessage[] = [...this.currentMessages, userMessage];

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
        apiKey: apiKey
      };

      // 检查当前模型是否支持图片输出
      const currentModelInfo = this.allModelsInfo.find(m => m.id === config.currentModel);
      const supportsImageOutput = currentModelInfo?.outputModalities?.includes('image') || false;
      
      const imageUrls: string[] = [];
      await aiProvider.chat(
        requestOptions,
        (chunk: string) => {
          // 检查是否是图片标记
          const imageMatch = chunk.match(/\[IMAGE:(.+?)\]/);
          if (imageMatch) {
            const imageUrl = imageMatch[1];
            if (!imageUrls.includes(imageUrl)) {
              imageUrls.push(imageUrl);
            }
            // 从内容中移除图片标记
            fullContent = fullContent.replace(/\[IMAGE:.+?\]/g, '');
          } else {
            fullContent += chunk;
          }
          
          // 渲染内容（包括图片）
          const html = MessageRenderer.renderMessageContent(fullContent, imageUrls, supportsImageOutput);
          contentElement.innerHTML = html;
          this.scrollToBottom();
        }
      );

      this.currentMessages.push(userMessage);
      this.currentMessages.push({ 
        role: 'assistant', 
        content: fullContent,
        images: imageUrls.length > 0 ? imageUrls : undefined
      });

      // 标记消息为已完成
      assistantElement.classList.remove('gleam-message-streaming');
      assistantElement.classList.add('gleam-message-completed');
      this.updateMessageStatus(assistantElement, 'completed');

      await this.saveCurrentChat();
    } catch (error: any) {
      this.showError(error.message || this.plugin.i18n.unknownError);
      // 标记消息为错误状态
      if (assistantElement) {
        assistantElement.classList.remove('gleam-message-streaming');
        assistantElement.classList.add('gleam-message-error');
        this.updateMessageStatus(assistantElement, 'error');
      }
    } finally {
      this.isLoading = false;
      this.sendButton.disabled = false;
      this.textarea.disabled = false;
      this.textarea.focus();
    }
  }

  private async addMessage(role: 'user' | 'assistant', content: string, images?: string[], audio?: Array<{ data: string; format: string }>): Promise<string> {
    // 清除空状态显示
    if (this.messagesContainer.querySelector('.gleam-empty-state')) {
      this.messagesContainer.innerHTML = '';
    }

    const messageId = `msg-${Date.now()}-${Math.random()}`;
    const messageElement = document.createElement('div');
    messageElement.className = `gleam-message gleam-message-${role}`;
    messageElement.setAttribute('data-message-id', messageId);

    const time = new Date().toLocaleTimeString();
    
    // 检查模型是否支持图片输出（异步获取，但不阻塞渲染）
    let supportsImageOutput = false;
    try {
      const config = await this.storage.getConfig();
      const currentModelInfo = this.allModelsInfo.find(m => m.id === config.currentModel);
      supportsImageOutput = currentModelInfo?.outputModalities?.includes('image') || false;
    } catch (e) {
      // 忽略错误，使用默认值
    }
    
    // 渲染内容（包括图片和音频）
    const contentHtml = role === 'assistant' 
      ? MessageRenderer.renderMessageContent(content, images || [], supportsImageOutput, audio)
      : MessageRenderer.renderMessageContent(MarkdownRenderer.escapeHtml(content), images || [], false, audio);
    
    // 为助手消息添加复制按钮和状态指示器
    const copyButton = role === 'assistant' 
      ? '<button class="gleam-copy-button" title="复制" data-content="' + MarkdownRenderer.escapeHtml(content) + '">📋</button>'
      : '';
    const statusIndicator = role === 'assistant'
      ? '<div class="gleam-message-status"></div>'
      : '';
    messageElement.innerHTML = `
      <div class="gleam-message-content">
        ${contentHtml}
        ${copyButton}
      </div>
      <div class="gleam-message-footer">
        ${statusIndicator}
        <div class="gleam-message-time">${time}</div>
      </div>
    `;
    
    // 为复制按钮添加事件监听
    if (role === 'assistant') {
      const copyBtn = messageElement.querySelector('.gleam-copy-button') as HTMLButtonElement;
      if (copyBtn) {
        copyBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const textToCopy = copyBtn.getAttribute('data-content') || '';
          await this.copyToClipboard(textToCopy);
        });
      }
    }

    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
    return messageId;
  }


  private scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  /**
   * 更新消息状态指示器
   */
  private updateMessageStatus(messageElement: HTMLElement, status: 'streaming' | 'completed' | 'error') {
    const statusElement = messageElement.querySelector('.gleam-message-status') as HTMLElement;
    if (!statusElement) return;

    // 移除所有状态类
    statusElement.classList.remove('streaming', 'completed', 'error');
    
    // 添加当前状态类
    statusElement.classList.add(status);
    
    // 更新状态文本
    switch (status) {
      case 'streaming':
        statusElement.textContent = '正在输入...';
        statusElement.title = '正在生成回复';
        break;
      case 'completed':
        statusElement.textContent = '✓';
        statusElement.title = '回复完成';
        break;
      case 'error':
        statusElement.textContent = '✗';
        statusElement.title = '生成失败';
        break;
    }
  }

  /**
   * 复制文本到剪贴板
   */
  private async copyToClipboard(text: string): Promise<void> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        Logger.log('[ChatPanel] 文本已复制到剪贴板');
      } else {
        // 降级方案：使用传统方法
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        Logger.log('[ChatPanel] 文本已复制到剪贴板（降级方案）');
      }
    } catch (error) {
      Logger.error('[ChatPanel] 复制失败:', error);
      this.showError('复制失败，请手动复制');
    }
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
    config.currentProvider = 'openrouter';
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
    HistoryManager.renderHistoryList(
      history,
      this.historyPanel,
      this.plugin.i18n,
      async (id: string) => {
        await this.loadChatFromHistory(id);
        this.historyPanel.classList.remove('show');
      },
      async (id: string) => {
        await this.toggleFavorite(id);
        this.loadHistoryList(); // 重新加载历史列表以更新UI
      }
    );
  }

  private async loadChatFromHistory(id: string) {
    const history = await this.storage.getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return;

    this.currentMessages = [...item.messages];
    // 检查是否已有 system 消息（表示已注入上下文）
    this.hasContextInjected = HistoryManager.hasContextInjected(this.currentMessages);
    this.messagesContainer.innerHTML = '';
    for (const msg of item.messages) {
      if (msg.role !== 'system') {
        await this.addMessage(msg.role as 'user' | 'assistant', msg.content, msg.images, msg.audio);
      }
    }
  }

  /**
   * 切换收藏状态
   */
  private async toggleFavorite(id: string): Promise<void> {
    await this.storage.toggleFavorite(id);
  }

  async newChat() {
    this.currentMessages = [];
    this.hasContextInjected = false; // 重置上下文注入标记
    this.selectedImages = []; // 清空已选择的图片
    this.selectedAudio = []; // 清空已选择的音频
    this.updateAttachmentPreview(); // 更新预览
    
    // 切换到默认模型
    const config = await this.storage.getConfig();
    await this.loadModels('openrouter');
    if (config.currentModel) {
      this.modelSelect.value = config.currentModel;
      this.updateModelButtonText(config.currentModel);
    }
    
    // 保存配置（确保UI状态与配置同步）
    await this.saveConfig();
    
    this.showNoMessages();
  }
}

