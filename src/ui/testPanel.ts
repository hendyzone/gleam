import { DocumentHelper } from '../utils/documentHelper';
import { Logger } from '../utils/logger';

export class TestPanel {
  private panel!: HTMLElement;
  private plugin: any;
  private documentHelper: DocumentHelper;
  private resultsContainer!: HTMLElement;

  constructor(plugin: any) {
    this.plugin = plugin;
    this.documentHelper = new DocumentHelper(plugin);
    this.createPanel();
  }

  private createPanel() {
    this.panel = document.createElement('div');
    this.panel.className = 'gleam-test-panel';
    this.panel.innerHTML = `
      <div class="gleam-test-header">
        <div class="gleam-test-title">${this.plugin.i18n.testPanel || '文档工具测试'}</div>
        <button class="gleam-test-close" id="gleam-test-close">&times;</button>
      </div>
      <div class="gleam-test-content">
        <div class="gleam-test-buttons">
          <button class="gleam-test-btn" data-test="selectedBlockId">测试获取选中块ID</button>
          <button class="gleam-test-btn" data-test="selectedBlockContent">测试获取选中块内容</button>
          <button class="gleam-test-btn" data-test="selectedText">测试获取选中文本</button>
          <button class="gleam-test-btn" data-test="all">测试所有方法</button>
        </div>
        <div class="gleam-test-results" id="gleam-test-results">
          <div class="gleam-test-placeholder">点击上方按钮开始测试...</div>
        </div>
      </div>
    `;

    document.body.appendChild(this.panel);
    this.resultsContainer = this.panel.querySelector('#gleam-test-results')!;
    this.attachEventListeners();
  }

  private attachEventListeners() {
    const closeButton = this.panel.querySelector('#gleam-test-close');
    closeButton?.addEventListener('click', () => this.hide());

    this.panel.addEventListener('click', (e) => {
      if (e.target === this.panel) {
        this.hide();
      }
    });

    const testButtons = this.panel.querySelectorAll('.gleam-test-btn');
    testButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const testType = (e.target as HTMLElement).getAttribute('data-test');
        if (testType) {
          await this.runTest(testType);
        }
      });
    });
  }

  private async runTest(testType: string) {
    this.resultsContainer.innerHTML = '<div class="gleam-test-loading">测试中...</div>';

    try {
      if (testType === 'all') {
        await this.runAllTests();
      } else {
        await this.runSingleTest(testType);
      }
    } catch (error: any) {
      this.showError('测试失败: ' + (error.message || String(error)));
    }
  }

  private async runSingleTest(testType: string) {
    const startTime = Date.now();
    let result: any = null;
    let error: any = null;

    try {
      switch (testType) {
        case 'selectedBlockId':
          result = this.documentHelper.getSelectedBlockId();
          break;
        case 'selectedBlockContent':
          result = await this.documentHelper.getSelectedBlockContent();
          break;
        case 'selectedText':
          result = this.documentHelper.getSelectedText();
          break;
      }
    } catch (e) {
      error = e;
    }

    const duration = Date.now() - startTime;
    this.displayResult(testType, result, error, duration);
  }

  private async runAllTests() {
    const results: Array<{ name: string; result: any; error: any; duration: number }> = [];

    const tests = [
      { key: 'selectedBlockId', method: () => this.documentHelper.getSelectedBlockId() },
      { key: 'selectedBlockContent', method: () => this.documentHelper.getSelectedBlockContent() },
      { key: 'selectedText', method: () => this.documentHelper.getSelectedText() }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      let result: any = null;
      let error: any = null;

      try {
        result = await test.method();
      } catch (e) {
        error = e;
      }

      const duration = Date.now() - startTime;
      results.push({
        name: test.key,
        result,
        error,
        duration
      });
    }

    this.displayAllResults(results);
  }

  private displayResult(testType: string, result: any, error: any, duration: number) {
    const testNames: Record<string, string> = {
      selectedBlockId: '获取选中块ID',
      selectedBlockContent: '获取选中块内容',
      selectedText: '获取选中文本'
    };

    const html = `
      <div class="gleam-test-result-item">
        <div class="gleam-test-result-header">
          <span class="gleam-test-result-name">${testNames[testType] || testType}</span>
          <span class="gleam-test-result-status ${error ? 'error' : 'success'}">
            ${error ? '❌ 失败' : '✅ 成功'}
          </span>
          <span class="gleam-test-result-duration">${duration}ms</span>
        </div>
        ${error ? `
          <div class="gleam-test-result-error">
            <strong>错误:</strong> ${this.formatError(error)}
          </div>
        ` : ''}
        <div class="gleam-test-result-content">
          <strong>结果:</strong>
          <pre>${this.formatResult(result)}</pre>
        </div>
      </div>
    `;

    this.resultsContainer.innerHTML = html;
  }

  private displayAllResults(results: Array<{ name: string; result: any; error: any; duration: number }>) {
    const testNames: Record<string, string> = {
      selectedBlockId: '获取选中块ID',
      selectedBlockContent: '获取选中块内容',
      selectedText: '获取选中文本'
    };

    const html = results.map(r => `
      <div class="gleam-test-result-item">
        <div class="gleam-test-result-header">
          <span class="gleam-test-result-name">${testNames[r.name] || r.name}</span>
          <span class="gleam-test-result-status ${r.error ? 'error' : 'success'}">
            ${r.error ? '❌ 失败' : '✅ 成功'}
          </span>
          <span class="gleam-test-result-duration">${r.duration}ms</span>
        </div>
        ${r.error ? `
          <div class="gleam-test-result-error">
            <strong>错误:</strong> ${this.formatError(r.error)}
          </div>
        ` : ''}
        <div class="gleam-test-result-content">
          <strong>结果:</strong>
          <pre>${this.formatResult(r.result)}</pre>
        </div>
      </div>
    `).join('');

    this.resultsContainer.innerHTML = html;
  }

  private formatResult(result: any): string {
    if (result === null || result === undefined) {
      return 'null';
    }
    if (typeof result === 'string') {
      if (result.length > 500) {
        return result.substring(0, 500) + '\n...(内容过长，已截断)';
      }
      return result;
    }
    return JSON.stringify(result, null, 2);
  }

  private formatError(error: any): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  private showError(message: string) {
    this.resultsContainer.innerHTML = `
      <div class="gleam-test-result-error">
        ${message}
      </div>
    `;
  }

  show() {
    this.panel.classList.add('show');
  }

  hide() {
    this.panel.classList.remove('show');
  }
}

