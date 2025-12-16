import { ImageHandler } from "../components/imageHandler";
import { AudioHandler } from "../components/audioHandler";
import { ChatUtils } from "../utils/chatUtils";
import { Logger } from "../../utils/logger";

/**
 * 附件处理处理器
 */
export class AttachmentHandler {
  private selectedImages: string[] = [];
  private selectedAudio: Array<{ name: string; data: string; format: string }> = [];
  private imagePreviewContainer: HTMLElement;
  private onError: (message: string) => void;

  constructor(
    imagePreviewContainer: HTMLElement,
    onError: (message: string) => void
  ) {
    this.imagePreviewContainer = imagePreviewContainer;
    this.onError = onError;
  }

  /**
   * 获取已选择的图片
   */
  getSelectedImages(): string[] {
    return [...this.selectedImages];
  }

  /**
   * 获取已选择的音频
   */
  getSelectedAudio(): Array<{ name: string; data: string; format: string }> {
    return [...this.selectedAudio];
  }

  /**
   * 清空附件
   */
  clearAttachments(): void {
    this.selectedImages = [];
    this.selectedAudio = [];
    this.updatePreview();
  }

  /**
   * 处理文件选择
   */
  async handleFileSelect(
    files: FileList,
    supportedInputTypes: string[]
  ): Promise<void> {
    const imageFiles: File[] = [];
    const audioFiles: File[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = ChatUtils.getFileTypeFromExtension(file.name);
      
      // 处理图片文件
      if (fileType === "image") {
        if (!supportedInputTypes.includes("image")) {
          this.onError("当前模型不支持图片类型的文件");
          continue;
        }
        imageFiles.push(file);
        continue;
      }
      
      // 处理音频文件
      if (fileType === "audio") {
        if (!supportedInputTypes.includes("audio")) {
          this.onError("当前模型不支持音频类型的文件");
          continue;
        }
        audioFiles.push(file);
        continue;
      }
      
      // 其他类型暂时不支持
      const typeName = ChatUtils.getFileTypeName(fileType);
      if (!supportedInputTypes.includes(fileType)) {
        this.onError(`当前模型不支持${typeName}类型的文件`);
      } else {
        this.onError(`${typeName}类型文件暂不支持，请等待后续更新`);
      }
    }

    // 处理图片文件
    if (imageFiles.length > 0) {
      const images = await ImageHandler.handleImageSelect(
        { target: { files: imageFiles } } as any,
        (msg) => this.onError(msg)
      );
      this.selectedImages.push(...images);
    }

    // 处理音频文件
    if (audioFiles.length > 0) {
      const audio = await AudioHandler.handleAudioSelect(
        audioFiles,
        (msg) => this.onError(msg)
      );
      this.selectedAudio.push(...audio);
    }

    // 更新预览
    this.updatePreview();
  }

  /**
   * 处理粘贴事件（支持粘贴图片）
   */
  async handlePaste(
    e: ClipboardEvent,
    supportedInputTypes: string[]
  ): Promise<boolean> {
    const clipboardData = e.clipboardData;
    if (!clipboardData) return false;

    // 检查是否有图片
    const items = clipboardData.items;
    if (!items) return false;

    const imageFiles: File[] = [];
    
    // 遍历剪贴板项目
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // 检查是否是图片类型
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    // 如果没有图片，允许默认粘贴行为（粘贴文本）
    if (imageFiles.length === 0) {
      return false;
    }

    // 如果有图片，阻止默认粘贴行为
    e.preventDefault();

    if (!supportedInputTypes.includes("image")) {
      this.onError("当前模型不支持图片类型的文件");
      return true;
    }

    // 处理图片文件
    try {
      const images = await ImageHandler.handleImageSelect(
        { target: { files: imageFiles } } as any,
        (msg) => this.onError(msg)
      );
      
      if (images.length > 0) {
        this.selectedImages.push(...images);
        this.updatePreview();
      }
    } catch (error: any) {
      Logger.error("[AttachmentHandler] 粘贴图片处理失败:", error);
      this.onError("粘贴图片失败");
    }

    return true;
  }

  /**
   * 更新附件预览（包括图片和音频）
   */
  updatePreview(): void {
    const hasAttachments = this.selectedImages.length > 0 || this.selectedAudio.length > 0;
    
    if (!hasAttachments) {
      this.imagePreviewContainer.innerHTML = "";
      this.imagePreviewContainer.classList.remove("show");
      return;
    }

    this.imagePreviewContainer.classList.add("show");
    let html = "";

    // 渲染图片
    if (this.selectedImages.length > 0) {
      html += this.selectedImages.map((image, index) => `
        <div class="gleam-image-preview-item">
          <img src="${ChatUtils.escapeHtml(image)}" alt="Preview ${index + 1}">
          <button class="gleam-image-preview-remove" data-type="image" data-index="${index}" title="删除">×</button>
        </div>
      `).join("");
    }

    // 渲染音频
    if (this.selectedAudio.length > 0) {
      html += this.selectedAudio.map((audio, index) => {
        // 为预览生成 data URL（包含前缀，用于 audio 元素播放）
        const audioDataUrl = `data:audio/${audio.format};base64,${audio.data}`;
        return `
        <div class="gleam-image-preview-item gleam-audio-preview-item">
          <audio controls src="${ChatUtils.escapeHtml(audioDataUrl)}" style="max-width: 200px; height: 32px;"></audio>
          <span class="gleam-audio-name">${ChatUtils.escapeHtml(audio.name)}</span>
          <button class="gleam-image-preview-remove" data-type="audio" data-index="${index}" title="删除">×</button>
        </div>
      `;
      }).join("");
    }

    this.imagePreviewContainer.innerHTML = html;

    // 添加删除按钮事件
    this.imagePreviewContainer.querySelectorAll(".gleam-image-preview-remove").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const element = e.target as HTMLElement;
        const type = element.getAttribute("data-type");
        const index = parseInt(element.getAttribute("data-index") || "0");
        if (type === "image") {
          this.selectedImages.splice(index, 1);
        } else if (type === "audio") {
          this.selectedAudio.splice(index, 1);
        }
        this.updatePreview();
      });
    });
  }
}

