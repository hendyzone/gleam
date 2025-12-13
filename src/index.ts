import {
    Plugin,
    Setting
} from "siyuan";
import './index.scss';
import { ChatPanel } from './ui/chatPanel';
import { DataStorage } from './storage/data';
import { Logger } from './utils/logger';
import { OpenRouterProvider } from './api/openrouter';
import { SiliconFlowProvider } from './api/siliconflow';
import { AIProvider } from './api/base';

 

export default class PluginGleam extends Plugin {
    private chatPanel: ChatPanel | null = null;
    private dockElement: HTMLElement | null = null;
    public setting: Setting;
    private storage: DataStorage;
    public i18n: any;
    private providers: Map<string, AIProvider>;


    onload() {
        Logger.init(this);
        Logger.log("onload");
        console.log(this);
        this.storage = new DataStorage(this);
        this.providers = new Map<string, AIProvider>([
            ['openrouter', new OpenRouterProvider()],
            ['siliconflow', new SiliconFlowProvider()]
        ]);
        this.initSetting();
        this.initDock();
    }

    private initSetting() {
        this.setting = new Setting({
            confirmCallback: async () => {
                await this.saveSettings();
            }
        });

        // OpenRouter API Key
        this.setting.addItem({
            title: this.i18n.openrouterApiKey,
            direction: "row",
            description: this.i18n.openrouterApiKey,
            createActionElement: () => {
                const input = document.createElement('input');
                input.type = 'password';
                input.className = 'b3-text-field fn__flex-1';
                input.placeholder = 'sk-...';
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(config => {
                    input.value = config.openrouter.apiKey || '';
                    this.data.openrouterApiKey = input.value;
                });

                input.addEventListener('input', () => {
                    this.data.openrouterApiKey = input.value;
                });

                return input;
            }
        });

        // SiliconFlow API Key
        this.setting.addItem({
            title: this.i18n.siliconflowApiKey,
            direction: "row",
            description: this.i18n.siliconflowApiKey,
            createActionElement: () => {
                const input = document.createElement('input');
                input.type = 'password';
                input.className = 'b3-text-field fn__flex-1';
                input.placeholder = 'sk-...';
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(config => {
                    input.value = config.siliconflow.apiKey || '';
                    this.data.siliconflowApiKey = input.value;
                });

                input.addEventListener('input', () => {
                    this.data.siliconflowApiKey = input.value;
                });

                return input;
            }
        });

        // 调试日志开关
        this.setting.addItem({
            title: this.i18n.enableDebugLog || '启用调试日志',
            direction: "row",
            description: this.i18n.enableDebugLog || '启用调试日志',
            createActionElement: () => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'b3-switch';
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(config => {
                    checkbox.checked = config.enableDebugLog || false;
                    this.data.enableDebugLog = checkbox.checked;
                });

                checkbox.addEventListener('change', () => {
                    this.data.enableDebugLog = checkbox.checked;
                });

                return checkbox;
            }
        });

        // 最大历史数量
        this.setting.addItem({
            title: this.i18n.maxHistoryCount || '最大历史数量',
            direction: "row",
            description: this.i18n.maxHistoryCountDesc || '超过此数量的未收藏历史记录将被自动删除',
            createActionElement: () => {
                const input = document.createElement('input');
                input.type = 'number';
                input.className = 'b3-text-field fn__flex-1';
                input.placeholder = '50';
                input.min = '1';
                input.max = '1000';
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(config => {
                    input.value = String(config.maxHistoryCount || 50);
                    this.data.maxHistoryCount = config.maxHistoryCount || 50;
                });

                input.addEventListener('input', () => {
                    const value = parseInt(input.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 1000) {
                        this.data.maxHistoryCount = value;
                    }
                });

                return input;
            }
        });

        // 默认供应商和默认模型需要共享状态
        let defaultProviderSelectRef: HTMLSelectElement | null = null;
        let defaultModelSelectRef: HTMLSelectElement | null = null;
        const pluginInstance = this;
        
