import { Logger } from '../../utils/logger';

/**
 * 图片处理工具类
 */
export class ImageHandler {
  /**
   * 将文件转换为 base64
   */
  static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 处理图片选择事件
   */
  static async handleImageSelect(
    event: Event,
    onError: (message: string) => void
  ): Promise<string[]> {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return [];

    const images: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        onError('只能选择图片文件');
        continue;
      }

      try {
        const base64 = await this.fileToBase64(file);
        images.push(base64);
      } catch (error) {
        Logger.error('[ImageHandler] 图片转换失败:', error);
        onError('图片加载失败');
      }
    }

    return images;
  }

  /**
   * 更新图片预览
   */
  static updateImagePreview(
    container: HTMLElement,
    images: string[],
    onRemove: (index: number) => void
  ): void {
    if (images.length === 0) {
      container.innerHTML = '';
      container.classList.remove('show');
      return;
    }

    container.classList.add('show');
    container.innerHTML = images.map((image, index) => `
      <div class="gleam-image-preview-item">
        <img src="${this.escapeHtml(image)}" alt="Preview ${index + 1}">
        <button class="gleam-image-preview-remove" data-index="${index}" title="删除">×</button>
      </div>
    `).join('');

    // 添加删除按钮事件
    container.querySelectorAll('.gleam-image-preview-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index') || '0');
        onRemove(index);
      });
    });
  }

  /**
   * 转义 HTML 特殊字符
   */
  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

