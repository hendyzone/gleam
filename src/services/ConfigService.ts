import { ModelInfo } from "../utils/types";
import { DataStorage } from "../storage/data";
import { AIProvider } from "../api/base";
import { Logger } from "../utils/logger";
import { ModelDialog } from "../ui/components/modelDialog";

/**
 * 配置服务 - 统一管理配置和模型相关的所有操作
 * 合并了原 ConfigHandler 和 ConfigManager 的功能
 */
export class ConfigService {
  private allModels: string[];
  private allModelsInfo: ModelInfo[];
  private modelDialog?: ModelDialog;

  constructor(
    private storage: DataStorage,
    private providers: Map<string, AIProvider>,
    private plugin: any,
    allModels: string[],
    allModelsInfo: ModelInfo[]
  ) {
    this.allModels = allModels;
    this.allModelsInfo = allModelsInfo;
  }

  /**
   * 设置模型对话框
   */
  setModelDialog(dialog: ModelDialog): void {
    this.modelDialog = dialog;
  }

  // ==================== 配置管理 ====================

  /**
   * 加载配置并初始化模型列表
   * @param contextToggle 可选的上下文开关元素
   * @param modelSelect 可选的模型选择元素
   * @param modelButton 可选的模型按钮元素
   */
  async loadConfig(
    contextToggle?: HTMLInputElement,
    modelSelect?: HTMLSelectElement,
    modelButton?: HTMLButtonElement
  ): Promise<{ enableContext: boolean; currentModel?: string }> {
    const config = await this.storage.getConfig();

    // 更新UI（如果提供了元素）
    if (contextToggle) {
      contextToggle.checked = config.enableContext;
    }

    // 加载模型列表
    await this.loadModels("openrouter");

    // 更新模型选择UI
    if (modelSelect && config.currentModel) {
      modelSelect.value = config.currentModel;
    }
    if (modelButton && config.currentModel) {
      this.updateModelButtonText(modelButton, config.currentModel);
    }

    return {
      enableContext: config.enableContext,
      currentModel: config.currentModel
    };
  }

  /**
   * 保存配置
   */
  async saveConfig(
    modelSelect: HTMLSelectElement,
    contextToggle: HTMLInputElement
  ): Promise<void> {
    const config = await this.storage.getConfig();
    config.currentProvider = "openrouter";
    config.currentModel = modelSelect.value;
    config.enableContext = contextToggle.checked;
    await this.storage.saveConfig(config);
    await Logger.updateEnabled();
  }

  // ==================== 模型管理 ====================

  /**
   * 加载模型列表
   */
  async loadModels(provider: string): Promise<void> {
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

    if (!apiKey || apiKey.trim() === "") {
      this.allModels.length = 0;
      this.allModelsInfo.length = 0;
      return;
    }

    const aiProvider = this.providers.get(provider);
    if (!aiProvider) return;

    try {
      // 优先使用 getModelsWithInfo 获取详细信息
      if (typeof (aiProvider as any).getModelsWithInfo === "function") {
        const models = await (aiProvider as any).getModelsWithInfo(apiKey);
        this.allModelsInfo.length = 0;
        this.allModelsInfo.push(...models);
        this.allModels.length = 0;
        this.allModels.push(...models.map((m: ModelInfo) => m.id));
        Logger.log(`Loaded ${this.allModelsInfo.length} models with info`);
      } else {
        // 降级方案：只获取模型ID
        const models = await aiProvider.getModels(apiKey);
        this.allModels.length = 0;
        this.allModels.push(...models);
        this.allModelsInfo.length = 0;
        this.allModelsInfo.push(...models.map((id: string) => ({
          id,
          name: id,
          inputModalities: ["text"],
          outputModalities: ["text"]
        })));
        Logger.log(`Loaded ${this.allModels.length} models (fallback)`);
      }
    } catch (error: any) {
      Logger.error("Failed to load models:", error);
      this.allModels.length = 0;
      this.allModelsInfo.length = 0;
      throw error;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(modelId: string): ModelInfo | undefined {
    return this.allModelsInfo.find(m => m.id === modelId);
  }

  /**
   * 获取所有模型信息
   */
  getAllModelsInfo(): ModelInfo[] {
    return this.allModelsInfo;
  }

  /**
   * 获取所有模型ID
   */
  getAllModels(): string[] {
    return this.allModels;
  }

  /**
   * 获取API密钥
   */
  async getApiKey(): Promise<string> {
    const config = await this.storage.getConfig();
    const providerConfig = config.openrouter;
    let apiKey = providerConfig.apiKey;
    if (!apiKey && (this.plugin as any).data?.openrouterApiKey) {
      apiKey = (this.plugin as any).data.openrouterApiKey;
      providerConfig.apiKey = apiKey;
      await this.storage.saveConfig(config);
    }
    return apiKey || "";
  }

  // ==================== UI 操作 ====================

  /**
   * 更新模型选择下拉框
   */
  updateModelSelect(modelSelect: HTMLSelectElement): void {
    modelSelect.innerHTML = this.allModels.map(model =>
      `<option value="${model}">${model}</option>`
    ).join("");
  }

  /**
   * 更新模型按钮文本
   */
  updateModelButtonText(modelButton: HTMLButtonElement, value: string): void {
    const buttonText = modelButton.querySelector("#gleam-model-button-text") as HTMLElement;
    if (value) {
      buttonText.textContent = value;
    } else {
      buttonText.textContent = this.plugin.i18n.selectModel || "选择模型";
    }
  }

  /**
   * 显示模型选择对话框
   */
  async showModelDialog(
    modelSelect: HTMLSelectElement,
    onError: (message: string) => void
  ): Promise<void> {
    if (!this.modelDialog) return;

    // 如果模型信息为空，尝试重新加载
    if (this.allModelsInfo.length === 0 && this.allModels.length === 0) {
      try {
        await this.loadModels("openrouter");
        // 检查是否是因为 API key 未配置
        const apiKey = await this.getApiKey();
        if (!apiKey || apiKey.trim() === "") {
          onError(this.plugin.i18n.apiKeyRequired || "请先配置API密钥");
          return;
        }
        // 如果加载后仍然为空，可能是加载失败
        if (this.allModelsInfo.length === 0 && this.allModels.length === 0) {
          onError("加载模型失败，请检查API密钥是否正确");
          return;
        }
        this.updateModelSelect(modelSelect);
      } catch (error: any) {
        Logger.error("Failed to load models in dialog:", error);
        onError(error?.message || "加载模型失败");
        return;
      }
    }

    this.modelDialog.show(this.allModelsInfo, modelSelect.value);
  }

  /**
   * 加载模型列表并更新UI（带错误处理）
   */
  async loadModelsWithUI(
    provider: string,
    modelSelect: HTMLSelectElement,
    modelButton: HTMLButtonElement,
    onError: (message: string) => void
  ): Promise<void> {
    try {
      await this.loadModels(provider);
      modelSelect.innerHTML = this.allModels.map(model =>
        `<option value="${model}">${model}</option>`
      ).join("");
    } catch (error: any) {
      Logger.error("Failed to load models:", error);
      const errorMsg = error?.message || "加载模型失败";
      onError(errorMsg);
      modelSelect.innerHTML = `<option value="">${this.plugin.i18n.apiKeyRequired}</option>`;
      this.updateModelButtonText(modelButton, "");
    }
  }
}
