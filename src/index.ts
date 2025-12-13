import {
    Plugin,
    Setting
} from "siyuan";
import './index.scss';
import { ChatPanel } from './ui/chatPanel';
import { DataStorage } from './storage/data';
import { Logger } from './utils/logger';
import { OpenRouterProvider } from './api/openrouter';
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
            ['openrouter', new OpenRouterProvider()]
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

        // 默认模型
        let defaultModelSelectRef: HTMLSelectElement | null = null;
        const pluginInstance = this;
        
        // 存储所有模型列表（用于搜索）
        let allModelsForSettings: string[] = [];
        
        // 渲染模型列表（用于搜索）
        const renderModelListForSettings = (models: string[], container: HTMLElement, searchInput: HTMLInputElement, select: HTMLSelectElement, currentModel: string) => {
            if (models.length === 0) {
                container.innerHTML = '';
                container.style.display = 'none';
                return;
            }

            container.innerHTML = models.map(model => {
                const isSelected = model === currentModel;
                const escapedModel = model.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
                return `<div class="gleam-model-item ${isSelected ? 'selected' : ''}" data-value="${escapedModel}">${model}</div>`;
            }).join('');
            
            // 添加点击事件
            container.querySelectorAll('.gleam-model-item').forEach(item => {
                item.addEventListener('click', () => {
                    const value = item.getAttribute('data-value') || '';
                    select.value = value;
                    searchInput.value = value;
                    container.style.display = 'none';
                    pluginInstance.data.defaultModel = value;
                });
            });
        };

        // 过滤模型列表
        const filterModelsForSettings = (keyword: string, container: HTMLElement, searchInput: HTMLInputElement, select: HTMLSelectElement) => {
            if (!keyword.trim()) {
                renderModelListForSettings(allModelsForSettings, container, searchInput, select, select.value);
                return;
            }

            const lowerKeyword = keyword.toLowerCase();
            const filtered = allModelsForSettings.filter(model => 
                model.toLowerCase().includes(lowerKeyword)
            );
            renderModelListForSettings(filtered, container, searchInput, select, select.value);
        };

        // 加载模型列表的辅助函数
        const loadModelsForProvider = async (modelSelect: HTMLSelectElement, modelSearchInput: HTMLInputElement, modelListContainer: HTMLElement, currentModel: string) => {
            modelSelect.innerHTML = '<option value="">加载中...</option>';
            modelSelect.disabled = true;
            modelSearchInput.value = '';
            modelListContainer.style.display = 'none';

            try {
                const config = await pluginInstance.storage.getConfig();
                const providerConfig = config.openrouter;
                
                if (!providerConfig.apiKey) {
                    modelSelect.innerHTML = '<option value="">请先配置API密钥</option>';
                    modelSelect.disabled = true;
                    allModelsForSettings = [];
                    renderModelListForSettings([], modelListContainer, modelSearchInput, modelSelect, '');
                    return;
                }

                const aiProvider = pluginInstance.providers.get('openrouter');
                if (!aiProvider) {
                    modelSelect.innerHTML = '<option value="">供应商不存在</option>';
                    modelSelect.disabled = true;
                    allModelsForSettings = [];
                    renderModelListForSettings([], modelListContainer, modelSearchInput, modelSelect, '');
                    return;
                }

                const models = await aiProvider.getModels(providerConfig.apiKey);
                allModelsForSettings = models;
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
                
                // 设置搜索框的值
                if (currentModel) {
                    modelSearchInput.value = currentModel;
                }
                
                // 渲染模型列表
                renderModelListForSettings(models, modelListContainer, modelSearchInput, modelSelect, currentModel);
            } catch (error) {
                Logger.error('Failed to load models:', error);
                modelSelect.innerHTML = '<option value="">加载失败，请检查API密钥</option>';
                modelSelect.disabled = true;
                allModelsForSettings = [];
                renderModelListForSettings([], modelListContainer, modelSearchInput, modelSelect, '');
            }
        };

        // 默认模型（带搜索功能）
        let defaultModelSearchInputRef: HTMLInputElement | null = null;
        let defaultModelListContainerRef: HTMLElement | null = null;
        
        this.setting.addItem({
            title: this.i18n.defaultModel || '默认模型',
            direction: "row",
            description: this.i18n.defaultModelDesc || '新建对话时默认使用的模型（需要先配置对应供应商的API密钥）',
            createActionElement: () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'gleam-model-select-wrapper';
                wrapper.style.position = 'relative';
                wrapper.style.width = '100%';
                
                defaultModelSearchInputRef = document.createElement('input');
                defaultModelSearchInputRef.type = 'text';
                defaultModelSearchInputRef.className = 'gleam-model-search';
                defaultModelSearchInputRef.placeholder = '搜索模型...';
                defaultModelSearchInputRef.style.width = '100%';
                defaultModelSearchInputRef.autocomplete = 'off';
                
                defaultModelSelectRef = document.createElement('select');
                defaultModelSelectRef.className = 'b3-select fn__flex-1';
                
                defaultModelListContainerRef = document.createElement('div');
                defaultModelListContainerRef.className = 'gleam-model-list';
                
                wrapper.appendChild(defaultModelSearchInputRef);
                wrapper.appendChild(defaultModelSelectRef);
                wrapper.appendChild(defaultModelListContainerRef);
                
                if (!this.data) {
                    this.data = {};
                }
                
                this.loadSettings().then(async (config) => {
                    await loadModelsForProvider(defaultModelSelectRef!, defaultModelSearchInputRef!, defaultModelListContainerRef!, config.currentModel || '');
                    this.data.defaultModel = config.currentModel || '';
                });

                defaultModelSelectRef.addEventListener('change', () => {
                    this.data.defaultModel = defaultModelSelectRef!.value;
                    if (defaultModelSearchInputRef) {
                        defaultModelSearchInputRef.value = defaultModelSelectRef!.value;
                    }
                });

                // 搜索功能 - 过滤 select 选项
                defaultModelSearchInputRef.addEventListener('input', (e) => {
                    const keyword = (e.target as HTMLInputElement).value.toLowerCase();
                    if (defaultModelSelectRef) {
                        const options = defaultModelSelectRef.querySelectorAll('option');
                        options.forEach((option, index) => {
                            // 第一个选项（"请选择模型"）始终显示
                            if (index === 0) {
                                return;
                            }
                            
                            if (!keyword || option.textContent?.toLowerCase().includes(keyword)) {
                                (option as HTMLElement).style.display = '';
                            } else {
                                (option as HTMLElement).style.display = 'none';
                            }
                        });
                    }
                    
                    // 同时更新下拉列表（用于点击选择）
                    if (defaultModelListContainerRef && defaultModelSearchInputRef && defaultModelSelectRef) {
                        filterModelsForSettings(keyword, defaultModelListContainerRef, defaultModelSearchInputRef, defaultModelSelectRef);
                        if (keyword && allModelsForSettings.length > 0) {
                            defaultModelListContainerRef.style.display = 'block';
                        } else {
                            defaultModelListContainerRef.style.display = 'none';
                        }
                    }
                });

                defaultModelSearchInputRef.addEventListener('focus', () => {
                    if (defaultModelListContainerRef && allModelsForSettings.length > 0) {
                        defaultModelListContainerRef.style.display = 'block';
                    }
                });

                // 点击外部关闭列表
                document.addEventListener('click', (e) => {
                    if (defaultModelListContainerRef && 
                        defaultModelSearchInputRef && 
                        !defaultModelSearchInputRef.contains(e.target as Node) && 
                        !defaultModelListContainerRef.contains(e.target as Node)) {
                        defaultModelListContainerRef.style.display = 'none';
                    }
                });

                return wrapper;
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
            if (this.data.enableDebugLog !== undefined) {
                config.enableDebugLog = this.data.enableDebugLog;
            }
            if (this.data.maxHistoryCount !== undefined) {
                config.maxHistoryCount = Math.max(1, Math.min(1000, this.data.maxHistoryCount || 50));
            }
            if (this.data.defaultModel !== undefined) {
                config.currentModel = this.data.defaultModel;
            }
            // 始终设置为 openrouter
            config.currentProvider = 'openrouter';
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
