import { DataStorage } from '../../storage/data';
import { ConfigHandler } from '../handlers/configHandler';
import { Logger } from '../../utils/logger';
import { ModelDialog } from '../components/modelDialog';

/**
 * 配置管理器
 */
export class ConfigManager {
  private modelDialog?: ModelDialog;

  constructor(
    private storage: DataStorage,
    private configHandler: ConfigHandler,
    private modelSelect: HTMLSelectElement,
    private modelButton: HTMLButtonElement,
    private contextToggle: HTMLInputElement,
    private plugin: any,
    private onError: (message: string) => void
  ) {}

  /**
   * 设置模型对话框
   */
  setModelDialog(dialog: ModelDialog): void {
    this.modelDialog = dialog;
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<void> {
    const config = await this.storage.getConfig();
    this.contextToggle.checked = config.enableContext;
    await this.loadModels('openrouter');
    if (config.currentModel) {
      this.modelSelect.value = config.currentModel;
      this.updateModelButtonText(config.currentModel);
    }
  }

  /**
   * 加载模型列表
   */
  async loadModels(provider: string): Promise<void> {
    try {
      await this.configHandler.loadModels(provider);
      this.modelSelect.innerHTML = this.configHandler.getAllModels().map(model => 
        `<option value="${model}">${model}</option>`
      ).join('');
    } catch (error: any) {
      Logger.error('Failed to load models:', error);
      const errorMsg = error?.message || '加载模型失败';
      this.onError(errorMsg);
      this.modelSelect.innerHTML = `<option value="">${this.plugin.i18n.apiKeyRequired}</option>`;
      this.updateModelButtonText('');
    }
  }

  /**
   * 保存配置
   */
  async saveConfig(): Promise<void> {
    const config = await this.storage.getConfig();
    config.currentProvider = 'openrouter';
    config.currentModel = this.modelSelect.value;
    config.enableContext = this.contextToggle.checked;
    await this.storage.saveConfig(config);
    await Logger.updateEnabled();
  }

  /**
   * 更新模型选择下拉框
   */
  updateModelSelect(): void {
    this.modelSelect.innerHTML = this.configHandler.getAllModels().map(model => 
      `<option value="${model}">${model}</option>`
    ).join('');
  }

  /**
   * 更新模型按钮文本
   */
  updateModelButtonText(value: string): void {
    const buttonText = this.modelButton.querySelector('#gleam-model-button-text') as HTMLElement;
    if (value) {
      buttonText.textContent = value;
    } else {
      buttonText.textContent = this.plugin.i18n.selectModel || '选择模型';
    }
  }

  /**
   * 显示模型选择对话框
   */
  async showModelDialog(): Promise<void> {
    if (!this.modelDialog) return;
    
    // 如果模型信息为空，尝试重新加载
    if (this.configHandler.getAllModelsInfo().length === 0 && this.configHandler.getAllModels().length === 0) {
      try {
        await this.configHandler.loadModels('openrouter');
        // 检查是否是因为 API key 未配置
        const apiKey = await this.configHandler.getApiKey();
        if (!apiKey || apiKey.trim() === '') {
          this.onError(this.plugin.i18n.apiKeyRequired || '请先配置API密钥');
          return;
        }
        // 如果加载后仍然为空，可能是加载失败
        if (this.configHandler.getAllModelsInfo().length === 0 && this.configHandler.getAllModels().length === 0) {
          this.onError('加载模型失败，请检查API密钥是否正确');
          return;
        }
        this.updateModelSelect();
      } catch (error: any) {
        Logger.error('Failed to load models in dialog:', error);
        this.onError(error?.message || '加载模型失败');
        return;
      }
    }
    
    this.modelDialog.show(this.configHandler.getAllModelsInfo(), this.modelSelect.value);
  }
}

