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
        }

        await this.storage.saveConfig(config);
        await Logger.updateEnabled();

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
                    size: { width: 300, height: 0 },
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
