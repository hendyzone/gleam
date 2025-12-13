import {
    Plugin
} from "siyuan";
import './index.scss';
import { ChatPanel } from './ui/chatPanel';
import { SettingsPanel } from './ui/settingsPanel';

 

export default class PluginGleam extends Plugin {
    private chatPanel: ChatPanel | null = null;
    private settingsPanel: SettingsPanel | null = null;
    private dockElement: HTMLElement | null = null;
    public i18n: any;


    onload() {
        console.log("onloa!!!!!!!!!!!!!!!!!!!!");
        this.initDock();
    }

    private initDock() {
        const dockElement = document.createElement('div');
        dockElement.className = 'fn__flex-1';
        this.dockElement = dockElement;

        this.chatPanel = new ChatPanel(this, dockElement);
        this.settingsPanel = new SettingsPanel(this);

        (window as any).gleamChatPanel = this.chatPanel;
        (window as any).gleamSettingsPanel = this.settingsPanel;

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
            console.error('addDock API not available');
        }
    }
}
