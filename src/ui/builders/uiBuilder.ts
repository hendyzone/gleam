import { ModelDialog } from '../components/modelDialog';
import { ParametersPanel } from '../components/parametersPanel';
import { ModelParameters } from '../../utils/types';

/**
 * UI 构建器
 */
export class UIBuilder {
  /**
   * 创建主 UI 结构
   */
  static createUI(plugin: any): string {
    return `
      <div class="gleam-container">
        <div class="gleam-messages" id="gleam-messages"></div>
        <div class="gleam-history-panel" id="gleam-history-panel"></div>
        <div class="gleam-input-area">
          <div class="gleam-image-preview" id="gleam-image-preview"></div>
          <div class="gleam-input-wrapper">
            <input type="file" class="gleam-image-input" id="gleam-image-input" accept="image/*,audio/*" multiple style="display: none;">
            <button class="gleam-image-button" id="gleam-image-button" title="添加文件">🧷</button>
            <textarea class="gleam-textarea" id="gleam-textarea" placeholder="${plugin.i18n.inputPlaceholder}"></textarea>
            <button class="gleam-send-button" id="gleam-send-button">${plugin.i18n.send}</button>
          </div>
          <div class="gleam-controls">
            <button class="gleam-model-button" id="gleam-model-button">
              <span id="gleam-model-button-text">${plugin.i18n.selectModel}</span>
              <span class="gleam-model-button-arrow">▼</span>
            </button>
            <select class="gleam-select gleam-model-select-hidden" id="gleam-model-select">
              <option value="">${plugin.i18n.selectModel}</option>
            </select>
            <label class="gleam-toggle">
              <input type="checkbox" id="gleam-context-toggle">
              <span>${plugin.i18n.contextInjection}</span>
            </label>
            <button class="gleam-button" id="gleam-parameters-button" title="模型参数">⚙️</button>
            <button class="gleam-button" id="gleam-new-chat-button">${plugin.i18n.newChat || '新建对话'}</button>
            <button class="gleam-button" id="gleam-history-button">${plugin.i18n.history}</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 初始化 UI 元素引用
   */
  static initializeElements(element: HTMLElement): {
    messagesContainer: HTMLElement;
    inputArea: HTMLElement;
    textarea: HTMLTextAreaElement;
    sendButton: HTMLButtonElement;
    modelSelect: HTMLSelectElement;
    modelButton: HTMLButtonElement;
    contextToggle: HTMLInputElement;
    historyButton: HTMLButtonElement;
    newChatButton: HTMLButtonElement;
    parametersButton: HTMLButtonElement;
    historyPanel: HTMLElement;
    imageInput: HTMLInputElement;
    imagePreviewContainer: HTMLElement;
  } {
    return {
      messagesContainer: element.querySelector('#gleam-messages')!,
      inputArea: element.querySelector('.gleam-input-area')!,
      textarea: element.querySelector('#gleam-textarea') as HTMLTextAreaElement,
      sendButton: element.querySelector('#gleam-send-button') as HTMLButtonElement,
      modelSelect: element.querySelector('#gleam-model-select') as HTMLSelectElement,
      modelButton: element.querySelector('#gleam-model-button') as HTMLButtonElement,
      contextToggle: element.querySelector('#gleam-context-toggle') as HTMLInputElement,
      historyButton: element.querySelector('#gleam-history-button') as HTMLButtonElement,
      newChatButton: element.querySelector('#gleam-new-chat-button') as HTMLButtonElement,
      parametersButton: element.querySelector('#gleam-parameters-button') as HTMLButtonElement,
      historyPanel: element.querySelector('#gleam-history-panel')!,
      imageInput: element.querySelector('#gleam-image-input') as HTMLInputElement,
      imagePreviewContainer: element.querySelector('#gleam-image-preview')!
    };
  }

  /**
   * 创建模型选择对话框
   */
  static createModelDialog(
    plugin: any,
    onModelSelect: (modelId: string) => void
  ): ModelDialog {
    return new ModelDialog(
      plugin.i18n,
      onModelSelect
    );
  }

  /**
   * 创建参数配置面板
   */
  static createParametersPanel(
    onSave: (parameters: ModelParameters) => void,
    onClose: () => void
  ): ParametersPanel {
    return new ParametersPanel(
      onSave,
      onClose
    );
  }
}

