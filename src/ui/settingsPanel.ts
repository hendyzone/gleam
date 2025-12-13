import { DataStorage } from '../storage/data';
import { Logger } from '../utils/logger';

export class SettingsPanel {
  private panel!: HTMLElement;
  private plugin: any;
  private storage: DataStorage;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.storage = new DataStorage(plugin);
    this.createPanel();
  }

  private createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'gleam-settings-panel';
    this.panel.innerHTML = `
      <div class="gleam-settings-header">
        <div class="gleam-settings-title">${this.plugin.i18n.settings}</div>
        <button class="gleam-settings-close" id="gleam-settings-close">&times;</button>
      </div>
      <div class="gleam-settings-content">
        <div class="gleam-settings-section">
          <div class="gleam-settings-section-title">${this.plugin.i18n.openrouter}</div>
          <div class="gleam-settings-field">
            <label class="gleam-settings-label">${this.plugin.i18n.openrouterApiKey}</label>
            <input type="password" class="gleam-settings-input" id="gleam-openrouter-key" placeholder="sk-...">
          </div>
        </div>
        <div class="gleam-settings-section">
          <div class="gleam-settings-section-title">${this.plugin.i18n.siliconflow}</div>
          <div class="gleam-settings-field">
            <label class="gleam-settings-label">${this.plugin.i18n.siliconflowApiKey}</label>
            <input type="password" class="gleam-settings-input" id="gleam-siliconflow-key" placeholder="sk-...">
          </div>
        </div>
        <div class="gleam-settings-section">
          <div class="gleam-settings-section-title">${this.plugin.i18n.debug || '调试'}</div>
          <div class="gleam-settings-field">
            <label class="gleam-toggle">
              <input type="checkbox" id="gleam-debug-log-toggle">
              <span>${this.plugin.i18n.enableDebugLog || '启用调试日志'}</span>
            </label>
          </div>
        </div>
        <div class="gleam-settings-actions">
          <button class="gleam-button" id="gleam-settings-cancel">${this.plugin.i18n.cancel}</button>
          <button class="gleam-button" id="gleam-settings-save">${this.plugin.i18n.save}</button>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.attachEventListeners();
    this.loadSettings();
  }

  private attachEventListeners() {
    const closeButton = this.panel.querySelector('#gleam-settings-close');
    const cancelButton = this.panel.querySelector('#gleam-settings-cancel');
    const saveButton = this.panel.querySelector('#gleam-settings-save');

    closeButton?.addEventListener('click', () => this.hide());
    cancelButton?.addEventListener('click', () => this.hide());
    saveButton?.addEventListener('click', () => this.saveSettings());

    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });
  }

  private async loadSettings() {
    const config = await this.storage.getConfig();
    const openrouterKeyInput = this.panel.querySelector('#gleam-openrouter-key') as HTMLInputElement;
    const siliconflowKeyInput = this.panel.querySelector('#gleam-siliconflow-key') as HTMLInputElement;
    const debugLogToggle = this.panel.querySelector('#gleam-debug-log-toggle') as HTMLInputElement;

    if (openrouterKeyInput) {
      openrouterKeyInput.value = config.openrouter.apiKey;
    }
    if (siliconflowKeyInput) {
      siliconflowKeyInput.value = config.siliconflow.apiKey;
    }
    if (debugLogToggle) {
      debugLogToggle.checked = config.enableDebugLog || false;
    }
  }

  private async saveSettings() {
    const openrouterKeyInput = this.panel.querySelector('#gleam-openrouter-key') as HTMLInputElement;
    const siliconflowKeyInput = this.panel.querySelector('#gleam-siliconflow-key') as HTMLInputElement;
    const debugLogToggle = this.panel.querySelector('#gleam-debug-log-toggle') as HTMLInputElement;

    const config = await this.storage.getConfig();
    config.openrouter.apiKey = openrouterKeyInput?.value || '';
    config.siliconflow.apiKey = siliconflowKeyInput?.value || '';
    config.enableDebugLog = debugLogToggle?.checked || false;

    await this.storage.saveConfig(config);
    await Logger.updateEnabled();
    this.hide();

    if (typeof (window as any).gleamChatPanel?.loadModels === 'function') {
      await (window as any).gleamChatPanel.loadModels(config.currentProvider);
    }
  }

  show() {
    this.panel.classList.add('show');
    this.loadSettings();
  }

  hide() {
    this.panel.classList.remove('show');
  }
}

