import { ModelInfo } from '../../utils/types';
import { DataStorage } from '../../storage/data';
import { AIProvider } from '../../api/base';
import { Logger } from '../../utils/logger';

/**
 * 配置和模型管理处理器
 */
export class ConfigHandler {
  constructor(
    private storage: DataStorage,
    private providers: Map<string, AIProvider>,
    private plugin: any,
    private allModels: string[],
    private allModelsInfo: ModelInfo[]
  ) {}

  /**
   * 加载配置
   */
  async loadConfig(): Promise<{ enableContext: boolean; currentModel?: string }> {
    const config = await this.storage.getConfig();
    await this.loadModels('openrouter');
    return {
      enableContext: config.enableContext,
      currentModel: config.currentModel
    };
  }

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
    
    if (!apiKey || apiKey.trim() === '') {
      this.allModels.length = 0;
      this.allModelsInfo.length = 0;
      return;
    }

    const aiProvider = this.providers.get(provider);
    if (!aiProvider) return;

    try {
      // 优先使用 getModelsWithInfo 获取详细信息
      if (typeof (aiProvider as any).getModelsWithInfo === 'function') {
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
          inputModalities: ['text'],
          outputModalities: ['text']
        })));
        Logger.log(`Loaded ${this.allModels.length} models (fallback)`);
      }
    } catch (error: any) {
      Logger.error('Failed to load models:', error);
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
    return apiKey || '';
  }
}

