import { ModelInfo } from "../../utils/types";
import { MarkdownRenderer } from "../utils/markdown";
import { Logger } from "../../utils/logger";

/**
 * 模型选择对话框组件
 */
export class ModelDialog {
  private dialog: HTMLElement;
  private searchInput: HTMLInputElement;
  private listContainer: HTMLElement;
  private onSelect: (modelId: string) => void;
  private allModelsInfo: ModelInfo[] = [];
  private currentValue: string = "";
  private selectedInputTypes: Set<string> = new Set();
  private selectedOutputTypes: Set<string> = new Set();

  constructor(
    i18n: any,
    onSelect: (modelId: string) => void
  ) {
    this.onSelect = onSelect;
    this.dialog = this.createDialog(i18n);
    document.body.appendChild(this.dialog);
  }

  /**
   * 创建对话框
   */
  private createDialog(i18n: any): HTMLElement {
    const dialog = document.createElement("div");
    dialog.className = "gleam-model-dialog";
    dialog.innerHTML = `
      <div class="gleam-model-dialog-content">
        <div class="gleam-model-dialog-header">
          <div class="gleam-model-dialog-title">${i18n.selectModel || "选择模型"}</div>
          <button class="gleam-model-dialog-close">&times;</button>
        </div>
        <div class="gleam-model-dialog-search">
          <input type="text" class="gleam-model-dialog-search-input" placeholder="${i18n.searchModel || "搜索模型..."}" autocomplete="off">
        </div>
        <div class="gleam-model-dialog-filters">
          <div class="gleam-model-dialog-filter-group">
            <div class="gleam-model-dialog-filter-label">${i18n.filterInput || "输入类型:"}</div>
            <div class="gleam-model-dialog-filter-options" data-type="input">
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="text">文本</label>
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="image">图片</label>
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="file">文件</label>
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="audio">音频</label>
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="video">视频</label>
            </div>
          </div>
          <div class="gleam-model-dialog-filter-group">
            <div class="gleam-model-dialog-filter-label">${i18n.filterOutput || "输出类型:"}</div>
            <div class="gleam-model-dialog-filter-options" data-type="output">
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="text">文本</label>
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="image">图片</label>
              <label class="gleam-model-dialog-filter-option"><input type="checkbox" value="embeddings">嵌入</label>
            </div>
          </div>
        </div>
        <div class="gleam-model-dialog-list"></div>
      </div>
    `;

    this.searchInput = dialog.querySelector(".gleam-model-dialog-search-input") as HTMLInputElement;
    this.listContainer = dialog.querySelector(".gleam-model-dialog-list") as HTMLElement;

    // 关闭按钮事件
    const closeBtn = dialog.querySelector(".gleam-model-dialog-close") as HTMLButtonElement;
    closeBtn.addEventListener("click", () => this.hide());

    // 点击外部关闭
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        this.hide();
      }
    });

    // 搜索功能
    this.searchInput.addEventListener("input", (e) => {
      const keyword = (e.target as HTMLInputElement).value.toLowerCase();
      this.renderList(keyword);
    });

    // 过滤功能
    const filterOptions = dialog.querySelectorAll('.gleam-model-dialog-filter-option input[type="checkbox"]');
    filterOptions.forEach(checkbox => {
      checkbox.addEventListener("change", () => {
        this.updateFilterState();
        this.renderList(this.searchInput.value.toLowerCase());
      });
    });

    return dialog;
  }

  /**
   * 显示对话框
   */
  show(modelsInfo: ModelInfo[], currentValue: string): void {
    this.allModelsInfo = modelsInfo;
    this.currentValue = currentValue;
    this.searchInput.value = "";
    this.selectedInputTypes.clear();
    this.selectedOutputTypes.clear();
    this.updateFilterCheckboxes();
    this.renderList("");
    this.dialog.classList.add("show");
    this.searchInput.focus();
  }

  /**
   * 隐藏对话框
   */
  hide(): void {
    this.dialog.classList.remove("show");
  }

  /**
   * 更新过滤状态
   */
  private updateFilterState(): void {
    this.selectedInputTypes.clear();
    this.selectedOutputTypes.clear();

    const inputCheckboxes = this.dialog.querySelectorAll('.gleam-model-dialog-filter-options[data-type="input"] input[type="checkbox"]:checked');
    inputCheckboxes.forEach((cb: Element) => {
      const checkbox = cb as HTMLInputElement;
      this.selectedInputTypes.add(checkbox.value);
    });

    const outputCheckboxes = this.dialog.querySelectorAll('.gleam-model-dialog-filter-options[data-type="output"] input[type="checkbox"]:checked');
    outputCheckboxes.forEach((cb: Element) => {
      const checkbox = cb as HTMLInputElement;
      this.selectedOutputTypes.add(checkbox.value);
    });
  }

  /**
   * 更新过滤复选框状态
   */
  private updateFilterCheckboxes(): void {
    const inputCheckboxes = this.dialog.querySelectorAll('.gleam-model-dialog-filter-options[data-type="input"] input[type="checkbox"]');
    inputCheckboxes.forEach((cb: Element) => {
      const checkbox = cb as HTMLInputElement;
      checkbox.checked = this.selectedInputTypes.has(checkbox.value);
    });

    const outputCheckboxes = this.dialog.querySelectorAll('.gleam-model-dialog-filter-options[data-type="output"] input[type="checkbox"]');
    outputCheckboxes.forEach((cb: Element) => {
      const checkbox = cb as HTMLInputElement;
      checkbox.checked = this.selectedOutputTypes.has(checkbox.value);
    });
  }

  /**
   * 渲染模型列表
   */
  private renderList(keyword: string): void {
    let modelsInfo = this.allModelsInfo;
    
    // 文本搜索过滤
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      modelsInfo = modelsInfo.filter(model => 
        model.id.toLowerCase().includes(lowerKeyword) ||
        model.name.toLowerCase().includes(lowerKeyword)
      );
    }

    // 输入类型过滤
    if (this.selectedInputTypes.size > 0) {
      modelsInfo = modelsInfo.filter(model => {
        const inputMods = model.inputModalities || ["text"];
        return Array.from(this.selectedInputTypes).some(type => inputMods.includes(type));
      });
    }

    // 输出类型过滤
    if (this.selectedOutputTypes.size > 0) {
      modelsInfo = modelsInfo.filter(model => {
        const outputMods = model.outputModalities || ["text"];
        return Array.from(this.selectedOutputTypes).some(type => outputMods.includes(type));
      });
    }

    // 模态标签映射
    const modalityLabels: Record<string, string> = {
      text: "文本",
      image: "图片",
      file: "文件",
      audio: "音频",
      video: "视频",
      embeddings: "嵌入"
    };
    
    if (modelsInfo.length === 0) {
      this.listContainer.innerHTML = "<div style=\"padding: 20px; text-align: center; opacity: 0.7; color: var(--b3-theme-on-background);\">未找到模型</div>";
      return;
    }
    
    this.listContainer.innerHTML = modelsInfo.map(model => {
      const isSelected = model.id === this.currentValue;
      const inputMods = (model.inputModalities || ["text"]).map(m => modalityLabels[m] || m).join(", ");
      const outputMods = (model.outputModalities || ["text"]).map(m => modalityLabels[m] || m).join(", ");
      
      return `<div class="gleam-model-dialog-item ${isSelected ? "selected" : ""}" data-value="${MarkdownRenderer.escapeHtml(model.id)}">
        <div class="gleam-model-dialog-item-name">${MarkdownRenderer.escapeHtml(model.name || model.id)}</div>
        <div class="gleam-model-dialog-item-id">${MarkdownRenderer.escapeHtml(model.id)}</div>
        <div class="gleam-model-dialog-item-modalities">
          <span class="gleam-modality-badge input">输入: ${MarkdownRenderer.escapeHtml(inputMods)}</span>
          <span class="gleam-modality-badge output">输出: ${MarkdownRenderer.escapeHtml(outputMods)}</span>
        </div>
      </div>`;
    }).join("");
    
    // 添加点击事件
    this.listContainer.querySelectorAll(".gleam-model-dialog-item").forEach(item => {
      item.addEventListener("click", () => {
        const value = item.getAttribute("data-value") || "";
        this.onSelect(value);
        this.hide();
      });
    });
  }

  /**
   * 销毁对话框
   */
  destroy(): void {
    this.dialog.remove();
  }
}

