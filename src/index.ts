import {
    Plugin
} from "siyuan";
import "./index.scss";
import { ChatPanel } from "./ui/chatPanel";
import { DataStorage } from "./storage/data";
import { Logger } from "./utils/logger";
import { OpenRouterProvider } from "./api/openrouter";
import { AIProvider } from "./api/base";
import { SettingsManager } from "./settings/index";

 

export default class PluginGleam extends Plugin {
    private chatPanel: ChatPanel | null = null;
    private dockElement: HTMLElement | null = null;
    public setting: any;
    private storage: DataStorage;
    public i18n: any;
    private providers: Map<string, AIProvider>;
    private settingsManager: SettingsManager | null = null;


    onload() {
        Logger.init(this);
        Logger.log("onload");
        console.log(this);
        this.storage = new DataStorage(this);
        this.providers = new Map<string, AIProvider>([
            ["openrouter", new OpenRouterProvider()]
        ]);
        this.initSetting();
        this.initDock();
    }

    private initSetting() {
        this.settingsManager = new SettingsManager(this, this.storage, this.providers);
        this.settingsManager.init();
        this.setting = this.settingsManager.getSetting();
    }


    private initDock() {
        const dockElement = document.createElement("div");
        dockElement.className = "fn__flex-1";
        this.dockElement = dockElement;

        this.chatPanel = new ChatPanel(this, dockElement);

        (window as any).gleamChatPanel = this.chatPanel;

        const plugin = this as any;
        if (plugin.addDock) {
            plugin.addDock({
                config: {
                    position: "RightBottom",
                    size: { width: 300, height: 400 },
                    icon: "iconSparkles",
                    title: this.i18n?.pluginName || "Gleam"
                },
                data: {
                    text: ""
                },
                type: "dock",
                init() {
                    this.element.innerHTML = "";
                    this.element.appendChild(dockElement);
                    // 确保容器有高度
                    if (this.element) {
                        this.element.style.height = "100%";
                        this.element.style.display = "flex";
                        this.element.style.flexDirection = "column";
                    }
                },
                resize() {
                    // 当 dock 大小改变时，确保容器高度正确
                    if (this.element && dockElement) {
                        this.element.style.height = "100%";
                    }
                },
                destroy() {
                    // Cleanup if needed
                }
            });
        } else {
            Logger.error("addDock API not available");
        }
    }
}
