import {
    Plugin,
    Setting
} from "siyuan";
import './index.scss';
import { ChatPanel } from './ui/chatPanel';
import { DataStorage } from './storage/data';
import { Logger } from './utils/logger';

 

export default class PluginGleam extends Plugin {
    private chatPanel: ChatPanel | null = null;
    private dockElement: HTMLElement | null = null;
    public setting: Setting;
    private storage: DataStorage;
    public i18n: any;


    onload() {
        Logger.init(this);
        Logger.log("onload");
        console.log(this);
        this.storage = new DataStorage(this);
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
        }

        await this.storage.saveConfig(config);
        await Logger.updateEnabled();
        
        // 应用新的历史数量限制
        await this.storage.applyHistoryLimit();

        if (typeof (window as any).gleamChatPanel?.loadModels === 'function') {
            await (window as any).gleamChatPanel.loadModels(config.currentProvider);
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
