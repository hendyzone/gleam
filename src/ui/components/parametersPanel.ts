import { ModelInfo, ModelParameters, SupportedParameter } from "../../utils/types";
import { MarkdownRenderer } from "../utils/markdown";

/**
 * 参数配置面板组件
 */
export class ParametersPanel {
  private panel: HTMLElement;
  private currentModelInfo: ModelInfo | null = null;
  private currentParameters: ModelParameters = {};
  private onSave: (parameters: ModelParameters) => void;
  private onClose: () => void;

  constructor(
    onSave: (parameters: ModelParameters) => void,
    onClose: () => void
  ) {
    this.onSave = onSave;
    this.onClose = onClose;
    this.panel = this.createPanel();
    document.body.appendChild(this.panel);
  }

  /**
   * 创建面板
   */
  private createPanel(): HTMLElement {
    const panel = document.createElement("div");
    panel.className = "gleam-parameters-panel";
    panel.innerHTML = `
      <div class="gleam-parameters-panel-content">
        <div class="gleam-parameters-panel-header">
          <div class="gleam-parameters-panel-title">模型参数配置</div>
          <button class="gleam-parameters-panel-close">&times;</button>
        </div>
        <div class="gleam-parameters-panel-body" id="gleam-parameters-body">
          <div style="padding: 20px; text-align: center; opacity: 0.7;">
            请先选择模型
          </div>
        </div>
        <div class="gleam-parameters-panel-actions">
          <button class="gleam-button" id="gleam-parameters-reset">重置为默认值</button>
          <button class="gleam-button" id="gleam-parameters-cancel">取消</button>
          <button class="gleam-button" id="gleam-parameters-save">保存</button>
        </div>
      </div>
    `;

    // 关闭按钮事件
    const closeBtn = panel.querySelector(".gleam-parameters-panel-close") as HTMLButtonElement;
    closeBtn.addEventListener("click", () => this.hide());

    // 取消按钮
    const cancelBtn = panel.querySelector("#gleam-parameters-cancel") as HTMLButtonElement;
    cancelBtn.addEventListener("click", () => this.hide());

    // 保存按钮
    const saveBtn = panel.querySelector("#gleam-parameters-save") as HTMLButtonElement;
    saveBtn.addEventListener("click", () => this.handleSave());

    // 重置按钮
    const resetBtn = panel.querySelector("#gleam-parameters-reset") as HTMLButtonElement;
    resetBtn.addEventListener("click", () => this.handleReset());

    // 点击外部关闭
    panel.addEventListener("click", (e) => {
      if (e.target === panel) {
        this.hide();
      }
    });

    return panel;
  }

  /**
   * 显示面板
   */
  show(modelInfo: ModelInfo | null, currentParameters: ModelParameters = {}): void {
    this.currentModelInfo = modelInfo;
    this.currentParameters = { ...currentParameters };
    this.render();
    this.panel.classList.add("show");
  }

  /**
   * 隐藏面板
   */
  hide(): void {
    this.panel.classList.remove("show");
    this.onClose();
  }