        // 加载模型列表的辅助函数
        const loadModelsForProvider = async (provider: string, modelSelect: HTMLSelectElement, currentModel: string) => {
            modelSelect.innerHTML = '<option value="">加载中...</option>';
            modelSelect.disabled = true;

            try {
                const config = await pluginInstance.storage.getConfig();
                const providerConfig = provider === 'openrouter' ? config.openrouter : config.siliconflow;
                
                if (!providerConfig.apiKey) {
                    modelSelect.innerHTML = '<option value="">请先配置API密钥</option>';
                    modelSelect.disabled = true;
                    return;
                }

                const aiProvider = pluginInstance.providers.get(provider);
                if (!aiProvider) {
                    modelSelect.innerHTML = '<option value="">供应商不存在</option>';
                    modelSelect.disabled = true;
                    return;
                }

                const models = await aiProvider.getModels(providerConfig.apiKey);
                modelSelect.innerHTML = '<option value="">请选择模型</option>';
                models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model;
                    option.textContent = model;
                    if (model === currentModel) {
                        option.selected = true;
                    }
                    modelSelect.appendChild(option);
                });
                modelSelect.disabled = false;
            } catch (error) {
                Logger.error('Failed to load models:', error);
                modelSelect.innerHTML = '<option value="">加载失败，请检查API密钥</option>';
                modelSelect.disabled = true;
            }
        };

        // 默认供应商
        this.setting.addItem({
            title: this.i18n.defaultProvider || '默认供应商',
            direction: "row",
            description: this.i18n.defaultProviderDesc || '新建对话时默认使用的供应商',
            createActionElement: () => {
                defaultProviderSelectRef = document.createElement('select');
                defaultProviderSelectRef.className = 'b3-select fn__flex-1';
                
                const openrouterOption = document.createElement('option');
                openrouterOption.value = 'openrouter';
                openrouterOption.textContent = 'OpenRouter';
                defaultProviderSelectRef.appendChild(openrouterOption);
                
                const siliconflowOption = document.createElement('option');
                siliconflowOption.value = 'siliconflow';
                siliconflowOption.textContent = 'SiliconFlow';
                defaultProviderSelectRef.appendChild(siliconflowOption);
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(async (config) => {
                    defaultProviderSelectRef!.value = config.currentProvider || 'openrouter';
                    this.data.defaultProvider = config.currentProvider || 'openrouter';
                    // 加载模型列表
                    if (defaultModelSelectRef) {
                        await loadModelsForProvider(config.currentProvider || 'openrouter', defaultModelSelectRef, config.currentModel || '');
                    }
                });

                defaultProviderSelectRef.addEventListener('change', async () => {
                    this.data.defaultProvider = defaultProviderSelectRef!.value;
                    // 当供应商改变时，重新加载模型列表
                    if (defaultModelSelectRef) {
                        await loadModelsForProvider(defaultProviderSelectRef!.value, defaultModelSelectRef, '');
                        this.data.defaultModel = ''; // 清空模型选择
                    }
                });

                return defaultProviderSelectRef;
            }
        });

        // 默认模型
        this.setting.addItem({
            title: this.i18n.defaultModel || '默认模型',
            direction: "row",
            description: this.i18n.defaultModelDesc || '新建对话时默认使用的模型（需要先配置对应供应商的API密钥）',
            createActionElement: () => {
                defaultModelSelectRef = document.createElement('select');
                defaultModelSelectRef.className = 'b3-select fn__flex-1';
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(async (config) => {
                    const provider = config.currentProvider || 'openrouter';
                    await loadModelsForProvider(provider, defaultModelSelectRef!, config.currentModel || '');
                    this.data.defaultModel = config.currentModel || '';
                });

                defaultModelSelectRef.addEventListener('change', () => {
                    this.data.defaultModel = defaultModelSelectRef!.value;
                });

                return defaultModelSelectRef;
            }
        });
    }

    private async loadSettings() {
        return await this.storage.getConfig();
    }

    private async saveSettings() {
        const config = await this.storage.getConfig();
        
        if (this.data) {
            if (this.data.openrouterApiKey !== undefined) {
                config.openrouter.apiKey = this.data.openrouterApiKey;
            }
            if (this.data.siliconflowApiKey !== undefined) {
                config.siliconflow.apiKey = this.data.siliconflowApiKey;
            }
            if (this.data.enableDebugLog !== undefined) {
                config.enableDebugLog = this.data.enableDebugLog;
            }
            if (this.data.maxHistoryCount !== undefined) {
                config.maxHistoryCount = Math.max(1, Math.min(1000, this.data.maxHistoryCount || 50));
            }
            if (this.data.defaultProvider !== undefined) {
                config.currentProvider = this.data.defaultProvider as any;
            }
            if (this.data.defaultModel !== undefined) {
                config.currentModel = this.data.defaultModel;
            }
        }

        await this.storage.saveConfig(config);
        await Logger.updateEnabled();
        
        // 应用新的历史数量限制
        await this.storage.applyHistoryLimit();

        if (typeof (window as any).gleamChatPanel?.loadModels === 'function') {
            await (window as any).gleamChatPanel.loadModels(config.currentProvider);
            // 如果设置了默认模型，更新模型选择
            if (config.currentModel && typeof (window as any).gleamChatPanel?.modelSelect !== 'undefined') {
                (window as any).gleamChatPanel.modelSelect.value = config.currentModel;
            }
        }
    }

    private initDock() {
        const dockElement = document.createElement('div');
        dockElement.className = 'fn__flex-1';
        this.dockElement = dockElement;

        this.chatPanel = new ChatPanel(this, dockElement);

        (window as any).gleamChatPanel = this.chatPanel;

        const plugin = this as any;
        if (plugin.addDock) {
            plugin.addDock({
                config: {
                    position: 'RightBottom',
                    size: { width: 300, height: 400 },
                    icon: 'iconSparkles',
                    title: this.i18n?.pluginName || 'Gleam'
                },
                data: {
                    text: ''
                },
                type: 'dock',
                init() {
                    this.element.innerHTML = '';
                    this.element.appendChild(dockElement);
                    // 确保容器有高度
                    if (this.element) {
                        this.element.style.height = '100%';
                        this.element.style.display = 'flex';
                        this.element.style.flexDirection = 'column';
                    }
                },
                resize() {
                    // 当 dock 大小改变时，确保容器高度正确
                    if (this.element && dockElement) {
                        this.element.style.height = '100%';
                    }
                },
                destroy() {
                    // Cleanup if needed
                }
            });
        } else {
            Logger.error('addDock API not available');
        }
    }
}
