import { PluginData, PluginConfig, ChatHistory } from '../utils/types';
import { Logger } from '../utils/logger';

const DEFAULT_CONFIG: PluginData['config'] = {
  openrouter: {
    apiKey: '',
    baseURL: 'https://openrouter.ai/api/v1'
  },
  currentProvider: 'openrouter',
  currentModel: '',
  enableContext: false,
  enableDebugLog: false,
  maxHistoryCount: 50 // 默认最大历史数量
};

export class DataStorage {
  private plugin: any;

  constructor(plugin: any) {
    this.plugin = plugin;
  }

  async getData(): Promise<PluginData> {
    try {
      const data = await this.plugin.loadData('data.json');
      if (data) {
        return {
          config: { ...DEFAULT_CONFIG, ...data.config },
          history: data.history || []
        };
      }
    } catch (error) {
      Logger.error('Failed to load plugin data:', error);
    }
    return {
      config: { ...DEFAULT_CONFIG },
      history: []
    };
  }

  async saveData(data: PluginData): Promise<void> {
    try {
      await this.plugin.saveData('data.json', data);
    } catch (error) {
      Logger.error('Failed to save plugin data:', error);
      throw error;
    }
  }

  async getConfig(): Promise<PluginData['config']> {
    const data = await this.getData();
    return data.config;
  }

  async saveConfig(config: PluginData['config']): Promise<void> {
    const data = await this.getData();
    data.config = config;
    await this.saveData(data);
  }

  async getHistory(): Promise<ChatHistory[]> {
    const data = await this.getData();
    return data.history;
  }

  async saveHistory(history: ChatHistory[]): Promise<void> {
    const data = await this.getData();
    data.history = history;
    await this.saveData(data);
  }

  async addHistoryItem(item: ChatHistory): Promise<void> {
    const history = await this.getHistory();
    history.unshift(item);
    await this.saveHistory(history);
    // 应用历史数量限制
    await this.applyHistoryLimit();
  }

  /**
   * 应用历史数量限制，删除超过数量的未收藏记录
   */
  async applyHistoryLimit(): Promise<void> {
    const config = await this.getConfig();
    const maxCount = config.maxHistoryCount || 50;
    const history = await this.getHistory();
    
    // 分离已收藏和未收藏的记录
    const favorites = history.filter(item => item.isFavorite);
    const nonFavorites = history.filter(item => !item.isFavorite);
    
    // 只对未收藏的记录应用数量限制
    const limitedNonFavorites = nonFavorites.slice(0, maxCount);
    
    // 合并：已收藏的记录 + 限制后的未收藏记录
    const newHistory = [...favorites, ...limitedNonFavorites];
    
    // 按时间戳排序（最新的在前）
    newHistory.sort((a, b) => b.timestamp - a.timestamp);
    
    await this.saveHistory(newHistory);
  }

  /**
   * 切换收藏状态
   */
  async toggleFavorite(id: string): Promise<void> {
    const history = await this.getHistory();
    const item = history.find(h => h.id === id);
    if (item) {
      item.isFavorite = !item.isFavorite;
      await this.saveHistory(history);
      // 如果取消收藏，重新应用数量限制
      if (!item.isFavorite) {
        await this.applyHistoryLimit();
      }
    }
  }

  async deleteHistoryItem(id: string): Promise<void> {
    const history = await this.getHistory();
    const filtered = history.filter(item => item.id !== id);
    await this.saveHistory(filtered);
  }

  async clearHistory(): Promise<void> {
    await this.saveHistory([]);
  }
}