  /**
   * 渲染参数配置界面
   */
  private render(): void {
    const body = this.panel.querySelector("#gleam-parameters-body") as HTMLElement;
    
    if (!this.currentModelInfo) {
      body.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.7;">请先选择模型</div>';
      return;
    }

    const supportedParams = this.currentModelInfo.supportedParameters || [];
    const defaultParams = this.currentModelInfo.defaultParameters || {};

    if (supportedParams.length === 0) {
      body.innerHTML = '<div style="padding: 20px; text-align: center; opacity: 0.7;">该模型不支持自定义参数</div>';
      return;
    }

    // 参数配置映射
    const paramConfig: Record<SupportedParameter, { label: string; type: string; min?: number; max?: number; step?: number; placeholder?: string }> = {
      temperature: { label: "Temperature", type: "number", min: 0, max: 2, step: 0.1, placeholder: "0.7" },
      top_p: { label: "Top P", type: "number", min: 0, max: 1, step: 0.01, placeholder: "1.0" },
      top_k: { label: "Top K", type: "number", min: 1, max: 100, step: 1, placeholder: "40" },
      min_p: { label: "Min P", type: "number", min: 0, max: 1, step: 0.01, placeholder: "0.0" },
      top_a: { label: "Top A", type: "number", min: 0, max: 1, step: 0.01, placeholder: "0.0" },
      frequency_penalty: { label: "Frequency Penalty", type: "number", min: -2, max: 2, step: 0.1, placeholder: "0.0" },
      presence_penalty: { label: "Presence Penalty", type: "number", min: -2, max: 2, step: 0.1, placeholder: "0.0" },
      repetition_penalty: { label: "Repetition Penalty", type: "number", min: 0.1, max: 2, step: 0.1, placeholder: "1.0" },
      max_tokens: { label: "Max Tokens", type: "number", min: 1, max: 100000, step: 1, placeholder: "2048" },
      seed: { label: "Seed", type: "number", min: 0, max: 2147483647, step: 1, placeholder: "随机" },
      logit_bias: { label: "Logit Bias", type: "text", placeholder: "JSON 对象" },
      logprobs: { label: "Logprobs", type: "number", min: 0, max: 20, step: 1, placeholder: "0" },
      top_logprobs: { label: "Top Logprobs", type: "number", min: 0, max: 20, step: 1, placeholder: "0" },
      response_format: { label: "Response Format", type: "text", placeholder: "JSON 对象" },
      structured_outputs: { label: "Structured Outputs", type: "text", placeholder: "JSON 对象" },
      stop: { label: "Stop Sequences", type: "text", placeholder: "用逗号分隔" },
      tools: { label: "Tools", type: "text", placeholder: "JSON 数组" },
      tool_choice: { label: "Tool Choice", type: "text", placeholder: "auto/none/required" },
      parallel_tool_calls: { label: "Parallel Tool Calls", type: "checkbox" },
      include_reasoning: { label: "Include Reasoning", type: "checkbox" },
      reasoning: { label: "Reasoning", type: "text", placeholder: "JSON 对象" },
      web_search_options: { label: "Web Search Options", type: "text", placeholder: "JSON 对象" },
      verbosity: { label: "Verbosity", type: "text", placeholder: "low/medium/high" }
    };

    const html = supportedParams.map(param => {
      const config = paramConfig[param];
      if (!config) return "";

      const paramKey = `param-${param}`;
      const defaultValue = defaultParams[param as keyof typeof defaultParams];
      const currentValue = this.currentParameters[param as keyof ModelParameters];
      const displayValue = currentValue !== undefined ? currentValue : (defaultValue !== undefined ? defaultValue : "");

      if (config.type === "checkbox") {
        const checked = currentValue !== undefined ? currentValue : (defaultValue !== undefined ? defaultValue : false);
        return `
          <div class="gleam-parameter-field">
            <label class="gleam-parameter-label">
              <input type="checkbox" id="${paramKey}" ${checked ? "checked" : ""}>
              <span>${config.label}</span>
            </label>
            <div class="gleam-parameter-description">${param}</div>
          </div>
        `;
      } else if (config.type === "text") {
        return `
          <div class="gleam-parameter-field">
            <label class="gleam-parameter-label" for="${paramKey}">${config.label}</label>
            <input type="text" id="${paramKey}" class="gleam-parameter-input" 
                   value="${MarkdownRenderer.escapeHtml(String(displayValue || ""))}" 
                   placeholder="${config.placeholder || ""}">
            <div class="gleam-parameter-description">${param}</div>
          </div>
        `;
      } else {
        return `
          <div class="gleam-parameter-field">
            <label class="gleam-parameter-label" for="${paramKey}">${config.label}</label>
            <input type="number" id="${paramKey}" class="gleam-parameter-input" 
                   value="${displayValue !== undefined ? displayValue : ""}" 
                   ${config.min !== undefined ? `min="${config.min}"` : ""}
                   ${config.max !== undefined ? `max="${config.max}"` : ""}
                   ${config.step !== undefined ? `step="${config.step}"` : ""}
                   placeholder="${config.placeholder || ""}">
            <div class="gleam-parameter-description">${param}</div>
          </div>
        `;
      }
    }).join("");

    body.innerHTML = html || '<div style="padding: 20px; text-align: center; opacity: 0.7;">该模型不支持自定义参数</div>';
  }

  /**
   * 处理保存
   */
  private handleSave(): void {
    if (!this.currentModelInfo) return;

    const supportedParams = this.currentModelInfo.supportedParameters || [];
    const parameters: ModelParameters = {};

    supportedParams.forEach(param => {
      const paramKey = `param-${param}`;
      const input = this.panel.querySelector(`#${paramKey}`) as HTMLInputElement;
      
      if (!input) return;

      if (input.type === "checkbox") {
        if (input.checked) {
          parameters[param] = true;
        }
      } else if (input.type === "text") {
        const value = input.value.trim();
        if (value) {
          // 尝试解析 JSON（如果是 JSON 格式）
          if (value.startsWith("{") || value.startsWith("[")) {
            try {
              parameters[param] = JSON.parse(value);
            } catch {
              // 如果不是有效的 JSON，作为字符串保存
              if (param === "stop") {
                // stop 参数可能是逗号分隔的字符串
                parameters[param] = value.split(",").map(s => s.trim()).filter(s => s);
              } else {
                parameters[param] = value;
              }
            }
          } else if (param === "stop") {
            // stop 参数可能是逗号分隔的字符串
            parameters[param] = value.split(",").map(s => s.trim()).filter(s => s);
          } else {
            parameters[param] = value;
          }
        }
      } else if (input.type === "number") {
        const value = parseFloat(input.value);
        if (!isNaN(value)) {
          parameters[param] = value;
        }
      }
    });

    this.onSave(parameters);
    this.hide();
  }

  /**
   * 处理重置
   */
  private handleReset(): void {
    if (!this.currentModelInfo) return;

    const defaultParams = this.currentModelInfo.defaultParameters || {};
    this.currentParameters = { ...defaultParams };
    this.render();
  }

  /**
   * 销毁面板
   */
  destroy(): void {
    this.panel.remove();
  }
}

