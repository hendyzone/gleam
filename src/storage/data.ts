import { PluginData, PluginConfig, ChatHistory } from '../utils/types';

const DEFAULT_CONFIG: PluginData['config'] = {
  openrouter: {
    apiKey: '',
    baseURL: 'https://openrouter.ai/api/v1'
  },
  siliconflow: {
    apiKey: '',
    baseURL: 'https://api.siliconflow.cn/v1'
  },
  currentProvider: 'openrouter',
  currentModel: '',
  enableContext: false
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
      console.error('Failed to load plugin data:', error);
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
      console.error('Failed to save plugin data:', error);
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

