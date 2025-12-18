import {
    Plugin
} from "siyuan";
import "./index.scss";
// import { ChatPanel } from "./ui/chatPanel"; // Phase 1: Commented out
import { DataStorage } from "./storage/data";
import { Logger } from "./utils/logger";
import { OpenRouterProvider } from "./api/openrouter";
import { AIProvider } from "./api/base";
import { SettingsManager } from "./settings/index";
import { ContextInjector } from "./features/context-injection";
import { mountReactApp, unmountReactApp } from "./app/mount";
import { Root } from "react-dom/client";

// 声明编译时注入的全局变量
declare const __BUILD_TIME__: string;


export default class PluginGleam extends Plugin {
    // private chatPanel: ChatPanel | null = null; // Phase 1: Commented out
    private reactRoot: Root | null = null; // Phase 1: Added
    private dockElement: HTMLElement | null = null;
    public setting: any;
    private storage: DataStorage;
    public i18n: any;
    private providers: Map<string, AIProvider>;
    private settingsManager: SettingsManager | null = null;
    private contextInjector: ContextInjector;


    onload() {
        Logger.init(this);
        console.log(`[Gleam] 插件加载成功 - 编译时间: ${__BUILD_TIME__}`);
        Logger.log("onload");
        console.log(this);
        this.storage = new DataStorage(this);
        this.providers = new Map<string, AIProvider>([
            ["openrouter", new OpenRouterProvider()]
        ]);
        this.contextInjector = new ContextInjector(this);
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
        dockElement.className = "fn__flex-1 gleam-react-root";
        this.dockElement = dockElement;

        // Phase 1: Commented out old ChatPanel
        // this.chatPanel = new ChatPanel(this, dockElement);
        // (window as any).gleamChatPanel = this.chatPanel;

        const plugin = this as any;
        const pluginInstance = this; // Save reference for callbacks
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

                    // Phase 1: Mount React app
                    pluginInstance.reactRoot = mountReactApp(dockElement, {
                        plugin: pluginInstance,
                        storage: pluginInstance.storage,
                        providers: pluginInstance.providers,
                        contextInjector: pluginInstance.contextInjector,
                        i18n: pluginInstance.i18n
                    });

                    // Debug: expose React root
                    (window as any).gleamReactRoot = pluginInstance.reactRoot;
                },
                resize() {
                    // 当 dock 大小改变时，确保容器高度正确
                    if (this.element && dockElement) {
                        this.element.style.height = "100%";
                    }
                },
                destroy() {
                    // Phase 1: Unmount React app
                    if (pluginInstance.reactRoot) {
                        unmountReactApp(pluginInstance.reactRoot);
                        pluginInstance.reactRoot = null;
                    }
                }
            });
        } else {
            Logger.error("addDock API not available");
        }
    }

    onunload() {
        // Phase 1: Cleanup React root
        if (this.reactRoot) {
            unmountReactApp(this.reactRoot);
            this.reactRoot = null;
        }
    }
}
